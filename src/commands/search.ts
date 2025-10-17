/**
 * Search command - Search for packages in the registry
 */

import { Command } from 'commander';
import { getRegistryClient } from '../core/registry-client';
import { telemetry } from '../core/telemetry';
import { PackageType } from '../types';

export async function handleSearch(
  query: string,
  options: { type?: PackageType; limit?: number }
): Promise<void> {
  const startTime = Date.now();
  let success = false;
  let error: string | undefined;

  try {
    console.log(`🔍 Searching for "${query}"...`);

    const client = getRegistryClient();
    const result = await client.search(query, {
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
    result.packages.forEach((pkg) => {
      const verified = pkg.verified ? '✓' : ' ';
      const rating = pkg.rating_average ? `⭐ ${pkg.rating_average.toFixed(1)}` : '';
      const downloads = pkg.total_downloads >= 1000
        ? `${(pkg.total_downloads / 1000).toFixed(1)}k`
        : pkg.total_downloads;

      console.log(`[${verified}] ${pkg.display_name} ${rating}`);
      console.log(`    ${pkg.description || 'No description'}`);
      console.log(`    📦 ${pkg.id} | 📥 ${downloads} downloads | 🏷️  ${pkg.tags.join(', ')}`);
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
    console.log(`   Registry: ${process.env.PRMP_REGISTRY_URL || 'https://registry.promptpm.dev'}`);
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
        resultCount: success ? result.packages.length : 0,
      },
    });
  }
}

export function createSearchCommand(): Command {
  const command = new Command('search');

  command
    .description('Search for packages in the registry')
    .argument('<query>', 'Search query')
    .option('--type <type>', 'Filter by package type (cursor, claude, continue)')
    .option('--limit <number>', 'Number of results to show', '20')
    .action(async (query: string, options: any) => {
      const type = options.type as PackageType | undefined;
      const limit = parseInt(options.limit, 10);

      if (options.type && !['cursor', 'claude', 'continue', 'windsurf', 'generic'].includes(type!)) {
        console.error('❌ Type must be one of: cursor, claude, continue, windsurf, generic');
        process.exit(1);
      }

      await handleSearch(query, { type, limit });
    });

  return command;
}
