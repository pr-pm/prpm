-- Migration: Add stars support for packages and collections
-- Created: 2025-11-13
-- Description: Adds package_stars table with triggers (collection_stars already exists from migration 004)

-- Add stars column to packages table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='packages' AND column_name='stars') THEN
    ALTER TABLE packages ADD COLUMN stars INTEGER DEFAULT 0;
  END IF;
END $$;

-- Create package_stars table for tracking user stars
CREATE TABLE IF NOT EXISTS package_stars (
  package_id UUID NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  starred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (package_id, user_id)
);

-- Indexes for package_stars
CREATE INDEX IF NOT EXISTS idx_package_stars_package ON package_stars(package_id);
CREATE INDEX IF NOT EXISTS idx_package_stars_user ON package_stars(user_id);
CREATE INDEX IF NOT EXISTS idx_package_stars_starred_at ON package_stars(starred_at DESC);

-- Function to update package stars count
CREATE OR REPLACE FUNCTION update_package_stars_count()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE packages
    SET stars = stars + 1
    WHERE id = NEW.package_id;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE packages
    SET stars = GREATEST(stars - 1, 0)  -- Prevent negative stars
    WHERE id = OLD.package_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate to ensure it's correct
DROP TRIGGER IF EXISTS trigger_package_star ON package_stars;
CREATE TRIGGER trigger_package_star
  AFTER INSERT OR DELETE ON package_stars
  FOR EACH ROW
  EXECUTE FUNCTION update_package_stars_count();

-- Recalculate existing star counts from package_stars table
UPDATE packages p
SET stars = (
  SELECT COUNT(*)
  FROM package_stars ps
  WHERE ps.package_id = p.id
)
WHERE EXISTS (
  SELECT 1 FROM package_stars ps WHERE ps.package_id = p.id
);

-- Comments
COMMENT ON TABLE package_stars IS 'User favorites/stars for packages';
COMMENT ON COLUMN packages.stars IS 'Total number of stars/favorites';

-- Verify collection_stars trigger is correct (it should exist from migration 004)
-- If not, recreate it with GREATEST to prevent negative stars
CREATE OR REPLACE FUNCTION update_collection_stars_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE collections
    SET stars = stars + 1
    WHERE scope = NEW.collection_scope
      AND id = NEW.collection_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE collections
    SET stars = GREATEST(stars - 1, 0)  -- Prevent negative stars
    WHERE scope = OLD.collection_scope
      AND id = OLD.collection_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;
