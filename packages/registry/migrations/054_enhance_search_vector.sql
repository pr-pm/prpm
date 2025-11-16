-- Migration 054: Enhance search_vector with more fields
-- Adds display_name, category, and prepares for author username inclusion

-- ============================================
-- DROP OLD SEARCH_VECTOR COLUMN
-- ============================================

-- Drop the existing search_vector column and its index
DROP INDEX IF EXISTS idx_packages_search_vector;
ALTER TABLE packages DROP COLUMN IF EXISTS search_vector;

-- ============================================
-- CREATE ENHANCED SEARCH_VECTOR
-- ============================================

-- Add enhanced generated column for full-text search vector
-- Includes: name (A), display_name (A), description (B), category (B), tags (C), keywords (D)
ALTER TABLE packages
ADD COLUMN search_vector tsvector
GENERATED ALWAYS AS (
  -- A weight: Name fields (highest priority)
  setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(display_name, '')), 'A') ||
  -- B weight: Description and category (high priority)
  setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
  setweight(to_tsvector('english', coalesce(category, '')), 'B') ||
  -- C weight: Tags (medium priority)
  setweight(to_tsvector('english', immutable_array_to_string(tags, ' ')), 'C') ||
  -- D weight: Keywords (lower priority)
  setweight(to_tsvector('english', immutable_array_to_string(keywords, ' ')), 'D')
) STORED;

-- Create GIN index on the enhanced search_vector
CREATE INDEX idx_packages_search_vector ON packages USING gin(search_vector);

-- ============================================
-- UPDATE MATERIALIZED VIEW
-- ============================================

-- Drop and recreate materialized view to use the new search_vector
DROP MATERIALIZED VIEW IF EXISTS package_search_rankings CASCADE;

CREATE MATERIALIZED VIEW package_search_rankings AS
SELECT
  p.id,
  p.name,
  p.display_name,
  p.description,
  p.format,
  p.subtype,
  p.category,
  p.tags,
  p.keywords,
  p.total_downloads,
  p.weekly_downloads,
  p.quality_score,
  p.rating_average,
  p.rating_count,
  p.verified,
  p.featured,
  p.created_at,
  -- Compute enhanced search rank score
  (
    -- Featured packages get +1000 points
    (CASE WHEN p.featured THEN 1000 ELSE 0 END) +
    -- Verified packages get +500 points
    (CASE WHEN p.verified THEN 500 ELSE 0 END) +
    -- Official packages get +300 points
    (CASE WHEN p.official THEN 300 ELSE 0 END) +
    -- Quality score contributes up to 500 points
    (COALESCE(p.quality_score, 0) * 100) +
    -- Downloads contribute (log scale to prevent dominance)
    (LEAST(LOG(NULLIF(p.total_downloads, 0) + 1) * 50, 500)) +
    -- Rating contributes up to 500 points
    (COALESCE(p.rating_average, 0) * 100) +
    -- Recency bonus (decay over time)
    (CASE
      WHEN p.created_at > NOW() - INTERVAL '7 days' THEN 200
      WHEN p.created_at > NOW() - INTERVAL '30 days' THEN 100
      WHEN p.created_at > NOW() - INTERVAL '90 days' THEN 50
      ELSE 0
    END)
  ) as search_rank,
  -- Use the enhanced search_vector column
  p.search_vector
FROM packages p
WHERE p.visibility = 'public' AND p.deprecated = FALSE;

-- Indexes on materialized view
CREATE INDEX idx_search_rankings_rank ON package_search_rankings(search_rank DESC);
CREATE INDEX idx_search_rankings_fts ON package_search_rankings USING gin(search_vector);
CREATE INDEX idx_search_rankings_format ON package_search_rankings(format);
CREATE INDEX idx_search_rankings_subtype ON package_search_rankings(subtype);
CREATE INDEX idx_search_rankings_category ON package_search_rankings(category);
CREATE INDEX idx_search_rankings_tags ON package_search_rankings USING gin(tags);
CREATE INDEX idx_search_rankings_downloads ON package_search_rankings(total_downloads DESC);
CREATE INDEX idx_search_rankings_quality ON package_search_rankings(quality_score DESC NULLS LAST);

-- ============================================
-- UPDATE SEARCH FUNCTION
-- ============================================

-- Update the search_packages function to use enhanced fields
CREATE OR REPLACE FUNCTION search_packages(
  search_query TEXT,
  package_format TEXT DEFAULT NULL,
  package_subtype TEXT DEFAULT NULL,
  package_category TEXT DEFAULT NULL,
  tag_filter TEXT[] DEFAULT NULL,
  min_quality DECIMAL DEFAULT NULL,
  verified_only BOOLEAN DEFAULT FALSE,
  limit_count INTEGER DEFAULT 20,
  offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  name VARCHAR,
  display_name VARCHAR,
  description TEXT,
  format VARCHAR,
  subtype VARCHAR,
  category VARCHAR,
  tags TEXT[],
  total_downloads INTEGER,
  quality_score DECIMAL,
  rating_average DECIMAL,
  verified BOOLEAN,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    psr.id,
    psr.name,
    psr.display_name,
    psr.description,
    psr.format,
    psr.subtype,
    psr.category,
    psr.tags,
    psr.total_downloads,
    psr.quality_score,
    psr.rating_average,
    psr.verified,
    ts_rank_cd(psr.search_vector, websearch_to_tsquery('english', search_query), 32) * psr.search_rank as rank
  FROM package_search_rankings psr
  WHERE
    (search_query IS NULL OR psr.search_vector @@ websearch_to_tsquery('english', search_query))
    AND (package_format IS NULL OR psr.format = package_format)
    AND (package_subtype IS NULL OR psr.subtype = package_subtype)
    AND (package_category IS NULL OR psr.category = package_category)
    AND (tag_filter IS NULL OR psr.tags && tag_filter)
    AND (min_quality IS NULL OR psr.quality_score >= min_quality)
    AND (NOT verified_only OR psr.verified = TRUE)
  ORDER BY rank DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- INITIAL REFRESH
-- ============================================

-- Refresh the materialized view with new data
REFRESH MATERIALIZED VIEW package_search_rankings;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON COLUMN packages.search_vector IS 'Enhanced full-text search vector with weighted fields: name/display_name (A), description/category (B), tags (C), keywords (D)';
COMMENT ON MATERIALIZED VIEW package_search_rankings IS 'Pre-computed search rankings with enhanced search_vector for fast queries';
COMMENT ON FUNCTION search_packages IS 'Enhanced search function with format/subtype support and weighted ranking';
