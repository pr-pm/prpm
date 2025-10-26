-- Migration: Add format and subtype columns, remove type column
-- Clean taxonomy: Format (platform) + Subtype (functional category)

-- Drop dependent views first (will be recreated later)
DROP MATERIALIZED VIEW IF EXISTS package_search_rankings;
DROP VIEW IF EXISTS top_unclaimed_authors;
DROP VIEW IF EXISTS category_stats;

-- Drop indexes that depend on type column
DROP INDEX IF EXISTS idx_packages_type;
DROP INDEX IF EXISTS idx_packages_type_score;
DROP INDEX IF EXISTS idx_packages_type_tags;
DROP INDEX IF EXISTS idx_packages_category_type;

-- Add new columns
ALTER TABLE packages ADD COLUMN IF NOT EXISTS format TEXT;
ALTER TABLE packages ADD COLUMN IF NOT EXISTS subtype TEXT DEFAULT 'rule';

-- Migrate existing data from type column to format + subtype (if type column exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'packages' AND column_name = 'type') THEN
    UPDATE packages SET
      format = CASE
        -- Collections
        WHEN type = 'collection' THEN 'generic'
        -- MCP
        WHEN type = 'mcp' THEN 'mcp'
        -- Compound types (cursor-agent, claude-skill, etc.)
        WHEN type LIKE '%-%' THEN split_part(type, '-', 1)
        -- Simple types
        ELSE type
      END,
      subtype = CASE
        -- Collection
        WHEN type = 'collection' THEN 'collection'
        -- MCP defaults to tool
        WHEN type = 'mcp' THEN 'tool'
        -- cursor-agent, claude-agent, etc.
        WHEN type LIKE '%-agent' THEN 'agent'
        -- cursor-slash-command, claude-slash-command
        WHEN type LIKE '%-slash-command' THEN 'slash-command'
        -- claude-skill
        WHEN type LIKE '%-skill' THEN 'skill'
        -- Simple types default to rule
        ELSE 'rule'
      END
    WHERE format IS NULL OR subtype IS NULL;
  END IF;
END $$;

-- Add constraints
ALTER TABLE packages ADD CONSTRAINT packages_format_check
  CHECK (format IN ('cursor', 'claude', 'continue', 'windsurf', 'copilot', 'kiro', 'generic', 'mcp'));

ALTER TABLE packages ADD CONSTRAINT packages_subtype_check
  CHECK (subtype IN ('rule', 'agent', 'skill', 'slash-command', 'prompt', 'workflow', 'tool', 'template', 'collection', 'chatmode'));

-- Make format and subtype NOT NULL
ALTER TABLE packages ALTER COLUMN format SET NOT NULL;
ALTER TABLE packages ALTER COLUMN subtype SET NOT NULL;
ALTER TABLE packages ALTER COLUMN subtype SET DEFAULT 'rule';

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_packages_format ON packages(format);
CREATE INDEX IF NOT EXISTS idx_packages_subtype ON packages(subtype);
CREATE INDEX IF NOT EXISTS idx_packages_format_subtype ON packages(format, subtype);

-- Drop the old type column if it exists
ALTER TABLE packages DROP COLUMN IF EXISTS type;

-- Drop the old type constraint if it exists
ALTER TABLE packages DROP CONSTRAINT IF EXISTS packages_type_check;

-- Recreate views with new format/subtype columns
CREATE MATERIALIZED VIEW package_search_rankings AS
SELECT
  p.id,
  p.name,
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
  (
    CASE WHEN p.featured THEN 1000 ELSE 0 END +
    CASE WHEN p.verified THEN 500 ELSE 0 END +
    COALESCE(p.quality_score, 0) * 100 +
    LEAST(LOG(NULLIF(p.total_downloads, 0) + 1) * 50, 500) +
    COALESCE(p.rating_average, 0) * 100 +
    CASE
      WHEN p.created_at > NOW() - INTERVAL '7 days' THEN 200
      WHEN p.created_at > NOW() - INTERVAL '30 days' THEN 100
      WHEN p.created_at > NOW() - INTERVAL '90 days' THEN 50
      ELSE 0
    END
  ) AS search_rank,
  p.search_vector
FROM packages p
WHERE p.visibility = 'public' AND p.deprecated = false;

CREATE INDEX idx_packages_search_rankings_rank ON package_search_rankings(search_rank DESC);

CREATE VIEW top_unclaimed_authors AS
WITH author_stats AS (
  SELECT
    split_part(p.name, '/', 1) AS author_username,
    COUNT(*) AS package_count,
    array_agg(DISTINCT CONCAT(p.format, '-', p.subtype)) AS package_types,
    array_agg(DISTINCT p.category) AS categories,
    MIN(p.created_at) AS first_package_date,
    MAX(p.created_at) AS latest_package_date,
    SUM(p.total_downloads) AS total_downloads
  FROM packages p
  WHERE p.name LIKE '@%/%'
  GROUP BY split_part(p.name, '/', 1)
  HAVING COUNT(*) >= 5
)
SELECT
  author_username,
  package_count,
  package_types,
  categories,
  first_package_date,
  latest_package_date,
  total_downloads,
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.claimed_author_username = author_stats.author_username
  ) AS is_claimed,
  EXISTS (
    SELECT 1 FROM author_invites ai
    WHERE ai.author_username = author_stats.author_username AND ai.status = 'pending'
  ) AS has_pending_invite
FROM author_stats
ORDER BY package_count DESC, total_downloads DESC;

CREATE VIEW category_stats AS
SELECT
  COALESCE(category, 'uncategorized') AS category,
  COUNT(*) AS package_count,
  SUM(total_downloads) AS total_downloads,
  AVG(quality_score) AS avg_quality_score,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') AS packages_last_30_days
FROM packages
WHERE visibility = 'public'
GROUP BY category
ORDER BY COUNT(*) DESC;
