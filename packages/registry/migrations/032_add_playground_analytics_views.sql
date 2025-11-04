-- Migration 032: Add Analytics Views for Playground Author Features
-- Creates materialized views and functions for efficient analytics queries

-- =====================================================
-- Materialized View: Suggested Input Analytics
-- =====================================================
CREATE MATERIALIZED VIEW suggested_input_analytics AS
SELECT
  sti.id as suggested_input_id,
  sti.package_id,
  sti.author_id,
  sti.title,
  sti.category,
  sti.difficulty,
  sti.created_at,

  -- Usage counts
  COUNT(DISTINCT siu.id) as total_clicks,
  COUNT(DISTINCT CASE WHEN siu.completed_test = TRUE THEN siu.id END) as completed_tests,
  COUNT(DISTINCT siu.user_id) as unique_users,

  -- Conversion rate
  CASE
    WHEN COUNT(DISTINCT siu.id) > 0
    THEN (COUNT(DISTINCT CASE WHEN siu.completed_test = TRUE THEN siu.id END)::DECIMAL / COUNT(DISTINCT siu.id)::DECIMAL) * 100
    ELSE 0
  END as conversion_rate,

  -- Time-based metrics
  COUNT(DISTINCT CASE WHEN siu.clicked_at > NOW() - INTERVAL '7 days' THEN siu.id END) as clicks_last_7_days,
  COUNT(DISTINCT CASE WHEN siu.clicked_at > NOW() - INTERVAL '30 days' THEN siu.id END) as clicks_last_30_days,

  -- Latest activity
  MAX(siu.clicked_at) as last_clicked_at

FROM suggested_test_inputs sti
LEFT JOIN suggested_input_usage siu ON sti.id = siu.suggested_input_id
WHERE sti.is_active = TRUE
GROUP BY sti.id, sti.package_id, sti.author_id, sti.title, sti.category, sti.difficulty, sti.created_at;

-- Create index for faster queries
CREATE INDEX idx_suggested_input_analytics_package ON suggested_input_analytics(package_id);
CREATE INDEX idx_suggested_input_analytics_author ON suggested_input_analytics(author_id);

-- =====================================================
-- Materialized View: Package Playground Analytics
-- =====================================================
CREATE MATERIALIZED VIEW package_playground_analytics AS
SELECT
  p.id as package_id,
  p.name as package_name,
  p.author_id,

  -- Playground session counts
  COUNT(DISTINCT ps.id) as total_playground_sessions,
  COUNT(DISTINCT CASE WHEN ps.is_public = TRUE THEN ps.id END) as public_sessions,
  COUNT(DISTINCT CASE WHEN ps.is_featured_by_author = TRUE THEN ps.id END) as featured_sessions,

  -- User engagement
  COUNT(DISTINCT ps.user_id) as unique_playground_users,

  -- Credits and tokens
  SUM(ps.credits_spent) as total_credits_spent,
  SUM(ps.total_tokens) as total_tokens_used,
  AVG(ps.credits_spent) as avg_credits_per_session,

  -- Time-based metrics
  COUNT(DISTINCT CASE WHEN ps.created_at > NOW() - INTERVAL '7 days' THEN ps.id END) as sessions_last_7_days,
  COUNT(DISTINCT CASE WHEN ps.created_at > NOW() - INTERVAL '30 days' THEN ps.id END) as sessions_last_30_days,

  -- Suggested inputs
  COUNT(DISTINCT sti.id) as total_suggested_inputs,
  COUNT(DISTINCT CASE WHEN sti.is_active = TRUE THEN sti.id END) as active_suggested_inputs,

  -- Sharing metrics
  COUNT(DISTINCT CASE WHEN ps.share_token IS NOT NULL THEN ps.id END) as shared_sessions,
  SUM(COALESCE(ps.view_count, 0)) as total_share_views,

  -- Latest activity
  MAX(ps.created_at) as last_playground_session_at

FROM packages p
LEFT JOIN playground_sessions ps ON p.id = ps.package_id
LEFT JOIN suggested_test_inputs sti ON p.id = sti.package_id
GROUP BY p.id, p.name, p.author_id;

-- Create indexes
CREATE INDEX idx_package_playground_analytics_package ON package_playground_analytics(package_id);
CREATE INDEX idx_package_playground_analytics_author ON package_playground_analytics(author_id);

-- =====================================================
-- Materialized View: Author Dashboard Summary
-- =====================================================
CREATE MATERIALIZED VIEW author_dashboard_summary AS
SELECT
  u.id as author_id,
  u.username,

  -- Package counts
  COUNT(DISTINCT p.id) as total_packages,

  -- Playground metrics
  SUM(ppa.total_playground_sessions) as total_playground_sessions,
  SUM(ppa.unique_playground_users) as total_unique_users,
  SUM(ppa.total_credits_spent) as total_credits_spent,
  SUM(ppa.sessions_last_30_days) as sessions_last_30_days,

  -- Suggested inputs metrics
  SUM(ppa.total_suggested_inputs) as total_suggested_inputs,
  SUM(ppa.active_suggested_inputs) as active_suggested_inputs,

  -- Engagement metrics
  SUM(ppa.shared_sessions) as total_shared_sessions,
  SUM(ppa.featured_sessions) as total_featured_sessions,
  SUM(ppa.total_share_views) as total_share_views,

  -- Top performing package
  (
    SELECT p2.name
    FROM packages p2
    LEFT JOIN package_playground_analytics ppa2 ON p2.id = ppa2.package_id
    WHERE p2.author_id = u.id
    ORDER BY ppa2.total_playground_sessions DESC NULLS LAST
    LIMIT 1
  ) as top_package_name

FROM users u
LEFT JOIN packages p ON u.id = p.author_id
LEFT JOIN package_playground_analytics ppa ON p.id = ppa.package_id
GROUP BY u.id, u.username;

-- Create index
CREATE INDEX idx_author_dashboard_summary_author ON author_dashboard_summary(author_id);

-- =====================================================
-- View: Time Series Data for Playground Usage
-- =====================================================
CREATE OR REPLACE VIEW playground_usage_time_series AS
SELECT
  ps.package_id,
  p.author_id,
  DATE(ps.created_at) as date,
  COUNT(DISTINCT ps.id) as sessions_count,
  COUNT(DISTINCT ps.user_id) as unique_users,
  SUM(ps.credits_spent) as credits_spent,
  COUNT(DISTINCT CASE WHEN ps.is_public = TRUE THEN ps.id END) as shared_count
FROM playground_sessions ps
JOIN packages p ON ps.package_id = p.id
WHERE ps.created_at > NOW() - INTERVAL '90 days'
GROUP BY ps.package_id, p.author_id, DATE(ps.created_at)
ORDER BY date DESC;

-- =====================================================
-- View: Suggested Input Click-Through Time Series
-- =====================================================
CREATE OR REPLACE VIEW suggested_input_usage_time_series AS
SELECT
  sti.id as suggested_input_id,
  sti.package_id,
  sti.author_id,
  DATE(siu.clicked_at) as date,
  COUNT(DISTINCT siu.id) as clicks,
  COUNT(DISTINCT CASE WHEN siu.completed_test = TRUE THEN siu.id END) as completions,
  COUNT(DISTINCT siu.user_id) as unique_users
FROM suggested_test_inputs sti
LEFT JOIN suggested_input_usage siu ON sti.id = siu.suggested_input_id
WHERE siu.clicked_at > NOW() - INTERVAL '90 days'
GROUP BY sti.id, sti.package_id, sti.author_id, DATE(siu.clicked_at)
ORDER BY date DESC;

-- =====================================================
-- Function: Refresh Analytics Views
-- =====================================================
CREATE OR REPLACE FUNCTION refresh_playground_analytics()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY suggested_input_analytics;
  REFRESH MATERIALIZED VIEW CONCURRENTLY package_playground_analytics;
  REFRESH MATERIALIZED VIEW CONCURRENTLY author_dashboard_summary;
END;
$$;

-- =====================================================
-- Function: Get Author Analytics Dashboard Data
-- =====================================================
CREATE OR REPLACE FUNCTION get_author_analytics(p_author_id UUID)
RETURNS TABLE(
  -- Summary stats
  total_packages INTEGER,
  total_playground_sessions BIGINT,
  total_unique_users BIGINT,
  total_credits_spent NUMERIC,
  sessions_last_30_days BIGINT,

  -- Suggested inputs
  total_suggested_inputs BIGINT,
  active_suggested_inputs BIGINT,

  -- Engagement
  total_shared_sessions BIGINT,
  total_featured_sessions BIGINT,
  total_share_views NUMERIC,

  top_package_name TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ads.total_packages::INTEGER,
    ads.total_playground_sessions,
    ads.total_unique_users,
    ads.total_credits_spent,
    ads.sessions_last_30_days,
    ads.total_suggested_inputs,
    ads.active_suggested_inputs,
    ads.total_shared_sessions,
    ads.total_featured_sessions,
    ads.total_share_views,
    ads.top_package_name
  FROM author_dashboard_summary ads
  WHERE ads.author_id = p_author_id;
END;
$$;

-- =====================================================
-- Function: Get Package Analytics Details
-- =====================================================
CREATE OR REPLACE FUNCTION get_package_analytics(p_package_id UUID)
RETURNS TABLE(
  package_id UUID,
  package_name TEXT,
  total_playground_sessions BIGINT,
  unique_users BIGINT,
  avg_credits_per_session NUMERIC,
  sessions_last_7_days BIGINT,
  sessions_last_30_days BIGINT,
  suggested_inputs_count BIGINT,
  featured_sessions_count BIGINT,
  shared_sessions_count BIGINT,
  total_share_views NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ppa.package_id,
    ppa.package_name,
    ppa.total_playground_sessions,
    ppa.unique_playground_users,
    ppa.avg_credits_per_session,
    ppa.sessions_last_7_days,
    ppa.sessions_last_30_days,
    ppa.active_suggested_inputs,
    ppa.featured_sessions,
    ppa.shared_sessions,
    ppa.total_share_views
  FROM package_playground_analytics ppa
  WHERE ppa.package_id = p_package_id;
END;
$$;

-- =====================================================
-- Scheduled Job Setup (requires pg_cron extension)
-- =====================================================
-- Note: This requires pg_cron extension to be installed
-- Uncomment and run manually if you have pg_cron:
--
-- SELECT cron.schedule(
--   'refresh-playground-analytics',
--   '0 * * * *',  -- Every hour
--   'SELECT refresh_playground_analytics();'
-- );

-- For manual refresh, run: SELECT refresh_playground_analytics();

-- =====================================================
-- Initial Population
-- =====================================================
-- Populate the materialized views with initial data
SELECT refresh_playground_analytics();
