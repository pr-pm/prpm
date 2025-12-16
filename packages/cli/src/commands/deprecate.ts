/**
 * Deprecate command implementation
 */

import { Command } from 'commander';
import { getRegistryClient } from '@pr-pm/registry-client';
import { getConfig } from '../core/user-config';
import { telemetry } from '../core/telemetry';
import { CLIError } from '../core/errors';

interface DeprecateOptions {
  reason?: string;
  undo?: boolean;
}

/**
 * Handle the deprecate command
 */
export async function handleDeprecate(
  packageName: string,
  options: DeprecateOptions
): Promise<void> {
  const startTime = Date.now();
  let success = false;
  let error: string | undefined;
  let deprecated: boolean | undefined;
  let reason: string | null | undefined;

  try {
    const config = await getConfig();

    if (!config.token) {
      throw new CLIError('❌ Authentication required. Run `prpm login` first.', 1);
    }

    const client = getRegistryClient(config);

    const action = options.undo ? 'Undeprecating' : 'Deprecating';
    console.log(`⚠️  ${action} package: ${packageName}...\n`);

    const result = await client.deprecatePackage(packageName, {
      deprecated: !options.undo,
      reason: options.reason,
    });

    deprecated = result.deprecated;
    reason = result.reason;

    if (result.success) {
      console.log(`✅ ${result.message}`);
      console.log('');
      if (result.deprecated && result.reason) {
        console.log(`   Reason: ${result.reason}`);
        console.log('');
      }
      if (result.deprecated) {
        console.log('💡 To undo: prpm deprecate --undo ' + packageName);
      }
    } else {
      throw new Error('Failed to update deprecation status');
    }

    success = true;
  } catch (err) {
    if (err instanceof CLIError) {
      error = err.message;
      throw err;
    }

    error = err instanceof Error ? err.message : String(err);
    throw new CLIError(`❌ Failed to update deprecation status: ${error}`, 1);
  } finally {
    await telemetry.track({
      command: 'deprecate',
      success,
      error,
      duration: Date.now() - startTime,
      data: {
        packageName,
        deprecated,
        reason,
        undo: options.undo,
      },
    });
    await telemetry.shutdown();
  }
}

/**
 * Create the deprecate command
 */
export function createDeprecateCommand(): Command {
  const command = new Command('deprecate');

  command
    .description('Deprecate a package (owner only)')
    .argument('<package>', 'Package name to deprecate')
    .option('--reason <reason>', 'Reason for deprecation')
    .option('--undo', 'Remove deprecation status')
    .action(async (packageName: string, options: DeprecateOptions) => {
      await handleDeprecate(packageName, options);
    });

  return command;
}
