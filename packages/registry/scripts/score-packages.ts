#!/usr/bin/env node
/**
 * Update quality scores for all packages
 * Run: cd packages/registry && npx tsx scripts/score-packages.ts
 */

import { config } from 'dotenv';
import pg from 'pg';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: join(__dirname, '..', '.env') });

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://prpm:prpm@localhost:5432/prpm_registry';
const pool = new Pool({ connectionString: DATABASE_URL });

// Simple quality scoring function
function calculateScore(pkg: any): number {
  let score = 0;

  // Content quality (2.0 max)
  if (pkg.description && pkg.description.length > 20) score += 0.3;
  if (pkg.description && pkg.description.length >= 100 && pkg.description.length <= 500) score += 0.3;
  if (pkg.documentation_url) score += 0.4;
  if (pkg.repository_url) score += 0.3;
  if (pkg.homepage_url) score += 0.2;
  if (pkg.keywords && pkg.keywords.length > 0) score += 0.2;
  if (pkg.tags && pkg.tags.length >= 3) score += 0.3;

  // Author credibility (1.5 max)
  if (pkg.verified) score += 0.5;
  if (pkg.official) score += 0.7;

  // Engagement (1.0 max)
  if (pkg.total_downloads >= 500) score += 0.4;
  else if (pkg.total_downloads >= 200) score += 0.35;
  else if (pkg.total_downloads >= 100) score += 0.3;
  else if (pkg.total_downloads >= 50) score += 0.25;
  else if (pkg.total_downloads >= 25) score += 0.2;
  else if (pkg.total_downloads >= 10) score += 0.15;
  else if (pkg.total_downloads >= 5) score += 0.1;
  else if (pkg.total_downloads > 0) score += 0.05;

  if (pkg.stars >= 20) score += 0.3;
  else if (pkg.stars >= 5) score += 0.2;
  else if (pkg.stars > 0) score += 0.1;

  if (pkg.rating_average && pkg.rating_count >= 3) {
    score += (pkg.rating_average / 5.0) * 0.3;
  }

  // Maintenance (0.5 max)
  const daysSince = (Date.now() - new Date(pkg.last_published_at || pkg.created_at).getTime()) / (1000 * 60 * 60 * 24);
  if (daysSince <= 30) score += 0.3;
  else if (daysSince <= 90) score += 0.2;
  else if (daysSince <= 180) score += 0.1;
  else score += 0.05;

  if (pkg.version_count >= 3) score += 0.2;
  else if (pkg.version_count === 2) score += 0.1;

  return Math.min(5.0, Math.max(0, Math.round(score * 100) / 100));
}

async function main() {
  console.log('🎯 Updating quality scores for all packages...\n');

  try {
    // Get type distribution
    const typesResult = await pool.query(
      'SELECT DISTINCT type, COUNT(*) as count FROM packages GROUP BY type ORDER BY count DESC'
    );

    console.log('📊 Package distribution by type:');
    typesResult.rows.forEach((row: any) => {
      console.log(`   ${row.type}: ${row.count} packages`);
    });

    // Get all packages
    const result = await pool.query(`
      SELECT
        id, display_name, description, documentation_url, repository_url,
        homepage_url, keywords, tags, author_id, verified, official,
        total_downloads, stars, rating_average, rating_count, version_count,
        last_published_at, created_at
      FROM packages
    `);

    // Get author package counts
    const authorResult = await pool.query(`
      SELECT author_id, COUNT(*) as count
      FROM packages
      WHERE visibility = 'public'
      GROUP BY author_id
    `);

    const authorCounts = new Map(authorResult.rows.map((r: any) => [r.author_id, parseInt(r.count)]));

    const total = result.rows.length;
    let updated = 0;
    let failed = 0;

    console.log(`\n🔄 Processing ${total} packages...\n`);

    for (let i = 0; i < result.rows.length; i++) {
      const pkg = result.rows[i];

      try {
        let score = calculateScore(pkg);

        // Add author bonus
        const authorPkgCount = authorCounts.get(pkg.author_id) || 0;
        if (authorPkgCount >= 5) score += 0.3;
        else if (authorPkgCount >= 2) score += 0.15;

        score = Math.min(5.0, Math.max(0, Math.round(score * 100) / 100));

        await pool.query('UPDATE packages SET quality_score = $1 WHERE id = $2', [score, pkg.id]);
        updated++;

        if ((i + 1) % 100 === 0 || i === total - 1) {
          const percent = Math.round(((i + 1) / total) * 100);
          process.stdout.write(`\r   Progress: ${i + 1}/${total} (${percent}%)`);
        }
      } catch (error) {
        console.error(`\n   ❌ Failed: ${pkg.id}`, error);
        failed++;
      }
    }

    console.log(`\n\n✨ Complete! Updated: ${updated}, Failed: ${failed}\n`);

    // Top packages
    const topResult = await pool.query(`
      SELECT id, display_name, type, quality_score, total_downloads
      FROM packages
      WHERE quality_score IS NOT NULL
      ORDER BY quality_score DESC, total_downloads DESC
      LIMIT 15
    `);

    console.log('🏆 Top 15 packages by quality score:\n');
    topResult.rows.forEach((pkg: any, i: number) => {
      console.log(`   ${i + 1}. ${pkg.display_name} (${pkg.type})`);
      console.log(`      Score: ${pkg.quality_score} | Downloads: ${pkg.total_downloads} | ID: ${pkg.id}\n`);
    });

    // Distribution
    const distResult = await pool.query(`
      SELECT
        CASE
          WHEN quality_score >= 4.0 THEN 'Excellent (4.0-5.0)'
          WHEN quality_score >= 3.0 THEN 'Good (3.0-3.9)'
          WHEN quality_score >= 2.0 THEN 'Average (2.0-2.9)'
          WHEN quality_score >= 1.0 THEN 'Below Avg (1.0-1.9)'
          ELSE 'Poor (0.0-0.9)'
        END as tier,
        COUNT(*) as count
      FROM packages
      WHERE quality_score IS NOT NULL
      GROUP BY tier
      ORDER BY MIN(quality_score) DESC
    `);

    console.log('\n📈 Quality score distribution:\n');
    distResult.rows.forEach((row: any) => {
      console.log(`   ${row.tier}: ${row.count} packages`);
    });

  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
