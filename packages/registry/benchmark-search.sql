-- PRPM Search Performance Benchmarks
-- Run with: psql -h localhost -U prpm -d prpm_registry -f benchmark-search.sql

\timing on

-- ============================================================================
-- 1. BASELINE QUERIES
-- ============================================================================

\echo ''
\echo '========================================='
\echo 'Test 1: Simple Count by Type'
\echo '========================================='
SELECT type, COUNT(*) as count
FROM packages
GROUP BY type
ORDER BY count DESC;

\echo ''
\echo '========================================='
\echo 'Test 2: Count by Category'
\echo '========================================='
SELECT category, COUNT(*) as count
FROM packages
GROUP BY category
ORDER BY count DESC
LIMIT 10;

-- ============================================================================
-- 2. SIMPLE SEARCH QUERIES
-- ============================================================================

\echo ''
\echo '========================================='
\echo 'Test 3: Simple ILIKE Search - "react"'
\echo '========================================='
SELECT id, display_name, type, category
FROM packages
WHERE display_name ILIKE '%react%'
   OR description ILIKE '%react%'
   OR 'react' = ANY(tags)
ORDER BY quality_score DESC
LIMIT 10;

\echo ''
\echo '========================================='
\echo 'Test 4: Simple ILIKE Search - "python"'
\echo '========================================='
SELECT id, display_name, type, category
FROM packages
WHERE display_name ILIKE '%python%'
   OR description ILIKE '%python%'
   OR 'python' = ANY(tags)
ORDER BY quality_score DESC
LIMIT 10;

-- ============================================================================
-- 3. FULL-TEXT SEARCH QUERIES
-- ============================================================================

\echo ''
\echo '========================================='
\echo 'Test 5: Full-text Search - "react typescript"'
\echo '========================================='
SELECT
  id,
  display_name,
  type,
  category,
  ts_rank(
    setweight(to_tsvector('english', coalesce(display_name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
    setweight(to_tsvector('english', array_to_string(tags, ' ')), 'C'),
    websearch_to_tsquery('english', 'react typescript')
  ) as relevance
FROM packages
WHERE (
  setweight(to_tsvector('english', coalesce(display_name, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
  setweight(to_tsvector('english', array_to_string(tags, ' ')), 'C')
) @@ websearch_to_tsquery('english', 'react typescript')
ORDER BY relevance DESC
LIMIT 10;

\echo ''
\echo '========================================='
\echo 'Test 6: Full-text Search - "python backend api"'
\echo '========================================='
SELECT
  id,
  display_name,
  type,
  category,
  ts_rank(
    setweight(to_tsvector('english', coalesce(display_name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
    setweight(to_tsvector('english', array_to_string(tags, ' ')), 'C'),
    websearch_to_tsquery('english', 'python backend api')
  ) as relevance
FROM packages
WHERE (
  setweight(to_tsvector('english', coalesce(display_name, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
  setweight(to_tsvector('english', array_to_string(tags, ' ')), 'C')
) @@ websearch_to_tsquery('english', 'python backend api')
ORDER BY relevance DESC
LIMIT 10;

-- ============================================================================
-- 4. FILTERED QUERIES (Type + Category)
-- ============================================================================

\echo ''
\echo '========================================='
\echo 'Test 7: Filtered - cursor + frontend'
\echo '========================================='
SELECT id, display_name, category, quality_score
FROM packages
WHERE type = 'cursor'
  AND category LIKE '%frontend%'
ORDER BY quality_score DESC
LIMIT 10;

\echo ''
\echo '========================================='
\echo 'Test 8: Filtered - claude + backend'
\echo '========================================='
SELECT id, display_name, category, quality_score
FROM packages
WHERE type = 'claude'
  AND category LIKE '%backend%'
ORDER BY quality_score DESC
LIMIT 10;

-- ============================================================================
-- 5. COMPLEX FILTERED SEARCH
-- ============================================================================

\echo ''
\echo '========================================='
\echo 'Test 9: Complex - cursor + search "nextjs" + quality > 0.8'
\echo '========================================='
SELECT
  id,
  display_name,
  type,
  category,
  quality_score,
  ts_rank(
    setweight(to_tsvector('english', coalesce(display_name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B'),
    websearch_to_tsquery('english', 'nextjs')
  ) as relevance
FROM packages
WHERE type = 'cursor'
  AND quality_score > 0.8
  AND (
    setweight(to_tsvector('english', coalesce(display_name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B')
  ) @@ websearch_to_tsquery('english', 'nextjs')
ORDER BY relevance DESC, quality_score DESC
LIMIT 10;

-- ============================================================================
-- 6. MATERIALIZED VIEW QUERIES
-- ============================================================================

\echo ''
\echo '========================================='
\echo 'Test 10: Materialized View - "react"'
\echo '========================================='
SELECT id, display_name, type, search_rank
FROM package_search_rankings
WHERE search_vector @@ websearch_to_tsquery('english', 'react')
ORDER BY search_rank DESC
LIMIT 10;

\echo ''
\echo '========================================='
\echo 'Test 11: Materialized View - "python backend"'
\echo '========================================='
SELECT id, display_name, type, search_rank
FROM package_search_rankings
WHERE search_vector @@ websearch_to_tsquery('english', 'python backend')
ORDER BY search_rank DESC
LIMIT 10;

-- ============================================================================
-- 7. HELPER FUNCTIONS
-- ============================================================================

\echo ''
\echo '========================================='
\echo 'Test 12: Category Statistics Function'
\echo '========================================='
SELECT * FROM get_category_stats();

\echo ''
\echo '========================================='
\echo 'Test 13: Top Tags Function (top 20)'
\echo '========================================='
SELECT * FROM get_top_tags(20);

-- ============================================================================
-- 8. TAG-BASED QUERIES
-- ============================================================================

\echo ''
\echo '========================================='
\echo 'Test 14: Packages with "typescript" tag'
\echo '========================================='
SELECT id, display_name, type, tags
FROM packages
WHERE 'typescript' = ANY(tags)
ORDER BY quality_score DESC
LIMIT 10;

\echo ''
\echo '========================================='
\echo 'Test 15: Packages with multiple tags (typescript AND react)'
\echo '========================================='
SELECT id, display_name, type, tags
FROM packages
WHERE 'typescript' = ANY(tags)
  AND 'react' = ANY(tags)
ORDER BY quality_score DESC
LIMIT 10;

-- ============================================================================
-- 9. FUZZY SEARCH (Trigram)
-- ============================================================================

\echo ''
\echo '========================================='
\echo 'Test 16: Fuzzy Search - "reakt" (should match "react")'
\echo '========================================='
SELECT
  id,
  display_name,
  type,
  similarity(display_name, 'reakt') as sim
FROM packages
WHERE display_name % 'reakt'
ORDER BY sim DESC
LIMIT 10;

\echo ''
\echo '========================================='
\echo 'Test 17: Fuzzy Search - "typescrpt" (should match "typescript")'
\echo '========================================='
SELECT
  id,
  display_name,
  type,
  tags,
  similarity(display_name, 'typescrpt') as name_sim
FROM packages
WHERE display_name % 'typescrpt'
   OR EXISTS (
     SELECT 1 FROM unnest(tags) tag
     WHERE tag % 'typescrpt'
   )
ORDER BY name_sim DESC
LIMIT 10;

-- ============================================================================
-- 10. POPULAR/FEATURED PACKAGES
-- ============================================================================

\echo ''
\echo '========================================='
\echo 'Test 18: Top Quality Packages (quality_score > 0.9)'
\echo '========================================='
SELECT id, display_name, type, category, quality_score, total_downloads
FROM packages
WHERE quality_score > 0.9
ORDER BY quality_score DESC NULLS LAST, total_downloads DESC
LIMIT 10;

\echo ''
\echo '========================================='
\echo 'Test 19: Featured Packages'
\echo '========================================='
SELECT id, display_name, type, category, quality_score, featured
FROM packages
WHERE featured = true
ORDER BY quality_score DESC NULLS LAST
LIMIT 10;

\echo ''
\echo '========================================='
\echo 'Test 20: Official/Verified Packages'
\echo '========================================='
SELECT id, display_name, type, category, official, verified
FROM packages
WHERE official = true OR verified = true
ORDER BY quality_score DESC;

-- ============================================================================
-- SUMMARY STATISTICS
-- ============================================================================

\echo ''
\echo '========================================='
\echo 'SUMMARY: Index Usage Statistics'
\echo '========================================='
SELECT
  schemaname,
  relname as tablename,
  indexrelname as indexname,
  idx_scan as index_scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND relname IN ('packages', 'package_search_rankings')
ORDER BY idx_scan DESC;

\echo ''
\echo '========================================='
\echo 'SUMMARY: Table Statistics'
\echo '========================================='
SELECT
  schemaname,
  relname as tablename,
  n_live_tup as live_rows,
  n_dead_tup as dead_rows,
  last_vacuum,
  last_analyze
FROM pg_stat_user_tables
WHERE schemaname = 'public'
  AND relname IN ('packages', 'package_versions', 'package_search_rankings')
ORDER BY relname;

\timing off

\echo ''
\echo '========================================='
\echo 'BENCHMARK COMPLETE!'
\echo '========================================='
\echo 'Total queries executed: 20'
\echo 'Check timing results above for performance metrics.'
\echo ''
