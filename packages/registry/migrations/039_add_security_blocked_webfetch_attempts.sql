-- Migration: Add security_blocked_webfetch_attempts table
-- Description: Track blocked WebFetch attempts for security monitoring and abuse detection
-- SECURITY: This table records all attempts to WebFetch non-allowlisted domains

-- Create blocked WebFetch attempts table
CREATE TABLE IF NOT EXISTS security_blocked_webfetch_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  package_id UUID NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
  session_id UUID REFERENCES playground_sessions(id) ON DELETE SET NULL,
  blocked_url TEXT NOT NULL,
  tool_input JSONB,
  blocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance and monitoring queries
CREATE INDEX idx_blocked_webfetch_user_id ON security_blocked_webfetch_attempts(user_id);
CREATE INDEX idx_blocked_webfetch_package_id ON security_blocked_webfetch_attempts(package_id);
CREATE INDEX idx_blocked_webfetch_blocked_at ON security_blocked_webfetch_attempts(blocked_at DESC);
CREATE INDEX idx_blocked_webfetch_url ON security_blocked_webfetch_attempts(blocked_url);

-- Composite index for common monitoring queries
CREATE INDEX idx_blocked_webfetch_user_time ON security_blocked_webfetch_attempts(user_id, blocked_at DESC);

-- Add comment for documentation
COMMENT ON TABLE security_blocked_webfetch_attempts IS
  'SECURITY: Records all blocked WebFetch attempts to non-allowlisted domains. Used for abuse detection and security monitoring.';

COMMENT ON COLUMN security_blocked_webfetch_attempts.blocked_url IS
  'The URL that was blocked due to domain not being in ALLOWED_WEBFETCH_DOMAINS allowlist';

COMMENT ON COLUMN security_blocked_webfetch_attempts.tool_input IS
  'Full tool input including URL and other parameters for forensic analysis';
