/**
 * AI Use Case Generator Service
 *
 * Generates practical use cases for packages using OpenAI API.
 * Use cases help users understand when and how to use a package.
 */

import type { FastifyInstance } from 'fastify';
import OpenAI from 'openai';

interface Package {
  id: string;
  name: string;
  description: string | null;
  format: string;
  subtype: string;
  category: string | null;
  tags: string[];
  readme?: string | null;
}

interface UseCaseGenerationResult {
  packageId: string;
  useCases: string[];
  success: boolean;
  error?: string;
}

export class UseCaseGeneratorService {
  private server: FastifyInstance;
  private openai: OpenAI | null = null;
  private readonly BATCH_SIZE = 10;
  private readonly MAX_USE_CASES = 5;

  constructor(server: FastifyInstance) {
    this.server = server;

    // Initialize OpenAI client if API key is available
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    } else {
      this.server.log.warn('OpenAI API key not configured - use case generation disabled');
    }
  }

  /**
   * Generate use cases for packages that don't have them
   */
  async generateMissingUseCases(): Promise<number> {
    if (!this.openai) {
      this.server.log.warn('OpenAI not configured - skipping use case generation');
      return 0;
    }

    try {
      // Get packages without use cases
      const result = await this.server.pg.query<Package>(
        `SELECT id, name, description, format, subtype, category, tags, readme
         FROM packages
         WHERE ai_use_cases IS NULL
            OR array_length(ai_use_cases, 1) IS NULL
         ORDER BY total_downloads DESC
         LIMIT $1`,
        [this.BATCH_SIZE]
      );

      const packages = result.rows;

      if (packages.length === 0) {
        this.server.log.info('No packages need use case generation');
        return 0;
      }

      this.server.log.info(
        { count: packages.length },
        'Generating use cases for packages'
      );

      // Generate use cases for each package
      let successCount = 0;
      for (const pkg of packages) {
        const result = await this.generateUseCasesForPackage(pkg);
        if (result.success) {
          successCount++;
        }

        // Rate limiting - wait 1 second between requests
        await this.sleep(1000);
      }

      return successCount;
    } catch (error) {
      this.server.log.error({ error }, 'Failed to generate missing use cases');
      throw error;
    }
  }

  /**
   * Regenerate use cases for packages older than 30 days
   */
  async regenerateStaleUseCases(): Promise<number> {
    if (!this.openai) {
      return 0;
    }

    try {
      // Get packages with use cases older than 30 days
      const result = await this.server.pg.query<Package>(
        `SELECT id, name, description, format, subtype, category, tags, readme
         FROM packages
         WHERE ai_use_cases_generated_at < NOW() - INTERVAL '30 days'
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
        'Regenerating stale use cases'
      );

      let successCount = 0;
      for (const pkg of packages) {
        const result = await this.generateUseCasesForPackage(pkg);
        if (result.success) {
          successCount++;
        }
        await this.sleep(1000);
      }

      return successCount;
    } catch (error) {
      this.server.log.error({ error }, 'Failed to regenerate stale use cases');
      throw error;
    }
  }

  /**
   * Generate use cases for a specific package
   */
  private async generateUseCasesForPackage(
    pkg: Package
  ): Promise<UseCaseGenerationResult> {
    if (!this.openai) {
      return {
        packageId: pkg.id,
        useCases: [],
        success: false,
        error: 'OpenAI not configured',
      };
    }

    try {
      const prompt = this.buildPrompt(pkg);

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are a helpful assistant that generates practical use cases for AI coding packages. Generate 3-5 specific, actionable use cases. Each use case should be a single sentence (max 100 characters) describing a practical scenario.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 300,
      });

      const responseText = completion.choices[0]?.message?.content?.trim();
      if (!responseText) {
        throw new Error('Empty response from OpenAI');
      }

      // Parse use cases from response
      const useCases = this.parseUseCases(responseText);

      if (useCases.length === 0) {
        throw new Error('No use cases parsed from response');
      }

      // Store use cases in database
      await this.server.pg.query(
        `UPDATE packages
         SET ai_use_cases = $1,
             ai_use_cases_generated_at = NOW()
         WHERE id = $2`,
        [useCases, pkg.id]
      );

      this.server.log.debug(
        { packageId: pkg.id, packageName: pkg.name, useCaseCount: useCases.length },
        'Generated use cases for package'
      );

      return {
        packageId: pkg.id,
        useCases,
        success: true,
      };
    } catch (error: any) {
      this.server.log.error(
        { error, packageId: pkg.id, packageName: pkg.name },
        'Failed to generate use cases for package'
      );

      return {
        packageId: pkg.id,
        useCases: [],
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Build prompt for use case generation
   */
  private buildPrompt(pkg: Package): string {
    const parts: string[] = [];

    parts.push(`Package: ${pkg.name}`);

    if (pkg.description) {
      parts.push(`Description: ${pkg.description}`);
    }

    parts.push(`Type: ${pkg.format}-${pkg.subtype}`);

    if (pkg.category) {
      parts.push(`Category: ${pkg.category}`);
    }

    if (pkg.tags && pkg.tags.length > 0) {
      parts.push(`Tags: ${pkg.tags.join(', ')}`);
    }

    // Add a small snippet of README if available (first 500 chars)
    if (pkg.readme) {
      const readmeSnippet = pkg.readme.substring(0, 500);
      parts.push(`\nREADME excerpt:\n${readmeSnippet}...`);
    }

    parts.push('\nGenerate 3-5 practical use cases for this package. Each use case should be:');
    parts.push('- A specific scenario where this package would be useful');
    parts.push('- Written as a short sentence (max 100 characters)');
    parts.push('- Actionable and concrete');
    parts.push('\nFormat: Return each use case on a new line, no numbering or bullets.');

    return parts.join('\n');
  }

  /**
   * Parse use cases from AI response
   */
  private parseUseCases(response: string): string[] {
    // Split by newlines and clean up
    const lines = response
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      // Remove numbering (1., 2., etc.) or bullets (-, *, •)
      .map((line) => line.replace(/^[\d]+\.?\s*|^[-*•]\s*/, ''))
      .filter((line) => line.length > 0)
      // Limit length to 100 characters
      .map((line) => (line.length > 100 ? line.substring(0, 97) + '...' : line))
      // Take max 5 use cases
      .slice(0, this.MAX_USE_CASES);

    return lines;
  }

  /**
   * Sleep helper for rate limiting
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get statistics about use case coverage
   */
  async getStatistics(): Promise<{
    totalPackages: number;
    packagesWithUseCases: number;
    packagesWithoutUseCases: number;
    coveragePercentage: number;
  }> {
    const result = await this.server.pg.query(`
      SELECT
        COUNT(*) as total,
        COUNT(ai_use_cases) FILTER (WHERE array_length(ai_use_cases, 1) > 0) as with_use_cases,
        COUNT(*) FILTER (WHERE ai_use_cases IS NULL OR array_length(ai_use_cases, 1) IS NULL) as without_use_cases
      FROM packages
    `);

    const stats = result.rows[0];
    const total = parseInt(stats.total);
    const withUseCases = parseInt(stats.with_use_cases);
    const withoutUseCases = parseInt(stats.without_use_cases);

    return {
      totalPackages: total,
      packagesWithUseCases: withUseCases,
      packagesWithoutUseCases: withoutUseCases,
      coveragePercentage: total > 0 ? (withUseCases / total) * 100 : 0,
    };
  }
}
