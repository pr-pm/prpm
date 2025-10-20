-- Migration 002: Add Category Index and Constraints
-- Adds index for category field and updates category constraints

-- Add index on category field for efficient filtering
CREATE INDEX IF NOT EXISTS idx_packages_category ON packages(category);

-- Add GIN index for tags array for better search performance
CREATE INDEX IF NOT EXISTS idx_packages_tags ON packages USING GIN(tags);

-- Add GIN index for keywords array
CREATE INDEX IF NOT EXISTS idx_packages_keywords ON packages USING GIN(keywords);

-- Add composite index for category + type queries (common pattern)
CREATE INDEX IF NOT EXISTS idx_packages_category_type ON packages(category, type);

-- Add composite index for category + visibility + created_at (for browsing)
CREATE INDEX IF NOT EXISTS idx_packages_category_visibility_created ON packages(category, visibility, created_at DESC);

-- Update category check constraint to include valid categories
-- Note: This will need to be updated when new categories are added
ALTER TABLE packages DROP CONSTRAINT IF EXISTS packages_category_check;

ALTER TABLE packages ADD CONSTRAINT packages_category_check
  CHECK (
    category IS NULL OR
    category IN (
      -- Development
      'development',
      'development/frontend',
      'development/backend',
      'development/mobile',
      'development/devops',
      'development/testing',
      'development/architecture',
      -- Data
      'data',
      'data/analysis',
      'data/ml',
      'data/etl',
      'data/sql',
      'data/visualization',
      -- Writing
      'writing',
      'writing/documentation',
      'writing/creative',
      'writing/business',
      'writing/marketing',
      'writing/academic',
      -- Productivity
      'productivity',
      'productivity/automation',
      'productivity/planning',
      'productivity/research',
      'productivity/templates',
      -- Education
      'education',
      'education/tutorial',
      'education/exercise',
      'education/explanation',
      'education/teaching',
      -- Design
      'design',
      'design/ui-ux',
      'design/graphics',
      'design/web',
      'design/branding',
      -- Business
      'business',
      'business/strategy',
      'business/finance',
      'business/sales',
      'business/operations',
      -- Security
      'security',
      'security/audit',
      'security/compliance',
      'security/pentesting',
      'security/encryption',
      -- Tools
      'tools',
      'tools/conversion',
      'tools/generation',
      'tools/validation',
      'tools/debugging',
      -- General
      'general',
      'general/assistant',
      'general/starter',
      'general/misc'
    )
  );

-- Add comment to explain category usage
COMMENT ON COLUMN packages.category IS 'Package category from predefined taxonomy. Format: primary or primary/subcategory';

-- Create a view for category statistics
CREATE OR REPLACE VIEW category_stats AS
SELECT
  COALESCE(category, 'uncategorized') as category,
  COUNT(*) as package_count,
  SUM(total_downloads) as total_downloads,
  AVG(quality_score) as avg_quality_score,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as packages_last_30_days
FROM packages
WHERE visibility = 'public'
GROUP BY category
ORDER BY package_count DESC;

COMMENT ON VIEW category_stats IS 'Statistics about packages grouped by category';
