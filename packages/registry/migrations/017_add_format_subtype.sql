-- Migration: Add format and subtype columns to packages table
-- This separates the taxonomy into Format (platform) and Subtype (functional category)

-- Add new columns
ALTER TABLE packages ADD COLUMN IF NOT EXISTS format TEXT;
ALTER TABLE packages ADD COLUMN IF NOT EXISTS subtype TEXT;

-- Migrate existing data from type column to format + subtype
UPDATE packages SET
  format = CASE
    -- Collections
    WHEN type = 'collection' THEN 'generic'
    -- MCP
    WHEN type = 'mcp' THEN 'mcp'
    -- Compound types (cursor-agent, claude-skill, etc.)
    WHEN type LIKE '%-%' THEN split_part(type, '-', 1)
    -- Simple types
    ELSE type
  END,
  subtype = CASE
    -- Collection
    WHEN type = 'collection' THEN 'collection'
    -- MCP defaults to tool
    WHEN type = 'mcp' THEN 'tool'
    -- cursor-agent, claude-agent, etc.
    WHEN type LIKE '%-agent' THEN 'agent'
    -- cursor-slash-command, claude-slash-command
    WHEN type LIKE '%-slash-command' THEN 'slash-command'
    -- claude-skill
    WHEN type LIKE '%-skill' THEN 'skill'
    -- Simple types default to rule
    ELSE 'rule'
  END;

-- Add constraints
ALTER TABLE packages ADD CONSTRAINT packages_format_check
  CHECK (format IN ('cursor', 'claude', 'continue', 'windsurf', 'copilot', 'kiro', 'generic', 'mcp'));

ALTER TABLE packages ADD CONSTRAINT packages_subtype_check
  CHECK (subtype IN ('rule', 'agent', 'skill', 'slash-command', 'prompt', 'workflow', 'tool', 'template', 'collection') OR subtype IS NULL);

-- Make format NOT NULL after migration
ALTER TABLE packages ALTER COLUMN format SET NOT NULL;

-- Add index for common queries
CREATE INDEX IF NOT EXISTS idx_packages_format ON packages(format);
CREATE INDEX IF NOT EXISTS idx_packages_subtype ON packages(subtype);
CREATE INDEX IF NOT EXISTS idx_packages_format_subtype ON packages(format, subtype);

-- Note: We keep the 'type' column for backward compatibility
-- It will be automatically updated via a trigger to stay in sync with format + subtype

-- Create function to sync type from format + subtype
CREATE OR REPLACE FUNCTION sync_package_type()
RETURNS TRIGGER AS $$
BEGIN
  -- Sync type based on format and subtype
  NEW.type := CASE
    WHEN NEW.subtype = 'collection' THEN 'collection'
    WHEN NEW.subtype IS NULL OR NEW.subtype = 'rule' OR NEW.subtype = 'prompt' THEN NEW.format
    WHEN NEW.subtype = 'agent' THEN NEW.format || '-agent'
    WHEN NEW.subtype = 'skill' THEN NEW.format || '-skill'
    WHEN NEW.subtype = 'slash-command' THEN NEW.format || '-slash-command'
    ELSE NEW.format
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to keep type in sync
DROP TRIGGER IF EXISTS sync_package_type_trigger ON packages;
CREATE TRIGGER sync_package_type_trigger
  BEFORE INSERT OR UPDATE OF format, subtype ON packages
  FOR EACH ROW
  EXECUTE FUNCTION sync_package_type();

-- Update existing rows to ensure type is in sync
UPDATE packages SET format = format; -- This will trigger the sync function
