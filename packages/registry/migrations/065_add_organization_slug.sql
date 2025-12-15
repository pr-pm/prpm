/**
 * Add organization slug for stable, space-free scopes
 *
 * - Adds slug column to organizations
 * - Backfills slug from name (lowercase, non-alphanumeric -> hyphen, trim/condense)
 * - Enforces uniqueness and adds lookup index
 */

-- Add slug column (allow null during backfill)
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS slug varchar(120);

-- Backfill existing rows
UPDATE organizations
SET slug = regexp_replace(lower(name), '[^a-z0-9]+', '-', 'g')
WHERE slug IS NULL;

-- Normalize double/multi hyphens and trim edges
UPDATE organizations
SET slug = regexp_replace(regexp_replace(slug, '^-+|-+$', '', 'g'), '-{2,}', '-', 'g')
WHERE slug IS NOT NULL;

-- Enforce NOT NULL and uniqueness
ALTER TABLE organizations ALTER COLUMN slug SET NOT NULL;
ALTER TABLE organizations ADD CONSTRAINT organizations_slug_key UNIQUE (slug);

-- Index for lookups
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
