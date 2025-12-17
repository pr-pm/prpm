/**
 * Visibility command implementation
 */

import { Command } from 'commander';
import { getRegistryClient } from '@pr-pm/registry-client';
import { getConfig } from '../core/user-config';
import { telemetry } from '../core/telemetry';
import { CLIError } from '../core/errors';

interface VisibilityOptions {
  public?: boolean;
  private?: boolean;
}

/**
 * Handle the visibility command
 */
export async function handleVisibility(
  packageName: string,
  options: VisibilityOptions
): Promise<void> {
  const startTime = Date.now();
  let success = false;
  let error: string | undefined;
  let visibility: 'public' | 'private' | undefined;

  try {
    const config = await getConfig();

    if (!config.token) {
      throw new CLIError('❌ Authentication required. Run `prpm login` first.', 1);
    }

    // Determine target visibility
    if (options.public && options.private) {
      throw new CLIError('❌ Cannot specify both --public and --private', 1);
    }

    if (!options.public && !options.private) {
      throw new CLIError('❌ Must specify either --public or --private', 1);
    }

    visibility = options.public ? 'public' : 'private';

    const client = getRegistryClient(config);

    console.log(`🔄 Setting package visibility: ${packageName} -> ${visibility}...\n`);

    const result = await client.setPackageVisibility(packageName, visibility);

    if (result.success) {
      const icon = visibility === 'public' ? '🌍' : '🔒';
      console.log(`✅ ${result.message}`);
      console.log('');
      console.log(`   ${icon} Package is now ${visibility}`);
      if (visibility === 'public') {
        console.log('   📦 Package will appear in search results');
      } else {
        console.log('   🔐 Package is only accessible to organization members');
      }
    } else {
      throw new Error('Failed to update visibility');
    }

    success = true;
  } catch (err) {
    if (err instanceof CLIError) {
      error = err.message;
      throw err;
    }

    error = err instanceof Error ? err.message : String(err);
    throw new CLIError(`❌ Failed to update visibility: ${error}`, 1);
  } finally {
    // Wrap telemetry in try/catch to prevent masking original errors
    try {
      await telemetry.track({
        command: 'visibility',
        success,
        error,
        duration: Date.now() - startTime,
        data: {
          packageName,
          visibility,
        },
      });
      await telemetry.shutdown();
    } catch {
      // Silently ignore telemetry errors
    }
  }
}

/**
 * Create the visibility command
 */
export function createVisibilityCommand(): Command {
  const command = new Command('visibility');

  command
    .description('Change package visibility (owner only)')
    .argument('<package>', 'Package name to update')
    .option('--public', 'Make the package public (visible in search)')
    .option('--private', 'Make the package private (org members only)')
    .action(async (packageName: string, options: VisibilityOptions) => {
      await handleVisibility(packageName, options);
    });

  return command;
}
