/**
 * Seed collections into registry database
 * Run: npx tsx scripts/seed/seed-collections.ts
 */

import pg from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';

const { Pool } = pg;

interface CollectionSeed {
  id: string;
  scope: string;
  name: string;
  description: string;
  version: string;
  category: string;
  tags: string[];
  icon?: string;
  official: boolean;
  packages: {
    packageId: string;
    required: boolean;
    reason?: string;
    version?: string;
  }[];
}

async function seedCollections() {
  // Database connection
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'prpm_registry',
    user: process.env.DB_USER || 'prpm',
    password: process.env.DB_PASSWORD,
  });

  try {
    // Read collections data
    const collectionsPath = join(process.cwd(), 'scripts/seed/collections.json');
    const collectionsData = JSON.parse(readFileSync(collectionsPath, 'utf-8')) as CollectionSeed[];

    console.log(`📦 Seeding ${collectionsData.length} collections...\n`);

    for (const collection of collectionsData) {
      console.log(`Processing: ${collection.name} (@${collection.scope}/${collection.id})`);

      // Insert collection
      const collectionInsert = await pool.query(
        `
        INSERT INTO collections (
          id, scope, name, description, version,
          author, official, verified, category, tags, icon,
          downloads, stars, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
        ON CONFLICT (scope, id, version)
        DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          category = EXCLUDED.category,
          tags = EXCLUDED.tags,
          icon = EXCLUDED.icon,
          updated_at = NOW()
        RETURNING scope, id, version
        `,
        [
          collection.id,
          collection.scope,
          collection.name,
          collection.description,
          collection.version,
          'prpm-admin', // author
          collection.official,
          collection.official, // verified if official
          collection.category,
          collection.tags,
          collection.icon,
          0, // initial downloads
          0, // initial stars
        ]
      );

      const { scope, id, version } = collectionInsert.rows[0];

      // Delete existing packages for this collection version
      await pool.query(
        `DELETE FROM collection_packages
         WHERE collection_scope = $1 AND collection_id = $2 AND collection_version = $3`,
        [scope, id, version]
      );

      // Insert packages
      for (let i = 0; i < collection.packages.length; i++) {
        const pkg = collection.packages[i];

        await pool.query(
          `
          INSERT INTO collection_packages (
            collection_scope, collection_id, collection_version,
            package_id, package_version, required, reason, install_order
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (collection_scope, collection_id, collection_version, package_id)
          DO UPDATE SET
            package_version = EXCLUDED.package_version,
            required = EXCLUDED.required,
            reason = EXCLUDED.reason,
            install_order = EXCLUDED.install_order
          `,
          [
            scope,
            id,
            version,
            pkg.packageId,
            pkg.version || null,
            pkg.required,
            pkg.reason,
            i + 1, // install_order
          ]
        );
      }

      console.log(`  ✓ Added ${collection.packages.length} packages`);
    }

    console.log(`\n✅ Successfully seeded ${collectionsData.length} collections!`);
  } catch (error) {
    console.error('❌ Failed to seed collections:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seedCollections();
