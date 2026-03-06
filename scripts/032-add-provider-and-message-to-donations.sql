-- ============================================================================
-- Migration: Add Provider Column and Donor Message to Donations Table
-- Purpose: Add convenience provider column and donor message field
-- Date: 2026-03-05
-- ============================================================================

-- Step 1: Add provider column for convenience queries
ALTER TABLE donations
  ADD COLUMN IF NOT EXISTS provider TEXT;

-- Step 2: Add donor message column
ALTER TABLE donations
  ADD COLUMN IF NOT EXISTS donor_message TEXT;

-- Step 3: Backfill provider from payments table
UPDATE donations d
SET provider = p.provider
FROM (
  SELECT DISTINCT ON (donation_id) 
    donation_id, 
    provider
  FROM payments
  ORDER BY donation_id, created_at DESC
) p
WHERE d.id = p.donation_id
  AND d.provider IS NULL;

-- Step 4: Create indexes
CREATE INDEX IF NOT EXISTS idx_donations_provider 
  ON donations(provider) 
  WHERE provider IS NOT NULL;

-- Step 5: Add column comments
COMMENT ON COLUMN donations.provider IS 
  'Payment provider used (stripe, khalti, esewa, fonepay) - Denormalized from payments table for convenience';

COMMENT ON COLUMN donations.donor_message IS 
  'Optional message from donor during donation process';

-- Step 6: Verification
DO $$
DECLARE
  donations_count INTEGER;
  donations_with_provider INTEGER;
  donations_with_message INTEGER;
BEGIN
  SELECT COUNT(*) INTO donations_count FROM donations;
  SELECT COUNT(*) INTO donations_with_provider FROM donations WHERE provider IS NOT NULL;
  SELECT COUNT(*) INTO donations_with_message FROM donations WHERE donor_message IS NOT NULL;
  
  RAISE NOTICE 'Migration Summary:';
  RAISE NOTICE '  Total donations: %', donations_count;
  RAISE NOTICE '  Donations with provider: %', donations_with_provider;
  RAISE NOTICE '  Donations with message: %', donations_with_message;
  
  IF donations_with_provider < donations_count THEN
    RAISE WARNING '% donations missing provider information', donations_count - donations_with_provider;
  END IF;
END $$;

-- ============================================================================
-- Migration Complete: Enhanced Donations Table
-- ============================================================================
