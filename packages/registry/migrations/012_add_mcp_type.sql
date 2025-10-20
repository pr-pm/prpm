-- Migration 012: Add MCP to Package Type Constraint
-- MCP (Model Context Protocol) servers need to be a valid package type

ALTER TABLE packages DROP CONSTRAINT IF EXISTS packages_type_check;

ALTER TABLE packages ADD CONSTRAINT packages_type_check
  CHECK (type IN ('cursor', 'claude', 'claude-skill', 'continue', 'windsurf', 'generic', 'mcp'));

COMMENT ON COLUMN packages.type IS 'Package type: cursor, claude, claude-skill, continue, windsurf, generic, or mcp';
