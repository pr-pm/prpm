import { eq, and, sql } from 'drizzle-orm';
import { db } from '../db.js';
import {
  collectionStars,
  type CollectionStar,
  type NewCollectionStar,
} from '../schema/collections.js';

/**
 * Collection Star Repository
 *
 * Manages collection starring/favoriting functionality.
 * Handles adding, removing, and querying star relationships.
 */
export class CollectionStarRepository {
  /**
   * Add a star to a collection
   *
   * Creates a star record if it doesn't exist (idempotent).
   * Uses ON CONFLICT DO NOTHING for idempotency.
   */
  async addStar(collectionId: string, userId: string): Promise<CollectionStar> {
    try {
      // Insert with ON CONFLICT DO NOTHING behavior
      // If star already exists, this won't fail
      const [star] = await db
        .insert(collectionStars)
        .values({
          collectionId,
          userId,
        })
        .onConflictDoNothing()
        .returning();

      // If star was not inserted (already existed), fetch the existing one
      if (!star) {
        const [existingStar] = await db
          .select()
          .from(collectionStars)
          .where(
            and(
              eq(collectionStars.collectionId, collectionId),
              eq(collectionStars.userId, userId)
            )
          )
          .limit(1);

        return existingStar;
      }

      return star;
    } catch (error) {
      console.error('Failed to add collection star', {
        collectionId,
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Remove a star from a collection
   *
   * Deletes the star record if it exists.
   * Idempotent - no error if star doesn't exist.
   */
  async removeStar(collectionId: string, userId: string): Promise<void> {
    try {
      await db
        .delete(collectionStars)
        .where(
          and(
            eq(collectionStars.collectionId, collectionId),
            eq(collectionStars.userId, userId)
          )
        );
    } catch (error) {
      console.error('Failed to remove collection star', {
        collectionId,
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Get star count for a collection
   *
   * Returns the total number of stars for a collection.
   */
  async getStarCount(collectionId: string): Promise<number> {
    try {
      const [result] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(collectionStars)
        .where(eq(collectionStars.collectionId, collectionId));

      return result?.count || 0;
    } catch (error) {
      console.error('Failed to get collection star count', {
        collectionId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Check if user has starred a collection
   *
   * Returns true if the user has starred the collection.
   */
  async hasUserStarred(collectionId: string, userId: string): Promise<boolean> {
    try {
      const [star] = await db
        .select({ collectionId: collectionStars.collectionId })
        .from(collectionStars)
        .where(
          and(
            eq(collectionStars.collectionId, collectionId),
            eq(collectionStars.userId, userId)
          )
        )
        .limit(1);

      return !!star;
    } catch (error) {
      console.error('Failed to check if user starred collection', {
        collectionId,
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}

// Export singleton instance
export const collectionStarRepository = new CollectionStarRepository();
