-- Migration: Add full-text search index for hybrid AI search
-- This enables efficient keyword search alongside vector similarity search

-- Create GIN index for full-text search on packages
-- Indexes: name, description, and tags
CREATE INDEX IF NOT EXISTS packages_fts_idx ON packages
USING gin(to_tsvector('english',
  name || ' ' ||
  COALESCE(description, '') || ' ' ||
  COALESCE(array_to_string(tags, ' '), '')
));

-- Add comment explaining the index
COMMENT ON INDEX packages_fts_idx IS 'Full-text search index for hybrid AI search - enables keyword matching alongside semantic vector search';

-- Analyze the table to update statistics for the query planner
ANALYZE packages;
