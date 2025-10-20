-- Migration: Update collections to use UUID as primary key
-- Created: 2025-10-20
-- Description: Change collections to use UUID as id instead of name-based id, add name field

-- Add new uuid_id column and name column
ALTER TABLE collections ADD COLUMN uuid_id UUID DEFAULT gen_random_uuid();
ALTER TABLE collections ADD COLUMN name_slug VARCHAR(255);

-- Copy current id to name_slug
UPDATE collections SET name_slug = id;

-- Drop existing foreign key constraints
ALTER TABLE collection_packages DROP CONSTRAINT collection_packages_collection_scope_collection_id_collection_fkey;
ALTER TABLE collection_installs DROP CONSTRAINT collection_installs_collection_scope_collection_id_collec_fkey;

-- Add uuid_id to related tables
ALTER TABLE collection_packages ADD COLUMN collection_uuid_id UUID;
ALTER TABLE collection_installs ADD COLUMN collection_uuid_id UUID;
ALTER TABLE collection_stars ADD COLUMN collection_uuid_id UUID;

-- Populate uuid_id in related tables
UPDATE collection_packages cp
SET collection_uuid_id = c.uuid_id
FROM collections c
WHERE cp.collection_scope = c.scope
  AND cp.collection_id = c.id
  AND cp.collection_version = c.version;

UPDATE collection_installs ci
SET collection_uuid_id = c.uuid_id
FROM collections c
WHERE ci.collection_scope = c.scope
  AND ci.collection_id = c.id
  AND ci.collection_version = c.version;

UPDATE collection_stars cs
SET collection_uuid_id = c.uuid_id
FROM collections c
WHERE cs.collection_scope = c.scope
  AND cs.collection_id = c.id;

-- Drop old primary key
ALTER TABLE collections DROP CONSTRAINT collections_pkey;

-- Rename columns
ALTER TABLE collections RENAME COLUMN id TO old_id;
ALTER TABLE collections RENAME COLUMN uuid_id TO id;

-- Set id as NOT NULL and make it primary key
ALTER TABLE collections ALTER COLUMN id SET NOT NULL;
ALTER TABLE collections ADD PRIMARY KEY (id);

-- Add unique constraint on scope + name_slug + version
ALTER TABLE collections ADD CONSTRAINT collections_scope_slug_version_unique UNIQUE (scope, name_slug, version);

-- Update collection_packages primary key and foreign keys
ALTER TABLE collection_packages DROP CONSTRAINT collection_packages_pkey;
ALTER TABLE collection_packages DROP COLUMN collection_scope;
ALTER TABLE collection_packages DROP COLUMN collection_id;
ALTER TABLE collection_packages DROP COLUMN collection_version;
ALTER TABLE collection_packages RENAME COLUMN collection_uuid_id TO collection_id;
ALTER TABLE collection_packages ALTER COLUMN collection_id SET NOT NULL;
ALTER TABLE collection_packages ADD PRIMARY KEY (collection_id, package_id);
ALTER TABLE collection_packages ADD CONSTRAINT collection_packages_collection_fkey
  FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE;

-- Update collection_installs
ALTER TABLE collection_installs DROP COLUMN collection_scope;
ALTER TABLE collection_installs DROP COLUMN collection_id;
ALTER TABLE collection_installs DROP COLUMN collection_version;
ALTER TABLE collection_installs RENAME COLUMN collection_uuid_id TO collection_id;
ALTER TABLE collection_installs ALTER COLUMN collection_id SET NOT NULL;
ALTER TABLE collection_installs ADD CONSTRAINT collection_installs_collection_fkey
  FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE;

-- Update collection_stars
ALTER TABLE collection_stars DROP CONSTRAINT collection_stars_pkey;
ALTER TABLE collection_stars DROP COLUMN collection_scope;
ALTER TABLE collection_stars DROP COLUMN collection_id;
ALTER TABLE collection_stars RENAME COLUMN collection_uuid_id TO collection_id;
ALTER TABLE collection_stars ALTER COLUMN collection_id SET NOT NULL;
ALTER TABLE collection_stars ADD PRIMARY KEY (collection_id, user_id);
ALTER TABLE collection_stars ADD CONSTRAINT collection_stars_collection_fkey
  FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE;

-- Update indexes
DROP INDEX IF EXISTS idx_collections_scope;
DROP INDEX IF EXISTS idx_collection_packages_collection;
DROP INDEX IF EXISTS idx_collection_packages_order;
DROP INDEX IF EXISTS idx_collection_installs_collection;
DROP INDEX IF EXISTS idx_collection_stars_collection;

CREATE INDEX idx_collections_scope ON collections(scope);
CREATE INDEX idx_collections_name_slug ON collections(name_slug);
CREATE INDEX idx_collections_scope_slug ON collections(scope, name_slug);
CREATE INDEX idx_collection_packages_collection ON collection_packages(collection_id);
CREATE INDEX idx_collection_installs_collection ON collection_installs(collection_id);
CREATE INDEX idx_collection_stars_collection ON collection_stars(collection_id);

-- Update triggers to use new structure
DROP TRIGGER IF EXISTS trigger_collection_install ON collection_installs;
DROP FUNCTION IF EXISTS update_collection_downloads();

CREATE OR REPLACE FUNCTION update_collection_downloads()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE collections
  SET downloads = downloads + 1
  WHERE id = NEW.collection_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_collection_install
  AFTER INSERT ON collection_installs
  FOR EACH ROW
  EXECUTE FUNCTION update_collection_downloads();

-- Update star count trigger
DROP TRIGGER IF EXISTS trigger_collection_star ON collection_stars;
DROP FUNCTION IF EXISTS update_collection_stars_count();

CREATE OR REPLACE FUNCTION update_collection_stars_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE collections
    SET stars = stars + 1
    WHERE id = NEW.collection_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE collections
    SET stars = stars - 1
    WHERE id = OLD.collection_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_collection_star
  AFTER INSERT OR DELETE ON collection_stars
  FOR EACH ROW
  EXECUTE FUNCTION update_collection_stars_count();

-- Update view
DROP VIEW IF EXISTS collection_latest;
CREATE VIEW collection_latest AS
SELECT DISTINCT ON (scope, name_slug)
  id,
  scope,
  name_slug,
  old_id as display_id,
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
ORDER BY scope, name_slug, created_at DESC;

-- Add comments
COMMENT ON COLUMN collections.id IS 'Unique UUID identifier for the collection';
COMMENT ON COLUMN collections.name_slug IS 'URL-friendly name slug (e.g., "startup-mvp")';
COMMENT ON COLUMN collections.old_id IS 'Legacy name-based identifier (kept for compatibility)';
