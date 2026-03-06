-- Migration: Add verification_id to donations table for public receipt verification
-- Purpose: Enable public verification of receipt authenticity via UUID and QR code
-- Date: March 3, 2026
-- Related: Phase 12 - Receipt Verification System

-- Add verification_id column with automatic UUID generation
ALTER TABLE donations
  ADD COLUMN IF NOT EXISTS verification_id UUID
    DEFAULT gen_random_uuid();

-- Backfill verification_id for existing donations that have receipts
-- Only donations with receipt_number get verification_id (receipts already issued)
UPDATE donations
  SET verification_id = gen_random_uuid()
  WHERE verification_id IS NULL
    AND receipt_number IS NOT NULL;

-- Create unique index for fast lookup and prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_donations_verification_id
  ON donations (verification_id)
  WHERE verification_id IS NOT NULL;

-- Add column comment for documentation
COMMENT ON COLUMN donations.verification_id IS
  'Public UUID for receipt verification at /verify/[id]. Permanent, non-expiring. 122 bits of entropy makes brute-force enumeration infeasible.';

-- Verification query
-- Verify all donations with receipts now have verification_id
DO $$
DECLARE
  missing_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO missing_count
  FROM donations
  WHERE receipt_number IS NOT NULL
    AND verification_id IS NULL;
  
  IF missing_count > 0 THEN
    RAISE WARNING 'Found % donations with receipt_number but no verification_id', missing_count;
  ELSE
    RAISE NOTICE 'All donations with receipts have verification_id';
  END IF;
END $$;
