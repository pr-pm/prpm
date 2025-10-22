/**
 * Popular packages command implementation
 * Shows all-time popular packages (delegates to trending)
 */

import { Command } from 'commander';
import { handleTrending } from './trending';
import { PackageType } from '../types';

/**
 * Show popular packages (wrapper around trending)
 */
export async function handlePopular(options: { type?: string }): Promise<void> {
  // Delegate to trending command
  console.log('📊 Popular Packages (All Time)\n');
  await handleTrending({ type: options.type as PackageType | undefined });
}

/**
 * Create the popular command
 */
export function createPopularCommand(): Command {
  return new Command('popular')
    .description('Show popular packages (all time)')
    .option('-t, --type <type>', 'Filter by package type (cursor, claude, continue, windsurf)')
    .action(handlePopular);
}
