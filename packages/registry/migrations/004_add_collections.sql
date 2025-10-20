-- Migration: Add collections support
-- Created: 2025-10-18
-- Description: Add collections (package bundles) support to the registry

-- Collections table
CREATE TABLE collections (
  id VARCHAR(255) NOT NULL,
  scope VARCHAR(100) NOT NULL,        -- 'collection' (official) or username
  name VARCHAR(255) NOT NULL,
  description TEXT,
  version VARCHAR(50) NOT NULL,

  -- Ownership
  author_id UUID REFERENCES users(id) NOT NULL,  -- Foreign key to users table
  maintainers TEXT[],                 -- Array of usernames
  official BOOLEAN DEFAULT FALSE,
  verified BOOLEAN DEFAULT FALSE,

  -- Classification
  category VARCHAR(100),
  tags TEXT[],
  framework VARCHAR(100),

  -- Stats
  downloads INTEGER DEFAULT 0,
  stars INTEGER DEFAULT 0,

  -- Display
  icon VARCHAR(255),
  banner VARCHAR(500),
  readme TEXT,

  -- Configuration
  config JSONB,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  PRIMARY KEY (scope, id, version),
  UNIQUE (scope, id, version)
);

-- Indexes for collections
CREATE INDEX idx_collections_scope ON collections(scope);
CREATE INDEX idx_collections_category ON collections(category);
CREATE INDEX idx_collections_tags ON collections USING GIN(tags);
CREATE INDEX idx_collections_downloads ON collections(downloads DESC);
CREATE INDEX idx_collections_official ON collections(official);
CREATE INDEX idx_collections_author_id ON collections(author_id);
CREATE INDEX idx_collections_created ON collections(created_at DESC);

-- Collection packages (many-to-many relationship)
CREATE TABLE collection_packages (
  collection_scope VARCHAR(100) NOT NULL,
  collection_id VARCHAR(255) NOT NULL,
  collection_version VARCHAR(50) NOT NULL,

  package_id UUID NOT NULL,
  package_version VARCHAR(50),        -- NULL means 'latest'

  required BOOLEAN DEFAULT TRUE,
  reason TEXT,
  install_order INTEGER DEFAULT 0,
  format_override VARCHAR(50),        -- Override format for this specific package

  PRIMARY KEY (collection_scope, collection_id, collection_version, package_id),
  FOREIGN KEY (collection_scope, collection_id, collection_version)
    REFERENCES collections(scope, id, version) ON DELETE CASCADE,
  FOREIGN KEY (package_id)
    REFERENCES packages(id) ON DELETE RESTRICT  -- Don't delete if used in collection
);

-- Indexes for collection_packages
CREATE INDEX idx_collection_packages_collection ON collection_packages(collection_scope, collection_id);
CREATE INDEX idx_collection_packages_package ON collection_packages(package_id);
CREATE INDEX idx_collection_packages_order ON collection_packages(collection_scope, collection_id, collection_version, install_order);

-- Collection installations tracking
CREATE TABLE collection_installs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  collection_scope VARCHAR(100) NOT NULL,
  collection_id VARCHAR(255) NOT NULL,
  collection_version VARCHAR(50) NOT NULL,

  user_id UUID,
  format VARCHAR(50),

  installed_at TIMESTAMP DEFAULT NOW(),

  FOREIGN KEY (collection_scope, collection_id, collection_version)
    REFERENCES collections(scope, id, version) ON DELETE CASCADE
);

-- Indexes for collection_installs
CREATE INDEX idx_collection_installs_collection ON collection_installs(collection_scope, collection_id);
CREATE INDEX idx_collection_installs_date ON collection_installs(installed_at);
CREATE INDEX idx_collection_installs_user ON collection_installs(user_id);

-- Collection stars (user favorites)
CREATE TABLE collection_stars (
  collection_scope VARCHAR(100) NOT NULL,
  collection_id VARCHAR(255) NOT NULL,
  user_id UUID NOT NULL,

  starred_at TIMESTAMP DEFAULT NOW(),

  PRIMARY KEY (collection_scope, collection_id, user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for collection_stars
CREATE INDEX idx_collection_stars_collection ON collection_stars(collection_scope, collection_id);
CREATE INDEX idx_collection_stars_user ON collection_stars(user_id);

-- Function to update collection downloads count
CREATE OR REPLACE FUNCTION update_collection_downloads()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE collections
  SET downloads = downloads + 1
  WHERE scope = NEW.collection_scope
    AND id = NEW.collection_id
    AND version = NEW.collection_version;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update downloads
CREATE TRIGGER trigger_collection_install
  AFTER INSERT ON collection_installs
  FOR EACH ROW
  EXECUTE FUNCTION update_collection_downloads();

-- Function to update collection stars count
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
    SET stars = stars - 1
    WHERE scope = OLD.collection_scope
      AND id = OLD.collection_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update stars
CREATE TRIGGER trigger_collection_star
  AFTER INSERT OR DELETE ON collection_stars
  FOR EACH ROW
  EXECUTE FUNCTION update_collection_stars_count();

-- View for latest collection versions
CREATE VIEW collection_latest AS
SELECT DISTINCT ON (scope, id)
  scope,
  id,
  version,
  name,
  description,
  author_id,
  official,
  verified,
  category,
  tags,
  framework,
  downloads,
  stars,
  icon,
  created_at,
  updated_at
FROM collections
ORDER BY scope, id, created_at DESC;

-- Comments for documentation
COMMENT ON TABLE collections IS 'Collections (bundles) of packages';
COMMENT ON TABLE collection_packages IS 'Many-to-many relationship between collections and packages';
COMMENT ON TABLE collection_installs IS 'Tracks collection installations for analytics';
COMMENT ON TABLE collection_stars IS 'User favorites/stars for collections';
COMMENT ON COLUMN collections.scope IS 'Namespace: "collection" for official, username for community';
COMMENT ON COLUMN collections.official IS 'Official PRPM-curated collection';
COMMENT ON COLUMN collections.author_id IS 'Foreign key to users table - the collection creator';
COMMENT ON COLUMN collections.config IS 'JSON configuration: defaultFormat, installOrder, postInstall, etc.';
