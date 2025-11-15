-- Allow multiple feedback entries per session (one per exchange)
-- Previously only allowed one feedback per session

-- Add exchange_index column to track which exchange the feedback is for
ALTER TABLE playground_session_feedback
  ADD COLUMN IF NOT EXISTS exchange_index INTEGER NOT NULL DEFAULT 0;

-- Drop the old unique constraint that only allowed one feedback per session
ALTER TABLE playground_session_feedback
  DROP CONSTRAINT IF EXISTS unique_session_feedback;

-- Add new unique constraint that allows multiple feedback per session
-- but prevents duplicate feedback for the same exchange
ALTER TABLE playground_session_feedback
  ADD CONSTRAINT unique_session_exchange_feedback UNIQUE(session_id, exchange_index);

-- Add index for querying feedback by exchange
CREATE INDEX IF NOT EXISTS idx_feedback_session_exchange
  ON playground_session_feedback(session_id, exchange_index);

-- Update comment
COMMENT ON TABLE playground_session_feedback IS 'User feedback on playground test effectiveness - allows one feedback per exchange/response';
COMMENT ON COLUMN playground_session_feedback.exchange_index IS 'Index of the exchange (0-based) this feedback is for - allows feedback per response iteration';
