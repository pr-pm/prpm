/**
 * Playground Analytics API Routes
 *
 * Provides analytics endpoints for playground author features.
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

export async function playgroundAnalyticsRoutes(server: FastifyInstance) {
  // =====================================================
  // GET /api/v1/analytics/author/summary
  // Get high-level analytics summary for current author
  // =====================================================
  server.get(
    '/author/summary',
    {
      preHandler: [server.authenticate],
      schema: {
        description: 'Get author analytics dashboard summary',
        tags: ['analytics'],
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: 'object',
            properties: {
              total_packages: { type: 'number' },
              total_playground_sessions: { type: 'number' },
              total_unique_users: { type: 'number' },
              total_credits_spent: { type: 'number' },
              sessions_last_30_days: { type: 'number' },
              total_suggested_inputs: { type: 'number' },
              active_suggested_inputs: { type: 'number' },
              total_shared_sessions: { type: 'number' },
              total_featured_sessions: { type: 'number' },
              total_share_views: { type: 'number' },
              top_package_name: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = request.user?.user_id;

        if (!userId) {
          return reply.code(401).send({
            error: 'unauthorized',
            message: 'User not authenticated',
          });
        }

        const result = await server.pg.query(
          'SELECT * FROM get_author_analytics($1)',
          [userId]
        );

        if (result.rows.length === 0) {
          // Return zeros for new authors
          return reply.code(200).send({
            total_packages: 0,
            total_playground_sessions: 0,
            total_unique_users: 0,
            total_credits_spent: 0,
            sessions_last_30_days: 0,
            total_suggested_inputs: 0,
            active_suggested_inputs: 0,
            total_shared_sessions: 0,
            total_featured_sessions: 0,
            total_share_views: 0,
            top_package_name: null,
          });
        }

        return reply.code(200).send(result.rows[0]);
      } catch (error: any) {
        server.log.error({ error }, 'Failed to get author analytics summary');
        return reply.code(500).send({
          error: 'analytics_failed',
          message: error.message,
        });
      }
    }
  );

  // =====================================================
  // GET /api/v1/analytics/package/:packageId
  // Get detailed analytics for a specific package
  // =====================================================
  server.get(
    '/package/:packageId',
    {
      preHandler: [server.authenticate],
      schema: {
        description: 'Get package analytics (author only)',
        tags: ['analytics'],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['packageId'],
          properties: {
            packageId: { type: 'string', format: 'uuid' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              package_id: { type: 'string' },
              package_name: { type: 'string' },
              total_playground_sessions: { type: 'number' },
              unique_users: { type: 'number' },
              avg_credits_per_session: { type: 'number' },
              sessions_last_7_days: { type: 'number' },
              sessions_last_30_days: { type: 'number' },
              suggested_inputs_count: { type: 'number' },
              featured_sessions_count: { type: 'number' },
              shared_sessions_count: { type: 'number' },
              total_share_views: { type: 'number' },
            },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{
        Params: { packageId: string };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { packageId } = request.params;
        const userId = request.user?.user_id;

        if (!userId) {
          return reply.code(401).send({
            error: 'unauthorized',
            message: 'User not authenticated',
          });
        }

        // Verify user owns this package
        const ownerCheck = await server.pg.query(
          'SELECT author_id FROM packages WHERE id = $1',
          [packageId]
        );

        if (ownerCheck.rows.length === 0) {
          return reply.code(404).send({
            error: 'package_not_found',
            message: 'Package not found',
          });
        }

        if (ownerCheck.rows[0].author_id !== userId) {
          return reply.code(403).send({
            error: 'forbidden',
            message: 'You do not own this package',
          });
        }

        const result = await server.pg.query(
          'SELECT * FROM get_package_analytics($1)',
          [packageId]
        );

        if (result.rows.length === 0) {
          return reply.code(404).send({
            error: 'analytics_not_found',
            message: 'Analytics not available for this package',
          });
        }

        return reply.code(200).send(result.rows[0]);
      } catch (error: any) {
        server.log.error({ error }, 'Failed to get package analytics');
        return reply.code(500).send({
          error: 'analytics_failed',
          message: error.message,
        });
      }
    }
  );

  // =====================================================
  // GET /api/v1/analytics/suggested-inputs/package/:packageId
  // Get analytics for all suggested inputs of a package
  // =====================================================
  server.get(
    '/suggested-inputs/package/:packageId',
    {
      preHandler: [server.authenticate],
      schema: {
        description: 'Get suggested input analytics for a package (author only)',
        tags: ['analytics'],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['packageId'],
          properties: {
            packageId: { type: 'string', format: 'uuid' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              suggested_inputs: { type: 'array' },
              summary: {
                type: 'object',
                properties: {
                  total_inputs: { type: 'number' },
                  total_clicks: { type: 'number' },
                  total_completions: { type: 'number' },
                  avg_conversion_rate: { type: 'number' },
                },
              },
            },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{
        Params: { packageId: string };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { packageId } = request.params;
        const userId = request.user?.user_id;

        if (!userId) {
          return reply.code(401).send({
            error: 'unauthorized',
            message: 'User not authenticated',
          });
        }

        // Verify ownership
        const ownerCheck = await server.pg.query(
          'SELECT author_id FROM packages WHERE id = $1',
          [packageId]
        );

        if (ownerCheck.rows.length === 0) {
          return reply.code(404).send({
            error: 'package_not_found',
            message: 'Package not found',
          });
        }

        if (ownerCheck.rows[0].author_id !== userId) {
          return reply.code(403).send({
            error: 'forbidden',
            message: 'You do not own this package',
          });
        }

        // Get analytics from materialized view
        const result = await server.pg.query(
          `SELECT
            sia.suggested_input_id,
            sti.title,
            sti.category,
            sti.difficulty,
            sia.total_clicks,
            sia.completed_tests,
            sia.unique_users,
            sia.conversion_rate,
            sia.clicks_last_7_days,
            sia.clicks_last_30_days,
            sia.last_clicked_at,
            sti.created_at
           FROM suggested_input_analytics sia
           JOIN suggested_test_inputs sti ON sia.suggested_input_id = sti.id
           WHERE sia.package_id = $1
           ORDER BY sia.total_clicks DESC`,
          [packageId]
        );

        // Calculate summary
        const summary = {
          total_inputs: result.rows.length,
          total_clicks: result.rows.reduce((sum, row) => sum + parseInt(row.total_clicks), 0),
          total_completions: result.rows.reduce(
            (sum, row) => sum + parseInt(row.completed_tests),
            0
          ),
          avg_conversion_rate:
            result.rows.length > 0
              ? result.rows.reduce((sum, row) => sum + parseFloat(row.conversion_rate), 0) /
                result.rows.length
              : 0,
        };

        return reply.code(200).send({
          suggested_inputs: result.rows,
          summary,
        });
      } catch (error: any) {
        server.log.error({ error }, 'Failed to get suggested input analytics');
        return reply.code(500).send({
          error: 'analytics_failed',
          message: error.message,
        });
      }
    }
  );

  // =====================================================
  // GET /api/v1/analytics/time-series/playground/:packageId
  // Get time-series data for playground usage
  // =====================================================
  server.get(
    '/time-series/playground/:packageId',
    {
      preHandler: [server.authenticate],
      schema: {
        description: 'Get playground usage time-series data (author only)',
        tags: ['analytics'],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['packageId'],
          properties: {
            packageId: { type: 'string', format: 'uuid' },
          },
        },
        querystring: {
          type: 'object',
          properties: {
            days: { type: 'number', minimum: 1, maximum: 90, default: 30 },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              data: { type: 'array' },
              total_days: { type: 'number' },
            },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{
        Params: { packageId: string };
        Querystring: { days?: number };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { packageId } = request.params;
        const days = request.query.days || 30;
        const userId = request.user?.user_id;

        if (!userId) {
          return reply.code(401).send({
            error: 'unauthorized',
            message: 'User not authenticated',
          });
        }

        // Verify ownership
        const ownerCheck = await server.pg.query(
          'SELECT author_id FROM packages WHERE id = $1',
          [packageId]
        );

        if (ownerCheck.rows.length === 0) {
          return reply.code(404).send({
            error: 'package_not_found',
            message: 'Package not found',
          });
        }

        if (ownerCheck.rows[0].author_id !== userId) {
          return reply.code(403).send({
            error: 'forbidden',
            message: 'You do not own this package',
          });
        }

        const result = await server.pg.query(
          `SELECT
            date,
            sessions_count,
            unique_users,
            credits_spent,
            shared_count
           FROM playground_usage_time_series
           WHERE package_id = $1
             AND date >= CURRENT_DATE - INTERVAL '1 day' * $2
           ORDER BY date ASC`,
          [packageId, days]
        );

        return reply.code(200).send({
          data: result.rows,
          total_days: days,
        });
      } catch (error: any) {
        server.log.error({ error }, 'Failed to get playground time-series data');
        return reply.code(500).send({
          error: 'analytics_failed',
          message: error.message,
        });
      }
    }
  );

  // =====================================================
  // GET /api/v1/analytics/time-series/suggested-inputs/:inputId
  // Get time-series data for a specific suggested input
  // =====================================================
  server.get(
    '/time-series/suggested-inputs/:inputId',
    {
      preHandler: [server.authenticate],
      schema: {
        description: 'Get suggested input usage time-series data (author only)',
        tags: ['analytics'],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['inputId'],
          properties: {
            inputId: { type: 'string', format: 'uuid' },
          },
        },
        querystring: {
          type: 'object',
          properties: {
            days: { type: 'number', minimum: 1, maximum: 90, default: 30 },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              data: { type: 'array' },
              total_days: { type: 'number' },
            },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{
        Params: { inputId: string };
        Querystring: { days?: number };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { inputId } = request.params;
        const days = request.query.days || 30;
        const userId = request.user?.user_id;

        if (!userId) {
          return reply.code(401).send({
            error: 'unauthorized',
            message: 'User not authenticated',
          });
        }

        // Verify ownership
        const ownerCheck = await server.pg.query(
          'SELECT author_id FROM suggested_test_inputs WHERE id = $1',
          [inputId]
        );

        if (ownerCheck.rows.length === 0) {
          return reply.code(404).send({
            error: 'input_not_found',
            message: 'Suggested input not found',
          });
        }

        if (ownerCheck.rows[0].author_id !== userId) {
          return reply.code(403).send({
            error: 'forbidden',
            message: 'You do not own this suggested input',
          });
        }

        const result = await server.pg.query(
          `SELECT
            date,
            clicks,
            completions,
            unique_users
           FROM suggested_input_usage_time_series
           WHERE suggested_input_id = $1
             AND date >= CURRENT_DATE - INTERVAL '1 day' * $2
           ORDER BY date ASC`,
          [inputId, days]
        );

        return reply.code(200).send({
          data: result.rows,
          total_days: days,
        });
      } catch (error: any) {
        server.log.error({ error }, 'Failed to get suggested input time-series data');
        return reply.code(500).send({
          error: 'analytics_failed',
          message: error.message,
        });
      }
    }
  );

  // =====================================================
  // POST /api/v1/analytics/refresh
  // Manually refresh analytics views (admin or author)
  // =====================================================
  server.post(
    '/refresh',
    {
      preHandler: [server.authenticate],
      schema: {
        description: 'Refresh analytics materialized views',
        tags: ['analytics'],
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = request.user?.user_id;

        if (!userId) {
          return reply.code(401).send({
            error: 'unauthorized',
            message: 'User not authenticated',
          });
        }

        await server.pg.query('SELECT refresh_playground_analytics()');

        return reply.code(200).send({
          success: true,
          message: 'Analytics views refreshed successfully',
        });
      } catch (error: any) {
        server.log.error({ error }, 'Failed to refresh analytics views');
        return reply.code(500).send({
          error: 'refresh_failed',
          message: error.message,
        });
      }
    }
  );
}
