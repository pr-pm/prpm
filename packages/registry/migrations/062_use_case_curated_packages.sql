-- Migration 062: Use case curated packages
-- Store AI-curated package recommendations for each use case with reasons

CREATE TABLE IF NOT EXISTS use_case_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  use_case_id UUID NOT NULL REFERENCES use_cases(id) ON DELETE CASCADE,
  package_id UUID NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
  recommendation_reason TEXT NOT NULL, -- AI-generated explanation of why this package fits
  sort_order INTEGER NOT NULL DEFAULT 0, -- Order in which to display packages
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  curated_by TEXT DEFAULT 'ai', -- 'ai' or username for manual curation

  -- Ensure no duplicate package per use case
  UNIQUE(use_case_id, package_id)
);

-- Index for fast lookups
CREATE INDEX idx_use_case_packages_use_case_id ON use_case_packages(use_case_id);
CREATE INDEX idx_use_case_packages_package_id ON use_case_packages(package_id);
CREATE INDEX idx_use_case_packages_sort_order ON use_case_packages(use_case_id, sort_order);

-- Update timestamp trigger
CREATE TRIGGER update_use_case_packages_updated_at
  BEFORE UPDATE ON use_case_packages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comment
COMMENT ON TABLE use_case_packages IS 'AI-curated package recommendations for use cases with explanations';
COMMENT ON COLUMN use_case_packages.recommendation_reason IS 'AI-generated or manually written explanation of why this package is recommended for this use case';
COMMENT ON COLUMN use_case_packages.sort_order IS 'Display order (lower numbers first)';
COMMENT ON COLUMN use_case_packages.curated_by IS 'Source of curation: ai or username';
