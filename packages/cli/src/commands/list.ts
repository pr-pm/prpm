/**
 * List command implementation
 */

import { Command } from 'commander';
import { listPackages } from '../core/lockfile';
import { telemetry } from '../core/telemetry';

/**
 * Display packages in a formatted table
 */
function displayPackages(packages: Array<{id: string; version: string; resolved: string; type?: string; format?: string}>): void {
  if (packages.length === 0) {
    console.log('📦 No packages installed');
    return;
  }

  console.log('📦 Installed packages:');
  console.log('');

  // Calculate column widths
  const idWidth = Math.max(8, ...packages.map(p => p.id.length));
  const versionWidth = Math.max(7, ...packages.map(p => p.version.length));
  const typeWidth = Math.max(6, ...packages.map(p => (p.type || '').length));
  const formatWidth = Math.max(6, ...packages.map(p => (p.format || '').length));

  // Header
  const header = [
    'ID'.padEnd(idWidth),
    'VERSION'.padEnd(versionWidth),
    'TYPE'.padEnd(typeWidth),
    'FORMAT'.padEnd(formatWidth)
  ].join(' | ');

  console.log(header);
  console.log('-'.repeat(header.length));

  // Rows
  packages.forEach(pkg => {
    const row = [
      pkg.id.padEnd(idWidth),
      pkg.version.padEnd(versionWidth),
      (pkg.type || '').padEnd(typeWidth),
      (pkg.format || '').padEnd(formatWidth)
    ].join(' | ');

    console.log(row);
  });

  console.log('');
  console.log(`Total: ${packages.length} package${packages.length === 1 ? '' : 's'}`);
}

/**
 * Handle the list command
 */
export async function handleList(): Promise<void> {
  const startTime = Date.now();
  let success = false;
  let error: string | undefined;
  let packageCount = 0;

  try {
    const packages = await listPackages();
    packageCount = packages.length;
    displayPackages(packages);
    success = true;
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
    console.error(`❌ Failed to list packages: ${error}`);
    process.exit(1);
  } finally {
    // Track telemetry
    await telemetry.track({
      command: 'list',
      success,
      error,
      duration: Date.now() - startTime,
      data: {
        packageCount,
      },
    });
  }
}

/**
 * Create the list command
 */
export function createListCommand(): Command {
  const command = new Command('list');
  
  command
    .description('List all installed prompt packages')
    .action(handleList);
  
  return command;
}
