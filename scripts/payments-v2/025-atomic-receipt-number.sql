-- Payment Architecture V2: Atomic Receipt Number Generation
-- Creates sequence and RPC function for race-condition-free receipt numbering
-- Format: RCP-YYYY-NNNNN (e.g., RCP-2026-00001)
-- Resets annually for cleaner numbering

-- Drop existing function if it exists (handles migration from older versions)
DROP FUNCTION IF EXISTS get_next_receipt_number();

-- Create table to track receipt sequences per year
-- This allows automatic reset each year
CREATE TABLE IF NOT EXISTS receipt_sequences (
  year INT PRIMARY KEY,
  last_number INT NOT NULL DEFAULT 0
);

-- RPC function for atomic receipt number generation with yearly reset
-- Returns formatted receipt number: RCP-{YEAR}-{SEQUENCE}
-- Automatically resets to 00001 each new year
CREATE FUNCTION get_next_receipt_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  current_year INT;
  next_num INT;
  receipt_num TEXT;
BEGIN
  -- Get current year
  current_year := EXTRACT(YEAR FROM NOW())::INT;
  
  -- Insert year if not exists, or increment the counter atomically
  INSERT INTO receipt_sequences (year, last_number)
  VALUES (current_year, 1)
  ON CONFLICT (year) 
  DO UPDATE SET last_number = receipt_sequences.last_number + 1
  RETURNING last_number INTO next_num;
  
  -- Format receipt number: RCP-YYYY-NNNNN
  -- LPAD ensures 5-digit zero-padded sequence (00001, 00002, etc.)
  receipt_num := 'RCP-' || current_year::TEXT || '-' || LPAD(next_num::TEXT, 5, '0');
  
  RETURN receipt_num;
END;
$$;

-- Add comments for documentation
COMMENT ON TABLE receipt_sequences IS 'Tracks receipt number sequences per year for automatic yearly reset';
COMMENT ON FUNCTION get_next_receipt_number() IS 'Generates unique receipt number in format RCP-YYYY-NNNNN with automatic yearly reset. Max 99,999 receipts per year.';

-- Test the function (optional - can be run manually to verify)
-- SELECT get_next_receipt_number();
-- Expected output: RCP-2026-00001, RCP-2026-00002, etc.

-- Verify yearly reset works
-- UPDATE receipt_sequences SET year = 2025, last_number = 99999 WHERE year = EXTRACT(YEAR FROM NOW());
-- SELECT get_next_receipt_number();
-- Should return: RCP-2026-00001 (new year, reset to 1)
