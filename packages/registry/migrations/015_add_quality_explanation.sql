-- Migration 015: Add quality_explanation field to packages table
-- This field stores detailed AI-generated explanations for package quality scores

ALTER TABLE packages
ADD COLUMN quality_explanation TEXT;

-- Add comment for documentation
COMMENT ON COLUMN packages.quality_explanation IS 'AI-generated explanation of the quality score, providing detailed reasoning for the score';
