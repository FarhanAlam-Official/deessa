-- ============================================================================
-- Cleanup: Remove check constraint from previous migration attempt
-- Run this BEFORE running the main migration
-- ============================================================================

-- Drop the constraint if it exists
DO $$ 
BEGIN
  ALTER TABLE payments DROP CONSTRAINT IF EXISTS check_stripe_payment_references;
  RAISE NOTICE 'Constraint dropped successfully (if it existed)';
EXCEPTION
  WHEN undefined_object THEN 
    RAISE NOTICE 'Constraint does not exist, nothing to drop';
END $$;

-- Verify constraint is gone
DO $$
DECLARE
  constraint_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO constraint_count
  FROM information_schema.table_constraints
  WHERE table_name = 'payments'
    AND constraint_name = 'check_stripe_payment_references';
  
  IF constraint_count = 0 THEN
    RAISE NOTICE '✓ Constraint successfully removed';
  ELSE
    RAISE WARNING '⚠ Constraint still exists!';
  END IF;
END $$;
