#!/usr/bin/env node

/**
 * Seed @collection/startup-mvp collection
 */

import { config } from 'dotenv';
import pg from 'pg';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file from registry root
config({ path: path.join(__dirname, '..', '.env') });

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://prpm:prpm@localhost:5434/prpm';

const pool = new Pool({
  connectionString: DATABASE_URL,
});

async function seedStartupCollection() {
  try {
    console.log('📦 Seeding @collection/startup-mvp...\n');

    const collection = {
      scope: 'collection',
      id: 'startup-mvp',
      version: '1.0.0',
      name: 'Startup MVP Essentials',
      description: 'Complete toolkit for building a startup MVP - React/Next.js frontend, Node.js/Express backend, PostgreSQL database, authentication, deployment, and testing',
      author: 'prpm',
      official: true,
      verified: true,
      category: 'fullstack',
      tags: ['startup', 'mvp', 'fullstack', 'react', 'nextjs', 'nodejs', 'express', 'postgresql', 'authentication', 'deployment'],
      icon: '🚀',
      packages: [
        // Frontend
        '@sanjeed5/react',
        '@sanjeed5/nextjs',
        '@sanjeed5/typescript',
        '@sanjeed5/tailwindcss',

        // Backend
        '@sanjeed5/nodejs',
        '@sanjeed5/express',
        '@sanjeed5/postgresql',
        '@sanjeed5/prisma',

        // Testing
        '@sanjeed5/jest',
        '@sanjeed5/playwright',

        // Deployment & DevOps
        '@sanjeed5/docker',
        '@sanjeed5/github-actions',

        // Additional useful packages
        '@sanjeed5/graphql',
        '@sanjeed5/redis',
      ],
    };

    // Check if collection already exists
    const existing = await pool.query(
      'SELECT scope, id, version FROM collections WHERE scope = $1 AND id = $2 AND version = $3',
      [collection.scope, collection.id, collection.version]
    );

    if (existing.rows.length > 0) {
      console.log(`  ⏭️  Skipped: @${collection.scope}/${collection.id}@${collection.version} (already exists)`);
      return;
    }

    // Insert collection
    await pool.query(`
      INSERT INTO collections (
        scope, id, version, name, description, author,
        official, verified, category, tags, icon,
        downloads, stars, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10, $11,
        $12, $13, NOW(), NOW()
      )
    `, [
      collection.scope,
      collection.id,
      collection.version,
      collection.name,
      collection.description,
      collection.author,
      collection.official,
      collection.verified,
      collection.category,
      collection.tags,
      collection.icon,
      0, // downloads
      0, // stars
    ]);

    // Insert collection_packages relationships
    let linkedCount = 0;
    for (let i = 0; i < collection.packages.length; i++) {
      const packageId = collection.packages[i];

      // Check if package exists
      const pkgExists = await pool.query(
        'SELECT id FROM packages WHERE id = $1',
        [packageId]
      );

      if (pkgExists.rows.length > 0) {
        await pool.query(`
          INSERT INTO collection_packages (
            collection_scope, collection_id, collection_version,
            package_id, package_version, required, install_order
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7
          ) ON CONFLICT DO NOTHING
        `, [
          collection.scope,
          collection.id,
          collection.version,
          packageId,
          'latest',
          true, // All are required for MVP
          i + 1,
        ]);
        linkedCount++;
      } else {
        console.log(`     ⚠️  Package not found: ${packageId}`);
      }
    }

    console.log(`  ✅ Imported: @${collection.scope}/${collection.id}@${collection.version}`);
    console.log(`     └─ ${linkedCount}/${collection.packages.length} packages linked`);

  } catch (error) {
    console.error('❌ Failed to seed startup collection:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seedStartupCollection();
