-- Migration: Add newsletter_subscribers table
-- Description: Store email addresses for newsletter subscriptions

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL UNIQUE,
  subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  confirmed BOOLEAN DEFAULT FALSE,
  unsubscribed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast email lookups
CREATE INDEX idx_newsletter_subscribers_email ON newsletter_subscribers(email);

-- Index for filtering active subscribers
CREATE INDEX idx_newsletter_subscribers_active ON newsletter_subscribers(confirmed, unsubscribed_at)
WHERE confirmed = TRUE AND unsubscribed_at IS NULL;

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_newsletter_subscribers_updated_at
  BEFORE UPDATE ON newsletter_subscribers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

COMMENT ON TABLE newsletter_subscribers IS 'Stores email addresses for newsletter subscriptions';
COMMENT ON COLUMN newsletter_subscribers.email IS 'Subscriber email address';
COMMENT ON COLUMN newsletter_subscribers.confirmed IS 'Whether the email has been confirmed (for future use)';
COMMENT ON COLUMN newsletter_subscribers.unsubscribed_at IS 'Timestamp when user unsubscribed (NULL if still subscribed)';
