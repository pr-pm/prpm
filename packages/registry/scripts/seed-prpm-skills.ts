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
  display_name: string;
  description: string;
  author: string;
  content: string;
  tags: string[];
  category?: string;
  official: boolean;
  verified: boolean;
  readme?: string;
}

async function seedSkills() {
  try {
    console.log('📦 Seeding PRPM skills...\n');

    // Read the skill files
    const rootDir = path.join(__dirname, '..', '..', '..');

    const skillFiles = [
      {
        path: path.join(rootDir, 'pulumi-troubleshooting-skill.md'),
        id: '@prpm/pulumi-troubleshooting-skill',
        type: 'cursor' as const,
        display_name: 'Pulumi Troubleshooting Skill',
        description: 'Comprehensive guide to troubleshooting common Pulumi TypeScript errors, infrastructure issues, and best practices',
        tags: ['pulumi', 'infrastructure', 'troubleshooting', 'typescript', 'aws', 'devops'],
        category: 'devops',
      },
      {
        path: path.join(rootDir, 'packages', 'prpm-self-improve-cursor.md'),
        id: '@prpm/self-improve-cursor',
        type: 'cursor' as const,
        display_name: 'PRPM Self-Improve (Cursor)',
        description: 'Teaches Cursor to automatically search and install PRPM packages to improve itself during tasks',
        tags: ['prpm', 'autonomous', 'self-improvement', 'discovery', 'cursor', 'meta'],
        category: 'meta',
      },
      {
        path: path.join(rootDir, 'packages', 'prpm-self-improve-windsurf.md'),
        id: '@prpm/self-improve-windsurf',
        type: 'windsurf' as const,
        display_name: 'PRPM Self-Improve (Windsurf)',
        description: 'Teaches Windsurf to automatically search and install PRPM packages to improve itself during tasks',
        tags: ['prpm', 'autonomous', 'self-improvement', 'discovery', 'windsurf', 'meta'],
        category: 'meta',
      },
      {
        path: path.join(rootDir, 'packages', 'prpm-self-improve-continue.md'),
        id: '@prpm/self-improve-continue',
        type: 'continue' as const,
        display_name: 'PRPM Self-Improve (Continue)',
        description: 'Teaches Continue to automatically search and install PRPM packages to improve itself during tasks',
        tags: ['prpm', 'autonomous', 'self-improvement', 'discovery', 'continue', 'meta'],
        category: 'meta',
      },
      {
        path: path.join(rootDir, 'packages', 'prpm-self-improve-claude.md'),
        id: '@prpm/self-improve-claude',
        type: 'claude' as const,
        display_name: 'PRPM Self-Improve (Claude Code)',
        description: 'Teaches Claude Code to automatically search and install PRPM packages to improve itself during tasks',
        tags: ['prpm', 'autonomous', 'self-improvement', 'discovery', 'claude', 'meta', 'claude-skill'],
        category: 'meta',
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
          'SELECT id FROM packages WHERE id = $1',
          [skill.id]
        );

        if (existing.rows.length > 0) {
          console.log(`  ⏭️  Skipped: ${skill.id} (already exists)`);
          skipped++;
          continue;
        }

        // Insert package
        const pkgResult = await pool.query(`
          INSERT INTO packages (
            id, type, display_name, description,
            tags, category, verified, featured,
            visibility, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4,
            $5, $6, $7, $8,
            $9, NOW(), NOW()
          )
          ON CONFLICT (id) DO NOTHING
          RETURNING id
        `, [
          skill.id,
          skill.type,
          skill.display_name,
          skill.description,
          skill.tags,
          skill.category,
          true, // verified
          true, // featured (official)
          'public', // visibility
        ]);

        // If package already exists, skip
        if (pkgResult.rows.length === 0) {
          console.log(`  ⏭️  Skipped: ${skill.id} (already exists)`);
          skipped++;
          continue;
        }

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
          skill.id,
          '1.0.0',
          `https://registry.prpm.dev/packages/${skill.id}/1.0.0.tar.gz`,
          'placeholder-hash',
          content.length,
          'Initial version',
          JSON.stringify({
            content: content,
            sourceUrl: skill.path,
            originalType: skill.type,
          }),
        ]);

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
