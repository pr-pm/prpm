/**
 * Centralized Cron Job Scheduler
 *
 * Manages all scheduled background jobs for PRPM Registry:
 * - Analytics aggregation
 * - Playground credits reset
 * - Cost monitoring and analytics refresh
 */

import cron from 'node-cron';
import type { FastifyInstance } from 'fastify';
import { PlaygroundCreditsService } from './playground-credits.js';
import { CostMonitoringService } from './cost-monitoring.js';

interface CronJob {
  name: string;
  schedule: string;
  task: () => Promise<void>;
  cronInstance?: cron.ScheduledTask;
}

export class CronScheduler {
  private server: FastifyInstance;
  private jobs: CronJob[] = [];
  private creditsService: PlaygroundCreditsService;
  private costMonitoring: CostMonitoringService;

  constructor(server: FastifyInstance) {
    this.server = server;
    this.creditsService = new PlaygroundCreditsService(server);
    this.costMonitoring = new CostMonitoringService(server);
  }

  /**
   * Initialize and start all cron jobs
   */
  start() {
    this.registerJobs();
    this.scheduleJobs();
    this.runStartupJobs();
    this.registerShutdownHooks();

    this.server.log.info(
      { jobCount: this.jobs.length },
      '⏰ Cron scheduler started with all jobs'
    );
  }

  /**
   * Register all cron jobs
   */
  private registerJobs() {
    this.jobs = [
      // =====================================================
      // ANALYTICS AGGREGATION
      // Daily at 1:00 AM UTC
      // =====================================================
      {
        name: 'Analytics Aggregation',
        schedule: '0 1 * * *', // Every day at 1 AM UTC
        task: async () => {
          try {
            this.server.log.info('🔄 Starting daily analytics aggregation...');

            // Get yesterday's date
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const targetDate = yesterday.toISOString().split('T')[0];

            // Call the aggregate_daily_stats function
            await this.server.pg.query(
              'SELECT aggregate_daily_stats($1::date)',
              [targetDate]
            );

            this.server.log.info(
              { date: targetDate },
              '✅ Daily analytics aggregation completed'
            );
          } catch (error) {
            this.server.log.error(
              { error },
              '❌ Daily analytics aggregation failed'
            );
          }
        },
      },

      // =====================================================
      // MONTHLY CREDITS RESET
      // Daily at 12:00 AM UTC (checks if reset needed)
      // =====================================================
      {
        name: 'Monthly Credits Reset',
        schedule: '0 0 * * *', // Every day at midnight UTC
        task: async () => {
          try {
            this.server.log.info('🔄 Starting monthly credits reset check...');

            const processedCount = await this.creditsService.processMonthlyReset();

            if (processedCount > 0) {
              this.server.log.info(
                { processedCount },
                '✅ Monthly credits reset completed'
              );
            } else {
              this.server.log.debug('No users needed monthly credit reset');
            }
          } catch (error) {
            this.server.log.error(
              { error },
              '❌ Monthly credits reset failed'
            );
          }
        },
      },

      // =====================================================
      // ROLLOVER CREDITS EXPIRATION
      // Daily at 12:05 AM UTC (after monthly reset)
      // =====================================================
      {
        name: 'Rollover Credits Expiration',
        schedule: '5 0 * * *', // Every day at 12:05 AM UTC
        task: async () => {
          try {
            this.server.log.info('🔄 Starting rollover credits expiration...');

            const expiredCount = await this.creditsService.expireRolloverCredits();

            if (expiredCount > 0) {
              this.server.log.info(
                { expiredCount },
                '✅ Rollover credits expiration completed'
              );
            } else {
              this.server.log.debug('No rollover credits to expire');
            }
          } catch (error) {
            this.server.log.error(
              { error },
              '❌ Rollover credits expiration failed'
            );
          }
        },
      },

      // =====================================================
      // MONTHLY API COST RESET
      // Daily at 12:10 AM UTC (after credits reset)
      // =====================================================
      {
        name: 'Monthly API Cost Reset',
        schedule: '10 0 * * *', // Every day at 12:10 AM UTC
        task: async () => {
          try {
            this.server.log.info('🔄 Starting monthly API cost reset check...');

            const resetCount = await this.costMonitoring.resetMonthlyCosts();

            if (resetCount > 0) {
              this.server.log.info(
                { resetCount },
                '✅ Monthly API cost reset completed'
              );
            } else {
              this.server.log.debug('No users needed monthly cost reset');
            }
          } catch (error) {
            this.server.log.error(
              { error },
              '❌ Monthly API cost reset failed'
            );
          }
        },
      },

      // =====================================================
      // COST ANALYTICS REFRESH
      // Hourly (on the hour)
      // =====================================================
      {
        name: 'Cost Analytics Refresh',
        schedule: '0 * * * *', // Every hour at :00
        task: async () => {
          try {
            this.server.log.info('🔄 Refreshing cost analytics...');

            await this.costMonitoring.refreshAnalytics();

            this.server.log.info('✅ Cost analytics refresh completed');
          } catch (error) {
            this.server.log.error(
              { error },
              '❌ Cost analytics refresh failed'
            );
          }
        },
      },
    ];
  }

  /**
   * Schedule all jobs with node-cron
   */
  private scheduleJobs() {
    for (const job of this.jobs) {
      try {
        job.cronInstance = cron.schedule(job.schedule, job.task, {
          timezone: 'UTC',
          scheduled: true,
        });

        this.server.log.info(
          { name: job.name, schedule: job.schedule },
          `⏰ Scheduled cron job`
        );
      } catch (error) {
        this.server.log.error(
          { error, jobName: job.name },
          '❌ Failed to schedule cron job'
        );
      }
    }
  }

  /**
   * Run initial jobs on startup (catch up)
   */
  private runStartupJobs() {
    // Run analytics aggregation after 5 seconds
    setTimeout(async () => {
      try {
        this.server.log.info('🔄 Running initial analytics aggregation on startup...');

        // Aggregate yesterday
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayDate = yesterday.toISOString().split('T')[0];

        await this.server.pg.query(
          'SELECT aggregate_daily_stats($1::date)',
          [yesterdayDate]
        );

        // Aggregate today (partial)
        const today = new Date().toISOString().split('T')[0];
        await this.server.pg.query(
          'SELECT aggregate_daily_stats($1::date)',
          [today]
        );

        this.server.log.info('✅ Initial analytics aggregation completed');
      } catch (error) {
        this.server.log.error({ error }, '❌ Initial analytics aggregation failed');
      }
    }, 5000);

    // Refresh cost analytics after 10 seconds
    setTimeout(async () => {
      try {
        this.server.log.info('🔄 Initial cost analytics refresh on startup...');
        await this.costMonitoring.refreshAnalytics();
        this.server.log.info('✅ Initial cost analytics refresh completed');
      } catch (error) {
        this.server.log.error({ error }, '❌ Initial cost analytics refresh failed');
      }
    }, 10000);
  }

  /**
   * Register shutdown hooks to stop all cron jobs gracefully
   */
  private registerShutdownHooks() {
    this.server.addHook('onClose', async () => {
      this.server.log.info('🛑 Stopping all cron jobs...');

      for (const job of this.jobs) {
        if (job.cronInstance) {
          job.cronInstance.stop();
          this.server.log.info({ name: job.name }, '🛑 Cron job stopped');
        }
      }

      this.server.log.info('✅ All cron jobs stopped gracefully');
    });
  }

  /**
   * Get status of all scheduled jobs
   */
  getJobsStatus() {
    return this.jobs.map(job => ({
      name: job.name,
      schedule: job.schedule,
      isRunning: job.cronInstance ? true : false,
    }));
  }
}

/**
 * Start the cron scheduler
 * Call this from index.ts after server is ready
 */
export function startCronScheduler(server: FastifyInstance) {
  const scheduler = new CronScheduler(server);
  scheduler.start();
  return scheduler;
}
