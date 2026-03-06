# Stripe Payment Intent Enhancement - Deployment Guide

## Overview

This deployment enhances the payment system to:
1. Store all Stripe identifiers (payment_intent_id, session_id, subscription_id, customer_id, invoice_id)
2. Add provider column to donations table for convenience
3. Add donor_message field to donations table
4. Update admin transaction detail page to display all payment references
5. Enable direct Stripe dashboard links using payment intent IDs

## Pre-Deployment Checklist

- [ ] **Backup Database** (Critical!)
- [ ] **Test in Staging Environment**
- [ ] **Verify Stripe Webhook Configuration**
- [ ] **Check Environment Variables**
- [ ] **Review Migration Scripts**

---

## Deployment Steps

### Step 1: Database Migration

**Run migrations in this exact order:**

```bash
# 1. Enhance payments table with Stripe references
psql -d your_database -f scripts/031-enhance-payments-stripe-references.sql

# 2. Add provider and message to donations table
psql -d your_database -f scripts/032-add-provider-and-message-to-donations.sql
```

**Expected Output:**
```
Migration Summary:
  Total Stripe payments: X
  Payments with session_id: Y
  Payments with payment_intent_id: Z
  Payments with subscription_id: W

Migration Summary:
  Total donations: A
  Donations with provider: B
  Donations with message: C
```

### Step 2: Verify Migration

```sql
-- Check new columns exist
\d payments
\d donations

-- Verify data integrity
SELECT 
  COUNT(*) as total_payments,
  COUNT(payment_intent_id) as with_intent,
  COUNT(session_id) as with_session
FROM payments 
WHERE provider = 'stripe';

SELECT 
  COUNT(*) as total_donations,
  COUNT(provider) as with_provider,
  COUNT(donor_message) as with_message
FROM donations;
```

### Step 3: Deploy Code Changes

**Files Modified:**
- `lib/payments/adapters/StripeAdapter.ts` - Extract all Stripe IDs
- `lib/payments/core/PaymentService.ts` - Store all Stripe IDs
- `lib/utils/provider-dashboard.ts` - Priority-based ID selection
- `app/admin/donations/[id]/page.tsx` - Fetch all payment references
- `app/admin/donations/[id]/transaction-detail-client.tsx` - Use all IDs for dashboard links
- `app/admin/donations/[id]/components/payment-technical.tsx` - Display all Stripe IDs
- `app/admin/donations/[id]/components/donor-information.tsx` - Display donor message
- `components/donation-form.tsx` - Add message field
- `lib/actions/donation.ts` - Store donor message

**Deploy using your standard process:**
```bash
git add .
git commit -m "feat: enhance Stripe payment references and add donor message"
git push origin main
# Deploy via your CI/CD pipeline
```

### Step 4: Backfill Payment Intent IDs (Optional)

If you have existing Stripe payments without payment_intent_id, you can backfill them:

**Create backfill script:**

```typescript
// scripts/backfill-stripe-payment-intents.ts
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function backfillPaymentIntents() {
  console.log('Starting payment intent backfill...')
  
  const { data: payments, error } = await supabase
    .from('payments')
    .select('id, session_id')
    .eq('provider', 'stripe')
    .not('session_id', 'is', null)
    .is('payment_intent_id', null)
    .limit(100)
  
  if (error) {
    console.error('Error fetching payments:', error)
    return
  }
  
  console.log(`Found ${payments?.length || 0} payments to backfill`)
  
  for (const payment of payments || []) {
    try {
      const session = await stripe.checkout.sessions.retrieve(payment.session_id, {
        expand: ['payment_intent']
      })
      
      if (session.payment_intent) {
        const paymentIntentId = typeof session.payment_intent === 'string'
          ? session.payment_intent
          : session.payment_intent.id
        
        await supabase
          .from('payments')
          .update({ 
            payment_intent_id: paymentIntentId,
            customer_id: session.customer as string || null
          })
          .eq('id', payment.id)
        
        console.log(`✓ Updated payment ${payment.id} with intent ${paymentIntentId}`)
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 100))
      
    } catch (error) {
      console.error(`Error processing payment ${payment.id}:`, error)
    }
  }
}

backfillPaymentIntents()
```

**Run the backfill:**
```bash
npx tsx scripts/backfill-stripe-payment-intents.ts
```

---

## Post-Deployment Verification

### Test New Donations

1. **Create a test donation:**
   - Go to `/donate`
   - Fill out form with message
   - Complete payment

2. **Verify in admin panel:**
   - Go to `/admin/donations`
   - Click on the new donation
   - Check that all fields are populated:
     - Donor message appears
     - Payment Intent ID exists
     - Dashboard link works

### Test Dashboard Links

1. **For existing donations:**
   - Should link to Stripe payments list (if no payment intent)
   - Should work without errors

2. **For new donations:**
   - Should link directly to payment intent
   - Should open correct Stripe transaction

### Verify Database State

```sql
-- Check recent donations have all fields
SELECT 
  id,
  donor_name,
  donor_message,
  provider,
  created_at
FROM donations 
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;

-- Check recent payments have Stripe IDs
SELECT 
  p.id,
  p.provider,
  p.payment_intent_id,
  p.session_id,
  p.created_at
FROM payments p
WHERE p.created_at > NOW() - INTERVAL '1 hour'
ORDER BY p.created_at DESC;
```

---

## Rollback Plan

### If Code Issues

```bash
# Revert to previous deployment
git revert HEAD
git push origin main
# Deploy via CI/CD
```

### If Database Issues

```sql
-- Remove new columns (if needed)
ALTER TABLE payments 
  DROP COLUMN IF EXISTS payment_intent_id,
  DROP COLUMN IF EXISTS session_id,
  DROP COLUMN IF EXISTS subscription_id,
  DROP COLUMN IF EXISTS customer_id,
  DROP COLUMN IF EXISTS invoice_id;

ALTER TABLE donations 
  DROP COLUMN IF EXISTS provider,
  DROP COLUMN IF EXISTS donor_message;

-- Drop indexes
DROP INDEX IF EXISTS idx_payments_payment_intent;
DROP INDEX IF EXISTS idx_payments_session;
DROP INDEX IF EXISTS idx_payments_subscription;
DROP INDEX IF EXISTS idx_payments_customer;
DROP INDEX IF EXISTS idx_payments_invoice;
DROP INDEX IF EXISTS idx_donations_provider;

-- Remove constraints
ALTER TABLE payments DROP CONSTRAINT IF EXISTS check_stripe_payment_references;
```

---

## Monitoring

### Key Metrics to Watch

1. **Webhook Success Rate**
   ```sql
   SELECT 
     DATE(created_at) as date,
     COUNT(*) as total_payments,
     COUNT(payment_intent_id) as with_intent_id
   FROM payments 
   WHERE provider = 'stripe' 
     AND created_at > NOW() - INTERVAL '7 days'
   GROUP BY DATE(created_at)
   ORDER BY date DESC;
   ```

2. **Dashboard Link Success**
   - Monitor error logs for "Provider dashboard link not available"
   - Check user feedback on dashboard links

3. **Form Submissions**
   ```sql
   SELECT 
     DATE(created_at) as date,
     COUNT(*) as total_donations,
     COUNT(donor_message) as with_message
   FROM donations 
   WHERE created_at > NOW() - INTERVAL '7 days'
   GROUP BY DATE(created_at)
   ORDER BY date DESC;
   ```

### Error Monitoring

**Watch for these errors:**
- Stripe webhook failures
- Missing payment_intent_id in new payments
- Dashboard link generation errors
- Form validation errors

---

## Success Criteria

- ✅ All new Stripe payments have `payment_intent_id`
- ✅ Dashboard links work for new payments
- ✅ Donor message field works in donation form
- ✅ Admin panel displays all new fields correctly
- ✅ No increase in webhook error rate
- ✅ Existing functionality unchanged

---

## Support

### Common Issues

**Issue: Dashboard link not working**
- Check if `payment_intent_id` exists in payments table
- Verify `NEXT_PUBLIC_PAYMENT_MODE` environment variable
- Check browser console for errors

**Issue: Donor message not saving**
- Verify `donor_message` column exists in donations table
- Check API route is receiving the field
- Verify form is sending the data

**Issue: Webhook failures**
- Check Stripe webhook endpoint configuration
- Verify webhook signature validation
- Check server logs for detailed errors

### Useful Queries

```sql
-- Find payments missing payment_intent_id
SELECT id, session_id, created_at
FROM payments 
WHERE provider = 'stripe' 
  AND session_id IS NOT NULL 
  AND payment_intent_id IS NULL
ORDER BY created_at DESC;

-- Check recent webhook processing
SELECT 
  p.id,
  p.payment_intent_id,
  p.session_id,
  p.raw_payload->>'eventId' as stripe_event_id,
  p.created_at
FROM payments p
WHERE p.provider = 'stripe'
  AND p.created_at > NOW() - INTERVAL '1 hour'
ORDER BY p.created_at DESC;
```

---

## Next Steps

1. **Monitor for 24 hours** after deployment
2. **Run backfill script** during low-traffic period (if needed)
3. **Update documentation** with new field information
4. **Train support team** on new dashboard links
5. **Plan refund functionality** using payment_intent_id

---

**Deployment Complete!** 🎉

The system now has:
- Complete Stripe reference tracking
- Working dashboard links
- Donor message functionality
- Enhanced admin transaction details
- Future-ready architecture for refunds and disputes
