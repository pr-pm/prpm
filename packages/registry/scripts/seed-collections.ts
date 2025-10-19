#!/usr/bin/env node

/**
 * Seed collections data into the database
 */

import pg from 'pg';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'prmp_registry',
  user: 'prmp',
  password: 'prmp',
});

interface Collection {
  scope: string;
  id: string;
  version: string;
  name: string;
  description: string;
  author: string;
  official?: boolean;
  verified?: boolean;
  category?: string;
  tags?: string[];
  framework?: string;
  packages?: string[];
}

async function seedCollections() {
  try {
    console.log('📦 Seeding sample collections...\n');

    // Sample collections with actual packages from the database
    const sampleCollections = [
      {
        scope: 'collection',
        id: 'react-best-practices',
        version: '1.0.0',
        name: 'React Best Practices',
        description: 'Essential collection of React development best practices, patterns, and rules for building modern web applications',
        author: 'prpm',
        official: true,
        verified: true,
        category: 'frontend',
        tags: ['react', 'frontend', 'javascript', 'best-practices'],
        framework: 'react',
        icon: '⚛️',
        packages: [
          { packageId: '@sanjeed5/react', required: true, order: 1 },
          { packageId: '@sanjeed5/react-redux', required: false, order: 2 },
          { packageId: '@sanjeed5/react-query', required: false, order: 3 },
        ],
      },
      {
        scope: 'collection',
        id: 'python-fullstack',
        version: '1.0.0',
        name: 'Python Full Stack',
        description: 'Complete Python development collection covering backend, database, containerization, and best practices',
        author: 'prpm',
        official: true,
        verified: true,
        category: 'backend',
        tags: ['python', 'backend', 'fullstack'],
        framework: 'python',
        icon: '🐍',
        packages: [
          { packageId: '@sanjeed5/python', required: true, order: 1 },
          { packageId: '@jhonma82/python-containerization', required: true, order: 2 },
        ],
      },
      {
        scope: 'collection',
        id: 'claude-superpowers',
        version: '1.0.0',
        name: 'Claude Superpowers',
        description: 'Essential Claude skills for brainstorming, planning, and executing complex development tasks',
        author: 'obra',
        official: true,
        verified: true,
        category: 'ai-assistant',
        tags: ['claude', 'claude-skill', 'productivity'],
        icon: '🦾',
        packages: [
          { packageId: '@obra/skill-brainstorming', required: true, order: 1 },
          { packageId: '@obra/skill-executing-plans', required: true, order: 2 },
          { packageId: '@obra/skill-defense-in-depth', required: false, order: 3 },
        ],
      },
    ];

    let totalImported = 0;
    let totalSkipped = 0;

    for (const collection of sampleCollections) {
        try {
          // Check if collection already exists
          const existing = await pool.query(
            'SELECT scope, id, version FROM collections WHERE scope = $1 AND id = $2 AND version = $3',
            [collection.scope, collection.id, collection.version]
          );

          if (existing.rows.length > 0) {
            console.log(`  ⏭️  Skipped: ${collection.scope}/${collection.id}@${collection.version} (already exists)`);
            totalSkipped++;
            continue;
          }

          // Insert collection
          await pool.query(`
            INSERT INTO collections (
              scope, id, version, name, description, author,
              official, verified, category, tags, framework,
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
            collection.author || 'prmp', // Default author if not specified
            collection.official || false,
            collection.verified || false,
            collection.category || null,
            collection.tags || [],
            collection.framework || null,
            0, // downloads
            0, // stars
          ]);

          // Insert collection_packages relationships if packages are specified
          if (collection.packages && collection.packages.length > 0) {
            for (const packageId of collection.packages) {
              // Check if package exists
              const pkgExists = await pool.query(
                'SELECT id FROM packages WHERE id = $1',
                [packageId]
              );

              if (pkgExists.rows.length > 0) {
                await pool.query(`
                  INSERT INTO collection_packages (
                    collection_scope, collection_id, collection_version,
                    package_id, package_version
                  ) VALUES (
                    $1, $2, $3, $4, $5
                  ) ON CONFLICT DO NOTHING
                `, [
                  collection.scope,
                  collection.id,
                  collection.version,
                  packageId,
                  '1.0.0', // Default version
                ]);
              }
            }
          }

          console.log(`  ✅ Imported: ${collection.scope}/${collection.id}@${collection.version}`);
          if (collection.packages) {
            console.log(`     └─ ${collection.packages.length} packages linked`);
          }
          totalImported++;

        } catch (error) {
          console.error(`  ❌ Error importing ${collection.scope}/${collection.id}:`, error);
        }
      }

      console.log();
    }

    console.log('═'.repeat(80));
    console.log('📊 Seed Summary:');
    console.log(`   ✅ Imported: ${totalImported}`);
    console.log(`   ⏭️  Skipped: ${totalSkipped}`);
    console.log(`   📦 Total: ${totalImported + totalSkipped}`);
    console.log('═'.repeat(80));

  } catch (error) {
    console.error('❌ Failed to seed collections:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seedCollections();
