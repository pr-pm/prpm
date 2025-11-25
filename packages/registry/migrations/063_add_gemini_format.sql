-- Migration 063: Add Gemini Format Support
-- Add support for Gemini CLI custom commands as a package format

ALTER TABLE packages DROP CONSTRAINT IF EXISTS packages_format_check;

ALTER TABLE packages ADD CONSTRAINT packages_format_check
  CHECK (format IN ('cursor', 'claude', 'continue', 'windsurf', 'copilot', 'kiro', 'gemini', 'generic', 'mcp', 'agents.md'));

COMMENT ON COLUMN packages.format IS 'Package format: cursor, claude, continue, windsurf, copilot (GitHub Copilot instructions), kiro (Kiro steering files), gemini (Gemini CLI custom commands), generic, mcp, or agents.md';
