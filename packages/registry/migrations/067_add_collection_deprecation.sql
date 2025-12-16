-- Migration: Add deprecation support for collections
-- Created: 2025-12-16
-- Description: Add deprecated flag and reason columns to collections table

-- Add deprecation columns to collections
ALTER TABLE collections ADD COLUMN IF NOT EXISTS deprecated BOOLEAN DEFAULT FALSE;
ALTER TABLE collections ADD COLUMN IF NOT EXISTS deprecated_reason TEXT;

-- Create index for filtering non-deprecated collections
CREATE INDEX IF NOT EXISTS idx_collections_deprecated ON collections(deprecated) WHERE deprecated = FALSE;
