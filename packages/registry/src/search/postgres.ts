/**
 * PostgreSQL Full-Text Search implementation
 */

import { FastifyInstance } from 'fastify';
import { SearchFilters, SearchResult, Package } from '../types.js';
import { SearchProvider } from './index.js';
import { query, queryOne } from '../db/index.js';

// Columns to select for list/search results (excludes full_content to reduce payload size)
const LIST_COLUMNS = `
  p.id, p.name, p.display_name, p.description, p.author_id, p.org_id,
  p.format, p.subtype, p.tags, p.keywords, p.category,
  p.visibility, p.featured, p.verified, p.official,
  p.total_downloads, p.weekly_downloads, p.monthly_downloads, p.version_count,
  p.rating_average, p.rating_count, p.quality_score,
  p.install_count, p.view_count,
  p.license, p.license_text, p.license_url,
  p.snippet, p.repository_url, p.homepage_url, p.documentation_url,
  p.created_at, p.updated_at, p.last_published_at,
  p.deprecated, p.deprecated_reason
`.trim();

async function getCategoryAndDescendantIds(server: FastifyInstance, slug: string): Promise<string[]> {
  const result = await query<{ id: string }>(
    server,
    `
      WITH RECURSIVE category_tree AS (
        SELECT id FROM categories WHERE slug = $1
        UNION ALL
        SELECT c.id
        FROM categories c
        JOIN category_tree ct ON c.parent_id = ct.id
      )
      SELECT id FROM category_tree
    `,
    [slug]
  );

  return result.rows.map(row => row.id);
}

export function postgresSearch(server: FastifyInstance): SearchProvider {
  return {
    async search(searchQuery: string, filters: SearchFilters): Promise<SearchResult> {
      const {
        format,
        subtype,
        tags,
        category,
        author,
        language,
        framework,
        verified,
        featured,
        sort = 'downloads',
        limit = 20,
        offset = 0,
      } = filters;

      // Build WHERE clause
      const conditions: string[] = ["p.visibility = 'public'"];
      const params: unknown[] = [];
      let paramIndex = 1;

      // Only add text search if query is provided
      if (searchQuery && searchQuery.trim()) {
        // Use optimized search_vector column with weighted fields (name, description, tags, keywords)
        conditions.push(`(
          p.search_vector @@ websearch_to_tsquery('english', $${paramIndex}) OR
          p.name ILIKE $${paramIndex + 1} OR
          p.name % $${paramIndex} OR
          p.description % $${paramIndex} OR
          $${paramIndex} = ANY(p.tags) OR
          EXISTS (
            SELECT 1 FROM unnest(p.tags) tag WHERE tag % $${paramIndex}
          )
        )`);
        params.push(searchQuery, `%${searchQuery}%`);
        paramIndex += 2;
      }

      if (format) {
        if (Array.isArray(format)) {
          // Handle array of formats with IN clause
          conditions.push(`p.format = ANY($${paramIndex++})`);
          params.push(format);
        } else {
          // Handle single format
          conditions.push(`p.format = $${paramIndex++}`);
          params.push(format);
        }
      }

      if (subtype) {
        if (Array.isArray(subtype)) {
          // Handle array of subtypes with IN clause
          conditions.push(`p.subtype = ANY($${paramIndex++})`);
          params.push(subtype);
        } else {
          // Handle single subtype
          conditions.push(`p.subtype = $${paramIndex++}`);
          params.push(subtype);
        }
      }

      if (category) {
        const categoryIds = await getCategoryAndDescendantIds(server, category);
        if (categoryIds.length === 0) {
          return {
            packages: [],
            total: 0,
            offset,
            limit,
          };
        }

        conditions.push(`EXISTS (
          SELECT 1 FROM package_categories pc
          WHERE pc.package_id = p.id
            AND pc.category_id = ANY($${paramIndex++})
        )`);
        params.push(categoryIds);
      }

      if (author) {
        // Search by both author username and organization name (case-insensitive)
        conditions.push(`(
          p.author_id = (SELECT id FROM users WHERE LOWER(username) = LOWER($${paramIndex})) OR
          p.org_id = (SELECT id FROM organizations WHERE LOWER(name) = LOWER($${paramIndex}))
        )`);
        params.push(author);
        paramIndex++;
      }

      if (tags && tags.length > 0) {
        conditions.push(`p.tags && $${paramIndex++}`);
        params.push(tags);
      }

      if (language) {
        conditions.push(`LOWER(p.language) = LOWER($${paramIndex++})`);
        params.push(language);
      }

      if (framework) {
        conditions.push(`LOWER(p.framework) = LOWER($${paramIndex++})`);
        params.push(framework);
      }

      if (verified !== undefined) {
        conditions.push(`p.verified = $${paramIndex++}`);
        params.push(verified);
      }

      if (featured !== undefined) {
        conditions.push(`p.featured = $${paramIndex++}`);
        params.push(featured);
      }

      const whereClause = conditions.join(' AND ');

      // Build ORDER BY clause
      let orderBy: string;
      const hasSearchQuery = searchQuery && searchQuery.trim();

      switch (sort) {
        case 'relevance':
          // Relevance: only works with search queries
          if (hasSearchQuery) {
            orderBy = 'relevance DESC, p.quality_score DESC NULLS LAST, p.total_downloads DESC';
          } else {
            // No query = fallback to quality + downloads
            orderBy = 'p.quality_score DESC NULLS LAST, p.total_downloads DESC';
          }
          break;
        case 'created':
          orderBy = 'p.created_at DESC';
          break;
        case 'updated':
          orderBy = 'p.updated_at DESC';
          break;
        case 'quality':
          orderBy = 'p.quality_score DESC NULLS LAST, p.total_downloads DESC';
          break;
        case 'rating':
          orderBy = 'p.rating_average DESC NULLS LAST, p.quality_score DESC NULLS LAST';
          break;
        case 'downloads':
          orderBy = 'p.total_downloads DESC, p.quality_score DESC NULLS LAST';
          break;
        default:
          // Default: when searching, prioritize relevance using trigram similarity + full-text search
          if (hasSearchQuery) {
            orderBy = 'relevance DESC, p.quality_score DESC NULLS LAST, p.total_downloads DESC';
          } else {
            orderBy = 'p.quality_score DESC NULLS LAST, p.total_downloads DESC';
          }
          break;
      }

      // Search with combined ranking (trigram similarity + optimized full-text search with field weights)
      const rankColumn = hasSearchQuery
        ? `(
            -- Trigram similarity for fuzzy matching (boosted for name matches)
            GREATEST(
              similarity(p.name, $1) * 10,  -- 10x weight for name matches
              similarity(COALESCE(p.description, ''), $1)
            ) +
            -- Full-text search rank using weighted search_vector (A=name, B=description, C=tags, D=keywords)
            ts_rank_cd(p.search_vector, websearch_to_tsquery('english', $1), 32) * 5 +
            -- Exact tag match bonus
            (CASE WHEN $1 = ANY(p.tags) THEN 5 ELSE 0 END) +
            -- Quality score multiplier (0-5 scale)
            COALESCE(p.quality_score, 0) * 0.5 +
            -- Featured/Verified boost
            (CASE WHEN p.featured THEN 2 ELSE 0 END) +
            (CASE WHEN p.verified THEN 1 ELSE 0 END)
          ) as relevance`
        : '0 as relevance';

      const result = await query<Package & { relevance: number }>(
        server,
        `/*+ IndexScan(p idx_packages_search_vector) */
         SELECT ${LIST_COLUMNS}, u.username as author_username, o.name as org_name, ${rankColumn}
         FROM packages p
         LEFT JOIN users u ON p.author_id = u.id
         LEFT JOIN organizations o ON p.org_id = o.id
         WHERE ${whereClause}
         ORDER BY ${orderBy}
         LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
        [...params, limit, offset]
      );

      // Get total count
      const countResult = await queryOne<{ count: string }>(
        server,
        `SELECT COUNT(*) as count FROM packages p WHERE ${whereClause}`,
        params
      );
      const total = parseInt(countResult?.count || '0', 10);

      // If search query exists but no results, suggest corrections (optimized)
      let didYouMean: string | undefined;
      if (searchQuery && searchQuery.trim() && total === 0 && !filters.format && !filters.subtype) {
        try {
          // Find similar package names using optimized trigram + prefix index
          const suggestionResult = await queryOne<{ suggestion: string; sim: number }>(
            server,
            `SELECT name as suggestion, similarity(name, $1) as sim
             FROM packages
             WHERE visibility = 'public'
               AND (name % $1 OR name ILIKE $2)
             ORDER BY sim DESC, total_downloads DESC
             LIMIT 1`,
            [searchQuery, `%${searchQuery}%`]
          );

          if (suggestionResult && suggestionResult.sim > 0.3) {
            didYouMean = suggestionResult.suggestion;
          }
        } catch (error) {
          server.log.warn({ error, query: searchQuery }, 'Failed to generate did-you-mean suggestion');
        }
      }

      return {
        packages: result.rows.map(({ relevance, ...pkg }) => pkg),
        total,
        offset,
        limit,
        didYouMean,
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
      // Refresh the search_vector GIN index and materialized view
      await query(server, 'REINDEX INDEX CONCURRENTLY idx_packages_search_vector');
      await query(server, 'REFRESH MATERIALIZED VIEW CONCURRENTLY package_search_rankings');
      server.log.info('Reindexed all packages and refreshed search rankings (PostgreSQL FTS)');
    },
  };
}
