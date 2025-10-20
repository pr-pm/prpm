/**
 * Seed packages from scraped data into registry database
 * Run: npx tsx scripts/seed-packages.ts
 */

import { config } from 'dotenv';
import { Pool } from 'pg';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file from registry root
config({ path: join(__dirname, '..', '.env') });

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://prpm:prpm@localhost:5434/prpm';

const pool = new Pool({
  connectionString: DATABASE_URL,
});

interface ScrapedPackage {
  id?: string;
  name: string;
  description?: string;
  content?: string;
  author?: string;
  tags?: string[];
  category?: string;
  type?: string;
  source_url?: string;
}

async function seedPackages() {
  try {
    console.log('🌱 Starting package seeding...');

    // Load scraped data from centralized data directory
    const scrapedFiles = [
      '../../../data/scraped/scraped-claude-skills.json',
      '../../../data/scraped/scraped-darcyegb-agents.json',
      '../../../data/scraped/converted-cursor-skills.json', // Converted cursor skills with proper IDs
      '../../../data/scraped/scraped-packages-additional.json',
      '../../../data/scraped/new-scraped-packages.json',
      '../../../data/scraped/scraped-windsurf-packages.json',
      '../../../data/scraped/scraped-volt-agent-subagents.json',
      '../../../data/scraped/scraped-additional-agents.json',
      '../../../data/scraped/scraped-mdc-packages.json',
      '../../../data/scraped/scraped-lst97-agents.json',
      '../../../data/scraped/converted-cursor-rules-all.json', // 553 cursor rules with content
      '../../../data/scraped/scraped-mcp-servers-official.json', // Official MCP servers
      '../../../data/scraped/scraped-aaronontheweb-dotnet.json',
      '../../../data/scraped/scraped-jhonma82-cursorrules.json',
      '../../../data/scraped/scraped-blefnk-cursorrules.json',
      '../../../data/scraped/scraped-patrickjs-cursorrules.json',
      '../../../data/scraped/scraped-ivangrynenko-cursorrules.json',
      '../../../data/scraped/scraped-flyeric-cursorrules.json',
      '../../../data/scraped/scraped-cursor-directory.json',
      '../../../data/scraped/scraped-cursor-official-rules.json',
      '../../../data/scraped/prpm-beanstalk-packages.json', // PRPM team AWS Beanstalk packages
      '../../../scraped-claude-agents.json', // Claude agents and slash commands
    ];

    let totalPackages = 0;
    let totalAttempted = 0;
    let totalSkipped = 0;

    for (const file of scrapedFiles) {
      const filePath = join(__dirname, file);
      try {
        const data = JSON.parse(readFileSync(filePath, 'utf-8'));
        const packages = Array.isArray(data) ? data : data.packages || [];

        console.log(`\n📦 Processing ${packages.length} packages from ${file}...`);

        for (const pkg of packages) {
          totalAttempted++;
          try {
            // Determine package ID
            let packageId: string;

            // If pkg.id already looks like a proper namespaced package (starts with @scope/),
            // use it as-is (for MCP packages and others that already have proper IDs)
            if (pkg.id && pkg.id.startsWith('@') && pkg.id.includes('/')) {
              packageId = pkg.id;
            } else {
              // Extract author and create namespaced package ID
              // Format: @author/package-name
              // Try author_id first (with @ sign), then author, then fallback to unknown
              let authorRaw = pkg.author_id || pkg.author || 'unknown';
              // Remove @ prefix if it exists
              if (authorRaw.startsWith('@')) {
                authorRaw = authorRaw.substring(1);
              }
              const author = authorRaw
                .toLowerCase()
                .replace(/[^a-z0-9-]/g, '-')
                .replace(/-+/g, '-')
                .substring(0, 50);

              const baseName = (pkg.id || pkg.name || `package-${totalPackages}`)
                .toLowerCase()
                .replace(/[^a-z0-9-]/g, '-')
                .replace(/-+/g, '-')
                // Remove author prefix if it exists (e.g., jhonma82-, cursor-, claude-)
                .replace(/^(jhonma82-|cursor-|claude-|windsurf-|lst97-)/g, '')
                .substring(0, 80);

              // Create namespaced ID: @author/package
              packageId = `@${author}/${baseName}`;
            }

            // Extract author from packageId for author_id field
            const author = packageId.split('/')[0].substring(1); // Remove @ and get scope

            // Map package type to valid database type
            // Valid types: 'cursor', 'claude', 'claude-skill', 'claude-agent', 'claude-slash-command', 'continue', 'windsurf', 'generic', 'mcp'
            let type = 'generic';

            // Initialize tags array
            let tags = Array.isArray(pkg.tags) ? [...pkg.tags] : [];

            // Map based on pkg.type and tags
            if (pkg.type === 'claude-agent' || tags.includes('claude-agent')) {
              type = 'claude-agent';
              if (!tags.includes('agent')) {
                tags.push('agent');
              }
            } else if (pkg.type === 'claude-slash-command' || tags.includes('claude-slash-command') || tags.includes('slash-command')) {
              type = 'claude-slash-command';
              if (!tags.includes('slash-command')) {
                tags.push('slash-command');
              }
            } else if (pkg.type === 'claude-skill' || tags.includes('claude-skill') ||
                pkg.name?.includes('claude-skill') || pkg.name?.includes('skill-')) {
              type = 'claude-skill';
              if (!tags.includes('claude-skill')) {
                tags.push('claude-skill');
              }
            } else if (pkg.type === 'agent' || pkg.type === 'skill' || file.includes('agent')) {
              // Agents (without skill tag)
              type = 'claude';
            } else if (pkg.type === 'cursor' || pkg.type === 'rule') {
              // Check if it's actually a windsurf rule
              if (file.includes('windsurf') || pkg.name?.includes('windsurf') ||
                  tags.includes('windsurf') || tags.includes('windsurf-rule')) {
                type = 'windsurf';
              } else {
                type = 'cursor';
              }
            } else if (pkg.type === 'continue') {
              type = 'continue';
            } else if (pkg.type === 'windsurf') {
              type = 'windsurf';
            } else if (pkg.type === 'mcp' || file.includes('mcp') || tags.includes('mcp')) {
              type = 'mcp';
              if (!tags.includes('mcp')) {
                tags.push('mcp');
              }
            }

            // Fallback based on filename
            if (type === 'generic') {
              if (file.includes('claude') || file.includes('agent')) {
                type = 'claude';
              } else if (file.includes('windsurf')) {
                type = 'windsurf';
              } else if (file.includes('cursor')) {
                type = 'cursor';
              } else if (file.includes('continue')) {
                type = 'continue';
              }
            }

            // Add 'meta' tag for packages about writing skills/rules/agents
            const name = pkg.name?.toLowerCase() || '';
            const desc = pkg.description?.toLowerCase() || '';
            if (name.includes('writing') && (name.includes('skill') || name.includes('rule') || name.includes('agent')) ||
                desc.includes('writing skill') || desc.includes('writing rule') || desc.includes('create skill') || desc.includes('create rule')) {
              if (!tags.includes('meta')) {
                tags.push('meta');
              }
            }

            // Determine if package is official
            const isOfficial = !!(pkg.official ||
              file.includes('official') ||
              author === 'cursor-directory' ||
              author === 'anthropic');

            // Determine if package is verified
            const isVerified = !!(pkg.verified || pkg.official);

            // Create or get user for this author (using author name as username)
            // For seeding, we create stub users with no email (they can claim and set it later)
            let authorUserId: string | null = null;
            try {
              const userResult = await pool.query(
                `INSERT INTO users (username, verified_author, created_at, updated_at)
                 VALUES ($1, $2, NOW(), NOW())
                 ON CONFLICT (username) DO UPDATE SET updated_at = NOW()
                 RETURNING id`,
                [author, isVerified]
              );
              authorUserId = userResult.rows[0]?.id || null;
            } catch (err) {
              console.error(`  ⚠️  Failed to create/get user for author ${author}: ${err instanceof Error ? err.message : String(err)}`);
            }

            // Insert package
            const pkgResult = await pool.query(
              `INSERT INTO packages (
                name,
                description,
                author_id,
                type,
                category,
                tags,
                repository_url,
                visibility,
                verified,
                featured,
                created_at,
                updated_at
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
              ON CONFLICT (name) DO NOTHING
              RETURNING id`,
              [
                packageId,
                pkg.description || `${pkg.name} - AI prompt package`,
                authorUserId,
                type,
                pkg.category || 'general',
                tags,
                pkg.source_url || pkg.url || null,
                'public',
                isVerified,
                isOfficial,  // Now maps to 'featured' column
              ]
            );

            // If package already exists, skip version insert
            if (pkgResult.rows.length === 0) {
              totalSkipped++;
              continue;
            }

            // Get the UUID package_id from the insert result
            const dbPackageId = pkgResult.rows[0].id;

            // Insert initial version (using metadata to store content)
            await pool.query(
              `INSERT INTO package_versions (
                package_id,
                version,
                tarball_url,
                content_hash,
                file_size,
                changelog,
                metadata,
                published_at
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
              ON CONFLICT (package_id, version) DO NOTHING`,
              [
                dbPackageId,
                '1.0.0',
                `https://registry.prpm.dev/packages/${packageId}/1.0.0.tar.gz`, // placeholder
                'placeholder-hash',
                (pkg.content?.length || 0),
                'Initial version',
                JSON.stringify({
                  content: pkg.content || pkg.description || '',
                  sourceUrl: pkg.sourceUrl || pkg.source_url || pkg.url || null,
                  originalType: pkg.type,
                }),
              ]
            );

            // Update version_count for the package
            await pool.query(
              `UPDATE packages
               SET version_count = (SELECT COUNT(*) FROM package_versions WHERE package_id = $1)
               WHERE id = $1`,
              [dbPackageId]
            );

            totalPackages++;
          } catch (err: unknown) {
            const error = err instanceof Error ? err : new Error(String(err));
            console.error(`  ⚠️  Failed to insert package: ${error.message}`);
            totalSkipped++;
          }
        }
      } catch (err: unknown) {
        const error = err instanceof Error ? err : new Error(String(err));
        console.error(`⚠️  Failed to load ${file}: ${error.message}`);
      }
    }

    console.log(`\n✅ Successfully seeded ${totalPackages} packages!`);
    console.log(`⏭️  Skipped ${totalSkipped} duplicates`);
    console.log(`📋 Total attempted: ${totalAttempted}`);

    // Show stats
    const stats = await pool.query(`
      SELECT
        type,
        COUNT(*) as count,
        COUNT(DISTINCT category) as categories
      FROM packages
      GROUP BY type
      ORDER BY count DESC
    `);

    console.log('\n📊 Package Statistics:');
    stats.rows.forEach((row) => {
      console.log(`  ${row.type}: ${row.count} packages, ${row.categories} categories`);
    });

    const total = await pool.query('SELECT COUNT(*) as count FROM packages');
    console.log(`\n📦 Total packages in registry: ${total.rows[0].count}`);
  } catch (error: unknown) {
    console.error('❌ Seed failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

seedPackages().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
