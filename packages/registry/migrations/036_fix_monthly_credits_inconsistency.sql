-- Migration 036: Fix Monthly Credits Inconsistency
--
-- Issue: Migration 026 granted 200 monthly credits to existing verified members,
-- but new PRPM+ subscribers only get 100 credits (as documented).
-- This creates an unfair inconsistency.
--
-- Solution: Normalize all PRPM+ users to 100 monthly credits to match:
-- - Documentation (guides/playground.mdx)
-- - Stripe webhook logic (stripe.ts:396)
-- - Monthly reset cron job (playground-credits.ts:551)

-- =====================================================
-- 1. FIX MONTHLY CREDITS ALLOCATION
-- =====================================================

-- Update all users with monthly_credits set to 200 down to 100
-- Adjust their balance accordingly
UPDATE playground_credits
SET
  monthly_credits = 100,
  -- Reduce balance by the 100 credit difference (if they haven't used them)
  balance = GREATEST(0, balance - LEAST(100, monthly_credits - monthly_credits_used)),
  updated_at = NOW()
WHERE monthly_credits = 200
  AND monthly_reset_at IS NOT NULL; -- Only PRPM+ users

-- Log the adjustment as a transaction
INSERT INTO playground_credit_transactions (
  user_id,
  amount,
  balance_after,
  transaction_type,
  description,
  metadata
)
SELECT
  pc.user_id,
  -LEAST(100, pc.monthly_credits - pc.monthly_credits_used) as amount,
  pc.balance as balance_after,
  'admin' as transaction_type,
  'Monthly credit allocation adjusted from 200 to 100 to match documentation' as description,
  jsonb_build_object(
    'source', 'migration',
    'migration', '036',
    'reason', 'inconsistency_fix',
    'old_allocation', 200,
    'new_allocation', 100
  ) as metadata
FROM playground_credits pc
WHERE pc.monthly_credits = 100
  AND pc.monthly_reset_at IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM playground_credit_transactions pct
    WHERE pct.user_id = pc.user_id
      AND pct.metadata->>'migration' = '036'
  );

-- =====================================================
-- 2. UPDATE COMMENTS
-- =====================================================

COMMENT ON COLUMN playground_credits.monthly_credits IS 'Total monthly allocation (100 for PRPM+, 0 for free)';

-- =====================================================
-- 3. VERIFICATION
-- =====================================================

-- Verify no users have 200 monthly credits anymore
DO $$
DECLARE
  count_200_credits INTEGER;
BEGIN
  SELECT COUNT(*) INTO count_200_credits
  FROM playground_credits
  WHERE monthly_credits = 200;

  IF count_200_credits > 0 THEN
    RAISE WARNING 'Migration 036: % users still have 200 monthly credits', count_200_credits;
  ELSE
    RAISE NOTICE 'Migration 036: Successfully normalized all users to 100 monthly credits';
  END IF;
END $$;
