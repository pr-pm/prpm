-- Migration 045: Optimize Indexes for Enriched Claude Skills (Phase 5)
-- Description: Adds strategic indexes for the 2,936 enriched Claude skills
-- Author: AI Assistant
-- Date: 2025-11-11
--
-- Background:
-- Phase 5 adds 2,936 Claude SKILL.md packages with rich enrichment data:
-- - 56.2% have exceptional quality scores (4.5-5.0)
-- - 85.1% have language metadata
-- - 27.2% have framework metadata
-- - 98.8% have suggested test inputs
--
-- These indexes optimize common query patterns for browsing and filtering
-- the enriched package catalog.
--
-- Duration: <1 second per index (fast at ~3K packages scale)

-- =====================================================
-- 1. FORMAT + SUBTYPE + QUALITY SCORE
-- =====================================================
-- Query pattern: "Show me the best claude skills"
-- Current gap: Has idx_packages_format_subtype but not with quality sorting
-- Impact: Optimizes primary browse experience for largest package type (2,936 skills)

CREATE INDEX IF NOT EXISTS idx_packages_format_subtype_quality
ON packages(format, subtype, quality_score DESC NULLS LAST)
WHERE visibility = 'public' AND deprecated = false;

COMMENT ON INDEX idx_packages_format_subtype_quality IS
'Optimizes queries for browsing packages by format and subtype sorted by quality. '
'Example: SELECT * FROM packages WHERE format=''claude'' AND subtype=''skill'' ORDER BY quality_score DESC. '
'Added in Phase 5 to support 2,936 enriched Claude skills.';

-- =====================================================
-- 2. LANGUAGE + QUALITY SCORE
-- =====================================================
-- Query pattern: "Best TypeScript packages", "Best Python packages"
-- Current gap: Only has single-column idx_packages_language
-- Impact: 85% of enriched packages have language data (~2,500 skills)

CREATE INDEX IF NOT EXISTS idx_packages_language_quality
ON packages(language, quality_score DESC NULLS LAST)
WHERE language IS NOT NULL AND visibility = 'public';

COMMENT ON INDEX idx_packages_language_quality IS
'Optimizes queries for browsing packages by programming language sorted by quality. '
'Example: SELECT * FROM packages WHERE language=''typescript'' ORDER BY quality_score DESC. '
'Covers 85% of enriched Claude skills (2,500+ packages).';

-- =====================================================
-- 3. FRAMEWORK + QUALITY SCORE
-- =====================================================
-- Query pattern: "Best React packages", "Best Django packages"
-- Current gap: Only has single-column idx_packages_framework
-- Impact: 27% of enriched packages have framework data (~800 skills)

CREATE INDEX IF NOT EXISTS idx_packages_framework_quality
ON packages(framework, quality_score DESC NULLS LAST)
WHERE framework IS NOT NULL AND visibility = 'public';

COMMENT ON INDEX idx_packages_framework_quality IS
'Optimizes queries for browsing packages by framework sorted by quality. '
'Example: SELECT * FROM packages WHERE framework=''react'' ORDER BY quality_score DESC. '
'Covers 27% of enriched Claude skills (800+ packages).';

-- =====================================================
-- 4. EXCEPTIONAL QUALITY PARTIAL INDEX
-- =====================================================
-- Query pattern: "Show only premium/exceptional packages"
-- Current gap: No partial index for high-quality subset
-- Impact: 56.2% of enriched skills are exceptional (4.5-5.0), much smaller index
-- Benefit: Very fast queries for homepage "premium" section

CREATE INDEX IF NOT EXISTS idx_packages_exceptional_quality
ON packages(quality_score DESC, total_downloads DESC, created_at DESC)
WHERE quality_score >= 4.5 AND visibility = 'public' AND deprecated = false;

COMMENT ON INDEX idx_packages_exceptional_quality IS
'Partial index for exceptional quality packages (4.5-5.0 score). '
'Optimizes homepage "Premium Skills" section and quality filters. '
'Covers 56.2% of enriched Claude skills (1,649 packages). '
'Much smaller than full index, enabling faster scans.';

-- =====================================================
-- 5. ANALYZE TABLES
-- =====================================================
-- Update query planner statistics for optimal query plans

ANALYZE packages;
ANALYZE suggested_test_inputs;

-- =====================================================
-- 6. COMPLETION
-- =====================================================

DO $$
DECLARE
  v_package_count INTEGER;
  v_skill_count INTEGER;
  v_exceptional_count INTEGER;
BEGIN
  -- Get current counts
  SELECT COUNT(*) INTO v_package_count FROM packages;
  SELECT COUNT(*) INTO v_skill_count FROM packages WHERE format = 'claude' AND subtype = 'skill';
  SELECT COUNT(*) INTO v_exceptional_count FROM packages WHERE quality_score >= 4.5;

  RAISE NOTICE '==========================================';
  RAISE NOTICE 'Migration 045 completed successfully!';
  RAISE NOTICE '==========================================';
  RAISE NOTICE 'Created 4 strategic indexes for enriched Claude skills';
  RAISE NOTICE '';
  RAISE NOTICE 'Current database stats:';
  RAISE NOTICE '  Total packages: %', v_package_count;
  RAISE NOTICE '  Claude skills: %', v_skill_count;
  RAISE NOTICE '  Exceptional quality (>=4.5): %', v_exceptional_count;
  RAISE NOTICE '';
  RAISE NOTICE 'New indexes:';
  RAISE NOTICE '  1. idx_packages_format_subtype_quality - Browse by format+subtype';
  RAISE NOTICE '  2. idx_packages_language_quality - Browse by language';
  RAISE NOTICE '  3. idx_packages_framework_quality - Browse by framework';
  RAISE NOTICE '  4. idx_packages_exceptional_quality - Premium packages only';
  RAISE NOTICE '';
  RAISE NOTICE 'Expected impact:';
  RAISE NOTICE '  - 2-5x faster quality-sorted queries';
  RAISE NOTICE '  - Optimized language/framework filtering';
  RAISE NOTICE '  - Instant premium package discovery';
  RAISE NOTICE '  - Storage overhead: ~80-160 MB';
  RAISE NOTICE '==========================================';
END $$;
