-- Migration: Add 'chatmode' to subtype constraint
-- This updates the constraint for databases that already ran migration 017 before chatmode was added

-- Drop the existing subtype constraint
ALTER TABLE packages DROP CONSTRAINT IF EXISTS packages_subtype_check;

-- Recreate with chatmode included (maintain consistent order with migration 017)
ALTER TABLE packages ADD CONSTRAINT packages_subtype_check
  CHECK (subtype IN ('rule', 'agent', 'skill', 'slash-command', 'prompt', 'workflow', 'tool', 'template', 'collection', 'chatmode'));

-- Update existing copilot-chatmode packages to use chatmode subtype
-- These were imported with subtype='prompt' before chatmode was available
UPDATE packages p
SET subtype = 'chatmode'
FROM package_versions pv
WHERE p.id = pv.package_id
  AND p.format = 'copilot'
  AND p.subtype = 'prompt'
  AND pv.metadata->>'originalType' = 'copilot-chatmode';
