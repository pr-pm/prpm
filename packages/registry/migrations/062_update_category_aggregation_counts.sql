-- Update category_aggregation view to use explicit package/category mappings
-- Ensures counts reflect taxonomy assignments (package_categories) rather than legacy fields

DROP MATERIALIZED VIEW IF EXISTS category_aggregation CASCADE;

CREATE MATERIALIZED VIEW category_aggregation AS
WITH RECURSIVE category_closure AS (
  SELECT
    id AS ancestor_id,
    id AS descendant_id
  FROM categories
  UNION ALL
  SELECT
    c.parent_id AS ancestor_id,
    cc.descendant_id
  FROM categories c
  JOIN category_closure cc ON cc.ancestor_id = c.id
  WHERE c.parent_id IS NOT NULL
),
package_assignments AS (
  SELECT DISTINCT
    pc.package_id,
    pc.category_id
  FROM package_categories pc
  JOIN packages p ON p.id = pc.package_id
  WHERE p.visibility = 'public'
    AND p.deprecated = FALSE
)
SELECT
  cat.id,
  cat.slug,
  cat.name,
  cat.description,
  cat.icon,
  cat.level,
  cat.parent_id,
  cat.display_order,
  COALESCE(COUNT(DISTINCT pa.package_id), 0) AS package_count
FROM categories cat
LEFT JOIN category_closure cc ON cc.ancestor_id = cat.id
LEFT JOIN package_assignments pa ON pa.category_id = cc.descendant_id
GROUP BY
  cat.id,
  cat.slug,
  cat.name,
  cat.description,
  cat.icon,
  cat.level,
  cat.parent_id,
  cat.display_order
ORDER BY
  cat.level,
  cat.display_order,
  cat.name;

CREATE UNIQUE INDEX idx_category_agg_id ON category_aggregation(id);
CREATE INDEX idx_category_agg_slug ON category_aggregation(slug);
CREATE INDEX idx_category_agg_level ON category_aggregation(level);
CREATE INDEX idx_category_agg_parent ON category_aggregation(parent_id);
CREATE INDEX idx_category_agg_package_count ON category_aggregation(package_count DESC);

COMMENT ON MATERIALIZED VIEW category_aggregation IS 'Aggregates taxonomy categories with counts derived from package_categories.';
COMMENT ON COLUMN category_aggregation.level IS '1 = top-level category, 2+ = tags/subcategories';
COMMENT ON COLUMN category_aggregation.package_count IS 'Number of unique public packages in this category or its descendants.';

REFRESH MATERIALIZED VIEW category_aggregation;
