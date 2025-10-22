/**
 * Search command - Search for packages in the registry
 */

import { Command } from 'commander';
import { getRegistryClient, SearchResult, RegistryPackage } from '@prpm/registry-client';
import { getConfig } from '../core/user-config';
import { telemetry } from '../core/telemetry';
import { PackageType } from '../types';
import * as readline from 'readline';

// User-friendly CLI types
type CLIPackageType = 'skill' | 'agent' | 'command' | 'slash-command' | 'rule' | 'plugin' | 'prompt' | 'workflow' | 'tool' | 'template' | 'mcp';

/**
 * Get icon for package type
 */
function getTypeIcon(type: string): string {
  const icons: Record<string, string> = {
    skill: '🎓',
    agent: '🤖',
    command: '⚡',
    'slash-command': '⚡',
    'claude-slash-command': '⚡',
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
    command: 'Slash Command',
    'slash-command': 'Slash Command',
    'claude-slash-command': 'Slash Command',
    'claude-agent': 'Agent',
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
    // Skills are packages with type=claude-skill
    skill: { type: 'claude-skill' },
    // Agents are packages with type=claude-agent or claude (not claude-skill)
    agent: { type: 'claude-agent' },
    // Slash commands are packages with type=claude-slash-command
    command: { type: 'claude-slash-command' },
    'slash-command': { type: 'claude-slash-command' },
    mcp: { type: 'mcp' },
    plugin: { type: 'generic', tags: ['plugin'] },
    prompt: { type: 'generic', tags: ['prompt'] },
    workflow: { type: 'generic', tags: ['workflow'] },
    tool: { type: 'generic', tags: ['tool'] },
    template: { type: 'generic', tags: ['template'] },
  };
  return typeMap[cliType] || {};
}

/**
 * Build webapp URL for search results
 */
function buildWebappUrl(query: string, options: { type?: CLIPackageType; author?: string }, page: number = 1): string {
  const baseUrl = process.env.PRPM_WEBAPP_URL || 'https://app.prpm.dev';
  const params = new URLSearchParams();

  if (query) params.append('q', query);
  if (options.type) params.append('type', options.type);
  if (options.author) params.append('author', options.author);
  if (page > 1) params.append('page', page.toString());

  return `${baseUrl}/search?${params.toString()}`;
}

/**
 * Display search results
 */
function displayResults(packages: RegistryPackage[], total: number, page: number, limit: number): void {
  const startIdx = (page - 1) * limit + 1;
  const endIdx = Math.min(page * limit, total);

  console.log('\n' + '─'.repeat(80));
  console.log(`📦 Results ${startIdx}-${endIdx} of ${total}`.padEnd(80));
  console.log('─'.repeat(80) + '\n');

  packages.forEach((pkg, idx) => {
    const num = startIdx + idx;
    const rating = pkg.rating_average ? `⭐ ${pkg.rating_average.toFixed(1)}` : '';
    const downloads = pkg.total_downloads >= 1000
      ? `${(pkg.total_downloads / 1000).toFixed(1)}k`
      : pkg.total_downloads;
    const typeIcon = getTypeIcon(pkg.type);
    const typeLabel = getTypeLabel(pkg.type);

    // Add verified badge
    let verifiedBadge = '';
    if (pkg.featured || pkg.official || pkg.verified) {
      verifiedBadge = ' | ✅ Verified';
    }

    console.log(`\x1b[1m${num}. ${pkg.name}\x1b[0m ${rating}`);
    console.log(`   ${pkg.description || 'No description'}`);
    console.log(`   ${typeIcon} ${typeLabel} | 📥 ${downloads} downloads | 🏷️  ${pkg.tags.slice(0, 3).join(', ')}${verifiedBadge}`);
    console.log();
  });

  console.log('─'.repeat(80));
}

/**
 * Prompt user for pagination action
 */
function promptUser(): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question('', (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase());
    });
  });
}

/**
 * Interactive pagination handler
 */
async function handlePagination(
  query: string,
  options: { type?: CLIPackageType; author?: string; limit: number },
  client: any,
  searchOptions: Record<string, unknown>,
  initialResult: SearchResult,
  webappBaseUrl: string
): Promise<void> {
  let currentPage = 1;
  let result = initialResult;
  const totalPages = Math.ceil(result.total / options.limit);

  while (true) {
    // Display current page
    displayResults(result.packages, result.total, currentPage, options.limit);

    // Show navigation options
    console.log('\n💡 \x1b[1mOptions:\x1b[0m');
    if (currentPage < totalPages) {
      console.log('   \x1b[36mn\x1b[0m - Next page');
    }
    if (currentPage > 1) {
      console.log('   \x1b[36mp\x1b[0m - Previous page');
    }
    console.log('   \x1b[36m1-' + result.packages.length + '\x1b[0m - Install package by number');
    console.log('   \x1b[36mw\x1b[0m - View in web browser');
    console.log('   \x1b[36mq\x1b[0m - Quit');

    // Show webapp link
    const webappUrl = buildWebappUrl(query, options, currentPage);
    console.log(`\n🌐 \x1b[2mView in browser: ${webappUrl}\x1b[0m`);

    process.stdout.write('\n👉 ');
    const input = await promptUser();

    if (input === 'q' || input === 'quit' || input === 'exit') {
      console.log('\n✨ Happy coding!\n');
      break;
    }

    if (input === 'n' || input === 'next') {
      if (currentPage < totalPages) {
        currentPage++;
        const offset = (currentPage - 1) * options.limit;
        result = await client.search(query || '', { ...searchOptions, offset });
        console.clear();
      } else {
        console.log('\n❌ Already on last page');
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.clear();
      }
      continue;
    }

    if (input === 'p' || input === 'prev' || input === 'previous') {
      if (currentPage > 1) {
        currentPage--;
        const offset = (currentPage - 1) * options.limit;
        result = await client.search(query || '', { ...searchOptions, offset });
        console.clear();
      } else {
        console.log('\n❌ Already on first page');
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.clear();
      }
      continue;
    }

    if (input === 'w' || input === 'web' || input === 'browser') {
      const url = buildWebappUrl(query, options, currentPage);
      console.log(`\n🌐 Opening: ${url}`);
      console.log('   (Copy and paste this URL into your browser)\n');
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.clear();
      continue;
    }

    // Check if input is a number for installation
    const num = parseInt(input, 10);
    if (!isNaN(num) && num >= 1 && num <= result.packages.length) {
      const pkg = result.packages[num - 1];
      console.log(`\n📦 To install: \x1b[36mprpm install ${pkg.name}\x1b[0m`);
      console.log(`   More info: \x1b[36mprpm info ${pkg.name}\x1b[0m\n`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.clear();
      continue;
    }

    console.log('\n❌ Invalid option. Try again.');
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.clear();
  }
}

export async function handleSearch(
  query: string,
  options: { type?: CLIPackageType; author?: string; limit?: number; page?: number; interactive?: boolean }
): Promise<void> {
  const startTime = Date.now();
  let success = false;
  let error: string | undefined;
  let result: SearchResult | null = null;
  let registryUrl = '';

  try {
    // Allow empty query when filtering by type or author
    if (query) {
      console.log(`🔍 Searching for "${query}"...`);
    } else if (options.type) {
      console.log(`🔍 Listing ${options.type} packages...`);
    } else if (options.author) {
      console.log(`🔍 Listing packages by @${options.author}...`);
    } else {
      console.log('❌ Please provide a search query or use --type/--author to filter');
      console.log('\n💡 Examples:');
      console.log('   prpm search react');
      console.log('   prpm search --type skill');
      console.log('   prpm search --author prpm');
      console.log('   prpm search react --type rule');
      return;
    }

    const config = await getConfig();
    registryUrl = config.registryUrl || 'https://registry.prpm.dev';
    const client = getRegistryClient(config);

    // Map CLI type to registry schema
    const limit = options.limit || 20;
    const page = options.page || 1;
    const offset = (page - 1) * limit;

    const searchOptions: Record<string, unknown> = {
      limit,
      offset,
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

    if (options.author) {
      searchOptions.author = options.author;
    }

    result = await client.search(query || '', searchOptions);

    if (!result || result.packages.length === 0) {
      console.log('\n❌ No packages found');
      console.log(`\nTry:`);
      console.log(`  - Broadening your search terms`);
      console.log(`  - Checking spelling`);
      console.log(`  - Browsing trending: prpm trending`);

      // Suggest webapp even if no results
      const webappUrl = buildWebappUrl(query, options);
      console.log(`\n🌐 View in browser: ${webappUrl}`);
      return;
    }

    // If interactive mode is disabled or only one page, show simple results
    const totalPages = Math.ceil(result.total / limit);
    const shouldPaginate = options.interactive !== false && totalPages > 1;

    if (!shouldPaginate) {
      displayResults(result.packages, result.total, page, limit);

      console.log('\n💡 \x1b[1mQuick Actions:\x1b[0m');
      console.log('   Install: \x1b[36mprpm install <package-id>\x1b[0m');
      console.log('   More info: \x1b[36mprpm info <package-id>\x1b[0m');

      if (totalPages > 1) {
        console.log(`\n📄 \x1b[1mMore Results:\x1b[0m`);
        console.log(`   Page ${page} of ${totalPages}`);
        if (page < totalPages) {
          console.log(`   Next page: \x1b[36mprpm search "${query}" --page ${page + 1}\x1b[0m`);
        }
        console.log(`   Interactive mode: \x1b[36mprpm search "${query}" --interactive\x1b[0m`);
      }

      // Always show webapp link
      const webappUrl = buildWebappUrl(query, options, page);
      console.log(`\n🌐 \x1b[1mView in Browser:\x1b[0m`);
      console.log(`   ${webappUrl}`);
      if (page < totalPages) {
        const nextPageUrl = buildWebappUrl(query, options, page + 1);
        console.log(`   Next page: ${nextPageUrl}`);
      }
      console.log();
    } else {
      // Interactive pagination mode
      await handlePagination(query, { ...options, limit }, client, searchOptions, result, registryUrl);
    }

    success = true;
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
    console.error(`\n❌ Search failed: ${error}`);
    console.log(`   Registry: ${registryUrl}`);

    // Provide helpful hint if using localhost
    if (registryUrl.includes('localhost')) {
      console.log(`\n💡 Tip: You're using a local registry. Make sure it's running or update ~/.prpmrc`);
      console.log(`   To use the production registry, remove the registryUrl from ~/.prpmrc`);
    }

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
        page: options.page,
        interactive: options.interactive,
      },
    });

    // Ensure telemetry is flushed before exit
    await telemetry.shutdown();
  }
}

export function createSearchCommand(): Command {
  const command = new Command('search');

  command
    .description('Search for packages in the registry')
    .argument('[query]', 'Search query (optional when using --type or --author)')
    .option('--type <type>', 'Filter by package type (skill, agent, command, slash-command, rule, plugin, prompt, workflow, tool, template, mcp)')
    .option('--author <username>', 'Filter by author username')
    .option('--limit <number>', 'Number of results per page', '20')
    .option('--page <number>', 'Page number (default: 1)', '1')
    .option('--interactive', 'Enable interactive pagination (default: true for multiple pages)', true)
    .option('--no-interactive', 'Disable interactive pagination')
    .action(async (query: string | undefined, options: { type?: string; author?: string; limit?: string; page?: string; interactive?: boolean }) => {
      const type = options.type as CLIPackageType | undefined;
      const author = options.author;
      const limit = options.limit ? parseInt(options.limit, 10) : 20;
      const page = options.page ? parseInt(options.page, 10) : 1;

      const validTypes: CLIPackageType[] = ['skill', 'agent', 'command', 'slash-command', 'rule', 'plugin', 'prompt', 'workflow', 'tool', 'template', 'mcp'];
      if (options.type && !validTypes.includes(type!)) {
        console.error(`❌ Type must be one of: ${validTypes.join(', ')}`);
        console.log(`\n💡 Examples:`);
        console.log(`   prpm search postgres --type skill`);
        console.log(`   prpm search debugging --type agent`);
        console.log(`   prpm search refactor --type command`);
        console.log(`   prpm search react --type rule`);
        console.log(`   prpm search --type command  # List all slash commands`);
        console.log(`   prpm search --type skill  # List all skills`);
        console.log(`   prpm search --author prpm  # List packages by @prpm`);
        process.exit(1);
      }

      await handleSearch(query || '', { type, author, limit, page, interactive: options.interactive });
    });

  return command;
}
