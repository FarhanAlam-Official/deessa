# Stripe Payment Intent ID - Professional Solution with Database Migration

## Executive Summary

**Problem:** Current system stores Stripe Checkout Session IDs instead of Payment Intent IDs, limiting financial operations, dashboard access, and reconciliation capabilities.

**Solution:** Comprehensive database schema enhancement to store all relevant Stripe identifiers with proper separation of concerns, full backward compatibility, and data migration.

**Timeline:** 2-3 days including testing and migration
**Risk Level:** Low (with proper rollout strategy)
**Business Impact:** High (enables refunds, better support, faster reconciliation)

---

## Professional Solution: Enhanced Payment Reference Architecture

### Design Principles

1. **Separation of Concerns:** Different IDs serve different purposes
2. **Backward Compatibility:** Existing queries continue to work
3. **Future-Proof:** Supports additional payment providers
4. **Audit Trail:** Maintains complete transaction history
5. **Data Integrity:** Constraints ensure data quality

---

## Database Schema Enhancement

### Current Schema (payments table)

```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY,
  donation_id UUID REFERENCES donations(id),
  provider TEXT NOT NULL,
  transaction_id TEXT NOT NULL,  -- Currently stores session ID (cs_xxx)
  amount DECIMAL(10, 2),
  currency TEXT,
  status TEXT,
  verified_at TIMESTAMPTZ,
  raw_payload JSONB,
  created_at TIMESTAMPTZ
);
```

### Enhanced Schema (NEW)

```sql
-- Add new columns for comprehensive Stripe reference tracking
ALTER TABLE payments
  -- Primary financial reference (what Stripe uses for refunds, disputes)
  ADD COLUMN payment_intent_id TEXT,
  
  -- Session reference (for checkout flow tracking)
  ADD COLUMN session_id TEXT,
  
  -- Subscription reference (for recurring payments)
  ADD COLUMN subscription_id TEXT,
  
  -- Customer reference (for customer management)
  ADD COLUMN customer_id TEXT,
  
  -- Invoice reference (for subscription billing)
  ADD COLUMN invoice_id TEXT;

-- Add indexes for fast lookups
CREATE INDEX idx_payments_payment_intent ON payments(payment_intent_id) 
  WHERE payment_intent_id IS NOT NULL;

CREATE INDEX idx_payments_session ON payments(session_id) 
  WHERE session_id IS NOT NULL;

CREATE INDEX idx_payments_subscription ON payments(subscription_id) 
  WHERE subscription_id IS NOT NULL;

CREATE INDEX idx_payments_customer ON payments(customer_id) 
  WHERE customer_id IS NOT NULL;

-- Add check constraints for data integrity
ALTER TABLE payments
  ADD CONSTRAINT check_stripe_payment_has_intent_or_subscription
  CHECK (
    provider != 'stripe' OR 
    payment_intent_id IS NOT NULL OR 
    subscription_id IS NOT NULL
  );

-- Add comments for documentation
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
```

### Benefits of This Approach

1. **Complete Reference Tracking:** All Stripe IDs stored for different use cases
2. **Backward Compatible:** `transaction_id` remains unchanged
3. **Flexible Queries:** Can query by any identifier
4. **Provider Agnostic:** Works for Stripe, other providers use what they need
5. **Audit Friendly:** Complete trail of all identifiers

---

## Data Migration Strategy

### Migration Script

**File:** `scripts/031-enhance-payments-stripe-references.sql`

```sql
-- ============================================================================
-- Migration: Enhance Payments Table with Stripe Reference IDs
-- Purpose: Store all relevant Stripe identifiers for financial operations
-- Date: [Current Date]
-- ============================================================================

-- Step 1: Add new columns (nullable initially for backward compatibility)
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
SET payment_intent_id = raw_payload->'payment_intent'::text
WHERE provider = 'stripe'
  AND raw_payload ? 'payment_intent'
  AND payment_intent_id IS NULL
  AND raw_payload->>'payment_intent' LIKE 'pi_%';

-- Step 5: Extract customer_id from raw_payload where available
UPDATE payments
SET customer_id = raw_payload->'customer'::text
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

-- Step 7: Add check constraint (after backfill)
ALTER TABLE payments
  ADD CONSTRAINT IF NOT EXISTS check_stripe_payment_has_intent_or_subscription
  CHECK (
    provider != 'stripe' OR 
    payment_intent_id IS NOT NULL OR 
    subscription_id IS NOT NULL
  );

-- Step 8: Add column comments
COMMENT ON COLUMN payments.payment_intent_id IS 
  'Stripe Payment Intent ID (pi_xxx) - Primary reference for financial operations';

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
  
  IF payments_with_session + payments_with_subscription < total_stripe_payments THEN
    RAISE WARNING 'Some Stripe payments missing session_id or subscription_id';
  END IF;
END $$;

-- ============================================================================
-- Migration Complete
-- ============================================================================
```

### Backfill Script for Payment Intent IDs

**File:** `scripts/backfill-stripe-payment-intents.ts`

```typescript
/**
 * Backfill Payment Intent IDs from Stripe API
 * 
 * This script fetches payment intent IDs for existing payments that only have session IDs.
 * Run this after the database migration to complete the data backfill.
 */

import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function backfillPaymentIntents() {
  console.log('Starting payment intent backfill...')
  
  // Fetch payments that have session_id but no payment_intent_id
  const { data: payments, error } = await supabase
    .from('payments')
    .select('id, session_id, transaction_id')
    .eq('provider', 'stripe')
    .not('session_id', 'is', null)
    .is('payment_intent_id', null)
    .limit(100) // Process in batches
  
  if (error) {
    console.error('Error fetching payments:', error)
    return
  }
  
  console.log(`Found ${payments?.length || 0} payments to backfill`)
  
  let successCount = 0
  let errorCount = 0
  
  for (const payment of payments || []) {
    try {
      // Fetch session from Stripe to get payment_intent
      const session = await stripe.checkout.sessions.retrieve(payment.session_id, {
        expand: ['payment_intent']
      })
      
      if (session.payment_intent) {
        const paymentIntentId = typeof session.payment_intent === 'string'
          ? session.payment_intent
          : session.payment_intent.id
        
        // Update database
        const { error: updateError } = await supabase
          .from('payments')
          .update({
            payment_intent_id: paymentIntentId,
            customer_id: session.customer as string || null,
          })
          .eq('id', payment.id)
        
        if (updateError) {
          console.error(`Error updating payment ${payment.id}:`, updateError)
          errorCount++
        } else {
          console.log(`✓ Updated payment ${payment.id} with intent ${paymentIntentId}`)
          successCount++
        }
      } else {
        console.warn(`⚠ No payment intent found for session ${payment.session_id}`)
      }
      
      // Rate limiting: wait 100ms between requests
      await new Promise(resolve => setTimeout(resolve, 100))
      
    } catch (error) {
      console.error(`Error processing payment ${payment.id}:`, error)
      errorCount++
    }
  }
  
  console.log('\nBackfill complete:')
  console.log(`  Success: ${successCount}`)
  console.log(`  Errors: ${errorCount}`)
  console.log(`  Total: ${payments?.length || 0}`)
}

// Run the backfill
backfillPaymentIntents()
  .then(() => {
    console.log('Backfill script finished')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Backfill script failed:', error)
    process.exit(1)
  })
```

---

## Code Implementation

### 1. Update StripeAdapter

**File:** `lib/payments/adapters/StripeAdapter.ts`

```typescript
private async verifyCheckoutSession(event: Stripe.Event): Promise<VerificationResult> {
  const session = event.data.object as Stripe.Checkout.Session

  // Extract donation ID
  const donationId = session.client_reference_id || session.metadata?.donation_id
  if (!donationId) {
    throw VerificationError.invalidPayload(
      'stripe',
      'Missing donation ID in session'
    )
  }

  // Validate payment status
  const paymentStatus = this.mapStripePaymentStatus(session.payment_status)
  
  // Extract amount and currency
  const amount = session.amount_total ? this.convertToMajorUnits(session.amount_total) : 0
  const currency = (session.currency || 'usd').toUpperCase()

  // Extract ALL relevant Stripe IDs
  const paymentIntentId = session.payment_intent 
    ? (typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent.id)
    : null
  
  const subscriptionId = session.subscription
    ? (typeof session.subscription === 'string' ? session.subscription : session.subscription.id)
    : null
  
  const customerId = session.customer
    ? (typeof session.customer === 'string' ? session.customer : session.customer.id)
    : null

  // Primary transaction ID: payment_intent for one-time, subscription for recurring
  const transactionId = subscriptionId || paymentIntentId || session.id

  // Build comprehensive metadata
  const metadata: Record<string, unknown> = {
    // All Stripe references
    sessionId: session.id,
    paymentIntentId: paymentIntentId,
    subscriptionId: subscriptionId,
    customerId: customerId,
    invoiceId: null, // Not available in checkout.session.completed
    
    // Additional context
    mode: session.mode,
    paymentStatus: session.payment_status,
    eventId: event.id,
    
    // For backward compatibility
    legacyTransactionId: session.id,
  }

  return {
    success: paymentStatus === 'paid',
    donationId,
    transactionId,
    amount,
    currency,
    status: paymentStatus,
    metadata,
  }
}
```

### 2. Update PaymentService to Store All IDs

**File:** `lib/payments/core/PaymentService.ts`

```typescript
async confirmDonation(params: ConfirmDonationParams): Promise<ConfirmationResult> {
  // ... existing code ...

  // Insert into payments table with all Stripe references
  const { error: insertError } = await this.supabase
    .from('payments')
    .insert({
      donation_id: donationId,
      provider,
      transaction_id: verificationResult.transactionId,
      
      // NEW: Store all Stripe-specific IDs
      payment_intent_id: verificationResult.metadata?.paymentIntentId || null,
      session_id: verificationResult.metadata?.sessionId || null,
      subscription_id: verificationResult.metadata?.subscriptionId || null,
      customer_id: verificationResult.metadata?.customerId || null,
      invoice_id: verificationResult.metadata?.invoiceId || null,
      
      amount: verificationResult.amount,
      currency: verificationResult.currency,
      verified_amount: verificationResult.amount,
      verified_currency: verificationResult.currency,
      status: verificationResult.status,
      verified_at: new Date().toISOString(),
      raw_payload: verificationResult.metadata,
    })

  // ... rest of code ...
}
```

### 3. Update Provider Dashboard Utility

**File:** `lib/utils/provider-dashboard.ts`

```typescript
export interface DonationProviderData {
  provider: string
  payment_intent_id?: string | null  // NEW: Primary reference
  session_id?: string | null         // NEW: Fallback reference
  payment_id?: string | null         // OLD: Legacy support
}

export function getProviderDashboardUrl(
  provider: string,
  donation: DonationProviderData
): string | null {
  const isTestMode = process.env.NEXT_PUBLIC_PAYMENT_MODE === "test"

  switch (provider.toLowerCase()) {
    case "stripe": {
      // Priority: payment_intent_id > session_id > payment_id (legacy)
      const stripeId = donation.payment_intent_id || donation.session_id || donation.payment_id
      
      if (!stripeId) return null

      // Clean the ID (remove provider prefix if present)
      const cleanId = stripeId.replace(/^[^:_]+[:_]/, "")
      
      // Payment Intent ID - direct link (preferred)
      if (cleanId.startsWith("pi_")) {
        const baseUrl = isTestMode
          ? "https://dashboard.stripe.com/test/payments"
          : "https://dashboard.stripe.com/payments"
        return `${baseUrl}/${cleanId}`
      }
      
      // Session ID - link to payments list (fallback)
      if (cleanId.startsWith("cs_")) {
        const baseUrl = isTestMode
          ? "https://dashboard.stripe.com/test/payments"
          : "https://dashboard.stripe.com/payments"
        return baseUrl // Can't link directly to session
      }
      
      return null
    }
    
    // ... other providers ...
  }
}
```

### 4. Update Transaction Detail Page Query

**File:** `app/admin/donations/[id]/page.tsx`

```typescript
// Payments table - fetch all Stripe references
supabase
  .from("payments")
  .select(`
    transaction_id,
    payment_intent_id,
    session_id,
    subscription_id,
    customer_id,
    provider
  `)
  .eq("donation_id", donationId)
  .order("created_at", { ascending: false })
  .limit(1)
  .single()
  .then((res) => {
    if (res.error) console.warn("Payments fetch error:", res.error)
    return res
  }),
```

---

## Rollout Plan

### Phase 1: Database Migration (Day 1)

1. **Backup database** (critical!)
2. **Run migration script** in staging
3. **Verify migration** with test queries
4. **Run backfill script** for existing records
5. **Validate data integrity**

### Phase 2: Code Deployment (Day 1-2)

1. **Deploy adapter changes** to staging
2. **Test with new donations**
3. **Verify all IDs are stored correctly**
4. **Test dashboard links**
5. **Deploy to production**

### Phase 3: Backfill Production (Day 2)

1. **Run backfill script** in production (off-peak hours)
2. **Monitor Stripe API rate limits**
3. **Process in batches** (100 at a time)
4. **Verify completion**

### Phase 4: Validation (Day 3)

1. **Verify new payments** store all IDs
2. **Test dashboard links** for old and new payments
3. **Monitor error rates**
4. **Validate refund operations** (if implemented)

---

## Success Metrics

- ✅ 100% of new Stripe payments have `payment_intent_id`
- ✅ 95%+ of existing payments backfilled with `payment_intent_id`
- ✅ Dashboard links work for 100% of payments with `payment_intent_id`
- ✅ Zero increase in webhook error rate
- ✅ Refund operations work (future feature)
- ✅ Reconciliation queries 50% faster

---

## Rollback Plan

1. **Code rollback:** Revert adapter and service changes
2. **Database rollback:** 
   - New columns are nullable, so no data loss
   - Can drop columns if needed: `ALTER TABLE payments DROP COLUMN payment_intent_id;`
3. **Queries:** All existing queries continue to work (backward compatible)

---

## Future Enhancements Enabled

1. **Programmatic Refunds:** Use `payment_intent_id` for refund API calls
2. **Dispute Management:** Link disputes to payment intents
3. **Customer Portal:** Use `customer_id` for customer management
4. **Subscription Management:** Use `subscription_id` for recurring payment management
5. **Advanced Reconciliation:** Query by any identifier
6. **Audit Trail:** Complete transaction history with all references

---

## Cost Analysis

- **Development Time:** 2-3 days
- **Database Storage:** Minimal (~50 bytes per payment)
- **Stripe API Calls:** One-time backfill only (~100-1000 calls depending on volume)
- **Maintenance:** Zero ongoing cost

---

## Conclusion

This professional solution provides:
- ✅ Complete Stripe reference tracking
- ✅ Backward compatibility
- ✅ Future-proof architecture
- ✅ Data integrity constraints
- ✅ Comprehensive migration strategy
- ✅ Low risk with high business value

**Recommendation:** Proceed with this solution for a robust, maintainable, and scalable payment reference system.
