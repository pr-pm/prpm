import { eq, and, sql, desc, or, ilike, SQL } from 'drizzle-orm';
import { db } from '../db.js';
import { collections, type Collection, type NewCollection } from '../schema/collections.js';

/**
 * Collection Repository
 *
 * Provides type-safe database operations for collections.
 * All queries use the correct field names from the schema,
 * ensuring no field name mismatches.
 */
export class CollectionRepository {
  /**
   * Find collection by slug
   *
   * Used by GET /:scope/:name_slug endpoint.
   * Returns the latest version if version not specified.
   */
  async findBySlug(
    scope: string,
    nameSlug: string,
    version?: string
  ): Promise<Collection | null> {
    try {
      const conditions = [
        eq(collections.scope, scope),
        eq(collections.nameSlug, nameSlug),
      ];

      if (version) {
        conditions.push(eq(collections.version, version));
      }

      // If no version specified, get the latest version
      const [collection] = await db
        .select()
        .from(collections)
        .where(and(...conditions))
        .orderBy(desc(collections.createdAt))
        .limit(1);

      return collection || null;
    } catch (error) {
      console.error('Failed to find collection by slug', {
        scope,
        nameSlug,
        version,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Find collection by ID
   *
   * Used for internal lookups and collection package queries.
   */
  async findById(id: string): Promise<Collection | null> {
    try {
      const [collection] = await db
        .select()
        .from(collections)
        .where(eq(collections.id, id))
        .limit(1);

      return collection || null;
    } catch (error) {
      console.error('Failed to find collection by ID', {
        id,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Check if collection exists by scope and name slug
   *
   * Lightweight check used before creating new collections.
   */
  async exists(scope: string, nameSlug: string): Promise<boolean> {
    try {
      const [collection] = await db
        .select({ id: collections.id })
        .from(collections)
        .where(
          and(
            eq(collections.scope, scope),
            eq(collections.nameSlug, nameSlug)
          )
        )
        .limit(1);

      return !!collection;
    } catch (error) {
      console.error('Failed to check collection existence', {
        scope,
        nameSlug,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Find collections by organization
   *
   * Returns all collections owned by a specific organization.
   */
  async findByOrganization(orgId: string): Promise<Collection[]> {
    try {
      return await db
        .select()
        .from(collections)
        .where(eq(collections.orgId, orgId))
        .orderBy(desc(collections.createdAt));
    } catch (error) {
      console.error('Failed to find collections by organization', {
        orgId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Find collections by author
   *
   * Returns all collections created by a specific author.
   * Used in author analytics and profile pages.
   */
  async findByAuthor(authorId: string): Promise<Collection[]> {
    try {
      return await db
        .select()
        .from(collections)
        .where(eq(collections.authorId, authorId))
        .orderBy(desc(collections.createdAt));
    } catch (error) {
      console.error('Failed to find collections by author', {
        authorId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Create new collection
   *
   * Used when creating a collection for the first time.
   * Returns the full collection record with generated ID.
   */
  async create(data: NewCollection): Promise<Collection> {
    try {
      const [collection] = await db
        .insert(collections)
        .values(data)
        .returning();

      return collection;
    } catch (error) {
      console.error('Failed to create collection', {
        data,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Search collections with filters
   *
   * Used by the main collections listing endpoint.
   * Supports full-text search, filtering, sorting, and pagination.
   */
  async search(params: {
    search?: string;
    category?: string;
    tag?: string;
    framework?: string;
    official?: boolean;
    verified?: boolean;
    scope?: string;
    sort?: 'downloads' | 'stars' | 'created' | 'updated' | 'name';
    sortOrder?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
  }): Promise<{ collections: Collection[]; total: number }> {
    try {
      const {
        search,
        category,
        tag,
        framework,
        official,
        verified,
        scope,
        sort = 'downloads',
        sortOrder = 'desc',
        limit = 20,
        offset = 0,
      } = params;

      // Build WHERE conditions
      const conditions: SQL[] = [];

      if (category) {
        conditions.push(eq(collections.category, category));
      }

      if (tag) {
        // Search in tags array
        conditions.push(sql`${tag} = ANY(${collections.tags})`);
      }

      if (framework) {
        conditions.push(eq(collections.framework, framework));
      }

      if (official !== undefined) {
        conditions.push(eq(collections.official, official));
      }

      if (verified !== undefined) {
        conditions.push(eq(collections.verified, verified));
      }

      if (scope) {
        conditions.push(eq(collections.scope, scope));
      }

      if (search) {
        // Full-text search using PostgreSQL's tsquery
        // Also search by name, description, name_slug, and tags
        conditions.push(
          or(
            sql`to_tsvector('english', coalesce(${collections.name}, '') || ' ' || coalesce(${collections.description}, '') || ' ' || coalesce(${collections.nameSlug}, '')) @@ websearch_to_tsquery('english', ${search})`,
            ilike(collections.name, `%${search}%`),
            ilike(collections.description, `%${search}%`),
            ilike(collections.nameSlug, `%${search}%`),
            sql`${search} = ANY(${collections.tags})`
          )!
        );
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // Get total count
      const countResult = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(collections)
        .where(whereClause);

      const total = countResult[0]?.count || 0;

      // Build ORDER BY
      let orderBy;
      switch (sort) {
        case 'stars':
          orderBy = sortOrder === 'asc' ? collections.stars : desc(collections.stars);
          break;
        case 'created':
          orderBy = sortOrder === 'asc' ? collections.createdAt : desc(collections.createdAt);
          break;
        case 'updated':
          orderBy = sortOrder === 'asc' ? collections.updatedAt : desc(collections.updatedAt);
          break;
        case 'name':
          orderBy = sortOrder === 'asc' ? collections.name : desc(collections.name);
          break;
        case 'downloads':
        default:
          orderBy = sortOrder === 'asc' ? collections.downloads : desc(collections.downloads);
          break;
      }

      // Get collections
      const results = await db
        .select()
        .from(collections)
        .where(whereClause)
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset);

      return {
        collections: results,
        total,
      };
    } catch (error) {
      console.error('Failed to search collections', {
        params,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Get featured collections
   *
   * Returns official and verified collections sorted by popularity.
   * Used by the /featured endpoint.
   */
  async getFeatured(limit: number = 20): Promise<Collection[]> {
    try {
      const results = await db
        .select()
        .from(collections)
        .where(
          and(
            eq(collections.official, true),
            eq(collections.verified, true)
          )
        )
        .orderBy(desc(collections.stars), desc(collections.downloads))
        .limit(limit);

      return results;
    } catch (error) {
      console.error('Failed to get featured collections', {
        limit,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Increment download count
   *
   * Called when a collection is installed.
   */
  async incrementDownloads(id: string): Promise<void> {
    try {
      await db
        .update(collections)
        .set({
          downloads: sql`${collections.downloads} + 1`,
        })
        .where(eq(collections.id, id));
    } catch (error) {
      console.error('Failed to increment download count', {
        id,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Update star count
   *
   * Called when a user stars/unstars a collection.
   * Note: The actual star count is managed by a trigger in the database,
   * but this method can be used to manually sync if needed.
   */
  async updateStarCount(id: string, count: number): Promise<void> {
    try {
      await db
        .update(collections)
        .set({
          stars: count,
        })
        .where(eq(collections.id, id));
    } catch (error) {
      console.error('Failed to update star count', {
        id,
        count,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Update collection timestamps
   *
   * Called after publishing a new version.
   */
  async updateTimestamps(id: string): Promise<void> {
    try {
      await db
        .update(collections)
        .set({
          updatedAt: new Date(),
        })
        .where(eq(collections.id, id));
    } catch (error) {
      console.error('Failed to update collection timestamps', {
        id,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Get collection count by author
   *
   * Returns the number of collections created by a user.
   * Used in user analytics.
   */
  async countByAuthor(authorId: string): Promise<number> {
    try {
      const result = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(collections)
        .where(eq(collections.authorId, authorId));

      return result[0]?.count || 0;
    } catch (error) {
      console.error('Failed to count collections by author', {
        authorId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Get collection count by organization
   *
   * Returns the number of collections owned by an organization.
   */
  async countByOrganization(orgId: string): Promise<number> {
    try {
      const result = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(collections)
        .where(eq(collections.orgId, orgId));

      return result[0]?.count || 0;
    } catch (error) {
      console.error('Failed to count collections by organization', {
        orgId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Get latest collections
   *
   * Returns recently created collections.
   */
  async getLatest(limit: number = 20): Promise<Collection[]> {
    try {
      const results = await db
        .select()
        .from(collections)
        .orderBy(desc(collections.createdAt))
        .limit(limit);

      return results;
    } catch (error) {
      console.error('Failed to get latest collections', {
        limit,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Get popular collections
   *
   * Returns collections sorted by download count.
   */
  async getPopular(limit: number = 20): Promise<Collection[]> {
    try {
      const results = await db
        .select()
        .from(collections)
        .orderBy(desc(collections.downloads), desc(collections.stars))
        .limit(limit);

      return results;
    } catch (error) {
      console.error('Failed to get popular collections', {
        limit,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Update collection verification status
   *
   * Used by admin endpoints to verify collections.
   */
  async updateVerificationStatus(id: string, verified: boolean): Promise<void> {
    try {
      await db
        .update(collections)
        .set({
          verified,
          updatedAt: new Date(),
        })
        .where(eq(collections.id, id));
    } catch (error) {
      console.error('Failed to update verification status', {
        id,
        verified,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Update collection official status
   *
   * Used by admin endpoints to mark collections as official.
   */
  async updateOfficialStatus(id: string, official: boolean): Promise<void> {
    try {
      await db
        .update(collections)
        .set({
          official,
          updatedAt: new Date(),
        })
        .where(eq(collections.id, id));
    } catch (error) {
      console.error('Failed to update official status', {
        id,
        official,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}

// Export singleton instance
export const collectionRepository = new CollectionRepository();
