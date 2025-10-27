-- Migration: Refresh package_search_rankings materialized view
-- This view was created in migration 017 but never populated with data
-- causing search and package listing to show no results

-- Refresh the materialized view to populate it with current data
REFRESH MATERIALIZED VIEW package_search_rankings;
