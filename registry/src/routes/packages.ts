/**
 * Package management routes
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { query, queryOne } from '../db/index.js';
import { cacheGet, cacheSet, cacheDelete, cacheDeletePattern } from '../cache/redis.js';
import { Package, PackageVersion, PackageInfo } from '../types.js';

export async function packageRoutes(server: FastifyInstance) {
  // List packages with pagination
  server.get('/', {
    schema: {
      tags: ['packages'],
      description: 'List all packages with pagination and filtering',
      querystring: {
        type: 'object',
        properties: {
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
  }, async (request: any, reply) => {
    const { type, category, featured, verified, sort = 'downloads', limit = 20, offset = 0 } = request.query;

    // Build cache key
    const cacheKey = `packages:list:${JSON.stringify(request.query)}`;

    // Check cache
    const cached = await cacheGet<any>(server, cacheKey);
    if (cached) {
      return cached;
    }

    // Build WHERE clause
    const conditions: string[] = ["visibility = 'public'"];
    const params: any[] = [];
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
  }, async (request: any, reply) => {
    const { packageId } = request.params;

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
  }, async (request: any, reply) => {
    const { packageId, version } = request.params;

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
  }, async (request: any, reply) => {
    const userId = request.user.user_id;
    const { manifest, tarball, readme } = request.body;

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
  }, async (request: any, reply) => {
    const userId = request.user.user_id;
    const { packageId, version } = request.params;

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
  }, async (request: any, reply) => {
    const { packageId } = request.params;
    const { days = 30 } = request.query;

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
}
