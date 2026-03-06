-- Find a valid verification ID to test with

\echo 'Finding donations that should be verifiable...'
\echo ''

SELECT 
  'http://localhost:3000/verify/' || verification_id as verification_url,
  receipt_number,
  donor_name,
  amount,
  currency,
  payment_status,
  created_at
FROM donations
WHERE verification_id IS NOT NULL
  AND receipt_number IS NOT NULL
  AND payment_status = 'completed'
ORDER BY created_at DESC
LIMIT 5;

\echo ''
\echo 'If no results above, checking what donations exist...'
\echo ''

SELECT 
  id,
  verification_id,
  receipt_number,
  payment_status,
  donor_name,
  amount,
  created_at
FROM donations
ORDER BY created_at DESC
LIMIT 10;
