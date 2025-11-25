-- Add AI-suggested tags column (separate from user tags)
-- User tags remain in 'tags' column
-- AI tags go in new 'ai_tags' column
-- Apps can merge them for display: tags || ai_tags

ALTER TABLE packages
  ADD COLUMN IF NOT EXISTS ai_tags TEXT[] DEFAULT '{}';

-- Add comment
COMMENT ON COLUMN packages.ai_tags IS 'AI-suggested tags (separate from user-specified tags in tags column)';

-- Create index for AI tags searches
CREATE INDEX IF NOT EXISTS idx_packages_ai_tags ON packages USING GIN (ai_tags);

-- Create a helper view that merges both tag sources
CREATE OR REPLACE VIEW package_all_tags AS
SELECT 
  id,
  name,
  tags as user_tags,
  ai_tags,
  -- Merge and deduplicate tags
  array(
    SELECT DISTINCT unnest(COALESCE(tags, '{}') || COALESCE(ai_tags, '{}'))
  ) as all_tags
FROM packages;

COMMENT ON VIEW package_all_tags IS 'Merges user tags and AI tags, removing duplicates';
