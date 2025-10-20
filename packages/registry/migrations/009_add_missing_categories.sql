-- Migration 009: Add Missing Categories
-- Adds new categories that were missing from scraped data

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
      'development/framework',
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
      'productivity/workflow',
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
      'tools/automation',
      -- General
      'general',
      'general/assistant',
      'general/starter',
      'general/misc',
      -- Code Quality
      'code-quality',
      'code-quality/review',
      'code-quality/refactoring',
      'code-quality/analysis',
      -- Testing (standalone)
      'testing',
      'testing/unit',
      'testing/e2e',
      'testing/integration',
      -- DevOps (standalone)
      'devops',
      'devops/ci-cd',
      'devops/infrastructure',
      'devops/monitoring',
      -- Framework (standalone)
      'framework',
      'framework/frontend',
      'framework/backend',
      'framework/fullstack',
      -- Workflow (standalone)
      'workflow',
      'workflow/agile',
      'workflow/project-management',
      -- Automation (standalone)
      'automation',
      'automation/ci-cd',
      'automation/scripting'
    )
  );

COMMENT ON COLUMN packages.category IS 'Package category from predefined taxonomy. Format: primary or primary/subcategory. See migration 009 for full list.';
