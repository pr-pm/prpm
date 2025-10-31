import { eq, sql, and, or, desc, asc, ilike, SQL } from 'drizzle-orm';
import { db } from '../db.js';
import { packages, type Package, type NewPackage } from '../schema/packages.js';

/**
 * Package Repository
 *
 * Provides type-safe database operations for packages.
 * All queries use the correct field names from the schema,
 * preventing column name bugs like the is_verified issue in organizations.
 */
export class PackageRepository {
  /**
   * Find package by name
   *
   * Primary lookup method used throughout the codebase.
   * Returns null if package not found.
   */
  async findByName(name: string): Promise<Package | null> {
    try {
      const [pkg] = await db
        .select()
        .from(packages)
        .where(eq(packages.name, name))
        .limit(1);

      return pkg || null;
    } catch (error) {
      console.error('Failed to find package by name', {
        name,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Find public package by name
   *
   * Used by public API endpoints to ensure only visible packages are returned.
   */
  async findPublicByName(name: string): Promise<Package | null> {
    try {
      const [pkg] = await db
        .select()
        .from(packages)
        .where(
          and(
            eq(packages.name, name),
            eq(packages.visibility, 'public')
          )
        )
        .limit(1);

      return pkg || null;
    } catch (error) {
      console.error('Failed to find public package by name', {
        name,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Find package by ID
   *
   * Used for internal lookups and stats tracking.
   */
  async findById(id: string): Promise<Package | null> {
    try {
      const [pkg] = await db
        .select()
        .from(packages)
        .where(eq(packages.id, id))
        .limit(1);

      return pkg || null;
    } catch (error) {
      console.error('Failed to find package by ID', {
        id,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Check if package exists by name
   *
   * Lightweight check used before creating new packages.
   * Returns only id to minimize data transfer.
   */
  async exists(name: string): Promise<boolean> {
    try {
      const [pkg] = await db
        .select({ id: packages.id })
        .from(packages)
        .where(eq(packages.name, name))
        .limit(1);

      return !!pkg;
    } catch (error) {
      console.error('Failed to check package existence', {
        name,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Get package ownership info
   *
   * Returns minimal fields needed for permission checks.
   * Used in publish and unpublish endpoints.
   */
  async getOwnership(name: string): Promise<Pick<Package, 'id' | 'authorId' | 'orgId'> | null> {
    try {
      const [pkg] = await db
        .select({
          id: packages.id,
          authorId: packages.authorId,
          orgId: packages.orgId,
        })
        .from(packages)
        .where(eq(packages.name, name))
        .limit(1);

      return pkg || null;
    } catch (error) {
      console.error('Failed to get package ownership', {
        name,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Create new package
   *
   * Used when publishing a package for the first time.
   * Returns the full package record with generated ID.
   */
  async create(data: NewPackage): Promise<Package> {
    try {
      const [pkg] = await db
        .insert(packages)
        .values(data)
        .returning();

      return pkg;
    } catch (error) {
      console.error('Failed to create package', {
        packageName: data.name,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Update package timestamps
   *
   * Called after publishing a new version.
   */
  async updateTimestamps(id: string): Promise<void> {
    try {
      await db
        .update(packages)
        .set({
          lastPublishedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(packages.id, id));
    } catch (error) {
      console.error('Failed to update package timestamps', {
        id,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Increment download count
   *
   * Called when a package version is downloaded.
   * Updates total downloads counter.
   */
  async incrementDownloads(id: string): Promise<void> {
    try {
      await db
        .update(packages)
        .set({
          totalDownloads: sql`${packages.totalDownloads} + 1`,
        })
        .where(eq(packages.id, id));
    } catch (error) {
      console.error('Failed to increment download count', {
        id,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Increment view count
   *
   * Called when a package page is viewed.
   */
  async incrementViews(id: string): Promise<void> {
    try {
      await db
        .update(packages)
        .set({
          viewCount: sql`${packages.viewCount} + 1`,
        })
        .where(eq(packages.id, id));
    } catch (error) {
      console.error('Failed to increment view count', {
        id,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Increment install count
   *
   * Called when a package is installed.
   */
  async incrementInstalls(id: string): Promise<void> {
    try {
      await db
        .update(packages)
        .set({
          installCount: sql`${packages.installCount} + 1`,
        })
        .where(eq(packages.id, id));
    } catch (error) {
      console.error('Failed to increment install count', {
        id,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Update package statistics
   *
   * Called by analytics jobs to update cached download stats.
   */
  async updateStats(
    id: string,
    stats: {
      totalDownloads?: number;
      weeklyDownloads?: number;
      monthlyDownloads?: number;
      downloadsLast7Days?: number;
      downloadsLast30Days?: number;
      trendingScore?: string;
    }
  ): Promise<void> {
    try {
      await db
        .update(packages)
        .set({
          ...stats,
          updatedAt: new Date(),
        })
        .where(eq(packages.id, id));
    } catch (error) {
      console.error('Failed to update package stats', {
        id,
        stats,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Search packages with filters
   *
   * Used by the main package listing endpoint.
   * Supports full-text search, filtering, sorting, and pagination.
   */
  async search(params: {
    search?: string;
    format?: string;
    subtype?: string;
    category?: string;
    featured?: boolean;
    verified?: boolean;
    visibility?: string;
    sort?: 'downloads' | 'created' | 'updated' | 'quality' | 'rating';
    limit?: number;
    offset?: number;
  }): Promise<{ packages: Package[]; total: number }> {
    try {
      const {
        search,
        format,
        subtype,
        category,
        featured,
        verified,
        visibility = 'public',
        sort = 'downloads',
        limit = 20,
        offset = 0,
      } = params;

      // Build WHERE conditions
      const conditions: SQL[] = [eq(packages.visibility, visibility)];

      if (format) {
        conditions.push(eq(packages.format, format));
      }

      if (subtype) {
        conditions.push(eq(packages.subtype, subtype));
      }

      if (category) {
        conditions.push(eq(packages.category, category));
      }

      if (featured !== undefined) {
        conditions.push(eq(packages.featured, featured));
      }

      if (verified !== undefined) {
        conditions.push(eq(packages.verified, verified));
      }

      if (search) {
        // Full-text search using PostgreSQL's tsquery
        // Also search by name (case-insensitive) and tags
        conditions.push(
          or(
            sql`to_tsvector('english', coalesce(${packages.name}, '') || ' ' || coalesce(${packages.description}, '')) @@ websearch_to_tsquery('english', ${search})`,
            ilike(packages.name, `%${search}%`),
            sql`${search.toLowerCase()} = ANY(${packages.tags})`
          )!
        );
      }

      const whereClause = and(...conditions);

      // Build ORDER BY
      let orderBy;
      switch (sort) {
        case 'created':
          orderBy = desc(packages.createdAt);
          break;
        case 'updated':
          orderBy = desc(packages.updatedAt);
          break;
        case 'quality':
          orderBy = desc(packages.qualityScore);
          break;
        case 'rating':
          orderBy = desc(packages.ratingAverage);
          break;
        case 'downloads':
        default:
          orderBy = desc(packages.totalDownloads);
          break;
      }

      // Get total count
      const countResult = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(packages)
        .where(whereClause);

      const total = countResult[0]?.count || 0;

      // Get packages
      const results = await db
        .select()
        .from(packages)
        .where(whereClause)
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset);

      return {
        packages: results,
        total,
      };
    } catch (error) {
      console.error('Failed to search packages', {
        params,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Get trending packages
   *
   * Returns packages sorted by trending score.
   * Used by the trending endpoint.
   */
  async getTrending(limit: number = 20): Promise<Package[]> {
    try {
      const results = await db
        .select()
        .from(packages)
        .where(
          and(
            eq(packages.visibility, 'public'),
            sql`${packages.downloadsLast7Days} > 0`
          )
        )
        .orderBy(desc(packages.trendingScore), desc(packages.downloadsLast7Days))
        .limit(limit);

      return results;
    } catch (error) {
      console.error('Failed to get trending packages', {
        limit,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Get popular packages
   *
   * Returns packages sorted by total downloads.
   * Optionally filter by format and subtype.
   */
  async getPopular(params: {
    limit?: number;
    format?: string;
    subtype?: string;
  }): Promise<Package[]> {
    try {
      const { limit = 20, format, subtype } = params;

      const conditions: SQL[] = [eq(packages.visibility, 'public')];

      if (format) {
        conditions.push(eq(packages.format, format));
      }

      if (subtype) {
        conditions.push(eq(packages.subtype, subtype));
      }

      const results = await db
        .select()
        .from(packages)
        .where(and(...conditions))
        .orderBy(desc(packages.totalDownloads), desc(packages.installCount))
        .limit(limit);

      return results;
    } catch (error) {
      console.error('Failed to get popular packages', {
        params,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Get packages by author
   *
   * Returns all packages created by a specific author.
   * Used in author analytics and profile pages.
   */
  async getByAuthor(authorId: string, includePrivate: boolean = false): Promise<Package[]> {
    try {
      const conditions: SQL[] = [eq(packages.authorId, authorId)];

      if (!includePrivate) {
        conditions.push(eq(packages.visibility, 'public'));
      }

      const results = await db
        .select()
        .from(packages)
        .where(and(...conditions))
        .orderBy(desc(packages.createdAt));

      return results;
    } catch (error) {
      console.error('Failed to get packages by author', {
        authorId,
        includePrivate,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Get packages by organization
   *
   * Returns all packages owned by a specific organization.
   */
  async getByOrganization(orgId: string, includePrivate: boolean = false): Promise<Package[]> {
    try {
      const conditions: SQL[] = [eq(packages.orgId, orgId)];

      if (!includePrivate) {
        conditions.push(eq(packages.visibility, 'public'));
      }

      const results = await db
        .select()
        .from(packages)
        .where(and(...conditions))
        .orderBy(desc(packages.createdAt));

      return results;
    } catch (error) {
      console.error('Failed to get packages by organization', {
        orgId,
        includePrivate,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Update package verification status
   *
   * Used by admin endpoints to verify packages.
   */
  async updateVerificationStatus(id: string, verified: boolean): Promise<void> {
    try {
      await db
        .update(packages)
        .set({
          verified,
          updatedAt: new Date(),
        })
        .where(eq(packages.id, id));
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
   * Update package featured status
   *
   * Used by admin endpoints to feature packages.
   */
  async updateFeaturedStatus(id: string, featured: boolean): Promise<void> {
    try {
      await db
        .update(packages)
        .set({
          featured,
          updatedAt: new Date(),
        })
        .where(eq(packages.id, id));
    } catch (error) {
      console.error('Failed to update featured status', {
        id,
        featured,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Update package quality score
   *
   * Used by quality scoring jobs.
   */
  async updateQualityScore(id: string, score: number, explanation?: string): Promise<void> {
    try {
      await db
        .update(packages)
        .set({
          qualityScore: score.toFixed(2),
          qualityExplanation: explanation || null,
          scoreUpdatedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(packages.id, id));
    } catch (error) {
      console.error('Failed to update quality score', {
        id,
        score,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Mark package as deprecated
   *
   * Used when a package is deprecated in favor of another.
   */
  async deprecate(id: string, reason?: string): Promise<void> {
    try {
      await db
        .update(packages)
        .set({
          deprecated: true,
          deprecatedReason: reason || null,
          updatedAt: new Date(),
        })
        .where(eq(packages.id, id));
    } catch (error) {
      console.error('Failed to deprecate package', {
        id,
        reason,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Update package visibility
   *
   * Used to change package visibility (public/private/unlisted).
   */
  async updateVisibility(id: string, visibility: string): Promise<void> {
    try {
      await db
        .update(packages)
        .set({
          visibility,
          updatedAt: new Date(),
        })
        .where(eq(packages.id, id));
    } catch (error) {
      console.error('Failed to update package visibility', {
        id,
        visibility,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Get package count by author
   *
   * Returns the number of packages authored by a user.
   * Used in user analytics.
   */
  async countByAuthor(authorId: string): Promise<number> {
    try {
      const result = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(packages)
        .where(eq(packages.authorId, authorId));

      return result[0]?.count || 0;
    } catch (error) {
      console.error('Failed to count packages by author', {
        authorId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Get package count by organization
   *
   * Returns the number of packages owned by an organization.
   */
  async countByOrganization(orgId: string): Promise<number> {
    try {
      const result = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(packages)
        .where(eq(packages.orgId, orgId));

      return result[0]?.count || 0;
    } catch (error) {
      console.error('Failed to count packages by organization', {
        orgId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Get latest packages
   *
   * Returns recently created packages.
   * Used for "new packages" listings.
   */
  async getLatest(limit: number = 20): Promise<Package[]> {
    try {
      const results = await db
        .select()
        .from(packages)
        .where(eq(packages.visibility, 'public'))
        .orderBy(desc(packages.createdAt))
        .limit(limit);

      return results;
    } catch (error) {
      console.error('Failed to get latest packages', {
        limit,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Get recently updated packages
   *
   * Returns packages sorted by last publish date.
   */
  async getRecentlyUpdated(limit: number = 20): Promise<Package[]> {
    try {
      const results = await db
        .select()
        .from(packages)
        .where(
          and(
            eq(packages.visibility, 'public'),
            sql`${packages.lastPublishedAt} IS NOT NULL`
          )
        )
        .orderBy(desc(packages.lastPublishedAt))
        .limit(limit);

      return results;
    } catch (error) {
      console.error('Failed to get recently updated packages', {
        limit,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}

// Export singleton instance
export const packageRepository = new PackageRepository();
