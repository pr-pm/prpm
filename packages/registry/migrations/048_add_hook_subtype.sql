-- Migration: Add 'hook' to subtype constraint
-- Hooks are automation scripts that execute on events in Claude Code and Kiro IDEs

-- Drop the existing subtype constraint
ALTER TABLE packages DROP CONSTRAINT IF EXISTS packages_subtype_check;

-- Recreate with hook included
ALTER TABLE packages ADD CONSTRAINT packages_subtype_check
  CHECK (subtype IN ('rule', 'agent', 'skill', 'slash-command', 'prompt', 'workflow', 'tool', 'template', 'collection', 'chatmode', 'hook'));
