-- Migration 011: Remove Category Constraint
-- The scraped data has too many diverse categories to maintain a constraint
-- Let categories be organic and discover them from the data

ALTER TABLE packages DROP CONSTRAINT IF EXISTS packages_category_check;

-- Category can be any string or NULL
-- We'll discover popular categories from the data and create views/indexes as needed

COMMENT ON COLUMN packages.category IS 'Package category - flexible string value determined by content and community usage';
