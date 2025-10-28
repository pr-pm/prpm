#!/usr/bin/env tsx
/**
 * Build-time script to fetch all collection data directly from the database
 */

import { Pool } from 'pg';
import fs from 'fs/promises';
import path from 'path';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('ERROR: DATABASE_URL environment variable is required');
  process.exit(1);
}

async function fetchAllCollections() {
  const pool = new Pool({ connectionString: DATABASE_URL });

  try {
    console.log('🔌 Connecting to database...');

    const result = await pool.query(`
      SELECT
        id, name, name_slug, description, visibility, tags,
        created_at, updated_at
      FROM collections
      WHERE visibility = 'public'
      ORDER BY name ASC
    `);

    console.log(`✅ Fetched ${result.rows.length} collections from database`);

    const dataDir = path.join(process.cwd(), '.next', 'cache', 'collections');
    await fs.mkdir(dataDir, { recursive: true });

    const outputPath = path.join(dataDir, 'all-collections.json');
    await fs.writeFile(outputPath, JSON.stringify(result.rows, null, 2));

    console.log(`💾 Saved collection data to ${outputPath}`);

    return result.rows;
  } catch (error) {
    console.error('❌ Error fetching collections:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

fetchAllCollections()
  .then(() => {
    console.log('✨ Collection data fetch complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed to fetch collection data:', error);
    process.exit(1);
  });
