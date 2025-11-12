-- Migration: Allow NULL package_id and package_name for custom prompts
-- Created: 2025-11-10
-- Reason: Custom prompts don't have a package, need to allow NULL

-- Make package_id nullable (was NOT NULL)
ALTER TABLE playground_sessions
  ALTER COLUMN package_id DROP NOT NULL;

-- Make package_name nullable (was NOT NULL)
ALTER TABLE playground_sessions
  ALTER COLUMN package_name DROP NOT NULL;

-- Add a check constraint to ensure either package_id is set OR it's a custom prompt
-- (We'll use package_name = 'Custom Prompt' as the indicator)
ALTER TABLE playground_sessions
  ADD CONSTRAINT playground_sessions_package_or_custom_check
  CHECK (
    package_id IS NOT NULL OR package_name = 'Custom Prompt'
  );

-- Add index for custom prompt sessions
CREATE INDEX idx_playground_sessions_custom_prompts
  ON playground_sessions(user_id, created_at DESC)
  WHERE package_id IS NULL AND package_name = 'Custom Prompt';
