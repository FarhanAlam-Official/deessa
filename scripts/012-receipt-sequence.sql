-- ============================================================================
-- MIGRATION 012: Atomic Receipt Number Sequence
-- ============================================================================
-- Run this in Supabase SQL Editor.
-- Creates a Postgres sequence + RPC function to eliminate race conditions
-- in concurrent receipt number generation.
-- ============================================================================

-- Create sequence starting at 1000 (matches existing receipt_number_start default)
-- If previous receipts used a different start, adjust accordingly.
CREATE SEQUENCE IF NOT EXISTS receipt_number_seq START 1000;

-- Sync sequence to current max if receipts already exist
-- This ensures we never re-issue an already-used number.
DO $$
DECLARE
  max_num bigint;
BEGIN
  -- Extract trailing number from existing receipt_number values like "RCP-2025-001"
  SELECT COALESCE(MAX((regexp_match(receipt_number, '(\d+)$'))[1]::bigint), 999)
    INTO max_num
    FROM donations
   WHERE receipt_number IS NOT NULL;

  -- Advance sequence past the current max so nextval() returns max_num + 1
  IF max_num >= 999 THEN
    PERFORM setval('receipt_number_seq', max_num, true);
  END IF;
END $$;

-- RPC function: called by application to get a guaranteed-unique next number.
-- SECURITY DEFINER so service-role clients can call it even with RLS enabled.
CREATE OR REPLACE FUNCTION get_next_receipt_number()
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
STABLE -- not actually stable but required for Supabase RPC endpoint exposure
AS $$
  SELECT nextval('receipt_number_seq');
$$;

-- Confirm
SELECT get_next_receipt_number() AS next_number;
