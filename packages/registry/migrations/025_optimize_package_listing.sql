-- Migration: Optimize package listing queries
-- Improves performance for the main package list endpoint

-- Create composite index for visibility + downloads (most common query)
CREATE INDEX IF NOT EXISTS idx_packages_visibility_downloads
  ON packages(visibility, total_downloads DESC)
  WHERE visibility = 'public';

-- Create composite index for visibility + created_at
CREATE INDEX IF NOT EXISTS idx_packages_visibility_created
  ON packages(visibility, created_at DESC)
  WHERE visibility = 'public';

-- Create composite index for visibility + updated_at
CREATE INDEX IF NOT EXISTS idx_packages_visibility_updated
  ON packages(visibility, updated_at DESC)
  WHERE visibility = 'public';

-- Create composite index for visibility + quality_score
CREATE INDEX IF NOT EXISTS idx_packages_visibility_quality
  ON packages(visibility, quality_score DESC NULLS LAST)
  WHERE visibility = 'public';

-- Create composite index for visibility + rating
CREATE INDEX IF NOT EXISTS idx_packages_visibility_rating
  ON packages(visibility, rating_average DESC NULLS LAST)
  WHERE visibility = 'public';

-- Create composite index for format + visibility + downloads
CREATE INDEX IF NOT EXISTS idx_packages_format_visibility_downloads
  ON packages(format, visibility, total_downloads DESC)
  WHERE visibility = 'public';

-- Create composite index for subtype + visibility + downloads
CREATE INDEX IF NOT EXISTS idx_packages_subtype_visibility_downloads
  ON packages(subtype, visibility, total_downloads DESC)
  WHERE visibility = 'public';

-- Create composite index for format + subtype + visibility + downloads
CREATE INDEX IF NOT EXISTS idx_packages_format_subtype_visibility_downloads
  ON packages(format, subtype, visibility, total_downloads DESC)
  WHERE visibility = 'public';

-- Analyze table to update statistics
ANALYZE packages;
