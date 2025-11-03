-- Migration 029: Add Cost Tracking and User Throttling
-- Description: Adds API cost tracking, user cost limits, and throttling for financial protection
-- Author: System
-- Date: 2025-11-03

-- =====================================================
-- 1. ADD COST TRACKING TO PLAYGROUND_USAGE
-- =====================================================
-- Track actual API costs for each request

ALTER TABLE playground_usage
  ADD COLUMN IF NOT EXISTS estimated_api_cost DECIMAL(10, 6) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS actual_input_tokens INTEGER,
  ADD COLUMN IF NOT EXISTS actual_output_tokens INTEGER;

COMMENT ON COLUMN playground_usage.estimated_api_cost IS 'Estimated API cost in USD for this request (based on model pricing)';
COMMENT ON COLUMN playground_usage.actual_input_tokens IS 'Actual input tokens reported by API (if available)';
COMMENT ON COLUMN playground_usage.actual_output_tokens IS 'Actual output tokens reported by API (if available)';

-- =====================================================
-- 2. ADD COST TRACKING TO USERS TABLE
-- =====================================================
-- Track monthly API costs per user for throttling

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS current_month_api_cost DECIMAL(10, 4) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS current_month_cost_reset_at TIMESTAMP WITH TIME ZONE DEFAULT DATE_TRUNC('month', NOW() + INTERVAL '1 month'),
  ADD COLUMN IF NOT EXISTS is_throttled BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS throttled_reason TEXT,
  ADD COLUMN IF NOT EXISTS throttled_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS lifetime_api_cost DECIMAL(12, 4) DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_users_throttled ON users(is_throttled) WHERE is_throttled = TRUE;
CREATE INDEX IF NOT EXISTS idx_users_cost_reset ON users(current_month_cost_reset_at);

COMMENT ON COLUMN users.current_month_api_cost IS 'Total API costs incurred this month in USD';
COMMENT ON COLUMN users.current_month_cost_reset_at IS 'When the monthly cost counter resets';
COMMENT ON COLUMN users.is_throttled IS 'Whether user is currently throttled for exceeding cost limits';
COMMENT ON COLUMN users.throttled_reason IS 'Reason for throttling (e.g., "Exceeded $5 monthly API cost limit")';
COMMENT ON COLUMN users.lifetime_api_cost IS 'Total API costs incurred by this user across all time';

-- =====================================================
-- 3. CREATE USER COST ALERTS TABLE
-- =====================================================
-- Track when users are approaching or exceeding cost limits

CREATE TABLE IF NOT EXISTS user_cost_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,

  -- Alert details
  alert_type VARCHAR(50) NOT NULL CHECK (
    alert_type IN ('warning_50', 'warning_75', 'warning_90', 'limit_exceeded', 'throttled')
  ),
  threshold_amount DECIMAL(10, 4) NOT NULL,
  current_amount DECIMAL(10, 4) NOT NULL,

  -- Status
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE,

  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_user_cost_alerts_user ON user_cost_alerts(user_id, created_at DESC);
CREATE INDEX idx_user_cost_alerts_type ON user_cost_alerts(alert_type, sent_at DESC);
CREATE INDEX idx_user_cost_alerts_unresolved ON user_cost_alerts(user_id, alert_type)
  WHERE resolved_at IS NULL;

COMMENT ON TABLE user_cost_alerts IS 'Tracks cost alerts sent to users for monitoring API usage';
COMMENT ON COLUMN user_cost_alerts.alert_type IS 'Type of alert: warning_50 (50% of limit), warning_75 (75%), warning_90 (90%), limit_exceeded, throttled';
COMMENT ON COLUMN user_cost_alerts.threshold_amount IS 'The cost threshold that triggered this alert';

-- =====================================================
-- 4. CREATE COST LIMITS CONFIGURATION TABLE
-- =====================================================
-- Configurable cost limits per user tier

CREATE TABLE IF NOT EXISTS cost_limits_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Tier configuration
  tier_name VARCHAR(50) NOT NULL UNIQUE CHECK (
    tier_name IN ('free', 'prpm_plus_individual', 'prpm_plus_org', 'unlimited')
  ),

  -- Limits
  monthly_cost_limit DECIMAL(10, 4) NOT NULL,
  daily_cost_limit DECIMAL(10, 4),
  hourly_request_limit INTEGER,

  -- Actions when exceeded
  throttle_on_exceed BOOLEAN DEFAULT TRUE,
  alert_at_percent INTEGER[] DEFAULT ARRAY[50, 75, 90],

  -- Metadata
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default limits
INSERT INTO cost_limits_config (tier_name, monthly_cost_limit, daily_cost_limit, hourly_request_limit, description)
VALUES
  ('free', 0.50, 0.10, 10, 'Free tier: 5 trial credits, max $0.50/month API cost'),
  ('prpm_plus_individual', 5.00, 1.00, 100, 'PRPM+ Individual: $6/month subscription, max $5/month API cost (83% margin target)'),
  ('prpm_plus_org', 2.50, 0.50, 100, 'PRPM+ Org Member: $3/month subscription, max $2.50/month API cost (83% margin target)'),
  ('unlimited', 999999.99, NULL, NULL, 'Admin/unlimited tier')
ON CONFLICT (tier_name) DO NOTHING;

CREATE INDEX idx_cost_limits_tier ON cost_limits_config(tier_name) WHERE is_active = TRUE;

COMMENT ON TABLE cost_limits_config IS 'Configurable cost limits per subscription tier';
COMMENT ON COLUMN cost_limits_config.monthly_cost_limit IS 'Maximum API cost per month in USD before throttling';
COMMENT ON COLUMN cost_limits_config.throttle_on_exceed IS 'Whether to automatically throttle user when limit exceeded';

-- =====================================================
-- 5. CREATE COST ANALYTICS MATERIALIZED VIEW
-- =====================================================
-- Pre-aggregated cost analytics for admin dashboard

CREATE MATERIALIZED VIEW IF NOT EXISTS user_cost_analytics AS
SELECT
  u.id AS user_id,
  u.email,
  u.prpm_plus_status,

  -- Current month
  u.current_month_api_cost,
  COUNT(CASE WHEN pu.created_at >= DATE_TRUNC('month', NOW()) THEN 1 END) AS current_month_requests,
  AVG(CASE WHEN pu.created_at >= DATE_TRUNC('month', NOW()) THEN pu.estimated_api_cost END) AS avg_cost_per_request,

  -- Lifetime
  u.lifetime_api_cost,
  COUNT(pu.id) AS total_requests,

  -- Revenue vs Cost
  CASE
    WHEN u.prpm_plus_status = 'active' THEN
      CASE
        WHEN EXISTS (
          SELECT 1 FROM organization_members om
          JOIN organizations o ON om.org_id = o.id
          WHERE om.user_id = u.id AND o.is_verified = TRUE
        ) THEN 3.00  -- Org member: $3/month
        ELSE 6.00     -- Individual: $6/month
      END
    ELSE 0.00
  END AS monthly_revenue,

  -- Margin calculation
  CASE
    WHEN u.current_month_api_cost > 0 THEN
      ROUND(((
        CASE
          WHEN u.prpm_plus_status = 'active' THEN
            CASE
              WHEN EXISTS (
                SELECT 1 FROM organization_members om
                JOIN organizations o ON om.org_id = o.id
                WHERE om.user_id = u.id AND o.is_verified = TRUE
              ) THEN 3.00
              ELSE 6.00
            END
          ELSE 0.00
        END - u.current_month_api_cost
      ) / NULLIF(
        CASE
          WHEN u.prpm_plus_status = 'active' THEN
            CASE
              WHEN EXISTS (
                SELECT 1 FROM organization_members om
                JOIN organizations o ON om.org_id = o.id
                WHERE om.user_id = u.id AND o.is_verified = TRUE
              ) THEN 3.00
              ELSE 6.00
            END
          ELSE 0.00
        END, 0
      )) * 100, 2)
    ELSE NULL
  END AS current_margin_percent,

  -- Risk flags
  u.is_throttled,
  CASE
    WHEN u.current_month_api_cost > 5.00 THEN 'high_risk'
    WHEN u.current_month_api_cost > 2.50 THEN 'medium_risk'
    WHEN u.current_month_api_cost > 1.00 THEN 'low_risk'
    ELSE 'safe'
  END AS risk_level,

  -- Timestamps
  MAX(pu.created_at) AS last_request_at,
  u.created_at AS user_created_at

FROM users u
LEFT JOIN playground_usage pu ON pu.user_id = u.id
WHERE u.current_month_api_cost > 0 OR u.prpm_plus_status IS NOT NULL
GROUP BY u.id, u.email, u.prpm_plus_status, u.current_month_api_cost, u.lifetime_api_cost, u.is_throttled, u.created_at;

CREATE UNIQUE INDEX idx_user_cost_analytics_user ON user_cost_analytics(user_id);
CREATE INDEX idx_user_cost_analytics_risk ON user_cost_analytics(risk_level, current_month_api_cost DESC);
CREATE INDEX idx_user_cost_analytics_margin ON user_cost_analytics(current_margin_percent ASC NULLS LAST);

COMMENT ON MATERIALIZED VIEW user_cost_analytics IS 'Pre-aggregated cost and margin analytics per user (refresh hourly via cron)';

-- =====================================================
-- 6. CREATE FUNCTION TO REFRESH ANALYTICS
-- =====================================================

CREATE OR REPLACE FUNCTION refresh_user_cost_analytics()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY user_cost_analytics;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION refresh_user_cost_analytics() IS 'Refresh the user_cost_analytics materialized view (run hourly via cron)';

-- =====================================================
-- 7. CREATE FUNCTION TO RESET MONTHLY COSTS
-- =====================================================
-- Cron job to reset monthly cost counters

CREATE OR REPLACE FUNCTION reset_monthly_api_costs()
RETURNS INTEGER AS $$
DECLARE
  reset_count INTEGER;
BEGIN
  UPDATE users
  SET
    current_month_api_cost = 0,
    current_month_cost_reset_at = DATE_TRUNC('month', NOW() + INTERVAL '1 month'),
    updated_at = NOW()
  WHERE current_month_cost_reset_at <= NOW();

  GET DIAGNOSTICS reset_count = ROW_COUNT;

  RETURN reset_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION reset_monthly_api_costs() IS 'Reset monthly API cost counters (run daily via cron)';

-- =====================================================
-- 8. CREATE FUNCTION TO CHECK AND THROTTLE USERS
-- =====================================================

CREATE OR REPLACE FUNCTION check_and_throttle_user(p_user_id UUID, p_api_cost DECIMAL)
RETURNS BOOLEAN AS $$
DECLARE
  v_tier_name VARCHAR(50);
  v_cost_limit DECIMAL(10, 4);
  v_current_cost DECIMAL(10, 4);
  v_should_throttle BOOLEAN;
BEGIN
  -- Determine user tier
  SELECT
    CASE
      WHEN prpm_plus_status = 'active' THEN
        CASE
          WHEN EXISTS (
            SELECT 1 FROM organization_members om
            JOIN organizations o ON om.org_id = o.id
            WHERE om.user_id = p_user_id AND o.is_verified = TRUE
          ) THEN 'prpm_plus_org'
          ELSE 'prpm_plus_individual'
        END
      ELSE 'free'
    END INTO v_tier_name
  FROM users
  WHERE id = p_user_id;

  -- Get cost limit for tier
  SELECT monthly_cost_limit, throttle_on_exceed
  INTO v_cost_limit, v_should_throttle
  FROM cost_limits_config
  WHERE tier_name = v_tier_name AND is_active = TRUE;

  -- Get current month cost
  SELECT current_month_api_cost INTO v_current_cost
  FROM users
  WHERE id = p_user_id;

  -- Check if new cost would exceed limit
  IF (v_current_cost + p_api_cost) > v_cost_limit AND v_should_throttle THEN
    -- Throttle user
    UPDATE users
    SET
      is_throttled = TRUE,
      throttled_reason = FORMAT('Exceeded %s monthly API cost limit ($%s)', v_tier_name, v_cost_limit),
      throttled_at = NOW()
    WHERE id = p_user_id;

    -- Create alert
    INSERT INTO user_cost_alerts (user_id, alert_type, threshold_amount, current_amount)
    VALUES (p_user_id, 'throttled', v_cost_limit, v_current_cost + p_api_cost);

    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION check_and_throttle_user(UUID, DECIMAL) IS 'Check if user should be throttled based on API costs';

-- Log migration completion
DO $$
BEGIN
  RAISE NOTICE 'Migration 029 completed successfully!';
  RAISE NOTICE 'Added cost tracking, throttling, and analytics infrastructure';
  RAISE NOTICE 'Default cost limits: Free $0.50/mo, Individual $5/mo, Org $2.50/mo';
END $$;
