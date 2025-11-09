-- Migration 041: Allow NULL author_id in suggested_test_inputs
-- Description: Allows organization-owned packages to have suggested test inputs without requiring a direct author_id
-- Author: AI Assistant
-- Date: 2025-01-09

-- Allow NULL author_id for organization packages
ALTER TABLE suggested_test_inputs ALTER COLUMN author_id DROP NOT NULL;

-- Add comment explaining the nullable field
COMMENT ON COLUMN suggested_test_inputs.author_id IS 'User who created this suggested input. Can be NULL for organization-owned packages where the creator is an org member but not the package author.';

-- Note: Existing suggested_test_inputs with author_id will remain unchanged
-- New suggested inputs for org packages can now be created with NULL author_id
