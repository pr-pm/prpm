/**
 * Config command implementation
 */

import { Command } from 'commander';
import { getConfig, saveConfig } from '../core/user-config';

/**
 * Get a config value
 */
async function handleConfigGet(key: string): Promise<void> {
  try {
    const config = await getConfig();
    const value = (config as any)[key];

    if (value === undefined) {
      console.error(`❌ Config key "${key}" not found`);
      console.log('\nAvailable keys: registryUrl, telemetryEnabled, token, username');
      process.exit(1);
    }

    console.log(value);
  } catch (error) {
    console.error(`❌ Failed to get config: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

/**
 * Set a config value
 */
async function handleConfigSet(key: string, value: string): Promise<void> {
  try {
    const config = await getConfig();

    // Validate key
    const validKeys = ['registryUrl', 'telemetryEnabled'];
    if (!validKeys.includes(key)) {
      console.error(`❌ Cannot set config key "${key}"`);
      console.log('\nSettable keys: registryUrl, telemetryEnabled');
      console.log('Note: token and username are set via "prpm login"');
      process.exit(1);
    }

    // Parse boolean values
    let parsedValue: any = value;
    if (key === 'telemetryEnabled') {
      if (value === 'true' || value === '1' || value === 'yes') {
        parsedValue = true;
      } else if (value === 'false' || value === '0' || value === 'no') {
        parsedValue = false;
      } else {
        console.error(`❌ Invalid boolean value "${value}". Use: true, false, yes, no, 1, or 0`);
        process.exit(1);
      }
    }

    // Update config
    (config as any)[key] = parsedValue;
    await saveConfig(config);

    console.log(`✅ Set ${key} = ${parsedValue}`);
  } catch (error) {
    console.error(`❌ Failed to set config: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

/**
 * List all config values
 */
async function handleConfigList(): Promise<void> {
  try {
    const config = await getConfig();

    console.log('📋 Current configuration:\n');
    console.log(`   Registry URL: ${config.registryUrl}`);
    console.log(`   Telemetry: ${config.telemetryEnabled ? 'enabled' : 'disabled'}`);
    console.log(`   Username: ${config.username || '(not logged in)'}`);
    console.log(`   Token: ${config.token ? '(set)' : '(not set)'}`);
    console.log('');

    const configPath = process.platform === 'win32'
      ? `${process.env.USERPROFILE}\\.prpmrc`
      : `${process.env.HOME}/.prpmrc`;
    console.log(`Config file: ${configPath}`);
  } catch (error) {
    console.error(`❌ Failed to list config: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

/**
 * Delete a config value (reset to default)
 */
async function handleConfigDelete(key: string): Promise<void> {
  try {
    const config = await getConfig();

    // Validate key
    const deletableKeys = ['registryUrl', 'telemetryEnabled', 'token', 'username'];
    if (!deletableKeys.includes(key)) {
      console.error(`❌ Cannot delete config key "${key}"`);
      process.exit(1);
    }

    // Reset to defaults
    if (key === 'registryUrl') {
      config.registryUrl = 'https://registry.prpm.dev';
    } else if (key === 'telemetryEnabled') {
      config.telemetryEnabled = true;
    } else if (key === 'token') {
      config.token = undefined;
    } else if (key === 'username') {
      config.username = undefined;
    }

    await saveConfig(config);

    console.log(`✅ Reset ${key} to default value`);
  } catch (error) {
    console.error(`❌ Failed to delete config: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

/**
 * Create the config command
 */
export function createConfigCommand(): Command {
  const command = new Command('config')
    .description('Manage CLI configuration');

  // config list
  command
    .command('list')
    .alias('ls')
    .description('List all configuration values')
    .action(async () => {
      await handleConfigList();
      process.exit(0);
    });

  // config get <key>
  command
    .command('get <key>')
    .description('Get a configuration value')
    .action(async (key: string) => {
      await handleConfigGet(key);
      process.exit(0);
    });

  // config set <key> <value>
  command
    .command('set <key> <value>')
    .description('Set a configuration value')
    .action(async (key: string, value: string) => {
      await handleConfigSet(key, value);
      process.exit(0);
    });

  // config delete <key>
  command
    .command('delete <key>')
    .alias('rm')
    .description('Reset a configuration value to default')
    .action(async (key: string) => {
      await handleConfigDelete(key);
      process.exit(0);
    });

  // Default action (show list if no subcommand)
  command.action(async () => {
    await handleConfigList();
    process.exit(0);
  });

  return command;
}
