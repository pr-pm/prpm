import { db } from '../db.js';
import {
  collectionInstalls,
  type CollectionInstall,
  type NewCollectionInstall,
} from '../schema/collections.js';

/**
 * Collection Install Repository
 *
 * Tracks collection installations for analytics and usage metrics.
 * Used by collection install endpoint to record when users install collections.
 */
export class CollectionInstallRepository {
  /**
   * Track a collection installation
   *
   * Creates a record of when a collection was installed by a user.
   * Used for download counters and analytics.
   */
  async trackInstall(data: NewCollectionInstall): Promise<CollectionInstall> {
    try {
      const [install] = await db
        .insert(collectionInstalls)
        .values(data)
        .returning();

      return install;
    } catch (error) {
      console.error('Failed to track collection install', {
        data,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}

// Export singleton instance
export const collectionInstallRepository = new CollectionInstallRepository();
