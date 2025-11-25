/**
 * Auto-categorize and tag packages using AI
 *
 * This script analyzes packages that don't have categories or tags
 * and uses OpenAI to suggest appropriate categorization.
 *
 * Usage:
 *   npm run script:auto-categorize
 *   npm run script:auto-categorize -- --dry-run
 *   npm run script:auto-categorize -- --limit 50
 */

import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Load .env from app root
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: resolve(__dirname, '../../../.env') });

import pg from 'pg';
import OpenAI from 'openai';

const { Pool } = pg;

interface Package {
  id: string;
  name: string;
  display_name: string | null;
  description: string | null;
  category: string | null;
  tags: string[] | null;
  subtype: string;
  format: string;
}

interface CategorySuggestion {
  category: string;
  tags: string[];
  confidence: number;
  reasoning: string;
}

interface CategoryTree {
  slug: string;
  name: string;
  level: number;
  children?: CategoryTree[];
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const limitIndex = args.indexOf('--limit');
  const limit = limitIndex !== -1 && args[limitIndex + 1]
    ? parseInt(args[limitIndex + 1])
    : 100;

  console.log('🤖 AI-Powered Package Categorization');
  console.log('=====================================\n');

  if (dryRun) {
    console.log('⚠️  DRY RUN MODE - No changes will be saved\n');
  }

  // Step 1: Initialize OpenAI
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is required');
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  // Step 2: Connect to database
  const dbConfig = process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5434'),
        database: process.env.DB_NAME || 'prpm',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
      };

  const db = new Pool(dbConfig);

  try {
    // Step 3: Fetch category taxonomy
    console.log('📂 Fetching category taxonomy...');
    const categoriesResult = await db.query(`
      SELECT slug, name, level, parent_id
      FROM categories
      ORDER BY level, display_order
    `);

    // Build category tree for AI context
    const topLevelCategories = categoriesResult.rows
      .filter((cat: any) => cat.level === 1)
      .map((cat: any) => cat.slug);

    const allCategories = categoriesResult.rows.map((cat: any) => ({
      slug: cat.slug,
      name: cat.name,
      level: cat.level,
    }));

    console.log(`   Found ${topLevelCategories.length} top-level categories`);
    console.log(`   Found ${allCategories.length} total categories\n`);

    // Step 4: Find packages without categories or tags
    console.log(`📦 Finding packages to categorize (limit: ${limit})...`);
    const packagesResult = await db.query(`
      SELECT id, name, display_name, description, category, tags, subtype, format
      FROM packages
      WHERE (category IS NULL OR tags IS NULL OR array_length(tags, 1) = 0)
        AND visibility = 'public'
        AND deprecated = FALSE
      ORDER BY total_downloads DESC
      LIMIT $1
    `, [limit]);

    const packages = packagesResult.rows as Package[];
    console.log(`   Found ${packages.length} packages to process\n`);

    if (packages.length === 0) {
      console.log('✅ All packages are already categorized!');
      return;
    }

    // Step 5: Process packages in batches
    let processedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    for (const pkg of packages) {
      processedCount++;
      console.log(`[${processedCount}/${packages.length}] Processing: ${pkg.name}`);

      try {
        // Prepare package context for AI
        const packageContext = {
          name: pkg.name,
          displayName: pkg.display_name || pkg.name,
          description: pkg.description || 'No description',
          currentCategory: pkg.category,
          currentTags: pkg.tags || [],
          subtype: pkg.subtype,
          format: pkg.format,
        };

        // Call OpenAI to suggest categorization
        const suggestion = await suggestCategorization(
          openai,
          packageContext,
          topLevelCategories,
          allCategories
        );

        if (!suggestion) {
          console.log(`   ⚠️  No suggestion generated, skipping`);
          skippedCount++;
          continue;
        }

        console.log(`   📊 Suggestion: ${suggestion.category}`);
        console.log(`   🏷️  Tags: ${suggestion.tags.join(', ')}`);
        console.log(`   💡 Confidence: ${(suggestion.confidence * 100).toFixed(0)}%`);
        console.log(`   🧠 Reasoning: ${suggestion.reasoning}`);

        // Only update if confidence is high enough
        if (suggestion.confidence < 0.7) {
          console.log(`   ⚠️  Low confidence, skipping update`);
          skippedCount++;
          continue;
        }

        // Update package in database
        if (!dryRun) {
          const updates: string[] = [];
          const values: any[] = [];
          let paramIndex = 1;

          // Only update category if it's not already set
          if (!pkg.category && suggestion.category) {
            updates.push(`category = $${paramIndex++}`);
            values.push(suggestion.category);
          }

          // Only update tags if they're not already set or empty
          if ((!pkg.tags || pkg.tags.length === 0) && suggestion.tags.length > 0) {
            updates.push(`tags = $${paramIndex++}`);
            values.push(suggestion.tags);
          }

          if (updates.length > 0) {
            values.push(pkg.id);
            await db.query(`
              UPDATE packages
              SET ${updates.join(', ')}, updated_at = NOW()
              WHERE id = $${paramIndex}
            `, values);

            console.log(`   ✅ Updated package`);
            updatedCount++;
          } else {
            console.log(`   ℹ️  No updates needed`);
            skippedCount++;
          }
        } else {
          console.log(`   🔍 [DRY RUN] Would update package`);
          updatedCount++;
        }

        // Rate limiting - wait 100ms between requests
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`   ❌ Error processing package: ${error}`);
        skippedCount++;
      }

      console.log('');
    }

    // Summary
    console.log('\n📊 Summary');
    console.log('==========');
    console.log(`   Processed: ${processedCount} packages`);
    console.log(`   Updated:   ${updatedCount} packages`);
    console.log(`   Skipped:   ${skippedCount} packages`);

    if (dryRun) {
      console.log('\n⚠️  DRY RUN - No changes were saved to the database');
    }

  } finally {
    await db.end();
  }

  console.log('\n✅ Done!');
}

async function suggestCategorization(
  openai: OpenAI,
  pkg: any,
  topLevelCategories: string[],
  allCategories: any[]
): Promise<CategorySuggestion | null> {
  const prompt = `You are a package categorization expert. Analyze this package and suggest the best category and tags.

Package Information:
- Name: ${pkg.name}
- Display Name: ${pkg.displayName}
- Description: ${pkg.description}
- Type: ${pkg.format} ${pkg.subtype}
- Current Category: ${pkg.currentCategory || 'None'}
- Current Tags: ${pkg.currentTags.join(', ') || 'None'}

Available Top-Level Categories:
${topLevelCategories.map(cat => `- ${cat}`).join('\n')}

All Available Categories (including subcategories):
${allCategories.slice(0, 50).map((cat: any) => `- ${cat.slug} (level ${cat.level})`).join('\n')}

Instructions:
1. Choose ONE top-level category that best fits this package
2. Suggest 3-5 relevant tags from the available categories/subcategories
3. Provide a confidence score (0.0 to 1.0)
4. Explain your reasoning

Respond ONLY with valid JSON in this exact format:
{
  "category": "category-slug",
  "tags": ["tag1", "tag2", "tag3"],
  "confidence": 0.95,
  "reasoning": "Brief explanation of why these were chosen"
}`;

  try {
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
      return null;
    }

    // Parse JSON response
    const parsed = JSON.parse(content.trim());

    // Validate the response
    if (!parsed.category || !Array.isArray(parsed.tags)) {
      console.warn('Invalid AI response format');
      return null;
    }

    return {
      category: parsed.category,
      tags: parsed.tags.slice(0, 5), // Limit to 5 tags
      confidence: parsed.confidence || 0.5,
      reasoning: parsed.reasoning || 'No reasoning provided',
    };

  } catch (error) {
    console.error('OpenAI API error:', error);
    return null;
  }
}

main().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});
