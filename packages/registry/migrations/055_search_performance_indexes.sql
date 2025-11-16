-- Migration 055: Performance indexes for ultra-fast search
-- Adds composite indexes for common search patterns

-- ============================================
-- COMPOSITE INDEXES FOR COMMON PATTERNS
-- ============================================

-- Format + search_vector (common: filter by format + search)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_packages_format_search
ON packages(format, visibility)
WHERE visibility = 'public'
INCLUDE (search_vector, total_downloads, quality_score);

-- Subtype + search_vector (common: filter by subtype + search)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_packages_subtype_search
ON packages(subtype, visibility)
WHERE visibility = 'public'
INCLUDE (search_vector, total_downloads, quality_score);

-- Category + downloads (popular in category)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_packages_category_perf
ON packages(category, total_downloads DESC, quality_score DESC NULLS LAST)
WHERE visibility = 'public' AND deprecated = FALSE;

-- Featured/Verified packages (fast access)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_packages_featured_verified
ON packages(featured, verified, total_downloads DESC)
WHERE visibility = 'public' AND (featured = TRUE OR verified = TRUE);

-- ============================================
-- AUTOCOMPLETE OPTIMIZATION INDEXES
-- ============================================

-- Package name prefix search (for autocomplete)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_packages_name_prefix
ON packages(name text_pattern_ops, total_downloads DESC)
WHERE visibility = 'public';

-- Tags array overlap (for autocomplete tag search)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_packages_tags_overlap
ON packages USING gin(tags)
WHERE visibility = 'public' AND array_length(tags, 1) > 0;

-- ============================================
-- STATISTICS UPDATES
-- ============================================

-- Update table statistics for better query planning
ANALYZE packages;
ANALYZE package_search_rankings;

-- ============================================
-- VACUUM FOR CLEANUP
-- ============================================

-- Clean up dead tuples for better performance
VACUUM ANALYZE packages;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON INDEX idx_packages_format_search IS 'Optimized for format filtering + full-text search';
COMMENT ON INDEX idx_packages_subtype_search IS 'Optimized for subtype filtering + full-text search';
COMMENT ON INDEX idx_packages_category_perf IS 'Optimized for category browsing with ranking';
COMMENT ON INDEX idx_packages_name_prefix IS 'Optimized for autocomplete prefix matching';
COMMENT ON INDEX idx_packages_tags_overlap IS 'Optimized for tag-based autocomplete';
