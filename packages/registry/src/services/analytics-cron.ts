/**
 * Analytics Aggregation Cron Service
 * Runs daily to aggregate download and view statistics
 */

import cron from 'node-cron';
import type { FastifyInstance } from 'fastify';

export function startAnalyticsCron(fastify: FastifyInstance) {
  // Run aggregate_daily_stats every day at 1 AM UTC
  const dailyAggregation = cron.schedule('0 1 * * *', async () => {
    try {
      fastify.log.info('🔄 Starting daily analytics aggregation...');

      // Get yesterday's date (the day we want to aggregate)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const targetDate = yesterday.toISOString().split('T')[0];

      // Call the aggregate_daily_stats function
      await fastify.pg.query(
        'SELECT aggregate_daily_stats($1::date)',
        [targetDate]
      );

      fastify.log.info(`✅ Daily analytics aggregation completed for ${targetDate}`);
    } catch (error) {
      fastify.log.error({ error }, '❌ Daily analytics aggregation failed');
    }
  }, {
    timezone: 'UTC'
  });

  // Also run immediately on startup for today and yesterday (catch up)
  setTimeout(async () => {
    try {
      fastify.log.info('🔄 Running initial analytics aggregation on startup...');

      // Aggregate yesterday
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayDate = yesterday.toISOString().split('T')[0];

      await fastify.pg.query(
        'SELECT aggregate_daily_stats($1::date)',
        [yesterdayDate]
      );

      // Aggregate today (partial)
      const today = new Date().toISOString().split('T')[0];
      await fastify.pg.query(
        'SELECT aggregate_daily_stats($1::date)',
        [today]
      );

      fastify.log.info('✅ Initial analytics aggregation completed');
    } catch (error) {
      fastify.log.error({ error }, '❌ Initial analytics aggregation failed');
    }
  }, 5000); // Wait 5 seconds after startup

  // Stop cron on server shutdown
  fastify.addHook('onClose', async () => {
    dailyAggregation.stop();
    fastify.log.info('🛑 Analytics cron stopped');
  });

  fastify.log.info('⏰ Analytics cron scheduled: Daily at 1 AM UTC');
}
