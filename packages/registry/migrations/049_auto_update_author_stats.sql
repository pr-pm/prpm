-- Migration: Auto-update author_stats on package changes
-- Description: Creates a trigger to automatically update author_stats when package download counts change
--              This uses incremental updates instead of full recalculation for better performance

-- Create optimized trigger function that updates author_stats incrementally
CREATE OR REPLACE FUNCTION update_author_stats_on_package_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure author_stats row exists
  INSERT INTO author_stats (user_id)
  VALUES (NEW.author_id)
  ON CONFLICT (user_id) DO NOTHING;

  -- Handle download count updates (incrementally)
  IF (TG_OP = 'UPDATE' AND
      (NEW.total_downloads != OLD.total_downloads OR
       NEW.weekly_downloads != OLD.weekly_downloads OR
       NEW.monthly_downloads != OLD.monthly_downloads)) THEN

    UPDATE author_stats
    SET
      total_downloads = total_downloads + (NEW.total_downloads - OLD.total_downloads),
      last_updated = NOW()
    WHERE user_id = NEW.author_id;
  END IF;

  -- Handle package creation (increment count)
  IF (TG_OP = 'INSERT') THEN
    UPDATE author_stats
    SET
      total_packages = total_packages + 1,
      public_packages = CASE WHEN NEW.visibility = 'public' THEN public_packages + 1 ELSE public_packages END,
      private_packages = CASE WHEN NEW.visibility = 'private' THEN private_packages + 1 ELSE private_packages END,
      last_updated = NOW()
    WHERE user_id = NEW.author_id;
  END IF;

  -- Handle package deletion (decrement count)
  IF (TG_OP = 'DELETE') THEN
    UPDATE author_stats
    SET
      total_packages = GREATEST(0, total_packages - 1),
      public_packages = CASE WHEN OLD.visibility = 'public' THEN GREATEST(0, public_packages - 1) ELSE public_packages END,
      private_packages = CASE WHEN OLD.visibility = 'private' THEN GREATEST(0, private_packages - 1) ELSE private_packages END,
      total_downloads = GREATEST(0, total_downloads - OLD.total_downloads),
      last_updated = NOW()
    WHERE user_id = OLD.author_id;

    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on packages table
DROP TRIGGER IF EXISTS trigger_update_author_stats ON packages;
CREATE TRIGGER trigger_update_author_stats
  AFTER INSERT OR UPDATE OR DELETE ON packages
  FOR EACH ROW
  EXECUTE FUNCTION update_author_stats_on_package_change();

COMMENT ON FUNCTION update_author_stats_on_package_change() IS
  'Incrementally updates author_stats when package download counts change. Much faster than full recalculation.';

-- Sync all existing author stats to current state
-- This ensures stats are accurate after migration
DO $$
DECLARE
  author_record RECORD;
BEGIN
  FOR author_record IN
    SELECT DISTINCT author_id FROM packages WHERE author_id IS NOT NULL
  LOOP
    PERFORM update_author_stats(author_record.author_id);
  END LOOP;
END $$;
