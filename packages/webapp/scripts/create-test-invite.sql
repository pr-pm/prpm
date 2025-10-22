-- Create test invite tokens in the database for E2E testing
-- Run this after the database is initialized

-- Insert a test author (if not exists)
INSERT INTO authors (username, github_id, email, verified, created_at, updated_at)
VALUES (
  'test-author',
  12345678,
  'test@prpm.dev',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (username) DO NOTHING;

-- Insert test invites with different states
INSERT INTO invites (
  token,
  author_username,
  invited_by,
  package_count,
  invite_message,
  status,
  expires_at,
  created_at,
  updated_at
)
VALUES
  -- Valid invite (expires in 7 days)
  (
    'valid-test-token-123',
    'newuser1',
    'test-author',
    15,
    'Welcome to PRPM! You have been invited to join our community of prompt engineers. This invite allows you to claim your username and publish up to 15 packages.',
    'pending',
    NOW() + INTERVAL '7 days',
    NOW(),
    NOW()
  ),
  -- Another valid invite with higher limit
  (
    'premium-token-789',
    'newuser2',
    'test-author',
    100,
    'Premium invitation with extended package publishing limit. Welcome to PRPM!',
    'pending',
    NOW() + INTERVAL '30 days',
    NOW(),
    NOW()
  ),
  -- Expired invite
  (
    'expired-token-456',
    'expired-user',
    'test-author',
    10,
    'This invite has expired',
    'pending',
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '10 days',
    NOW() - INTERVAL '10 days'
  ),
  -- Already claimed invite
  (
    'claimed-token-999',
    'claimed-user',
    'test-author',
    20,
    'This invite was already claimed',
    'claimed',
    NOW() + INTERVAL '7 days',
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '2 days'
  )
ON CONFLICT (token) DO UPDATE SET
  status = EXCLUDED.status,
  expires_at = EXCLUDED.expires_at,
  invite_message = EXCLUDED.invite_message;

-- Verify inserts
SELECT
  token,
  author_username,
  package_count,
  status,
  expires_at,
  CASE
    WHEN expires_at > NOW() THEN 'Valid'
    ELSE 'Expired'
  END as validity
FROM invites
WHERE token LIKE '%test%' OR token LIKE '%premium%' OR token LIKE '%expired%' OR token LIKE '%claimed%'
ORDER BY created_at DESC;
