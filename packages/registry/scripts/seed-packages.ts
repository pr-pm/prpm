/**
 * Seed packages from scraped data into registry database
 * Run: npx tsx scripts/seed-packages.ts
 */

import { Pool } from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';

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
      '../../scraped-claude-skills.json',
      '../../scraped-darcyegb-agents.json',
      '../../converted-cursor-skills.json',
      '../../scraped-packages-additional.json',
      '../../new-scraped-packages.json',
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
            // Generate package ID from name
            const packageId = (pkg.id || pkg.name || `package-${totalPackages}`)
              .toLowerCase()
              .replace(/[^a-z0-9-]/g, '-')
              .replace(/-+/g, '-')
              .substring(0, 100);

            // Determine package type
            let type = pkg.type || 'cursor';
            if (file.includes('claude-skills') || file.includes('agents')) {
              type = 'agent';
            } else if (file.includes('cursor')) {
              type = 'cursor';
            }

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
                created_at,
                updated_at
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
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
                false,
              ]
            );

            // Insert initial version
            await pool.query(
              `INSERT INTO package_versions (
                package_id,
                version,
                content,
                changelog,
                published_at,
                created_at
              ) VALUES ($1, $2, $3, $4, NOW(), NOW())
              ON CONFLICT (package_id, version) DO NOTHING`,
              [
                packageId,
                '1.0.0',
                pkg.content || pkg.description || '',
                'Initial version',
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
