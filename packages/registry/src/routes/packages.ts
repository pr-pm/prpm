/**
 * Package management routes
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { query, queryOne } from '../db/index.js';
import { cacheGet, cacheSet, cacheDelete, cacheDeletePattern } from '../cache/redis.js';
import { Package, PackageVersion, PackageInfo } from '../types.js';
import type {
  ListPackagesQuery,
  PackageParams,
  PackageVersionParams,
  TrendingQuery,
  ResolveQuery,
} from '../types/requests.js';

export async function packageRoutes(server: FastifyInstance) {
  // List packages with pagination
  server.get('/', {
    schema: {
      tags: ['packages'],
      description: 'List all packages with pagination and filtering',
      querystring: {
        type: 'object',
        properties: {
          search: { type: 'string' },
          type: { type: 'string', enum: ['cursor', 'claude', 'continue', 'windsurf', 'generic'] },
          category: { type: 'string' },
          featured: { type: 'boolean' },
          verified: { type: 'boolean' },
          sort: { type: 'string', enum: ['downloads', 'created', 'updated', 'quality', 'rating'], default: 'downloads' },
          limit: { type: 'number', default: 20, minimum: 1, maximum: 100 },
          offset: { type: 'number', default: 0, minimum: 0 },
        },
      },
    },
  }, async (request: FastifyRequest<{ Querystring: ListPackagesQuery }>, reply: FastifyReply) => {
    const { search, type, category, featured, verified, sort = 'downloads', limit = 20, offset = 0 } = request.query;

    // Build cache key
    const cacheKey = `packages:list:${JSON.stringify(request.query)}`;

    // Check cache
    const cached = await cacheGet(server, cacheKey);
    if (cached) {
      return cached;
    }

    // Build WHERE clause
    const conditions: string[] = ["visibility = 'public'"];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (type) {
      conditions.push(`type = $${paramIndex++}`);
      params.push(type);
    }

    if (category) {
      conditions.push(`category = $${paramIndex++}`);
      params.push(category);
    }

    if (featured !== undefined) {
      conditions.push(`featured = $${paramIndex++}`);
      params.push(featured);
    }

    if (verified !== undefined) {
      conditions.push(`verified = $${paramIndex++}`);
      params.push(verified);
    }

    if (search) {
      conditions.push(`(
        to_tsvector('english', coalesce(display_name, '') || ' ' || coalesce(description, '')) @@ websearch_to_tsquery('english', $${paramIndex}) OR
        display_name ILIKE $${paramIndex + 1} OR
        $${paramIndex + 2} = ANY(tags)
      )`);
      params.push(search, `%${search}%`, search.toLowerCase());
      paramIndex += 3;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Build ORDER BY clause
    let orderBy = 'total_downloads DESC';
    switch (sort) {
      case 'created':
        orderBy = 'created_at DESC';
        break;
      case 'updated':
        orderBy = 'updated_at DESC';
        break;
      case 'quality':
        orderBy = 'quality_score DESC NULLS LAST';
        break;
      case 'rating':
        orderBy = 'rating_average DESC NULLS LAST';
        break;
    }

    // Get total count
    const countResult = await queryOne<{ count: string }>(
      server,
      `SELECT COUNT(*) as count FROM packages ${whereClause}`,
      params
    );
    const total = parseInt(countResult?.count || '0', 10);

    // Get packages
    const result = await query<Package>(
      server,
      `SELECT * FROM packages
       ${whereClause}
       ORDER BY ${orderBy}
       LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      [...params, limit, offset]
    );

    const response = {
      packages: result.rows,
      total,
      offset,
      limit,
    };

    // Cache for 5 minutes
    await cacheSet(server, cacheKey, response, 300);

    return response;
  });

  // Get package by ID
  server.get('/:packageId', {
    schema: {
      tags: ['packages'],
      description: 'Get package details by ID',
      params: {
        type: 'object',
        properties: {
          packageId: { type: 'string' },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { packageId } = request.params as { packageId: string };

    // Check cache
    const cacheKey = `package:${packageId}`;
    const cached = await cacheGet<PackageInfo>(server, cacheKey);
    if (cached) {
      return cached;
    }

    // Get package
    const pkg = await queryOne<Package>(
      server,
      `SELECT * FROM packages WHERE id = $1 AND visibility = 'public'`,
      [packageId]
    );

    if (!pkg) {
      return reply.status(404).send({ error: 'Package not found' });
    }

    // Get versions
    const versionsResult = await query<PackageVersion>(
      server,
      `SELECT * FROM package_versions
       WHERE package_id = $1
       ORDER BY published_at DESC`,
      [packageId]
    );

    const packageInfo: PackageInfo = {
      ...pkg,
      versions: versionsResult.rows,
      latest_version: versionsResult.rows[0],
    };

    // Cache for 5 minutes
    await cacheSet(server, cacheKey, packageInfo, 300);

    return packageInfo;
  });

  // Get specific package version
  server.get('/:packageId/:version', {
    schema: {
      tags: ['packages'],
      description: 'Get specific package version',
      params: {
        type: 'object',
        properties: {
          packageId: { type: 'string' },
          version: { type: 'string' },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { packageId, version } = request.params as { packageId: string; version: string };

    // Check cache
    const cacheKey = `package:${packageId}:${version}`;
    const cached = await cacheGet<PackageVersion>(server, cacheKey);
    if (cached) {
      return cached;
    }

    const pkgVersion = await queryOne<PackageVersion>(
      server,
      `SELECT pv.* FROM package_versions pv
       JOIN packages p ON p.id = pv.package_id
       WHERE pv.package_id = $1 AND pv.version = $2 AND p.visibility = 'public'`,
      [packageId, version]
    );

    if (!pkgVersion) {
      return reply.status(404).send({ error: 'Package version not found' });
    }

    // Cache for 1 hour (versions are immutable)
    await cacheSet(server, cacheKey, pkgVersion, 3600);

    return pkgVersion;
  });

  // Publish package (authenticated)
  server.post('/', {
    onRequest: [server.authenticate],
    schema: {
      tags: ['packages'],
      description: 'Publish a new package or version',
      body: {
        type: 'object',
        required: ['manifest', 'tarball'],
        properties: {
          manifest: { type: 'object' },
          tarball: { type: 'string' },
          readme: { type: 'string' },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.user.user_id;
    const { manifest, tarball, readme } = request.body as { manifest: any; tarball: string; readme?: string };

    // TODO: Implement full package publishing logic
    // 1. Validate manifest
    // 2. Check permissions
    // 3. Upload tarball to S3
    // 4. Create/update package and version records
    // 5. Invalidate caches
    // 6. Index in search engine

    return reply.status(501).send({ error: 'Publishing not yet implemented' });
  });

  // Unpublish version (authenticated)
  server.delete('/:packageId/:version', {
    onRequest: [server.authenticate],
    schema: {
      tags: ['packages'],
      description: 'Unpublish a package version',
      params: {
        type: 'object',
        properties: {
          packageId: { type: 'string' },
          version: { type: 'string' },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.user.user_id;
    const { packageId, version } = request.params as { packageId: string; version: string };

    // Check ownership
    const pkg = await queryOne<Package>(
      server,
      'SELECT * FROM packages WHERE id = $1',
      [packageId]
    );

    if (!pkg) {
      return reply.status(404).send({ error: 'Package not found' });
    }

    if (pkg.author_id !== userId && !request.user.is_admin) {
      return reply.status(403).send({ error: 'Forbidden' });
    }

    // Delete version
    const result = await query(
      server,
      'DELETE FROM package_versions WHERE package_id = $1 AND version = $2',
      [packageId, version]
    );

    if (result.rowCount === 0) {
      return reply.status(404).send({ error: 'Version not found' });
    }

    // Invalidate caches
    await cacheDelete(server, `package:${packageId}`);
    await cacheDelete(server, `package:${packageId}:${version}`);
    await cacheDeletePattern(server, `packages:list:*`);

    return { success: true, message: 'Version unpublished' };
  });

  // Get package download stats
  server.get('/:packageId/stats', {
    schema: {
      tags: ['packages'],
      description: 'Get package download statistics',
      params: {
        type: 'object',
        properties: {
          packageId: { type: 'string' },
        },
      },
      querystring: {
        type: 'object',
        properties: {
          days: { type: 'number', default: 30, minimum: 1, maximum: 365 },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { packageId } = request.params as { packageId: string };
    const { days = 30 } = request.query as { days?: number };

    const result = await query(
      server,
      `SELECT date, SUM(downloads) as downloads
       FROM package_stats
       WHERE package_id = $1 AND date >= CURRENT_DATE - INTERVAL '${days} days'
       GROUP BY date
       ORDER BY date ASC`,
      [packageId]
    );

    return { stats: result.rows };
  });

  // Get trending packages
  server.get('/trending', {
    schema: {
      tags: ['packages'],
      description: 'Get trending packages based on recent download growth',
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'number', default: 20, minimum: 1, maximum: 100 },
          days: { type: 'number', default: 7, minimum: 1, maximum: 30 },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { limit = 20, days = 7 } = request.query as {
      limit?: number;
      days?: number;
    };

    const cacheKey = `packages:trending:${limit}:${days}`;
    const cached = await cacheGet(server, cacheKey);
    if (cached) {
      return cached;
    }

    // Calculate trending score based on recent downloads vs historical average
    const result = await query<Package>(
      server,
      `SELECT p.*,
        p.downloads_last_7_days as recent_downloads,
        p.trending_score
       FROM packages p
       WHERE p.visibility = 'public'
         AND p.downloads_last_7_days > 0
       ORDER BY p.trending_score DESC, p.downloads_last_7_days DESC
       LIMIT $1`,
      [limit]
    );

    const response = {
      packages: result.rows,
      total: result.rows.length,
      period: `${days} days`,
    };

    await cacheSet(server, cacheKey, response, 300); // Cache for 5 minutes
    return response;
  });

  // Get popular packages
  server.get('/popular', {
    schema: {
      tags: ['packages'],
      description: 'Get most popular packages by total downloads',
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'number', default: 20, minimum: 1, maximum: 100 },
          type: { type: 'string', enum: ['cursor', 'claude', 'continue', 'windsurf', 'generic'] },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { limit = 20, type } = request.query as {
      limit?: number;
      type?: string;
    };

    const cacheKey = `packages:popular:${limit}:${type || 'all'}`;
    const cached = await cacheGet(server, cacheKey);
    if (cached) {
      return cached;
    }

    const conditions: string[] = ["visibility = 'public'"];
    const params: unknown[] = [limit];
    let paramIndex = 2;

    if (type) {
      conditions.push(`type = $${paramIndex++}`);
      params.push(type);
    }

    const whereClause = conditions.join(' AND ');

    const result = await query<Package>(
      server,
      `SELECT p.*,
        p.total_downloads,
        p.weekly_downloads,
        p.install_count
       FROM packages p
       WHERE ${whereClause}
       ORDER BY p.total_downloads DESC, p.install_count DESC
       LIMIT $1`,
      params
    );

    const response = {
      packages: result.rows,
      total: result.rows.length,
    };

    await cacheSet(server, cacheKey, response, 600); // Cache for 10 minutes
    return response;
  });

  // Get package versions list
  server.get('/:id/versions', {
    schema: {
      tags: ['packages'],
      description: 'Get all available versions for a package',
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
        required: ['id'],
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    const cacheKey = `package:${id}:versions`;
    const cached = await cacheGet(server, cacheKey);
    if (cached) {
      return cached;
    }

    const result = await query<{ version: string; published_at: string; is_prerelease: boolean }>(
      server,
      `SELECT version, published_at, is_prerelease
       FROM package_versions
       WHERE package_id = $1
       ORDER BY published_at DESC`,
      [id]
    );

    if (result.rows.length === 0) {
      return reply.code(404).send({ error: 'Package not found' });
    }

    const response = {
      package_id: id,
      versions: result.rows,
      total: result.rows.length,
    };

    await cacheSet(server, cacheKey, response, 300); // Cache for 5 minutes
    return response;
  });

  // Get package dependencies
  server.get('/:id/:version/dependencies', {
    schema: {
      tags: ['packages'],
      description: 'Get dependencies for a specific package version',
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          version: { type: 'string' },
        },
        required: ['id', 'version'],
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id, version } = request.params as {
      id: string;
      version: string;
    };

    const cacheKey = `package:${id}:${version}:deps`;
    const cached = await cacheGet(server, cacheKey);
    if (cached) {
      return cached;
    }

    const result = await queryOne<{
      dependencies: Record<string, string> | null;
      peer_dependencies: Record<string, string> | null;
    }>(
      server,
      `SELECT dependencies, peer_dependencies
       FROM package_versions
       WHERE package_id = $1 AND version = $2`,
      [id, version]
    );

    if (!result) {
      return reply.code(404).send({ error: 'Package version not found' });
    }

    const response = {
      package_id: id,
      version,
      dependencies: result.dependencies || {},
      peerDependencies: result.peer_dependencies || {},
    };

    await cacheSet(server, cacheKey, response, 600); // Cache for 10 minutes
    return response;
  });

  // Resolve dependency tree
  server.get('/:id/resolve', {
    schema: {
      tags: ['packages'],
      description: 'Resolve complete dependency tree for a package',
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
        required: ['id'],
      },
      querystring: {
        type: 'object',
        properties: {
          version: { type: 'string' },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const { version } = request.query as { version?: string };

    try {
      const resolved = await resolveDependencyTree(server, id, version);
      return {
        package_id: id,
        version: version || 'latest',
        resolved: resolved.resolved,
        tree: resolved.tree,
      };
    } catch (error: any) {
      return reply.code(500).send({
        error: 'Failed to resolve dependencies',
        message: error.message,
      });
    }
  });
}

/**
 * Resolve dependency tree recursively
 */
interface DependencyTreeNode {
  version: string;
  dependencies: Record<string, string>;
  peerDependencies: Record<string, string>;
}

async function resolveDependencyTree(
  server: FastifyInstance,
  packageId: string,
  version?: string
): Promise<{
  resolved: Record<string, string>;
  tree: Record<string, DependencyTreeNode>;
}> {
  const resolved: Record<string, string> = {};
  const tree: Record<string, DependencyTreeNode> = {};

  async function resolve(pkgId: string, ver?: string, depth: number = 0): Promise<void> {
    // Prevent circular dependencies
    if (depth > 10) {
      throw new Error(`Circular dependency detected: ${pkgId}`);
    }

    // Get package version info
    let actualVersion = ver;
    if (!actualVersion || actualVersion === 'latest') {
      const pkgResult = await queryOne<{ latest_version: string }>(
        server,
        `SELECT (SELECT version FROM package_versions WHERE package_id = p.id ORDER BY published_at DESC LIMIT 1) as latest_version
         FROM packages p
         WHERE id = $1`,
        [pkgId]
      );

      if (!pkgResult || !pkgResult.latest_version) {
        throw new Error(`Package not found: ${pkgId}`);
      }

      actualVersion = pkgResult.latest_version;
    }

    // Check if already resolved
    if (resolved[pkgId] && resolved[pkgId] === actualVersion) {
      return;
    }

    // Mark as resolved
    resolved[pkgId] = actualVersion;

    // Get dependencies
    const versionResult = await queryOne<{
      dependencies: Record<string, string> | null;
      peer_dependencies: Record<string, string> | null;
    }>(
      server,
      `SELECT dependencies, peer_dependencies
       FROM package_versions
       WHERE package_id = $1 AND version = $2`,
      [pkgId, actualVersion]
    );

    if (!versionResult) {
      throw new Error(`Version not found: ${pkgId}@${actualVersion}`);
    }

    const deps = versionResult.dependencies || {};
    const peerDeps = versionResult.peer_dependencies || {};

    // Add to tree
    tree[pkgId] = {
      version: actualVersion,
      dependencies: deps,
      peerDependencies: peerDeps,
    };

    // Resolve dependencies recursively
    for (const [depId, depVersion] of Object.entries(deps)) {
      await resolve(depId, depVersion as string, depth + 1);
    }
  }

  await resolve(packageId, version);

  return { resolved, tree };
}
