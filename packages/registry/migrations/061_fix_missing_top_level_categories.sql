-- Fix missing top-level categories
-- frontend-development exists but has wrong level (2 instead of 1)
-- mobile-development and documentation are missing entirely

-- Fix frontend-development level
UPDATE categories
SET level = 1, parent_id = NULL
WHERE slug = 'frontend-development';

-- Insert mobile-development if it doesn't exist
INSERT INTO categories (name, slug, parent_id, level, icon, display_order)
VALUES ('Mobile Development', 'mobile-development', NULL, 1, 'smartphone', 6)
ON CONFLICT (slug) DO UPDATE
SET level = 1, parent_id = NULL, icon = EXCLUDED.icon, display_order = EXCLUDED.display_order;

-- Insert documentation if it doesn't exist
INSERT INTO categories (name, slug, parent_id, level, icon, display_order)
VALUES ('Documentation', 'documentation', NULL, 1, 'book', 8)
ON CONFLICT (slug) DO UPDATE
SET level = 1, parent_id = NULL, icon = EXCLUDED.icon, display_order = EXCLUDED.display_order;

-- Log the fixes
DO $$
DECLARE
  fixed_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO fixed_count
  FROM categories
  WHERE slug IN ('frontend-development', 'mobile-development', 'documentation')
    AND level = 1
    AND parent_id IS NULL;

  RAISE NOTICE 'Fixed % top-level categories', fixed_count;
END $$;
