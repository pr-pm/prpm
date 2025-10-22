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

    // Check if collection already exists (using new schema: scope + name_slug + version)
    const existing = await pool.query(
      'SELECT id FROM collections WHERE scope = $1 AND name_slug = $2 AND version = $3',
      [collection.scope, collection.id, collection.version]
    );

    if (existing.rows.length > 0) {
      console.log(`  ⏭️  Skipped: @${collection.scope}/${collection.id}@${collection.version} (already exists)`);
      return;
    }

    // Get or create user for author
    const authorUsername = collection.author || 'prpm';
    const userResult = await pool.query(
      `INSERT INTO users (username, verified_author, created_at, updated_at)
       VALUES ($1, $2, NOW(), NOW())
       ON CONFLICT (username) DO UPDATE SET updated_at = NOW()
       RETURNING id`,
      [authorUsername, collection.verified || false]
    );
    const authorUserId = userResult.rows[0].id;

    // Insert collection with new UUID-based schema
    const collectionResult = await pool.query(`
      INSERT INTO collections (
        scope, name_slug, old_id, version, name, description, author_id,
        official, verified, category, tags, icon,
        downloads, stars, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10, $11, $12,
        $13, $14, NOW(), NOW()
      )
      RETURNING id
    `, [
      collection.scope,
      collection.id, // name_slug
      collection.id, // old_id (for compatibility)
      collection.version,
      collection.name,
      collection.description,
      authorUserId,
      collection.official,
      collection.verified,
      collection.category,
      collection.tags,
      collection.icon,
      0, // downloads
      0, // stars
    ]);

    const collectionUuid = collectionResult.rows[0].id;

    // Insert collection_packages relationships
    let linkedCount = 0;
    for (let i = 0; i < collection.packages.length; i++) {
      const packageName = collection.packages[i];

      // Check if package exists (lookup by name, not id)
      const pkgExists = await pool.query(
        'SELECT id FROM packages WHERE name = $1',
        [packageName]
      );

      if (pkgExists.rows.length > 0) {
        const packageUuid = pkgExists.rows[0].id;
        await pool.query(`
          INSERT INTO collection_packages (
            collection_id, package_id, package_version, required, install_order
          ) VALUES (
            $1, $2, $3, $4, $5
          ) ON CONFLICT (collection_id, package_id) DO NOTHING
        `, [
          collectionUuid,
          packageUuid,
          'latest',
          true, // All are required for MVP
          i + 1,
        ]);
        linkedCount++;
      } else {
        console.log(`     ⚠️  Package not found: ${packageName}`);
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
