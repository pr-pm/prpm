#!/usr/bin/env tsx
/**
 * Generate Suggested Test Inputs Script
 *
 * Uses AI to analyze each package and generate curated suggested test inputs
 * that demonstrate the package's capabilities.
 *
 * Usage:
 *   npm run generate-suggested-inputs
 *   npm run generate-suggested-inputs -- --limit 10
 *   npm run generate-suggested-inputs -- --force
 */

import { build } from '../src/server.js';
import Anthropic from '@anthropic-ai/sdk';

interface BatchOptions {
  limit?: number;
  force?: boolean;
  skipErrors?: boolean;
}

interface PackageRow {
  id: string;
  name: string;
  description: string;
  format: string;
  subtype: string;
  category: string;
  content: string;
  author_id: string;
  author_username: string;
}

interface SuggestedInput {
  title: string;
  description: string;
  suggested_input: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimated_credits: number;
  recommended_model?: string;
  display_order: number;
}

const GENERATION_PROMPT = `You are an expert at creating high-quality test examples for AI prompts and packages.

Given this package information, generate 3-5 suggested test inputs that demonstrate the package's capabilities.

Package Name: {{name}}
Description: {{description}}
Format: {{format}}
Subtype: {{subtype}}
Category: {{category}}

Package Content:
\`\`\`
{{content}}
\`\`\`

For each suggested input, provide:
1. **title**: Short, descriptive title (max 100 chars)
2. **description**: Brief explanation of what this example demonstrates (optional, 1-2 sentences)
3. **suggested_input**: The actual input text a user would provide (be specific and realistic)
4. **category**: One of: code-review, documentation, bug-fix, feature, refactoring, testing, general
5. **difficulty**: beginner, intermediate, or advanced
6. **estimated_credits**: Rough estimate of credits needed (1-10)
7. **recommended_model**: Optional - "sonnet", "opus", "gpt-4o", "gpt-4o-mini" if you have a preference

Guidelines:
- Make inputs realistic and specific (not generic like "review my code")
- Cover different use cases and difficulty levels
- Start with simpler examples, progress to more complex
- Inputs should be things users would actually try
- For code-related prompts, include actual code snippets in the input
- For documentation prompts, include actual text to document
- Keep inputs focused and clear

Respond with ONLY valid JSON (no markdown formatting):
{
  "suggested_inputs": [
    {
      "title": "...",
      "description": "...",
      "suggested_input": "...",
      "category": "...",
      "difficulty": "...",
      "estimated_credits": 3,
      "recommended_model": "sonnet",
      "display_order": 0
    }
  ]
}`;

async function generateInputsForPackage(
  pkg: PackageRow,
  anthropic: Anthropic
): Promise<SuggestedInput[]> {
  const prompt = GENERATION_PROMPT
    .replace('{{name}}', pkg.name)
    .replace('{{description}}', pkg.description || 'No description')
    .replace('{{format}}', pkg.format)
    .replace('{{subtype}}', pkg.subtype)
    .replace('{{category}}', pkg.category || 'general')
    .replace('{{content}}', pkg.content.slice(0, 8000)); // Limit content size

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    // Parse JSON response
    const result = JSON.parse(content.text);
    return result.suggested_inputs || [];
  } catch (error: any) {
    console.error(`  ❌ AI generation failed: ${error.message}`);
    throw error;
  }
}

async function getPackages(server: any, limit?: number): Promise<PackageRow[]> {
  const query = `
    SELECT
      p.id,
      p.name,
      p.description,
      p.format,
      p.subtype,
      p.category,
      pv.content,
      p.author_id,
      u.username as author_username
    FROM packages p
    JOIN package_versions pv ON p.id = pv.package_id AND pv.version = p.latest_version
    JOIN users u ON p.author_id = u.id
    WHERE p.deprecated = FALSE
      AND pv.content IS NOT NULL
      AND LENGTH(pv.content) > 50
    ORDER BY p.total_downloads DESC, p.created_at DESC
    ${limit ? `LIMIT ${limit}` : ''}
  `;

  const result = await server.pg.query(query);
  return result.rows;
}

async function saveInputsForPackage(
  server: any,
  packageId: string,
  authorId: string,
  inputs: SuggestedInput[]
): Promise<void> {
  for (const input of inputs) {
    try {
      await server.pg.query(
        `INSERT INTO suggested_test_inputs (
          package_id,
          author_id,
          title,
          description,
          suggested_input,
          category,
          difficulty,
          estimated_credits,
          recommended_model,
          display_order,
          is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, TRUE)
        ON CONFLICT DO NOTHING`,
        [
          packageId,
          authorId,
          input.title,
          input.description || null,
          input.suggested_input,
          input.category || null,
          input.difficulty || 'beginner',
          input.estimated_credits || 1,
          input.recommended_model || null,
          input.display_order || 0,
        ]
      );
    } catch (error: any) {
      console.error(`    ⚠️  Failed to save input "${input.title}": ${error.message}`);
    }
  }
}

async function checkExistingInputs(server: any, packageId: string): Promise<number> {
  const result = await server.pg.query(
    'SELECT COUNT(*) as count FROM suggested_test_inputs WHERE package_id = $1 AND is_active = TRUE',
    [packageId]
  );
  return parseInt(result.rows[0].count, 10);
}

async function main() {
  const args = process.argv.slice(2);
  const options: BatchOptions = {
    limit: undefined,
    force: args.includes('--force'),
    skipErrors: args.includes('--skip-errors'),
  };

  // Parse limit
  const limitIndex = args.indexOf('--limit');
  if (limitIndex >= 0 && args[limitIndex + 1]) {
    options.limit = parseInt(args[limitIndex + 1], 10);
  }

  console.log('🚀 Starting suggested test inputs generation');
  console.log('Options:', options);
  console.log('');

  // Check for API key
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('❌ ANTHROPIC_API_KEY environment variable is required');
    process.exit(1);
  }

  // Build server
  const server = await build();
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  let packagesProcessed = 0;
  let packagesSucceeded = 0;
  let packagesFailed = 0;
  let packagesSkipped = 0;
  let totalInputsGenerated = 0;

  try {
    const packages = await getPackages(server, options.limit);
    console.log(`Found ${packages.length} packages to process\n`);

    for (const pkg of packages) {
      packagesProcessed++;
      console.log(`[${packagesProcessed}/${packages.length}] Processing: ${pkg.name}`);

      try {
        // Check if package already has suggested inputs
        const existingCount = await checkExistingInputs(server, pkg.id);
        if (existingCount > 0 && !options.force) {
          console.log(`  ⏭️  Skipping (already has ${existingCount} inputs, use --force to regenerate)`);
          packagesSkipped++;
          continue;
        }

        // Generate suggested inputs using AI
        console.log('  🤖 Generating inputs with AI...');
        const inputs = await generateInputsForPackage(pkg, anthropic);

        if (inputs.length === 0) {
          console.log('  ⚠️  No inputs generated');
          packagesFailed++;
          continue;
        }

        console.log(`  ✅ Generated ${inputs.length} suggested inputs`);

        // If force mode and existing inputs, delete them first
        if (options.force && existingCount > 0) {
          await server.pg.query(
            'UPDATE suggested_test_inputs SET is_active = FALSE WHERE package_id = $1',
            [pkg.id]
          );
          console.log(`  🗑️  Deactivated ${existingCount} existing inputs`);
        }

        // Save to database
        await saveInputsForPackage(server, pkg.id, pkg.author_id, inputs);
        console.log(`  💾 Saved ${inputs.length} inputs to database`);

        packagesSucceeded++;
        totalInputsGenerated += inputs.length;

        // Show sample
        console.log(`  📝 Sample: "${inputs[0].title}"`);
        console.log('');

        // Rate limit: 50 requests per minute for Claude API
        // Sleep for 1.2 seconds between requests to stay safe
        await new Promise((resolve) => setTimeout(resolve, 1200));
      } catch (error: any) {
        console.error(`  ❌ Failed: ${error.message}`);
        packagesFailed++;

        if (!options.skipErrors) {
          throw error;
        }
        console.log('  ⏭️  Continuing (--skip-errors enabled)\n');
      }
    }

    // Summary
    console.log('');
    console.log('═══════════════════════════════════════');
    console.log('📊 Summary');
    console.log('═══════════════════════════════════════');
    console.log(`Packages processed:  ${packagesProcessed}`);
    console.log(`Packages succeeded:  ${packagesSucceeded}`);
    console.log(`Packages skipped:    ${packagesSkipped}`);
    console.log(`Packages failed:     ${packagesFailed}`);
    console.log(`Total inputs:        ${totalInputsGenerated}`);
    console.log(`Average per package: ${packagesSucceeded > 0 ? (totalInputsGenerated / packagesSucceeded).toFixed(1) : 0}`);
    console.log('═══════════════════════════════════════');

    if (packagesFailed > 0 && !options.skipErrors) {
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  } finally {
    await server.close();
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
