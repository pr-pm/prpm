-- Add visibility field to organization_members table
-- Allows members to choose whether they want to be publicly listed

ALTER TABLE organization_members
ADD COLUMN is_public BOOLEAN DEFAULT TRUE;

-- Add index for filtering public members
CREATE INDEX idx_org_members_public ON organization_members(org_id, is_public) WHERE is_public = TRUE;

-- Add comment
COMMENT ON COLUMN organization_members.is_public IS 'Whether the member is publicly visible on the organization page';
