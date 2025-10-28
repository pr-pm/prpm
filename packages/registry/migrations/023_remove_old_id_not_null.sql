-- Remove NOT NULL constraint from old_id column in collections table
-- This column is only used for tracking legacy IDs from migrations and should be nullable

ALTER TABLE collections ALTER COLUMN old_id DROP NOT NULL;
