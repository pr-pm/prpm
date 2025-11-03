/**
 * Author Analytics Routes
 * Dashboard for package authors to see their stats
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';

const TimeRangeSchema = z.enum(['today', 'week', 'month', 'year', 'all']);
type TimeRange = z.infer<typeof TimeRangeSchema>;

export default async function authorAnalyticsRoutes(fastify: FastifyInstance) {
  /**
   * GET /api/v1/author/dashboard
   * Get overview of author's packages and stats
   */
  fastify.get(
    '/dashboard',
    {
      preHandler: fastify.authenticate,
      schema: {
        tags: ['Author Analytics'],
        description: 'Get author dashboard overview',
        response: {
          200: {
            type: 'object',
            properties: {
              summary: {
                type: 'object',
                properties: {
                  total_packages: { type: 'number' },
                  public_packages: { type: 'number' },
                  private_packages: { type: 'number' },
                  total_downloads: { type: 'number' },
                  downloads_today: { type: 'number' },
                  downloads_week: { type: 'number' },
                  downloads_month: { type: 'number' },
                  total_views: { type: 'number' },
                  views_week: { type: 'number' },
                  average_rating: { type: 'number' },
                  total_ratings: { type: 'number' },
                },
              },
              most_popular: {
                type: 'object',
                properties: {
                  package_id: { type: 'string' },
                  package_name: { type: 'string' },
                  downloads: { type: 'number' },
                },
              },
              recent_packages: { type: 'array' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = request.user?.user_id;

      if (!userId) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }

      try {
        // Get or create author stats
        await fastify.pg.query(
          `INSERT INTO author_stats (user_id)
           VALUES ($1)
           ON CONFLICT (user_id) DO NOTHING`,
          [userId]
        );

        // Get author stats
        const statsResult = await fastify.pg.query(
          `SELECT * FROM author_stats WHERE user_id = $1`,
          [userId]
        );

        const stats = statsResult.rows[0] || {};

        // Get most popular package details
        let mostPopular = null;
        if (stats.most_popular_package_id) {
          const pkgResult = await fastify.pg.query(
            `SELECT id, total_downloads
             FROM packages
             WHERE id = $1`,
            [stats.most_popular_package_id]
          );

          if (pkgResult.rows.length > 0) {
            const pkg = pkgResult.rows[0];
            mostPopular = {
              package_id: pkg.id,
              package_name: pkg.id,
              downloads: pkg.total_downloads,
            };
          }
        }

        // Get recent packages (last 5)
        const recentResult = await fastify.pg.query(
          `SELECT id, name, format, subtype, total_downloads, created_at
           FROM packages
           WHERE author_id = $1
           ORDER BY created_at DESC
           LIMIT 5`,
          [userId]
        );

        return reply.send({
          summary: {
            total_packages: stats.total_packages || 0,
            public_packages: stats.public_packages || 0,
            private_packages: stats.private_packages || 0,
            total_downloads: stats.total_downloads || 0,
            downloads_today: stats.downloads_today || 0,
            downloads_week: stats.downloads_week || 0,
            downloads_month: stats.downloads_month || 0,
            total_views: stats.total_views || 0,
            views_week: stats.views_week || 0,
            average_rating: stats.average_rating ? parseFloat(stats.average_rating) : null,
            total_ratings: stats.total_ratings || 0,
          },
          most_popular: mostPopular,
          recent_packages: recentResult.rows,
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({
          error: 'Internal Server Error',
          message: 'Failed to fetch dashboard data',
        });
      }
    }
  );

  /**
   * GET /api/v1/author/packages
   * Get all packages by author with their stats
   */
  fastify.get(
    '/packages',
    {
      preHandler: fastify.authenticate,
      schema: {
        tags: ['Author Analytics'],
        description: 'Get all packages by author with stats',
        querystring: {
          type: 'object',
          properties: {
            sort: {
              type: 'string',
              enum: ['downloads', 'views', 'rating', 'created', 'updated'],
              default: 'downloads',
            },
            order: {
              type: 'string',
              enum: ['asc', 'desc'],
              default: 'desc',
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = request.user?.user_id;
      const { sort = 'downloads', order = 'desc' } = request.query as { sort?: string; order?: string };

      if (!userId) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }

      try {
        const sortMap: Record<string, string> = {
          downloads: 'total_downloads',
          views: 'total_downloads', // Can add views column later
          rating: 'rating_average',
          created: 'created_at',
          updated: 'updated_at',
        };
        const sortColumn = sortMap[sort] || 'total_downloads';
        const sortOrder = order === 'asc' ? 'ASC' : 'DESC';

        // Build the query with safe string interpolation for column names
        const query = `
          SELECT
             id,
             name,
             description,
             format,
             subtype,
             visibility,
             total_downloads,
             weekly_downloads,
             monthly_downloads,
             rating_average,
             rating_count,
             created_at,
             updated_at,
             last_published_at
           FROM packages
           WHERE author_id = $1
           ORDER BY ${sortColumn} ${sortOrder}`;

        const result = await fastify.pg.query(query, [userId]);

        return reply.send({
          packages: result.rows,
          total: result.rows.length,
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({
          error: 'Internal Server Error',
          message: 'Failed to fetch packages',
        });
      }
    }
  );

  /**
   * GET /api/v1/author/packages/:packageId/stats
   * Get detailed stats for a specific package
   */
  fastify.get<{
    Params: { packageId: string };
    Querystring: { range?: TimeRange };
  }>(
    '/packages/:packageId/stats',
    {
      preHandler: fastify.authenticate,
      schema: {
        tags: ['Author Analytics'],
        description: 'Get detailed stats for a package',
        params: {
          type: 'object',
          properties: {
            packageId: { type: 'string' },
          },
        },
        querystring: {
          type: 'object',
          properties: {
            range: {
              type: 'string',
              enum: ['today', 'week', 'month', 'year', 'all'],
              default: 'month',
            },
          },
        },
      },
    },
    async (request, reply) => {
      const userId = request.user?.user_id;
      const { packageId } = request.params;
      const { range = 'month' } = request.query;

      if (!userId) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }

      try {
        // Verify package ownership
        const pkgResult = await fastify.pg.query(
          `SELECT id, author_id, total_downloads, weekly_downloads, monthly_downloads
           FROM packages
           WHERE id = $1`,
          [packageId]
        );

        if (pkgResult.rows.length === 0) {
          return reply.code(404).send({ error: 'Package not found' });
        }

        const pkg = pkgResult.rows[0];

        if (pkg.author_id !== userId) {
          return reply.code(403).send({ error: 'Forbidden' });
        }

        // Calculate date range
        const ranges: Record<TimeRange, string> = {
          today: "date = CURRENT_DATE",
          week: "date >= CURRENT_DATE - INTERVAL '7 days'",
          month: "date >= CURRENT_DATE - INTERVAL '30 days'",
          year: "date >= CURRENT_DATE - INTERVAL '365 days'",
          all: "date IS NOT NULL",
        };

        const whereClause = ranges[range] || ranges.month;

        // Get daily stats for the range
        const dailyStatsResult = await fastify.pg.query(
          `SELECT
             date,
             total_downloads,
             unique_downloads,
             cli_downloads,
             web_downloads,
             api_downloads,
             cursor_downloads,
             claude_downloads,
             continue_downloads,
             windsurf_downloads,
             generic_downloads,
             total_views,
             unique_views
           FROM package_stats
           WHERE package_id = $1 AND ${whereClause}
           ORDER BY date DESC`,
          [packageId]
        );

        // Calculate totals for the period
        let totals = dailyStatsResult.rows.reduce(
          (acc, row) => ({
            downloads: acc.downloads + (row.total_downloads || 0),
            unique_downloads: acc.unique_downloads + (row.unique_downloads || 0),
            views: acc.views + (row.total_views || 0),
            unique_views: acc.unique_views + (row.unique_views || 0),
            cli: acc.cli + (row.cli_downloads || 0),
            web: acc.web + (row.web_downloads || 0),
            api: acc.api + (row.api_downloads || 0),
            cursor: acc.cursor + (row.cursor_downloads || 0),
            claude: acc.claude + (row.claude_downloads || 0),
            continue: acc.continue + (row.continue_downloads || 0),
            windsurf: acc.windsurf + (row.windsurf_downloads || 0),
            generic: acc.generic + (row.generic_downloads || 0),
          }),
          {
            downloads: 0,
            unique_downloads: 0,
            views: 0,
            unique_views: 0,
            cli: 0,
            web: 0,
            api: 0,
            cursor: 0,
            claude: 0,
            continue: 0,
            windsurf: 0,
            generic: 0,
          }
        );

        // Fallback: If package_stats is empty or has no downloads, query download_events directly
        if (totals.downloads === 0) {
          const dateRanges: Record<TimeRange, string> = {
            today: "created_at >= CURRENT_DATE",
            week: "created_at >= CURRENT_DATE - INTERVAL '7 days'",
            month: "created_at >= CURRENT_DATE - INTERVAL '30 days'",
            year: "created_at >= CURRENT_DATE - INTERVAL '365 days'",
            all: "created_at IS NOT NULL",
          };

          const eventWhereClause = dateRanges[range] || dateRanges.month;

          const eventsResult = await fastify.pg.query(
            `SELECT
               COUNT(*) as total_downloads,
               COUNT(DISTINCT COALESCE(user_id::text, client_id, ip_hash)) as unique_downloads,
               COUNT(*) FILTER (WHERE client_type = 'cli') as cli_downloads,
               COUNT(*) FILTER (WHERE client_type = 'web') as web_downloads,
               COUNT(*) FILTER (WHERE client_type = 'api') as api_downloads,
               COUNT(*) FILTER (WHERE format = 'cursor') as cursor_downloads,
               COUNT(*) FILTER (WHERE format = 'claude') as claude_downloads,
               COUNT(*) FILTER (WHERE format = 'continue') as continue_downloads,
               COUNT(*) FILTER (WHERE format = 'windsurf') as windsurf_downloads,
               COUNT(*) FILTER (WHERE format = 'generic') as generic_downloads
             FROM download_events
             WHERE package_id = $1 AND ${eventWhereClause}`,
            [packageId]
          );

          if (eventsResult.rows.length > 0) {
            const eventData = eventsResult.rows[0];
            totals = {
              downloads: parseInt(eventData.total_downloads) || 0,
              unique_downloads: parseInt(eventData.unique_downloads) || 0,
              views: 0, // Views not tracked in download_events
              unique_views: 0,
              cli: parseInt(eventData.cli_downloads) || 0,
              web: parseInt(eventData.web_downloads) || 0,
              api: parseInt(eventData.api_downloads) || 0,
              cursor: parseInt(eventData.cursor_downloads) || 0,
              claude: parseInt(eventData.claude_downloads) || 0,
              continue: parseInt(eventData.continue_downloads) || 0,
              windsurf: parseInt(eventData.windsurf_downloads) || 0,
              generic: parseInt(eventData.generic_downloads) || 0,
            };
          }
        }

        // Get top referrers (last 30 days)
        const referrersResult = await fastify.pg.query(
          `SELECT
             referrer,
             COUNT(*) as count
           FROM download_events
           WHERE package_id = $1
             AND created_at >= NOW() - INTERVAL '30 days'
             AND referrer IS NOT NULL
             AND referrer != ''
           GROUP BY referrer
           ORDER BY count DESC
           LIMIT 10`,
          [packageId]
        );

        return reply.send({
          package: {
            id: pkg.id,
            name: pkg.id,
            total_downloads: pkg.total_downloads,
            weekly_downloads: pkg.weekly_downloads,
            monthly_downloads: pkg.monthly_downloads,
          },
          period: {
            range,
            totals,
            by_client: {
              cli: totals.cli,
              web: totals.web,
              api: totals.api,
            },
            by_format: {
              cursor: totals.cursor,
              claude: totals.claude,
              continue: totals.continue,
              windsurf: totals.windsurf,
              generic: totals.generic,
            },
          },
          daily: dailyStatsResult.rows,
          top_referrers: referrersResult.rows,
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({
          error: 'Internal Server Error',
          message: 'Failed to fetch package stats',
        });
      }
    }
  );

  /**
   * GET /api/v1/author/packages/:packageId/downloads/recent
   * Get recent download events for a package (for live activity feed)
   */
  fastify.get<{
    Params: { packageId: string };
    Querystring: { limit?: number };
  }>(
    '/packages/:packageId/downloads/recent',
    {
      preHandler: fastify.authenticate,
      schema: {
        tags: ['Author Analytics'],
        description: 'Get recent download events',
        params: {
          type: 'object',
          properties: {
            packageId: { type: 'string' },
          },
        },
        querystring: {
          type: 'object',
          properties: {
            limit: { type: 'number', default: 50, maximum: 100 },
          },
        },
      },
    },
    async (request, reply) => {
      const userId = request.user?.user_id;
      const { packageId } = request.params;
      const { limit = 50 } = request.query;

      if (!userId) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }

      try {
        // Verify ownership
        const pkgResult = await fastify.pg.query(
          `SELECT author_id FROM packages WHERE id = $1`,
          [packageId]
        );

        if (pkgResult.rows.length === 0) {
          return reply.code(404).send({ error: 'Package not found' });
        }

        if (pkgResult.rows[0].author_id !== userId) {
          return reply.code(403).send({ error: 'Forbidden' });
        }

        // Get recent downloads
        const result = await fastify.pg.query(
          `SELECT
             version,
             client_type,
             format,
             country_code,
             created_at,
             CASE
               WHEN user_id IS NOT NULL THEN 'authenticated'
               ELSE 'anonymous'
             END as user_type
           FROM download_events
           WHERE package_id = $1
           ORDER BY created_at DESC
           LIMIT $2`,
          [packageId, limit]
        );

        return reply.send({
          package_id: packageId,
          recent_downloads: result.rows,
          count: result.rows.length,
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({
          error: 'Internal Server Error',
          message: 'Failed to fetch recent downloads',
        });
      }
    }
  );

  /**
   * POST /api/v1/author/refresh-stats
   * Manually refresh author stats (useful after publishing)
   */
  fastify.post(
    '/refresh-stats',
    {
      preHandler: fastify.authenticate,
      schema: {
        tags: ['Author Analytics'],
        description: 'Manually refresh author stats',
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = request.user?.user_id;

      if (!userId) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }

      try {
        // Call the update function
        await fastify.pg.query(
          `SELECT update_author_stats($1)`,
          [userId]
        );

        return reply.send({
          success: true,
          message: 'Stats refreshed successfully',
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({
          error: 'Internal Server Error',
          message: 'Failed to refresh stats',
        });
      }
    }
  );

  fastify.log.info('✅ Author analytics routes registered');
}
