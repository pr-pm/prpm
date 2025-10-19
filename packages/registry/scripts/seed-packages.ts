/**
 * Seed packages from scraped data into registry database
 * Run: npx tsx scripts/seed-packages.ts
 */

import { Pool } from 'pg';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'prmp_registry',
  user: 'prmp',
  password: 'prmp',
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

    // Load scraped data
    const scrapedFiles = [
      '../../../scraped-claude-skills.json',
      '../../../scraped-darcyegb-agents.json',
      '../../../converted-cursor-skills.json',
      '../../../scraped-packages-additional.json',
      '../../../new-scraped-packages.json',
      '../../../scraped-windsurf-packages.json',
      '../../../scraped-cursor-directory.json',
      '../../../scraped-volt-agent-subagents.json',
      '../../../scraped-additional-agents.json',
      '../../../scraped-mdc-packages.json',
      '../../../scraped-cursor-official-rules.json',
      'seed/new-skills.json', // New troubleshooting skills
      '../../../scraped-mcp-servers-all.json', // MCP servers (108+ servers)
      '../../../scraped-lst97-agents.json',
      '../../../scraped-jhonma82-cursorrules.json',
      '../../../scraped-patrickjs-cursorrules.json',
      '../../../scraped-flyeric-cursorrules.json',
      '../../../scraped-blefnk-cursorrules.json',
      '../../../scraped-aaronontheweb-dotnet.json',
      '../../../scraped-ivangrynenko-cursorrules.json',
    ];

    let totalPackages = 0;

    for (const file of scrapedFiles) {
      const filePath = join(__dirname, file);
      try {
        const data = JSON.parse(readFileSync(filePath, 'utf-8'));
        const packages = Array.isArray(data) ? data : data.packages || [];

        console.log(`\n📦 Processing ${packages.length} packages from ${file}...`);

        for (const pkg of packages) {
          try {
            // Extract author and create namespaced package ID
            // Format: @author/package-name
            const author = (pkg.author || 'unknown')
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
            const packageId = `@${author}/${baseName}`;

            // Map package type to valid database type
            // Valid types: 'cursor', 'claude', 'continue', 'windsurf', 'generic'
            let type = 'generic';

            // Map based on pkg.type
            if (pkg.type === 'agent' || pkg.type === 'skill' || pkg.type === 'claude-skill') {
              type = 'claude';
            } else if (pkg.type === 'cursor' || pkg.type === 'rule') {
              // Check if it's actually a windsurf rule
              if (file.includes('windsurf') || pkg.name?.includes('windsurf') ||
                  pkg.tags?.includes('windsurf') || pkg.tags?.includes('windsurf-rule')) {
                type = 'windsurf';
              } else {
                type = 'cursor';
              }
            } else if (pkg.type === 'continue') {
              type = 'continue';
            } else if (pkg.type === 'windsurf') {
              type = 'windsurf';
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

            // Determine if package is official
            const isOfficial = !!(pkg.official ||
              file.includes('official') ||
              author === 'cursor-directory' ||
              author === 'anthropic');

            // Determine if package is verified
            const isVerified = !!(pkg.verified || pkg.official);

            // Insert package
            await pool.query(
              `INSERT INTO packages (
                id,
                display_name,
                description,
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
              ON CONFLICT (id) DO NOTHING`,
              [
                packageId,
                pkg.name || packageId,
                pkg.description || `${pkg.name} - AI prompt package`,
                type,
                pkg.category || 'general',
                pkg.tags || [],
                pkg.source_url || pkg.url || null,
                'public',
                isVerified,
                isOfficial,  // Now maps to 'featured' column
              ]
            );

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
                packageId,
                '1.0.0',
                `https://registry.prmp.dev/packages/${packageId}/1.0.0.tar.gz`, // placeholder
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

            totalPackages++;
          } catch (err: any) {
            console.error(`  ⚠️  Failed to insert package: ${err.message}`);
          }
        }
      } catch (err: any) {
        console.error(`⚠️  Failed to load ${file}: ${err.message}`);
      }
    }

    console.log(`\n✅ Successfully seeded ${totalPackages} packages!`);

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
  } catch (error: any) {
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
