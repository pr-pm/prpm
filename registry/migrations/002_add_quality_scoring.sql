-- Migration: Add Quality Scoring System
-- Created: 2025-10-18

-- Add scoring columns to packages table
ALTER TABLE packages
ADD COLUMN score_total INTEGER DEFAULT 0,
ADD COLUMN score_popularity INTEGER DEFAULT 0,
ADD COLUMN score_quality INTEGER DEFAULT 0,
ADD COLUMN score_trust INTEGER DEFAULT 0,
ADD COLUMN score_recency INTEGER DEFAULT 0,
ADD COLUMN score_completeness INTEGER DEFAULT 0,
ADD COLUMN score_updated_at TIMESTAMP;

-- Create index for sorting by score
CREATE INDEX idx_packages_score ON packages(score_total DESC);
CREATE INDEX idx_packages_type_score ON packages(type, score_total DESC);

-- Add badge system
CREATE TABLE badges (
  package_id VARCHAR(255) REFERENCES packages(id) ON DELETE CASCADE,
  badge_type VARCHAR(50) NOT NULL,  -- verified, official, popular, maintained, secure, featured
  awarded_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  metadata JSONB,  -- Additional badge info
  PRIMARY KEY (package_id, badge_type)
);

CREATE INDEX idx_badges_package ON badges(package_id);
CREATE INDEX idx_badges_type ON badges(badge_type);

-- Add ratings and reviews
CREATE TABLE ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id VARCHAR(255) REFERENCES packages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  helpful INTEGER DEFAULT 0,
  not_helpful INTEGER DEFAULT 0,
  verified_install BOOLEAN DEFAULT FALSE,  -- User actually installed the package
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(package_id, user_id)
);

CREATE INDEX idx_ratings_package ON ratings(package_id);
CREATE INDEX idx_ratings_user ON ratings(user_id);
CREATE INDEX idx_ratings_helpful ON ratings(helpful DESC);
CREATE INDEX idx_ratings_rating ON ratings(rating DESC);

-- Add review helpfulness votes
CREATE TABLE review_votes (
  review_id UUID REFERENCES ratings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  vote INTEGER CHECK (vote IN (-1, 1)),  -- -1 for not helpful, 1 for helpful
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (review_id, user_id)
);

-- Add installation tracking for recommendations
CREATE TABLE installations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  package_id VARCHAR(255) REFERENCES packages(id) ON DELETE CASCADE,
  installed_at TIMESTAMP DEFAULT NOW(),
  client_info JSONB  -- CLI version, OS, etc.
);

CREATE INDEX idx_installations_user ON installations(user_id, installed_at DESC);
CREATE INDEX idx_installations_package ON installations(package_id, installed_at DESC);

-- Add installation pairs for "people also installed"
CREATE TABLE installation_pairs (
  package_a VARCHAR(255),
  package_b VARCHAR(255),
  pair_count INTEGER DEFAULT 1,
  last_updated TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (package_a, package_b)
);

CREATE INDEX idx_installation_pairs_a ON installation_pairs(package_a, pair_count DESC);
CREATE INDEX idx_installation_pairs_b ON installation_pairs(package_b, pair_count DESC);

-- Add package views for tracking popularity
ALTER TABLE packages
ADD COLUMN view_count INTEGER DEFAULT 0,
ADD COLUMN install_count INTEGER DEFAULT 0,
ADD COLUMN install_rate FLOAT DEFAULT 0;  -- install_count / view_count

CREATE INDEX idx_packages_views ON packages(view_count DESC);
CREATE INDEX idx_packages_installs ON packages(install_count DESC);
CREATE INDEX idx_packages_install_rate ON packages(install_rate DESC);

-- Add trending metrics
ALTER TABLE packages
ADD COLUMN downloads_last_7_days INTEGER DEFAULT 0,
ADD COLUMN downloads_last_30_days INTEGER DEFAULT 0,
ADD COLUMN trending_score FLOAT DEFAULT 0;

CREATE INDEX idx_packages_trending ON packages(trending_score DESC);

-- Function to calculate package score
CREATE OR REPLACE FUNCTION calculate_package_score(pkg_id VARCHAR(255))
RETURNS TABLE(
  popularity INTEGER,
  quality INTEGER,
  trust INTEGER,
  recency INTEGER,
  completeness INTEGER,
  total INTEGER
) AS $$
DECLARE
  v_downloads INTEGER;
  v_downloads_7d INTEGER;
  v_rating FLOAT;
  v_rating_count INTEGER;
  v_verified BOOLEAN;
  v_has_readme BOOLEAN;
  v_tags_count INTEGER;
  v_days_since_update INTEGER;
  v_author_verified BOOLEAN;

  score_pop INTEGER := 0;
  score_qual INTEGER := 0;
  score_trust INTEGER := 0;
  score_rec INTEGER := 0;
  score_comp INTEGER := 0;
BEGIN
  -- Get package data
  SELECT
    p.total_downloads,
    p.downloads_last_7_days,
    p.rating_average,
    p.rating_count,
    p.verified_package,
    (p.readme IS NOT NULL AND length(p.readme) > 100) as has_readme,
    (SELECT COUNT(*) FROM unnest(p.tags) as tag),
    EXTRACT(DAY FROM (NOW() - p.updated_at)),
    u.verified_author
  INTO
    v_downloads,
    v_downloads_7d,
    v_rating,
    v_rating_count,
    v_verified,
    v_has_readme,
    v_tags_count,
    v_days_since_update,
    v_author_verified
  FROM packages p
  LEFT JOIN users u ON p.author_id = u.id
  WHERE p.id = pkg_id;

  -- Calculate Popularity (0-30)
  score_pop := LEAST(FLOOR(LOG(GREATEST(v_downloads, 1)) * 3), 15);  -- downloads
  score_pop := score_pop + LEAST(FLOOR(v_downloads_7d / 10.0), 10);   -- trending
  score_pop := score_pop + LEAST(FLOOR((v_downloads::FLOAT / GREATEST(view_count, 1)) * 5), 5);  -- install rate
  score_pop := LEAST(score_pop, 30);

  -- Calculate Quality (0-30)
  IF v_rating IS NOT NULL THEN
    score_qual := FLOOR((v_rating / 5.0) * 15);
  END IF;
  score_qual := score_qual + LEAST(FLOOR(LOG(GREATEST(v_rating_count, 1)) * 5), 10);
  score_qual := score_qual + CASE WHEN v_has_readme THEN 5 ELSE 0 END;
  score_qual := LEAST(score_qual, 30);

  -- Calculate Trust (0-20)
  score_trust := CASE WHEN v_author_verified THEN 10 ELSE 0 END;
  score_trust := score_trust + CASE WHEN v_verified THEN 5 ELSE 0 END;
  score_trust := score_trust + LEAST(
    (SELECT COUNT(*) FROM packages WHERE author_id = (SELECT author_id FROM packages WHERE id = pkg_id)) / 5,
    3
  );
  score_trust := score_trust + CASE
    WHEN EXISTS(SELECT 1 FROM badges WHERE package_id = pkg_id AND badge_type = 'secure') THEN 2
    ELSE 0
  END;
  score_trust := LEAST(score_trust, 20);

  -- Calculate Recency (0-10)
  score_rec := CASE
    WHEN v_days_since_update < 30 THEN 10
    WHEN v_days_since_update < 90 THEN 7
    WHEN v_days_since_update < 180 THEN 5
    WHEN v_days_since_update < 365 THEN 3
    ELSE 1
  END;

  -- Calculate Completeness (0-10)
  score_comp := CASE WHEN v_has_readme THEN 3 ELSE 0 END;
  score_comp := score_comp + LEAST(v_tags_count, 5);
  score_comp := score_comp + CASE WHEN (SELECT description FROM packages WHERE id = pkg_id) IS NOT NULL THEN 2 ELSE 0 END;
  score_comp := LEAST(score_comp, 10);

  -- Return scores
  RETURN QUERY SELECT
    score_pop,
    score_qual,
    score_trust,
    score_rec,
    score_comp,
    score_pop + score_qual + score_trust + score_rec + score_comp;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update package scores
CREATE OR REPLACE FUNCTION update_package_score()
RETURNS TRIGGER AS $$
DECLARE
  scores RECORD;
BEGIN
  SELECT * INTO scores FROM calculate_package_score(NEW.id);

  NEW.score_popularity := scores.popularity;
  NEW.score_quality := scores.quality;
  NEW.score_trust := scores.trust;
  NEW.score_recency := scores.recency;
  NEW.score_completeness := scores.completeness;
  NEW.score_total := scores.total;
  NEW.score_updated_at := NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_package_score
BEFORE UPDATE OF total_downloads, rating_average, rating_count, updated_at, verified_package
ON packages
FOR EACH ROW
EXECUTE FUNCTION update_package_score();

-- Initial score calculation for existing packages
UPDATE packages
SET score_total = 0
WHERE score_total IS NULL;

-- Comments
COMMENT ON COLUMN packages.score_total IS 'Total quality score (0-100)';
COMMENT ON COLUMN packages.score_popularity IS 'Popularity component (0-30)';
COMMENT ON COLUMN packages.score_quality IS 'Quality component (0-30)';
COMMENT ON COLUMN packages.score_trust IS 'Trust component (0-20)';
COMMENT ON COLUMN packages.score_recency IS 'Recency component (0-10)';
COMMENT ON COLUMN packages.score_completeness IS 'Completeness component (0-10)';
COMMENT ON TABLE badges IS 'Package quality badges (verified, official, popular, etc.)';
COMMENT ON TABLE ratings IS 'User ratings and reviews for packages';
COMMENT ON TABLE installation_pairs IS 'Track which packages are installed together for recommendations';

-- Rollback (for reference):
-- ALTER TABLE packages DROP COLUMN score_total;
-- ALTER TABLE packages DROP COLUMN score_popularity;
-- ALTER TABLE packages DROP COLUMN score_quality;
-- ALTER TABLE packages DROP COLUMN score_trust;
-- ALTER TABLE packages DROP COLUMN score_recency;
-- ALTER TABLE packages DROP COLUMN score_completeness;
-- ALTER TABLE packages DROP COLUMN score_updated_at;
-- ALTER TABLE packages DROP COLUMN view_count;
-- ALTER TABLE packages DROP COLUMN install_count;
-- ALTER TABLE packages DROP COLUMN install_rate;
-- ALTER TABLE packages DROP COLUMN downloads_last_7_days;
-- ALTER TABLE packages DROP COLUMN downloads_last_30_days;
-- ALTER TABLE packages DROP COLUMN trending_score;
-- DROP TABLE IF EXISTS review_votes;
-- DROP TABLE IF EXISTS ratings;
-- DROP TABLE IF EXISTS installations;
-- DROP TABLE IF EXISTS installation_pairs;
-- DROP TABLE IF EXISTS badges;
-- DROP FUNCTION IF EXISTS calculate_package_score;
-- DROP FUNCTION IF EXISTS update_package_score;
-- DROP TRIGGER IF EXISTS trigger_update_package_score ON packages;
