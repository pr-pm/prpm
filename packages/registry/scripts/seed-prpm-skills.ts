#!/usr/bin/env node

/**
 * Seed PRPM skills into the database
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

interface Package {
  id: string;
  type: 'cursor' | 'claude-skill' | 'windsurf' | 'continue' | 'generic';
  description: string;
  author: string;
  content: string;
  tags: string[];
  category?: string;
  official: boolean;
  verified: boolean;
  readme?: string;
  quality_score?: number;
}

async function seedSkills() {
  try {
    console.log('📦 Seeding PRPM skills...\n');

    // Read the skill files
    const rootDir = path.join(__dirname, '..', '..', '..');

    const skillFiles = [
      {
        path: path.join(rootDir, '.claude', 'skills', 'pulumi-troubleshooting', 'SKILL.md'),
        id: '@prpm/pulumi-troubleshooting-skill',
        type: 'claude-skill' as const,
        description: 'Comprehensive guide to troubleshooting common Pulumi TypeScript errors, infrastructure issues, and best practices',
        tags: ['pulumi', 'infrastructure', 'troubleshooting', 'typescript', 'aws', 'devops', 'claude-skill'],
        category: 'devops',
        quality_score: 4.70,
      },
      {
        path: path.join(rootDir, '.claude', 'skills', 'postgres-migrations', 'SKILL.md'),
        id: '@prpm/postgres-migrations-skill',
        type: 'claude-skill' as const,
        description: 'Complete guide to PostgreSQL migrations: common errors, generated columns, full-text search, indexes, and best practices',
        tags: ['postgresql', 'database', 'migrations', 'sql', 'devops', 'troubleshooting', 'claude-skill'],
        category: 'devops',
        quality_score: 4.80,
      },
      {
        path: path.join(rootDir, 'packages', 'prpm-self-improve-cursor.md'),
        id: '@prpm/self-improve-cursor',
        type: 'cursor' as const,
        description: 'Teaches Cursor to automatically search and install PRPM packages to improve itself during tasks',
        tags: ['prpm', 'autonomous', 'self-improvement', 'discovery', 'cursor', 'meta'],
        category: 'meta',
        quality_score: 3.50,
      },
      {
        path: path.join(rootDir, 'packages', 'prpm-self-improve-windsurf.md'),
        id: '@prpm/self-improve-windsurf',
        type: 'windsurf' as const,
        description: 'Teaches Windsurf to automatically search and install PRPM packages to improve itself during tasks',
        tags: ['prpm', 'autonomous', 'self-improvement', 'discovery', 'windsurf', 'meta'],
        category: 'meta',
        quality_score: 3.50,
      },
      {
        path: path.join(rootDir, 'packages', 'prpm-self-improve-continue.md'),
        id: '@prpm/self-improve-continue',
        type: 'continue' as const,
        description: 'Teaches Continue to automatically search and install PRPM packages to improve itself during tasks',
        tags: ['prpm', 'autonomous', 'self-improvement', 'discovery', 'continue', 'meta'],
        category: 'meta',
        quality_score: 3.50,
      },
      {
        path: path.join(rootDir, 'packages', 'prpm-self-improve-claude.md'),
        id: '@prpm/self-improve-claude',
        type: 'claude-skill' as const,
        description: 'Teaches Claude Code to automatically search and install PRPM packages to improve itself during tasks',
        tags: ['prpm', 'autonomous', 'self-improvement', 'discovery', 'claude', 'meta', 'claude-skill'],
        category: 'meta',
        quality_score: 3.50,
      },
      {
        path: path.join(rootDir, '.claude', 'skills', 'aws-beanstalk-expert', 'SKILL.md'),
        id: '@prpm/aws-beanstalk-expert',
        type: 'claude-skill' as const,
        description: 'Expert knowledge for deploying, managing, and troubleshooting AWS Elastic Beanstalk applications with production best practices',
        tags: ['aws', 'elastic-beanstalk', 'deployment', 'infrastructure', 'devops', 'pulumi', 'ci-cd', 'troubleshooting', 'claude-skill'],
        category: 'devops',
        quality_score: 5.00,
      },
      {
        path: path.join(rootDir, '.cursor', 'rules', 'creating-cursor-rules.mdc'),
        id: '@prpm/creating-cursor-rules',
        type: 'cursor' as const,
        description: 'Meta-rule for creating effective Cursor IDE rules with best practices, patterns, and examples',
        tags: ['meta', 'cursor', 'documentation', 'best-practices', 'project-setup'],
        category: 'meta',
        quality_score: 4.80,
      },
      {
        path: path.join(rootDir, '.claude', 'skills', 'creating-cursor-rules', 'SKILL.md'),
        id: '@prpm/creating-cursor-rules-skill',
        type: 'claude-skill' as const,
        description: 'Expert guidance for creating effective Cursor IDE rules with best practices, patterns, and examples',
        tags: ['meta', 'cursor', 'documentation', 'best-practices', 'project-setup', 'claude-skill'],
        category: 'meta',
        quality_score: 4.80,
      },
      {
        path: path.join(rootDir, '.cursor', 'rules', 'creating-skills.mdc'),
        id: '@prpm/creating-skills',
        type: 'cursor' as const,
        description: 'Meta-guide for creating effective Claude Code skills with proper structure, CSO optimization, and real examples',
        tags: ['meta', 'skill-creation', 'documentation', 'best-practices'],
        category: 'meta',
        quality_score: 4.70,
      },
      {
        path: path.join(rootDir, '.claude', 'skills', 'creating-skills', 'SKILL.md'),
        id: '@prpm/creating-skills-skill',
        type: 'claude-skill' as const,
        description: 'Use when creating new Claude Code skills or improving existing ones - ensures skills are discoverable, scannable, and effective through proper structure, CSO optimization, and real examples',
        tags: ['meta', 'skill-creation', 'documentation', 'best-practices', 'claude-skill'],
        category: 'meta',
        quality_score: 4.80,
      },
      {
        path: path.join(rootDir, '.cursor', 'rules', 'typescript-type-safety.mdc'),
        id: '@prpm/typescript-type-safety',
        type: 'cursor' as const,
        description: 'Use when encountering TypeScript any types, type errors, or lax type checking - eliminates type holes and enforces strict type safety through proper interfaces, type guards, and module augmentation',
        tags: ['typescript', 'type-safety', 'best-practices', 'code-quality'],
        category: 'development',
        quality_score: 4.75,
      },
      {
        path: path.join(rootDir, '.claude', 'skills', 'typescript-type-safety', 'SKILL.md'),
        id: '@prpm/typescript-type-safety-skill',
        type: 'claude-skill' as const,
        description: 'Use when encountering TypeScript any types, type errors, or lax type checking - eliminates type holes and enforces strict type safety through proper interfaces, type guards, and module augmentation',
        tags: ['typescript', 'type-safety', 'best-practices', 'code-quality', 'claude-skill'],
        category: 'development',
        quality_score: 4.75,
      },
      {
        path: path.join(rootDir, '.claude', 'skills', 'github-actions-testing', 'SKILL.md'),
        id: '@prpm/github-actions-testing-skill',
        type: 'claude-skill' as const,
        description: 'Expert guidance for testing and validating GitHub Actions workflows before deployment - catches cache errors, path issues, monorepo dependencies, and service container problems that local testing misses',
        tags: ['github-actions', 'ci-cd', 'testing', 'validation', 'devops', 'workflows', 'actionlint', 'act', 'claude-skill'],
        category: 'devops',
        quality_score: 4.70,
      },
      {
        path: path.join(rootDir, 'packages', 'cursor-rules', 'github-actions-testing', 'rule.md'),
        id: '@prpm/github-actions-testing',
        type: 'cursor' as const,
        description: 'Comprehensive testing and validation for GitHub Actions workflows - prevents cache errors, path issues, monorepo dependency problems, and service container misconfigurations',
        tags: ['github-actions', 'ci-cd', 'testing', 'validation', 'devops', 'workflows', 'cursor'],
        category: 'devops',
        quality_score: 4.60,
      },
    ];

    let imported = 0;
    let skipped = 0;

    for (const skill of skillFiles) {
      try {
        // Read the file content
        const content = await fs.readFile(skill.path, 'utf-8');

        // Check if package already exists
        const existing = await pool.query(
          'SELECT id FROM packages WHERE name = $1',
          [skill.id]
        );

        if (existing.rows.length > 0) {
          console.log(`  ⏭️  Skipped: ${skill.id} (already exists)`);
          skipped++;
          continue;
        }

        // Create or get prpm user
        const userResult = await pool.query(
          `INSERT INTO users (username, email, verified_author, is_admin, created_at, updated_at)
           VALUES ('prpm', 'team@prpm.dev', TRUE, TRUE, NOW(), NOW())
           ON CONFLICT (username) DO UPDATE SET updated_at = NOW()
           RETURNING id`,
          []
        );
        const prpmUserId = userResult.rows[0].id;

        // Insert package
        const pkgResult = await pool.query(`
          INSERT INTO packages (
            name, type, description,
            author_id, tags, category, verified, featured,
            visibility, quality_score, created_at, updated_at
          ) VALUES (
            $1, $2, $3,
            $4, $5, $6, $7, $8,
            $9, $10, NOW(), NOW()
          )
          ON CONFLICT (name) DO NOTHING
          RETURNING id
        `, [
          skill.id,
          skill.type,
          skill.description,
          prpmUserId,
          skill.tags,
          skill.category,
          true, // verified
          true, // featured (official)
          'public', // visibility
          skill.quality_score || null, // quality_score
        ]);

        // If package already exists, skip
        if (pkgResult.rows.length === 0) {
          console.log(`  ⏭️  Skipped: ${skill.id} (already exists)`);
          skipped++;
          continue;
        }

        // Get the UUID package_id from the insert result
        const dbPackageId = pkgResult.rows[0].id;

        // Insert version with content in metadata
        await pool.query(`
          INSERT INTO package_versions (
            package_id, version, tarball_url, content_hash,
            file_size, changelog, metadata, published_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, NOW()
          )
          ON CONFLICT (package_id, version) DO NOTHING
        `, [
          dbPackageId,
          '1.0.0',
          `https://registry.prpm.dev/packages/${dbPackageId}/1.0.0.tar.gz`, // UUID-based URL
          'placeholder-hash',
          content.length,
          'Initial version',
          JSON.stringify({
            content: content,
            sourceUrl: skill.path,
            originalType: skill.type,
          }),
        ]);

        // Update version_count for the package
        await pool.query(`
          UPDATE packages
          SET version_count = (SELECT COUNT(*) FROM package_versions WHERE package_id = $1)
          WHERE id = $1
        `, [dbPackageId]);

        console.log(`  ✅ Imported: ${skill.id}`);
        imported++;
      } catch (error) {
        console.error(`  ❌ Error importing ${skill.id}:`, error);
      }
    }

    console.log();
    console.log('═'.repeat(80));
    console.log('📊 Seed Summary:');
    console.log(`   ✅ Imported: ${imported}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   📦 Total: ${imported + skipped}`);
    console.log('═'.repeat(80));

  } catch (error) {
    console.error('❌ Failed to seed skills:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seedSkills();
