-- Migration: Add 'snippet' to subtype constraint
-- Snippets are content that gets appended to existing files (AGENTS.md, CLAUDE.md, etc.)

-- Drop the existing subtype constraint
ALTER TABLE packages DROP CONSTRAINT IF EXISTS packages_subtype_check;

-- Recreate with snippet included
ALTER TABLE packages ADD CONSTRAINT packages_subtype_check
  CHECK (subtype IN ('rule', 'agent', 'skill', 'slash-command', 'prompt', 'workflow', 'tool', 'template', 'collection', 'chatmode', 'hook', 'snippet'));
