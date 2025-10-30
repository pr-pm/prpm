-- Add paid organization support with Stripe integration
-- Migration 024: Add paid organizations

-- Add subscription-related fields to organizations table
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255) UNIQUE;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(255) UNIQUE;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) CHECK (subscription_status IN ('active', 'canceled', 'past_due', 'unpaid', 'incomplete', 'trialing'));
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS subscription_plan VARCHAR(50) DEFAULT 'free' CHECK (subscription_plan IN ('free', 'verified'));
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS subscription_start_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS subscription_cancel_at_period_end BOOLEAN DEFAULT FALSE;

-- Create indexes for Stripe lookups
CREATE INDEX IF NOT EXISTS idx_organizations_stripe_customer_id ON organizations(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_organizations_stripe_subscription_id ON organizations(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_organizations_subscription_status ON organizations(subscription_status);
CREATE INDEX IF NOT EXISTS idx_organizations_subscription_plan ON organizations(subscription_plan);

-- Create subscription_events table to track subscription changes
CREATE TABLE IF NOT EXISTS subscription_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Stripe event data
  stripe_event_id VARCHAR(255) UNIQUE NOT NULL,
  event_type VARCHAR(100) NOT NULL,

  -- Subscription details
  subscription_status VARCHAR(50),
  subscription_plan VARCHAR(50),

  -- Event metadata
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscription_events_org_id ON subscription_events(org_id);
CREATE INDEX IF NOT EXISTS idx_subscription_events_stripe_event_id ON subscription_events(stripe_event_id);
CREATE INDEX IF NOT EXISTS idx_subscription_events_event_type ON subscription_events(event_type);
CREATE INDEX IF NOT EXISTS idx_subscription_events_created_at ON subscription_events(created_at DESC);

-- Create payment_methods table to store organization payment methods
CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Stripe payment method data
  stripe_payment_method_id VARCHAR(255) UNIQUE NOT NULL,

  -- Card details (for display)
  card_brand VARCHAR(50),
  card_last4 VARCHAR(4),
  card_exp_month INTEGER,
  card_exp_year INTEGER,

  -- Status
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_methods_org_id ON payment_methods(org_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_stripe_payment_method_id ON payment_methods(stripe_payment_method_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_is_default ON payment_methods(is_default) WHERE is_default = TRUE;

-- Create invoices table to track billing
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Stripe invoice data
  stripe_invoice_id VARCHAR(255) UNIQUE NOT NULL,
  stripe_payment_intent_id VARCHAR(255),

  -- Invoice details
  amount_due INTEGER NOT NULL,  -- in cents
  amount_paid INTEGER NOT NULL,  -- in cents
  currency VARCHAR(3) DEFAULT 'usd',

  -- Status
  status VARCHAR(50) NOT NULL,  -- draft, open, paid, uncollectible, void

  -- Dates
  invoice_date TIMESTAMP WITH TIME ZONE,
  due_date TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,

  -- URLs
  invoice_pdf_url TEXT,
  hosted_invoice_url TEXT,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoices_org_id ON invoices(org_id);
CREATE INDEX IF NOT EXISTS idx_invoices_stripe_invoice_id ON invoices(stripe_invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_date ON invoices(invoice_date DESC);

-- Apply updated_at trigger to new tables
CREATE TRIGGER payment_methods_updated_at BEFORE UPDATE ON payment_methods
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER invoices_updated_at BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function to automatically set is_verified based on subscription status
CREATE OR REPLACE FUNCTION update_organization_verified_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Set is_verified to true if subscription is active or trialing
  IF NEW.subscription_status IN ('active', 'trialing') AND NEW.subscription_plan = 'verified' THEN
    NEW.is_verified = TRUE;
  -- Set is_verified to false if subscription is not active (unless manually verified by admin)
  ELSIF NEW.subscription_status NOT IN ('active', 'trialing') OR NEW.subscription_plan = 'free' THEN
    -- Only unverify if it was auto-verified (not manually set by admin)
    -- We'll assume manual verification is permanent, so we don't override it here
    -- This allows admins to manually verify orgs without subscriptions
    NULL;  -- Don't change is_verified
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic verification status
CREATE TRIGGER organization_verified_status_updated
  BEFORE INSERT OR UPDATE OF subscription_status, subscription_plan ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_organization_verified_status();

-- Add comment to track migration
COMMENT ON TABLE subscription_events IS 'Tracks Stripe subscription events for organizations';
COMMENT ON TABLE payment_methods IS 'Stores organization payment methods from Stripe';
COMMENT ON TABLE invoices IS 'Tracks organization invoices and payments';
COMMENT ON COLUMN organizations.stripe_customer_id IS 'Stripe Customer ID for the organization';
COMMENT ON COLUMN organizations.stripe_subscription_id IS 'Stripe Subscription ID for the organization';
COMMENT ON COLUMN organizations.subscription_status IS 'Current subscription status from Stripe';
COMMENT ON COLUMN organizations.subscription_plan IS 'Subscription plan level (free or verified)';
