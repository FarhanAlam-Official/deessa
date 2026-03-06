-- Debug script to check verification system
-- Run this to see what's in the database

-- Check if the verification_id exists and what its status is
SELECT 
  id,
  verification_id,
  receipt_number,
  payment_status,
  donor_name,
  amount,
  currency,
  created_at,
  is_monthly
FROM donations
WHERE verification_id = 'a53b3732-c9f3-49fe-afeb-e07af61b0c97';

-- Check all donations with verification_id
SELECT 
  COUNT(*) as total_with_verification,
  COUNT(CASE WHEN receipt_number IS NOT NULL THEN 1 END) as with_receipt,
  COUNT(CASE WHEN payment_status = 'completed' THEN 1 END) as completed
FROM donations
WHERE verification_id IS NOT NULL;

-- Check donations that should be verifiable
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

-- Check if there are any donations without verification_id but with receipts
SELECT 
  COUNT(*) as missing_verification_id
FROM donations
WHERE receipt_number IS NOT NULL
  AND verification_id IS NULL;
