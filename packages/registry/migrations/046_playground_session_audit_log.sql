/**
 * Playground Session Audit Log
 *
 * Creates audit logging for playground sessions to track:
 * - Session creation and validation attempts
 * - Fingerprint mismatches (potential security issues)
 * - Rate limit violations
 * - Token rotations
 *
 * This provides security monitoring and helps detect abuse patterns.
 * Sessions themselves are stored in Redis for performance, but security
 * events are logged to PostgreSQL for persistent auditing.
 */

-- Create playground_session_audit table
CREATE TABLE IF NOT EXISTS playground_session_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_token_hash VARCHAR(64) NOT NULL, -- SHA-256 hash of session token (for privacy)
  event_type VARCHAR(50) NOT NULL, -- 'created', 'validated', 'fingerprint_mismatch', 'rate_limited', 'rotated', 'revoked'
  event_details JSONB, -- Additional context (fingerprint components, error details, etc.)
  ip_address INET, -- Client IP address
  user_agent TEXT, -- User agent string
  fingerprint_hash VARCHAR(64), -- Session fingerprint hash
  request_path VARCHAR(255), -- API endpoint that triggered the event
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX idx_playground_session_audit_user ON playground_session_audit(user_id, created_at DESC);
CREATE INDEX idx_playground_session_audit_event_type ON playground_session_audit(event_type, created_at DESC);
CREATE INDEX idx_playground_session_audit_fingerprint ON playground_session_audit(fingerprint_hash, created_at DESC);
CREATE INDEX idx_playground_session_audit_created_at ON playground_session_audit(created_at DESC);

-- Index for finding suspicious activity
CREATE INDEX idx_playground_session_audit_security_events ON playground_session_audit(event_type, user_id, created_at DESC)
  WHERE event_type IN ('fingerprint_mismatch', 'rate_limited');

-- Create function to clean up old audit logs (keep 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_session_audit_logs()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM playground_session_audit
  WHERE created_at < NOW() - INTERVAL '90 days';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Add comment for documentation
COMMENT ON TABLE playground_session_audit IS 'Audit log for playground session security events';
COMMENT ON COLUMN playground_session_audit.session_token_hash IS 'SHA-256 hash of session token (not the actual token)';
COMMENT ON COLUMN playground_session_audit.event_details IS 'JSONB containing event-specific details like fingerprint components, rate limit info, etc.';

-- Create view for security monitoring
CREATE OR REPLACE VIEW playground_security_events AS
SELECT
  psa.id,
  psa.user_id,
  u.username,
  u.email,
  psa.event_type,
  psa.event_details,
  psa.ip_address,
  psa.fingerprint_hash,
  psa.created_at,
  -- Count recent events for this user
  (SELECT COUNT(*)
   FROM playground_session_audit psa2
   WHERE psa2.user_id = psa.user_id
     AND psa2.event_type IN ('fingerprint_mismatch', 'rate_limited')
     AND psa2.created_at > NOW() - INTERVAL '1 hour'
  ) AS suspicious_events_last_hour
FROM playground_session_audit psa
LEFT JOIN users u ON psa.user_id = u.id
WHERE psa.event_type IN ('fingerprint_mismatch', 'rate_limited')
ORDER BY psa.created_at DESC;

COMMENT ON VIEW playground_security_events IS 'View of security-related playground events for monitoring';
