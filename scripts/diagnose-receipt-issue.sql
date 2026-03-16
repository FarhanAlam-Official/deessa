-- Receipt Generation Diagnostic Queries
-- Run these queries in Supabase SQL Editor to diagnose receipt generation issues

-- ============================================================================
-- 1. Check recent donations and their receipt status
-- ============================================================================
SELECT 
  id,
  donor_name,
  donor_email,
  amount,
  currency,
  payment_status,
  receipt_number,
  receipt_generated_at,
  receipt_sent_at,
  created_at,
  stripe_session_id
FROM donations
WHERE created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC
LIMIT 20;

-- ============================================================================
-- 2. Find completed donations WITHOUT receipts (PROBLEM CASES)
-- ============================================================================
SELECT 
  id,
  donor_name,
  donor_email,
  amount,
  payment_status,
  receipt_number,
  stripe_session_id,
  created_at
FROM donations
WHERE payment_status = 'completed'
  AND receipt_number IS NULL
ORDER BY created_at DESC;

-- ============================================================================
-- 3. Check webhook event processing
-- ============================================================================
SELECT 
  pe.event_id,
  pe.provider,
  pe.donation_id,
  pe.created_at,
  d.payment_status,
  d.receipt_number
FROM payment_events pe
LEFT JOIN donations d ON d.id = pe.donation_id
WHERE pe.created_at > NOW() - INTERVAL '7 days'
ORDER BY pe.created_at DESC
LIMIT 20;

-- ============================================================================
-- 4. Check receipt generation success rate
-- ============================================================================
SELECT 
  payment_status,
  COUNT(*) as total_donations,
  COUNT(receipt_number) as receipts_generated,
  COUNT(receipt_sent_at) as receipts_sent,
  ROUND(100.0 * COUNT(receipt_number) / NULLIF(COUNT(*), 0), 2) as receipt_generation_rate,
  ROUND(100.0 * COUNT(receipt_sent_at) / NULLIF(COUNT(receipt_number), 0), 2) as email_success_rate
FROM donations
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY payment_status
ORDER BY payment_status;

-- ============================================================================
-- 5. Find donations with receipts generated but not sent
-- ============================================================================
SELECT 
  id,
  donor_email,
  receipt_number,
  receipt_generated_at,
  receipt_sent_at,
  created_at
FROM donations
WHERE receipt_number IS NOT NULL
  AND receipt_sent_at IS NULL
ORDER BY receipt_generated_at DESC
LIMIT 10;

-- ============================================================================
-- 6. Check for duplicate receipt numbers (should be empty)
-- ============================================================================
SELECT 
  receipt_number,
  COUNT(*) as count
FROM donations
WHERE receipt_number IS NOT NULL
GROUP BY receipt_number
HAVING COUNT(*) > 1;

-- ============================================================================
-- 7. Recent receipt audit log (if table exists)
-- ============================================================================
-- Uncomment if you have receipt_audit_log table
-- SELECT 
--   donation_id,
--   action,
--   details,
--   created_at
-- FROM receipt_audit_log
-- WHERE created_at > NOW() - INTERVAL '7 days'
-- ORDER BY created_at DESC
-- LIMIT 20;

-- ============================================================================
-- 8. Check for failed receipt attempts (if receipt_failures table exists)
-- ============================================================================
-- Uncomment if you have receipt_failures table
-- SELECT 
--   donation_id,
--   error_message,
--   retry_count,
--   created_at,
--   resolved_at
-- FROM receipt_failures
-- WHERE created_at > NOW() - INTERVAL '7 days'
-- ORDER BY created_at DESC
-- LIMIT 20;
