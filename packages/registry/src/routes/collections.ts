/**
 * Collections API Routes
 * Handles collection CRUD operations and installations
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import type {
  Collection,
  CollectionCreateInput,
  CollectionUpdateInput,
  CollectionSearchQuery,
  CollectionInstallInput,
  CollectionInstallResult,
} from '../types/collection.js';

export async function collectionRoutes(server: FastifyInstance) {
  /**
   * GET /api/v1/collections
   * List collections with filters
   */
  server.get(
    '/',
    {
      schema: {
        querystring: {
          type: 'object',
          properties: {
            category: { type: 'string' },
            tag: { type: 'string' },
            framework: { type: 'string' },
            official: { type: 'boolean' },
            verified: { type: 'boolean' },
            scope: { type: 'string' },
            author: { type: 'string' },
            query: { type: 'string' },
            limit: { type: 'number', default: 20 },
            offset: { type: 'number', default: 0 },
            sortBy: {
              type: 'string',
              enum: ['downloads', 'stars', 'created', 'updated', 'name'],
              default: 'downloads',
            },
            sortOrder: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
          },
        },
      },
    },
    async (request, reply) => {
      const query = request.query as CollectionSearchQuery;

      try {
        // Build SQL query - use subquery to get latest version per collection
        let sql = `
          SELECT
            c.scope,
            c.id,
            c.name_slug,
            c.version,
            c.name,
            c.description,
            u.username as author,
            c.official,
            c.verified,
            c.category,
            c.tags,
            c.framework,
            c.downloads,
            c.stars,
            c.icon,
            c.created_at,
            c.updated_at,
            COALESCE(cp.package_count, 0) as package_count
          FROM collections c
          LEFT JOIN users u ON c.author_id = u.id
          LEFT JOIN (
            SELECT collection_id, COUNT(*) as package_count
            FROM collection_packages
            GROUP BY collection_id
          ) cp ON c.id = cp.collection_id
          WHERE 1=1
        `;

        const params: unknown[] = [];
        let paramIndex = 1;

        // Filters
        if (query.category) {
          sql += ` AND c.category = $${paramIndex++}`;
          params.push(query.category);
        }

        if (query.tag) {
          sql += ` AND $${paramIndex++} = ANY(c.tags)`;
          params.push(query.tag);
        }

        if (query.framework) {
          sql += ` AND c.framework = $${paramIndex++}`;
          params.push(query.framework);
        }

        if (query.official !== undefined) {
          sql += ` AND c.official = $${paramIndex++}`;
          params.push(query.official);
        }

        if (query.verified !== undefined) {
          sql += ` AND c.verified = $${paramIndex++}`;
          params.push(query.verified);
        }

        if (query.scope) {
          sql += ` AND c.scope = $${paramIndex++}`;
          params.push(query.scope);
        }

        if (query.author) {
          sql += ` AND u.username = $${paramIndex++}`;
          params.push(query.author);
        }

        // Full-text search with PostgreSQL tsvector and trigram similarity
        if (query.query) {
          sql += ` AND (
            to_tsvector('english', coalesce(c.name, '') || ' ' || coalesce(c.description, '') || ' ' || coalesce(c.name_slug, '')) @@ websearch_to_tsquery('english', $${paramIndex}) OR
            c.name ILIKE $${paramIndex + 1} OR
            c.description ILIKE $${paramIndex + 1} OR
            c.name_slug ILIKE $${paramIndex + 1} OR
            $${paramIndex + 2} = ANY(c.tags)
          )`;
          params.push(query.query, `%${query.query}%`, query.query);
          paramIndex += 3;
        }

        // Count total before pagination
        const countSql = `SELECT COUNT(*) FROM (${sql}) as count_query`;
        const countResult = await server.pg.query(countSql, params);
        const total = parseInt(countResult.rows[0].count);

        // Sorting
        const sortBy = query.sortBy || 'downloads';
        const sortOrder = query.sortOrder || 'desc';

        let orderByColumn = 'c.downloads';
        switch (sortBy) {
          case 'stars':
            orderByColumn = 'c.stars';
            break;
          case 'created':
            orderByColumn = 'c.created_at';
            break;
          case 'updated':
            orderByColumn = 'c.updated_at';
            break;
          case 'name':
            orderByColumn = 'c.name';
            break;
        }

        sql += ` ORDER BY ${orderByColumn} ${sortOrder.toUpperCase()}`;

        // Pagination
        const limit = query.limit || 20;
        const offset = query.offset || 0;
        sql += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
        params.push(limit, offset);

        const result = await server.pg.query(sql, params);

        return reply.send({
          collections: result.rows,
          total,
          page: Math.floor(offset / limit) + 1,
          perPage: limit,
          hasMore: offset + limit < total,
        });
      } catch (error) {
        server.log.error(error);
        return reply.code(500).send({
          error: 'Failed to list collections',
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }
  );

  /**
   * GET /api/v1/collections/:scope/:name_slug
   * Get collection details with packages
   */
  server.get(
    '/:scope/:name_slug',
    {
      schema: {
        params: {
          type: 'object',
          required: ['scope', 'name_slug'],
          properties: {
            scope: { type: 'string' },
            name_slug: { type: 'string' },
          },
        },
        querystring: {
          type: 'object',
          properties: {
            version: { type: 'string' },
          },
        },
      },
    },
    async (request, reply) => {
      const { scope, name_slug } = request.params as { scope: string; name_slug: string };
      const { version } = request.query as { version?: string };

      try {
        // Get collection
        let sql = `
          SELECT c.*
          FROM collections c
          WHERE c.scope = $1 AND c.name_slug = $2
        `;

        const params: unknown[] = [scope, name_slug];

        if (version) {
          sql += ` AND c.version = $3`;
          params.push(version);
        } else {
          sql += ` ORDER BY c.created_at DESC LIMIT 1`;
        }

        const result = await server.pg.query(sql, params);

        if (result.rows.length === 0) {
          return reply.code(404).send({
            error: 'Collection not found',
            scope,
            name_slug,
            version,
          });
        }

        const collection = result.rows[0];

        // Get packages
        const packagesResult = await server.pg.query(
          `
          SELECT
            cp.package_id,
            cp.package_version,
            cp.required,
            cp.reason,
            cp.install_order,
            cp.format_override,
            p.id as package_id_full,
            p.description as package_description,
            p.format as package_format,
            p.subtype as package_subtype,
            pv.version as latest_version
          FROM collection_packages cp
          JOIN packages p ON cp.package_id = p.id
          LEFT JOIN package_versions pv ON p.id = pv.package_id
          WHERE cp.collection_id = $1
          ORDER BY cp.install_order ASC, cp.package_id ASC
        `,
          [collection.id]
        );

        collection.packages = packagesResult.rows.map(row => ({
          packageId: row.package_id,
          version: row.package_version || row.latest_version,
          required: row.required,
          reason: row.reason,
          installOrder: row.install_order,
          formatOverride: row.format_override,
          package: {
            name: row.package_id_full,
            description: row.package_description,
            type: row.package_type,
          },
        }));

        return reply.send(collection);
      } catch (error) {
        server.log.error(error);
        return reply.code(500).send({
          error: 'Failed to get collection',
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }
  );

  /**
   * POST /api/v1/collections
   * Create new collection (requires authentication)
   */
  server.post(
    '/',
    {
      onRequest: [server.authenticate],
      schema: {
        body: {
          type: 'object',
          required: ['id', 'name', 'description', 'packages'],
          properties: {
            id: { type: 'string', pattern: '^[a-z0-9-]+$' },
            name: { type: 'string', minLength: 3 },
            description: { type: 'string', minLength: 10 },
            category: { type: 'string' },
            tags: { type: 'array', items: { type: 'string' } },
            framework: { type: 'string' },
            packages: {
              type: 'array',
              minItems: 1,
              items: {
                type: 'object',
                required: ['packageId'],
                properties: {
                  packageId: { type: 'string' },
                  version: { type: 'string' },
                  required: { type: 'boolean' },
                  reason: { type: 'string' },
                },
              },
            },
            icon: { type: 'string' },
            banner: { type: 'string' },
            readme: { type: 'string' },
            config: { type: 'object' },
          },
        },
      },
    },
    async (request, reply) => {
      const input = request.body as CollectionCreateInput;
      const user = request.user;

      try {
        // Check if collection name_slug already exists for this user
        const existing = await server.pg.query(
          `SELECT id FROM collections WHERE scope = $1 AND name_slug = $2`,
          [user.username, input.id]
        );

        if (existing.rows.length > 0) {
          return reply.code(409).send({
            error: 'Collection already exists',
            name_slug: input.id,
          });
        }

        // Validate all packages exist
        for (const pkg of input.packages) {
          const pkgResult = await server.pg.query(
            `SELECT id FROM packages WHERE name = $1`,
            [pkg.packageId]
          );

          if (pkgResult.rows.length === 0) {
            return reply.code(400).send({
              error: 'Package not found',
              packageId: pkg.packageId,
            });
          }
        }

        // Create collection
        const version = '1.0.0';
        const collectionResult = await server.pg.query(
          `
          INSERT INTO collections (
            scope, name_slug, version, name, description,
            author_id, category, tags, framework,
            icon, banner, readme, config
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          RETURNING *
        `,
          [
            user.username,
            input.id,
            version,
            input.name,
            input.description,
            user.user_id,
            input.category,
            input.tags || [],
            input.framework,
            input.icon,
            input.banner,
            input.readme,
            input.config ? JSON.stringify(input.config) : null,
          ]
        );

        const collection = collectionResult.rows[0];

        // Add packages
        for (let i = 0; i < input.packages.length; i++) {
          const pkg = input.packages[i];
          await server.pg.query(
            `
            INSERT INTO collection_packages (
              collection_id,
              package_id, package_version, required, reason, install_order
            ) VALUES ($1, $2, $3, $4, $5, $6)
          `,
            [
              collection.id,
              pkg.packageId,
              pkg.version,
              pkg.required !== false,
              pkg.reason,
              i,
            ]
          );
        }

        // Invalidate cache
        await server.redis.del(`collections:${user.username}:${input.id}`);

        return reply.code(201).send({
          ...collection,
          packages: input.packages,
        });
      } catch (error) {
        server.log.error(error);
        return reply.code(500).send({
          error: 'Failed to create collection',
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }
  );

  /**
   * POST /api/v1/collections/:scope/:name_slug/install
   * Track collection installation
   */
  server.post(
    '/:scope/:name_slug/install',
    {
      schema: {
        params: {
          type: 'object',
          required: ['scope', 'name_slug'],
          properties: {
            scope: { type: 'string' },
            name_slug: { type: 'string' },
          },
        },
        body: {
          type: 'object',
          properties: {
            version: { type: 'string' },
            format: { type: 'string' },
            skipOptional: { type: 'boolean' },
          },
        },
      },
    },
    async (request, reply) => {
      const { scope, name_slug } = request.params as { scope: string; name_slug: string };
      const input = request.body as CollectionInstallInput;
      const user = request.user;

      try {
        // Get collection
        const collectionResult = await server.pg.query(
          `
          SELECT * FROM collections
          WHERE scope = $1 AND name_slug = $2
          ${input.version ? 'AND version = $3' : ''}
          ORDER BY created_at DESC
          LIMIT 1
        `,
          input.version ? [scope, name_slug, input.version] : [scope, name_slug]
        );

        if (collectionResult.rows.length === 0) {
          return reply.code(404).send({
            error: 'Collection not found',
          });
        }

        const collection = collectionResult.rows[0];

        // Get packages with their names
        const packagesResult = await server.pg.query(
          `
          SELECT cp.*, p.name as package_name
          FROM collection_packages cp
          JOIN packages p ON p.id = cp.package_id
          WHERE cp.collection_id = $1
          ORDER BY cp.install_order ASC
        `,
          [collection.id]
        );

        let packages = packagesResult.rows;

        // Filter optional packages if requested
        if (input.skipOptional) {
          packages = packages.filter(pkg => pkg.required);
        }

        // Track installation
        await server.pg.query(
          `
          INSERT INTO collection_installs (
            collection_id,
            user_id, format
          ) VALUES ($1, $2, $3)
        `,
          [collection.id, user?.user_id || null, input.format]
        );

        const result: CollectionInstallResult = {
          collection,
          packagesToInstall: packages.map(pkg => ({
            packageId: pkg.package_name, // Use package name, not UUID
            version: pkg.package_version || 'latest',
            format: pkg.format_override || input.format || 'cursor',
            required: pkg.required,
          })),
          totalPackages: packagesResult.rows.length,
          requiredPackages: packagesResult.rows.filter(p => p.required).length,
          optionalPackages: packagesResult.rows.filter(p => !p.required).length,
        };

        return reply.send(result);
      } catch (error) {
        server.log.error(error);
        return reply.code(500).send({
          error: 'Failed to process collection installation',
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }
  );

  /**
   * POST /api/v1/collections/:scope/:name_slug/star
   * Star/unstar a collection
   */
  server.post(
    '/:scope/:name_slug/star',
    {
      onRequest: [server.authenticate],
      schema: {
        params: {
          type: 'object',
          required: ['scope', 'name_slug'],
          properties: {
            scope: { type: 'string' },
            name_slug: { type: 'string' },
          },
        },
        body: {
          type: 'object',
          properties: {
            starred: { type: 'boolean' },
          },
        },
      },
    },
    async (request, reply) => {
      const { scope, name_slug } = request.params as { scope: string; name_slug: string };
      const { starred } = request.body as { starred: boolean };
      const user = request.user;

      try {
        // Get collection ID first
        const collectionResult = await server.pg.query(
          `SELECT id FROM collections WHERE scope = $1 AND name_slug = $2 LIMIT 1`,
          [scope, name_slug]
        );

        if (collectionResult.rows.length === 0) {
          return reply.code(404).send({
            error: 'Collection not found',
          });
        }

        const collectionId = collectionResult.rows[0].id;

        if (starred) {
          // Add star
          await server.pg.query(
            `
            INSERT INTO collection_stars (collection_id, user_id)
            VALUES ($1, $2)
            ON CONFLICT DO NOTHING
          `,
            [collectionId, user.user_id]
          );
        } else {
          // Remove star
          await server.pg.query(
            `
            DELETE FROM collection_stars
            WHERE collection_id = $1 AND user_id = $2
          `,
            [collectionId, user.user_id]
          );
        }

        // Get updated star count
        const result = await server.pg.query(
          `SELECT stars FROM collections WHERE id = $1`,
          [collectionId]
        );

        return reply.send({
          success: true,
          starred,
          stars: result.rows[0]?.stars || 0,
        });
      } catch (error) {
        server.log.error(error);
        return reply.code(500).send({
          error: 'Failed to star collection',
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }
  );

  /**
   * GET /api/v1/collections/featured
   * Get featured collections
   */
  server.get('/featured', async (request, reply) => {
    try {
      const result = await server.pg.query(`
        SELECT
          c.scope,
          c.id,
          c.name_slug,
          c.version,
          c.name,
          c.description,
          u.username as author,
          c.official,
          c.verified,
          c.category,
          c.tags,
          c.framework,
          c.downloads,
          c.stars,
          c.icon,
          c.created_at,
          c.updated_at,
          COALESCE(cp.package_count, 0) as package_count
        FROM collections c
        LEFT JOIN users u ON c.author_id = u.id
        LEFT JOIN (
          SELECT collection_id, COUNT(*) as package_count
          FROM collection_packages
          GROUP BY collection_id
        ) cp ON c.id = cp.collection_id
        WHERE c.official = true AND c.verified = true
        ORDER BY c.stars DESC, c.downloads DESC
        LIMIT 20
      `);

      return reply.send({
        collections: result.rows,
        total: result.rows.length,
      });
    } catch (error) {
      server.log.error(error);
      return reply.code(500).send({
        error: 'Failed to get featured collections',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  });

  /**
   * GET /api/v1/collections/:scope/:name_slug/:version
   * Get collection details by name_slug and version
   */
  server.get('/:scope/:name_slug/:version', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { scope, name_slug, version } = request.params as {
        scope: string;
        name_slug: string;
        version: string;
      };

      // Get collection details
      const collectionResult = await server.pg.query(
        `SELECT
          c.scope,
          c.id,
          c.name_slug,
          c.version,
          c.name,
          c.description,
          u.username as author,
          c.official,
          c.verified,
          c.category,
          c.tags,
          c.framework,
          c.downloads,
          c.stars,
          c.icon,
          c.created_at,
          c.updated_at
        FROM collections c
        LEFT JOIN users u ON c.author_id = u.id
        WHERE c.scope = $1 AND c.name_slug = $2 AND c.version = $3`,
        [scope, name_slug, version]
      );

      if (collectionResult.rows.length === 0) {
        return reply.code(404).send({
          error: 'Collection not found',
        });
      }

      const collection = collectionResult.rows[0];

      // Get packages in this collection
      const packagesResult = await server.pg.query(
        `SELECT
          cp.package_id,
          cp.package_version,
          cp.required,
          cp.reason,
          cp.install_order,
          p.name as package_name,
          p.description,
          p.format,
          p.subtype,
          p.tags
        FROM collection_packages cp
        LEFT JOIN packages p ON cp.package_id = p.id
        WHERE cp.collection_id = $1
        ORDER BY cp.install_order ASC, cp.package_id ASC`,
        [collection.id]
      );

      // Map packages to camelCase for client consumption
      const packages = packagesResult.rows.map(row => ({
        packageId: row.package_id,
        version: row.package_version,
        required: row.required,
        reason: row.reason,
        installOrder: row.install_order,
        package: row.package_name ? {
          name: row.package_name,
          description: row.description,
          type: row.type,
          tags: row.tags,
        } : null,
      }));

      return reply.send({
        ...collection,
        packages,
        package_count: packagesResult.rows.length,
      });
    } catch (error) {
      server.log.error(error);
      return reply.code(500).send({
        error: 'Failed to get collection',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  });
}
