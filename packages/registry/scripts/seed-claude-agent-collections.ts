/**
 * Seed collections for Claude agents and slash commands
 * Groups agents with their related slash commands by plugin category
 * Run: npx tsx scripts/seed-claude-agent-collections.ts
 */

import { config } from 'dotenv';
import { Pool } from 'pg';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file from registry root
config({ path: join(__dirname, '..', '.env') });

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://prpm:prpm@localhost:5434/prpm';

const pool = new Pool({
  connectionString: DATABASE_URL,
});

interface Package {
  id: string;
  display_name: string;
  description: string;
  type: string;
  category: string;
  tags: string[];
  author_id: string;
  repository_url: string;
  stars?: number;
}

interface PluginGroup {
  pluginName: string;
  agents: Package[];
  commands: Package[];
  repository: string;
  description: string;
  stars: number;
}

async function seedCollections() {
  try {
    console.log('🌱 Starting Claude agent collections seeding...');

    // Load scraped data
    const dataPath = join(__dirname, '../../../data/scraped/scraped-claude-agents.json');
    const packages: Package[] = JSON.parse(readFileSync(dataPath, 'utf-8'));

    console.log(`📦 Loaded ${packages.length} packages`);

    // Group packages by plugin (for wshobson/agents)
    const pluginGroups = new Map<string, PluginGroup>();

    for (const pkg of packages) {
      // Skip README and non-wshobson packages for now
      if (pkg.id === '@wshobson/agents/README') continue;
      if (!pkg.id.startsWith('@wshobson/agents/')) continue;

      // Extract plugin name from ID: @wshobson/agents/{plugin}/{name}
      const parts = pkg.id.split('/');
      if (parts.length < 4) continue;

      const pluginName = parts[2]; // e.g., "accessibility-compliance"

      if (!pluginGroups.has(pluginName)) {
        pluginGroups.set(pluginName, {
          pluginName,
          agents: [],
          commands: [],
          repository: 'wshobson/agents',
          description: `Collection of agents and commands for ${pluginName.replace(/-/g, ' ')}`,
          stars: pkg.stars || 0,
        });
      }

      const group = pluginGroups.get(pluginName)!;

      if (pkg.type === 'claude-agent') {
        group.agents.push(pkg);
      } else if (pkg.type === 'claude-slash-command') {
        group.commands.push(pkg);
      }
    }

    console.log(`\n📁 Found ${pluginGroups.size} plugin groups\n`);

    // Get prpm user for collection ownership
    const prpmUser = await pool.query(
      'SELECT id FROM users WHERE username = $1',
      ['prpm']
    );

    if (prpmUser.rows.length === 0) {
      throw new Error('prpm user not found. Please run migrations first.');
    }

    const prpmUserId = prpmUser.rows[0].id;

    let collectionsCreated = 0;

    // Create collections for each plugin group
    for (const [pluginName, group] of pluginGroups) {
      if (group.agents.length === 0 && group.commands.length === 0) {
        console.log(`  ⏭️  Skipping ${pluginName} (no packages)`);
        continue;
      }

      // Create collection name and description
      const collectionName = pluginName
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      const description = group.commands.length > 0
        ? `Complete ${collectionName} toolkit with ${group.agents.length} specialized agent${group.agents.length !== 1 ? 's' : ''} and ${group.commands.length} slash command${group.commands.length !== 1 ? 's' : ''} for Claude Code`
        : `${collectionName} agents for Claude Code`;

      // Determine category based on plugin name
      let category = 'utility';
      const pluginLower = pluginName.toLowerCase();

      if (pluginLower.includes('test') || pluginLower.includes('qa')) category = 'testing';
      else if (pluginLower.includes('security') || pluginLower.includes('audit')) category = 'security';
      else if (pluginLower.includes('deploy') || pluginLower.includes('cicd') || pluginLower.includes('devops')) category = 'devops';
      else if (pluginLower.includes('database') || pluginLower.includes('data')) category = 'database';
      else if (pluginLower.includes('frontend') || pluginLower.includes('mobile') || pluginLower.includes('ui')) category = 'frontend';
      else if (pluginLower.includes('backend') || pluginLower.includes('api')) category = 'backend';
      else if (pluginLower.includes('cloud') || pluginLower.includes('kubernetes') || pluginLower.includes('infrastructure')) category = 'cloud';
      else if (pluginLower.includes('doc') || pluginLower.includes('documentation')) category = 'documentation';
      else if (pluginLower.includes('python') || pluginLower.includes('javascript') || pluginLower.includes('typescript') || pluginLower.includes('rust') || pluginLower.includes('golang')) category = 'development';
      else if (pluginLower.includes('ml') || pluginLower.includes('machine-learning') || pluginLower.includes('ai') || pluginLower.includes('llm')) category = 'ai';
      else if (pluginLower.includes('seo') || pluginLower.includes('content') || pluginLower.includes('marketing')) category = 'marketing';
      else if (pluginLower.includes('performance') || pluginLower.includes('monitoring') || pluginLower.includes('observability')) category = 'monitoring';

      // Create tags
      const tags = [
        'claude',
        'agent-collection',
        pluginName,
      ];

      if (group.commands.length > 0) {
        tags.push('slash-commands');
      }

      // Insert collection
      const collectionResult = await pool.query(
        `INSERT INTO collections (
          scope,
          id,
          name,
          version,
          description,
          author_id,
          category,
          tags,
          official,
          verified,
          created_at,
          updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
        ON CONFLICT (scope, id, version) DO UPDATE SET
          description = EXCLUDED.description,
          tags = EXCLUDED.tags,
          updated_at = NOW()
        RETURNING scope, id, version`,
        [
          'collection', // Use 'collection' scope for official collections
          pluginName,
          collectionName,
          '1.0.0',
          description,
          prpmUserId,
          category,
          tags,
          false, // not official (community-contributed)
          false, // not verified
        ]
      );

      const collectionScope = collectionResult.rows[0].scope;
      const collectionId = collectionResult.rows[0].id;
      const collectionVersion = collectionResult.rows[0].version;

      // Add packages to collection
      const allPackages = [...group.agents, ...group.commands];
      let packagesAdded = 0;

      for (let i = 0; i < allPackages.length; i++) {
        const pkg = allPackages[i];

        // Get package UUID from database by name
        const pkgResult = await pool.query(
          'SELECT id FROM packages WHERE name = $1',
          [pkg.id]
        );

        if (pkgResult.rows.length === 0) {
          console.log(`  ⚠️  Package not found in DB: ${pkg.id}`);
          continue;
        }

        const packageId = pkgResult.rows[0].id;

        // Add to collection
        await pool.query(
          `INSERT INTO collection_packages (
            collection_scope,
            collection_id,
            collection_version,
            package_id,
            install_order
          ) VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (collection_scope, collection_id, collection_version, package_id) DO NOTHING`,
          [collectionScope, collectionId, collectionVersion, packageId, i]
        );

        packagesAdded++;
      }

      collectionsCreated++;
      console.log(`  ✅ ${collectionName}: ${packagesAdded} packages (${group.agents.length} agents, ${group.commands.length} commands)`);
    }

    // Create a "featured" collection with top agents across all plugins
    console.log('\n📌 Creating featured collections...\n');

    // Top Development Agents
    const topDevAgents = packages.filter(p =>
      p.type === 'claude-agent' &&
      (p.category === 'development' ||
       p.display_name.toLowerCase().includes('developer') ||
       p.display_name.toLowerCase().includes('architect'))
    ).slice(0, 20);

    if (topDevAgents.length > 0) {
      await createFeaturedCollection(
        pool,
        prpmUserId,
        'Essential Development Agents',
        'essential-dev-agents',
        'Must-have Claude agents for software development and architecture',
        topDevAgents,
        'development',
        ['featured', 'development', 'agents', 'claude']
      );
      collectionsCreated++;
    }

    // Top DevOps/Cloud Agents
    const topDevOpsAgents = packages.filter(p =>
      p.type === 'claude-agent' &&
      (p.category === 'devops' ||
       p.display_name.toLowerCase().includes('cloud') ||
       p.display_name.toLowerCase().includes('kubernetes') ||
       p.display_name.toLowerCase().includes('terraform'))
    ).slice(0, 15);

    if (topDevOpsAgents.length > 0) {
      await createFeaturedCollection(
        pool,
        prpmUserId,
        'DevOps & Cloud Automation',
        'devops-cloud-agents',
        'Agents for cloud infrastructure, deployment, and DevOps automation',
        topDevOpsAgents,
        'devops',
        ['featured', 'devops', 'cloud', 'agents', 'claude']
      );
      collectionsCreated++;
    }

    // Top Security Agents
    const topSecurityAgents = packages.filter(p =>
      p.type === 'claude-agent' &&
      (p.category === 'security' ||
       p.display_name.toLowerCase().includes('security') ||
       p.display_name.toLowerCase().includes('audit'))
    ).slice(0, 15);

    if (topSecurityAgents.length > 0) {
      await createFeaturedCollection(
        pool,
        prpmUserId,
        'Security & Code Review',
        'security-review-agents',
        'Security auditing and comprehensive code review agents',
        topSecurityAgents,
        'security',
        ['featured', 'security', 'audit', 'agents', 'claude']
      );
      collectionsCreated++;
    }

    console.log(`\n✅ Successfully created ${collectionsCreated} collections!`);

    // Show stats
    const stats = await pool.query(`
      SELECT
        c.category,
        COUNT(DISTINCT c.id) as count,
        COUNT(cp.package_id) as total_packages
      FROM collections c
      LEFT JOIN collection_packages cp ON c.scope = cp.collection_scope AND c.id = cp.collection_id AND c.version = cp.collection_version
      WHERE c.tags @> ARRAY['agent-collection']::TEXT[]
      GROUP BY c.category
      ORDER BY count DESC
    `);

    console.log('\n📊 Collection Statistics:');
    stats.rows.forEach((row) => {
      console.log(`  ${row.category}: ${row.count} collections, ${row.total_packages} total packages`);
    });

    const total = await pool.query(`
      SELECT
        COUNT(DISTINCT c.id) as count,
        COUNT(cp.package_id) as total_packages
      FROM collections c
      LEFT JOIN collection_packages cp ON c.scope = cp.collection_scope AND c.id = cp.collection_id AND c.version = cp.collection_version
      WHERE c.tags @> ARRAY['agent-collection']::TEXT[]
    `);
    console.log(`\n📦 Total agent collections: ${total.rows[0].count} (${total.rows[0].total_packages} packages)`);

  } catch (error: unknown) {
    console.error('❌ Seed failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

async function createFeaturedCollection(
  pool: Pool,
  curatorId: string,
  name: string,
  slug: string,
  description: string,
  packages: Package[],
  category: string,
  tags: string[]
) {
  // Insert collection
  const collectionResult = await pool.query(
    `INSERT INTO collections (
      scope,
      id,
      name,
      version,
      description,
      author_id,
      category,
      tags,
      official,
      verified,
      created_at,
      updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
    ON CONFLICT (scope, id, version) DO UPDATE SET
      description = EXCLUDED.description,
      tags = EXCLUDED.tags,
      updated_at = NOW()
    RETURNING scope, id, version`,
    ['collection', slug, name, '1.0.0', description, curatorId, category, tags, true, true]
  );

  const collectionScope = collectionResult.rows[0].scope;
  const collectionId = collectionResult.rows[0].id;
  const collectionVersion = collectionResult.rows[0].version;

  // Add packages to collection
  let packagesAdded = 0;
  for (let i = 0; i < packages.length; i++) {
    const pkg = packages[i];

    const pkgResult = await pool.query(
      'SELECT id FROM packages WHERE name = $1',
      [pkg.id]
    );

    if (pkgResult.rows.length === 0) continue;

    const packageId = pkgResult.rows[0].id;

    await pool.query(
      `INSERT INTO collection_packages (
        collection_scope,
        collection_id,
        collection_version,
        package_id,
        install_order
      ) VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (collection_scope, collection_id, collection_version, package_id) DO NOTHING`,
      [collectionScope, collectionId, collectionVersion, packageId, i]
    );

    packagesAdded++;
  }

  console.log(`  ✅ ${name}: ${packagesAdded} packages`);
}

seedCollections().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
