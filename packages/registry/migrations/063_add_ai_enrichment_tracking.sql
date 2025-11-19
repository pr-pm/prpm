-- Add unified AI enrichment tracking
-- This tracks when packages were last enriched with AI-generated metadata
-- (categories, tags, use cases) in a single operation

-- Add timestamp for when AI enrichment was last performed
ALTER TABLE packages
ADD COLUMN IF NOT EXISTS ai_enrichment_completed_at TIMESTAMP WITH TIME ZONE;

-- Add flag to track if enrichment is needed
ALTER TABLE packages
ADD COLUMN IF NOT EXISTS ai_enrichment_needed BOOLEAN DEFAULT TRUE;

-- Create index for finding packages that need enrichment
CREATE INDEX IF NOT EXISTS idx_packages_needs_enrichment
ON packages (ai_enrichment_needed, total_downloads DESC)
WHERE ai_enrichment_needed = TRUE
  AND visibility = 'public'
  AND deprecated = FALSE;

-- Create index for finding stale enrichments (older than 90 days)
-- Note: Date filtering happens at query time to allow flexible thresholds
CREATE INDEX IF NOT EXISTS idx_packages_stale_enrichment
ON packages (ai_enrichment_completed_at)
WHERE ai_enrichment_completed_at IS NOT NULL;

-- Add comments
COMMENT ON COLUMN packages.ai_enrichment_completed_at IS 'Timestamp when AI enrichment (category, tags, use cases) was last completed';
COMMENT ON COLUMN packages.ai_enrichment_needed IS 'Flag indicating if package needs AI enrichment (set to true on publish, false after enrichment)';

-- Mark existing packages as needing enrichment if they're missing any AI data
UPDATE packages
SET ai_enrichment_needed = TRUE
WHERE (
  category IS NULL
  OR ai_tags IS NULL
  OR array_length(ai_tags, 1) IS NULL
  OR ai_use_cases IS NULL
  OR array_length(ai_use_cases, 1) IS NULL
)
AND visibility = 'public'
AND deprecated = FALSE;
