-- Migration 031: Add Author Playground Features
-- Description: Adds suggested test inputs and featured results for package authors
-- Author: AI Assistant
-- Date: 2025-11-04

-- =====================================================
-- 1. SUGGESTED TEST INPUTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS suggested_test_inputs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  package_id UUID REFERENCES packages(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,

  -- Input details
  title VARCHAR(100) NOT NULL,
  description TEXT,
  suggested_input TEXT NOT NULL,

  -- Categorization
  category VARCHAR(50), -- "code-review", "documentation", "refactoring", "general"
  difficulty VARCHAR(20) DEFAULT 'beginner', -- "beginner", "intermediate", "advanced"
  estimated_credits INTEGER DEFAULT 1, -- Estimated cost to run
  recommended_model VARCHAR(50), -- "sonnet", "opus", etc.

  -- Display & tracking
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  usage_count INTEGER DEFAULT 0, -- How many times users clicked "Try this"

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_difficulty CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  CONSTRAINT valid_model CHECK (recommended_model IS NULL OR recommended_model IN ('sonnet', 'opus', 'gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'))
);

CREATE INDEX idx_suggested_test_inputs_package ON suggested_test_inputs(package_id, display_order) WHERE is_active = TRUE;
CREATE INDEX idx_suggested_test_inputs_author ON suggested_test_inputs(author_id);
CREATE INDEX idx_suggested_test_inputs_category ON suggested_test_inputs(package_id, category) WHERE is_active = TRUE;

COMMENT ON TABLE suggested_test_inputs IS 'Author-curated suggested test inputs for package testing';
COMMENT ON COLUMN suggested_test_inputs.usage_count IS 'Number of times users clicked "Try this" button';
COMMENT ON COLUMN suggested_test_inputs.display_order IS 'Lower numbers display first (0 = highest priority)';

-- =====================================================
-- 2. FEATURED TEST RESULTS
-- =====================================================

-- Add columns to playground_sessions for author featuring
ALTER TABLE playground_sessions
  ADD COLUMN IF NOT EXISTS is_featured_by_author BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS featured_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS featured_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS feature_description TEXT,
  ADD COLUMN IF NOT EXISTS feature_display_order INTEGER DEFAULT 0;

CREATE INDEX idx_playground_sessions_featured
  ON playground_sessions(package_id, feature_display_order)
  WHERE is_featured_by_author = TRUE AND is_public = TRUE;

COMMENT ON COLUMN playground_sessions.is_featured_by_author IS 'Whether this result is featured by package author';
COMMENT ON COLUMN playground_sessions.feature_description IS 'Author description of why this result is featured';
COMMENT ON COLUMN playground_sessions.feature_display_order IS 'Display order for featured results (lower = higher priority)';

-- =====================================================
-- 3. SUGGESTED INPUT USAGE TRACKING
-- =====================================================

CREATE TABLE IF NOT EXISTS suggested_input_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  suggested_input_id UUID REFERENCES suggested_test_inputs(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  session_id UUID REFERENCES playground_sessions(id) ON DELETE SET NULL,

  -- Tracking
  clicked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_test BOOLEAN DEFAULT FALSE, -- Did they actually run the test?

  -- Analytics
  ip_hash VARCHAR(64), -- For anonymous tracking
  user_agent TEXT
);

CREATE INDEX idx_suggested_input_usage_input ON suggested_input_usage(suggested_input_id, clicked_at DESC);
CREATE INDEX idx_suggested_input_usage_session ON suggested_input_usage(session_id) WHERE session_id IS NOT NULL;

COMMENT ON TABLE suggested_input_usage IS 'Tracks when users click and use suggested test inputs';

-- =====================================================
-- 4. FUNCTION TO INCREMENT USAGE COUNT
-- =====================================================

CREATE OR REPLACE FUNCTION increment_suggested_input_usage(
  p_suggested_input_id UUID,
  p_user_id UUID,
  p_ip_hash VARCHAR(64)
)
RETURNS UUID AS $$
DECLARE
  v_usage_id UUID;
BEGIN
  -- Insert usage record
  INSERT INTO suggested_input_usage (suggested_input_id, user_id, ip_hash)
  VALUES (p_suggested_input_id, p_user_id, p_ip_hash)
  RETURNING id INTO v_usage_id;

  -- Increment usage count
  UPDATE suggested_test_inputs
  SET usage_count = usage_count + 1
  WHERE id = p_suggested_input_id;

  RETURN v_usage_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION increment_suggested_input_usage IS 'Records usage of suggested input and increments counter';

-- =====================================================
-- 5. FUNCTION TO MARK TEST COMPLETION
-- =====================================================

CREATE OR REPLACE FUNCTION mark_suggested_input_test_complete(
  p_usage_id UUID,
  p_session_id UUID
)
RETURNS void AS $$
BEGIN
  UPDATE suggested_input_usage
  SET
    completed_test = TRUE,
    session_id = p_session_id
  WHERE id = p_usage_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION mark_suggested_input_test_complete IS 'Marks a suggested input as having completed a test';

-- =====================================================
-- 6. TRIGGER TO UPDATE suggested_test_inputs timestamp
-- =====================================================

CREATE OR REPLACE FUNCTION update_suggested_test_inputs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_suggested_test_inputs_updated_at
  BEFORE UPDATE ON suggested_test_inputs
  FOR EACH ROW
  EXECUTE FUNCTION update_suggested_test_inputs_updated_at();

-- =====================================================
-- 7. SEED EXAMPLE SUGGESTED INPUTS
-- =====================================================

-- Note: In production, authors will create these via the UI
-- This is just example data for testing

-- Example: Add a suggested input for a popular package
DO $$
DECLARE
  v_package_id UUID;
  v_author_id UUID;
BEGIN
  -- Find a package to add examples to (skip if not found)
  SELECT p.id, p.author_id INTO v_package_id, v_author_id
  FROM packages p
  WHERE p.name LIKE '%code-review%'
  LIMIT 1;

  IF v_package_id IS NOT NULL THEN
    INSERT INTO suggested_test_inputs (
      package_id,
      author_id,
      title,
      description,
      suggested_input,
      category,
      difficulty,
      estimated_credits,
      recommended_model,
      display_order
    ) VALUES
    (
      v_package_id,
      v_author_id,
      'Review React Component',
      'Test with a real React component to see code review in action',
      E'Review this React component:\n\nfunction UserCard({ name, email }) {\n  return (\n    <div className="card">\n      <h2>{name}</h2>\n      <p>{email}</p>\n    </div>\n  );\n}',
      'code-review',
      'beginner',
      1,
      'sonnet',
      0
    ),
    (
      v_package_id,
      v_author_id,
      'Fix TypeScript Errors',
      'Give it a TypeScript error and see how it suggests fixes',
      E'Fix these TypeScript errors:\n\ninterface User {\n  name: string;\n  age: number;\n}\n\nconst user: User = {\n  name: "John",\n  // missing age property\n};',
      'code-review',
      'intermediate',
      2,
      'sonnet',
      1
    ),
    (
      v_package_id,
      v_author_id,
      'Refactor Legacy Code',
      'Test with complex legacy code for advanced refactoring suggestions',
      E'Refactor this legacy function:\n\nfunction processData(d) {\n  var r = [];\n  for (var i = 0; i < d.length; i++) {\n    if (d[i].active == true) {\n      r.push({id: d[i].id, val: d[i].value * 2});\n    }\n  }\n  return r;\n}',
      'refactoring',
      'advanced',
      3,
      'opus',
      2
    );
  END IF;
END $$;

-- =====================================================
-- 8. GRANT PERMISSIONS
-- =====================================================

-- Grant appropriate permissions (adjust based on your roles)
-- GRANT SELECT, INSERT, UPDATE ON suggested_test_inputs TO app_user;
-- GRANT SELECT, INSERT, UPDATE ON suggested_input_usage TO app_user;

-- =====================================================
-- 9. COMPLETION
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE 'Migration 031 completed successfully!';
  RAISE NOTICE 'Created suggested_test_inputs table for author-curated test examples';
  RAISE NOTICE 'Added featured result columns to playground_sessions';
  RAISE NOTICE 'Created suggested_input_usage tracking table';
  RAISE NOTICE 'Added helper functions for usage tracking';
END $$;
