import { eq, and } from 'drizzle-orm';
import { db } from '../db.js';
import {
  collectionPackages,
  type CollectionPackage,
  type NewCollectionPackage,
} from '../schema/collections.js';

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
}

// Export singleton instance
export const collectionPackageRepository = new CollectionPackageRepository();
