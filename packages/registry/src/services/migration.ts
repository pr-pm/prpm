/**
 * Package Migration Service
 * Handles lazy migration of tarball packages to canonical format
 */

import { FastifyInstance } from 'fastify';
import { query } from '../db/index.js';
import { getCanonicalPackage, uploadCanonicalPackage, hasCanonicalStorage } from '../storage/canonical.js';

export interface MigrationStats {
  total: number;
  migrated: number;
  failed: number;
  skipped: number;
}

/**
 * Enable/disable lazy migration
 * When enabled, packages are automatically migrated on first access
 */
let lazyMigrationEnabled = process.env.ENABLE_LAZY_MIGRATION === 'true';

export function enableLazyMigration(enabled: boolean) {
  lazyMigrationEnabled = enabled;
}

export function isLazyMigrationEnabled(): boolean {
  return lazyMigrationEnabled;
}

/**
 * Lazily migrate a package to canonical format
 * Called automatically when a package is accessed
 */
export async function lazyMigratePackage(
  server: FastifyInstance,
  packageId: string,
  packageName: string,
  version: string
): Promise<boolean> {
  // Skip if lazy migration is disabled
  if (!lazyMigrationEnabled) {
    return false;
  }

  try {
    // Check if already migrated
    const alreadyMigrated = await hasCanonicalStorage(packageName, version);
    if (alreadyMigrated) {
      return false; // Already migrated
    }

    server.log.info(
      { packageName, version },
      'Lazy migrating package to canonical format'
    );

    // Get canonical format (this triggers tarball extraction + conversion)
    const canonical = await getCanonicalPackage(
      server,
      packageId,
      packageName,
      version
    );

    // Upload canonical version
    await uploadCanonicalPackage(server, packageName, version, canonical);

    server.log.info(
      { packageName, version },
      'Successfully migrated package to canonical format'
    );

    return true;
  } catch (error: unknown) {
    server.log.error(
      {
        error: String(error),
        packageName,
        version,
      },
      'Failed to lazy migrate package'
    );
    return false;
  }
}

/**
 * Batch migrate packages to canonical format
 * Useful for backfilling existing packages
 */
export async function batchMigratePackages(
  server: FastifyInstance,
  options?: {
    limit?: number;
    offset?: number;
    dryRun?: boolean;
  }
): Promise<MigrationStats> {
  const limit = options?.limit ?? 100;
  const offset = options?.offset ?? 0;
  const dryRun = options?.dryRun ?? false;

  const stats: MigrationStats = {
    total: 0,
    migrated: 0,
    failed: 0,
    skipped: 0,
  };

  try {
    // Get packages that need migration
    const result = await query<{
      id: string;
      name: string;
      version: string;
      created_at: string;
    }>(
      server,
      `SELECT DISTINCT p.id, p.name, pv.version, p.created_at
       FROM packages p
       INNER JOIN package_versions pv ON p.id = pv.package_id
       ORDER BY p.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    stats.total = result.rows.length;

    server.log.info(
      { total: stats.total, limit, offset, dryRun },
      'Starting batch migration'
    );

    for (const pkg of result.rows) {
      try {
        // Check if already migrated
        const alreadyMigrated = await hasCanonicalStorage(pkg.name, pkg.version);
        if (alreadyMigrated) {
          stats.skipped++;
          server.log.debug(
            { packageName: pkg.name, version: pkg.version },
            'Package already migrated, skipping'
          );
          continue;
        }

        if (dryRun) {
          server.log.info(
            { packageName: pkg.name, version: pkg.version },
            '[DRY RUN] Would migrate package'
          );
          stats.migrated++;
          continue;
        }

        // Migrate package
        const canonical = await getCanonicalPackage(
          server,
          pkg.id,
          pkg.name,
          pkg.version
        );

        await uploadCanonicalPackage(server, pkg.name, pkg.version, canonical);

        stats.migrated++;
        server.log.info(
          { packageName: pkg.name, version: pkg.version },
          'Successfully migrated package'
        );
      } catch (error: unknown) {
        stats.failed++;
        server.log.error(
          {
            error: String(error),
            packageName: pkg.name,
            version: pkg.version,
          },
          'Failed to migrate package'
        );
      }
    }

    server.log.info(stats, 'Batch migration completed');

    return stats;
  } catch (error: unknown) {
    server.log.error(
      {
        error: String(error),
        limit,
        offset,
      },
      'Failed to execute batch migration'
    );
    throw error;
  }
}

/**
 * Get migration status for a package
 */
export async function getMigrationStatus(
  packageName: string,
  version: string
): Promise<{
  migrated: boolean;
  format: 'canonical' | 'tarball';
}> {
  const hasCanonical = await hasCanonicalStorage(packageName, version);
  return {
    migrated: hasCanonical,
    format: hasCanonical ? 'canonical' : 'tarball',
  };
}

/**
 * Estimate total packages needing migration
 */
export async function estimateMigrationCount(
  server: FastifyInstance
): Promise<number> {
  const result = await query<{ count: string }>(
    server,
    `SELECT COUNT(DISTINCT pv.id) as count
     FROM package_versions pv`
  );

  return parseInt(result.rows[0]?.count || '0', 10);
}
