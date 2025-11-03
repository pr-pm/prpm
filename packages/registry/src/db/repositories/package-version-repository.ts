import { eq, sql, and, desc, SQL } from 'drizzle-orm';
import { db } from '../db.js';
import { packageVersions, type PackageVersion, type NewPackageVersion } from '../schema/package-versions.js';

/**
 * Package Version Repository
 *
 * Provides type-safe database operations for package versions.
 * Handles version history, downloads, and publishing metadata.
 */
export class PackageVersionRepository {
  /**
   * Find version by package ID and version string
   *
   * Primary lookup method for retrieving specific versions.
   * Returns null if version not found.
   */
  async findByPackageAndVersion(packageId: string, version: string): Promise<PackageVersion | null> {
    try {
      const [v] = await db
        .select()
        .from(packageVersions)
        .where(
          and(
            eq(packageVersions.packageId, packageId),
            eq(packageVersions.version, version)
          )
        )
        .limit(1);

      return v || null;
    } catch (error) {
      console.error('Failed to find package version', {
        packageId,
        version,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Find latest version for a package
   *
   * Returns the most recently published version.
   * Useful for "latest" tag resolution.
   */
  async findLatestVersion(packageId: string): Promise<PackageVersion | null> {
    try {
      const [v] = await db
        .select()
        .from(packageVersions)
        .where(eq(packageVersions.packageId, packageId))
        .orderBy(desc(packageVersions.publishedAt))
        .limit(1);

      return v || null;
    } catch (error) {
      console.error('Failed to find latest version', {
        packageId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Get version history for a package
   *
   * Returns all versions ordered by publish date (newest first).
   * Includes prerelease and deprecated versions.
   */
  async getVersionHistory(packageId: string, limit: number = 100): Promise<PackageVersion[]> {
    try {
      return await db
        .select()
        .from(packageVersions)
        .where(eq(packageVersions.packageId, packageId))
        .orderBy(desc(packageVersions.publishedAt))
        .limit(limit);
    } catch (error) {
      console.error('Failed to get version history', {
        packageId,
        limit,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Create a new package version
   *
   * Used during package publishing.
   * Returns the created version with generated ID.
   */
  async create(data: NewPackageVersion): Promise<PackageVersion> {
    try {
      const [version] = await db
        .insert(packageVersions)
        .values(data)
        .returning();

      if (!version) {
        throw new Error('Failed to create package version');
      }

      return version;
    } catch (error) {
      console.error('Failed to create package version', {
        packageId: data.packageId,
        version: data.version,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Increment download count for a version
   *
   * Atomically increments the downloads counter.
   * Used when packages are downloaded/installed.
   */
  async incrementDownloadCount(id: string): Promise<void> {
    try {
      await db
        .update(packageVersions)
        .set({
          downloads: sql`${packageVersions.downloads} + 1`,
        })
        .where(eq(packageVersions.id, id));
    } catch (error) {
      console.error('Failed to increment download count', {
        id,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Mark version as deprecated
   *
   * Sets the is_deprecated flag to true.
   * Used when maintainers deprecate old versions.
   */
  async markAsDeprecated(id: string): Promise<void> {
    try {
      await db
        .update(packageVersions)
        .set({
          isDeprecated: true,
        })
        .where(eq(packageVersions.id, id));
    } catch (error) {
      console.error('Failed to mark version as deprecated', {
        id,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Get total download count for a package across all versions
   *
   * Returns sum of downloads for all versions.
   */
  async getTotalDownloads(packageId: string): Promise<number> {
    try {
      const result = await db
        .select({
          total: sql<number>`COALESCE(SUM(${packageVersions.downloads}), 0)::int`,
        })
        .from(packageVersions)
        .where(eq(packageVersions.packageId, packageId));

      return result[0]?.total || 0;
    } catch (error) {
      console.error('Failed to get total downloads', {
        packageId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Delete a specific version
   *
   * Permanently removes a version from the database.
   * Use with caution - consider marking as deprecated instead.
   */
  async delete(id: string): Promise<void> {
    try {
      await db
        .delete(packageVersions)
        .where(eq(packageVersions.id, id));
    } catch (error) {
      console.error('Failed to delete package version', {
        id,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Find version by ID
   *
   * Direct lookup by UUID.
   */
  async findById(id: string): Promise<PackageVersion | null> {
    try {
      const [v] = await db
        .select()
        .from(packageVersions)
        .where(eq(packageVersions.id, id))
        .limit(1);

      return v || null;
    } catch (error) {
      console.error('Failed to find package version by ID', {
        id,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}

// Export singleton instance
export const packageVersionRepository = new PackageVersionRepository();
