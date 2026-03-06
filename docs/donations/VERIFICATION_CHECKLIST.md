# Stripe Payment Intent Enhancement - Verification Checklist

## Pre-Deployment Verification

### Database Migrations
- [ ] Migration files exist:
  - [ ] `scripts/031-enhance-payments-stripe-references.sql`
  - [ ] `scripts/032-add-provider-and-message-to-donations.sql`
- [ ] Migration scripts have been reviewed
- [ ] Database backup has been created
- [ ] Migrations tested in staging environment

### Code Changes
- [ ] All TypeScript files compile without errors
- [ ] No linting errors
- [ ] All imports are correct
- [ ] No unused variables or functions

### Files Modified
- [ ] `lib/payments/adapters/StripeAdapter.ts` - Extracts all Stripe IDs
- [ ] `lib/payments/core/PaymentService.ts` - Stores all Stripe IDs
- [ ] `lib/utils/provider-dashboard.ts` - Priority-based ID selection
- [ ] `app/admin/donations/[id]/page.tsx` - Fetches all payment data
- [ ] `app/admin/donations/[id]/transaction-detail-client.tsx` - Uses payment data
- [ ] `app/admin/donations/[id]/components/payment-technical.tsx` - Displays all IDs
- [ ] `components/donation-form.tsx` - Has message field
- [ ] `lib/actions/donation.ts` - Stores donor message

---

## Post-Deployment Verification

### Database Verification

```sql
-- 1. Verify new columns exist in payments table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'payments' 
  AND column_name IN ('payment_intent_id', 'session_id', 'subscription_id', 'customer_id', 'invoice_id');

-- Expected: 5 rows

-- 2. Verify new columns exist in donations table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'donations' 
  AND column_name IN ('provider', 'donor_message');

-- Expected: 2 rows

-- 3. Verify indexes were created
SELECT indexname 
FROM pg_indexes 
WHERE tablename = 'payments' 
  AND indexname LIKE 'idx_payments_%';

-- Expected: Multiple indexes including payment_intent, session, subscription, customer

-- 4. Check data backfill
SELECT 
  COUNT(*) as total_stripe_payments,
  COUNT(session_id) as with_session,
  COUNT(payment_intent_id) as with_intent
FROM payments 
WHERE provider = 'stripe';

-- Expected: session_id should be populated for most/all records

-- 5. Check donations provider backfill
SELECT 
  COUNT(*) as total_donations,
  COUNT(provider) as with_provider
FROM donations;

-- Expected: provider should be populated for most/all records
```

### Functional Testing

#### Test 1: New Donation with Message
- [ ] Go to `/donate`
- [ ] Fill out donation form
- [ ] Enter a message in the message field
- [ ] Complete payment through Stripe
- [ ] Verify donation is created
- [ ] Check webhook processes successfully

#### Test 2: Admin Panel - View Transaction
- [ ] Go to `/admin/donations`
- [ ] Click on the new donation
- [ ] Verify all fields display:
  - [ ] Donor name
  - [ ] Donor email
  - [ ] Donor phone (if provided)
  - [ ] Donor message (should show the message entered)
  - [ ] Payment Intent ID (should be populated)
  - [ ] Checkout Session ID (should be populated)
  - [ ] Customer ID (should be populated)
  - [ ] Verification ID (should be populated)

#### Test 3: Dashboard Link
- [ ] On transaction detail page, click "View in Stripe Dashboard"
- [ ] Verify it opens Stripe dashboard
- [ ] Verify it goes directly to the payment intent page
- [ ] Verify the payment details match

#### Test 4: Database Verification
```sql
-- Get the most recent donation
SELECT 
  d.id,
  d.donor_name,
  d.donor_message,
  d.provider,
  p.payment_intent_id,
  p.session_id,
  p.customer_id
FROM donations d
LEFT JOIN payments p ON d.id = p.donation_id
ORDER BY d.created_at DESC
LIMIT 1;
```
- [ ] Verify donor_message is populated
- [ ] Verify provider is 'stripe'
- [ ] Verify payment_intent_id is populated (starts with 'pi_')
- [ ] Verify session_id is populated (starts with 'cs_')
- [ ] Verify customer_id is populated (starts with 'cus_')

#### Test 5: Existing Donations
- [ ] View an existing donation (created before deployment)
- [ ] Verify it still displays correctly
- [ ] Verify no errors in console
- [ ] Check if session_id was backfilled
- [ ] Dashboard link should work (may go to list view if no payment_intent_id)

#### Test 6: Webhook Processing
- [ ] Trigger a test webhook from Stripe dashboard
- [ ] Verify webhook is processed successfully
- [ ] Check that all Stripe IDs are stored in payments table
- [ ] Verify no errors in server logs

---

## Error Checking

### Check Server Logs
```bash
# Look for errors related to:
# - Database column not found
# - Stripe webhook failures
# - Payment processing errors
# - Form submission errors

# Example commands:
tail -f /var/log/app.log | grep -i error
tail -f /var/log/app.log | grep -i stripe
tail -f /var/log/app.log | grep -i payment
```

### Check Browser Console
- [ ] No JavaScript errors on donation form
- [ ] No errors on admin transaction detail page
- [ ] No network errors (400/500 responses)

### Check Database Logs
```sql
-- Check for any constraint violations
SELECT * FROM pg_stat_activity 
WHERE state = 'idle in transaction' 
  OR wait_event_type IS NOT NULL;

-- Check for failed inserts/updates
-- (depends on your logging setup)
```

---

## Performance Verification

### Query Performance
```sql
-- Test query performance with new indexes
EXPLAIN ANALYZE
SELECT * FROM payments 
WHERE payment_intent_id = 'pi_test_123';

-- Should use index scan, not sequential scan

EXPLAIN ANALYZE
SELECT * FROM donations 
WHERE provider = 'stripe';

-- Should use index scan if many records
```

### Page Load Times
- [ ] Donation form loads in < 2 seconds
- [ ] Admin transaction detail page loads in < 3 seconds
- [ ] No noticeable performance degradation

---

## Rollback Verification (If Needed)

If you need to rollback:

### Code Rollback
```bash
git revert HEAD
git push origin main
# Deploy via CI/CD
```

### Database Rollback
```sql
-- Only if absolutely necessary
ALTER TABLE payments 
  DROP COLUMN IF EXISTS payment_intent_id,
  DROP COLUMN IF EXISTS session_id,
  DROP COLUMN IF EXISTS subscription_id,
  DROP COLUMN IF EXISTS customer_id,
  DROP COLUMN IF EXISTS invoice_id;

ALTER TABLE donations 
  DROP COLUMN IF EXISTS provider,
  DROP COLUMN IF EXISTS donor_message;
```

- [ ] Verify rollback successful
- [ ] Verify existing functionality works
- [ ] Document reason for rollback

---

## Sign-Off

### Development Team
- [ ] Code reviewed and approved
- [ ] All tests passing
- [ ] Documentation complete

### QA Team
- [ ] Functional testing complete
- [ ] No critical bugs found
- [ ] Performance acceptable

### DevOps Team
- [ ] Database migrations successful
- [ ] Deployment successful
- [ ] Monitoring in place

### Product Team
- [ ] Features working as expected
- [ ] User experience acceptable
- [ ] Ready for production use

---

## Post-Deployment Monitoring (24 Hours)

### Metrics to Monitor
- [ ] Donation success rate (should be unchanged)
- [ ] Webhook success rate (should be unchanged)
- [ ] Error rate (should not increase)
- [ ] Page load times (should be unchanged)
- [ ] Database query performance (should be unchanged or better)

### Daily Checks
```sql
-- Day 1: Check new donations
SELECT COUNT(*) as new_donations
FROM donations 
WHERE created_at > NOW() - INTERVAL '24 hours';

-- Check payment intent population
SELECT 
  COUNT(*) as total,
  COUNT(payment_intent_id) as with_intent
FROM payments 
WHERE created_at > NOW() - INTERVAL '24 hours'
  AND provider = 'stripe';

-- Check donor messages
SELECT COUNT(*) as donations_with_message
FROM donations 
WHERE created_at > NOW() - INTERVAL '24 hours'
  AND donor_message IS NOT NULL;
```

---

## Success Criteria

All items must be checked for deployment to be considered successful:

- [ ] All database migrations completed successfully
- [ ] All code changes deployed without errors
- [ ] New donations store all Stripe IDs correctly
- [ ] Donor messages are captured and displayed
- [ ] Dashboard links work correctly
- [ ] Existing donations still work
- [ ] No increase in error rates
- [ ] Performance is acceptable
- [ ] Admin team can use new features
- [ ] 24-hour monitoring shows no issues

---

**Verification Status: [ ] Complete**

**Verified By: ________________**

**Date: ________________**

**Notes:**
_______________________________________
_______________________________________
_______________________________________
