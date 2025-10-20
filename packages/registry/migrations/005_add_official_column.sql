-- Migration 003: Add official column for official packages
-- This distinguishes packages from official sources (cursor.directory, anthropic, etc.)

-- Add official column
ALTER TABLE packages
ADD COLUMN IF NOT EXISTS official BOOLEAN DEFAULT FALSE;

-- Create index for official packages
CREATE INDEX IF NOT EXISTS idx_packages_official_flag
ON packages(official) WHERE official = TRUE;

-- Add comment
COMMENT ON COLUMN packages.official IS 'TRUE if package is from official source (cursor.directory, anthropic, etc.)';
