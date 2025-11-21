/**
 * Search command - Search for packages in the registry
 */

import { Command } from 'commander';
import { getRegistryClient, SearchResult, RegistryPackage } from '@pr-pm/registry-client';
import { getConfig } from '../core/user-config';
import { telemetry } from '../core/telemetry';
import { Format, Subtype } from '../types';
import * as readline from 'readline';
import { CLIError } from '../core/errors';

/**
 * Get icon for package format and subtype
 */
function getPackageIcon(format: Format, subtype: Subtype): string {
  // Subtype icons take precedence
  const subtypeIcons: Record<Subtype, string> = {
    'skill': '🎓',
    'agent': '🤖',
    'slash-command': '⚡',
    'rule': '📋',
    'prompt': '💬',
    'collection': '📦',
    'chatmode': '💬',
    'tool': '🔧',
    'hook': '🪝',
    'workflow': '🔄',
    'template': '📄',
  };

  // Format-specific icons for rules/defaults
  const formatIcons: Record<Format, string> = {
    'claude': '🤖',
    'cursor': '📋',
    'windsurf': '🌊',
    'continue': '➡️',
    'copilot': '✈️',
    'kiro': '🎯',
    'gemini': '✨',
    'gemini.md': '✨',
    'claude.md': '🤖',
    'opencode': '⚡',
    'droid': '🏭',
    'mcp': '🔗',
    'agents.md': '📝',
    'ruler': '📏',
    'generic': '📦',
  };

  return subtypeIcons[subtype] || formatIcons[format] || '📦';
}

/**
 * Get human-readable label for package format and subtype
 */
function getPackageLabel(format: Format, subtype: Subtype): string {
  const formatLabels: Record<Format, string> = {
    'claude': 'Claude',
    'cursor': 'Cursor',
    'windsurf': 'Windsurf',
    'continue': 'Continue',
    'copilot': 'GitHub Copilot',
    'kiro': 'Kiro',
    'gemini': 'Gemini',
    'gemini.md': 'Gemini',
    'claude.md': 'Claude',
    'opencode': 'OpenCode',
    'droid': 'Factory Droid',
    'mcp': 'MCP',
    'agents.md': 'Agents.md',
    'ruler': 'Ruler',
    'generic': '',
  };

  const subtypeLabels: Record<Subtype, string> = {
    'skill': 'Skill',
    'agent': 'Agent',
    'slash-command': 'Slash Command',
    'rule': 'Rule',
    'prompt': 'Prompt',
    'collection': 'Collection',
    'chatmode': 'Chat Mode',
    'tool': 'Tool',
    'hook': 'Hook',
    'workflow': 'Workflow',
    'template': 'Template',
  };

  const formatLabel = formatLabels[format];
  const subtypeLabel = subtypeLabels[subtype];

  if (format === 'generic') {
    return subtypeLabel;
  }

  return `${formatLabel} ${subtypeLabel}`;
}

/**
 * Map subtype filters for search
 */
function buildSearchFilters(options: { format?: Format; subtype?: Subtype; author?: string }) {
  const searchOptions: Record<string, unknown> = {};

  if (options.format) {
    searchOptions.format = options.format;
  }

  if (options.subtype) {
    searchOptions.subtype = options.subtype;
  }

  if (options.author) {
    searchOptions.author = options.author;
  }

  return searchOptions;
}

/**
 * Build webapp URL for search results
 */
function buildWebappUrl(query: string, options: { format?: Format; subtype?: Subtype; author?: string; language?: string; framework?: string }, page: number = 1): string {
  const baseUrl = process.env.PRPM_WEBAPP_URL || 'https://prpm.dev';
  const params = new URLSearchParams();

  if (query) params.append('q', query);
  if (options.format) params.append('format', options.format);
  if (options.subtype) params.append('subtype', options.subtype);
  if (options.author) params.append('author', options.author);
  if (options.language) params.append('language', options.language);
  if (options.framework) params.append('framework', options.framework);
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
    const typeIcon = getPackageIcon(pkg.format, pkg.subtype);
    const typeLabel = getPackageLabel(pkg.format, pkg.subtype);

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
  options: { format?: Format; subtype?: Subtype; author?: string; limit: number },
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
  options: { format?: Format; subtype?: Subtype; author?: string; language?: string; framework?: string; limit?: number; page?: number; interactive?: boolean }
): Promise<void> {
  const startTime = Date.now();
  let success = false;
  let error: string | undefined;
  let result: SearchResult | null = null;
  let registryUrl = '';

  try {
    // Allow empty query when filtering by format/subtype or author
    if (query) {
      console.log(`🔍 Searching for "${query}"...`);
    } else if (options.format || options.subtype) {
      const filterType = options.subtype || options.format;
      console.log(`🔍 Listing ${filterType} packages...`);
    } else if (options.author) {
      console.log(`🔍 Listing packages by @${options.author}...`);
    } else {
      console.log('❌ Please provide a search query or use --format/--subtype/--author to filter');
      console.log('\n💡 Examples:');
      console.log('   prpm search react');
      console.log('   prpm search --subtype skill');
      console.log('   prpm search --format claude');
      console.log('   prpm search --author prpm');
      console.log('   prpm search react --subtype rule');
      return;
    }

    const config = await getConfig();
    registryUrl = config.registryUrl || 'https://registry.prpm.dev';
    const client = getRegistryClient(config);

    // Build search options
    const limit = options.limit || 20;
    const page = options.page || 1;
    const offset = (page - 1) * limit;

    const searchOptions: Record<string, unknown> = {
      limit,
      offset,
    };

    // Add format/subtype filters
    if (options.format) {
      searchOptions.format = options.format;
    }
    if (options.subtype) {
      searchOptions.subtype = options.subtype;
    }
    if (options.author) {
      searchOptions.author = options.author;
    }
    if (options.language) {
      searchOptions.language = options.language;
    }
    if (options.framework) {
      searchOptions.framework = options.framework;
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

    // Show fallback message if this is a fallback result
    if (result.fallback) {
      console.log('\n❌ No packages found for your search');

      // Build filter description
      let filterMsg = '';
      if (options.subtype) {
        filterMsg = ` (${options.subtype}`;
        if (options.format) {
          filterMsg += ` for ${options.format}`;
        }
        filterMsg += ')';
      } else if (options.format) {
        filterMsg = ` (${options.format} format)`;
      }

      console.log(`\n💡 Showing top 10 most popular packages${filterMsg} instead:\n`);
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

    throw new CLIError(`\n❌ Search failed: ${error}`, 1);
  } finally {
    await telemetry.track({
      command: 'search',
      success,
      error,
      duration: Date.now() - startTime,
      data: {
        query: query.substring(0, 100),
        format: options.format,
        subtype: options.subtype,
        language: options.language,
        framework: options.framework,
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
    .argument('[query]', 'Search query (optional when using --format/--subtype or --author)')
    .option('--format <format>', 'Filter by package format (cursor, claude, continue, windsurf, copilot, kiro, agents.md, generic, mcp)')
    .option('--subtype <subtype>', 'Filter by package subtype (rule, agent, skill, slash-command, prompt, workflow, tool, template, collection, chatmode, hook)')
    .option('--author <username>', 'Filter by author username')
    .option('--language <language>', 'Filter by programming language (javascript, typescript, python, etc.)')
    .option('--framework <framework>', 'Filter by framework (react, nextjs, django, etc.)')
    .option('--limit <number>', 'Number of results per page', '20')
    .option('--page <number>', 'Page number (default: 1)', '1')
    .option('--interactive', 'Enable interactive pagination (default: true for multiple pages)', true)
    .option('--no-interactive', 'Disable interactive pagination')
    .action(async (query: string | undefined, options: { format?: string; subtype?: string; author?: string; language?: string; framework?: string; limit?: string; page?: string; interactive?: boolean }) => {
      const format = options.format as Format | undefined;
      const subtype = options.subtype as Subtype | undefined;
      const author = options.author;
      const limit = options.limit ? parseInt(options.limit, 10) : 20;
      const page = options.page ? parseInt(options.page, 10) : 1;

      const validFormats: Format[] = ['cursor', 'claude', 'continue', 'windsurf', 'copilot', 'kiro', 'agents.md', 'generic', 'mcp'];
      const validSubtypes: Subtype[] = ['rule', 'agent', 'skill', 'slash-command', 'prompt', 'workflow', 'tool', 'template', 'collection', 'chatmode', 'hook'];

      if (options.format && !validFormats.includes(format!)) {
        console.error(`❌ Format must be one of: ${validFormats.join(', ')}`);
        throw new CLIError(`❌ Format must be one of: ${validFormats.join(', ')}`, 1);
      }

      if (options.subtype && !validSubtypes.includes(subtype!)) {
        console.error(`❌ Subtype must be one of: ${validSubtypes.join(', ')}`);
        console.log(`\n💡 Examples:`);
        console.log(`   prpm search postgres --subtype skill`);
        console.log(`   prpm search debugging --subtype agent`);
        console.log(`   prpm search refactor --subtype slash-command`);
        console.log(`   prpm search react --subtype rule`);
        console.log(`   prpm search --subtype slash-command  # List all slash commands`);
        console.log(`   prpm search --subtype skill  # List all skills`);
        console.log(`   prpm search --format claude  # List all Claude packages`);
        console.log(`   prpm search --author prpm  # List packages by @prpm`);
        throw new CLIError(`❌ Subtype must be one of: ${validSubtypes.join(', ')}`, 1);
      }

      await handleSearch(query || '', { format, subtype, author, language: options.language, framework: options.framework, limit, page, interactive: options.interactive });
    });

  return command;
}
