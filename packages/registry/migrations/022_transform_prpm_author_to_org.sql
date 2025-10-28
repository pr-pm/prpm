-- Transform 'prpm' user's packages to be under prpm organization
-- Handles all packages that should use org_id instead of author_id

-- First, add org_id column to collections if it doesn't exist
ALTER TABLE collections ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id) ON DELETE SET NULL;

-- Add index for org_id on collections
CREATE INDEX IF NOT EXISTS idx_collections_org_id ON collections(org_id);

-- Make author_id nullable in collections so we can set it to NULL and delete the user
ALTER TABLE collections ALTER COLUMN author_id DROP NOT NULL;

DO $$
DECLARE
  prpm_user_id UUID;
  prpm_org_id UUID;
BEGIN
  -- Get the 'prpm' user ID
  SELECT id INTO prpm_user_id
  FROM users
  WHERE username = 'prpm'
  LIMIT 1;

  -- Only proceed if we found the prpm user
  IF prpm_user_id IS NOT NULL THEN

    -- Create or get the 'prpm' organization
    INSERT INTO organizations (name, description, is_verified, created_at, updated_at)
    VALUES (
      'prpm',
      'Official PRPM packages and tools',
      TRUE,
      NOW(),
      NOW()
    )
    ON CONFLICT (name) DO NOTHING
    RETURNING id INTO prpm_org_id;

    -- If organization already existed, get its ID
    IF prpm_org_id IS NULL THEN
      SELECT id INTO prpm_org_id
      FROM organizations
      WHERE name = 'prpm';
    END IF;

    -- Update all packages from prpm user (where author_id matches prpm_user_id) to use the organization
    UPDATE packages
    SET org_id = prpm_org_id,
        author_id = NULL,
        updated_at = NOW()
    WHERE author_id = prpm_user_id;

    -- Update all collections from prpm user to use the organization
    UPDATE collections
    SET org_id = prpm_org_id,
        author_id = NULL,
        updated_at = NOW()
    WHERE author_id = prpm_user_id;

    -- Add prpm user as owner of the organization
    INSERT INTO organization_members (org_id, user_id, role, joined_at)
    VALUES (prpm_org_id, prpm_user_id, 'owner', NOW())
    ON CONFLICT (org_id, user_id) DO NOTHING;

    -- Delete the prpm user since it's now an organization
    -- The organization_members entry will preserve the relationship
    DELETE FROM users WHERE id = prpm_user_id;

    RAISE NOTICE 'Successfully transformed prpm user to prpm organization';
    RAISE NOTICE 'Moved % packages to organization', (SELECT COUNT(*) FROM packages WHERE org_id = prpm_org_id);
    RAISE NOTICE 'Moved % collections to organization', (SELECT COUNT(*) FROM collections WHERE org_id = prpm_org_id);
    RAISE NOTICE 'Deleted prpm user (now managed as organization)';
  ELSE
    RAISE NOTICE 'No prpm user found, skipping migration';
  END IF;
END $$;
