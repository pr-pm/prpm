/**
 * Whoami command implementation
 */

import { Command } from 'commander';
import { getConfig } from '../core/user-config';
import { getRegistryClient } from '@pr-pm/registry-client';
import { telemetry } from '../core/telemetry';

/**
 * Show current logged-in user
 */
export async function handleWhoami(): Promise<void> {
  const startTime = Date.now();
  let success = false;
  let error: string | undefined;

  try {
    const config = await getConfig();

    if (!config.token || !config.username) {
      console.log('Not logged in');
      console.log('\n💡 Run "prpm login" to authenticate\n');
      success = true;
      return;
    }

    // Fetch user profile from registry
    try {
      const client = getRegistryClient(config);
      const userProfile = await client.getUserProfile(config.username);

      console.log(`\n👤 ${userProfile.username}${userProfile.verified_author ? ' ✓' : ''}`);

      if (userProfile.stats) {
        console.log(`\n📊 Stats:`);
        console.log(`   📦 Packages: ${userProfile.stats.total_packages}`);
        console.log(`   ⬇️  Downloads: ${userProfile.stats.total_downloads.toLocaleString()}`);
      }

      // TODO: Add organizations when implemented in the database
      if (userProfile.organizations && userProfile.organizations.length > 0) {
        console.log(`\n🏢 Organizations:`);
        userProfile.organizations.forEach((org: { id: string; name: string; role: string }) => {
          console.log(`   • ${org.name} (${org.role})`);
        });
      }

      console.log('');
    } catch (apiError) {
      // Fallback to simple username display if API call fails
      console.log(`${config.username}`);
    }

    success = true;
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
    console.error(`❌ Error: ${error}`);
    process.exit(1);
  } finally {
    // Track telemetry
    await telemetry.track({
      command: 'whoami',
      success,
      error,
      duration: Date.now() - startTime,
    });
    await telemetry.shutdown();
  }
}

/**
 * Create the whoami command
 */
export function createWhoamiCommand(): Command {
  return new Command('whoami')
    .description('Show current logged-in user')
    .action(handleWhoami);
}
