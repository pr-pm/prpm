import { eq, and, desc } from 'drizzle-orm';
import { db } from '../db.js';
import {
  collectionPackages,
  type CollectionPackage,
  type NewCollectionPackage,
} from '../schema/collections.js';
import { packages } from '../schema/packages.js';
import { packageVersions } from '../schema/package-versions.js';

/**
 * Collection Package Repository
 *
 * Manages the many-to-many relationship between collections and packages.
 * Handles package membership, ordering, and requirements within collections.
 */
export class CollectionPackageRepository {
  /**
   * Get all packages in a collection
   *
   * Returns packages ordered by install_order.
   * Used by collection detail and install endpoints.
   */
  async getPackagesByCollection(collectionId: string): Promise<CollectionPackage[]> {
    try {
      const results = await db
        .select()
        .from(collectionPackages)
        .where(eq(collectionPackages.collectionId, collectionId))
        .orderBy(collectionPackages.installOrder);

      return results;
    } catch (error) {
      console.error('Failed to get packages by collection', {
        collectionId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Get a specific package in a collection
   *
   * Used to check if package already exists in collection.
   */
  async findByCollectionAndPackage(
    collectionId: string,
    packageId: string
  ): Promise<CollectionPackage | null> {
    try {
      const [result] = await db
        .select()
        .from(collectionPackages)
        .where(
          and(
            eq(collectionPackages.collectionId, collectionId),
            eq(collectionPackages.packageId, packageId)
          )
        )
        .limit(1);

      return result || null;
    } catch (error) {
      console.error('Failed to find collection package', {
        collectionId,
        packageId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Add package to collection
   *
   * Creates new collection-package relationship.
   * Used by collection creation and update endpoints.
   */
  async addPackage(data: NewCollectionPackage): Promise<CollectionPackage> {
    try {
      const [result] = await db
        .insert(collectionPackages)
        .values(data)
        .returning();

      return result;
    } catch (error) {
      console.error('Failed to add package to collection', {
        data,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Add multiple packages to collection
   *
   * Bulk insert for collection creation.
   * Returns all created records.
   */
  async addPackages(data: NewCollectionPackage[]): Promise<CollectionPackage[]> {
    try {
      if (data.length === 0) {
        return [];
      }

      const results = await db
        .insert(collectionPackages)
        .values(data)
        .returning();

      return results;
    } catch (error) {
      console.error('Failed to add packages to collection', {
        count: data.length,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Remove package from collection
   *
   * Deletes collection-package relationship.
   * Used by collection update endpoint.
   */
  async removePackage(collectionId: string, packageId: string): Promise<void> {
    try {
      await db
        .delete(collectionPackages)
        .where(
          and(
            eq(collectionPackages.collectionId, collectionId),
            eq(collectionPackages.packageId, packageId)
          )
        );
    } catch (error) {
      console.error('Failed to remove package from collection', {
        collectionId,
        packageId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Remove all packages from collection
   *
   * Used when updating collection packages (replace all).
   */
  async removeAllPackages(collectionId: string): Promise<void> {
    try {
      await db
        .delete(collectionPackages)
        .where(eq(collectionPackages.collectionId, collectionId));
    } catch (error) {
      console.error('Failed to remove all packages from collection', {
        collectionId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Count packages in collection
   *
   * Used for collection statistics.
   */
  async countByCollection(collectionId: string): Promise<number> {
    try {
      const results = await db
        .select()
        .from(collectionPackages)
        .where(eq(collectionPackages.collectionId, collectionId));

      return results.length;
    } catch (error) {
      console.error('Failed to count packages in collection', {
        collectionId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Get packages with full details for a collection
   *
   * Joins with packages and package_versions tables to provide
   * complete package information for collection detail endpoints.
   * Returns packages ordered by install_order.
   */
  async getPackagesWithDetails(collectionId: string): Promise<Array<{
    id: string;
    packageId: string;
    name: string;
    description: string | null;
    format: string | null;
    subtype: string | null;
    version: string;
    packageVersion: string | null;
    required: boolean;
    reason: string | null;
    installOrder: number;
  }>> {
    try {
      // Get all collection packages with package details
      const results = await db
        .select({
          id: collectionPackages.collectionId, // For compatibility
          packageId: collectionPackages.packageId,
          name: packages.name,
          description: packages.description,
          format: packages.format,
          subtype: packages.subtype,
          packageVersion: collectionPackages.packageVersion,
          required: collectionPackages.required,
          reason: collectionPackages.reason,
          installOrder: collectionPackages.installOrder,
        })
        .from(collectionPackages)
        .innerJoin(packages, eq(collectionPackages.packageId, packages.id))
        .where(eq(collectionPackages.collectionId, collectionId))
        .orderBy(collectionPackages.installOrder);

      // For each package, get the version (latest if packageVersion is null)
      const packagesWithVersions = await Promise.all(
        results.map(async (pkg) => {
          let version = 'latest';

          if (pkg.packageVersion) {
            // Specific version requested
            version = pkg.packageVersion;
          } else {
            // Get latest version
            const [latestVersion] = await db
              .select({ version: packageVersions.version })
              .from(packageVersions)
              .where(eq(packageVersions.packageId, pkg.packageId))
              .orderBy(desc(packageVersions.publishedAt))
              .limit(1);

            if (latestVersion) {
              version = latestVersion.version;
            }
          }

          return {
            id: pkg.id,
            packageId: pkg.packageId,
            name: pkg.name,
            description: pkg.description,
            format: pkg.format,
            subtype: pkg.subtype,
            version,
            packageVersion: pkg.packageVersion,
            required: pkg.required,
            reason: pkg.reason,
            installOrder: pkg.installOrder,
          };
        })
      );

      return packagesWithVersions;
    } catch (error) {
      console.error('Failed to get packages with details', {
        collectionId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}

// Export singleton instance
export const collectionPackageRepository = new CollectionPackageRepository();
