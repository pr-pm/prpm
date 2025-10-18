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
    const agentsFile = path.join(__dirname, '../../scripts/scraped/claude-agents.json');
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
        // Note: In a real implementation, versions would be stored separately with tarball URLs
        // For this import, we're just creating packages without version entries
        await pool.query(`
          INSERT INTO packages (
            id, display_name, type, description,
            tags, author_id,
            verified, featured, total_downloads,
            version_count,
            created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4,
            $5, $6,
            $7, $8, $9,
            $10,
            NOW(), NOW()
          )
        `, [
          agent.name,
          agent.name,
          agent.type,
          agent.description,
          agent.tags,
          null, // No user_id for scraped content
          false, // Not verified
          false, // Not featured
          0, // No downloads yet
          1, // Has 1 version
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
