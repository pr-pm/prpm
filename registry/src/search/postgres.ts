/**
 * PostgreSQL Full-Text Search implementation
 */

import { FastifyInstance } from 'fastify';
import { SearchProvider, SearchFilters, SearchResult, Package } from '../types.js';
import { query, queryOne } from '../db/index.js';

export function postgresSearch(server: FastifyInstance): SearchProvider {
  return {
    async search(searchQuery: string, filters: SearchFilters): Promise<SearchResult> {
      const {
        type,
        tags,
        category,
        verified,
        featured,
        sort = 'downloads',
        limit = 20,
        offset = 0,
      } = filters;

      // Build WHERE clause
      const conditions: string[] = [
        "visibility = 'public'",
        "to_tsvector('english', display_name || ' ' || COALESCE(description, '')) @@ plainto_tsquery('english', $1)",
      ];
      const params: any[] = [searchQuery];
      let paramIndex = 2;

      if (type) {
        conditions.push(`type = $${paramIndex++}`);
        params.push(type);
      }

      if (category) {
        conditions.push(`category = $${paramIndex++}`);
        params.push(category);
      }

      if (tags && tags.length > 0) {
        conditions.push(`tags && $${paramIndex++}`);
        params.push(tags);
      }

      if (verified !== undefined) {
        conditions.push(`verified = $${paramIndex++}`);
        params.push(verified);
      }

      if (featured !== undefined) {
        conditions.push(`featured = $${paramIndex++}`);
        params.push(featured);
      }

      const whereClause = conditions.join(' AND ');

      // Build ORDER BY clause
      let orderBy: string;
      switch (sort) {
        case 'created':
          orderBy = 'created_at DESC';
          break;
        case 'updated':
          orderBy = 'updated_at DESC';
          break;
        case 'quality':
          orderBy = 'quality_score DESC NULLS LAST';
          break;
        case 'rating':
          orderBy = 'rating_average DESC NULLS LAST';
          break;
        case 'downloads':
        default:
          orderBy = 'rank DESC, total_downloads DESC';
          break;
      }

      // Search with ranking
      const result = await query<Package & { rank: number }>(
        server,
        `SELECT *,
           ts_rank(to_tsvector('english', display_name || ' ' || COALESCE(description, '')),
                   plainto_tsquery('english', $1)) as rank
         FROM packages
         WHERE ${whereClause}
         ORDER BY ${orderBy}
         LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
        [...params, limit, offset]
      );

      // Get total count
      const countResult = await queryOne<{ count: string }>(
        server,
        `SELECT COUNT(*) as count FROM packages WHERE ${whereClause}`,
        params
      );
      const total = parseInt(countResult?.count || '0', 10);

      return {
        packages: result.rows.map(({ rank, ...pkg }) => pkg),
        total,
        offset,
        limit,
      };
    },

    async indexPackage(packageId: string): Promise<void> {
      // PostgreSQL FTS indexes are automatically maintained
      // No action needed
      server.log.debug(`Package ${packageId} indexed (PostgreSQL FTS auto-maintains)`);
    },

    async deletePackage(packageId: string): Promise<void> {
      // PostgreSQL FTS indexes are automatically maintained
      // No action needed
      server.log.debug(`Package ${packageId} removed from index (PostgreSQL FTS auto-maintains)`);
    },

    async reindexAll(): Promise<void> {
      // For PostgreSQL, we can refresh the GIN index
      await query(server, 'REINDEX INDEX CONCURRENTLY idx_packages_search');
      server.log.info('Reindexed all packages (PostgreSQL FTS)');
    },
  };
}
