-- Add AI-generated use cases to packages table
-- This will store AI-generated practical use cases for each package
-- to help users understand when and how to use the package

-- Add use_cases column to packages table
ALTER TABLE packages
ADD COLUMN IF NOT EXISTS ai_use_cases TEXT[];

-- Add index for packages without use cases (for cron job queries)
CREATE INDEX IF NOT EXISTS idx_packages_missing_use_cases
ON packages ((ai_use_cases IS NULL OR array_length(ai_use_cases, 1) IS NULL))
WHERE ai_use_cases IS NULL OR array_length(ai_use_cases, 1) IS NULL;

-- Add timestamp for when use cases were last generated
ALTER TABLE packages
ADD COLUMN IF NOT EXISTS ai_use_cases_generated_at TIMESTAMP WITH TIME ZONE;

-- Create index for finding packages that need regeneration (older than 30 days)
CREATE INDEX IF NOT EXISTS idx_packages_use_cases_stale
ON packages (ai_use_cases_generated_at)
WHERE ai_use_cases_generated_at IS NOT NULL;

-- Add comment to explain the column
COMMENT ON COLUMN packages.ai_use_cases IS 'AI-generated use cases (3-5 practical scenarios) for the package';
COMMENT ON COLUMN packages.ai_use_cases_generated_at IS 'Timestamp when AI use cases were last generated';
