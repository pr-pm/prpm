#!/usr/bin/env node

/**
 * Seed PRPM skills into the database
 */

import { config } from 'dotenv';
import pg from 'pg';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { createHash } from 'crypto';
import tar from 'tar';
import { tmpdir } from 'os';
import { writeFileSync, mkdirSync, rmSync, readFileSync } from 'fs';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file from registry root
config({ path: path.join(__dirname, '..', '.env') });

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://prpm:prpm@localhost:5434/prpm';

const pool = new Pool({
  connectionString: DATABASE_URL,
});

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.S3_REGION || 'us-east-1',
  endpoint: process.env.S3_ENDPOINT !== 'https://s3.amazonaws.com' ? process.env.S3_ENDPOINT : undefined,
  credentials: process.env.S3_ACCESS_KEY_ID
    ? {
        accessKeyId: process.env.S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
      }
    : undefined,
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

/**
 * Create tarball from content and upload to S3
 */
async function uploadPackageToS3(
  packageId: string,
  version: string,
  content: string,
  type: string
): Promise<{ url: string; hash: string; size: number }> {
  const tempDir = path.join(tmpdir(), `prpm-seed-${Date.now()}-${Math.random().toString(36).substring(7)}`);

  try {
    // Create temp directory
    mkdirSync(tempDir, { recursive: true });

    // Determine file extension based on type
    const ext = ['cursor', 'windsurf', 'continue'].includes(type) ? '.mdc' : '.md';
    const filename = `content${ext}`;
    const filePath = path.join(tempDir, filename);

    // Write content to file
    writeFileSync(filePath, content, 'utf-8');

    // Create tarball
    const tarballPath = path.join(tempDir, 'package.tar.gz');
    await tar.create(
      {
        gzip: true,
        file: tarballPath,
        cwd: tempDir,
      },
      [filename]
    );

    // Read tarball
    const tarballBuffer = readFileSync(tarballPath);
    const hash = createHash('sha256').update(tarballBuffer).digest('hex');

    // Upload to S3
    const key = `packages/${packageId}/${version}/package.tar.gz`;
    await s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET || 'prpm-packages',
        Key: key,
        Body: tarballBuffer,
        ContentType: 'application/gzip',
        Metadata: {
          packageId,
          version,
          hash,
        },
      })
    );

    // Generate URL
    const bucket = process.env.S3_BUCKET || 'prpm-packages';
    const region = process.env.S3_REGION || 'us-east-1';
    const url = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;

    return {
      url,
      hash,
      size: tarballBuffer.length,
    };
  } finally {
    // Clean up temp directory
    try {
      rmSync(tempDir, { recursive: true, force: true });
    } catch (err) {
      console.warn(`  ⚠️  Failed to clean up temp directory: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}

async function seedSkills() {
  try {
    console.log('📦 Seeding PRPM skills...\n');

    // Read the skill files
    const rootDir = path.join(__dirname, '..', '..', '..');

    const skillFiles = [
      {
        path: path.join(rootDir, '.claude', 'skills', 'pulumi-troubleshooting', 'SKILL.md'),
        id: '@pr-pm/pulumi-troubleshooting-skill',
        type: 'claude-skill' as const,
        description: 'Comprehensive guide to troubleshooting common Pulumi TypeScript errors, infrastructure issues, and best practices',
        tags: ['pulumi', 'infrastructure', 'troubleshooting', 'typescript', 'aws', 'devops', 'claude-skill'],
        category: 'devops',
        quality_score: 4.70,
      },
      {
        path: path.join(rootDir, '.claude', 'skills', 'postgres-migrations', 'SKILL.md'),
        id: '@pr-pm/postgres-migrations-skill',
        type: 'claude-skill' as const,
        description: 'Complete guide to PostgreSQL migrations: common errors, generated columns, full-text search, indexes, and best practices',
        tags: ['postgresql', 'database', 'migrations', 'sql', 'devops', 'troubleshooting', 'claude-skill'],
        category: 'devops',
        quality_score: 4.80,
      },
      {
        path: path.join(rootDir, '.cursor', 'rules', 'self-improving.mdc'),
        id: '@pr-pm/self-improve-cursor',
        type: 'cursor' as const,
        description: 'Teaches Cursor to automatically search and install PRPM packages to improve itself during tasks',
        tags: ['prpm', 'autonomous', 'self-improvement', 'discovery', 'cursor', 'meta'],
        category: 'meta',
        quality_score: 3.50,
      },
      {
        path: path.join(rootDir, '.claude', 'skills', 'self-improving', 'SKILL.md'),
        id: '@pr-pm/self-improve-claude',
        type: 'claude-skill' as const,
        description: 'Teaches Claude Code to automatically search and install PRPM packages to improve itself during tasks',
        tags: ['prpm', 'autonomous', 'self-improvement', 'discovery', 'claude', 'meta', 'claude-skill'],
        category: 'meta',
        quality_score: 3.50,
      },
      {
        path: path.join(rootDir, '.claude', 'skills', 'aws-beanstalk-expert', 'SKILL.md'),
        id: '@pr-pm/aws-beanstalk-expert',
        type: 'claude-skill' as const,
        description: 'Expert knowledge for deploying, managing, and troubleshooting AWS Elastic Beanstalk applications with production best practices',
        tags: ['aws', 'elastic-beanstalk', 'deployment', 'infrastructure', 'devops', 'pulumi', 'ci-cd', 'troubleshooting', 'claude-skill'],
        category: 'devops',
        quality_score: 5.00,
      },
      {
        path: path.join(rootDir, '.cursor', 'rules', 'creating-cursor-rules.mdc'),
        id: '@pr-pm/creating-cursor-rules',
        type: 'cursor' as const,
        description: 'Meta-rule for creating effective Cursor IDE rules with best practices, patterns, and examples',
        tags: ['meta', 'cursor', 'documentation', 'best-practices', 'project-setup'],
        category: 'meta',
        quality_score: 4.80,
      },
      {
        path: path.join(rootDir, '.claude', 'skills', 'creating-cursor-rules', 'SKILL.md'),
        id: '@pr-pm/creating-cursor-rules-skill',
        type: 'claude-skill' as const,
        description: 'Expert guidance for creating effective Cursor IDE rules with best practices, patterns, and examples',
        tags: ['meta', 'cursor', 'documentation', 'best-practices', 'project-setup', 'claude-skill'],
        category: 'meta',
        quality_score: 4.80,
      },
      {
        path: path.join(rootDir, '.cursor', 'rules', 'creating-skills.mdc'),
        id: '@pr-pm/creating-skills',
        type: 'cursor' as const,
        description: 'Meta-guide for creating effective Claude Code skills with proper structure, CSO optimization, and real examples',
        tags: ['meta', 'skill-creation', 'documentation', 'best-practices'],
        category: 'meta',
        quality_score: 4.70,
      },
      {
        path: path.join(rootDir, '.claude', 'skills', 'creating-skills', 'SKILL.md'),
        id: '@pr-pm/creating-skills-skill',
        type: 'claude-skill' as const,
        description: 'Use when creating new Claude Code skills or improving existing ones - ensures skills are discoverable, scannable, and effective through proper structure, CSO optimization, and real examples',
        tags: ['meta', 'skill-creation', 'documentation', 'best-practices', 'claude-skill'],
        category: 'meta',
        quality_score: 4.80,
      },
      {
        path: path.join(rootDir, '.cursor', 'rules', 'typescript-type-safety.mdc'),
        id: '@pr-pm/typescript-type-safety',
        type: 'cursor' as const,
        description: 'Use when encountering TypeScript any types, type errors, or lax type checking - eliminates type holes and enforces strict type safety through proper interfaces, type guards, and module augmentation',
        tags: ['typescript', 'type-safety', 'best-practices', 'code-quality'],
        category: 'development',
        quality_score: 4.75,
      },
      {
        path: path.join(rootDir, '.claude', 'skills', 'typescript-type-safety', 'SKILL.md'),
        id: '@pr-pm/typescript-type-safety-skill',
        type: 'claude-skill' as const,
        description: 'Use when encountering TypeScript any types, type errors, or lax type checking - eliminates type holes and enforces strict type safety through proper interfaces, type guards, and module augmentation',
        tags: ['typescript', 'type-safety', 'best-practices', 'code-quality', 'claude-skill'],
        category: 'development',
        quality_score: 4.75,
      },
      {
        path: path.join(rootDir, '.claude', 'skills', 'github-actions-testing', 'SKILL.md'),
        id: '@pr-pm/github-actions-testing-skill',
        type: 'claude-skill' as const,
        description: 'Expert guidance for testing and validating GitHub Actions workflows before deployment - catches cache errors, path issues, monorepo dependencies, and service container problems that local testing misses',
        tags: ['github-actions', 'ci-cd', 'testing', 'validation', 'devops', 'workflows', 'actionlint', 'act', 'claude-skill'],
        category: 'devops',
        quality_score: 4.70,
      },
      {
        path: path.join(rootDir, '.cursor', 'rules', 'github-actions-testing.mdc'),
        id: '@pr-pm/github-actions-testing',
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
           VALUES ('prpm', 'team@pr-pm.dev', TRUE, TRUE, NOW(), NOW())
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

        // Upload package content to S3
        let uploadResult;
        try {
          uploadResult = await uploadPackageToS3(skill.id, '1.0.0', content, skill.type);
        } catch (err) {
          console.error(`  ❌ Failed to upload to S3 for ${skill.id}: ${err instanceof Error ? err.message : String(err)}`);
          // Delete the package we just inserted since upload failed
          await pool.query('DELETE FROM packages WHERE id = $1', [dbPackageId]);
          continue;
        }

        // Insert version with S3 URL
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
          uploadResult.url,
          uploadResult.hash,
          uploadResult.size,
          'Initial version',
          JSON.stringify({
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
