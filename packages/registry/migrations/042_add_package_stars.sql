-- Add stars column to packages table
ALTER TABLE packages ADD COLUMN stars INTEGER DEFAULT 0;

-- Create package_stars table for tracking user stars
CREATE TABLE package_stars (
  package_id UUID NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  starred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (package_id, user_id)
);

-- Indexes for package_stars
CREATE INDEX idx_package_stars_package ON package_stars(package_id);
CREATE INDEX idx_package_stars_user ON package_stars(user_id);
CREATE INDEX idx_package_stars_starred_at ON package_stars(starred_at DESC);

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
    SET stars = stars - 1
    WHERE id = OLD.package_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update stars
CREATE TRIGGER trigger_package_star
  AFTER INSERT OR DELETE ON package_stars
  FOR EACH ROW
  EXECUTE FUNCTION update_package_stars_count();

-- Comments
COMMENT ON TABLE package_stars IS 'User favorites/stars for packages';
COMMENT ON COLUMN packages.stars IS 'Total number of stars/favorites';
