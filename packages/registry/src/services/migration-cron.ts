/**
 * Automated Migration Cron Job
 * Runs periodic batch migrations in the background
 */

import cron from 'node-cron';
import { FastifyInstance } from 'fastify';
import { batchMigratePackages } from './migration.js';

export interface CronConfig {
  enabled: boolean;
  schedule: string; // Cron expression
  batchSize: number;
}

/**
 * Setup automated migration cron job
 * Runs on a schedule to gradually migrate packages to canonical format
 */
export function setupMigrationCron(
  server: FastifyInstance,
  config: CronConfig
) {
  if (!config.enabled) {
    server.log.info('Migration cron disabled');
    return;
  }

  server.log.info(
    { schedule: config.schedule, batchSize: config.batchSize },
    'Setting up migration cron job'
  );

  // Track current offset for pagination across runs
  let currentOffset = 0;
  // Track if we've completed a full cycle with zero migrations (to stop the cron)
  let completedCycleWithZeroMigrations = false;

  // Validate cron expression
  if (!cron.validate(config.schedule)) {
    server.log.error(
      { schedule: config.schedule },
      'Invalid cron schedule expression'
    );
    return;
  }

  // Schedule the cron job
  const task = cron.schedule(config.schedule, async () => {
    // Stop if we've already completed a full cycle with zero migrations
    if (completedCycleWithZeroMigrations) {
      server.log.info('All packages migrated - stopping cron job');
      task.stop();
      return;
    }

    try {
      server.log.info(
        { offset: currentOffset, batchSize: config.batchSize },
        'Starting scheduled migration batch'
      );

      const startTime = Date.now();

      const result = await batchMigratePackages(server, {
        limit: config.batchSize,
        offset: currentOffset,
        dryRun: false,
      });

      const duration = Date.now() - startTime;

      server.log.info(
        {
          total: result.total,
          migrated: result.migrated,
          failed: result.failed,
          skipped: result.skipped,
          offset: currentOffset,
          durationMs: duration,
        },
        'Completed scheduled migration batch'
      );

      // If we processed a full batch, increment offset for next run
      // Otherwise, we've reached the end - reset to start
      if (result.total === config.batchSize && result.migrated > 0) {
        currentOffset += config.batchSize;
        server.log.debug(
          { newOffset: currentOffset },
          'Incremented offset for next run'
        );
      } else {
        // Reached end of packages
        if (currentOffset > 0) {
          server.log.info(
            { totalProcessed: currentOffset + result.total },
            'Migration cycle complete'
          );
        }

        // If we completed a cycle and migrated nothing, we're done
        if (result.migrated === 0 && currentOffset === 0) {
          completedCycleWithZeroMigrations = true;
          server.log.info('No packages to migrate - will stop on next run');
        }

        currentOffset = 0;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      server.log.error(
        {
          error: errorMessage,
          errorStack: error instanceof Error ? error.stack : undefined,
          offset: currentOffset,
        },
        'Migration cron job failed'
      );
      // Don't reset offset on error - will retry from same position
    }
  });

  server.log.info('✅ Migration cron job scheduled');

  // Cleanup on server close
  server.addHook('onClose', async () => {
    task.stop();
    server.log.info('Migration cron job stopped');
  });

  return task;
}
