-- Migration 013: Add Claude Agent and Slash Command Types
-- Add support for Claude agents and slash commands as package types

ALTER TABLE packages DROP CONSTRAINT IF EXISTS packages_type_check;

ALTER TABLE packages ADD CONSTRAINT packages_type_check
  CHECK (type IN ('cursor', 'claude', 'claude-skill', 'claude-agent', 'claude-slash-command', 'continue', 'windsurf', 'generic', 'mcp'));

COMMENT ON COLUMN packages.type IS 'Package type: cursor, claude, claude-skill, claude-agent, claude-slash-command, continue, windsurf, generic, or mcp';
