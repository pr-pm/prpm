/**
 * Admin Migration Routes
 * Provides migration management endpoints for registry operators
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import {
  batchMigratePackages,
  getMigrationStatus,
  estimateMigrationCount,
  isLazyMigrationEnabled,
} from '../services/migration.js';
import { requireAdmin } from '../middleware/auth.js';

export async function adminMigrationRoutes(server: FastifyInstance) {
  // Apply admin authentication to all routes
  server.addHook('onRequest', requireAdmin());
  /**
   * Get migration status for a specific package
   * GET /api/v1/admin/migration/status/:packageName?version=X
   */
  server.get('/status/:packageName', {
    schema: {
      tags: ['admin', 'migration'],
      description: 'Check if a package has been migrated to canonical format',
      params: {
        type: 'object',
        required: ['packageName'],
        properties: {
          packageName: {
            type: 'string',
            description: 'Package name (e.g., author/package-name)',
          },
        },
      },
      querystring: {
        type: 'object',
        required: ['version'],
        properties: {
          version: {
            type: 'string',
            description: 'Package version',
          },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            packageName: { type: 'string' },
            version: { type: 'string' },
            migrated: { type: 'boolean' },
            format: {
              type: 'string',
              enum: ['canonical', 'tarball'],
            },
          },
        },
        404: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
          },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { packageName: rawPackageName } = request.params as { packageName: string };
    const { version } = request.query as { version: string };

    const packageName = decodeURIComponent(rawPackageName);

    try {
      const status = await getMigrationStatus(packageName, version);

      return {
        packageName,
        version,
        migrated: status.migrated,
        format: status.format,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      server.log.error(
        { error: errorMessage, packageName, version },
        'Failed to check migration status'
      );

      return reply.status(404).send({
        error: 'Status check failed',
        message: errorMessage,
      });
    }
  });

  /**
   * Get migration estimate for all packages
   * GET /api/v1/admin/migration/estimate
   */
  server.get('/estimate', {
    schema: {
      tags: ['admin', 'migration'],
      description: 'Estimate how many packages need migration',
      response: {
        200: {
          type: 'object',
          properties: {
            totalPackages: { type: 'number' },
            needsMigration: { type: 'number' },
            alreadyMigrated: { type: 'number' },
            percentMigrated: { type: 'number' },
            lazyMigrationEnabled: { type: 'boolean' },
          },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const totalCount = await estimateMigrationCount(server);

      return {
        totalPackages: totalCount,
        needsMigration: totalCount, // Simplified: assume all need migration
        alreadyMigrated: 0, // Would need additional query to calculate
        percentMigrated: 0,
        lazyMigrationEnabled: isLazyMigrationEnabled(),
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      server.log.error({ error: errorMessage }, 'Failed to estimate migration count');

      return reply.status(500).send({
        error: 'Estimation failed',
        message: errorMessage,
      });
    }
  });

  /**
   * Batch migrate packages
   * POST /api/v1/admin/migration/batch
   */
  server.post('/batch', {
    schema: {
      tags: ['admin', 'migration'],
      description: 'Batch migrate packages to canonical format',
      body: {
        type: 'object',
        properties: {
          limit: {
            type: 'number',
            description: 'Number of packages to migrate',
            default: 100,
          },
          offset: {
            type: 'number',
            description: 'Offset for pagination',
            default: 0,
          },
          dryRun: {
            type: 'boolean',
            description: 'Simulate migration without actually migrating',
            default: false,
          },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            migrated: { type: 'number' },
            failed: { type: 'number' },
            skipped: { type: 'number' },
            dryRun: { type: 'boolean' },
            failures: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  packageName: { type: 'string' },
                  version: { type: 'string' },
                  error: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { limit = 100, offset = 0, dryRun = false } = request.body as {
      limit?: number;
      offset?: number;
      dryRun?: boolean;
    };

    server.log.info(
      { limit, offset, dryRun },
      'Starting batch migration'
    );

    try {
      const result = await batchMigratePackages(server, {
        limit,
        offset,
        dryRun,
      });

      server.log.info(
        {
          total: result.total,
          migrated: result.migrated,
          failed: result.failed,
          skipped: result.skipped,
          dryRun,
        },
        'Batch migration complete'
      );

      return {
        ...result,
        dryRun,
        failures: [], // MigrationStats doesn't include failures array
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      server.log.error({ error: errorMessage, limit, offset }, 'Batch migration failed');

      return reply.status(500).send({
        error: 'Migration failed',
        message: errorMessage,
      });
    }
  });

  /**
   * Get lazy migration configuration
   * GET /api/v1/admin/migration/config
   */
  server.get('/config', {
    schema: {
      tags: ['admin', 'migration'],
      description: 'Get current migration configuration',
      response: {
        200: {
          type: 'object',
          properties: {
            lazyMigrationEnabled: { type: 'boolean' },
            environment: { type: 'string' },
          },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    return {
      lazyMigrationEnabled: isLazyMigrationEnabled(),
      environment: process.env.NODE_ENV || 'development',
    };
  });

  server.log.info('✅ Admin migration routes registered');
}
