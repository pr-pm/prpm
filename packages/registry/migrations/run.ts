#!/usr/bin/env node
/**
 * Database migration runner
 */

import { config } from 'dotenv';
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { Client } from 'pg';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file from registry root
config({ path: join(__dirname, '..', '.env') });

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://prpm:prpm@localhost:5434/prpm';

async function runMigrations() {
  const client = new Client({ connectionString: DATABASE_URL });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Create migrations table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Get list of migration files
    // When built, this file is at dist/migrations/run.js
    // SQL files are at migrations/*.sql (one level up from dist)
    const migrationsDir = join(__dirname, '..', '..', 'migrations');
    const files = await readdir(migrationsDir);
    const sqlFiles = files
      .filter(f => f.endsWith('.sql'))
      .sort();

    console.log(`\n📋 Found ${sqlFiles.length} migration files\n`);

    // Get already executed migrations
    const { rows: executed } = await client.query(
      'SELECT name FROM migrations ORDER BY id'
    );
    const executedNames = new Set(executed.map(r => r.name));

    // Run pending migrations
    let count = 0;
    for (const file of sqlFiles) {
      if (executedNames.has(file)) {
        console.log(`⏭️  Skipping ${file} (already executed)`);
        continue;
      }

      console.log(`🚀 Running migration: ${file}`);
      const sql = await readFile(join(migrationsDir, file), 'utf-8');

      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query(
          'INSERT INTO migrations (name) VALUES ($1)',
          [file]
        );
        await client.query('COMMIT');
        console.log(`✅ Successfully executed ${file}\n`);
        count++;
      } catch (error) {
        await client.query('ROLLBACK');
        throw new Error(`Failed to execute ${file}: ${error}`);
      }
    }

    if (count === 0) {
      console.log('✨ All migrations are up to date!');
    } else {
      console.log(`\n✨ Successfully executed ${count} migration(s)`);
    }
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigrations();
