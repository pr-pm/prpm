/**
 * Search command - Search for packages in the registry
 */

import { Command } from 'commander';
import { getRegistryClient } from '@prmp/registry-client';
import { getConfig } from '../core/user-config';
import { telemetry } from '../core/telemetry';
import { PackageType } from '../types';

/**
 * Get icon for package type
 */
function getTypeIcon(type: string): string {
  const icons: Record<string, string> = {
    skill: '🎓',
    agent: '🤖',
    rule: '📋',
    plugin: '🔌',
    prompt: '💬',
    workflow: '⚡',
    tool: '🔧',
    template: '📄',
    mcp: '🔗',
  };
  return icons[type] || '📦';
}

/**
 * Get human-readable label for package type
 */
function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    skill: 'Skill',
    agent: 'Agent',
    rule: 'Rule',
    plugin: 'Plugin',
    prompt: 'Prompt',
    workflow: 'Workflow',
    tool: 'Tool',
    template: 'Template',
    mcp: 'MCP Server',
  };
  return labels[type] || type;
}

export async function handleSearch(
  query: string,
  options: { type?: PackageType; limit?: number }
): Promise<void> {
  const startTime = Date.now();
  let success = false;
  let error: string | undefined;
  let result: any = null;

  try {
    console.log(`🔍 Searching for "${query}"...`);

    const config = await getConfig();
    const client = getRegistryClient(config);
    result = await client.search(query, {
      type: options.type,
      limit: options.limit || 20,
    });

    if (result.packages.length === 0) {
      console.log('\n❌ No packages found');
      console.log(`\nTry:`);
      console.log(`  - Broadening your search terms`);
      console.log(`  - Checking spelling`);
      console.log(`  - Browsing trending: prmp trending`);
      return;
    }

    console.log(`\n✨ Found ${result.total} package(s):\n`);

    // Display results
    result.packages.forEach((pkg: any) => {
      const verified = pkg.verified ? '✓' : ' ';
      const rating = pkg.rating_average ? `⭐ ${pkg.rating_average.toFixed(1)}` : '';
      const downloads = pkg.total_downloads >= 1000
        ? `${(pkg.total_downloads / 1000).toFixed(1)}k`
        : pkg.total_downloads;
      const typeIcon = getTypeIcon(pkg.type);
      const typeLabel = getTypeLabel(pkg.type);

      console.log(`[${verified}] ${pkg.display_name} ${rating} ${pkg.official ? '🏅' : ''}`);
      console.log(`    ${pkg.description || 'No description'}`);
      console.log(`    📦 ${pkg.id} | ${typeIcon} ${typeLabel} | 📥 ${downloads} | 🏷️  ${pkg.tags.slice(0, 3).join(', ')}`);
      console.log();
    });

    console.log(`\n💡 Install a package: prmp install <package-id>`);
    console.log(`   Get more info: prmp info <package-id>`);

    if (result.total > result.packages.length) {
      console.log(`\n   Showing ${result.packages.length} of ${result.total} results`);
    }

    success = true;
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
    console.error(`\n❌ Search failed: ${error}`);
    console.log(`\n💡 Tip: Make sure you have internet connection`);
    console.log(`   Registry: ${process.env.PRMP_REGISTRY_URL || 'https://registry.prmp.dev'}`);
    process.exit(1);
  } finally {
    await telemetry.track({
      command: 'search',
      success,
      error,
      duration: Date.now() - startTime,
      data: {
        query: query.substring(0, 100),
        type: options.type,
        resultCount: success && result ? result.packages.length : 0,
      },
    });
  }
}

export function createSearchCommand(): Command {
  const command = new Command('search');

  command
    .description('Search for packages in the registry')
    .argument('<query>', 'Search query')
    .option('--type <type>', 'Filter by package type (skill, agent, rule, plugin, prompt, workflow, tool, template, mcp)')
    .option('--limit <number>', 'Number of results to show', '20')
    .action(async (query: string, options: any) => {
      const type = options.type as PackageType | undefined;
      const limit = parseInt(options.limit, 10);

      const validTypes = ['skill', 'agent', 'rule', 'plugin', 'prompt', 'workflow', 'tool', 'template', 'mcp'];
      if (options.type && !validTypes.includes(type!)) {
        console.error(`❌ Type must be one of: ${validTypes.join(', ')}`);
        console.log(`\n💡 Examples:`);
        console.log(`   prpm search postgres --type skill`);
        console.log(`   prpm search debugging --type agent`);
        console.log(`   prpm search react --type rule`);
        process.exit(1);
      }

      await handleSearch(query, { type, limit });
    });

  return command;
}
