/**
 * Taxonomy Service
 * Handles category and use case browsing
 */

import type { FastifyInstance } from 'fastify';
import type {
  Category,
  CategoryWithChildren,
  CategoryListResponse,
  UseCase,
  UseCaseWithPackages,
  UseCaseListResponse
} from '@pr-pm/types';

export class TaxonomyService {
  private server: FastifyInstance;

  constructor(server: FastifyInstance) {
    this.server = server;
  }

  /**
   * Get all categories as a hierarchical tree
   */
  async getCategoryTree(includePackageCounts = false, topN?: number): Promise<CategoryListResponse> {
    // Query from materialized view for fast counts
    const categoriesResult = await this.server.pg.query<any>(`
      SELECT
        id, name, slug, parent_id, level,
        description, icon, display_order,
        package_count
      FROM category_aggregation
      ${topN ? 'WHERE level = 1' : ''}
      ORDER BY
        CASE WHEN level = 1 THEN package_count ELSE 0 END DESC,
        level ASC,
        display_order ASC,
        package_count DESC,
        name ASC
      ${topN ? 'LIMIT $1' : ''}
    `, topN ? [topN] : []);

    const categories = categoriesResult.rows;

    // Package counts are already included from materialized view
    const packageCounts: Record<string, number> = {};
    if (includePackageCounts) {
      categories.forEach((cat: any) => {
        packageCounts[cat.id] = cat.package_count || 0;
      });
    }

    // Build hierarchy
    const categoryMap = new Map<string, CategoryWithChildren>();
    const rootCategories: CategoryWithChildren[] = [];

    // First pass: create all category objects
    categories.forEach(cat => {
      const categoryWithChildren: CategoryWithChildren = {
        ...cat,
        children: [],
        package_count: packageCounts[cat.id] || 0
      };
      categoryMap.set(cat.id, categoryWithChildren);
    });

    // Second pass: build parent-child relationships
    categories.forEach(cat => {
      const categoryWithChildren = categoryMap.get(cat.id)!;

      if (cat.parent_id) {
        const parent = categoryMap.get(cat.parent_id);
        if (parent) {
          parent.children!.push(categoryWithChildren);
        }
      } else {
        rootCategories.push(categoryWithChildren);
      }
    });

    // Calculate total unique packages
    const totalPackagesResult = await this.server.pg.query(`
      SELECT COUNT(DISTINCT package_id) as total
      FROM package_categories
    `);

    return {
      categories: rootCategories,
      total_categories: categories.length,
      total_packages: parseInt(totalPackagesResult.rows[0]?.total || '0')
    };
  }

  /**
   * Get a single category by slug with its children
   */
  async getCategoryBySlug(slug: string, includePackageCounts = false): Promise<CategoryWithChildren | null> {
    const categoryResult = await this.server.pg.query<Category>(`
      SELECT
        id, name, slug, parent_id, level,
        description, icon, display_order,
        created_at, updated_at
      FROM categories
      WHERE slug = $1
    `, [slug]);

    if (categoryResult.rows.length === 0) {
      return null;
    }

    const category = categoryResult.rows[0];

    // Get children
    const childrenResult = await this.server.pg.query<Category>(`
      SELECT
        id, name, slug, parent_id, level,
        description, icon, display_order,
        created_at, updated_at
      FROM categories
      WHERE parent_id = $1
      ORDER BY display_order ASC, name ASC
    `, [category.id]);

    const children: CategoryWithChildren[] = childrenResult.rows.map(child => ({
      ...child,
      children: [],
      package_count: 0
    }));

    // Get package counts if requested
    if (includePackageCounts) {
      const categoryIds = [category.id, ...children.map(c => c.id)];
      const countsResult = await this.server.pg.query(`
        SELECT category_id, COUNT(DISTINCT package_id) as count
        FROM package_categories
        WHERE category_id = ANY($1::uuid[])
        GROUP BY category_id
      `, [categoryIds]);

      const counts: Record<string, number> = {};
      countsResult.rows.forEach(row => {
        counts[row.category_id] = parseInt(row.count);
      });

      children.forEach(child => {
        child.package_count = counts[child.id] || 0;
      });

      return {
        ...category,
        children,
        package_count: counts[category.id] || 0
      };
    }

    return {
      ...category,
      children
    };
  }

  /**
   * Get packages for a specific category
   */
  async getPackagesByCategory(
    categorySlug: string,
    options: {
      limit?: number;
      offset?: number;
      includeChildren?: boolean;
    } = {}
  ) {
    const { limit = 20, offset = 0, includeChildren = true } = options;

    // Find category
    const categoryResult = await this.server.pg.query(`
      SELECT id FROM categories WHERE slug = $1
    `, [categorySlug]);

    if (categoryResult.rows.length === 0) {
      return { packages: [], total: 0, category_slug: categorySlug };
    }

    const categoryId = categoryResult.rows[0].id;
    let categoryIds = [categoryId];

    // Include children if requested
    if (includeChildren) {
      const childrenResult = await this.server.pg.query(`
        SELECT id FROM categories WHERE parent_id = $1
        UNION ALL
        SELECT id FROM categories WHERE parent_id IN (
          SELECT id FROM categories WHERE parent_id = $1
        )
      `, [categoryId]);

      categoryIds = [...categoryIds, ...childrenResult.rows.map(r => r.id)];
    }

    // Get packages
    const packagesResult = await this.server.pg.query(`
      SELECT DISTINCT
        p.id, p.name, p.description, p.version,
        p.format, p.subtype, p.author_id,
        u.username as author_username,
        p.total_downloads, p.quality_score,
        p.created_at, p.updated_at
      FROM packages p
      JOIN package_categories pc ON p.id = pc.package_id
      LEFT JOIN users u ON p.author_id = u.id
      WHERE pc.category_id = ANY($1::uuid[])
        AND p.visibility = 'public'
        AND p.deprecated = false
      ORDER BY p.total_downloads DESC, p.created_at DESC
      LIMIT $2 OFFSET $3
    `, [categoryIds, limit, offset]);

    // Get total count
    const countResult = await this.server.pg.query(`
      SELECT COUNT(DISTINCT p.id) as total
      FROM packages p
      JOIN package_categories pc ON p.id = pc.package_id
      WHERE pc.category_id = ANY($1::uuid[])
        AND p.visibility = 'public'
        AND p.deprecated = false
    `, [categoryIds]);

    return {
      packages: packagesResult.rows,
      total: parseInt(countResult.rows[0]?.total || '0'),
      category_slug: categorySlug
    };
  }

  /**
   * Get all use cases with package counts
   */
  async getUseCases(includePackageCounts = false): Promise<UseCaseListResponse> {
    const useCasesResult = await this.server.pg.query<UseCase>(`
      SELECT
        id, name, slug, description, icon,
        example_query, display_order,
        created_at, updated_at
      FROM use_cases
      ORDER BY display_order ASC, name ASC
    `);

    const useCases = useCasesResult.rows;

    if (includePackageCounts) {
      const countsResult = await this.server.pg.query(`
        SELECT use_case_id, COUNT(DISTINCT package_id) as count
        FROM package_use_cases
        GROUP BY use_case_id
      `);

      const counts: Record<string, number> = {};
      countsResult.rows.forEach(row => {
        counts[row.use_case_id] = parseInt(row.count);
      });

      const useCasesWithCounts: UseCaseWithPackages[] = useCases.map(uc => ({
        ...uc,
        package_count: counts[uc.id] || 0
      }));

      return {
        use_cases: useCasesWithCounts,
        total: useCases.length
      };
    }

    return {
      use_cases: useCases,
      total: useCases.length
    };
  }

  /**
   * Backfill package_categories from legacy fields
   * Returns number of packages processed
   */
  async backfillPackageCategories(limit: number = 1000): Promise<number> {
    const startTime = Date.now();
    let processed = 0;

    const result = await this.server.pg.query<{
      package_id: string;
      category_slug: string | null;
      tags: string[] | null;
    }>(`
      SELECT
        p.id as package_id,
        p.category as category_slug,
        p.tags
      FROM packages p
      WHERE p.visibility = 'public'
        AND p.deprecated = false
        AND (
          p.category IS NOT NULL OR
          (p.tags IS NOT NULL AND array_length(p.tags, 1) > 0)
        )
        AND NOT EXISTS (
          SELECT 1 FROM package_categories pc WHERE pc.package_id = p.id
        )
      LIMIT $1
    `, [limit]);

    if (result.rows.length === 0) {
      this.server.log.info('Taxonomy backfill: no packages pending');
      return 0;
    }

    const categoryMapResult = await this.server.pg.query<{ slug: string; id: string }>(
      'SELECT slug, id FROM categories'
    );
    const slugToId = new Map(categoryMapResult.rows.map(row => [row.slug, row.id]));

    for (const pkg of result.rows) {
      const categoryIds: Set<string> = new Set();

      if (pkg.category_slug && slugToId.has(pkg.category_slug)) {
        categoryIds.add(slugToId.get(pkg.category_slug)!);
      }

      if (pkg.tags) {
        for (const tag of pkg.tags) {
          if (slugToId.has(tag)) {
            categoryIds.add(slugToId.get(tag)!);
          }
        }
      }

      if (categoryIds.size === 0) {
        continue;
      }

      const values = [...categoryIds].map(id => `('${pkg.package_id}', '${id}')`).join(',');
      await this.server.pg.query(`
        INSERT INTO package_categories (package_id, category_id)
        VALUES ${values}
        ON CONFLICT DO NOTHING
      `);
      processed++;
    }

    this.server.log.info(
      { processed, durationMs: Date.now() - startTime },
      'Taxonomy backfill processed packages'
    );

    return processed;
  }

  /**
   * Get packages for a specific use case
   */
  async getPackagesByUseCase(
    useCaseSlug: string,
    options: {
      limit?: number;
      offset?: number;
    } = {}
  ) {
    const { limit = 20, offset = 0 } = options;

    // Find use case
    const useCaseResult = await this.server.pg.query(`
      SELECT id, name, description, example_query, slug
      FROM use_cases
      WHERE slug = $1
    `, [useCaseSlug]);

    if (useCaseResult.rows.length === 0) {
      return { packages: [], total: 0, use_case_slug: useCaseSlug, use_case: null };
    }

    const useCase = useCaseResult.rows[0];

    // Get curated packages first (AI-selected with reasons)
    const curatedResult = await this.server.pg.query(`
      SELECT
        p.id, p.name, p.description, p.version,
        p.format, p.subtype, p.author_id,
        u.username as author_username,
        p.total_downloads, p.quality_score,
        p.created_at, p.updated_at,
        ucp.recommendation_reason,
        ucp.sort_order
      FROM use_case_packages ucp
      JOIN packages p ON ucp.package_id = p.id
      LEFT JOIN users u ON p.author_id = u.id
      WHERE ucp.use_case_id = $1
        AND p.visibility = 'public'
        AND p.deprecated = false
      ORDER BY ucp.sort_order ASC
      LIMIT $2 OFFSET $3
    `, [useCase.id, limit, offset]);

    // If we have curated packages, return those
    if (curatedResult.rows.length > 0) {
      // Get total count of curated packages
      const countResult = await this.server.pg.query(`
        SELECT COUNT(*) as total
        FROM use_case_packages ucp
        JOIN packages p ON ucp.package_id = p.id
        WHERE ucp.use_case_id = $1
          AND p.visibility = 'public'
          AND p.deprecated = false
      `, [useCase.id]);

      return {
        packages: curatedResult.rows,
        total: parseInt(countResult.rows[0]?.total || '0'),
        use_case_slug: useCaseSlug,
        use_case: useCase
      };
    }

    // Fallback to auto-tagged packages if no curated packages exist
    const packagesResult = await this.server.pg.query(`
      SELECT DISTINCT
        p.id, p.name, p.description, p.version,
        p.format, p.subtype, p.author_id,
        u.username as author_username,
        p.total_downloads, p.quality_score,
        p.created_at, p.updated_at,
        NULL as recommendation_reason,
        NULL as sort_order
      FROM packages p
      JOIN package_use_cases puc ON p.id = puc.package_id
      LEFT JOIN users u ON p.author_id = u.id
      WHERE puc.use_case_id = $1
        AND p.visibility = 'public'
        AND p.deprecated = false
      ORDER BY p.total_downloads DESC, p.created_at DESC
      LIMIT $2 OFFSET $3
    `, [useCase.id, limit, offset]);

    // Get total count
    const countResult = await this.server.pg.query(`
      SELECT COUNT(DISTINCT p.id) as total
      FROM packages p
      JOIN package_use_cases puc ON p.id = puc.package_id
      WHERE puc.use_case_id = $1
        AND p.visibility = 'public'
        AND p.deprecated = false
    `, [useCase.id]);

    return {
      packages: packagesResult.rows,
      total: parseInt(countResult.rows[0]?.total || '0'),
      use_case_slug: useCaseSlug,
      use_case: useCase
    };
  }

  /**
   * Search categories by name
   */
  async searchCategories(query: string, limit = 10): Promise<Category[]> {
    const result = await this.server.pg.query<Category>(`
      SELECT
        id, name, slug, parent_id, level,
        description, icon, display_order,
        created_at, updated_at
      FROM categories
      WHERE name ILIKE $1 OR description ILIKE $1
      ORDER BY level ASC, display_order ASC
      LIMIT $2
    `, [`%${query}%`, limit]);

    return result.rows;
  }

  /**
   * Search use cases by name or description
   */
  async searchUseCases(query: string, limit = 10): Promise<UseCase[]> {
    const result = await this.server.pg.query<UseCase>(`
      SELECT
        id, name, slug, description, icon,
        example_query, display_order,
        created_at, updated_at
      FROM use_cases
      WHERE name ILIKE $1 OR description ILIKE $1 OR example_query ILIKE $1
      ORDER BY display_order ASC
      LIMIT $2
    `, [`%${query}%`, limit]);

    return result.rows;
  }
}
