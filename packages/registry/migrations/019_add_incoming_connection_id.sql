-- Add incoming_connection_id to users table
-- This stores the NEW connection ID from Nango until we're ready to switch to it
-- The stored nango_connection_id remains unchanged until we delete the old connection

ALTER TABLE users ADD COLUMN IF NOT EXISTS incoming_connection_id VARCHAR(255);

-- Add index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_users_incoming_connection_id ON users(incoming_connection_id);

-- Add comment
COMMENT ON COLUMN users.incoming_connection_id IS 'Temporary storage for new Nango connection ID until old connection is deleted';
