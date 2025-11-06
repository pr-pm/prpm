-- Add playground session feedback table
-- Allows users to rate effectiveness and provide optional comments after testing

CREATE TABLE IF NOT EXISTS playground_session_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES playground_sessions(id) ON DELETE CASCADE,

  -- User tracking (nullable for anonymous users)
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  ip_hash VARCHAR(64), -- SHA-256 hash of IP for anonymous tracking

  -- Feedback data
  is_effective BOOLEAN NOT NULL, -- true = yes, false = no
  comment TEXT, -- optional user comment

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_session_feedback UNIQUE(session_id) -- one feedback per session
);

-- Indexes for analytics queries
CREATE INDEX idx_feedback_session_id ON playground_session_feedback(session_id);
CREATE INDEX idx_feedback_user_id ON playground_session_feedback(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_feedback_effective ON playground_session_feedback(is_effective);
CREATE INDEX idx_feedback_created_at ON playground_session_feedback(created_at);

-- Composite index for package-level analytics
CREATE INDEX idx_feedback_package_effective ON playground_session_feedback(is_effective, created_at)
  WHERE is_effective IS NOT NULL;

COMMENT ON TABLE playground_session_feedback IS 'User feedback on playground test effectiveness';
COMMENT ON COLUMN playground_session_feedback.is_effective IS 'Whether user found the test result effective (Yes/No)';
COMMENT ON COLUMN playground_session_feedback.comment IS 'Optional user comment about the test result';
COMMENT ON COLUMN playground_session_feedback.ip_hash IS 'SHA-256 hash of IP address for anonymous user tracking';
