#!/usr/bin/env node
/**
 * Update quality scores for all packages
 * Run: npx tsx scripts/update-quality-scores.ts
 */

import { config } from 'dotenv';
import { buildServer } from '../src/index.js';
import { updateAllQualityScores } from '../src/scoring/quality-scorer.js';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file from registry root
config({ path: join(__dirname, '..', '.env') });

async function main() {
  console.log('🎯 Updating quality scores for all packages...\n');

  const server = await buildServer();

  try {
    // Get package types
    const typesResult = await server.pg.query(
      'SELECT DISTINCT type, COUNT(*) as count FROM packages GROUP BY type ORDER BY count DESC'
    );

    console.log('📊 Package distribution by type:');
    for (const row of typesResult.rows) {
      console.log(`   ${row.type}: ${row.count} packages`);
    }
    console.log('');

    let totalUpdated = 0;
    let totalFailed = 0;

    // Update each type separately for better progress tracking
    for (const row of typesResult.rows) {
      const type = row.type;
      const count = parseInt(row.count);

      console.log(`\n🔄 Processing ${count} ${type} packages...`);

      const result = await updateAllQualityScores(server, {
        type,
        batchSize: 50,
        onProgress: (current, total) => {
          const percent = Math.round((current / total) * 100);
          process.stdout.write(`\r   Progress: ${current}/${total} (${percent}%)`);
        }
      });

      console.log(`\n   ✅ Updated: ${result.updated}, ❌ Failed: ${result.failed}`);
      totalUpdated += result.updated;
      totalFailed += result.failed;
    }

    console.log(`\n\n✨ Quality score update complete!`);
    console.log(`   Total updated: ${totalUpdated}`);
    console.log(`   Total failed: ${totalFailed}`);

    // Show top packages by quality score
    console.log('\n🏆 Top 10 packages by quality score:');
    const topResult = await server.pg.query(`
      SELECT id,  type, quality_score, total_downloads
      FROM packages
      WHERE quality_score IS NOT NULL
      ORDER BY quality_score DESC, total_downloads DESC
      LIMIT 10
    `);

    for (let i = 0; i < topResult.rows.length; i++) {
      const pkg = topResult.rows[i];
      console.log(
        `   ${i + 1}. ${pkg.id} (${pkg.type}) - Score: ${pkg.quality_score}, Downloads: ${pkg.total_downloads}`
      );
    }

    // Show score distribution
    console.log('\n📈 Quality score distribution:');
    const distResult = await server.pg.query(`
      SELECT
        CASE
          WHEN quality_score >= 4.0 THEN 'Excellent (4.0-5.0)'
          WHEN quality_score >= 3.0 THEN 'Good (3.0-3.9)'
          WHEN quality_score >= 2.0 THEN 'Average (2.0-2.9)'
          WHEN quality_score >= 1.0 THEN 'Below Average (1.0-1.9)'
          ELSE 'Poor (0.0-0.9)'
        END as tier,
        COUNT(*) as count
      FROM packages
      WHERE quality_score IS NOT NULL
      GROUP BY tier
      ORDER BY MIN(quality_score) DESC
    `);

    for (const row of distResult.rows) {
      console.log(`   ${row.tier}: ${row.count} packages`);
    }

  } catch (error) {
    console.error('❌ Error updating quality scores:', error);
    process.exit(1);
  } finally {
    await server.close();
  }
}

main();
