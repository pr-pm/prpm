-- Migration 030: Add Shared Results Analytics
-- Description: Enhances shared playground results with analytics and discovery
-- Author: AI Assistant
-- Date: 2025-11-04

-- =====================================================
-- 1. ADD ANALYTICS FIELDS TO PLAYGROUND_SESSIONS
-- =====================================================

-- Add view tracking for shared results
ALTER TABLE playground_sessions
  ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS unique_viewers INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_viewed_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS shared_at TIMESTAMP WITH TIME ZONE;

-- Add helpful rating fields
ALTER TABLE playground_sessions
  ADD COLUMN IF NOT EXISTS helpful_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS not_helpful_count INTEGER DEFAULT 0;

-- Index for discovering popular shared results
CREATE INDEX IF NOT EXISTS idx_playground_sessions_public_popular
  ON playground_sessions(package_id, view_count DESC)
  WHERE is_public = TRUE;

CREATE INDEX IF NOT EXISTS idx_playground_sessions_public_recent
  ON playground_sessions(package_id, shared_at DESC)
  WHERE is_public = TRUE AND shared_at IS NOT NULL;

COMMENT ON COLUMN playground_sessions.view_count IS 'Total number of views on this shared result';
COMMENT ON COLUMN playground_sessions.unique_viewers IS 'Number of unique users who viewed this result';
COMMENT ON COLUMN playground_sessions.last_viewed_at IS 'Last time someone viewed this shared result';
COMMENT ON COLUMN playground_sessions.shared_at IS 'When this result was first shared publicly';
COMMENT ON COLUMN playground_sessions.helpful_count IS 'Number of users who found this result helpful';
COMMENT ON COLUMN playground_sessions.not_helpful_count IS 'Number of users who found this result not helpful';

-- =====================================================
-- 2. CREATE SHARED_RESULTS_VIEWS TABLE
-- =====================================================

-- Track individual views for analytics
CREATE TABLE IF NOT EXISTS shared_result_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES playground_sessions(id) ON DELETE CASCADE NOT NULL,
  viewer_user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- NULL if anonymous

  -- View metadata
  ip_hash VARCHAR(64), -- Hashed IP for unique counting without storing PII
  user_agent TEXT,
  referrer TEXT,

  -- Engagement tracking
  time_spent_seconds INTEGER,
  was_helpful BOOLEAN, -- NULL = not rated, TRUE = helpful, FALSE = not helpful
  feedback_text TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_shared_result_views_session ON shared_result_views(session_id, created_at DESC);
CREATE INDEX idx_shared_result_views_viewer ON shared_result_views(viewer_user_id)
  WHERE viewer_user_id IS NOT NULL;
CREATE INDEX idx_shared_result_views_ip ON shared_result_views(session_id, ip_hash);

COMMENT ON TABLE shared_result_views IS 'Tracks individual views and engagement with shared playground results';
COMMENT ON COLUMN shared_result_views.ip_hash IS 'SHA-256 hash of IP address for unique counting without storing PII';

-- =====================================================
-- 3. CREATE MATERIALIZED VIEW FOR TOP RESULTS
-- =====================================================

-- Materialized view for fast discovery of top shared results per package
CREATE MATERIALIZED VIEW IF NOT EXISTS top_shared_results AS
SELECT
  ps.package_id,
  ps.id as session_id,
  ps.share_token,
  ps.package_name,
  ps.package_version,
  ps.model,
  ps.view_count,
  ps.helpful_count,
  ps.not_helpful_count,
  ps.shared_at,
  ps.created_at,
  -- Calculate helpfulness ratio (avoid division by zero)
  CASE
    WHEN (ps.helpful_count + ps.not_helpful_count) > 0
    THEN ROUND(ps.helpful_count::NUMERIC / (ps.helpful_count + ps.not_helpful_count), 2)
    ELSE 0
  END as helpfulness_ratio,
  -- Extract first user input and assistant response
  ps.conversation->0->>'content' as user_input,
  ps.conversation->1->>'content' as assistant_response,
  ps.credits_spent,
  ps.total_tokens,
  ROW_NUMBER() OVER (
    PARTITION BY ps.package_id
    ORDER BY ps.view_count DESC, ps.helpful_count DESC, ps.shared_at DESC
  ) as rank_by_popularity
FROM playground_sessions ps
WHERE ps.is_public = TRUE
  AND ps.share_token IS NOT NULL
  AND ps.shared_at IS NOT NULL
  AND jsonb_array_length(ps.conversation) >= 2; -- Must have at least one exchange

CREATE UNIQUE INDEX idx_top_shared_results_session ON top_shared_results(session_id);
CREATE INDEX idx_top_shared_results_package ON top_shared_results(package_id, rank_by_popularity);
CREATE INDEX idx_top_shared_results_popular ON top_shared_results(view_count DESC);
CREATE INDEX idx_top_shared_results_helpful ON top_shared_results(helpfulness_ratio DESC)
  WHERE (helpful_count + not_helpful_count) >= 3; -- At least 3 votes for credibility

COMMENT ON MATERIALIZED VIEW top_shared_results IS 'Fast lookup for top shared playground results per package';

-- =====================================================
-- 4. FUNCTION TO REFRESH TOP RESULTS
-- =====================================================

-- Function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_top_shared_results()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY top_shared_results;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION refresh_top_shared_results IS 'Refreshes the top_shared_results materialized view (should be called by cron hourly)';

-- =====================================================
-- 5. FUNCTION TO RECORD VIEW
-- =====================================================

-- Function to record a view and update counters
CREATE OR REPLACE FUNCTION record_shared_result_view(
  p_session_id UUID,
  p_viewer_user_id UUID,
  p_ip_hash VARCHAR(64)
)
RETURNS void AS $$
DECLARE
  v_is_new_viewer BOOLEAN;
BEGIN
  -- Check if this is a new unique viewer (by IP or user ID)
  SELECT NOT EXISTS (
    SELECT 1 FROM shared_result_views
    WHERE session_id = p_session_id
      AND (
        (p_viewer_user_id IS NOT NULL AND viewer_user_id = p_viewer_user_id)
        OR (p_ip_hash IS NOT NULL AND ip_hash = p_ip_hash)
      )
  ) INTO v_is_new_viewer;

  -- Insert view record
  INSERT INTO shared_result_views (session_id, viewer_user_id, ip_hash)
  VALUES (p_session_id, p_viewer_user_id, p_ip_hash);

  -- Update session counters
  UPDATE playground_sessions
  SET
    view_count = view_count + 1,
    unique_viewers = CASE WHEN v_is_new_viewer THEN unique_viewers + 1 ELSE unique_viewers END,
    last_viewed_at = NOW()
  WHERE id = p_session_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION record_shared_result_view IS 'Records a view and updates view counters atomically';

-- =====================================================
-- 6. FUNCTION TO RECORD HELPFUL FEEDBACK
-- =====================================================

CREATE OR REPLACE FUNCTION record_helpful_feedback(
  p_session_id UUID,
  p_view_id UUID,
  p_is_helpful BOOLEAN,
  p_feedback_text TEXT DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  -- Update the view record
  UPDATE shared_result_views
  SET
    was_helpful = p_is_helpful,
    feedback_text = p_feedback_text
  WHERE id = p_view_id;

  -- Update session counters based on feedback change
  -- First, get the old feedback value if any
  DECLARE
    v_old_helpful BOOLEAN;
  BEGIN
    SELECT was_helpful INTO v_old_helpful
    FROM shared_result_views
    WHERE id = p_view_id;

    -- Update counters: remove old vote, add new vote
    UPDATE playground_sessions
    SET
      helpful_count = helpful_count
        - CASE WHEN v_old_helpful = TRUE THEN 1 ELSE 0 END
        + CASE WHEN p_is_helpful = TRUE THEN 1 ELSE 0 END,
      not_helpful_count = not_helpful_count
        - CASE WHEN v_old_helpful = FALSE THEN 1 ELSE 0 END
        + CASE WHEN p_is_helpful = FALSE THEN 1 ELSE 0 END
    WHERE id = p_session_id;
  END;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION record_helpful_feedback IS 'Records helpful/not-helpful feedback and updates counters';

-- =====================================================
-- 7. TRIGGER TO SET shared_at TIMESTAMP
-- =====================================================

-- Function to set shared_at when is_public becomes true
CREATE OR REPLACE FUNCTION set_shared_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  -- Set shared_at when is_public changes from FALSE to TRUE
  IF NEW.is_public = TRUE AND (OLD.is_public = FALSE OR OLD.is_public IS NULL) THEN
    NEW.shared_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for setting shared_at
CREATE TRIGGER trigger_set_shared_at
  BEFORE UPDATE ON playground_sessions
  FOR EACH ROW
  WHEN (NEW.is_public IS DISTINCT FROM OLD.is_public)
  EXECUTE FUNCTION set_shared_at_timestamp();

COMMENT ON FUNCTION set_shared_at_timestamp IS 'Automatically sets shared_at timestamp when result is first shared';

-- =====================================================
-- 8. COMPLETION
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE 'Migration 030 completed successfully!';
  RAISE NOTICE 'Added analytics fields to playground_sessions';
  RAISE NOTICE 'Created shared_result_views table for tracking engagement';
  RAISE NOTICE 'Created top_shared_results materialized view for fast discovery';
  RAISE NOTICE 'Added helper functions: record_shared_result_view, record_helpful_feedback, refresh_top_shared_results';
  RAISE NOTICE 'Added trigger to auto-set shared_at timestamp';
END $$;
