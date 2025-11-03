-- Add billing email to organizations
-- Migration 025: Add organization billing email

-- Add billing_email column to organizations table
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS billing_email VARCHAR(255);

-- Create index for billing email lookups
CREATE INDEX IF NOT EXISTS idx_organizations_billing_email ON organizations(billing_email);

-- Add comment
COMMENT ON COLUMN organizations.billing_email IS 'Billing email address for the organization (from Stripe checkout)';
