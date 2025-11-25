/**
 * Unified AI Package Enrichment Service
 *
 * Combines category suggestion, tag generation, and use case creation
 * into a single OpenAI API call for efficiency and consistency.
 */

import type { FastifyInstance } from 'fastify';
import OpenAI from 'openai';

interface Package {
  id: string;
  name: string;
  display_name?: string;
  description: string | null;
  format: string;
  subtype: string;
  category: string | null;
  tags: string[];
  ai_tags: string[] | null;
  readme?: string | null;
}

interface EnrichmentResult {
  category: string;
  tags: string[];
  useCases: string[];
  confidence: number;
  reasoning: string;
}

interface PackageEnrichmentResult {
  packageId: string;
  packageName: string;
  success: boolean;
  enrichment?: EnrichmentResult;
  error?: string;
}

export class AIPackageEnrichmentService {
  private server: FastifyInstance;
  private openai: OpenAI | null = null;
  private readonly BATCH_SIZE = 10;
  private availableCategories: string[] = [];
  private categoryMap: Map<string, { name: string; level: number }> = new Map();

  constructor(server: FastifyInstance) {
    this.server = server;

    // Initialize OpenAI client if API key is available
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    } else {
      this.server.log.warn('OpenAI API key not configured - AI enrichment disabled');
    }
  }

  /**
   * Load available categories from database
   */
  private async loadCategories(): Promise<void> {
    try {
      const result = await this.server.pg.query(`
        SELECT slug, name, level
        FROM taxonomy_categories
        WHERE is_active = TRUE
        ORDER BY level ASC, name ASC
      `);

      this.availableCategories = result.rows.map((cat: any) => cat.slug);
      this.categoryMap = new Map(
        result.rows.map((cat: any) => [cat.slug, { name: cat.name, level: cat.level }])
      );

      this.server.log.info(
        { categoryCount: this.availableCategories.length },
        'Loaded categories for AI enrichment'
      );
    } catch (error) {
      this.server.log.error({ error }, 'Failed to load categories');
      throw error;
    }
  }

  /**
   * Enrich packages that need AI metadata
   */
  async enrichPendingPackages(): Promise<number> {
    if (!this.openai) {
      this.server.log.warn('OpenAI not configured - skipping enrichment');
      return 0;
    }

    // Load categories if not already loaded
    if (this.availableCategories.length === 0) {
      await this.loadCategories();
    }

    try {
      // Get packages that need enrichment
      const result = await this.server.pg.query<Package>(
        `SELECT id, name, display_name, description, format, subtype,
                category, tags, ai_tags, readme
         FROM packages
         WHERE ai_enrichment_needed = TRUE
           AND visibility = 'public'
           AND deprecated = FALSE
         ORDER BY total_downloads DESC
         LIMIT $1`,
        [this.BATCH_SIZE]
      );

      const packages = result.rows;

      if (packages.length === 0) {
        this.server.log.info('No packages need AI enrichment');
        return 0;
      }

      this.server.log.info(
        { count: packages.length },
        'Enriching packages with AI metadata'
      );

      // Enrich each package
      let successCount = 0;
      for (const pkg of packages) {
        const result = await this.enrichPackage(pkg);
        if (result.success) {
          successCount++;
        }

        // Rate limiting - wait 1 second between requests
        await this.sleep(1000);
      }

      return successCount;
    } catch (error) {
      this.server.log.error({ error }, 'Failed to enrich pending packages');
      throw error;
    }
  }

  /**
   * Enrich a specific package with AI metadata
   */
  async enrichPackage(pkg: Package): Promise<PackageEnrichmentResult> {
    if (!this.openai) {
      return {
        packageId: pkg.id,
        packageName: pkg.name,
        success: false,
        error: 'OpenAI not configured',
      };
    }

    try {
      const prompt = this.buildEnrichmentPrompt(pkg);

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an expert at analyzing software packages and generating metadata.
Your task is to analyze a package and provide: category, tags, and practical use cases.
Be strict and accurate - only suggest tags that are directly relevant.
Always respond with valid JSON in the exact format specified.`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 800,
        response_format: { type: 'json_object' },
      });

      const responseText = completion.choices[0]?.message?.content?.trim();
      if (!responseText) {
        throw new Error('Empty response from OpenAI');
      }

      // Parse the JSON response
      const enrichment = JSON.parse(responseText) as EnrichmentResult;

      // Validate the response structure
      if (!enrichment.category || !enrichment.tags || !enrichment.useCases) {
        throw new Error('Invalid response structure - missing required fields');
      }

      // Validate category exists
      if (!this.availableCategories.includes(enrichment.category)) {
        this.server.log.warn(
          { packageId: pkg.id, suggestedCategory: enrichment.category },
          'AI suggested invalid category, using fallback'
        );
        enrichment.category = this.getFallbackCategory(pkg.format, pkg.subtype);
      }

      // Limit tags to 5
      enrichment.tags = enrichment.tags.slice(0, 5);

      // Limit use cases to 5 and ensure length
      enrichment.useCases = enrichment.useCases
        .slice(0, 5)
        .map((uc) => (uc.length > 100 ? uc.substring(0, 97) + '...' : uc));

      // Store enrichment in database
      await this.storeEnrichment(pkg.id, enrichment);

      this.server.log.info(
        {
          packageId: pkg.id,
          packageName: pkg.name,
          category: enrichment.category,
          tagCount: enrichment.tags.length,
          useCaseCount: enrichment.useCases.length,
          confidence: enrichment.confidence,
        },
        'Package enriched successfully'
      );

      return {
        packageId: pkg.id,
        packageName: pkg.name,
        success: true,
        enrichment,
      };
    } catch (error: any) {
      this.server.log.error(
        { error, packageId: pkg.id, packageName: pkg.name },
        'Failed to enrich package'
      );

      return {
        packageId: pkg.id,
        packageName: pkg.name,
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Build the enrichment prompt for a package
   */
  private buildEnrichmentPrompt(pkg: Package): string {
    const topLevelCategories = Array.from(this.categoryMap.entries())
      .filter(([_, info]) => info.level === 0)
      .map(([slug, _]) => slug);

    const parts: string[] = [];

    parts.push('# Package Information\n');
    parts.push(`- Name: ${pkg.name}`);
    parts.push(`- Display Name: ${pkg.display_name || pkg.name}`);
    parts.push(`- Description: ${pkg.description || 'No description'}`);
    parts.push(`- Type: ${pkg.format} ${pkg.subtype}`);
    parts.push(`- Current Category: ${pkg.category || 'None'}`);
    parts.push(`- User Tags: ${pkg.tags?.join(', ') || 'None'}`);
    parts.push(`- Current AI Tags: ${pkg.ai_tags?.join(', ') || 'None'}`);

    // Add README excerpt if available
    if (pkg.readme) {
      const readmeSnippet = pkg.readme.substring(0, 800);
      parts.push(`\n## README Excerpt\n${readmeSnippet}...`);
    }

    parts.push('\n# Available Categories\n');
    parts.push('## Top-Level Categories:');
    parts.push(topLevelCategories.join(', '));
    parts.push('\n## All Categories (including subcategories):');
    parts.push(this.availableCategories.slice(0, 50).join(', ')); // Limit to avoid token overflow

    parts.push('\n# Your Task\n');
    parts.push('Analyze this package and provide:');
    parts.push('1. **Category**: Choose ONE category that best fits (must be from available categories)');
    parts.push('2. **Tags**: Suggest 3-5 relevant tags (be strict - only truly relevant tags)');
    parts.push('   - Avoid generic tags like "react" unless package specifically helps with React');
    parts.push('   - Focus on what the package actually does');
    parts.push('   - Review existing AI tags and fix/remove incorrect ones');
    parts.push('3. **Use Cases**: Generate 3-5 practical use case scenarios (max 100 chars each)');
    parts.push('   - Write as specific, actionable sentences');
    parts.push('   - Example: "Enforce consistent code style for React components"');
    parts.push('4. **Confidence**: Rate your confidence (0.0 to 1.0)');
    parts.push('5. **Reasoning**: Briefly explain your choices\n');

    parts.push('# Response Format (JSON)\n');
    parts.push('Respond ONLY with valid JSON in this exact structure:');
    parts.push('```json');
    parts.push('{');
    parts.push('  "category": "category-slug",');
    parts.push('  "tags": ["tag1", "tag2", "tag3"],');
    parts.push('  "useCases": [');
    parts.push('    "Use case scenario 1",');
    parts.push('    "Use case scenario 2",');
    parts.push('    "Use case scenario 3"');
    parts.push('  ],');
    parts.push('  "confidence": 0.95,');
    parts.push('  "reasoning": "Brief explanation of choices"');
    parts.push('}');
    parts.push('```');

    return parts.join('\n');
  }

  /**
   * Store enrichment results in database
   */
  private async storeEnrichment(
    packageId: string,
    enrichment: EnrichmentResult
  ): Promise<void> {
    await this.server.pg.query(
      `UPDATE packages
       SET category = $1,
           ai_tags = $2,
           ai_use_cases = $3,
           ai_enrichment_completed_at = NOW(),
           ai_enrichment_needed = FALSE,
           ai_use_cases_generated_at = NOW()
       WHERE id = $4`,
      [enrichment.category, enrichment.tags, enrichment.useCases, packageId]
    );
  }

  /**
   * Get fallback category based on format/subtype
   */
  private getFallbackCategory(format: string, subtype: string): string {
    // Map common format/subtype combinations to categories
    const fallbackMap: Record<string, string> = {
      'claude-skill': 'productivity',
      'claude-hook': 'development',
      'cursor-rule': 'code-generation',
      'mcp-tool': 'integrations',
    };

    const key = `${format}-${subtype}`;
    return fallbackMap[key] || 'general-purpose';
  }

  /**
   * Regenerate enrichment for stale packages (older than 90 days)
   */
  async regenerateStaleEnrichments(): Promise<number> {
    if (!this.openai) {
      return 0;
    }

    if (this.availableCategories.length === 0) {
      await this.loadCategories();
    }

    try {
      // Get packages with stale enrichments
      const result = await this.server.pg.query<Package>(
        `SELECT id, name, display_name, description, format, subtype,
                category, tags, ai_tags, readme
         FROM packages
         WHERE ai_enrichment_completed_at < NOW() - INTERVAL '90 days'
           AND visibility = 'public'
           AND deprecated = FALSE
         ORDER BY total_downloads DESC
         LIMIT $1`,
        [this.BATCH_SIZE]
      );

      const packages = result.rows;

      if (packages.length === 0) {
        return 0;
      }

      this.server.log.info(
        { count: packages.length },
        'Regenerating stale package enrichments'
      );

      let successCount = 0;
      for (const pkg of packages) {
        const result = await this.enrichPackage(pkg);
        if (result.success) {
          successCount++;
        }
        await this.sleep(1000);
      }

      return successCount;
    } catch (error) {
      this.server.log.error({ error }, 'Failed to regenerate stale enrichments');
      throw error;
    }
  }

  /**
   * Get enrichment statistics
   */
  async getStatistics(): Promise<{
    totalPackages: number;
    enrichedPackages: number;
    pendingPackages: number;
    stalePackages: number;
    enrichmentPercentage: number;
  }> {
    const result = await this.server.pg.query(`
      SELECT
        COUNT(*) as total,
        COUNT(ai_enrichment_completed_at) as enriched,
        COUNT(*) FILTER (WHERE ai_enrichment_needed = TRUE) as pending,
        COUNT(*) FILTER (
          WHERE ai_enrichment_completed_at IS NOT NULL
            AND ai_enrichment_completed_at < NOW() - INTERVAL '90 days'
        ) as stale
      FROM packages
      WHERE visibility = 'public' AND deprecated = FALSE
    `);

    const stats = result.rows[0];
    const total = parseInt(stats.total);
    const enriched = parseInt(stats.enriched);
    const pending = parseInt(stats.pending);
    const stale = parseInt(stats.stale);

    return {
      totalPackages: total,
      enrichedPackages: enriched,
      pendingPackages: pending,
      stalePackages: stale,
      enrichmentPercentage: total > 0 ? (enriched / total) * 100 : 0,
    };
  }

  /**
   * Sleep helper for rate limiting
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
