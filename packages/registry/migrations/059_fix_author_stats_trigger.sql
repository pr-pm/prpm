-- Fix author stats trigger to handle null author_id
CREATE OR REPLACE FUNCTION update_author_stats_on_package_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update author stats if package has an author
  IF NEW.author_id IS NOT NULL THEN
    -- Ensure author_stats record exists
    INSERT INTO author_stats (user_id)
    VALUES (NEW.author_id)
    ON CONFLICT (user_id) DO NOTHING;

    -- Update the stats
    UPDATE author_stats
    SET
      total_packages = (
        SELECT COUNT(*)
        FROM packages
        WHERE author_id = NEW.author_id
          AND deprecated = FALSE
      ),
      total_downloads = (
        SELECT COALESCE(SUM(total_downloads), 0)
        FROM packages
        WHERE author_id = NEW.author_id
      ),
      last_updated = NOW()
    WHERE user_id = NEW.author_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_author_stats_on_package_change() IS 'Updates author stats when packages change (handles null author_id)';
