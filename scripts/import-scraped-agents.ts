#!/usr/bin/env node

/**
 * Import scraped Claude agents into the registry database
 */

import pg from 'pg';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ScrapedAgent {
  name: string;
  description: string;
  content: string;
  source: string;
  sourceUrl: string;
  author: string;
  tags: string[];
  type: 'claude' | 'cursor';
}

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'prpm_registry',
  user: 'prpm',
  password: 'prpm_dev_password',
});

async function importAgents() {
  try {
    console.log('📦 Loading scraped agents...');
    const agentsFile = path.join(__dirname, 'scraped', 'claude-agents.json');
    const data = await fs.readFile(agentsFile, 'utf-8');
    const agents: ScrapedAgent[] = JSON.parse(data);

    console.log(`📋 Found ${agents.length} agents to import`);

    let imported = 0;
    let skipped = 0;
    let errors = 0;

    for (const agent of agents) {
      try {
        // Check if package already exists
        const existing = await pool.query(
          'SELECT id FROM packages WHERE id = $1',
          [agent.name]
        );

        if (existing.rows.length > 0) {
          console.log(`  ⏭️  Skipped: ${agent.name} (already exists)`);
          skipped++;
          continue;
        }

        // Extract version from frontmatter if present, otherwise use 1.0.0
        const version = '1.0.0';

        // Create package
        await pool.query(`
          INSERT INTO packages (
            id, scope, name, version, type, description,
            readme, tags, author, author_id,
            verified, featured, total_downloads,
            created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6,
            $7, $8, $9, $10,
            $11, $12, $13,
            NOW(), NOW()
          )
        `, [
          agent.name,
          agent.author,
          agent.name.replace(`-${agent.author}`, ''),
          version,
          agent.type,
          agent.description,
          agent.content,
          agent.tags,
          agent.author,
          null, // No user_id for scraped content
          false, // Not verified
          false, // Not featured
          0, // No downloads yet
        ]);

        console.log(`  ✅ Imported: ${agent.name}`);
        imported++;

      } catch (error) {
        console.error(`  ❌ Error importing ${agent.name}:`, error);
        errors++;
      }
    }

    console.log('\n📊 Import Summary:');
    console.log(`   ✅ Imported: ${imported}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   ❌ Errors: ${errors}`);
    console.log(`   📦 Total: ${agents.length}`);

  } catch (error) {
    console.error('❌ Failed to import agents:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

importAgents();
