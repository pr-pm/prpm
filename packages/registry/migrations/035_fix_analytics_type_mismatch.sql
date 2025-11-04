-- Migration 035: Fix Analytics Type Mismatch
-- Fixes type mismatch between author_dashboard_summary view and get_author_analytics function
-- Changes SUM() results from NUMERIC to BIGINT by casting

-- Drop the existing function
DROP FUNCTION IF EXISTS get_author_analytics(UUID);

-- Recreate the function with proper casting to match the materialized view types
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
    COALESCE(ads.total_playground_sessions, 0)::BIGINT,
    COALESCE(ads.total_unique_users, 0)::BIGINT,
    COALESCE(ads.total_credits_spent, 0)::NUMERIC,
    COALESCE(ads.sessions_last_30_days, 0)::BIGINT,
    COALESCE(ads.total_suggested_inputs, 0)::BIGINT,
    COALESCE(ads.active_suggested_inputs, 0)::BIGINT,
    COALESCE(ads.total_shared_sessions, 0)::BIGINT,
    COALESCE(ads.total_featured_sessions, 0)::BIGINT,
    COALESCE(ads.total_share_views, 0)::NUMERIC,
    ads.top_package_name
  FROM author_dashboard_summary ads
  WHERE ads.author_id = p_author_id;
END;
$$;
