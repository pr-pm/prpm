-- Migration 004: Author Invites System
-- White carpet onboarding for top package authors

-- ============================================
-- AUTHOR INVITES
-- ============================================

CREATE TABLE author_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Invite details
  token VARCHAR(64) UNIQUE NOT NULL,  -- Secure random token for claim URL
  author_username VARCHAR(100) UNIQUE NOT NULL,  -- Reserved username (e.g., "sanjeed5", "patrickjs")
  email VARCHAR(255),  -- Optional: email to send invite to

  -- Invite metadata
  package_count INTEGER DEFAULT 0,  -- Number of packages this author has
  invited_by UUID REFERENCES users(id),  -- Admin who created the invite
  invite_message TEXT,  -- Optional personalized message

  -- Status tracking
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'claimed', 'expired', 'revoked')),
  claimed_by UUID REFERENCES users(id),  -- User who claimed this invite
  claimed_at TIMESTAMP WITH TIME ZONE,

  -- Expiration
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_author_invites_token ON author_invites(token);
CREATE INDEX idx_author_invites_username ON author_invites(author_username);
CREATE INDEX idx_author_invites_status ON author_invites(status);
CREATE INDEX idx_author_invites_expires ON author_invites(expires_at);

-- ============================================
-- AUTHOR CLAIMS
-- ============================================

-- Track the full claim process and associate users with their author identity
CREATE TABLE author_claims (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Link to invite and user
  invite_id UUID REFERENCES author_invites(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  author_username VARCHAR(100) NOT NULL,

  -- Verification data
  verification_method VARCHAR(50),  -- 'github', 'email', 'manual'
  github_username VARCHAR(100),
  github_verified BOOLEAN DEFAULT FALSE,

  -- Claimed packages
  packages_claimed INTEGER DEFAULT 0,

  -- Timestamps
  claimed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  verified_at TIMESTAMP WITH TIME ZONE,

  UNIQUE(invite_id, user_id)
);

CREATE INDEX idx_author_claims_user ON author_claims(user_id);
CREATE INDEX idx_author_claims_author ON author_claims(author_username);
CREATE INDEX idx_author_claims_invite ON author_claims(invite_id);

-- ============================================
-- UPDATE USERS TABLE
-- ============================================

-- Add author-specific fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS claimed_author_username VARCHAR(100) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS author_bio TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS author_website TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS author_twitter VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS author_claimed_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_users_claimed_author ON users(claimed_author_username);

-- ============================================
-- TRIGGERS
-- ============================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_author_invites_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_author_invites_timestamp
  BEFORE UPDATE ON author_invites
  FOR EACH ROW
  EXECUTE FUNCTION update_author_invites_timestamp();

-- Auto-expire invites trigger
CREATE OR REPLACE FUNCTION auto_expire_invites()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.expires_at <= NOW() AND NEW.status = 'pending' THEN
    NEW.status = 'expired';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_expire_invites
  BEFORE UPDATE ON author_invites
  FOR EACH ROW
  EXECUTE FUNCTION auto_expire_invites();

-- ============================================
-- VIEWS
-- ============================================

-- View for active invites
CREATE OR REPLACE VIEW active_author_invites AS
SELECT
  ai.id,
  ai.token,
  ai.author_username,
  ai.email,
  ai.package_count,
  ai.status,
  ai.expires_at,
  ai.created_at,
  u.username as invited_by_username,
  u.email as invited_by_email
FROM author_invites ai
LEFT JOIN users u ON ai.invited_by = u.id
WHERE ai.status = 'pending'
  AND ai.expires_at > NOW();

-- View for top unclaimed authors
CREATE OR REPLACE VIEW top_unclaimed_authors AS
WITH author_stats AS (
  SELECT
    SPLIT_PART(p.id, '/', 1) as author_username,
    COUNT(*) as package_count,
    ARRAY_AGG(DISTINCT p.type) as package_types,
    ARRAY_AGG(DISTINCT p.category) as categories,
    MIN(p.created_at) as first_package_date,
    MAX(p.created_at) as latest_package_date,
    SUM(p.total_downloads) as total_downloads
  FROM packages p
  WHERE p.id LIKE '@%/%'  -- Only namespaced packages
  GROUP BY SPLIT_PART(p.id, '/', 1)
  HAVING COUNT(*) >= 5  -- Only authors with 5+ packages
)
SELECT
  author_username,
  package_count,
  package_types,
  categories,
  first_package_date,
  latest_package_date,
  total_downloads,
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.claimed_author_username = author_stats.author_username
  ) as is_claimed,
  EXISTS (
    SELECT 1 FROM author_invites ai
    WHERE ai.author_username = author_stats.author_username
      AND ai.status = 'pending'
  ) as has_pending_invite
FROM author_stats
ORDER BY package_count DESC, total_downloads DESC;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to generate secure invite token
CREATE OR REPLACE FUNCTION generate_invite_token()
RETURNS VARCHAR(64) AS $$
DECLARE
  token VARCHAR(64);
  exists BOOLEAN;
BEGIN
  LOOP
    -- Generate random token (64 characters)
    token := encode(gen_random_bytes(32), 'hex');

    -- Check if token already exists
    SELECT EXISTS(SELECT 1 FROM author_invites WHERE token = token) INTO exists;

    EXIT WHEN NOT exists;
  END LOOP;

  RETURN token;
END;
$$ LANGUAGE plpgsql;

-- Function to create author invite
CREATE OR REPLACE FUNCTION create_author_invite(
  p_author_username VARCHAR(100),
  p_email VARCHAR(255) DEFAULT NULL,
  p_invited_by UUID DEFAULT NULL,
  p_invite_message TEXT DEFAULT NULL,
  p_expires_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  invite_id UUID,
  token VARCHAR(64),
  claim_url TEXT
) AS $$
DECLARE
  v_token VARCHAR(64);
  v_invite_id UUID;
  v_package_count INTEGER;
BEGIN
  -- Get package count for this author
  SELECT COUNT(*) INTO v_package_count
  FROM packages
  WHERE id LIKE '@' || p_author_username || '/%';

  -- Generate token
  v_token := generate_invite_token();

  -- Create invite
  INSERT INTO author_invites (
    token,
    author_username,
    email,
    package_count,
    invited_by,
    invite_message,
    expires_at
  ) VALUES (
    v_token,
    p_author_username,
    p_email,
    v_package_count,
    p_invited_by,
    p_invite_message,
    NOW() + (p_expires_days || ' days')::INTERVAL
  )
  RETURNING id INTO v_invite_id;

  -- Return invite details
  RETURN QUERY
  SELECT
    v_invite_id,
    v_token,
    'https://prpm.ai/claim/' || v_token AS claim_url;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SEED DATA (for testing)
-- ============================================

-- Create admin user if not exists (for development)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin') THEN
    INSERT INTO users (username, email, is_admin, verified_author)
    VALUES ('admin', 'admin@prpm.ai', TRUE, TRUE);
  END IF;
END $$;

COMMENT ON TABLE author_invites IS 'White carpet onboarding system for top package authors';
COMMENT ON TABLE author_claims IS 'Track author identity claims and verification';
COMMENT ON FUNCTION create_author_invite IS 'Helper function to create personalized author invites';
COMMENT ON VIEW top_unclaimed_authors IS 'Top package authors who haven''t claimed their identity yet';
