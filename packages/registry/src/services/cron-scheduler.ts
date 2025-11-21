/**
 * Centralized Cron Job Scheduler
 *
 * Manages all scheduled background jobs for PRPM Registry:
 * - Analytics aggregation
 * - Playground credits reset
 * - Cost monitoring and analytics refresh
 * - Batch embedding generation for AI search
 * - AI use case generation for packages
 */

import cron, { ScheduledTask } from 'node-cron';
import type { FastifyInstance } from 'fastify';
import Anthropic from '@anthropic-ai/sdk';
import { PlaygroundCreditsService } from './playground-credits.js';
import { CostMonitoringService } from './cost-monitoring.js';
import { EmbeddingGenerationService } from './embedding-generation.js';
import { AIPackageEnrichmentService } from './ai-package-enrichment.js';
import { TaxonomyService } from './taxonomy.js';

interface CronJob {
  name: string;
  schedule: string;
  task: () => Promise<void>;
  cronInstance?: ScheduledTask;
}

export class CronScheduler {
  private server: FastifyInstance;
  private jobs: CronJob[] = [];
  private creditsService: PlaygroundCreditsService;
  private costMonitoring: CostMonitoringService;
  private embeddingService?: EmbeddingGenerationService;
  private enrichmentService?: AIPackageEnrichmentService;

  constructor(server: FastifyInstance) {
    this.server = server;
    this.creditsService = new PlaygroundCreditsService(server);
    this.costMonitoring = new CostMonitoringService(server);

    // Only initialize AI services if OpenAI API key is configured
    if (process.env.OPENAI_API_KEY) {
      try {
        this.embeddingService = new EmbeddingGenerationService(server);
      } catch (error) {
        this.server.log.warn({ error }, 'Failed to initialize EmbeddingGenerationService - embeddings cron will be disabled');
      }

      try {
        this.enrichmentService = new AIPackageEnrichmentService(server);
      } catch (error) {
        this.server.log.warn({ error }, 'Failed to initialize AIPackageEnrichmentService - enrichment cron will be disabled');
      }
    }
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

      // =====================================================
      // SHARED RESULTS ANALYTICS REFRESH
      // Hourly at :30 (offset from cost analytics)
      // =====================================================
      {
        name: 'Shared Results Analytics Refresh',
        schedule: '30 * * * *', // Every hour at :30
        task: async () => {
          try {
            this.server.log.info('🔄 Refreshing shared results analytics...');

            await this.server.pg.query('SELECT refresh_top_shared_results()');

            this.server.log.info('✅ Shared results analytics refresh completed');
          } catch (error) {
            this.server.log.error(
              { error },
              '❌ Shared results analytics refresh failed'
            );
          }
        },
      },

      // =====================================================
      // SEARCH RANKINGS REFRESH
      // Every 6 hours (keeps search results fresh)
      // =====================================================
      {
        name: 'Search Rankings Refresh',
        schedule: '0 */6 * * *', // Every 6 hours at :00
        task: async () => {
          try {
            this.server.log.info('🔄 Refreshing search rankings materialized view...');

            await this.server.pg.query('REFRESH MATERIALIZED VIEW CONCURRENTLY package_search_rankings');

            this.server.log.info('✅ Search rankings refresh completed');
          } catch (error) {
            this.server.log.error(
              { error },
              '❌ Search rankings refresh failed'
            );
          }
        },
      },

      // =====================================================
      // CATEGORY AGGREGATION REFRESH
      // Every 10 minutes (keeps category counts fresh)
      // =====================================================
      {
        name: 'Category Aggregation Refresh',
        schedule: '*/10 * * * *', // Every 10 minutes
        task: async () => {
          try {
            this.server.log.info('🔄 Refreshing category aggregation view...');

            await this.server.pg.query('SELECT refresh_category_aggregation()');

            this.server.log.info('✅ Category aggregation refresh completed');
          } catch (error) {
            this.server.log.error(
              { error },
              '❌ Category aggregation refresh failed'
            );
          }
        },
      },

      // =====================================================
      // SEARCH CACHE WARMING
      // Every 30 minutes (pre-warms popular searches)
      // =====================================================
      {
        name: 'Search Cache Warming',
        schedule: '*/30 * * * *', // Every 30 minutes
        task: async () => {
          try {
            this.server.log.info('🔄 Warming search cache with popular queries...');

            // Popular search terms to pre-cache
            const popularSearches = [
              'react', 'cursor', 'frontend', 'backend', 'api',
              'testing', 'documentation', 'ui', 'component', 'agent'
            ];

            let warmedCount = 0;
            for (const searchTerm of popularSearches) {
              try {
                // Execute search to warm cache
                await this.server.pg.query(
                  `SELECT name, total_downloads
                   FROM packages
                   WHERE visibility = 'public'
                     AND search_vector @@ websearch_to_tsquery('english', $1)
                   ORDER BY total_downloads DESC
                   LIMIT 20`,
                  [searchTerm]
                );
                warmedCount++;
              } catch (err) {
                this.server.log.warn({ error: err, term: searchTerm }, 'Failed to warm cache for search term');
              }
            }

            this.server.log.info(
              { warmedCount, total: popularSearches.length },
              '✅ Search cache warming completed'
            );
          } catch (error) {
            this.server.log.error(
              { error },
              '❌ Search cache warming failed'
            );
          }
        },
      },
    ];

    // =====================================================
    // BATCH EMBEDDING GENERATION
    // Every 30 minutes (catches packages without embeddings)
    // Only added if OpenAI API key is configured
    // =====================================================
    if (this.embeddingService && process.env.DISABLE_AI_CRON_JOBS !== 'true') {
      this.jobs.push({
        name: 'Batch Embedding Generation',
        schedule: '*/15 * * * *', // Every 15 minutes
        task: async () => {
          try {
            this.server.log.info('🔄 Starting batch embedding generation...');

            // Find packages needing embeddings
            const packagesResult = await this.server.pg.query(`
              SELECT p.id, p.name
              FROM packages p
              WHERE p.visibility = 'public'
                AND p.deprecated = false
                AND needs_embedding_regeneration(p.id) = true
              ORDER BY p.total_downloads DESC
              LIMIT 50
            `);

            const packages = packagesResult.rows;

            if (packages.length === 0) {
              this.server.log.info('No packages need embedding generation');
              return;
            }

            this.server.log.info(
              { packageCount: packages.length },
              'Found packages needing embeddings'
            );

            let successful = 0;
            let failed = 0;
            let skipped = 0;

            // Process packages in batch with rate limiting
            for (const pkg of packages) {
              try {
                const result = await this.embeddingService!.generatePackageEmbedding({
                  package_id: pkg.id,
                  force_regenerate: false
                });

                if (result.success) {
                  if (result.skipped) {
                    skipped++;
                  } else {
                    successful++;
                    this.server.log.info(
                      { packageId: pkg.id, packageName: pkg.name },
                      'Generated embedding'
                    );
                  }
                } else {
                  failed++;
                  this.server.log.warn(
                    { packageId: pkg.id, packageName: pkg.name, error: result.error },
                    'Failed to generate embedding'
                  );
                }

                // Rate limiting: wait 200ms between API calls
                await new Promise(resolve => setTimeout(resolve, 200));
              } catch (error) {
                failed++;
                this.server.log.error(
                  { packageId: pkg.id, packageName: pkg.name, error },
                  'Exception generating embedding'
                );
              }
            }

            this.server.log.info(
              { total: packages.length, successful, failed, skipped },
              '✅ Batch embedding generation completed'
            );
          } catch (error) {
            this.server.log.error(
              { error },
              '❌ Batch embedding generation failed'
            );
          }
        },
      });
    }

    // =====================================================
    // AI PACKAGE ENRICHMENT (Unified)
    // Every 2 hours (generates category, tags, and use cases)
    // Combines what used to be 3 separate API calls into 1
    // Only added if OpenAI API key is configured
    // =====================================================
    if (this.enrichmentService) {
      this.jobs.push({
        name: 'AI Package Enrichment',
        schedule: '0 */2 * * *', // Every 2 hours at :00
        task: async () => {
          try {
            this.server.log.info('🔄 Starting AI package enrichment...');

            // Enrich packages (category, tags, use cases) in one API call
            const enrichedCount = await this.enrichmentService!.enrichPendingPackages();

            if (enrichedCount > 0) {
              this.server.log.info(
                { enrichedCount },
                '✅ AI package enrichment completed'
              );
            } else {
              this.server.log.info('No packages need enrichment');
            }

            // Get and log statistics
            const stats = await this.enrichmentService!.getStatistics();
            this.server.log.info(
              {
                totalPackages: stats.totalPackages,
                enrichedPackages: stats.enrichedPackages,
                pendingPackages: stats.pendingPackages,
                coverage: `${stats.enrichmentPercentage.toFixed(1)}%`
              },
              'Enrichment coverage statistics'
            );
          } catch (error) {
            this.server.log.error(
              { error },
              '❌ AI package enrichment failed'
            );
          }
        },
      });

      // Also add a job to regenerate stale enrichments (once per week)
      this.jobs.push({
        name: 'Stale Enrichment Regeneration',
        schedule: '0 3 * * 0', // Every Sunday at 3 AM UTC
        task: async () => {
          try {
            this.server.log.info('🔄 Starting stale enrichment regeneration...');

            const regeneratedCount = await this.enrichmentService!.regenerateStaleEnrichments();

            if (regeneratedCount > 0) {
              this.server.log.info(
                { regeneratedCount },
                '✅ Stale enrichment regeneration completed'
              );
            } else {
              this.server.log.info('No stale enrichments to regenerate');
            }
          } catch (error) {
            this.server.log.error(
              { error },
              '❌ Stale enrichment regeneration failed'
            );
          }
        },
      });
    }

    // =====================================================
    // TAXONOMY CATEGORY BACKFILL
    // Sync legacy packages into package_categories
    // =====================================================
    this.jobs.push({
      name: 'Taxonomy Category Backfill',
      schedule: '*/30 * * * *', // Every 30 minutes
      task: async () => {
        try {
          this.server.log.info('🔄 Starting taxonomy category backfill...');
          const taxonomyService = new TaxonomyService(this.server);
          const processed = await taxonomyService.backfillPackageCategories();
          this.server.log.info(
            { processed },
            '✅ Taxonomy category backfill completed'
          );
        } catch (error) {
          this.server.log.error(
            { error },
            '❌ Taxonomy category backfill failed'
          );
        }
      },
    });

    // =====================================================
    // AI USE-CASE PACKAGE CURATION
    // Weekly on Sunday at 2:00 AM UTC
    // Curates best packages for each use case with AI explanations
    // Only added if Anthropic API key is configured
    // =====================================================
    if (process.env.ANTHROPIC_API_KEY && process.env.DISABLE_AI_CRON_JOBS !== 'true') {
      this.jobs.push({
        name: 'AI Use-Case Curation',
        schedule: '0 2 * * 0', // Weekly on Sunday at 2 AM UTC
        task: async () => {
          try {
            this.server.log.info('🤖 Starting weekly AI use-case package curation...');

            const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

            // Get all use cases
            const useCasesResult = await this.server.pg.query(`
              SELECT id, name, slug, description, example_query
              FROM use_cases
              ORDER BY name
            `);

            this.server.log.info(
              { useCaseCount: useCasesResult.rows.length },
              'Found use cases to curate'
            );

            for (const useCase of useCasesResult.rows) {
              this.server.log.info({ useCaseSlug: useCase.slug }, `Curating: ${useCase.name}`);

              try {
                // Get candidate packages
                const packagesResult = await this.server.pg.query(`
                  SELECT
                    id, name, description, format, subtype, tags,
                    total_downloads, quality_score
                  FROM packages
                  WHERE
                    visibility = 'public'
                    AND quality_score >= 3.0
                  ORDER BY
                    (total_downloads * COALESCE(quality_score, 3.0)) DESC
                  LIMIT 50
                `);

                this.server.log.info(
                  { candidateCount: packagesResult.rows.length },
                  'Evaluating candidates'
                );

                // Use Claude to select and explain best packages
                const prompt = `You are a package recommendation expert. Given a use case and a list of packages, select the 5-8 BEST packages that would help someone accomplish this use case.

Use Case: ${useCase.name}
Description: ${useCase.description || 'No description provided'}
${useCase.example_query ? `Example Query: ${useCase.example_query}` : ''}

Available Packages:
${packagesResult.rows.map((pkg: any, idx: number) => `
${idx + 1}. ${pkg.name} (${pkg.format}/${pkg.subtype})
   Description: ${pkg.description || 'No description'}
   Tags: ${pkg.tags?.join(', ') || 'none'}
   Downloads: ${pkg.total_downloads}
   Quality: ${pkg.quality_score || 'N/A'}/5
`).join('\n')}

Please respond with ONLY a JSON array of recommendations. Each recommendation should have:
- package_name: exact name from the list above
- reason: 1-2 sentence explanation of WHY this package is perfect for this use case
- sort_order: number 1-8 indicating priority (1 = most important)

Example format:
[
  {
    "package_name": "@prpm/example-skill",
    "reason": "Provides essential debugging workflows that help identify root causes before attempting fixes, which is critical for API development troubleshooting.",
    "sort_order": 1
  }
]

Select 5-8 packages that provide the most value for this use case. Focus on diversity (don't pick all the same type) and practical utility.`;

                const response = await anthropic.messages.create({
                  model: 'claude-3-5-sonnet-20241022',
                  max_tokens: 2000,
                  messages: [{
                    role: 'user',
                    content: prompt
                  }]
                });

                const content = response.content[0];
                if (content.type !== 'text') {
                  throw new Error('Unexpected response type from Claude');
                }

                // Parse Claude's response
                const jsonMatch = content.text.match(/\[[\s\S]*\]/);
                if (!jsonMatch) {
                  this.server.log.error({ useCaseSlug: useCase.slug }, 'Could not parse AI response');
                  continue;
                }

                interface Recommendation {
                  package_name: string;
                  reason: string;
                  sort_order: number;
                }

                const recommendations: Recommendation[] = JSON.parse(jsonMatch[0]);
                this.server.log.info(
                  { recommendationCount: recommendations.length },
                  `AI selected ${recommendations.length} packages`
                );

                // Clear existing AI-curated packages for this use case
                await this.server.pg.query(
                  'DELETE FROM use_case_packages WHERE use_case_id = $1 AND curated_by = $2',
                  [useCase.id, 'ai']
                );

                // Insert new curated packages
                let insertedCount = 0;
                for (const rec of recommendations) {
                  const pkg = packagesResult.rows.find((p: any) => p.name === rec.package_name);
                  if (!pkg) {
                    this.server.log.warn({ packageName: rec.package_name }, 'Package not found');
                    continue;
                  }

                  await this.server.pg.query(`
                    INSERT INTO use_case_packages (use_case_id, package_id, recommendation_reason, sort_order, curated_by)
                    VALUES ($1, $2, $3, $4, $5)
                    ON CONFLICT (use_case_id, package_id) DO UPDATE
                    SET
                      recommendation_reason = EXCLUDED.recommendation_reason,
                      sort_order = EXCLUDED.sort_order,
                      updated_at = NOW()
                  `, [useCase.id, pkg.id, rec.reason, rec.sort_order, 'ai']);

                  insertedCount++;
                }

                this.server.log.info(
                  { savedCount: insertedCount },
                  `Saved curated packages for ${useCase.name}`
                );

              } catch (error) {
                this.server.log.error(
                  { error, useCaseSlug: useCase.slug },
                  `Error curating ${useCase.name}`
                );
                continue;
              }

              // Rate limit: wait 1 second between requests
              await new Promise(resolve => setTimeout(resolve, 1000));
            }

            this.server.log.info('✅ AI use-case curation completed');

          } catch (error) {
            this.server.log.error({ error }, '❌ AI use-case curation failed');
          }
        },
      });
    }
  }

  /**
   * Schedule all jobs with node-cron
   */
  private scheduleJobs() {
    for (const job of this.jobs) {
      try {
        job.cronInstance = cron.schedule(job.schedule, job.task, {
          timezone: 'UTC',
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

    // Refresh shared results analytics after 15 seconds
    setTimeout(async () => {
      try {
        this.server.log.info('🔄 Initial shared results analytics refresh on startup...');
        await this.server.pg.query('SELECT refresh_top_shared_results()');
        this.server.log.info('✅ Initial shared results analytics refresh completed');
      } catch (error) {
        this.server.log.error({ error }, '❌ Initial shared results analytics refresh failed');
      }
    }, 15000);
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
