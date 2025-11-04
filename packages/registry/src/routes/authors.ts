/**
 * Public Author Profile Routes
 * View author profiles and their packages (no authentication required)
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { optionalAuth } from '../middleware/auth.js';

export default async function authorsRoutes(fastify: FastifyInstance) {
  /**
   * GET /api/v1/authors/:username
   * Get public author profile with their packages
   */
  fastify.get<{
    Params: { username: string };
    Querystring: { sort?: string; limit?: number; offset?: number };
  }>(
    '/:username',
    {
      preHandler: [optionalAuth], // Allow both authenticated and unauthenticated requests
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
            offset: { type: 'number', default: 0, minimum: 0 },
          },
        },
      },
    },
    async (request, reply) => {
      const { username } = request.params;
      const { sort = 'downloads', limit = 100, offset = 0 } = request.query;

      try {
        // Get user info
        const userResult = await fastify.pg.query(
          `SELECT id, username, verified_author, created_at, github_username, avatar_url, website, prpm_plus_status
           FROM users
           WHERE LOWER(username) = LOWER($1)`,
          [username]
        );

        if (userResult.rows.length === 0) {
          return reply.code(404).send({ error: 'Author not found' });
        }

        const user = userResult.rows[0];

        // Check if logged-in user is viewing their own profile
        const loggedInUserId = request.user?.user_id;
        const isOwnProfile = loggedInUserId === user.id;

        // Determine sort order
        const sortMap: Record<string, string> = {
          downloads: 'total_downloads DESC',
          recent: 'created_at DESC',
          name: 'id ASC',
        };
        const orderBy = sortMap[sort] || sortMap.downloads;

        // Build visibility filter based on whether user is viewing their own profile
        const visibilityFilter = isOwnProfile
          ? `visibility IN ('public', 'private')`  // Show all packages if viewing own profile
          : `visibility = 'public'`;                // Show only public packages otherwise

        // Get total stats for ALL packages (not limited)
        const statsResult = await fastify.pg.query(
          `SELECT
             COUNT(*) as total_packages,
             SUM(total_downloads) as total_downloads,
             SUM(rating_count) as total_ratings,
             SUM(rating_average * rating_count) as weighted_rating_sum
           FROM packages
           WHERE author_id = $1 AND ${visibilityFilter}`,
          [user.id]
        );

        const statsRow = statsResult.rows[0];
        const stats = {
          total_packages: parseInt(statsRow.total_packages) || 0,
          total_downloads: parseInt(statsRow.total_downloads) || 0,
          total_ratings: parseInt(statsRow.total_ratings) || 0,
          avg_rating: statsRow.total_ratings > 0
            ? parseFloat(statsRow.weighted_rating_sum) / parseFloat(statsRow.total_ratings)
            : 0,
        };

        // Get author's packages (limited for display) - include visibility
        const packagesResult = await fastify.pg.query(
          `SELECT
             id,
             name,
             description,
             format,
             license,
             license_url,
             subtype,
             visibility,
             total_downloads,
             weekly_downloads,
             monthly_downloads,
             rating_average,
             rating_count,
             snippet,
             created_at,
             updated_at,
             tags
           FROM packages
           WHERE author_id = $1 AND ${visibilityFilter}
           ORDER BY ${orderBy}
           LIMIT $2 OFFSET $3`,
          [user.id, limit, offset]
        );

        return reply.send({
          author: {
            username: user.username,
            verified: user.verified_author || false,
            github_username: user.github_username,
            joined: user.created_at,
            has_claimed_account: Boolean(user.github_username),
            avatar_url: user.avatar_url,
            prpm_plus_status: user.prpm_plus_status
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
            format: pkg.format,
            license: pkg.license,
            license_url: pkg.license_url,
            subtype: pkg.subtype,
            visibility: pkg.visibility,
            snippet: pkg.snippet,
            total_downloads: pkg.total_downloads || 0,
            weekly_downloads: pkg.weekly_downloads || 0,
            monthly_downloads: pkg.monthly_downloads || 0,
            rating_average: pkg.rating_average ? parseFloat(pkg.rating_average) : null,
            rating_count: pkg.rating_count || 0,
            created_at: pkg.created_at,
            updated_at: pkg.updated_at,
            tags: pkg.tags || [],
          })),
          pagination: {
            showing: packagesResult.rows.length,
            total: stats.total_packages,
            limit: limit,
            offset: offset,
            hasMore: offset + limit < stats.total_packages,
          },
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
        // Get unclaimed packages by author name (case-insensitive)
        const result = await fastify.pg.query(
          `SELECT
             id,
             name,
             description,
             format,
             subtype,
             total_downloads,
             created_at,
             tags
           FROM packages
           WHERE (LOWER(name) LIKE LOWER($1) || '/%' OR LOWER(name) LIKE '@' || LOWER($1) || '/%')
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
            format: pkg.format,
            subtype: pkg.subtype,
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
