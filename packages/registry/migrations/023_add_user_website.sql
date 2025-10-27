-- Migration: Add website field to users table
-- Description: Allow users to add their website URL to their profile

ALTER TABLE users ADD COLUMN IF NOT EXISTS website VARCHAR(500);

COMMENT ON COLUMN users.website IS 'User website or portfolio URL';

-- Create index for users with websites (for potential future queries)
CREATE INDEX idx_users_website ON users(website) WHERE website IS NOT NULL;
