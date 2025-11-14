/**
 * Anonymous Playground Usage Tracking
 *
 * Tracks anonymous playground usage to enforce:
 * - 1 free playground run per month per anonymous user
 * - Identified by IP address + browser fingerprint
 *
 * After the first use, anonymous users must register to continue.
 */

-- Create table to track anonymous playground usage
CREATE TABLE IF NOT EXISTS anonymous_playground_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fingerprint_hash VARCHAR(64) NOT NULL, -- SHA-256 hash of session fingerprint
  ip_address INET NOT NULL, -- Client IP address
  ip_subnet VARCHAR(50) NOT NULL, -- Privacy-preserving IP subnet (192.168.1.0)
  user_agent_normalized VARCHAR(255) NOT NULL, -- Normalized browser/OS

  -- Usage tracking
  first_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  usage_count INTEGER DEFAULT 1,
  current_month VARCHAR(7) NOT NULL, -- Format: YYYY-MM (e.g., "2025-11")

  -- Request details
  package_id UUID, -- Which package they tested (optional for analytics)
  model VARCHAR(50), -- Which model they used

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Unique constraint: one entry per fingerprint per month
  UNIQUE(fingerprint_hash, current_month)
);

-- Indexes for efficient querying
CREATE INDEX idx_anonymous_usage_fingerprint ON anonymous_playground_usage(fingerprint_hash, current_month);
CREATE INDEX idx_anonymous_usage_ip_subnet ON anonymous_playground_usage(ip_subnet, current_month);
CREATE INDEX idx_anonymous_usage_current_month ON anonymous_playground_usage(current_month);
CREATE INDEX idx_anonymous_usage_created_at ON anonymous_playground_usage(created_at DESC);

-- Index for cleanup
CREATE INDEX idx_anonymous_usage_last_used ON anonymous_playground_usage(last_used_at);

-- Function to check if anonymous user has quota
CREATE OR REPLACE FUNCTION check_anonymous_playground_quota(
  p_fingerprint_hash VARCHAR(64),
  p_current_month VARCHAR(7)
)
RETURNS TABLE(
  has_quota BOOLEAN,
  usage_count INTEGER,
  first_used_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    CASE
      WHEN apu.usage_count IS NULL THEN TRUE  -- No usage yet, allow
      WHEN apu.usage_count >= 1 THEN FALSE    -- Already used this month, deny
      ELSE TRUE
    END as has_quota,
    COALESCE(apu.usage_count, 0) as usage_count,
    apu.first_used_at
  FROM (
    SELECT 1 -- Dummy to ensure at least one row
  ) dummy
  LEFT JOIN anonymous_playground_usage apu
    ON apu.fingerprint_hash = p_fingerprint_hash
    AND apu.current_month = p_current_month;
END;
$$ LANGUAGE plpgsql;

-- Function to record anonymous playground usage
CREATE OR REPLACE FUNCTION record_anonymous_playground_usage(
  p_fingerprint_hash VARCHAR(64),
  p_ip_address INET,
  p_ip_subnet VARCHAR(50),
  p_user_agent_normalized VARCHAR(255),
  p_current_month VARCHAR(7),
  p_package_id UUID DEFAULT NULL,
  p_model VARCHAR(50) DEFAULT NULL
)
RETURNS TABLE(
  success BOOLEAN,
  usage_count INTEGER,
  message TEXT
) AS $$
DECLARE
  v_usage_count INTEGER;
BEGIN
  -- Try to insert new record
  INSERT INTO anonymous_playground_usage (
    fingerprint_hash,
    ip_address,
    ip_subnet,
    user_agent_normalized,
    current_month,
    package_id,
    model,
    usage_count
  ) VALUES (
    p_fingerprint_hash,
    p_ip_address,
    p_ip_subnet,
    p_user_agent_normalized,
    p_current_month,
    p_package_id,
    p_model,
    1
  )
  ON CONFLICT (fingerprint_hash, current_month) DO UPDATE
  SET
    last_used_at = NOW(),
    usage_count = anonymous_playground_usage.usage_count + 1,
    package_id = COALESCE(p_package_id, anonymous_playground_usage.package_id),
    model = COALESCE(p_model, anonymous_playground_usage.model)
  RETURNING anonymous_playground_usage.usage_count INTO v_usage_count;

  RETURN QUERY SELECT
    TRUE as success,
    v_usage_count as usage_count,
    'Usage recorded' as message;

EXCEPTION WHEN OTHERS THEN
  RETURN QUERY SELECT
    FALSE as success,
    0 as usage_count,
    SQLERRM as message;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old anonymous usage records (keep 6 months)
CREATE OR REPLACE FUNCTION cleanup_old_anonymous_usage()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete records older than 6 months
  DELETE FROM anonymous_playground_usage
  WHERE last_used_at < NOW() - INTERVAL '6 months';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create view for analytics
CREATE OR REPLACE VIEW anonymous_playground_stats AS
SELECT
  current_month,
  COUNT(*) as unique_users,
  SUM(usage_count) as total_attempts,
  COUNT(CASE WHEN usage_count > 1 THEN 1 END) as users_exceeded_quota,
  AVG(usage_count) as avg_attempts_per_user,
  COUNT(DISTINCT ip_subnet) as unique_ip_subnets
FROM anonymous_playground_usage
GROUP BY current_month
ORDER BY current_month DESC;

COMMENT ON TABLE anonymous_playground_usage IS 'Tracks anonymous playground usage to enforce 1 free run per month';
COMMENT ON COLUMN anonymous_playground_usage.fingerprint_hash IS 'SHA-256 hash of browser fingerprint';
COMMENT ON COLUMN anonymous_playground_usage.ip_subnet IS 'Privacy-preserving IP subnet (e.g., 192.168.1.0)';
COMMENT ON COLUMN anonymous_playground_usage.current_month IS 'Month of usage in YYYY-MM format';
COMMENT ON VIEW anonymous_playground_stats IS 'Monthly statistics of anonymous playground usage';
