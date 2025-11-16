-- Migration 056: Search query optimization settings
-- PostgreSQL configuration for optimal search performance

-- ============================================
-- QUERY PLANNER SETTINGS
-- ============================================

-- Increase work_mem for complex search queries (per connection)
-- This helps with sorting and hash operations in search
ALTER DATABASE prpm SET work_mem = '64MB';

-- Increase shared_buffers hint for search-heavy workload
-- (This is a hint; actual setting requires postgresql.conf change)
-- Recommended: shared_buffers = 25% of RAM

-- Enable JIT compilation for complex queries (PostgreSQL 11+)
ALTER DATABASE prpm SET jit = on;
ALTER DATABASE prpm SET jit_above_cost = 100000;
ALTER DATABASE prpm SET jit_optimize_above_cost = 500000;

-- ============================================
-- FULL-TEXT SEARCH SETTINGS
-- ============================================

-- Increase ts_rank calculation precision
ALTER DATABASE prpm SET default_text_search_config = 'pg_catalog.english';

-- ============================================
-- STATISTICS FOR BETTER QUERY PLANS
-- ============================================

-- Increase statistics target for search-critical columns
ALTER TABLE packages ALTER COLUMN search_vector SET STATISTICS 1000;
ALTER TABLE packages ALTER COLUMN name SET STATISTICS 500;
ALTER TABLE packages ALTER COLUMN total_downloads SET STATISTICS 500;
ALTER TABLE packages ALTER COLUMN quality_score SET STATISTICS 500;
ALTER TABLE packages ALTER COLUMN tags SET STATISTICS 500;

-- Update statistics
ANALYZE packages;

-- ============================================
-- PREPARED STATEMENT OPTIMIZATION
-- ============================================

-- Create prepared statement slots for common queries
-- (This will be done at runtime by the connection pool)

-- ============================================
-- INDEX BLOAT PREVENTION
-- ============================================

-- Note: fillfactor not supported on GIN indexes
-- For B-tree indexes, set during index creation instead
-- (Leaves space for HOT updates, reducing bloat)

-- ============================================
-- AUTOVACUUM TUNING FOR SEARCH TABLES
-- ============================================

-- More aggressive autovacuum for packages table (frequently searched)
ALTER TABLE packages SET (
  autovacuum_vacuum_scale_factor = 0.05,  -- Vacuum at 5% dead tuples (default: 20%)
  autovacuum_analyze_scale_factor = 0.02, -- Analyze at 2% changes (default: 10%)
  autovacuum_vacuum_cost_delay = 10,      -- Faster vacuum
  autovacuum_vacuum_cost_limit = 1000     -- Higher work per vacuum cycle
);

-- Tune materialized view table
ALTER TABLE package_search_rankings SET (
  autovacuum_vacuum_scale_factor = 0.1,
  autovacuum_analyze_scale_factor = 0.05
);

-- ============================================
-- TOAST SETTINGS OPTIMIZATION
-- ============================================

-- Compress large text fields more aggressively
ALTER TABLE packages ALTER COLUMN description SET STORAGE EXTENDED;
ALTER TABLE packages ALTER COLUMN full_content SET STORAGE EXTENDED;

-- ============================================
-- PARALLEL QUERY SETTINGS
-- ============================================

-- Enable parallel queries for large result sets
ALTER DATABASE prpm SET max_parallel_workers_per_gather = 4;
ALTER DATABASE prpm SET parallel_tuple_cost = 0.05;
ALTER DATABASE prpm SET parallel_setup_cost = 500;

-- ============================================
-- FINAL CLEANUP AND ANALYSIS
-- ============================================

-- Note: VACUUM FULL and REINDEX CONCURRENTLY cannot run inside transactions
-- Run these manually when needed:
--   VACUUM FULL ANALYZE packages;
--   VACUUM FULL ANALYZE package_search_rankings;
--   REINDEX TABLE CONCURRENTLY packages;
--   REINDEX TABLE CONCURRENTLY package_search_rankings;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON DATABASE prpm IS 'Optimized for search-heavy workload with FTS and complex ranking';
