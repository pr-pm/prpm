-- Fix calculate_package_score function to accept UUID instead of VARCHAR
-- The function was originally defined with VARCHAR(255) but packages.id is UUID

DROP FUNCTION IF EXISTS calculate_package_score(character varying);

CREATE OR REPLACE FUNCTION calculate_package_score(pkg_id UUID)
RETURNS TABLE(
  popularity INTEGER,
  quality INTEGER,
  trust INTEGER,
  recency INTEGER,
  completeness INTEGER,
  total INTEGER
) AS $$
DECLARE
  downloads INTEGER;
  weekly_downloads INTEGER;
  monthly_downloads INTEGER;
  rating_avg DECIMAL;
  rating_cnt INTEGER;
  version_cnt INTEGER;
  age_days INTEGER;
  last_update_days INTEGER;
  has_description BOOLEAN;
  has_readme BOOLEAN;
  has_license BOOLEAN;
  has_repository BOOLEAN;
  has_homepage BOOLEAN;
  has_documentation BOOLEAN;
  tag_count INTEGER;
  is_verified BOOLEAN;
  is_featured BOOLEAN;

  -- Score components
  pop_score INTEGER := 0;
  qual_score INTEGER := 0;
  trust_score INTEGER := 0;
  rec_score INTEGER := 0;
  comp_score INTEGER := 0;
BEGIN
  -- Get package data
  SELECT
    COALESCE(p.total_downloads, 0),
    COALESCE(p.weekly_downloads, 0),
    COALESCE(p.monthly_downloads, 0),
    COALESCE(p.rating_average, 0),
    COALESCE(p.rating_count, 0),
    COALESCE(p.version_count, 0),
    EXTRACT(DAY FROM NOW() - p.created_at)::INTEGER,
    EXTRACT(DAY FROM NOW() - p.updated_at)::INTEGER,
    p.description IS NOT NULL AND LENGTH(TRIM(p.description)) > 10,
    p.repository_url IS NOT NULL,
    p.license IS NOT NULL,
    p.repository_url IS NOT NULL,
    p.homepage_url IS NOT NULL,
    p.documentation_url IS NOT NULL,
    array_length(p.tags, 1),
    COALESCE(p.verified, FALSE),
    COALESCE(p.featured, FALSE)
  INTO
    downloads, weekly_downloads, monthly_downloads,
    rating_avg, rating_cnt,
    version_cnt, age_days, last_update_days,
    has_description, has_readme, has_license,
    has_repository, has_homepage, has_documentation,
    tag_count, is_verified, is_featured
  FROM packages p
  WHERE p.id = pkg_id;

  -- Popularity Score (0-100)
  pop_score := LEAST(100, (
    LEAST(50, downloads / 10) +                    -- Downloads (max 50 points)
    LEAST(30, weekly_downloads * 2) +              -- Weekly activity (max 30 points)
    LEAST(20, rating_cnt * 5)                      -- Rating count (max 20 points)
  )::INTEGER);

  -- Quality Score (0-100)
  qual_score := (
    LEAST(40, GREATEST(0, (rating_avg - 3.0) * 20)::INTEGER) +  -- Rating quality (max 40 points, 3.0+ baseline)
    CASE WHEN has_description THEN 15 ELSE 0 END +              -- Has description (15 points)
    CASE WHEN has_readme THEN 15 ELSE 0 END +                  -- Has readme (15 points)
    LEAST(20, version_cnt * 5) +                               -- Version history (max 20 points)
    LEAST(10, COALESCE(tag_count, 0) * 2)                      -- Tags (max 10 points)
  )::INTEGER;

  -- Trust Score (0-100)
  trust_score := (
    CASE WHEN is_verified THEN 40 ELSE 0 END +                 -- Verified (40 points)
    CASE WHEN is_featured THEN 30 ELSE 0 END +                 -- Featured (30 points)
    CASE WHEN has_license THEN 10 ELSE 0 END +                 -- Has license (10 points)
    CASE WHEN has_repository THEN 10 ELSE 0 END +              -- Has repository (10 points)
    CASE WHEN has_homepage OR has_documentation THEN 10 ELSE 0 END  -- Has docs (10 points)
  )::INTEGER;

  -- Recency Score (0-100) - Decay over time
  rec_score := GREATEST(0, LEAST(100, (
    100 - (last_update_days / 3)                               -- Decay 1 point per 3 days since last update
  )::INTEGER));

  -- Completeness Score (0-100)
  comp_score := (
    CASE WHEN has_description THEN 20 ELSE 0 END +
    CASE WHEN has_readme THEN 20 ELSE 0 END +
    CASE WHEN has_license THEN 15 ELSE 0 END +
    CASE WHEN has_repository THEN 15 ELSE 0 END +
    CASE WHEN has_homepage THEN 10 ELSE 0 END +
    CASE WHEN has_documentation THEN 10 ELSE 0 END +
    CASE WHEN COALESCE(tag_count, 0) >= 3 THEN 10 ELSE COALESCE(tag_count, 0) * 3 END
  )::INTEGER;

  -- Return all scores
  RETURN QUERY SELECT
    pop_score,
    qual_score,
    trust_score,
    rec_score,
    comp_score,
    (pop_score + qual_score + trust_score + rec_score + comp_score) / 5 AS total;
END;
$$ LANGUAGE plpgsql;
