/**
 * Whoami command implementation
 */

import { Command } from 'commander';
import { getConfig } from '../core/user-config';
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
      console.log('\n💡 Run "prmp login" to authenticate\n');
      success = true;
      return;
    }

    console.log(`${config.username}`);
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
