/**
 * Collections command - Manage package collections
 */

import { Command } from 'commander';
import { getRegistryClient } from '@pr-pm/registry-client';
import { getConfig } from '../core/user-config';
import { handleInstall } from './install';
import { telemetry } from '../core/telemetry';
import {
  readLockfile,
  writeLockfile,
  createLockfile,
  addCollectionToLockfile,
  getCollectionFromLockfile,
} from '../core/lockfile';

/**
 * Search collections by query
 */
export async function handleCollectionsSearch(
  query: string,
  options: {
    category?: string;
    tag?: string;
    official?: boolean;
    limit?: number;
  }
): Promise<void> {
  const startTime = Date.now();

  try {
    const config = await getConfig();
    const client = getRegistryClient(config);

    console.log(`🔍 Searching collections for "${query}"...\n`);

    // Use server-side search with full-text index
    const result = await client.getCollections({
      query,
      category: options.category,
      tag: options.tag,
      official: options.official,
      limit: options.limit || 50,
    });

    if (result.collections.length === 0) {
      console.log('No collections found matching your search.');
      console.log('\n💡 Try:');
      console.log('  - Broadening your search terms');
      console.log('  - Checking spelling');
      console.log('  - Browsing all: prpm collections list');
      return;
    }

    console.log(`✨ Found ${result.collections.length} collection(s):\n`);

    // Group by official vs community
    const official = result.collections.filter(c => c.official);
    const community = result.collections.filter(c => !c.official);

    if (official.length > 0) {
      console.log(`📦 Official Collections (${official.length}):\n`);
      official.forEach(c => {
        const fullName = c.name_slug.padEnd(35);
        const pkgCount = `(${c.package_count} packages)`.padEnd(15);
        console.log(`   ${c.icon || '📦'} ${fullName} ${pkgCount} ${c.name}`);
        if (c.description) {
          console.log(`      ${c.description.substring(0, 70)}${c.description.length > 70 ? '...' : ''}`);
        }
        console.log(`      👤 by @${c.author}${c.verified ? ' ✓' : ''}`);
        console.log(`      ⬇️  ${c.downloads.toLocaleString()} installs · ⭐ ${c.stars.toLocaleString()} stars`);
        console.log('');
      });
    }

    if (community.length > 0) {
      console.log(`\n🌟 Community Collections (${community.length}):\n`);
      community.forEach(c => {
        const fullName = c.name_slug.padEnd(35);
        const pkgCount = `(${c.package_count} packages)`.padEnd(15);
        console.log(`   ${c.icon || '📦'} ${fullName} ${pkgCount} ${c.name}`);
        if (c.description) {
          console.log(`      ${c.description.substring(0, 70)}${c.description.length > 70 ? '...' : ''}`);
        }
        console.log(`      👤 by @${c.author}${c.verified ? ' ✓' : ''}`);
        console.log(`      ⬇️  ${c.downloads.toLocaleString()} installs · ⭐ ${c.stars.toLocaleString()} stars`);
        console.log('');
      });
    }

    // Show results count
    console.log(`\n📊 Found: ${result.collections.length} matching collection${result.collections.length === 1 ? '' : 's'} (searched ${result.total} total)\n`);
    console.log(`💡 View details: prpm collection info <collection>`);
    console.log(`💡 Install: prpm install <collection>`);

    await telemetry.track({
      command: 'collections:search',
      success: true,
      duration: Date.now() - startTime,
      data: {
        query: query.substring(0, 100),
        count: result.collections.length,
        total: result.total,
        filters: options,
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`\n❌ Failed to search collections: ${errorMessage}`);
    await telemetry.track({
      command: 'collections:search',
      success: false,
      error: errorMessage,
      duration: Date.now() - startTime,
    });
    process.exit(1);
  } finally {
    await telemetry.shutdown();
  }
}

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
      limit: 500, // Increased limit to show more collections
    });

    if (result.collections.length === 0) {
      console.log('No collections found matching your criteria.');
      return;
    }

    // Group by official vs community
    const official = result.collections.filter(c => c.official);
    const community = result.collections.filter(c => !c.official);

    if (official.length > 0) {
      console.log(`📦 Official Collections (${official.length}):\n`);
      official.forEach(c => {
        const fullName = c.name_slug.padEnd(35);
        const pkgCount = `(${c.package_count} packages)`.padEnd(15);
        console.log(`   ${c.icon || '📦'} ${fullName} ${pkgCount} ${c.name}`);
        if (c.description) {
          console.log(`      ${c.description.substring(0, 70)}${c.description.length > 70 ? '...' : ''}`);
        }
        console.log(`      👤 by @${c.author}${c.verified ? ' ✓' : ''}`);
        console.log(`      ⬇️  ${c.downloads.toLocaleString()} installs · ⭐ ${c.stars.toLocaleString()} stars`);
        console.log('');
      });
    }

    if (community.length > 0) {
      console.log(`\n🌟 Community Collections (${community.length}):\n`);
      community.forEach(c => {
        const fullName = c.name_slug.padEnd(35);
        const pkgCount = `(${c.package_count} packages)`.padEnd(15);
        console.log(`   ${c.icon || '📦'} ${fullName} ${pkgCount} ${c.name}`);
        if (c.description) {
          console.log(`      ${c.description.substring(0, 70)}${c.description.length > 70 ? '...' : ''}`);
        }
        console.log(`      👤 by @${c.author}${c.verified ? ' ✓' : ''}`);
        console.log(`      ⬇️  ${c.downloads.toLocaleString()} installs · ⭐ ${c.stars.toLocaleString()} stars`);
        console.log('');
      });
    }

    // Show total from API (which includes all collections, not just the ones returned)
    const showing = result.collections.length;
    const total = result.total;

    if (showing < total) {
      console.log(`\n📊 Showing ${showing} of ${total} collection${total === 1 ? '' : 's'}\n`);
    } else {
      console.log(`\n📊 Total: ${total} collection${total === 1 ? '' : 's'}\n`);
    }

    console.log(`💡 View details: prpm collection info <collection>`);
    console.log(`💡 Install: prpm install <collection>`);

    await telemetry.track({
      command: 'collections:list',
      success: true,
      duration: Date.now() - startTime,
      data: {
        count: result.collections.length,
        total: result.total,
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
  } finally {
    await telemetry.shutdown();
  }
}

/**
 * Show collection details
 */
export async function handleCollectionInfo(collectionSpec: string): Promise<void> {
  const startTime = Date.now();

  try {
    // Parse collection spec: @scope/name_slug, scope/name_slug, or just name_slug (defaults to 'collection' scope)
    let scope: string;
    let name_slug: string;
    let version: string | undefined;

    const matchWithScope = collectionSpec.match(/^@?([^/]+)\/([^/@]+)(?:@(.+))?$/);
    if (matchWithScope) {
      // Has explicit scope: @scope/name or scope/name
      [, scope, name_slug, version] = matchWithScope;
    } else {
      // No scope, assume 'collection' scope: just name or name@version
      const matchNoScope = collectionSpec.match(/^([^/@]+)(?:@(.+))?$/);
      if (!matchNoScope) {
        throw new Error('Invalid collection format. Use: name, @scope/name, or scope/name (optionally with @version)');
      }
      [, name_slug, version] = matchNoScope;
      scope = 'collection'; // Default scope
    }

    const config = await getConfig();
    const client = getRegistryClient(config);

    console.log(`📦 Loading collection: ${scope === 'collection' ? name_slug : `@${scope}/${name_slug}`}...\n`);

    const collection = await client.getCollection(scope, name_slug, version);

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
        console.log(`   ${i + 1}. ✓ ${pkg?.package?.name}@${pkg.version || 'latest'}`);
        if (pkg.package && pkg.package.description) {
          console.log(`      ${pkg.package.description}`);
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
        console.log(`   ${i + 1}. ○ ${pkg?.package?.name}@${pkg.version || 'latest'}`);
        if (pkg.package && pkg.package.description) {
          console.log(`      ${pkg.package.description}`);
        }
        if (pkg.reason) {
          console.log(`      💡 ${pkg.reason}`);
        }
        console.log('');
      });
    }

    // Installation
    console.log('💡 Install:');
    if (scope === 'collection') {
      console.log(`   prpm install ${name_slug}`);
      if (optionalPkgs.length > 0) {
        console.log(`   prpm install ${name_slug} --skip-optional  # Skip optional packages`);
      }
    } else {
      console.log(`   prpm install @${scope}/${name_slug}`);
      if (optionalPkgs.length > 0) {
        console.log(`   prpm install @${scope}/${name_slug} --skip-optional  # Skip optional packages`);
      }
    }
    console.log('');

    await telemetry.track({
      command: 'collections:info',
      success: true,
      duration: Date.now() - startTime,
      data: {
        scope,
        name_slug,
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
  } finally {
    await telemetry.shutdown();
  }
}

/**
 * Publish/create a collection
 */
export async function handleCollectionPublish(
  manifestPath: string = './collection.json'
): Promise<void> {
  const startTime = Date.now();

  try {
    const config = await getConfig();
    const client = getRegistryClient(config);

    // Check authentication
    if (!config.token) {
      console.error('\n❌ Authentication required. Run `prpm login` first.\n');
      process.exit(1);
    }

    console.log('📦 Publishing collection...\n');

    // Read collection manifest
    const fs = await import('fs/promises');
    const manifestContent = await fs.readFile(manifestPath, 'utf-8');
    const manifest = JSON.parse(manifestContent);

    // Validate manifest
    const required = ['id', 'name', 'description', 'packages'];
    const missing = required.filter(field => !manifest[field]);
    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }

    // Validate id format (must be lowercase alphanumeric with hyphens)
    if (!/^[a-z0-9-]+$/.test(manifest.id)) {
      throw new Error('Collection id must be lowercase alphanumeric with hyphens only');
    }

    // Validate name length
    if (manifest.name.length < 3) {
      throw new Error('Collection name must be at least 3 characters');
    }

    // Validate description length
    if (manifest.description.length < 10) {
      throw new Error('Collection description must be at least 10 characters');
    }

    // Validate packages array
    if (!Array.isArray(manifest.packages) || manifest.packages.length === 0) {
      throw new Error('Collection must include at least one package');
    }

    // Validate each package
    manifest.packages.forEach((pkg: any, idx: number) => {
      if (!pkg.packageId) {
        throw new Error(`Package at index ${idx} is missing packageId`);
      }
    });

    console.log(`🔍 Validating collection manifest...`);
    console.log(`   Collection: ${manifest.name}`);
    console.log(`   ID: ${manifest.id}`);
    console.log(`   Packages: ${manifest.packages.length}`);
    console.log('');

    // Publish to registry
    console.log('🚀 Publishing to registry...\n');

    const result = await client.createCollection({
      id: manifest.id,
      name: manifest.name,
      description: manifest.description,
      category: manifest.category,
      tags: manifest.tags,
      packages: manifest.packages.map((pkg: any) => ({
        packageId: pkg.packageId,
        version: pkg.version,
        required: pkg.required !== false,
        reason: pkg.reason,
      })),
      icon: manifest.icon,
    });

    console.log(`✅ Collection published successfully!`);
    console.log(`   Scope: ${result.scope}`);
    console.log(`   Name: ${result.name_slug}`);
    console.log(`   Version: ${result.version || '1.0.0'}`);
    console.log('');
    console.log(`💡 View: prpm collection info @${result.scope}/${result.name_slug}`);
    console.log(`💡 Install: prpm install @${result.scope}/${result.name_slug}`);
    console.log('');

    await telemetry.track({
      command: 'collections:publish',
      success: true,
      duration: Date.now() - startTime,
      data: {
        id: manifest.id,
        packageCount: manifest.packages.length,
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`\n❌ Failed to publish collection: ${errorMessage}\n`);
    await telemetry.track({
      command: 'collections:publish',
      success: false,
      error: errorMessage,
      duration: Date.now() - startTime,
    });
    process.exit(1);
  } finally {
    await telemetry.shutdown();
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
    // Parse collection spec: @scope/name_slug, scope/name_slug, or just name_slug (defaults to 'collection' scope)
    let scope: string;
    let name_slug: string;
    let version: string | undefined;

    const matchWithScope = collectionSpec.match(/^@?([^/]+)\/([^/@]+)(?:@(.+))?$/);
    if (matchWithScope) {
      // Has explicit scope: @scope/name or scope/name
      [, scope, name_slug, version] = matchWithScope;
    } else {
      // No scope, assume 'collection' scope: just name or name@version
      const matchNoScope = collectionSpec.match(/^([^/@]+)(?:@(.+))?$/);
      if (!matchNoScope) {
        throw new Error('Invalid collection format. Use: name, @scope/name, or scope/name (optionally with @version)');
      }
      [, name_slug, version] = matchNoScope;
      scope = 'collection'; // Default scope
    }

    const config = await getConfig();
    const client = getRegistryClient(config);

    // Get collection installation plan
    console.log(`📦 Installing collection: ${scope === 'collection' ? name_slug : `@${scope}/${name_slug}`}...\n`);

    const installResult = await client.installCollection({
      scope,
      id: name_slug,
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
    const installedPackageIds: string[] = [];
    for (let i = 0; i < packages.length; i++) {
      const pkg = packages[i];
      const progress = `${i + 1}/${packages.length}`;

      try {
        console.log(`\n  ${progress} Installing ${pkg.packageId}@${pkg.version}...`);

        await handleInstall(`${pkg.packageId}@${pkg.version}`, {
          as: pkg.format,
          fromCollection: {
            scope,
            name_slug,
            version: collection.version || version || '1.0.0',
          },
        });

        console.log(`  ${progress} ✓ ${pkg.packageId}`);
        installedPackageIds.push(pkg.packageId);
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

    // Update lockfile with collection info
    const lockfile = (await readLockfile()) || createLockfile();
    const collectionKey = `@${scope}/${name_slug}`;
    addCollectionToLockfile(lockfile, collectionKey, {
      scope,
      name_slug,
      version: collection.version || version || '1.0.0',
      packages: installedPackageIds,
    });
    await writeLockfile(lockfile);

    console.log(`\n✅ Collection installed successfully!`);
    console.log(`   ${packagesInstalled}/${packages.length} packages installed`);
    if (packagesFailed > 0) {
      console.log(`   ${packagesFailed} optional packages failed`);
    }
    console.log(`   🔒 Collection tracked in lock file`);
    console.log('');

    await telemetry.track({
      command: 'collections:install',
      success: true,
      duration: Date.now() - startTime,
      data: {
        scope,
        name_slug,
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
  } finally {
    await telemetry.shutdown();
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

  // Search subcommand
  command
    .command('search <query>')
    .description('Search for collections')
    .option('--category <category>', 'Filter by category')
    .option('--tag <tag>', 'Filter by tag')
    .option('--official', 'Show only official collections')
    .option('--limit <number>', 'Number of results to show', '50')
    .action(async (query: string, options: { type?: string; limit?: string; category?: string; tag?: string; official?: boolean }) => {
      await handleCollectionsSearch(query, {
        category: options.category,
        tag: options.tag,
        official: options.official,
        limit: options.limit ? parseInt(options.limit, 10) : 50,
      });
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

  // Publish subcommand
  command
    .command('publish [manifest]')
    .description('Publish a collection from collection.json')
    .action(async (manifest?: string) => {
      await handleCollectionPublish(manifest);
    });

  // Install handled by main install command with @scope/id syntax

  return command;
}
