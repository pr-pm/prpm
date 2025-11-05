-- Add full_content column to packages table
-- This stores the complete prompt content for immediate access without tarball extraction
-- Improves UX by making content instantly available on package pages

-- Add the column
ALTER TABLE packages ADD COLUMN IF NOT EXISTS full_content TEXT;

-- Add full-text search index for searching within prompt content
CREATE INDEX IF NOT EXISTS idx_packages_full_content_search
  ON packages USING gin(to_tsvector('english', coalesce(full_content, '')));

-- Update the comment
COMMENT ON COLUMN packages.full_content IS 'Complete prompt content extracted from package tarball for immediate access. Used for display on package pages and full-text search.';

-- Note: Existing packages will need to be backfilled with a separate script
-- New packages will have this populated automatically during publish
