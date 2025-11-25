-- Migration 055: Performance indexes for ultra-fast search
-- Adds composite indexes for common search patterns

-- ============================================
-- COMPOSITE INDEXES FOR COMMON PATTERNS
-- ============================================

-- Format + search_vector (common: filter by format + search)
-- Note: INCLUDE clause removed for PostgreSQL < 11 compatibility
-- Note: CONCURRENTLY removed as migrations run in transactions
CREATE INDEX IF NOT EXISTS idx_packages_format_search
ON packages(format, visibility, total_downloads, quality_score)
WHERE visibility = 'public';

-- Subtype + search_vector (common: filter by subtype + search)
-- Note: INCLUDE clause removed for PostgreSQL < 11 compatibility
-- Note: CONCURRENTLY removed as migrations run in transactions
CREATE INDEX IF NOT EXISTS idx_packages_subtype_search
ON packages(subtype, visibility, total_downloads, quality_score)
WHERE visibility = 'public';

-- Category + downloads (popular in category)
CREATE INDEX IF NOT EXISTS idx_packages_category_perf
ON packages(category, total_downloads DESC, quality_score DESC NULLS LAST)
WHERE visibility = 'public' AND deprecated = FALSE;

-- Featured/Verified packages (fast access)
CREATE INDEX IF NOT EXISTS idx_packages_featured_verified
ON packages(featured, verified, total_downloads DESC)
WHERE visibility = 'public' AND (featured = TRUE OR verified = TRUE);

-- ============================================
-- AUTOCOMPLETE OPTIMIZATION INDEXES
-- ============================================

-- Package name prefix search (for autocomplete)
CREATE INDEX IF NOT EXISTS idx_packages_name_prefix
ON packages(name text_pattern_ops, total_downloads DESC)
WHERE visibility = 'public';

-- Tags array overlap (for autocomplete tag search)
CREATE INDEX IF NOT EXISTS idx_packages_tags_overlap
ON packages USING gin(tags)
WHERE visibility = 'public' AND array_length(tags, 1) > 0;

-- ============================================
-- STATISTICS UPDATES
-- ============================================

-- Update table statistics for better query planning
ANALYZE packages;
ANALYZE package_search_rankings;

-- Note: VACUUM removed as it cannot run inside a transaction
-- Run VACUUM manually if needed: VACUUM ANALYZE packages;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON INDEX idx_packages_format_search IS 'Optimized for format filtering + full-text search';
COMMENT ON INDEX idx_packages_subtype_search IS 'Optimized for subtype filtering + full-text search';
COMMENT ON INDEX idx_packages_category_perf IS 'Optimized for category browsing with ranking';
COMMENT ON INDEX idx_packages_name_prefix IS 'Optimized for autocomplete prefix matching';
COMMENT ON INDEX idx_packages_tags_overlap IS 'Optimized for tag-based autocomplete';
