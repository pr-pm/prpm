-- Migration 038: Fix Credit Balance Calculation
--
-- Issue: The balance field is out of sync with actual breakdown
-- (monthly remaining + rollover + purchased)
--
-- Root cause: Migration 036 may have incorrectly calculated balance adjustments
-- or there's drift from transactions
--
-- Solution: Recalculate balance from source fields

-- Recalculate balance to match breakdown
UPDATE playground_credits
SET
  balance = (monthly_credits - monthly_credits_used) + rollover_credits + purchased_credits,
  updated_at = NOW()
WHERE
  -- Only update if balance is incorrect
  balance != (monthly_credits - monthly_credits_used) + rollover_credits + purchased_credits;

-- Verify the fix
DO $$
DECLARE
  mismatch_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO mismatch_count
  FROM playground_credits
  WHERE balance != (monthly_credits - monthly_credits_used) + rollover_credits + purchased_credits;

  IF mismatch_count > 0 THEN
    RAISE WARNING 'Migration 038: % users still have incorrect balance', mismatch_count;
  ELSE
    RAISE NOTICE 'Migration 038: Successfully fixed all credit balances';
  END IF;
END $$;
