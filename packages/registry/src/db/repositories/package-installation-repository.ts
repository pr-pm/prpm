import { eq, sql, and, or, desc, inArray, SQL } from 'drizzle-orm';
import { db } from '../db.js';
import {
  packageInstallations,
  packageCoInstallations,
  type PackageInstallation,
  type NewPackageInstallation,
  type PackageCoInstallation,
  type NewPackageCoInstallation,
} from '../schema/package-installations.js';
import { packages } from '../schema/packages.js';

/**
 * Package Installation Repository
 *
 * Provides type-safe database operations for package installations
 * and co-installation tracking.
 *
 * Supports:
 * - Anonymous installation tracking via session IDs
 * - User installation tracking for logged-in users
 * - Co-installation detection for recommendations
 * - Installation batch grouping
 */
export class PackageInstallationRepository {
  /**
   * Track a package installation
   *
   * Records when a package is installed, either by a logged-in user
   * or anonymously via session ID. Used for analytics and co-install detection.
   */
  async trackInstallation(data: NewPackageInstallation): Promise<PackageInstallation> {
    try {
      const [installation] = await db
        .insert(packageInstallations)
        .values(data)
        .returning();

      return installation;
    } catch (error) {
      console.error('Failed to track installation', {
        packageId: data.packageId,
        userId: data.userId,
        sessionId: data.sessionId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Track multiple installations in a batch
   *
   * Used when installing multiple packages at once (e.g., from a collection).
   * All installations get the same installBatchId for co-install analysis.
   */
  async trackBatchInstallation(
    installations: NewPackageInstallation[],
    batchId: string
  ): Promise<PackageInstallation[]> {
    try {
      const installationsWithBatch = installations.map((install) => ({
        ...install,
        installBatchId: batchId,
      }));

      const results = await db
        .insert(packageInstallations)
        .values(installationsWithBatch)
        .returning();

      return results;
    } catch (error) {
      console.error('Failed to track batch installation', {
        batchId,
        count: installations.length,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Get installation history for a user
   *
   * Returns all packages a user has installed, ordered by most recent.
   * Used for user dashboards and personalized recommendations.
   */
  async getUserInstallations(userId: string, limit: number = 100): Promise<PackageInstallation[]> {
    try {
      const results = await db
        .select()
        .from(packageInstallations)
        .where(eq(packageInstallations.userId, userId))
        .orderBy(desc(packageInstallations.installedAt))
        .limit(limit);

      return results;
    } catch (error) {
      console.error('Failed to get user installations', {
        userId,
        limit,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Get installation history for a session
   *
   * Returns all packages installed by an anonymous session.
   * Used for cross-device tracking and co-install analysis.
   */
  async getSessionInstallations(sessionId: string, limit: number = 100): Promise<PackageInstallation[]> {
    try {
      const results = await db
        .select()
        .from(packageInstallations)
        .where(eq(packageInstallations.sessionId, sessionId))
        .orderBy(desc(packageInstallations.installedAt))
        .limit(limit);

      return results;
    } catch (error) {
      console.error('Failed to get session installations', {
        sessionId,
        limit,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Get installation count for a package
   *
   * Returns total number of times a package has been installed.
   * Used for analytics and popularity metrics.
   */
  async getPackageInstallCount(packageId: string): Promise<number> {
    try {
      const result = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(packageInstallations)
        .where(eq(packageInstallations.packageId, packageId));

      return result[0]?.count || 0;
    } catch (error) {
      console.error('Failed to get package install count', {
        packageId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Get recent installations for a package
   *
   * Returns recent installation records for analytics.
   * Optionally filter by time period.
   */
  async getRecentInstallations(
    packageId: string,
    since?: Date,
    limit: number = 100
  ): Promise<PackageInstallation[]> {
    try {
      const conditions: SQL[] = [eq(packageInstallations.packageId, packageId)];

      if (since) {
        conditions.push(sql`${packageInstallations.installedAt} >= ${since}`);
      }

      const results = await db
        .select()
        .from(packageInstallations)
        .where(and(...conditions))
        .orderBy(desc(packageInstallations.installedAt))
        .limit(limit);

      return results;
    } catch (error) {
      console.error('Failed to get recent installations', {
        packageId,
        since,
        limit,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Get co-installations for a package
   *
   * Returns packages that are frequently installed together with the given package.
   * Used for "users also installed" recommendations.
   * Results are ordered by confidence score (higher = stronger relationship).
   */
  async getCoInstallations(packageId: string, limit: number = 10): Promise<
    Array<{
      packageId: string;
      packageName: string;
      coInstallCount: number;
      confidenceScore: string;
      lastCoInstalledAt: Date;
    }>
  > {
    try {
      // Find co-installations where packageId is either packageA or packageB
      const results = await db
        .select({
          packageAId: packageCoInstallations.packageAId,
          packageBId: packageCoInstallations.packageBId,
          coInstallCount: packageCoInstallations.coInstallCount,
          confidenceScore: packageCoInstallations.confidenceScore,
          lastCoInstalledAt: packageCoInstallations.lastCoInstalledAt,
          packageAName: sql<string>`pkg_a.name`,
          packageBName: sql<string>`pkg_b.name`,
        })
        .from(packageCoInstallations)
        .leftJoin(
          sql`packages AS pkg_a`,
          eq(packageCoInstallations.packageAId, sql`pkg_a.id`)
        )
        .leftJoin(
          sql`packages AS pkg_b`,
          eq(packageCoInstallations.packageBId, sql`pkg_b.id`)
        )
        .where(
          or(
            eq(packageCoInstallations.packageAId, packageId),
            eq(packageCoInstallations.packageBId, packageId)
          )!
        )
        .orderBy(desc(packageCoInstallations.confidenceScore))
        .limit(limit);

      // Map results to return the other package (not the input packageId)
      return results.map((row) => ({
        packageId: row.packageAId === packageId ? row.packageBId : row.packageAId,
        packageName: row.packageAId === packageId ? row.packageBName : row.packageAName,
        coInstallCount: row.coInstallCount,
        confidenceScore: row.confidenceScore,
        lastCoInstalledAt: row.lastCoInstalledAt,
      }));
    } catch (error) {
      console.error('Failed to get co-installations', {
        packageId,
        limit,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Record co-installation between two packages
   *
   * Creates or updates a co-installation record when two packages
   * are installed together. Maintains the constraint that packageA < packageB
   * to avoid duplicate entries.
   */
  async recordCoInstallation(packageAId: string, packageBId: string): Promise<void> {
    try {
      // Ensure packageA < packageB to satisfy the database constraint
      const [smaller, larger] =
        packageAId < packageBId ? [packageAId, packageBId] : [packageBId, packageAId];

      // Use upsert to increment count if record exists
      await db
        .insert(packageCoInstallations)
        .values({
          packageAId: smaller,
          packageBId: larger,
          coInstallCount: 1,
          confidenceScore: '0',
          lastCoInstalledAt: new Date(),
          firstCoInstalledAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [packageCoInstallations.packageAId, packageCoInstallations.packageBId],
          set: {
            coInstallCount: sql`${packageCoInstallations.coInstallCount} + 1`,
            lastCoInstalledAt: new Date(),
          },
        });
    } catch (error) {
      console.error('Failed to record co-installation', {
        packageAId,
        packageBId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Record co-installations from a batch
   *
   * Analyzes an installation batch and records all pairwise co-installations.
   * Used after batch installations to update recommendation data.
   */
  async recordBatchCoInstallations(packageIds: string[]): Promise<void> {
    try {
      // Generate all pairs of packages
      const pairs: Array<[string, string]> = [];
      for (let i = 0; i < packageIds.length; i++) {
        for (let j = i + 1; j < packageIds.length; j++) {
          pairs.push([packageIds[i], packageIds[j]]);
        }
      }

      // Record each pair
      for (const [pkgA, pkgB] of pairs) {
        await this.recordCoInstallation(pkgA, pkgB);
      }
    } catch (error) {
      console.error('Failed to record batch co-installations', {
        packageCount: packageIds.length,
        pairCount: (packageIds.length * (packageIds.length - 1)) / 2,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Update confidence scores for co-installations
   *
   * Recalculates confidence scores based on:
   * - Number of co-installs
   * - Time proximity of installations
   * - User/session diversity
   *
   * Called by analytics jobs periodically.
   */
  async updateConfidenceScores(packageId?: string): Promise<void> {
    try {
      // If packageId provided, update only co-installations involving that package
      // Otherwise update all co-installations
      const whereClause = packageId
        ? or(
            eq(packageCoInstallations.packageAId, packageId),
            eq(packageCoInstallations.packageBId, packageId)
          )
        : undefined;

      // Simplified confidence calculation:
      // confidence = min(100, co_install_count * 10)
      // More sophisticated calculation would consider recency, user diversity, etc.
      await db
        .update(packageCoInstallations)
        .set({
          confidenceScore: sql`LEAST(100, ${packageCoInstallations.coInstallCount} * 10)::decimal(5,2)`,
        })
        .where(whereClause);
    } catch (error) {
      console.error('Failed to update confidence scores', {
        packageId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Get installation statistics for analytics
   *
   * Returns aggregated stats about installations over time periods.
   */
  async getInstallationStats(packageId: string): Promise<{
    total: number;
    last24h: number;
    last7days: number;
    last30days: number;
  }> {
    try {
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const [totalResult, last24hResult, last7daysResult, last30daysResult] = await Promise.all([
        db
          .select({ count: sql<number>`count(*)::int` })
          .from(packageInstallations)
          .where(eq(packageInstallations.packageId, packageId)),
        db
          .select({ count: sql<number>`count(*)::int` })
          .from(packageInstallations)
          .where(
            and(
              eq(packageInstallations.packageId, packageId),
              sql`${packageInstallations.installedAt} >= ${oneDayAgo}`
            )
          ),
        db
          .select({ count: sql<number>`count(*)::int` })
          .from(packageInstallations)
          .where(
            and(
              eq(packageInstallations.packageId, packageId),
              sql`${packageInstallations.installedAt} >= ${sevenDaysAgo}`
            )
          ),
        db
          .select({ count: sql<number>`count(*)::int` })
          .from(packageInstallations)
          .where(
            and(
              eq(packageInstallations.packageId, packageId),
              sql`${packageInstallations.installedAt} >= ${thirtyDaysAgo}`
            )
          ),
      ]);

      return {
        total: totalResult[0]?.count || 0,
        last24h: last24hResult[0]?.count || 0,
        last7days: last7daysResult[0]?.count || 0,
        last30days: last30daysResult[0]?.count || 0,
      };
    } catch (error) {
      console.error('Failed to get installation stats', {
        packageId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Get most installed packages in a time period
   *
   * Returns packages sorted by installation count.
   * Used for trending and popularity analytics.
   */
  async getMostInstalled(
    since?: Date,
    limit: number = 20
  ): Promise<Array<{ packageId: string; packageName: string; installCount: number }>> {
    try {
      const conditions: SQL[] = [];

      if (since) {
        conditions.push(sql`${packageInstallations.installedAt} >= ${since}`);
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const results = await db
        .select({
          packageId: packageInstallations.packageId,
          packageName: packages.name,
          installCount: sql<number>`count(*)::int`,
        })
        .from(packageInstallations)
        .leftJoin(packages, eq(packageInstallations.packageId, packages.id))
        .where(whereClause)
        .groupBy(packageInstallations.packageId, packages.name)
        .orderBy(desc(sql`count(*)`))
        .limit(limit);

      return results.map((row) => ({
        packageId: row.packageId!,
        packageName: row.packageName!,
        installCount: row.installCount,
      }));
    } catch (error) {
      console.error('Failed to get most installed packages', {
        since,
        limit,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}

// Export singleton instance
export const packageInstallationRepository = new PackageInstallationRepository();
