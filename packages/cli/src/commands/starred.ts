/**
 * Starred command implementation - List user's starred packages and collections
 */

import { Command } from 'commander';
import { getRegistryClient } from '@pr-pm/registry-client';
import { config } from '../core/config';
import { telemetry } from '../core/telemetry';
import { CLIError } from '../core/errors';

interface StarredOptions {
  packages?: boolean;
  collections?: boolean;
  format?: string;
  limit?: number;
}

export async function handleStarred(options: StarredOptions): Promise<void> {
  try {
    const token = config.get('token');
    if (!token) {
      throw new CLIError('You must be logged in to view starred items. Run `prpm login` first.');
    }

    const registryUrl = config.get('registryUrl') || process.env.PRPM_REGISTRY_URL || 'https://registry.prpm.dev';
    const client = getRegistryClient({ registryUrl, token });

    // Determine what to show (both by default)
    const showPackages = options.packages || (!options.packages && !options.collections);
    const showCollections = options.collections || (!options.packages && !options.collections);
    const limit = options.limit || 100;

    // Track telemetry
    await telemetry.trackCommand('starred', {
      showPackages,
      showCollections,
      format: options.format,
    });

    // Fetch starred packages
    let packages: any[] = [];
    if (showPackages) {
      try {
        const response = await fetch(`${registryUrl}/api/v1/packages/starred?limit=${limit}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch starred packages: ${response.statusText}`);
        }

        const data = await response.json();
        packages = data.packages || [];

        // Filter by format if specified
        if (options.format) {
          packages = packages.filter((pkg: any) => pkg.format === options.format);
        }
      } catch (error) {
        console.error('Failed to fetch starred packages:', error);
      }
    }

    // Fetch starred collections
    let collections: any[] = [];
    if (showCollections) {
      try {
        const response = await fetch(`${registryUrl}/api/v1/collections/starred?limit=${limit}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch starred collections: ${response.statusText}`);
        }

        const data = await response.json();
        collections = data.collections || [];
      } catch (error) {
        console.error('Failed to fetch starred collections:', error);
      }
    }

    // Display results
    if (packages.length === 0 && collections.length === 0) {
      console.log('\nNo starred items found.');
      if (options.format) {
        console.log(`Try removing the --format filter to see all starred packages.`);
      }
      return;
    }

    console.log('');

    // Display packages
    if (packages.length > 0) {
      console.log(`📦 Starred Packages (${packages.length}):`);
      console.log('');

      for (const pkg of packages) {
        const formatBadge = `[${pkg.format || 'generic'}]`.padEnd(12);
        const stars = `⭐ ${pkg.stars || 0}`.padEnd(8);
        const downloads = `⬇️  ${(pkg.total_downloads || 0).toLocaleString()}`;

        console.log(`  ${formatBadge} ${pkg.name}`);
        console.log(`      ${stars} ${downloads}`);

        if (pkg.description) {
          const desc = pkg.description.length > 80
            ? pkg.description.substring(0, 77) + '...'
            : pkg.description;
          console.log(`      ${desc}`);
        }
        console.log('');
      }
    }

    // Display collections
    if (collections.length > 0) {
      console.log(`📚 Starred Collections (${collections.length}):`);
      console.log('');

      for (const collection of collections) {
        const stars = `⭐ ${collection.stars || 0}`.padEnd(8);
        const packages = `📦 ${collection.package_count || 0} packages`;

        console.log(`  ${collection.scope}/${collection.name_slug}`);
        console.log(`      ${stars} ${packages}`);

        if (collection.description) {
          const desc = collection.description.length > 80
            ? collection.description.substring(0, 77) + '...'
            : collection.description;
          console.log(`      ${desc}`);
        }
        console.log('');
      }
    }

    console.log(`\nTotal: ${packages.length + collections.length} starred items`);
    console.log('');
  } catch (error) {
    if (error instanceof CLIError) {
      throw error;
    }
    throw new CLIError(`Failed to fetch starred items: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export function createStarredCommand(): Command {
  const command = new Command('starred');

  command
    .description('List your starred packages and collections')
    .option('--packages', 'Show only starred packages')
    .option('--collections', 'Show only starred collections')
    .option('--format <format>', 'Filter packages by format (cursor, claude, continue, windsurf, etc.)')
    .option('--limit <number>', 'Maximum number of items to fetch (default: 100)', (val) => parseInt(val, 10))
    .action(handleStarred);

  return command;
}
