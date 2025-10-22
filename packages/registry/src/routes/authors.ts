/**
 * Public Author Profile Routes
 * View author profiles and their packages (no authentication required)
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

export default async function authorsRoutes(fastify: FastifyInstance) {
  /**
   * GET /api/v1/authors/:username
   * Get public author profile with their packages
   */
  fastify.get<{
    Params: { username: string };
    Querystring: { sort?: string; limit?: number };
  }>(
    '/:username',
    {
      schema: {
        tags: ['Authors'],
        description: 'Get public author profile',
        params: {
          type: 'object',
          properties: {
            username: { type: 'string' },
          },
          required: ['username'],
        },
        querystring: {
          type: 'object',
          properties: {
            sort: {
              type: 'string',
              enum: ['downloads', 'recent', 'name'],
              default: 'downloads',
            },
            limit: { type: 'number', default: 100, minimum: 1, maximum: 500 },
          },
        },
      },
    },
    async (request, reply) => {
      const { username } = request.params;
      const { sort = 'downloads', limit = 100 } = request.query;

      try {
        // Get user info
        const userResult = await fastify.pg.query(
          `SELECT id, username, verified_author, created_at, github_username
           FROM users
           WHERE LOWER(username) = LOWER($1)`,
          [username]
        );

        if (userResult.rows.length === 0) {
          return reply.code(404).send({ error: 'Author not found' });
        }

        const user = userResult.rows[0];

        // Determine sort order
        const sortMap: Record<string, string> = {
          downloads: 'total_downloads DESC',
          recent: 'created_at DESC',
          name: 'id ASC',
        };
        const orderBy = sortMap[sort] || sortMap.downloads;

        // Get author's public packages with stats
        const packagesResult = await fastify.pg.query(
          `SELECT
             id,
             name,
             description,
             type,
             total_downloads,
             weekly_downloads,
             monthly_downloads,
             rating_average,
             rating_count,
             created_at,
             updated_at,
             tags
           FROM packages
           WHERE author_id = $1 AND visibility = 'public'
           ORDER BY ${orderBy}
           LIMIT $2`,
          [user.id, limit]
        );

        // Calculate stats
        const stats = packagesResult.rows.reduce(
          (acc, pkg) => ({
            total_packages: acc.total_packages + 1,
            total_downloads: acc.total_downloads + (pkg.total_downloads || 0),
            total_ratings: acc.total_ratings + (pkg.rating_count || 0),
            avg_rating:
              acc.total_ratings + (pkg.rating_count || 0) > 0
                ? (acc.avg_rating * acc.total_ratings +
                    (pkg.rating_average || 0) * (pkg.rating_count || 0)) /
                  (acc.total_ratings + (pkg.rating_count || 0))
                : 0,
          }),
          {
            total_packages: 0,
            total_downloads: 0,
            total_ratings: 0,
            avg_rating: 0,
          }
        );

        return reply.send({
          author: {
            username: user.username,
            verified: user.verified_author || false,
            github_username: user.github_username,
            joined: user.created_at,
            has_claimed_account: Boolean(user.github_username),
          },
          stats: {
            total_packages: stats.total_packages,
            total_downloads: stats.total_downloads,
            average_rating: stats.avg_rating ? parseFloat(stats.avg_rating.toFixed(2)) : null,
            total_ratings: stats.total_ratings,
          },
          packages: packagesResult.rows.map(pkg => ({
            id: pkg.id,
            name: pkg.name,
            description: pkg.description,
            type: pkg.type,
            total_downloads: pkg.total_downloads || 0,
            weekly_downloads: pkg.weekly_downloads || 0,
            monthly_downloads: pkg.monthly_downloads || 0,
            rating_average: pkg.rating_average ? parseFloat(pkg.rating_average) : null,
            rating_count: pkg.rating_count || 0,
            created_at: pkg.created_at,
            updated_at: pkg.updated_at,
            tags: pkg.tags || [],
          })),
          total: packagesResult.rows.length,
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({
          error: 'Internal Server Error',
          message: 'Failed to fetch author profile',
        });
      }
    }
  );

  /**
   * GET /api/v1/authors/:username/unclaimed
   * Get unclaimed packages for an author (no auth required)
   */
  fastify.get<{
    Params: { username: string };
  }>(
    '/:username/unclaimed',
    {
      schema: {
        tags: ['Authors'],
        description: 'Get unclaimed packages for an author',
        params: {
          type: 'object',
          properties: {
            username: { type: 'string' },
          },
          required: ['username'],
        },
      },
    },
    async (request, reply) => {
      const { username } = request.params;

      try {
        // Get unclaimed packages by author name
        const result = await fastify.pg.query(
          `SELECT
             id,
             name,
             description,
             type,
             total_downloads,
             created_at,
             tags
           FROM packages
           WHERE (name LIKE $1 || '/%' OR name LIKE '@' || $1 || '/%')
             AND author_id IS NULL
             AND visibility = 'public'
           ORDER BY total_downloads DESC`,
          [username]
        );

        return reply.send({
          author_name: username,
          unclaimed_packages: result.rows.map(pkg => ({
            id: pkg.id,
            name: pkg.name,
            description: pkg.description,
            type: pkg.type,
            total_downloads: pkg.total_downloads || 0,
            created_at: pkg.created_at,
            tags: pkg.tags || [],
          })),
          total: result.rows.length,
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({
          error: 'Internal Server Error',
          message: 'Failed to fetch unclaimed packages',
        });
      }
    }
  );

  fastify.log.info('✅ Author profile routes registered');
}
