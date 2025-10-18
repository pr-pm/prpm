/**
 * Collections command - Manage package collections
 */

import { Command } from 'commander';
import { getRegistryClient } from '../core/registry-client';
import { getConfig } from '../core/user-config';
import { handleInstall } from './install';
import { telemetry } from '../core/telemetry';

/**
 * List available collections
 */
export async function handleCollectionsList(options: {
  category?: string;
  tag?: string;
  official?: boolean;
  scope?: string;
}): Promise<void> {
  const startTime = Date.now();

  try {
    const config = await getConfig();
    const client = getRegistryClient(config);

    console.log('📦 Searching collections...\n');

    const result = await client.getCollections({
      category: options.category,
      tag: options.tag,
      official: options.official,
      scope: options.scope,
      limit: 50,
    });

    if (result.collections.length === 0) {
      console.log('No collections found matching your criteria.');
      return;
    }

    // Group by official vs community
    const official = result.collections.filter(c => c.official);
    const community = result.collections.filter(c => !c.official);

    if (official.length > 0) {
      console.log('📦 Official Collections:\n');
      official.forEach(c => {
        const fullName = `@${c.scope}/${c.id}`.padEnd(35);
        const pkgCount = `(${c.package_count} packages)`.padEnd(15);
        console.log(`   ${c.icon || '📦'} ${fullName} ${pkgCount} ${c.name}`);
        if (c.description) {
          console.log(`      ${c.description.substring(0, 70)}${c.description.length > 70 ? '...' : ''}`);
        }
        console.log(`      ⬇️  ${c.downloads.toLocaleString()} installs · ⭐ ${c.stars.toLocaleString()} stars`);
        console.log('');
      });
    }

    if (community.length > 0) {
      console.log('\n🌟 Community Collections:\n');
      community.forEach(c => {
        const fullName = `@${c.scope}/${c.id}`.padEnd(35);
        const pkgCount = `(${c.package_count} packages)`.padEnd(15);
        console.log(`   ${c.icon || '📦'} ${fullName} ${pkgCount} ${c.name}`);
        if (c.description) {
          console.log(`      ${c.description.substring(0, 70)}${c.description.length > 70 ? '...' : ''}`);
        }
        console.log(`      ⬇️  ${c.downloads.toLocaleString()} installs · ⭐ ${c.stars.toLocaleString()} stars`);
        console.log('');
      });
    }

    console.log(`\n💡 View details: prmp collection info <collection>`);
    console.log(`💡 Install: prmp install @collection/<name>`);

    await telemetry.track({
      command: 'collections:list',
      success: true,
      duration: Date.now() - startTime,
      data: {
        count: result.collections.length,
        filters: options,
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`\n❌ Failed to list collections: ${errorMessage}`);
    await telemetry.track({
      command: 'collections:list',
      success: false,
      error: errorMessage,
      duration: Date.now() - startTime,
    });
    process.exit(1);
  }
}

/**
 * Show collection details
 */
export async function handleCollectionInfo(collectionSpec: string): Promise<void> {
  const startTime = Date.now();

  try {
    // Parse collection spec: @scope/id or scope/id
    const match = collectionSpec.match(/^@?([^/]+)\/([^/@]+)(?:@(.+))?$/);
    if (!match) {
      throw new Error('Invalid collection format. Use: @scope/id or scope/id[@version]');
    }

    const [, scope, id, version] = match;

    const config = await getConfig();
    const client = getRegistryClient(config);

    console.log(`📦 Loading collection: @${scope}/${id}...\n`);

    const collection = await client.getCollection(scope, id, version);

    // Header
    console.log(`${collection.icon || '📦'} ${collection.name}`);
    console.log(`${'='.repeat(collection.name.length + 2)}`);
    console.log('');
    console.log(collection.description);
    console.log('');

    // Stats
    console.log('📊 Stats:');
    console.log(`   Downloads: ${collection.downloads.toLocaleString()}`);
    console.log(`   Stars: ${collection.stars.toLocaleString()}`);
    console.log(`   Version: ${collection.version}`);
    console.log(`   Packages: ${collection.packages.length}`);
    console.log(`   Author: ${collection.author}${collection.verified ? ' ✓' : ''}`);
    if (collection.category) {
      console.log(`   Category: ${collection.category}`);
    }
    if (collection.tags && collection.tags.length > 0) {
      console.log(`   Tags: ${collection.tags.join(', ')}`);
    }
    console.log('');

    // Packages
    console.log('📋 Included Packages:');
    console.log('');

    const requiredPkgs = collection.packages.filter(p => p.required);
    const optionalPkgs = collection.packages.filter(p => !p.required);

    if (requiredPkgs.length > 0) {
      console.log('   Required:');
      requiredPkgs.forEach((pkg, i) => {
        console.log(`   ${i + 1}. ✓ ${pkg.packageId}@${pkg.version || 'latest'}`);
        if (pkg.package) {
          console.log(`      ${pkg.package.description || pkg.package.display_name}`);
        }
        if (pkg.reason) {
          console.log(`      💡 ${pkg.reason}`);
        }
        console.log('');
      });
    }

    if (optionalPkgs.length > 0) {
      console.log('   Optional:');
      optionalPkgs.forEach((pkg, i) => {
        console.log(`   ${i + 1}. ○ ${pkg.packageId}@${pkg.version || 'latest'}`);
        if (pkg.package) {
          console.log(`      ${pkg.package.description || pkg.package.display_name}`);
        }
        if (pkg.reason) {
          console.log(`      💡 ${pkg.reason}`);
        }
        console.log('');
      });
    }

    // Installation
    console.log('💡 Install:');
    console.log(`   prmp install @${scope}/${id}`);
    if (optionalPkgs.length > 0) {
      console.log(`   prmp install @${scope}/${id} --skip-optional  # Skip optional packages`);
    }
    console.log('');

    await telemetry.track({
      command: 'collections:info',
      success: true,
      duration: Date.now() - startTime,
      data: {
        scope,
        id,
        packageCount: collection.packages.length,
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`\n❌ Failed to get collection info: ${errorMessage}`);
    await telemetry.track({
      command: 'collections:info',
      success: false,
      error: errorMessage,
      duration: Date.now() - startTime,
    });
    process.exit(1);
  }
}

/**
 * Install a collection
 */
export async function handleCollectionInstall(
  collectionSpec: string,
  options: {
    format?: string;
    skipOptional?: boolean;
    dryRun?: boolean;
  }
): Promise<void> {
  const startTime = Date.now();
  let packagesInstalled = 0;
  let packagesFailed = 0;

  try {
    // Parse collection spec
    const match = collectionSpec.match(/^@?([^/]+)\/([^/@]+)(?:@(.+))?$/);
    if (!match) {
      throw new Error('Invalid collection format. Use: @scope/id or scope/id[@version]');
    }

    const [, scope, id, version] = match;

    const config = await getConfig();
    const client = getRegistryClient(config);

    // Get collection installation plan
    console.log(`📦 Installing collection: @${scope}/${id}...\n`);

    const installResult = await client.installCollection({
      scope,
      id,
      version,
      format: options.format,
      skipOptional: options.skipOptional,
    });

    const collection = installResult.collection;
    const packages = installResult.packagesToInstall;

    console.log(`📦 ${collection.name}`);
    console.log(`   ${packages.length} packages to install\n`);

    if (options.dryRun) {
      console.log('🔍 Dry run - would install:\n');
      packages.forEach((pkg, i) => {
        const required = pkg.required ? '✓' : '○';
        console.log(`   ${i + 1}/${packages.length} ${required} ${pkg.packageId}@${pkg.version} (${pkg.format})`);
      });
      console.log('');
      return;
    }

    // Install packages sequentially
    for (let i = 0; i < packages.length; i++) {
      const pkg = packages[i];
      const progress = `${i + 1}/${packages.length}`;

      try {
        console.log(`\n  ${progress} Installing ${pkg.packageId}@${pkg.version}...`);

        await handleInstall(`${pkg.packageId}@${pkg.version}`, {
          as: pkg.format,
        });

        console.log(`  ${progress} ✓ ${pkg.packageId}`);
        packagesInstalled++;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`  ${progress} ✗ ${pkg.packageId}: ${errorMessage}`);
        packagesFailed++;

        if (pkg.required) {
          throw new Error(`Failed to install required package: ${pkg.packageId}`);
        }
      }
    }

    console.log(`\n✅ Collection installed successfully!`);
    console.log(`   ${packagesInstalled}/${packages.length} packages installed`);
    if (packagesFailed > 0) {
      console.log(`   ${packagesFailed} optional packages failed`);
    }
    console.log('');

    await telemetry.track({
      command: 'collections:install',
      success: true,
      duration: Date.now() - startTime,
      data: {
        scope,
        id,
        packageCount: packages.length,
        installed: packagesInstalled,
        failed: packagesFailed,
        format: options.format,
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`\n❌ Failed to install collection: ${errorMessage}`);
    await telemetry.track({
      command: 'collections:install',
      success: false,
      error: errorMessage,
      duration: Date.now() - startTime,
      data: {
        installed: packagesInstalled,
        failed: packagesFailed,
      },
    });
    process.exit(1);
  }
}

/**
 * Create collections command group
 */
export function createCollectionsCommand(): Command {
  const command = new Command('collections');

  command
    .description('Manage package collections')
    .alias('collection')
    .action(async (options) => {
      await handleCollectionsList(options);
    });

  // List subcommand
  command
    .command('list')
    .description('List available collections')
    .option('--category <category>', 'Filter by category')
    .option('--tag <tag>', 'Filter by tag')
    .option('--official', 'Show only official collections')
    .option('--scope <scope>', 'Filter by scope')
    .action(handleCollectionsList);

  // Info subcommand
  command
    .command('info <collection>')
    .description('Show collection details')
    .action(handleCollectionInfo);

  // Install handled by main install command with @scope/id syntax

  return command;
}
