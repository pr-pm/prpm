/**
 * Analytics Routes - Download tracking, stats, trending
 */

import { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { createHash } from 'crypto';
import { optionalAuth } from '../middleware/auth.js';
import { AnalyticsQuery } from '../types/analytics.js';

const TrackDownloadSchema = z.object({
  packageId: z.string(),
  version: z.string().optional(),
  format: z.enum(['cursor', 'claude', 'continue', 'windsurf', 'copilot', 'kiro', 'agents.md', 'generic', 'mcp']).optional(),
  client: z.enum(['cli', 'web', 'api']).optional(),
});

const GetStatsSchema = z.object({
  packageId: z.string(),
});

export default async function analyticsRoutes(fastify: FastifyInstance) {
  /**
   * Track a package download
   * POST /api/v1/analytics/download
   */
  fastify.post<{
    Body: z.infer<typeof TrackDownloadSchema>;
  }>(
    '/download',
    {
      preHandler: optionalAuth,
      schema: {
        tags: ['Analytics'],
        description: 'Track a package download',
        body: {
          type: 'object',
          required: ['packageId'],
          properties: {
            packageId: { type: 'string', description: 'Package ID' },
            version: { type: 'string', description: 'Package version' },
            format: {
              type: 'string',
              enum: ['cursor', 'claude', 'continue', 'windsurf', 'copilot', 'kiro', 'agents.md', 'generic', 'mcp'],
              description: 'Download format'
            },
            client: { 
              type: 'string', 
              enum: ['cli', 'web', 'api'],
              description: 'Client type'
            },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              packageId: { type: 'string' },
              totalDownloads: { type: 'number' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { packageId, version, format, client } = request.body;

      try {
        // Lookup package UUID by name
        const pkgResult = await fastify.pg.query(
          'SELECT id FROM packages WHERE name = $1',
          [packageId]
        );

        if (pkgResult.rows.length === 0) {
          return reply.code(404).send({
            error: 'Not Found',
            message: 'Package not found',
          });
        }

        const pkgUuid = pkgResult.rows[0].id;

        // Get client info for anonymous tracking
        const clientId = request.user?.user_id ||
          request.headers['x-client-id'] as string ||
          'anonymous';

        const ipHash = request.ip ?
          createHash('sha256').update(request.ip).digest('hex').substring(0, 16) :
          null;

        // Record download event in enhanced analytics table (use UUID for FK)
        await fastify.pg.query(
          `INSERT INTO download_events (
            package_id,
            version,
            client_type,
            format,
            user_id,
            client_id,
            ip_hash,
            user_agent,
            referrer
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            pkgUuid,
            version || null,
            client || 'api',
            format || 'generic',
            request.user?.user_id || null,
            clientId !== 'anonymous' ? clientId : null,
            ipHash,
            request.headers['user-agent'] || null,
            request.headers.referer || request.headers.referrer || null,
          ]
        );

        // Update package download counts (use UUID)
        await fastify.pg.query(
          `UPDATE packages
           SET
             total_downloads = total_downloads + 1,
             weekly_downloads = weekly_downloads + 1,
             monthly_downloads = monthly_downloads + 1,
             updated_at = NOW()
           WHERE id = $1`,
          [pkgUuid]
        );

        // Get updated total (use UUID)
        const result = await fastify.pg.query(
          'SELECT total_downloads FROM packages WHERE id = $1',
          [pkgUuid]
        );

        const totalDownloads = result.rows[0]?.total_downloads || 0;

        // Log to telemetry
        fastify.log.info({
          event: 'package_download',
          packageId,
          version,
          format,
          client,
          totalDownloads,
        });

        return reply.send({
          success: true,
          packageId,
          totalDownloads,
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({
          error: 'Internal Server Error',
          message: 'Failed to track download',
        });
      }
    }
  );

  /**
   * Track a package view (page visit)
   * POST /api/v1/analytics/view
   */
  fastify.post<{
    Body: { packageId: string; referrer?: string };
  }>(
    '/view',
    {
      preHandler: optionalAuth,
      schema: {
        tags: ['Analytics'],
        description: 'Track a package page view',
        body: {
          type: 'object',
          required: ['packageId'],
          properties: {
            packageId: { type: 'string' },
            referrer: { type: 'string' },
          },
        },
      },
    },
    async (request, reply) => {
      const { packageId, referrer } = request.body;

      try {
        // Lookup package UUID by name
        const pkgResult = await fastify.pg.query(
          'SELECT id FROM packages WHERE name = $1',
          [packageId]
        );

        if (pkgResult.rows.length > 0) {
          const pkgUuid = pkgResult.rows[0].id;

          // Record view event (fire and forget, don't block response)
          const userId = request.user?.user_id || null;
          const ipHash = request.ip ?
            createHash('sha256').update(request.ip).digest('hex').substring(0, 16) :
            null;

          fastify.pg.query(
            `INSERT INTO package_views (
              package_id,
              user_id,
              ip_hash,
              user_agent,
              referrer
            ) VALUES ($1, $2, $3, $4, $5)`,
            [pkgUuid, userId, ipHash, request.headers['user-agent'], referrer]
          ).catch(err => fastify.log.error({ err }, 'Failed to record view'));
        }

        return reply.send({ success: true });
      } catch (error) {
        // Don't fail on view tracking errors
        return reply.send({ success: true });
      }
    }
  );

  /**
   * Get package stats
   * GET /api/v1/analytics/stats/:packageId
   */
  fastify.get<{
    Params: { packageId: string };
  }>(
    '/stats/:packageId',
    {
      schema: {
        tags: ['Analytics'],
        description: 'Get package statistics',
        params: {
          type: 'object',
          properties: {
            packageId: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              packageId: { type: 'string' },
              totalDownloads: { type: 'number' },
              weeklyDownloads: { type: 'number' },
              monthlyDownloads: { type: 'number' },
              downloadsByFormat: { type: 'object' },
              downloadsByClient: { type: 'object' },
              trend: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { packageId } = request.params;

      try {
        // Lookup package UUID by name
        const pkgLookup = await fastify.pg.query(
          'SELECT id FROM packages WHERE name = $1',
          [packageId]
        );

        if (pkgLookup.rows.length === 0) {
          return reply.code(404).send({
            error: 'Not Found',
            message: 'Package not found',
          });
        }

        const pkgUuid = pkgLookup.rows[0].id;

        // Get package download counts (use UUID)
        const pkgResult = await fastify.pg.query(
          `SELECT
            total_downloads,
            weekly_downloads,
            monthly_downloads
          FROM packages
          WHERE id = $1`,
          [pkgUuid]
        );

        const pkg = pkgResult.rows[0];

        // Get downloads by format from download events (use UUID)
        const formatResult = await fastify.pg.query(
          `SELECT
            format,
            COUNT(*) as count
          FROM download_events
          WHERE package_id = $1
          GROUP BY format`,
          [pkgUuid]
        );

        const downloadsByFormat = formatResult.rows.reduce((acc, row) => {
          acc[row.format] = parseInt(row.count);
          return acc;
        }, {} as Record<string, number>);

        // Get downloads by client from download events (use UUID)
        const clientResult = await fastify.pg.query(
          `SELECT
            client_type,
            COUNT(*) as count
          FROM download_events
          WHERE package_id = $1
          GROUP BY client_type`,
          [pkgUuid]
        );

        const downloadsByClient = clientResult.rows.reduce((acc, row) => {
          acc[row.client_type] = parseInt(row.count);
          return acc;
        }, {} as Record<string, number>);

        // Calculate trend (simple: compare this week vs last week) (use UUID)
        const trendResult = await fastify.pg.query(
          `SELECT
            SUM(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 ELSE 0 END) as this_week,
            SUM(CASE WHEN created_at >= NOW() - INTERVAL '14 days'
                      AND created_at < NOW() - INTERVAL '7 days' THEN 1 ELSE 0 END) as last_week
          FROM download_events
          WHERE package_id = $1`,
          [pkgUuid]
        );

        const thisWeek = parseInt(trendResult.rows[0]?.this_week || '0');
        const lastWeek = parseInt(trendResult.rows[0]?.last_week || '0');
        
        let trend = 'stable';
        if (thisWeek > lastWeek * 1.2) trend = 'rising';
        else if (thisWeek < lastWeek * 0.8) trend = 'falling';

        return reply.send({
          packageId,
          totalDownloads: pkg.total_downloads,
          weeklyDownloads: pkg.weekly_downloads,
          monthlyDownloads: pkg.monthly_downloads,
          downloadsByFormat,
          downloadsByClient,
          trend,
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({
          error: 'Internal Server Error',
          message: 'Failed to get package stats',
        });
      }
    }
  );

  /**
   * Get trending packages
   * GET /api/v1/analytics/trending
   */
  fastify.get(
    '/trending',
    {
      schema: {
        tags: ['Analytics'],
        description: 'Get trending packages',
        querystring: {
          type: 'object',
          properties: {
            limit: { type: 'number', default: 10 },
            timeframe: { 
              type: 'string', 
              enum: ['day', 'week', 'month'],
              default: 'week'
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { limit = 10, timeframe = 'week' } = request.query as AnalyticsQuery;

      const intervalMap: Record<string, string> = {
        day: '1 day',
        week: '7 days',
        month: '30 days',
      };
      const interval = intervalMap[timeframe] || '7 days';

      try {
        const result = await fastify.pg.query(
          `SELECT
            p.id,
            p.description,
            p.format,
            p.subtype,
            p.category,
            p.total_downloads,
            p.weekly_downloads,
            COUNT(de.id) as recent_downloads,
            COUNT(de.id)::float / GREATEST(p.total_downloads, 1) as trending_score
          FROM packages p
          LEFT JOIN download_events de ON de.package_id = p.id
            AND de.created_at >= NOW() - INTERVAL '${interval}'
          GROUP BY p.id
          ORDER BY trending_score DESC, recent_downloads DESC
          LIMIT $1`,
          [limit]
        );

        return reply.send({
          trending: result.rows,
          timeframe,
          count: result.rows.length,
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({
          error: 'Internal Server Error',
          message: 'Failed to get trending packages',
        });
      }
    }
  );

  /**
   * Get popular packages (by total downloads)
   * GET /api/v1/analytics/popular
   */
  fastify.get(
    '/popular',
    {
      schema: {
        tags: ['Analytics'],
        description: 'Get most popular packages by total downloads',
        querystring: {
          type: 'object',
          properties: {
            limit: { type: 'number', default: 10 },
            type: { type: 'string', enum: ['cursor', 'claude', 'continue', 'windsurf', 'copilot', 'kiro', 'agents.md', 'generic', 'mcp'] },
          },
        },
      },
    },
    async (request, reply) => {
      const { limit = 10, type } = request.query as AnalyticsQuery;

      try {
        let query = `
          SELECT
            id,
            description,
            type,
            category,
            total_downloads,
            weekly_downloads,
            monthly_downloads,
            verified,
            featured
          FROM packages
          WHERE total_downloads > 0
        `;

        const params: (string | number)[] = [];

        if (type) {
          query += ` AND type = $1`;
          params.push(type);
        }

        query += ` ORDER BY total_downloads DESC LIMIT $${params.length + 1}`;
        params.push(limit);

        const result = await fastify.pg.query(query, params);

        return reply.send({
          popular: result.rows,
          count: result.rows.length,
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({
          error: 'Internal Server Error',
          message: 'Failed to get popular packages',
        });
      }
    }
  );
}
