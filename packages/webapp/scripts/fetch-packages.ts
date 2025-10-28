#!/usr/bin/env tsx
/**
 * Build-time script to fetch all package data directly from the database
 * This avoids API rate limiting during static site generation
 */

import { Pool } from 'pg';
import fs from 'fs/promises';
import path from 'path';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('ERROR: DATABASE_URL environment variable is required');
  process.exit(1);
}

async function fetchAllPackages() {
  const pool = new Pool({ connectionString: DATABASE_URL });

  try {
    console.log('🔌 Connecting to database...');

    // Fetch all public packages with essential data for static generation
    const result = await pool.query(`
      SELECT
        id, name, description, author_id, org_id, license, repository_url,
        homepage_url, documentation_url, tags, keywords, category,
        visibility, deprecated, verified, featured, total_downloads,
        quality_score, rating_average, rating_count, created_at, updated_at,
        format, subtype, snippet
      FROM packages
      WHERE visibility = 'public' AND deprecated = false
      ORDER BY name ASC
    `);

    console.log(`✅ Fetched ${result.rows.length} packages from database`);

    // Write to JSON file
    const dataDir = path.join(process.cwd(), '.next', 'cache', 'packages');
    await fs.mkdir(dataDir, { recursive: true });

    const outputPath = path.join(dataDir, 'all-packages.json');
    await fs.writeFile(outputPath, JSON.stringify(result.rows, null, 2));

    console.log(`💾 Saved package data to ${outputPath}`);
    console.log(`📦 Total packages: ${result.rows.length}`);

    return result.rows;
  } catch (error) {
    console.error('❌ Error fetching packages:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the script
fetchAllPackages()
  .then(() => {
    console.log('✨ Package data fetch complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed to fetch package data:', error);
    process.exit(1);
  });
