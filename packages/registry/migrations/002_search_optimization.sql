-- Migration 002: Search Optimization for 784+ packages
-- Adds additional indexes and optimizations for search performance

-- ============================================
-- ADDITIONAL SEARCH INDEXES
-- ============================================

-- Composite index for common search patterns (type + tags)
CREATE INDEX idx_packages_type_tags ON packages(type, tags) WHERE visibility = 'public';

-- Composite index for filtering by category and quality
CREATE INDEX idx_packages_category_quality ON packages(category, quality_score DESC NULLS LAST) WHERE visibility = 'public';

-- Index for official/verified packages
CREATE INDEX idx_packages_official ON packages(verified) WHERE verified = TRUE AND visibility = 'public';

-- Composite index for trending packages (downloads + recency)
CREATE INDEX idx_packages_trending ON packages(weekly_downloads DESC, created_at DESC) WHERE visibility = 'public';

-- Index for author search
CREATE INDEX idx_packages_author_name ON packages(author_id, display_name);

-- Trigram index for fuzzy name matching
CREATE INDEX idx_packages_name_trgm ON packages USING gin(display_name gin_trgm_ops);
CREATE INDEX idx_packages_desc_trgm ON packages USING gin(description gin_trgm_ops);

-- ============================================
-- CATEGORY-SPECIFIC INDEXES
-- ============================================

-- For filtering by specific categories (will be common with 784 packages)
CREATE INDEX idx_packages_category ON packages(category) WHERE visibility = 'public';

-- Multi-column index for category + downloads (popular in category)
CREATE INDEX idx_packages_category_downloads ON packages(category, total_downloads DESC) WHERE visibility = 'public';

-- ============================================
-- TAG SEARCH OPTIMIZATION
-- ============================================

-- Index for tag array contains queries
-- Already have GIN index on tags, but add one for common patterns
CREATE INDEX idx_packages_tags_contains ON packages USING gin(tags array_ops);

-- ============================================
-- FULL-TEXT SEARCH IMPROVEMENTS
-- ============================================

-- Drop old full-text index and create better one
DROP INDEX IF EXISTS idx_packages_search;

-- Create improved full-text search with weights
-- display_name gets weight A (highest), description gets weight B
CREATE INDEX idx_packages_fts ON packages USING gin(
  (
    setweight(to_tsvector('english', coalesce(display_name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
    setweight(to_tsvector('english', array_to_string(tags, ' ')), 'C') ||
    setweight(to_tsvector('english', array_to_string(keywords, ' ')), 'D')
  )
);

-- ============================================
-- MATERIALIZED VIEW FOR SEARCH RANKINGS
-- ============================================

-- Create materialized view for pre-computed search rankings
CREATE MATERIALIZED VIEW package_search_rankings AS
SELECT
  p.id,
  p.display_name,
  p.description,
  p.type,
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
  -- Compute search rank score
  (
    -- Featured packages get +1000 points
    (CASE WHEN p.featured THEN 1000 ELSE 0 END) +
    -- Verified packages get +500 points
    (CASE WHEN p.verified THEN 500 ELSE 0 END) +
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
  -- Full-text search vector
  (
    setweight(to_tsvector('english', coalesce(p.display_name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(p.description, '')), 'B') ||
    setweight(to_tsvector('english', array_to_string(p.tags, ' ')), 'C') ||
    setweight(to_tsvector('english', array_to_string(p.keywords, ' ')), 'D')
  ) as search_vector
FROM packages p
WHERE p.visibility = 'public' AND p.deprecated = FALSE;

-- Indexes on materialized view
CREATE INDEX idx_search_rankings_rank ON package_search_rankings(search_rank DESC);
CREATE INDEX idx_search_rankings_fts ON package_search_rankings USING gin(search_vector);
CREATE INDEX idx_search_rankings_type ON package_search_rankings(type);
CREATE INDEX idx_search_rankings_category ON package_search_rankings(category);
CREATE INDEX idx_search_rankings_tags ON package_search_rankings USING gin(tags);
CREATE INDEX idx_search_rankings_downloads ON package_search_rankings(total_downloads DESC);

-- Function to refresh search rankings
CREATE OR REPLACE FUNCTION refresh_search_rankings()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY package_search_rankings;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SEARCH HELPER FUNCTIONS
-- ============================================

-- Function for search with ranking
CREATE OR REPLACE FUNCTION search_packages(
  search_query TEXT,
  package_type TEXT DEFAULT NULL,
  package_category TEXT DEFAULT NULL,
  tag_filter TEXT[] DEFAULT NULL,
  min_quality DECIMAL DEFAULT NULL,
  verified_only BOOLEAN DEFAULT FALSE,
  limit_count INTEGER DEFAULT 20,
  offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
  id VARCHAR,
  display_name VARCHAR,
  description TEXT,
  type VARCHAR,
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
    psr.display_name,
    psr.description,
    psr.type,
    psr.category,
    psr.tags,
    psr.total_downloads,
    psr.quality_score,
    psr.rating_average,
    psr.verified,
    ts_rank(psr.search_vector, websearch_to_tsquery('english', search_query)) * psr.search_rank as rank
  FROM package_search_rankings psr
  WHERE
    (search_query IS NULL OR psr.search_vector @@ websearch_to_tsquery('english', search_query))
    AND (package_type IS NULL OR psr.type = package_type)
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
-- STATISTICS FUNCTIONS
-- ============================================

-- Function to get package count by category
CREATE OR REPLACE FUNCTION get_category_stats()
RETURNS TABLE(category VARCHAR, count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT p.category, COUNT(*)::BIGINT
  FROM packages p
  WHERE p.visibility = 'public' AND p.deprecated = FALSE
  GROUP BY p.category
  ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get package count by type
CREATE OR REPLACE FUNCTION get_type_stats()
RETURNS TABLE(type VARCHAR, count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT p.type, COUNT(*)::BIGINT
  FROM packages p
  WHERE p.visibility = 'public' AND p.deprecated = FALSE
  GROUP BY p.type
  ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get top tags
CREATE OR REPLACE FUNCTION get_top_tags(limit_count INTEGER DEFAULT 50)
RETURNS TABLE(tag TEXT, count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT unnest(p.tags) as tag, COUNT(*)::BIGINT
  FROM packages p
  WHERE p.visibility = 'public' AND p.deprecated = FALSE
  GROUP BY tag
  ORDER BY count DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- PERFORMANCE MONITORING
-- ============================================

-- View for monitoring slow queries
CREATE OR REPLACE VIEW slow_queries AS
SELECT
  query,
  calls,
  total_exec_time,
  mean_exec_time,
  max_exec_time,
  stddev_exec_time
FROM pg_stat_statements
WHERE mean_exec_time > 100  -- queries taking more than 100ms on average
ORDER BY mean_exec_time DESC
LIMIT 20;

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON INDEX idx_packages_type_tags IS 'Composite index for filtering by type and tags together';
COMMENT ON INDEX idx_packages_category_quality IS 'Find best packages in a category';
COMMENT ON INDEX idx_packages_trending IS 'Quick access to trending packages';
COMMENT ON MATERIALIZED VIEW package_search_rankings IS 'Pre-computed search rankings for fast queries';
COMMENT ON FUNCTION search_packages IS 'Main search function with filters and ranking';
COMMENT ON FUNCTION refresh_search_rankings IS 'Refresh search rankings materialized view';
