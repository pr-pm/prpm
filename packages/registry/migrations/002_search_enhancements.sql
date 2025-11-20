-- PRPM Registry Database Schema
-- Migration 002: Search Enhancements
-- Adds related packages tracking and language/framework filtering

-- ============================================
-- PACKAGE ENHANCEMENTS
-- ============================================

-- Add language and framework fields for better filtering
ALTER TABLE packages
  ADD COLUMN IF NOT EXISTS language VARCHAR(50),  -- primary programming language (javascript, python, typescript, go, rust, etc.)
  ADD COLUMN IF NOT EXISTS framework VARCHAR(100); -- primary framework (react, nextjs, vue, django, fastapi, rails, etc.)

-- Add indexes for new filter fields
CREATE INDEX IF NOT EXISTS idx_packages_language ON packages(language) WHERE language IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_packages_framework ON packages(framework) WHERE framework IS NOT NULL;

-- Add composite index for common filter combinations
CREATE INDEX IF NOT EXISTS idx_packages_lang_framework ON packages(language, framework)
  WHERE language IS NOT NULL OR framework IS NOT NULL;

-- ============================================
-- RELATED PACKAGES TRACKING
-- ============================================

-- Track package co-installations to power "users also installed" recommendations
CREATE TABLE IF NOT EXISTS package_co_installations (
  package_a_id UUID REFERENCES packages(id) ON DELETE CASCADE,
  package_b_id UUID REFERENCES packages(id) ON DELETE CASCADE,

  -- Number of times these two packages were installed together
  co_install_count INTEGER DEFAULT 1,

  -- Confidence score (0-100) - higher means stronger relationship
  -- Calculated based on: co_install_count, time proximity, user diversity
  confidence_score DECIMAL(5, 2) DEFAULT 0,

  -- Last time these were co-installed
  last_co_installed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- First time tracked
  first_co_installed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  PRIMARY KEY(package_a_id, package_b_id),

  -- Ensure package_a_id < package_b_id to avoid duplicates (a,b) and (b,a)
  CHECK (package_a_id < package_b_id)
);

-- Indexes for efficient related package queries
CREATE INDEX IF NOT EXISTS idx_co_installs_package_a ON package_co_installations(package_a_id, confidence_score DESC);
CREATE INDEX IF NOT EXISTS idx_co_installs_package_b ON package_co_installations(package_b_id, confidence_score DESC);
CREATE INDEX IF NOT EXISTS idx_co_installs_confidence ON package_co_installations(confidence_score DESC);
CREATE INDEX IF NOT EXISTS idx_co_installs_count ON package_co_installations(co_install_count DESC);

-- ============================================
-- INSTALLATION TRACKING (for co-install analysis)
-- ============================================

-- Track individual package installations to calculate co-installations
-- This is separate from download stats (which track HTTP downloads)
CREATE TABLE IF NOT EXISTS package_installations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- What was installed
  package_id UUID REFERENCES packages(id) ON DELETE CASCADE,
  version VARCHAR(50),

  -- Who installed it (optional - for logged-in users)
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Anonymous session identifier (for co-install tracking without tracking users)
  -- Generated on first install, stored in CLI config
  session_id VARCHAR(100),

  -- Installation context
  installed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  format VARCHAR(50),  -- what format they requested (cursor, claude, etc.)

  -- For grouping co-installs (installs within 24h of each other)
  install_batch_id UUID  -- packages installed in same batch get same ID
);

CREATE INDEX IF NOT EXISTS idx_installations_package ON package_installations(package_id);
CREATE INDEX IF NOT EXISTS idx_installations_user ON package_installations(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_installations_session ON package_installations(session_id) WHERE session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_installations_batch ON package_installations(install_batch_id) WHERE install_batch_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_installations_date ON package_installations(installed_at DESC);

-- ============================================
-- FUNCTIONS FOR CO-INSTALLATION ANALYSIS
-- ============================================

-- Function to update co-installation counts
-- Called periodically (via cron job) to analyze recent installations
CREATE OR REPLACE FUNCTION update_co_installation_counts()
RETURNS void AS $$
BEGIN
  -- Find packages installed together in the last 24 hours
  -- Group by session_id or install_batch_id
  INSERT INTO package_co_installations (package_a_id, package_b_id, co_install_count, last_co_installed_at)
  SELECT
    LEAST(a.package_id, b.package_id) as package_a_id,
    GREATEST(a.package_id, b.package_id) as package_b_id,
    COUNT(*) as co_install_count,
    MAX(a.installed_at) as last_co_installed_at
  FROM package_installations a
  JOIN package_installations b
    ON a.session_id = b.session_id
    AND a.package_id != b.package_id
    AND a.installed_at > NOW() - INTERVAL '24 hours'
    AND b.installed_at > NOW() - INTERVAL '24 hours'
    AND ABS(EXTRACT(EPOCH FROM (a.installed_at - b.installed_at))) < 3600  -- Within 1 hour
  WHERE a.session_id IS NOT NULL
  GROUP BY LEAST(a.package_id, b.package_id), GREATEST(a.package_id, b.package_id)
  ON CONFLICT (package_a_id, package_b_id)
  DO UPDATE SET
    co_install_count = package_co_installations.co_install_count + EXCLUDED.co_install_count,
    last_co_installed_at = EXCLUDED.last_co_installed_at;

  -- Update confidence scores based on co-install count and recency
  UPDATE package_co_installations SET
    confidence_score = LEAST(100, (
      -- Base score from co-install count (logarithmic scale)
      (LOG(co_install_count + 1) * 20) +
      -- Bonus for recent co-installs (decays over 30 days)
      (30 * EXP(-EXTRACT(EPOCH FROM (NOW() - last_co_installed_at)) / (30 * 86400)))
    ));
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- HELPER VIEWS
-- ============================================

-- View for getting related packages with metadata
CREATE OR REPLACE VIEW related_packages_view AS
SELECT
  pc.package_a_id,
  pc.package_b_id,
  pc.co_install_count,
  pc.confidence_score,
  pa.name as package_a_name,
  pa.description as package_a_description,
  pb.name as package_b_name,
  pb.description as package_b_description,
  pb.total_downloads as package_b_downloads,
  pb.quality_score as package_b_quality
FROM package_co_installations pc
JOIN packages pa ON pc.package_a_id = pa.id
JOIN packages pb ON pc.package_b_id = pb.id
WHERE pc.confidence_score > 10  -- Only show confident relationships
ORDER BY pc.confidence_score DESC;

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON COLUMN packages.language IS 'Primary programming language (javascript, python, typescript, go, rust, java, csharp, php, ruby, swift, kotlin)';
COMMENT ON COLUMN packages.framework IS 'Primary framework or library (react, nextjs, vue, angular, django, fastapi, rails, laravel, spring, dotnet)';
COMMENT ON TABLE package_co_installations IS 'Tracks which packages are frequently installed together for recommendations';
COMMENT ON TABLE package_installations IS 'Tracks individual package installations for analytics and co-install analysis (anonymized)';
COMMENT ON COLUMN package_installations.session_id IS 'Anonymous session identifier - generated once per CLI installation, never tied to user identity';
