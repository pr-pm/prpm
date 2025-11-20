-- Migration 034: Add Playground Comparison Support
-- Description: Adds support for sharing comparison sessions (Package A vs Package B)
-- Author: System
-- Date: 2025-11-04

-- =====================================================
-- 1. ADD COMPARISON FIELDS TO PLAYGROUND_SESSIONS
-- =====================================================

ALTER TABLE playground_sessions
  ADD COLUMN IF NOT EXISTS is_comparison BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS comparison_session_id UUID REFERENCES playground_sessions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS comparison_label VARCHAR(20) CHECK (comparison_label IN ('A', 'B', NULL));

CREATE INDEX IF NOT EXISTS idx_playground_sessions_comparison ON playground_sessions(comparison_session_id) WHERE is_comparison = TRUE;

COMMENT ON COLUMN playground_sessions.is_comparison IS 'Whether this session is part of a comparison (A vs B)';
COMMENT ON COLUMN playground_sessions.comparison_session_id IS 'If this is session A, points to session B (and vice versa)';
COMMENT ON COLUMN playground_sessions.comparison_label IS 'Label for this session in comparison: A or B';

-- =====================================================
-- 2. UPDATE SHARE TOKEN TO BE SHARED FOR COMPARISONS
-- =====================================================
-- When sharing a comparison, both sessions A and B will have the same share_token

-- No schema change needed - we'll update the application logic to:
-- 1. When sharing a comparison session, copy the share_token to the paired session
-- 2. When fetching a shared session, check if it has a comparison_session_id and include both

-- =====================================================
-- 3. CREATE VIEW FOR COMPARISON SESSIONS
-- =====================================================

CREATE OR REPLACE VIEW playground_comparison_sessions AS
SELECT
  a.id as session_a_id,
  a.share_token,
  a.user_id,
  a.package_id as package_a_id,
  a.package_name as package_a_name,
  a.package_version as package_a_version,
  a.model as model_a,
  a.conversation as conversation_a,
  a.credits_spent as credits_a,
  a.total_tokens as tokens_a,

  b.id as session_b_id,
  b.package_id as package_b_id,
  b.package_name as package_b_name,
  b.package_version as package_b_version,
  b.model as model_b,
  b.conversation as conversation_b,
  b.credits_spent as credits_b,
  b.total_tokens as tokens_b,

  a.view_count,
  a.helpful_count,
  a.not_helpful_count,
  a.shared_at,
  a.created_at

FROM playground_sessions a
INNER JOIN playground_sessions b ON a.comparison_session_id = b.id
WHERE a.is_comparison = TRUE
  AND a.comparison_label = 'A'
  AND a.is_public = TRUE;

COMMENT ON VIEW playground_comparison_sessions IS 'View combining both sessions A and B for comparison sharing';

-- Log migration completion
DO $$
BEGIN
  RAISE NOTICE 'Migration 034 completed successfully!';
  RAISE NOTICE 'Added comparison support to playground_sessions table';
END $$;
