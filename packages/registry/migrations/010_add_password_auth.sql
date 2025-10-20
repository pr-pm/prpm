-- Migration: Add password authentication support
-- Adds password_hash column to users table for email/password authentication

-- Add password_hash column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

-- Make github_id and github_username nullable (no longer required for all users)
ALTER TABLE users ALTER COLUMN github_id DROP NOT NULL;
ALTER TABLE users ALTER COLUMN github_username DROP NOT NULL;

-- Update constraint: user must have either GitHub OAuth OR password
-- (enforced at application level, not database level for flexibility)

-- Add index for faster password-based lookups
CREATE INDEX IF NOT EXISTS idx_users_password_hash ON users(password_hash) WHERE password_hash IS NOT NULL;
