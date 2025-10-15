/**
 * Registry command - Manage package registries
 */

import { Command } from 'commander';
import { readConfig, writeConfig } from '../core/config';
import { Registry } from '../types';

export function createRegistryCommand(): Command {
  const command = new Command('registry');

  command.description('Manage package registries');

  // prmp registry add
  command
    .command('add <url>')
    .description('Add a new registry')
    .option('--name <name>', 'Registry name')
    .option('--priority <number>', 'Priority (lower = higher priority)', '10')
    .option('--token <token>', 'Authentication token')
    .option('--private', 'Mark as private registry')
    .action(async (url: string, options: any) => {
      try {
        const config = await readConfig();

        // Initialize registries array if not exists
        if (!config.registries) {
          config.registries = [];
        }

        // Generate name if not provided
        const name = options.name || generateRegistryName(url);

        // Check if registry already exists
        const existing = config.registries.find((r: Registry) => r.name === name);
        if (existing) {
          console.error(`❌ Registry "${name}" already exists`);
          process.exit(1);
        }

        // Add new registry
        const registry: Registry = {
          name,
          url: url.replace(/\/$/, ''), // Remove trailing slash
          priority: parseInt(options.priority),
          enabled: true,
        };

        // Add auth if token provided
        if (options.token) {
          registry.auth = {
            type: 'token',
            token: options.token,
          };
        }

        config.registries.push(registry);

        await writeConfig(config);

        console.log(`✅ Added registry: ${name}`);
        console.log(`   URL: ${url}`);
        console.log(`   Priority: ${registry.priority}`);
        if (options.private) {
          console.log(`   Type: Private`);
        }
      } catch (error) {
        console.error('❌ Failed to add registry:', error);
        process.exit(1);
      }
    });

  // prmp registry list
  command
    .command('list')
    .description('List configured registries')
    .action(async () => {
      try {
        const config = await readConfig();

        if (!config.registries || config.registries.length === 0) {
          console.log('No registries configured.');
          console.log('\nAdd a registry with: prmp registry add <url>');
          return;
        }

        console.log('\n📋 Configured Registries:\n');

        // Sort by priority
        const sorted = [...config.registries].sort(
          (a: Registry, b: Registry) => a.priority - b.priority
        );

        sorted.forEach((registry: Registry, index: number) => {
          const status = registry.enabled ? '✅' : '❌';
          const auth = registry.auth ? '🔒' : '🌍';

          console.log(`${index + 1}. ${status} ${auth} ${registry.name}`);
          console.log(`   URL: ${registry.url}`);
          console.log(`   Priority: ${registry.priority}`);
          console.log('');
        });

        console.log('Legend: ✅ Enabled | ❌ Disabled | 🔒 Private | 🌍 Public\n');
      } catch (error) {
        console.error('❌ Failed to list registries:', error);
        process.exit(1);
      }
    });

  // prmp registry remove
  command
    .command('remove <name>')
    .description('Remove a registry')
    .action(async (name: string) => {
      try {
        const config = await readConfig();

        if (!config.registries || config.registries.length === 0) {
          console.error('❌ No registries configured');
          process.exit(1);
        }

        const index = config.registries.findIndex((r: Registry) => r.name === name);

        if (index === -1) {
          console.error(`❌ Registry "${name}" not found`);
          process.exit(1);
        }

        config.registries.splice(index, 1);
        await writeConfig(config);

        console.log(`✅ Removed registry: ${name}`);
      } catch (error) {
        console.error('❌ Failed to remove registry:', error);
        process.exit(1);
      }
    });

  // prmp registry enable/disable
  command
    .command('enable <name>')
    .description('Enable a registry')
    .action(async (name: string) => {
      await toggleRegistry(name, true);
    });

  command
    .command('disable <name>')
    .description('Disable a registry')
    .action(async (name: string) => {
      await toggleRegistry(name, false);
    });

  // prmp registry set-default
  command
    .command('set-default <name>')
    .description('Set default registry for publishing')
    .action(async (name: string) => {
      try {
        const config = await readConfig();

        if (!config.registries || config.registries.length === 0) {
          console.error('❌ No registries configured');
          process.exit(1);
        }

        const registry = config.registries.find((r: Registry) => r.name === name);

        if (!registry) {
          console.error(`❌ Registry "${name}" not found`);
          process.exit(1);
        }

        config.defaultRegistry = name;
        await writeConfig(config);

        console.log(`✅ Set default registry: ${name}`);
      } catch (error) {
        console.error('❌ Failed to set default registry:', error);
        process.exit(1);
      }
    });

  return command;
}

/**
 * Toggle registry enabled/disabled
 */
async function toggleRegistry(name: string, enabled: boolean): Promise<void> {
  try {
    const config = await readConfig();

    if (!config.registries || config.registries.length === 0) {
      console.error('❌ No registries configured');
      process.exit(1);
    }

    const registry = config.registries.find((r: Registry) => r.name === name);

    if (!registry) {
      console.error(`❌ Registry "${name}" not found`);
      process.exit(1);
    }

    registry.enabled = enabled;
    await writeConfig(config);

    const status = enabled ? 'enabled' : 'disabled';
    console.log(`✅ Registry ${status}: ${name}`);
  } catch (error) {
    console.error(`❌ Failed to toggle registry:`, error);
    process.exit(1);
  }
}

/**
 * Generate registry name from URL
 */
function generateRegistryName(url: string): string {
  try {
    const parsed = new URL(url);
    let name = parsed.hostname.replace(/^www\./, '');

    // Remove TLD
    name = name.split('.')[0];

    return name;
  } catch {
    return 'custom-registry';
  }
}

/**
 * Get enabled registries from config
 */
export async function getEnabledRegistries(): Promise<Registry[]> {
  const config = await readConfig();

  if (!config.registries || config.registries.length === 0) {
    // Return default public registry
    return [
      {
        name: 'public',
        url: 'https://registry.prmp.dev',
        priority: 1,
        enabled: true,
      },
    ];
  }

  return config.registries
    .filter((r: Registry) => r.enabled)
    .sort((a: Registry, b: Registry) => a.priority - b.priority);
}

/**
 * Get default registry for publishing
 */
export async function getDefaultRegistry(): Promise<Registry> {
  const config = await readConfig();

  if (config.defaultRegistry && config.registries) {
    const registry = config.registries.find(
      (r: Registry) => r.name === config.defaultRegistry
    );
    if (registry) return registry;
  }

  // Return first enabled registry or default public
  const enabled = await getEnabledRegistries();
  return enabled[0] || {
    name: 'public',
    url: 'https://registry.prmp.dev',
    priority: 1,
    enabled: true,
  };
}
