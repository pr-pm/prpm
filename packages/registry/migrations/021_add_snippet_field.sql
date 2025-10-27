-- Add snippet field to packages table for preview content in modals
-- This stores the first ~2000 characters of the main prompt file for quick preview

ALTER TABLE packages ADD COLUMN IF NOT EXISTS snippet TEXT;

-- Add index for snippet searches if needed in the future
CREATE INDEX IF NOT EXISTS idx_packages_snippet ON packages USING gin(to_tsvector('english', snippet));

COMMENT ON COLUMN packages.snippet IS 'Preview snippet of the prompt content (first ~2000 chars) for quick display in modals and cards';
