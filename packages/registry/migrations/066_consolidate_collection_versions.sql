-- Migration: Consolidate collection versions
-- Problem: When publishing new versions of a collection, we create new rows
-- instead of updating. This causes duplicate entries in listing APIs.
--
-- Solution: For each name_slug with multiple versions:
-- 1. Keep the latest version (by created_at)
-- 2. Aggregate downloads/stars from older versions into the latest
-- 3. Update collection_stars to point to the latest version
-- 4. Delete older version rows (collection_packages cascade deletes)
--
-- This migration is idempotent - safe to run multiple times.
-- Wrapped in a transaction with advisory lock to prevent race conditions.

BEGIN;

-- Acquire advisory lock to prevent concurrent migrations or collection writes
-- Lock ID 66 corresponds to this migration number
SELECT pg_advisory_xact_lock(66);

-- First, let's see what we're dealing with (informational)
DO $$
DECLARE
  dup_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO dup_count
  FROM (
    SELECT name_slug, COUNT(*) as version_count
    FROM collections
    GROUP BY name_slug
    HAVING COUNT(*) > 1
  ) duplicates;

  RAISE NOTICE 'Found % collections with multiple versions to consolidate', dup_count;
END $$;

-- Step 1: Create a temp table identifying latest versions and aggregated stats
-- Also create explicit old_id -> latest_id mapping for safer updates
CREATE TEMP TABLE collection_consolidation AS
WITH version_stats AS (
  -- Get all collections grouped by name_slug with row numbers
  SELECT
    id,
    name_slug,
    version,
    downloads,
    stars,
    created_at,
    ROW_NUMBER() OVER (PARTITION BY name_slug ORDER BY created_at DESC) as rn,
    COUNT(*) OVER (PARTITION BY name_slug) as total_versions
  FROM collections
),
aggregated AS (
  -- Sum up downloads and stars for each name_slug
  SELECT
    name_slug,
    SUM(COALESCE(downloads, 0)) as total_downloads,
    SUM(COALESCE(stars, 0)) as total_stars
  FROM collections
  GROUP BY name_slug
)
SELECT
  vs.id as latest_id,
  vs.name_slug,
  vs.version as latest_version,
  a.total_downloads,
  a.total_stars,
  vs.total_versions
FROM version_stats vs
JOIN aggregated a ON vs.name_slug = a.name_slug
WHERE vs.rn = 1 AND vs.total_versions > 1;

-- Create explicit mapping of old_id -> latest_id for safer updates
CREATE TEMP TABLE old_to_latest_mapping AS
SELECT
  c.id as old_id,
  cc.latest_id
FROM collections c
JOIN collection_consolidation cc ON c.name_slug = cc.name_slug
WHERE c.id != cc.latest_id;

-- Step 2: Update the latest versions with aggregated stats
UPDATE collections c
SET
  downloads = cc.total_downloads,
  stars = cc.total_stars
FROM collection_consolidation cc
WHERE c.id = cc.latest_id;

-- Step 3: Update collection_stars to point to latest version using explicit mapping
-- For each user's star on an old version, update to point to latest version
UPDATE collection_stars cs
SET collection_id = m.latest_id
FROM old_to_latest_mapping m
WHERE cs.collection_id = m.old_id
  AND NOT EXISTS (
    -- Don't update if user already has a star on the latest version
    SELECT 1 FROM collection_stars existing
    WHERE existing.user_id = cs.user_id
      AND existing.collection_id = m.latest_id
  );

-- Step 4: Delete duplicate stars (user starred both old and new version)
DELETE FROM collection_stars cs
USING old_to_latest_mapping m
WHERE cs.collection_id = m.old_id;

-- Step 5: Delete old collection versions using explicit mapping
-- Note: collection_packages has ON DELETE CASCADE, so packages will be cleaned up
DELETE FROM collections c
USING old_to_latest_mapping m
WHERE c.id = m.old_id;

-- Step 6: Clean up temp tables
DROP TABLE old_to_latest_mapping;
DROP TABLE collection_consolidation;

-- Verify the cleanup worked
DO $$
DECLARE
  remaining_dups INTEGER;
BEGIN
  SELECT COUNT(*) INTO remaining_dups
  FROM (
    SELECT name_slug, COUNT(*) as version_count
    FROM collections
    GROUP BY name_slug
    HAVING COUNT(*) > 1
  ) duplicates;

  IF remaining_dups > 0 THEN
    RAISE WARNING 'Still have % collections with multiple versions after cleanup', remaining_dups;
  ELSE
    RAISE NOTICE 'Successfully consolidated all collection versions. No duplicates remain.';
  END IF;
END $$;

COMMIT;
