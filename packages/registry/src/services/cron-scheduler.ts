/**
 * Centralized Cron Job Scheduler
 *
 * Manages all scheduled background jobs for PRPM Registry:
 * - Analytics aggregation
 * - Playground credits reset
 * - Cost monitoring and analytics refresh
 * - Batch embedding generation for AI search
 */

import cron, { ScheduledTask } from 'node-cron';
import type { FastifyInstance } from 'fastify';
import { PlaygroundCreditsService } from './playground-credits.js';
import { CostMonitoringService } from './cost-monitoring.js';
import { EmbeddingGenerationService } from './embedding-generation.js';

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

  constructor(server: FastifyInstance) {
    this.server = server;
    this.creditsService = new PlaygroundCreditsService(server);
    this.costMonitoring = new CostMonitoringService(server);

    // Only initialize embedding service if OpenAI API key is configured
    if (process.env.OPENAI_API_KEY) {
      try {
        this.embeddingService = new EmbeddingGenerationService(server);
      } catch (error) {
        this.server.log.warn({ error }, 'Failed to initialize EmbeddingGenerationService - embeddings cron will be disabled');
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
    if (this.embeddingService) {
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
    // PACKAGE AUTO-CATEGORIZATION
    // Every 30 minutes (categorizes uncategorized packages)
    // Only added if OpenAI API key is configured
    // =====================================================
    if (process.env.OPENAI_API_KEY) {
      this.jobs.push({
        name: 'Package Auto-Categorization',
        schedule: '*/15 * * * *', // Every 30 minutes
        task: async () => {
          try {
            this.server.log.info('🔄 Starting auto-categorization of packages...');

            // Import OpenAI dynamically to avoid issues if not installed
            const { default: OpenAI } = await import('openai');
            const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

            // Fetch category taxonomy
            const categoriesResult = await this.server.pg.query(`
              SELECT slug, name, level
              FROM categories
              ORDER BY level, display_order
            `);

            const topLevelCategories = categoriesResult.rows
              .filter((cat: any) => cat.level === 1)
              .map((cat: any) => cat.slug);

            const allCategories = categoriesResult.rows.map((cat: any) => ({
              slug: cat.slug,
              name: cat.name,
              level: cat.level,
            }));

            // Find packages without categories or AI-suggested tags (limit to 50 per run)
            // Note: We check ai_tags, not user tags - user tags are preserved
            // We process ALL packages to migrate from old taxonomy to new taxonomy
            const packagesResult = await this.server.pg.query(`
              SELECT id, name, display_name, description, category, tags, ai_tags, subtype, format
              FROM packages
              WHERE (
                category IS NULL
                OR category = ''
                OR ai_tags IS NULL
                OR ai_tags = '{}'
                OR array_length(ai_tags, 1) IS NULL
                OR array_length(ai_tags, 1) = 0
              )
              AND visibility = 'public'
              AND deprecated = FALSE
              ORDER BY total_downloads DESC
              LIMIT 50
            `);

            const packages = packagesResult.rows;

            if (packages.length === 0) {
              this.server.log.info('No packages need categorization');
              return;
            }

            // Log breakdown of what needs categorization
            const missingCategory = packages.filter((p: any) => !p.category || p.category === '');
            const missingAiTags = packages.filter((p: any) => !p.ai_tags || p.ai_tags.length === 0);

            this.server.log.info(
              {
                packageCount: packages.length,
                missingCategory: missingCategory.length,
                missingAiTags: missingAiTags.length,
                missingBoth: packages.filter((p: any) => (!p.category || p.category === '') && (!p.ai_tags || p.ai_tags.length === 0)).length,
                withUserTags: packages.filter((p: any) => p.tags && p.tags.length > 0).length
              },
              'Found packages needing categorization (user tags preserved)'
            );

            let updatedCount = 0;
            let skippedCount = 0;

            for (const pkg of packages) {
              try {
                // Prepare package context for AI
                const packageContext = {
                  name: pkg.name,
                  displayName: pkg.display_name || pkg.name,
                  description: pkg.description || 'No description',
                  currentCategory: pkg.category,
                  userTags: pkg.tags || [], // User-specified tags (preserved)
                  currentAiTags: pkg.ai_tags || [], // AI-suggested tags (we'll update these)
                  subtype: pkg.subtype,
                  format: pkg.format,
                };

                // Call OpenAI to suggest categorization
                const prompt = `You are a package categorization expert. Analyze this package and suggest the best category and tags.

Package Information:
- Name: ${packageContext.name}
- Display Name: ${packageContext.displayName}
- Description: ${packageContext.description}
- Type: ${packageContext.format} ${packageContext.subtype}
- Current Category: ${packageContext.currentCategory || 'None'}
- User-Specified Tags: ${packageContext.userTags.join(', ') || 'None'}
- Current AI Tags: ${packageContext.currentAiTags.join(', ') || 'None'}

Available Top-Level Categories:
${topLevelCategories.map(cat => `- ${cat}`).join('\n')}

All Available Categories (including subcategories):
${allCategories.slice(0, 50).map((cat: any) => `- ${cat.slug} (level ${cat.level})`).join('\n')}

Instructions:
1. Choose ONE top-level category that best fits this package
2. Suggest 3-5 relevant tags from the available categories/subcategories
3. **BE STRICT**: Only suggest tags that are DIRECTLY relevant to the package's actual functionality
4. **REVIEW EXISTING TAGS**: If current AI tags are wrong/overused (e.g., "react" or "tailwind" on unrelated packages), remove them
5. Common mistakes to avoid:
   - Don't tag with "react" unless the package specifically helps with React development
   - Don't tag with "tailwind" unless the package specifically helps with Tailwind CSS
   - Don't tag with framework names unless the package is framework-specific
6. Provide a confidence score (0.0 to 1.0)
7. Explain your reasoning, especially if removing existing tags

Respond ONLY with valid JSON in this exact format:
{
  "category": "category-slug",
  "tags": ["tag1", "tag2", "tag3"],
  "confidence": 0.95,
  "reasoning": "Brief explanation of why these were chosen"
}`;

                const response = await openai.chat.completions.create({
                  model: 'gpt-4o-mini',
                  messages: [
                    {
                      role: 'system',
                      content: 'You are a helpful assistant that categorizes packages. Always respond with valid JSON only, no additional text.',
                    },
                    {
                      role: 'user',
                      content: prompt,
                    },
                  ],
                  temperature: 0.3,
                  max_tokens: 500,
                });

                const content = response.choices[0]?.message?.content;
                if (!content) {
                  skippedCount++;
                  continue;
                }

                // Parse JSON response
                const parsed = JSON.parse(content.trim());

                // Validate the response
                if (!parsed.category || !Array.isArray(parsed.tags)) {
                  this.server.log.warn({ packageId: pkg.id }, 'Invalid AI response format');
                  skippedCount++;
                  continue;
                }

                const suggestion = {
                  category: parsed.category,
                  tags: parsed.tags.slice(0, 5), // Limit to 5 tags
                  confidence: parsed.confidence || 0.5,
                  reasoning: parsed.reasoning || 'No reasoning provided',
                };

                // Only update if confidence is high enough
                if (suggestion.confidence < 0.7) {
                  this.server.log.info(
                    { packageId: pkg.id, confidence: suggestion.confidence },
                    'Low confidence, skipping'
                  );
                  skippedCount++;
                  continue;
                }

                // Update package in database
                const updates: string[] = [];
                const values: any[] = [];
                let paramIndex = 1;

                // Always update category with AI suggestion (overwrites old taxonomy)
                if (suggestion.category) {
                  updates.push(`category = $${paramIndex++}`);
                  values.push(suggestion.category);
                }

                // Update tags if:
                // 1. AI tags are empty/wrong (always fix)
                // 2. User tags need correction (high confidence required)
                const shouldUpdateTags = suggestion.tags.length > 0 && (
                  !pkg.ai_tags ||
                  pkg.ai_tags.length === 0 ||
                  JSON.stringify(pkg.ai_tags.sort()) !== JSON.stringify(suggestion.tags.sort())
                );

                if (shouldUpdateTags) {
                  // Update AI tags
                  updates.push(`ai_tags = $${paramIndex++}`);
                  values.push(suggestion.tags);

                  // Also fix user tags if confidence is very high (0.85+) and current tags are wrong
                  // This removes improperly tagged packages (e.g., "react" on non-React packages)
                  if (suggestion.confidence >= 0.85 && pkg.tags && pkg.tags.length > 0) {
                    const hasWrongTags = pkg.tags.some((tag: string) =>
                      !suggestion.tags.includes(tag) &&
                      (tag === 'react' || tag === 'tailwind' || tag === 'vue' || tag === 'angular')
                    );

                    if (hasWrongTags) {
                      updates.push(`tags = $${paramIndex++}`);
                      values.push(suggestion.tags);
                      this.server.log.info(
                        { packageId: pkg.id, oldTags: pkg.tags, newTags: suggestion.tags },
                        'Correcting improperly tagged package'
                      );
                    }
                  }
                }

                if (updates.length > 0) {
                  values.push(pkg.id);
                  await this.server.pg.query(`
                    UPDATE packages
                    SET ${updates.join(', ')}, updated_at = NOW()
                    WHERE id = $${paramIndex}
                  `, values);

                  this.server.log.info(
                    {
                      packageId: pkg.id,
                      category: suggestion.category,
                      aiTags: suggestion.tags,
                      userTags: pkg.tags || [],
                      mergedTags: [...new Set([...(pkg.tags || []), ...suggestion.tags])]
                    },
                    'Updated package categorization'
                  );
                  updatedCount++;
                } else {
                  skippedCount++;
                }

                // Rate limiting - wait 100ms between requests
                await new Promise(resolve => setTimeout(resolve, 100));
              } catch (error) {
                this.server.log.error(
                  { packageId: pkg.id, error },
                  'Failed to categorize package'
                );
                skippedCount++;
              }
            }

            this.server.log.info(
              { total: packages.length, updated: updatedCount, skipped: skippedCount },
              '✅ Package auto-categorization completed'
            );
          } catch (error) {
            this.server.log.error(
              { error },
              '❌ Package auto-categorization failed'
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
