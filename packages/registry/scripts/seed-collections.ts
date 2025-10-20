#!/usr/bin/env node

/**
 * Seed collections data into the database
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

interface CollectionPackageRef {
  packageId: string;
  required?: boolean;
  order?: number;
}

interface Collection {
  scope: string;
  id: string;
  version: string;
  name: string;
  description: string;
  author: string;  // Username - will be converted to author_id
  official?: boolean;
  verified?: boolean;
  category?: string;
  tags?: string[];
  framework?: string;
  packages?: (string | CollectionPackageRef)[];
}

async function seedCollections() {
  try {
    console.log('📦 Seeding curated collections...\n');

    // Sample collections with actual packages from the database
    const workingCollections = [
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
        packages: ['@sanjeed5/react', '@sanjeed5/react-redux', '@sanjeed5/react-query', '@sanjeed5/react-native', '@sanjeed5/react-mobx'],
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
        packages: ['@sanjeed5/python', '@sanjeed5/django', '@sanjeed5/flask', '@sanjeed5/fastapi', '@sanjeed5/sqlalchemy'],
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
        packages: [
          '@obra/skill-brainstorming',
          '@obra/skill-executing-plans',
          '@obra/skill-writing-plans',
          '@obra/skill-test-driven-development',
          '@obra/skill-systematic-debugging',
        ],
      },
      {
        scope: 'collection',
        id: 'nextjs-fullstack',
        version: '1.0.0',
        name: 'Next.js Full Stack',
        description: 'Complete Next.js development stack with TypeScript, React, and modern tooling',
        author: 'prpm',
        official: true,
        verified: true,
        category: 'fullstack',
        tags: ['nextjs', 'typescript', 'react', 'fullstack'],
        packages: ['@sanjeed5/nextjs', '@sanjeed5/typescript', '@sanjeed5/react', '@sanjeed5/tailwindcss'],
      },
      {
        scope: 'collection',
        id: 'vue-ecosystem',
        version: '1.0.0',
        name: 'Vue.js Ecosystem',
        description: 'Complete Vue.js development collection with Nuxt, composition API, and modern patterns',
        author: 'prpm',
        official: true,
        verified: true,
        category: 'frontend',
        tags: ['vue', 'nuxt', 'frontend', 'javascript'],
        packages: ['@sanjeed5/vue', '@sanjeed5/nuxt', '@voltagent/vue-expert'],
      },
      {
        scope: 'collection',
        id: 'angular-enterprise',
        version: '1.0.0',
        name: 'Angular Enterprise',
        description: 'Enterprise Angular development with best practices, patterns, and scalability',
        author: 'prpm',
        official: true,
        verified: true,
        category: 'frontend',
        tags: ['angular', 'enterprise', 'typescript', 'frontend'],
        packages: ['@sanjeed5/angular', '@voltagent/angular-architect', '@sanjeed5/typescript'],
      },
      {
        scope: 'collection',
        id: 'nodejs-backend',
        version: '1.0.0',
        name: 'Node.js Backend Development',
        description: 'Comprehensive Node.js backend stack with Express, NestJS, and microservices patterns',
        author: 'prpm',
        official: true,
        verified: true,
        category: 'backend',
        tags: ['nodejs', 'backend', 'express', 'nestjs'],
        packages: ['@sanjeed5/nodejs', '@sanjeed5/express', '@sanjeed5/nestjs', '@sanjeed5/typescript'],
      },
      {
        scope: 'collection',
        id: 'devops-kubernetes',
        version: '1.0.0',
        name: 'DevOps & Kubernetes',
        description: 'Complete DevOps toolkit with Kubernetes, Docker, and CI/CD best practices',
        author: 'prpm',
        official: true,
        verified: true,
        category: 'devops',
        tags: ['devops', 'kubernetes', 'docker', 'cicd'],
        packages: ['@sanjeed5/kubernetes', '@sanjeed5/docker', '@voltagent/kubernetes-specialist', '@voltagent/devops-engineer'],
      },
      {
        scope: 'collection',
        id: 'rust-systems',
        version: '1.0.0',
        name: 'Rust Systems Programming',
        description: 'Rust development collection for systems programming, performance, and safety',
        author: 'prpm',
        official: true,
        verified: true,
        category: 'systems',
        tags: ['rust', 'systems', 'performance', 'safety'],
        packages: ['@sanjeed5/rust', '@sanjeed5/actix-web', '@sanjeed5/tokio'],
      },
      {
        scope: 'collection',
        id: 'golang-microservices',
        version: '1.0.0',
        name: 'Go Microservices',
        description: 'Go development for building scalable microservices and cloud-native applications',
        author: 'prpm',
        official: true,
        verified: true,
        category: 'backend',
        tags: ['golang', 'go', 'microservices', 'cloud-native'],
        packages: ['@sanjeed5/go', '@sanjeed5/gin', '@sanjeed5/fiber'],
      },
      {
        scope: 'collection',
        id: 'database-essentials',
        version: '1.0.0',
        name: 'Database Essentials',
        description: 'Essential database tools and practices for SQL, NoSQL, and ORMs',
        author: 'prpm',
        official: true,
        verified: true,
        category: 'database',
        tags: ['database', 'sql', 'nosql', 'orm'],
        packages: ['@sanjeed5/postgresql', '@sanjeed5/mongodb', '@sanjeed5/redis', '@sanjeed5/prisma'],
      },
      {
        scope: 'collection',
        id: 'testing-toolkit',
        version: '1.0.0',
        name: 'Testing & QA Toolkit',
        description: 'Comprehensive testing collection with unit, integration, and e2e testing frameworks',
        author: 'prpm',
        official: true,
        verified: true,
        category: 'testing',
        tags: ['testing', 'qa', 'jest', 'cypress'],
        packages: ['@sanjeed5/jest', '@sanjeed5/vitest', '@sanjeed5/playwright', '@sanjeed5/cypress'],
      },
      {
        scope: 'collection',
        id: 'aws-cloud',
        version: '1.0.0',
        name: 'AWS Cloud Development',
        description: 'AWS cloud development with Lambda, DynamoDB, S3, and serverless patterns',
        author: 'prpm',
        official: true,
        verified: true,
        category: 'cloud',
        tags: ['aws', 'cloud', 'serverless', 'lambda'],
        packages: ['@sanjeed5/aws', '@sanjeed5/aws-lambda', '@sanjeed5/aws-dynamodb', '@sanjeed5/aws-s3'],
      },
      {
        scope: 'collection',
        id: 'graphql-stack',
        version: '1.0.0',
        name: 'GraphQL Development Stack',
        description: 'Complete GraphQL development with Apollo, schema design, and best practices',
        author: 'prpm',
        official: true,
        verified: true,
        category: 'api',
        tags: ['graphql', 'apollo', 'api', 'schema'],
        packages: ['@sanjeed5/graphql', '@sanjeed5/apollo-graphql', '@sanjeed5/apollo-client'],
      },
      {
        scope: 'collection',
        id: 'mobile-development',
        version: '1.0.0',
        name: 'Mobile Development',
        description: 'Cross-platform mobile development with React Native and modern tooling',
        author: 'prpm',
        official: true,
        verified: true,
        category: 'mobile',
        tags: ['mobile', 'react-native', 'ios', 'android'],
        packages: ['@sanjeed5/react-native', '@sanjeed5/expo', '@sanjeed5/react'],
      },
      {
        scope: 'collection',
        id: 'web3-blockchain',
        version: '1.0.0',
        name: 'Web3 & Blockchain',
        description: 'Web3 development with Solidity, Ethereum, and decentralized applications',
        author: 'prpm',
        official: true,
        verified: true,
        category: 'blockchain',
        tags: ['web3', 'blockchain', 'solidity', 'ethereum'],
        packages: ['@sanjeed5/solidity', '@sanjeed5/ethereum', '@sanjeed5/web3'],
      },
    ];

    // Load curated collections from JSON file (but they have invalid package IDs)
    // const curatedPath = path.join(__dirname, 'seed', 'curated-collections.json');
    // const curatedData = await fs.readFile(curatedPath, 'utf-8');
    // const curatedCollections = JSON.parse(curatedData);

    let totalImported = 0;
    let totalSkipped = 0;

    for (const collection of workingCollections) {
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

          // Insert collection
          await pool.query(`
            INSERT INTO collections (
              scope, id, version, name, description, author_id,
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
            authorUserId,
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
            let linkedCount = 0;
            for (let i = 0; i < collection.packages.length; i++) {
              const pkg = collection.packages[i];
              // Handle both string format and object format
              const packageIdentifier = typeof pkg === 'string' ? pkg : pkg.packageId; // may be a UUID or a name
              const required = typeof pkg === 'string' ? true : (pkg.required !== false);
              const order = typeof pkg === 'string' ? i + 1 : (pkg.order || i + 1);

              // Resolve package UUID: try exact id, then name lookup
              let resolvedPackageId: string | null = null;
              const byId = await pool.query('SELECT id FROM packages WHERE name = $1', [packageIdentifier]);
              if (byId.rows.length > 0) {
                resolvedPackageId = byId.rows[0].id;
              } else {
                const byName = await pool.query('SELECT id FROM packages WHERE name = $1', [packageIdentifier]);
                if (byName.rows.length > 0) {
                  resolvedPackageId = byName.rows[0].id;
                }
              }

              if (resolvedPackageId) {
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
                  resolvedPackageId,
                  'latest', // Use latest version
                  required,
                  order,
                ]);
                linkedCount++;
              }
            }
            if (linkedCount > 0) {
              console.log(`     └─ ${linkedCount}/${collection.packages.length} packages linked`);
            }
          }

          console.log(`  ✅ Imported: ${collection.scope}/${collection.id}@${collection.version}`);
          totalImported++;

        } catch (error) {
          console.error(`  ❌ Error importing ${collection.scope}/${collection.id}:`, error);
        }
      }

    console.log();
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
