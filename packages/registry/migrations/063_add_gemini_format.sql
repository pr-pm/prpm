-- Migration 063: Add Gemini Format Support
-- Add support for Gemini CLI custom commands as a package type

ALTER TABLE packages DROP CONSTRAINT IF EXISTS packages_type_check;

ALTER TABLE packages ADD CONSTRAINT packages_type_check
  CHECK (type IN ('cursor', 'cursor-agent', 'cursor-slash-command', 'claude', 'claude-skill', 'claude-agent', 'claude-slash-command', 'continue', 'windsurf', 'copilot', 'kiro', 'gemini', 'generic', 'mcp'));

COMMENT ON COLUMN packages.type IS 'Package type: cursor, cursor-agent, cursor-slash-command, claude, claude-skill, claude-agent, claude-slash-command, continue, windsurf, copilot (GitHub Copilot instructions), kiro (Kiro steering files), gemini (Gemini CLI custom commands), generic, or mcp';
