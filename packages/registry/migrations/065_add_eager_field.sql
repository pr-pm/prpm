/**
 * Add eager field to packages and package_versions tables
 *
 * The eager field indicates whether a skill/agent should be loaded
 * eagerly (included in every request) or lazily (loaded on demand).
 *
 * Default: FALSE (lazy loading)
 */

-- Add eager field to packages table
ALTER TABLE packages
ADD COLUMN IF NOT EXISTS eager BOOLEAN DEFAULT FALSE;

-- Add eager field to package_versions table
ALTER TABLE package_versions
ADD COLUMN IF NOT EXISTS eager BOOLEAN DEFAULT FALSE;

-- Add index for efficient filtering of eager packages
CREATE INDEX IF NOT EXISTS idx_packages_eager ON packages(eager) WHERE eager = TRUE;

-- Add comment for documentation
COMMENT ON COLUMN packages.eager IS 'Whether this package should be loaded eagerly (included in every request) or lazily (loaded on demand)';
COMMENT ON COLUMN package_versions.eager IS 'Whether this package version should be loaded eagerly (included in every request) or lazily (loaded on demand)';
