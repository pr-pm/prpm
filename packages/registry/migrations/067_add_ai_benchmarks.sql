-- Migration: Add AI Assistant Benchmarks
-- Created: 2025-12-13
-- Purpose: Infrastructure for testing AI coding assistants on PRPM packages

-- ============================================================================
-- 1. BENCHMARK SUITES
-- ============================================================================

CREATE TABLE benchmark_suites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  version VARCHAR(50) NOT NULL,
  test_count INT NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_benchmark_suites_active ON benchmark_suites(is_active, created_at DESC);

COMMENT ON TABLE benchmark_suites IS 'Collections of benchmark tests (e.g., "PRPM v1.0 - Dec 2025")';

-- ============================================================================
-- 2. BENCHMARK TESTS
-- ============================================================================

CREATE TABLE benchmark_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  suite_id UUID NOT NULL REFERENCES benchmark_suites(id) ON DELETE CASCADE,
  package_id UUID REFERENCES packages(id) ON DELETE SET NULL,

  -- Test metadata
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL, -- 'code-generation', 'debugging', 'refactoring', 'explanation', 'testing'
  difficulty INT CHECK (difficulty BETWEEN 1 AND 10),

  -- Test content
  prompt TEXT NOT NULL,
  expected_behavior TEXT,
  test_code TEXT,
  expected_output TEXT,

  -- Scoring weights (if different from defaults)
  correctness_weight DECIMAL(3,2) DEFAULT 0.40,
  quality_weight DECIMAL(3,2) DEFAULT 0.30,
  context_weight DECIMAL(3,2) DEFAULT 0.20,
  speed_weight DECIMAL(3,2) DEFAULT 0.10,

  -- Metadata
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  language VARCHAR(50), -- 'typescript', 'python', 'go', etc.
  framework VARCHAR(100), -- 'react', 'nextjs', 'fastapi', etc.
  metadata JSONB DEFAULT '{}',

  -- Audit
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_benchmark_tests_suite ON benchmark_tests(suite_id);
CREATE INDEX idx_benchmark_tests_package ON benchmark_tests(package_id);
CREATE INDEX idx_benchmark_tests_category ON benchmark_tests(category, difficulty);
CREATE INDEX idx_benchmark_tests_language ON benchmark_tests(language);

COMMENT ON TABLE benchmark_tests IS 'Individual test cases for benchmarking AI assistants';

-- ============================================================================
-- 3. BENCHMARK RUNS
-- ============================================================================

CREATE TABLE benchmark_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  suite_id UUID NOT NULL REFERENCES benchmark_suites(id) ON DELETE CASCADE,

  -- Assistant info
  assistant_name VARCHAR(100) NOT NULL, -- 'cursor', 'claude-code', 'copilot', etc.
  assistant_version VARCHAR(100),
  assistant_model VARCHAR(100), -- 'gpt-4', 'claude-3.5-sonnet', etc.

  -- Run metadata
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed'
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  -- Results summary
  total_tests INT DEFAULT 0,
  completed_tests INT DEFAULT 0,
  passed_tests INT DEFAULT 0,
  failed_tests INT DEFAULT 0,

  -- Aggregate scores
  overall_score DECIMAL(5,2),
  correctness_score DECIMAL(5,2),
  quality_score DECIMAL(5,2),
  context_score DECIMAL(5,2),
  speed_score DECIMAL(5,2),

  -- Category breakdown (JSONB for flexibility)
  category_scores JSONB DEFAULT '{}',

  -- Metadata
  runner_version VARCHAR(50),
  environment JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',

  -- Audit
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_benchmark_runs_suite ON benchmark_runs(suite_id);
CREATE INDEX idx_benchmark_runs_assistant ON benchmark_runs(assistant_name, assistant_version);
CREATE INDEX idx_benchmark_runs_status ON benchmark_runs(status, created_at DESC);
CREATE INDEX idx_benchmark_runs_score ON benchmark_runs(overall_score DESC);

COMMENT ON TABLE benchmark_runs IS 'Benchmark run sessions (one assistant tested on one suite)';

-- ============================================================================
-- 4. BENCHMARK RESULTS
-- ============================================================================

CREATE TABLE benchmark_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES benchmark_runs(id) ON DELETE CASCADE,
  test_id UUID NOT NULL REFERENCES benchmark_tests(id) ON DELETE CASCADE,

  -- Assistant info (denormalized for query performance)
  assistant_name VARCHAR(100) NOT NULL,
  assistant_version VARCHAR(100),

  -- Result status
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'timeout'

  -- Timing
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  response_time_ms INT,

  -- Scores (0-100)
  correctness_score DECIMAL(5,2),
  quality_score DECIMAL(5,2),
  context_score DECIMAL(5,2),
  speed_score DECIMAL(5,2),
  total_score DECIMAL(5,2),

  -- Generated output
  generated_code TEXT,
  assistant_response TEXT,

  -- Evaluation details
  test_passed BOOLEAN,
  static_analysis_results JSONB DEFAULT '{}',
  error_log TEXT,
  evaluation_notes TEXT,

  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_benchmark_results_run ON benchmark_results(run_id);
CREATE INDEX idx_benchmark_results_test ON benchmark_results(test_id);
CREATE INDEX idx_benchmark_results_assistant ON benchmark_results(assistant_name, total_score DESC);
CREATE INDEX idx_benchmark_results_status ON benchmark_results(status);

COMMENT ON TABLE benchmark_results IS 'Individual test results for each assistant';

-- ============================================================================
-- 5. LEADERBOARD VIEW
-- ============================================================================

CREATE OR REPLACE VIEW benchmark_leaderboard AS
SELECT
  r.assistant_name,
  r.assistant_version,
  r.assistant_model,
  s.name AS suite_name,
  s.version AS suite_version,
  r.overall_score,
  r.correctness_score,
  r.quality_score,
  r.context_score,
  r.speed_score,
  r.total_tests,
  r.passed_tests,
  r.failed_tests,
  ROUND((r.passed_tests::DECIMAL / NULLIF(r.total_tests, 0)) * 100, 2) AS pass_rate,
  r.completed_at,
  r.created_at,
  ROW_NUMBER() OVER (
    PARTITION BY s.id
    ORDER BY r.overall_score DESC, r.completed_at ASC
  ) AS rank
FROM benchmark_runs r
JOIN benchmark_suites s ON r.suite_id = s.id
WHERE r.status = 'completed'
  AND s.is_active = TRUE
  AND r.overall_score IS NOT NULL;

COMMENT ON VIEW benchmark_leaderboard IS 'Public leaderboard of AI assistant performance';

-- ============================================================================
-- 6. CATEGORY PERFORMANCE VIEW
-- ============================================================================

CREATE OR REPLACE VIEW benchmark_category_performance AS
SELECT
  r.assistant_name,
  r.assistant_version,
  t.category,
  COUNT(*) AS test_count,
  AVG(res.total_score) AS avg_score,
  AVG(res.correctness_score) AS avg_correctness,
  AVG(res.quality_score) AS avg_quality,
  AVG(res.context_score) AS avg_context,
  AVG(res.speed_score) AS avg_speed,
  SUM(CASE WHEN res.test_passed THEN 1 ELSE 0 END) AS passed_count,
  ROUND((SUM(CASE WHEN res.test_passed THEN 1 ELSE 0 END)::DECIMAL / COUNT(*)) * 100, 2) AS pass_rate
FROM benchmark_runs r
JOIN benchmark_results res ON r.id = res.run_id
JOIN benchmark_tests t ON res.test_id = t.id
WHERE r.status = 'completed'
  AND res.status = 'completed'
GROUP BY r.assistant_name, r.assistant_version, t.category;

COMMENT ON VIEW benchmark_category_performance IS 'Performance breakdown by category (code-generation, debugging, etc.)';

-- ============================================================================
-- 7. FUNCTIONS
-- ============================================================================

-- Update suite test count
CREATE OR REPLACE FUNCTION update_suite_test_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE benchmark_suites
  SET test_count = (
    SELECT COUNT(*)
    FROM benchmark_tests
    WHERE suite_id = COALESCE(NEW.suite_id, OLD.suite_id)
  ),
  updated_at = NOW()
  WHERE id = COALESCE(NEW.suite_id, OLD.suite_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_suite_test_count
AFTER INSERT OR DELETE ON benchmark_tests
FOR EACH ROW
EXECUTE FUNCTION update_suite_test_count();

-- Update run statistics when results are added
CREATE OR REPLACE FUNCTION update_run_statistics()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE benchmark_runs
  SET
    completed_tests = (
      SELECT COUNT(*)
      FROM benchmark_results
      WHERE run_id = NEW.run_id AND status = 'completed'
    ),
    passed_tests = (
      SELECT COUNT(*)
      FROM benchmark_results
      WHERE run_id = NEW.run_id AND test_passed = TRUE
    ),
    failed_tests = (
      SELECT COUNT(*)
      FROM benchmark_results
      WHERE run_id = NEW.run_id AND test_passed = FALSE
    ),
    overall_score = (
      SELECT AVG(total_score)
      FROM benchmark_results
      WHERE run_id = NEW.run_id AND status = 'completed'
    ),
    correctness_score = (
      SELECT AVG(correctness_score)
      FROM benchmark_results
      WHERE run_id = NEW.run_id AND status = 'completed'
    ),
    quality_score = (
      SELECT AVG(quality_score)
      FROM benchmark_results
      WHERE run_id = NEW.run_id AND status = 'completed'
    ),
    context_score = (
      SELECT AVG(context_score)
      FROM benchmark_results
      WHERE run_id = NEW.run_id AND status = 'completed'
    ),
    speed_score = (
      SELECT AVG(speed_score)
      FROM benchmark_results
      WHERE run_id = NEW.run_id AND status = 'completed'
    )
  WHERE id = NEW.run_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_run_statistics
AFTER INSERT OR UPDATE ON benchmark_results
FOR EACH ROW
EXECUTE FUNCTION update_run_statistics();

-- ============================================================================
-- 8. SEED DATA (Example Suite)
-- ============================================================================

INSERT INTO benchmark_suites (name, description, version, test_count)
VALUES (
  'PRPM Core v1.0',
  'Initial benchmark suite testing AI assistants on popular PRPM packages',
  '1.0.0',
  0
);

-- Note: Actual tests will be added via separate script or admin interface
