/**
 * Remove scope column from collections table
 *
 * Collections should always be globally unique by name_slug + version.
 * The scope column is redundant since all collections use the same namespace.
 */

-- Drop any views that might depend on the scope column
DROP VIEW IF EXISTS collection_details CASCADE;
DROP VIEW IF EXISTS collection_stats CASCADE;

-- Drop existing unique constraint that includes scope
ALTER TABLE collections DROP CONSTRAINT IF EXISTS collections_scope_name_slug_version_key;

-- Update indexes to remove scope references
DROP INDEX IF EXISTS idx_collections_scope_name_slug;

-- Drop the scope column (CASCADE to drop any remaining dependencies)
ALTER TABLE collections DROP COLUMN IF EXISTS scope CASCADE;

-- Add new unique constraint without scope
ALTER TABLE collections ADD CONSTRAINT collections_name_slug_version_key UNIQUE (name_slug, version);

-- Add index on just name_slug for lookups
CREATE INDEX IF NOT EXISTS idx_collections_name_slug ON collections(name_slug);
