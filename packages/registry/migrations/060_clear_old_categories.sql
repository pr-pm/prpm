-- Clear all existing category values to prepare for AI re-categorization
-- Old categories don't align with new taxonomy, so we'll let AI re-categorize all packages

-- Clear all category values (preserves user tags, only clears category column)
UPDATE packages
SET category = NULL
WHERE category IS NOT NULL;

-- Add comment explaining the strategy
COMMENT ON COLUMN packages.category IS 'Package category from new taxonomy (AI-suggested for optimal categorization)';

-- Log the action
DO $$
DECLARE
  cleared_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO cleared_count
  FROM packages
  WHERE category IS NULL;

  RAISE NOTICE 'Cleared categories for re-categorization. Total packages ready: %', cleared_count;
END $$;
