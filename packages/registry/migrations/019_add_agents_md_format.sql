-- Migration: Add 'agents.md' format support
-- The agents.md format is an open standard for AI coding agent instructions
-- https://github.com/openai/agents.md

-- Drop the existing format constraint
ALTER TABLE packages DROP CONSTRAINT IF EXISTS packages_format_check;

-- Recreate with agents.md included
ALTER TABLE packages ADD CONSTRAINT packages_format_check
  CHECK (format IN ('cursor', 'claude', 'continue', 'windsurf', 'copilot', 'kiro', 'agents.md', 'generic', 'mcp'));
