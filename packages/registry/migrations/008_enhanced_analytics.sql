-- Enhanced Analytics for Author Dashboard
-- Migration 005: Better tracking for package downloads, views, and author insights

-- ============================================
-- DETAILED DOWNLOAD TRACKING
-- ============================================

-- Individual download events (for detailed analytics)
CREATE TABLE IF NOT EXISTS download_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  package_id VARCHAR(255) REFERENCES packages(id) ON DELETE CASCADE,
  version VARCHAR(50),

  -- Client information
  client_type VARCHAR(50),  -- 'cli', 'web', 'api'
  format VARCHAR(50),       -- 'cursor', 'claude', 'continue', 'windsurf', 'generic'

  -- User tracking (if authenticated)
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Anonymous tracking
  client_id VARCHAR(255),   -- For anonymous users (from x-client-id header)
  ip_hash VARCHAR(64),      -- Privacy-preserving IP hash

  -- Request metadata
  user_agent TEXT,
  referrer TEXT,
  country_code CHAR(2),     -- For geographic analytics

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX idx_download_events_package ON download_events(package_id);
CREATE INDEX idx_download_events_user ON download_events(user_id);
CREATE INDEX idx_download_events_created ON download_events(created_at DESC);
CREATE INDEX idx_download_events_package_date ON download_events(package_id, created_at DESC);

-- ============================================
-- PACKAGE VIEWS (PAGE VISITS)
-- ============================================

CREATE TABLE IF NOT EXISTS package_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  package_id VARCHAR(255) REFERENCES packages(id) ON DELETE CASCADE,

  -- User tracking
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Anonymous tracking
  session_id VARCHAR(255),  -- For unique visitor counting
  ip_hash VARCHAR(64),

  -- Request metadata
  user_agent TEXT,
  referrer TEXT,
  country_code CHAR(2),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_package_views_package ON package_views(package_id);
CREATE INDEX idx_package_views_created ON package_views(created_at DESC);
CREATE INDEX idx_package_views_package_date ON package_views(package_id, created_at DESC);
CREATE INDEX idx_package_views_session ON package_views(session_id);

-- ============================================
-- AGGREGATED DAILY STATS (FOR PERFORMANCE)
-- ============================================

-- Drop old package_stats if it exists with wrong schema
DROP TABLE IF EXISTS package_stats CASCADE;

CREATE TABLE package_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  package_id VARCHAR(255) REFERENCES packages(id) ON DELETE CASCADE,
  date DATE NOT NULL,

  -- Download counts
  total_downloads INTEGER DEFAULT 0,
  unique_downloads INTEGER DEFAULT 0,  -- Unique users/IPs

  -- Downloads by client type
  cli_downloads INTEGER DEFAULT 0,
  web_downloads INTEGER DEFAULT 0,
  api_downloads INTEGER DEFAULT 0,

  -- Downloads by format
  cursor_downloads INTEGER DEFAULT 0,
  claude_downloads INTEGER DEFAULT 0,
  continue_downloads INTEGER DEFAULT 0,
  windsurf_downloads INTEGER DEFAULT 0,
  generic_downloads INTEGER DEFAULT 0,

  -- View counts
  total_views INTEGER DEFAULT 0,
  unique_views INTEGER DEFAULT 0,

  -- Geographic (top countries)
  top_countries JSONB DEFAULT '{}',  -- {"US": 100, "GB": 50, ...}

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(package_id, date)
);

CREATE INDEX idx_package_stats_package ON package_stats(package_id);
CREATE INDEX idx_package_stats_date ON package_stats(date DESC);
CREATE INDEX idx_package_stats_package_date ON package_stats(package_id, date DESC);

-- ============================================
-- AUTHOR ANALYTICS AGGREGATION
-- ============================================

-- Aggregated stats per author (for dashboard performance)
CREATE TABLE author_stats (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,

  -- Package counts
  total_packages INTEGER DEFAULT 0,
  public_packages INTEGER DEFAULT 0,
  private_packages INTEGER DEFAULT 0,

  -- Download stats (all-time)
  total_downloads INTEGER DEFAULT 0,
  total_unique_downloads INTEGER DEFAULT 0,

  -- Download stats (recent)
  downloads_today INTEGER DEFAULT 0,
  downloads_week INTEGER DEFAULT 0,
  downloads_month INTEGER DEFAULT 0,

  -- View stats
  total_views INTEGER DEFAULT 0,
  views_today INTEGER DEFAULT 0,
  views_week INTEGER DEFAULT 0,
  views_month INTEGER DEFAULT 0,

  -- Engagement
  average_rating DECIMAL(3, 2),
  total_ratings INTEGER DEFAULT 0,

  -- Most popular package
  most_popular_package_id VARCHAR(255),
  most_popular_package_downloads INTEGER DEFAULT 0,

  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_author_stats_downloads ON author_stats(total_downloads DESC);
CREATE INDEX idx_author_stats_packages ON author_stats(total_packages DESC);

-- ============================================
-- FUNCTIONS FOR ANALYTICS AGGREGATION
-- ============================================

-- Function to aggregate daily stats from events
CREATE OR REPLACE FUNCTION aggregate_daily_stats(target_date DATE)
RETURNS void AS $$
BEGIN
  -- Aggregate download stats
  INSERT INTO package_stats (
    package_id,
    date,
    total_downloads,
    unique_downloads,
    cli_downloads,
    web_downloads,
    api_downloads,
    cursor_downloads,
    claude_downloads,
    continue_downloads,
    windsurf_downloads,
    generic_downloads
  )
  SELECT
    package_id,
    target_date,
    COUNT(*) as total_downloads,
    COUNT(DISTINCT COALESCE(user_id::text, client_id, ip_hash)) as unique_downloads,
    COUNT(*) FILTER (WHERE client_type = 'cli') as cli_downloads,
    COUNT(*) FILTER (WHERE client_type = 'web') as web_downloads,
    COUNT(*) FILTER (WHERE client_type = 'api') as api_downloads,
    COUNT(*) FILTER (WHERE format = 'cursor') as cursor_downloads,
    COUNT(*) FILTER (WHERE format = 'claude') as claude_downloads,
    COUNT(*) FILTER (WHERE format = 'continue') as continue_downloads,
    COUNT(*) FILTER (WHERE format = 'windsurf') as windsurf_downloads,
    COUNT(*) FILTER (WHERE format = 'generic') as generic_downloads
  FROM download_events
  WHERE DATE(created_at) = target_date
  GROUP BY package_id
  ON CONFLICT (package_id, date)
  DO UPDATE SET
    total_downloads = EXCLUDED.total_downloads,
    unique_downloads = EXCLUDED.unique_downloads,
    cli_downloads = EXCLUDED.cli_downloads,
    web_downloads = EXCLUDED.web_downloads,
    api_downloads = EXCLUDED.api_downloads,
    cursor_downloads = EXCLUDED.cursor_downloads,
    claude_downloads = EXCLUDED.claude_downloads,
    continue_downloads = EXCLUDED.continue_downloads,
    windsurf_downloads = EXCLUDED.windsurf_downloads,
    generic_downloads = EXCLUDED.generic_downloads,
    updated_at = NOW();

  -- Aggregate view stats
  UPDATE package_stats ps
  SET
    total_views = v.view_count,
    unique_views = v.unique_views,
    updated_at = NOW()
  FROM (
    SELECT
      package_id,
      COUNT(*) as view_count,
      COUNT(DISTINCT COALESCE(user_id::text, session_id, ip_hash)) as unique_views
    FROM package_views
    WHERE DATE(created_at) = target_date
    GROUP BY package_id
  ) v
  WHERE ps.package_id = v.package_id AND ps.date = target_date;

END;
$$ LANGUAGE plpgsql;

-- Function to update author stats
CREATE OR REPLACE FUNCTION update_author_stats(author_user_id UUID)
RETURNS void AS $$
DECLARE
  today DATE := CURRENT_DATE;
  week_ago DATE := CURRENT_DATE - INTERVAL '7 days';
  month_ago DATE := CURRENT_DATE - INTERVAL '30 days';
BEGIN
  INSERT INTO author_stats (user_id)
  VALUES (author_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  UPDATE author_stats
  SET
    total_packages = (
      SELECT COUNT(*) FROM packages WHERE author_id = author_user_id
    ),
    public_packages = (
      SELECT COUNT(*) FROM packages WHERE author_id = author_user_id AND visibility = 'public'
    ),
    private_packages = (
      SELECT COUNT(*) FROM packages WHERE author_id = author_user_id AND visibility = 'private'
    ),
    total_downloads = (
      SELECT COALESCE(SUM(total_downloads), 0) FROM packages WHERE author_id = author_user_id
    ),
    downloads_today = (
      SELECT COALESCE(SUM(ps.total_downloads), 0)
      FROM package_stats ps
      JOIN packages p ON ps.package_id = p.id
      WHERE p.author_id = author_user_id AND ps.date = today
    ),
    downloads_week = (
      SELECT COALESCE(SUM(ps.total_downloads), 0)
      FROM package_stats ps
      JOIN packages p ON ps.package_id = p.id
      WHERE p.author_id = author_user_id AND ps.date >= week_ago
    ),
    downloads_month = (
      SELECT COALESCE(SUM(ps.total_downloads), 0)
      FROM package_stats ps
      JOIN packages p ON ps.package_id = p.id
      WHERE p.author_id = author_user_id AND ps.date >= month_ago
    ),
    average_rating = (
      SELECT AVG(rating)
      FROM package_reviews pr
      JOIN packages p ON pr.package_id = p.id
      WHERE p.author_id = author_user_id
    ),
    total_ratings = (
      SELECT COUNT(*)
      FROM package_reviews pr
      JOIN packages p ON pr.package_id = p.id
      WHERE p.author_id = author_user_id
    ),
    last_updated = NOW()
  WHERE user_id = author_user_id;

  -- Update most popular package
  UPDATE author_stats
  SET
    most_popular_package_id = subq.package_id,
    most_popular_package_downloads = subq.downloads
  FROM (
    SELECT id as package_id, total_downloads as downloads
    FROM packages
    WHERE author_id = author_user_id
    ORDER BY total_downloads DESC
    LIMIT 1
  ) subq
  WHERE user_id = author_user_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger to update package download counts when download event is recorded
CREATE OR REPLACE FUNCTION update_package_downloads()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE packages
  SET
    total_downloads = total_downloads + 1,
    weekly_downloads = weekly_downloads + 1,
    monthly_downloads = monthly_downloads + 1,
    updated_at = NOW()
  WHERE id = NEW.package_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_package_downloads
AFTER INSERT ON download_events
FOR EACH ROW
EXECUTE FUNCTION update_package_downloads();

-- ============================================
-- SCHEDULED JOBS (Run via cron or application)
-- ============================================

-- Note: These need to be run daily via cron or a scheduler

-- Aggregate yesterday's stats
-- SELECT aggregate_daily_stats(CURRENT_DATE - INTERVAL '1 day');

-- Update all author stats (run weekly)
-- SELECT update_author_stats(user_id) FROM users WHERE verified_author = TRUE;

COMMENT ON TABLE download_events IS 'Individual download events for detailed analytics';
COMMENT ON TABLE package_views IS 'Individual package page views';
COMMENT ON TABLE package_stats IS 'Aggregated daily statistics per package';
COMMENT ON TABLE author_stats IS 'Aggregated statistics per author for dashboard';
COMMENT ON FUNCTION aggregate_daily_stats IS 'Aggregates download/view events into daily stats';
COMMENT ON FUNCTION update_author_stats IS 'Updates aggregated stats for a specific author';
