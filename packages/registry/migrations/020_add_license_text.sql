-- Add license_text column to store full license content
-- This ensures proper attribution and compliance with open-source licenses

ALTER TABLE packages ADD COLUMN IF NOT EXISTS license_text TEXT;
ALTER TABLE packages ADD COLUMN IF NOT EXISTS license_url VARCHAR(500);

-- Add index for license field for filtering
CREATE INDEX IF NOT EXISTS idx_packages_license ON packages(license);

COMMENT ON COLUMN packages.license_text IS 'Full text of the package license (e.g., MIT, Apache-2.0, etc.) for proper attribution';
COMMENT ON COLUMN packages.license_url IS 'URL to the license file in the repository';
