/**
 * Admin Cost Monitoring Routes
 *
 * Provides admin endpoints for monitoring API costs, user spending, and financial analytics.
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { CostMonitoringService } from '../services/cost-monitoring.js';
import { requireAdmin } from '../middleware/auth.js';

export async function adminCostMonitoringRoutes(server: FastifyInstance) {
  const costMonitoring = new CostMonitoringService(server);

  // =====================================================
  // GET /api/v1/admin/cost-analytics/summary
  // Get aggregate cost metrics
  // =====================================================
  server.get(
    '/summary',
    {
      preHandler: requireAdmin(),
      schema: {
        description: 'Get aggregate cost analytics for admin dashboard',
        tags: ['admin', 'cost-monitoring'],
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: 'object',
            properties: {
              totalMonthlyRevenue: { type: 'number' },
              totalMonthlyCost: { type: 'number' },
              overallMargin: { type: 'number' },
              activeUsers: { type: 'integer' },
              throttledUsers: { type: 'integer' },
              highRiskUsers: { type: 'integer' },
              averageCostPerUser: { type: 'number' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const metrics = await costMonitoring.getAggregateCostMetrics();
        return reply.code(200).send(metrics);
      } catch (error: any) {
        server.log.error({ error }, 'Failed to get cost analytics summary');
        return reply.code(500).send({
          error: 'analytics_failed',
          message: error.message,
        });
      }
    }
  );

  // =====================================================
  // GET /api/v1/admin/cost-analytics/users
  // Get user-level cost analytics
  // =====================================================
  server.get(
    '/users',
    {
      preHandler: requireAdmin(),
      schema: {
        description: 'Get per-user cost analytics',
        tags: ['admin', 'cost-monitoring'],
        security: [{ bearerAuth: [] }],
        querystring: {
          type: 'object',
          properties: {
            riskLevel: {
              type: 'string',
              enum: ['safe', 'low_risk', 'medium_risk', 'high_risk'],
            },
            limit: { type: 'integer', minimum: 1, maximum: 1000, default: 100 },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              users: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    user_id: { type: 'string' },
                    email: { type: 'string' },
                    prpm_plus_status: { type: 'string' },
                    current_month_api_cost: { type: 'number' },
                    current_month_requests: { type: 'integer' },
                    avg_cost_per_request: { type: 'number' },
                    lifetime_api_cost: { type: 'number' },
                    total_requests: { type: 'integer' },
                    monthly_revenue: { type: 'number' },
                    current_margin_percent: { type: 'number' },
                    is_throttled: { type: 'boolean' },
                    risk_level: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { riskLevel, limit } = request.query as {
          riskLevel?: 'safe' | 'low_risk' | 'medium_risk' | 'high_risk';
          limit?: number;
        };

        const users = await costMonitoring.getCostAnalytics({
          riskLevel,
          limit: limit || 100,
        });

        return reply.code(200).send({ users });
      } catch (error: any) {
        server.log.error({ error }, 'Failed to get user cost analytics');
        return reply.code(500).send({
          error: 'analytics_failed',
          message: error.message,
        });
      }
    }
  );

  // =====================================================
  // GET /api/v1/admin/cost-analytics/user/:userId
  // Get detailed cost info for specific user
  // =====================================================
  server.get(
    '/user/:userId',
    {
      preHandler: requireAdmin(),
      schema: {
        description: 'Get detailed cost analytics for a specific user',
        tags: ['admin', 'cost-monitoring'],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['userId'],
          properties: {
            userId: { type: 'string', format: 'uuid' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              userId: { type: 'string' },
              currentMonthCost: { type: 'number' },
              costLimit: { type: 'number' },
              percentUsed: { type: 'number' },
              isThrottled: { type: 'boolean' },
              throttledReason: { type: 'string' },
              tier: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {

        const { userId } = request.params as { userId: string };
        const status = await costMonitoring.getUserCostStatus(userId);

        return reply.code(200).send(status);
      } catch (error: any) {
        server.log.error({ error }, 'Failed to get user cost status');
        return reply.code(500).send({
          error: 'status_failed',
          message: error.message,
        });
      }
    }
  );

  // =====================================================
  // POST /api/v1/admin/cost-analytics/user/:userId/unthrottle
  // Manually unthrottle a user (admin action)
  // =====================================================
  server.post(
    '/user/:userId/unthrottle',
    {
      preHandler: requireAdmin(),
      schema: {
        description: 'Manually unthrottle a user (admin override)',
        tags: ['admin', 'cost-monitoring'],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['userId'],
          properties: {
            userId: { type: 'string', format: 'uuid' },
          },
        },
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

        const { userId } = request.params as { userId: string };
        await costMonitoring.unthrottleUser(userId);

        server.log.info(
          { adminId: request.user.user_id, targetUserId: userId },
          'Admin manually unthrottled user'
        );

        return reply.code(200).send({
          success: true,
          message: `User ${userId} has been unthrottled`,
        });
      } catch (error: any) {
        server.log.error({ error }, 'Failed to unthrottle user');
        return reply.code(500).send({
          error: 'unthrottle_failed',
          message: error.message,
        });
      }
    }
  );

  // =====================================================
  // POST /api/v1/admin/cost-analytics/refresh
  // Manually trigger analytics refresh
  // =====================================================
  server.post(
    '/refresh',
    {
      preHandler: requireAdmin(),
      schema: {
        description: 'Manually refresh cost analytics materialized view',
        tags: ['admin', 'cost-monitoring'],
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

        await costMonitoring.refreshAnalytics();

        return reply.code(200).send({
          success: true,
          message: 'Cost analytics refreshed successfully',
        });
      } catch (error: any) {
        server.log.error({ error }, 'Failed to refresh analytics');
        return reply.code(500).send({
          error: 'refresh_failed',
          message: error.message,
        });
      }
    }
  );
}
