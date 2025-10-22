-- Add Nango connection ID to users table
-- This allows us to store the Nango connection ID for making API calls to GitHub

ALTER TABLE users ADD COLUMN IF NOT EXISTS nango_connection_id VARCHAR(255);

-- Add index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_users_nango_connection_id ON users(nango_connection_id);

-- Add comment
COMMENT ON COLUMN users.nango_connection_id IS 'Nango connection ID for making API calls to GitHub';
