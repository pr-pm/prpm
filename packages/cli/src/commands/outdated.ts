/**
 * Outdated command - Check for package updates
 */

import { Command } from 'commander';
import { getRegistryClient } from '@prpm/registry-client';
import { getConfig } from '../core/user-config';
import { listPackages } from '../core/lockfile';
import { telemetry } from '../core/telemetry';

/**
 * Check for outdated packages
 */
export async function handleOutdated(): Promise<void> {
  const startTime = Date.now();
  let success = false;
  let error: string | undefined;

  try {
    console.log('🔍 Checking for package updates...\n');

    const config = await getConfig();
    const client = getRegistryClient(config);
    const installedPackages = await listPackages();

    if (installedPackages.length === 0) {
      console.log('No packages installed.');
      success = true;
      return;
    }

    const outdated: Array<{
      id: string;
      current: string;
      latest: string;
      type: 'major' | 'minor' | 'patch';
    }> = [];

    for (const pkg of installedPackages) {
      try {
        // Get package info from registry
        const registryPkg = await client.getPackage(pkg.id);

        if (!registryPkg.latest_version || !pkg.version) {
          continue;
        }

        const currentVersion = pkg.version;
        const latestVersion = registryPkg.latest_version.version;

        // Check if update available
        if (currentVersion !== latestVersion) {
          const updateType = getUpdateType(currentVersion, latestVersion);
          outdated.push({
            id: pkg.id,
            current: currentVersion,
            latest: latestVersion,
            type: updateType,
          });
        }
      } catch (err) {
        // Skip packages that can't be found in registry
        continue;
      }
    }

    if (outdated.length === 0) {
      console.log('✅ All packages are up to date!\n');
      success = true;
      return;
    }

    // Display outdated packages
    console.log(`📦 ${outdated.length} package(s) have updates available:\n`);

    // Group by update type
    const major = outdated.filter(p => p.type === 'major');
    const minor = outdated.filter(p => p.type === 'minor');
    const patch = outdated.filter(p => p.type === 'patch');

    if (major.length > 0) {
      console.log('🔴 Major Updates (breaking changes possible):');
      major.forEach(pkg => {
        console.log(`   ${pkg.id.padEnd(30)} ${pkg.current} → ${pkg.latest}`);
      });
      console.log('');
    }

    if (minor.length > 0) {
      console.log('🟡 Minor Updates (new features):');
      minor.forEach(pkg => {
        console.log(`   ${pkg.id.padEnd(30)} ${pkg.current} → ${pkg.latest}`);
      });
      console.log('');
    }

    if (patch.length > 0) {
      console.log('🟢 Patch Updates (bug fixes):');
      patch.forEach(pkg => {
        console.log(`   ${pkg.id.padEnd(30)} ${pkg.current} → ${pkg.latest}`);
      });
      console.log('');
    }

    console.log('💡 Run "prpm update" to update to latest minor/patch versions');
    console.log('💡 Run "prpm upgrade" to upgrade to latest major versions\n');

    success = true;
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
    console.error(`\n❌ Failed to check for updates: ${error}`);
    process.exit(1);
  } finally {
    await telemetry.track({
      command: 'outdated',
      success,
      error,
      duration: Date.now() - startTime,
    });
  }
}

/**
 * Determine update type based on semver
 */
function getUpdateType(current: string, latest: string): 'major' | 'minor' | 'patch' {
  const currentParts = current.split('.').map(Number);
  const latestParts = latest.split('.').map(Number);

  const [currMajor = 0, currMinor = 0, currPatch = 0] = currentParts;
  const [latestMajor = 0, latestMinor = 0, latestPatch = 0] = latestParts;

  if (latestMajor > currMajor) return 'major';
  if (latestMinor > currMinor) return 'minor';
  return 'patch';
}

/**
 * Create the outdated command
 */
export function createOutdatedCommand(): Command {
  return new Command('outdated')
    .description('Check for package updates')
    .action(handleOutdated);
}
