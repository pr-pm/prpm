/**
 * Trending command - Show trending packages
 */

import { Command } from 'commander';
import { getRegistryClient } from '@prpm/registry-client';
import { getConfig } from '../core/user-config';
import { telemetry } from '../core/telemetry';
import { PackageType } from '../types';

export async function handleTrending(options: { type?: PackageType; limit?: number }): Promise<void> {
  const startTime = Date.now();
  let success = false;
  let error: string | undefined;

  try {
    console.log(`🔥 Fetching trending packages...`);

    const config = await getConfig();
    const client = getRegistryClient(config);
    const packages = await client.getTrending(options.type, options.limit || 10);

    if (packages.length === 0) {
      console.log('\n❌ No trending packages found');
      return;
    }

    console.log(`\n✨ Trending packages (last 7 days):\n`);

    packages.forEach((pkg, index) => {
      const verified = pkg.verified ? '✓' : ' ';
      const rating = pkg.rating_average ? `⭐ ${pkg.rating_average.toFixed(1)}` : '';
      const downloads = pkg.total_downloads >= 1000
        ? `${(pkg.total_downloads / 1000).toFixed(1)}k`
        : pkg.total_downloads;

      console.log(`${index + 1}. [${verified}] ${pkg.display_name} ${rating}`);
      console.log(`   ${pkg.description || 'No description'}`);
      console.log(`   📦 ${pkg.id} | 📥 ${downloads} downloads`);
      console.log();
    });

    console.log(`💡 Install a package: prpm install <package-id>`);

    success = true;
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
    console.error(`\n❌ Failed to fetch trending packages: ${error}`);
    console.log(`\n💡 Tip: Check your internet connection`);
    process.exit(1);
  } finally {
    await telemetry.track({
      command: 'trending',
      success,
      error,
      duration: Date.now() - startTime,
      data: {
        type: options.type,
        limit: options.limit || 10,
      },
    });
  }
}

export function createTrendingCommand(): Command {
  const command = new Command('trending');

  command
    .description('Show trending packages')
    .option('--type <type>', 'Filter by package type (cursor, claude, continue)')
    .option('--limit <number>', 'Number of packages to show', '10')
    .action(async (options: { limit?: string; type?: string }) => {
      const type = options.type as PackageType | undefined;
      const limit = options.limit ? parseInt(options.limit, 10) : 10;

      if (options.type && !['cursor', 'claude', 'continue', 'windsurf', 'generic'].includes(type!)) {
        console.error('❌ Type must be one of: cursor, claude, continue, windsurf, generic');
        process.exit(1);
      }

      await handleTrending({ type, limit });
    });

  return command;
}
