-- ============================================================================
-- Migration: Enhance Payments Table with Comprehensive Stripe References
-- Purpose: Store all relevant Stripe identifiers for financial operations
-- Date: 2026-03-05
-- ============================================================================

-- Step 1: Add new columns for all Stripe identifiers
ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS payment_intent_id TEXT,
  ADD COLUMN IF NOT EXISTS session_id TEXT,
  ADD COLUMN IF NOT EXISTS subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS customer_id TEXT,
  ADD COLUMN IF NOT EXISTS invoice_id TEXT;

-- Step 2: Backfill session_id from transaction_id for Stripe payments
-- (transaction_id currently contains session ID for one-time payments)
UPDATE payments
SET session_id = transaction_id
WHERE provider = 'stripe'
  AND transaction_id LIKE 'cs_%'
  AND session_id IS NULL;

-- Step 3: Backfill subscription_id from transaction_id for recurring payments
UPDATE payments
SET subscription_id = transaction_id
WHERE provider = 'stripe'
  AND transaction_id LIKE 'sub_%'
  AND subscription_id IS NULL;

-- Step 4: Extract payment_intent_id from raw_payload where available
-- This handles cases where payment_intent was in the webhook payload
UPDATE payments
SET payment_intent_id = raw_payload->>'payment_intent'
WHERE provider = 'stripe'
  AND raw_payload ? 'payment_intent'
  AND payment_intent_id IS NULL
  AND raw_payload->>'payment_intent' LIKE 'pi_%';

-- Step 5: Extract customer_id from raw_payload where available
UPDATE payments
SET customer_id = raw_payload->>'customer'
WHERE provider = 'stripe'
  AND raw_payload ? 'customer'
  AND customer_id IS NULL
  AND raw_payload->>'customer' LIKE 'cus_%';

-- Step 6: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_payments_payment_intent 
  ON payments(payment_intent_id) 
  WHERE payment_intent_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_payments_session 
  ON payments(session_id) 
  WHERE session_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_payments_subscription 
  ON payments(subscription_id) 
  WHERE subscription_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_payments_customer 
  ON payments(customer_id) 
  WHERE customer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_payments_invoice 
  ON payments(invoice_id) 
  WHERE invoice_id IS NOT NULL;

-- Step 7: Add check constraint with NOT VALID
-- This ensures NEW Stripe payments have payment_intent_id or subscription_id
-- but doesn't check existing rows (grandfathered in)
DO $$ 
BEGIN
  -- Drop constraint if it exists from previous run
  ALTER TABLE payments DROP CONSTRAINT IF EXISTS check_stripe_payment_references;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Add constraint as NOT VALID (only enforced for new/updated rows)
ALTER TABLE payments
  ADD CONSTRAINT check_stripe_payment_references
  CHECK (
    provider != 'stripe' OR 
    payment_intent_id IS NOT NULL OR 
    subscription_id IS NOT NULL
  ) NOT VALID;

-- Step 8: Add column comments
COMMENT ON COLUMN payments.payment_intent_id IS 
  'Stripe Payment Intent ID (pi_xxx) - Primary reference for financial operations (refunds, disputes)';

COMMENT ON COLUMN payments.session_id IS 
  'Stripe Checkout Session ID (cs_xxx) - Reference for checkout flow tracking';

COMMENT ON COLUMN payments.subscription_id IS 
  'Stripe Subscription ID (sub_xxx) - Reference for recurring payment management';

COMMENT ON COLUMN payments.customer_id IS 
  'Stripe Customer ID (cus_xxx) - Reference for customer management';

COMMENT ON COLUMN payments.invoice_id IS 
  'Stripe Invoice ID (in_xxx) - Reference for subscription billing';

-- Step 9: Verification queries
DO $$
DECLARE
  total_stripe_payments INTEGER;
  payments_with_session INTEGER;
  payments_with_intent INTEGER;
  payments_with_subscription INTEGER;
BEGIN
  -- Count total Stripe payments
  SELECT COUNT(*) INTO total_stripe_payments
  FROM payments
  WHERE provider = 'stripe';
  
  -- Count payments with session_id
  SELECT COUNT(*) INTO payments_with_session
  FROM payments
  WHERE provider = 'stripe' AND session_id IS NOT NULL;
  
  -- Count payments with payment_intent_id
  SELECT COUNT(*) INTO payments_with_intent
  FROM payments
  WHERE provider = 'stripe' AND payment_intent_id IS NOT NULL;
  
  -- Count payments with subscription_id
  SELECT COUNT(*) INTO payments_with_subscription
  FROM payments
  WHERE provider = 'stripe' AND subscription_id IS NOT NULL;
  
  RAISE NOTICE 'Migration Summary:';
  RAISE NOTICE '  Total Stripe payments: %', total_stripe_payments;
  RAISE NOTICE '  Payments with session_id: %', payments_with_session;
  RAISE NOTICE '  Payments with payment_intent_id: %', payments_with_intent;
  RAISE NOTICE '  Payments with subscription_id: %', payments_with_subscription;
  RAISE NOTICE '';
  RAISE NOTICE 'Constraint Status:';
  RAISE NOTICE '  ✓ Constraint added as NOT VALID';
  RAISE NOTICE '  ✓ Existing rows are grandfathered in';
  RAISE NOTICE '  ✓ New Stripe payments will require payment_intent_id or subscription_id';
  RAISE NOTICE '';
  RAISE NOTICE 'To validate all existing rows later (after backfill):';
  RAISE NOTICE '  ALTER TABLE payments VALIDATE CONSTRAINT check_stripe_payment_references;';
  
  IF payments_with_session + payments_with_subscription < total_stripe_payments THEN
    RAISE WARNING 'Some Stripe payments missing session_id or subscription_id';
  END IF;
END $$;

-- ============================================================================
-- Migration Complete: Enhanced Payments Table
-- ============================================================================
