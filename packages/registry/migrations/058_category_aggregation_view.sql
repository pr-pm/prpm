-- Materialized view for category and tag aggregation
-- Combines categories from taxonomy with actual package usage
-- Refreshed by cron to keep counts accurate

-- Drop existing view if it exists
DROP MATERIALIZED VIEW IF EXISTS category_aggregation CASCADE;

-- Create materialized view with category hierarchy and package counts
CREATE MATERIALIZED VIEW category_aggregation AS
WITH 
-- Get all categories from taxonomy
taxonomy_categories AS (
  SELECT 
    c.id,
    c.slug,
    c.name,
    c.description,
    c.icon,
    c.level,
    c.parent_id,
    c.display_order
  FROM categories c
),
-- Count packages by category (top-level only)
category_package_counts AS (
  SELECT 
    category,
    COUNT(*) as package_count
  FROM packages
  WHERE visibility = 'public' 
    AND deprecated = FALSE
    AND category IS NOT NULL
  GROUP BY category
),
-- Count packages by tag (from both user tags and AI tags)
tag_package_counts AS (
  SELECT 
    tag,
    COUNT(*) as package_count
  FROM packages,
  LATERAL unnest(COALESCE(tags, '{}') || COALESCE(ai_tags, '{}')) AS tag
  WHERE visibility = 'public' 
    AND deprecated = FALSE
  GROUP BY tag
),
-- Combine everything
combined_data AS (
  SELECT 
    tc.id,
    tc.slug,
    tc.name,
    tc.description,
    tc.icon,
    tc.level,
    tc.parent_id,
    tc.display_order,
    COALESCE(
      CASE 
        WHEN tc.level = 1 THEN cpc.package_count
        ELSE tpc.package_count
      END, 
      0
    ) as package_count
  FROM taxonomy_categories tc
  LEFT JOIN category_package_counts cpc ON tc.slug = cpc.category AND tc.level = 1
  LEFT JOIN tag_package_counts tpc ON tc.slug = tpc.tag AND tc.level > 1
)
SELECT * FROM combined_data
ORDER BY level, display_order, package_count DESC;

-- Create indexes for fast queries
CREATE UNIQUE INDEX idx_category_agg_id ON category_aggregation(id);
CREATE INDEX idx_category_agg_slug ON category_aggregation(slug);
CREATE INDEX idx_category_agg_level ON category_aggregation(level);
CREATE INDEX idx_category_agg_parent ON category_aggregation(parent_id);
CREATE INDEX idx_category_agg_package_count ON category_aggregation(package_count DESC);

-- Add comments
COMMENT ON MATERIALIZED VIEW category_aggregation IS 'Aggregates categories and tags with package counts - refreshed by cron';
COMMENT ON COLUMN category_aggregation.level IS '1 = top-level category, 2+ = tags/subcategories';
COMMENT ON COLUMN category_aggregation.package_count IS 'Number of packages in this category/tag';

-- Create helper function to refresh the view
CREATE OR REPLACE FUNCTION refresh_category_aggregation()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY category_aggregation;
END;
$$;

COMMENT ON FUNCTION refresh_category_aggregation() IS 'Refreshes category aggregation materialized view - called by cron';

-- Initial refresh
REFRESH MATERIALIZED VIEW category_aggregation;
