/**
 * Search command - Search for packages in the registry
 */

import { Command } from 'commander';
import { getRegistryClient, SearchResult } from '@prpm/registry-client';
import { getConfig } from '../core/user-config';
import { telemetry } from '../core/telemetry';
import { PackageType } from '../types';

// User-friendly CLI types
type CLIPackageType = 'skill' | 'agent' | 'rule' | 'plugin' | 'prompt' | 'workflow' | 'tool' | 'template' | 'mcp';

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

/**
 * Map user-friendly CLI types to registry schema
 */
function mapTypeToRegistry(cliType: CLIPackageType): { type?: PackageType; tags?: string[] } {
  const typeMap: Record<CLIPackageType, { type?: PackageType; tags?: string[] }> = {
    rule: { type: 'cursor', tags: ['cursor-rule'] },
    skill: { type: 'claude', tags: ['claude-skill'] },
    agent: { type: 'claude' },
    mcp: { type: 'generic', tags: ['mcp', 'mcp-server'] },
    plugin: { type: 'generic', tags: ['plugin'] },
    prompt: { type: 'generic', tags: ['prompt'] },
    workflow: { type: 'generic', tags: ['workflow'] },
    tool: { type: 'generic', tags: ['tool'] },
    template: { type: 'generic', tags: ['template'] },
  };
  return typeMap[cliType] || {};
}

export async function handleSearch(
  query: string,
  options: { type?: CLIPackageType; limit?: number }
): Promise<void> {
  const startTime = Date.now();
  let success = false;
  let error: string | undefined;
  let result: SearchResult | null = null;

  try {
    // Allow empty query when filtering by type
    if (query) {
      console.log(`🔍 Searching for "${query}"...`);
    } else if (options.type) {
      console.log(`🔍 Listing ${options.type} packages...`);
    } else {
      console.log('❌ Please provide a search query or use --type to filter by package type');
      console.log('\n💡 Examples:');
      console.log('   prpm search react');
      console.log('   prpm search --type skill');
      console.log('   prpm search react --type rule');
      return;
    }

    const config = await getConfig();
    const client = getRegistryClient(config);

    // Map CLI type to registry schema
    const searchOptions: Record<string, unknown> = {
      limit: options.limit || 20,
    };

    if (options.type) {
      const mapped = mapTypeToRegistry(options.type);
      if (mapped.type) {
        searchOptions.type = mapped.type;
      }
      if (mapped.tags) {
        searchOptions.tags = mapped.tags;
      }
    }

    result = await client.search(query || '', searchOptions);

    if (!result || result.packages.length === 0) {
      console.log('\n❌ No packages found');
      console.log(`\nTry:`);
      console.log(`  - Broadening your search terms`);
      console.log(`  - Checking spelling`);
      console.log(`  - Browsing trending: prpm trending`);
      return;
    }

    console.log(`\n✨ Found ${result.total} package(s):\n`);

    // Display results
    result.packages.forEach((pkg) => {
      const badges: string[] = [];
      if (pkg.featured || pkg.official) badges.push('Official');
      if (pkg.verified && !pkg.featured && !pkg.official) badges.push('Verified');

      const badgeStr = badges.length > 0 ? `[${badges.join(', ')}] ` : '';
      const rating = pkg.rating_average ? `⭐ ${pkg.rating_average.toFixed(1)}` : '';
      const downloads = pkg.total_downloads >= 1000
        ? `${(pkg.total_downloads / 1000).toFixed(1)}k`
        : pkg.total_downloads;
      const typeIcon = getTypeIcon(pkg.type);
      const typeLabel = getTypeLabel(pkg.type);

      console.log(`${badgeStr}${pkg.display_name} ${rating}`);
      console.log(`    ${pkg.description || 'No description'}`);
      console.log(`    📦 ${pkg.id} | ${typeIcon} ${typeLabel} | 📥 ${downloads} | 🏷️  ${pkg.tags.slice(0, 3).join(', ')}`);
      console.log();
    });

    console.log(`\n💡 Install a package: prpm install <package-id>`);
    console.log(`   Get more info: prpm info <package-id>`);

    if (result.total > result.packages.length) {
      console.log(`\n   Showing ${result.packages.length} of ${result.total} results`);
    }

    success = true;
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
    console.error(`\n❌ Search failed: ${error}`);
    console.log(`\n💡 Tip: Make sure you have internet connection`);
    console.log(`   Registry: ${process.env.PRPM_REGISTRY_URL || 'https://registry.prpm.dev'}`);
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
    .argument('[query]', 'Search query (optional when using --type)')
    .option('--type <type>', 'Filter by package type (skill, agent, rule, plugin, prompt, workflow, tool, template, mcp)')
    .option('--limit <number>', 'Number of results to show', '20')
    .action(async (query: string | undefined, options: { type?: string; limit?: string; tags?: string }) => {
      const type = options.type as CLIPackageType | undefined;
      const limit = options.limit ? parseInt(options.limit, 10) : 20;

      const validTypes: CLIPackageType[] = ['skill', 'agent', 'rule', 'plugin', 'prompt', 'workflow', 'tool', 'template', 'mcp'];
      if (options.type && !validTypes.includes(type!)) {
        console.error(`❌ Type must be one of: ${validTypes.join(', ')}`);
        console.log(`\n💡 Examples:`);
        console.log(`   prpm search postgres --type skill`);
        console.log(`   prpm search debugging --type agent`);
        console.log(`   prpm search react --type rule`);
        console.log(`   prpm search --type skill  # List all skills`);
        process.exit(1);
      }

      await handleSearch(query || '', { type, limit });
    });

  return command;
}
