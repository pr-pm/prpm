/**
 * List command implementation
 */

import { Command } from 'commander';
import { listPackages } from '../core/config';
import { telemetry } from '../core/telemetry';
import { Package } from '../types';

/**
 * Display packages in a formatted table
 */
function displayPackages(packages: Package[]): void {
  if (packages.length === 0) {
    console.log('📦 No packages installed');
    return;
  }
  
  console.log('📦 Installed packages:');
  console.log('');
  
  // Calculate column widths
  const idWidth = Math.max(8, ...packages.map(p => p.id.length));
  const typeWidth = Math.max(6, ...packages.map(p => p.type.length));
  const urlWidth = Math.max(20, ...packages.map(p => p.url.length));
  const destWidth = Math.max(15, ...packages.map(p => p.dest.length));
  
  // Header
  const header = [
    'ID'.padEnd(idWidth),
    'TYPE'.padEnd(typeWidth),
    'URL'.padEnd(urlWidth),
    'DESTINATION'.padEnd(destWidth)
  ].join(' | ');
  
  console.log(header);
  console.log('-'.repeat(header.length));
  
  // Rows
  packages.forEach(pkg => {
    const row = [
      pkg.id.padEnd(idWidth),
      pkg.type.padEnd(typeWidth),
      pkg.url.padEnd(urlWidth),
      pkg.dest.padEnd(destWidth)
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
