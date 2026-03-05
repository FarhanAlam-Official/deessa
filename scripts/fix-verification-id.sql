-- Fix verification_id for donations
-- This script ensures all donations with receipts have verification_id

-- First, let's see what we're working with
\echo 'Checking donations with the specific verification_id...'
SELECT 
  id,
  verification_id,
  receipt_number,
  payment_status,
  donor_name,
  amount
FROM donations
WHERE verification_id = 'a53b3732-c9f3-49fe-afeb-e07af61b0c97';

\echo ''
\echo 'Checking if this donation exists at all...'
SELECT 
  id,
  verification_id,
  receipt_number,
  payment_status,
  donor_name,
  amount,
  created_at
FROM donations
WHERE id = (
  SELECT id FROM donations 
  WHERE verification_id = 'a53b3732-c9f3-49fe-afeb-e07af61b0c97'
  LIMIT 1
);

\echo ''
\echo 'Checking all donations with receipts but missing verification_id...'
SELECT 
  id,
  receipt_number,
  payment_status,
  donor_name,
  amount
FROM donations
WHERE receipt_number IS NOT NULL
  AND verification_id IS NULL
LIMIT 5;

\echo ''
\echo 'Fixing: Adding verification_id to donations with receipts but no verification_id...'
UPDATE donations
SET verification_id = gen_random_uuid()
WHERE receipt_number IS NOT NULL
  AND verification_id IS NULL;

\echo ''
\echo 'Checking donations that should now be verifiable...'
SELECT 
  id,
  verification_id,
  receipt_number,
  payment_status,
  donor_name,
  amount
FROM donations
WHERE verification_id IS NOT NULL
  AND receipt_number IS NOT NULL
  AND payment_status = 'completed'
ORDER BY created_at DESC
LIMIT 5;
