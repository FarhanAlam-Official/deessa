# Stripe Payment Intent ID Issue - Analysis & Implementation Plan

## Problem Statement

**Current Issue:** Our system stores Stripe `checkout_session_id` (e.g., `cs_test_xxx`) as the transaction reference in the `payments` table. However, Stripe financial operations (refunds, reconciliation, disputes) require the `payment_intent_id` (e.g., `pi_xxx`).

**Impact:**
- Cannot link directly to transactions in Stripe Dashboard
- Difficult to perform refunds programmatically
- Reconciliation requires extra API calls
- Support operations are slower

## Current Implementation Analysis

### 1. What's Being Stored

**Location:** `lib/payments/adapters/StripeAdapter.ts` (Line 230-235)

```typescript
// Extract transaction ID (session ID or subscription ID)
const transactionId = session.subscription && typeof session.subscription === 'string'
  ? session.subscription
  : session.id  // ← This stores the session ID (cs_xxx)
```

**Result:** The `payments.transaction_id` field contains:
- One-time payments: `cs_test_xxx` (Checkout Session ID)
- Subscriptions: `sub_xxx` (Subscription ID)

### 2. Where It's Stored

**Table:** `payments`
**Column:** `transaction_id`
**Created by:** `PaymentService.confirmDonation()` via `StripeAdapter.verifyCheckoutSession()`

### 3. What We Actually Need

For Stripe Dashboard links and financial operations, we need:
- **Payment Intent ID**: `pi_xxx` (for one-time payments)
- **Subscription ID**: `sub_xxx` (for recurring payments) ✓ Already correct

## Solution Design

### Option 1: Store Payment Intent ID Instead (Recommended)

**Pros:**
- Aligns with Stripe's financial operations
- Direct dashboard links work
- Simpler refund implementation
- Better for reconciliation

**Cons:**
- Need to expand session object to get payment_intent
- Slightly more API overhead

### Option 2: Store Both Session ID and Payment Intent ID

**Pros:**
- Maintains backward compatibility
- Can reference both IDs
- More complete audit trail

**Cons:**
- Requires schema change (new column)
- More complex implementation

### Option 3: Fetch Payment Intent on Demand

**Pros:**
- No schema changes
- No webhook changes

**Cons:**
- Extra API calls for every dashboard link
- Slower user experience
- Rate limit concerns

## Recommended Approach: Option 1

Store the Payment Intent ID as the primary transaction reference.

---

## Implementation Plan

### Phase 1: Update Stripe Adapter (Core Change)

**File:** `lib/payments/adapters/StripeAdapter.ts`

**Changes:**

1. **Expand the session object** to include payment_intent:
```typescript
private async verifyCheckoutSession(event: Stripe.Event): Promise<VerificationResult> {
  const session = event.data.object as Stripe.Checkout.Session

  // For one-time payments, we need to expand to get payment_intent
  let paymentIntentId: string | null = null
  
  if (session.mode === 'payment' && session.payment_intent) {
    // payment_intent is already a string ID if not expanded
    paymentIntentId = typeof session.payment_intent === 'string' 
      ? session.payment_intent 
      : session.payment_intent.id
  }

  // Extract transaction ID (payment intent for one-time, subscription for recurring)
  const transactionId = session.subscription && typeof session.subscription === 'string'
    ? session.subscription  // Keep subscription ID for recurring
    : paymentIntentId || session.id  // Use payment intent, fallback to session
```

2. **Update metadata** to include both IDs:
```typescript
const metadata: Record<string, unknown> = {
  sessionId: session.id,  // Keep for reference
  paymentIntentId: paymentIntentId,  // Add payment intent
  subscriptionId: session.subscription || null,
  customerId: session.customer || null,
  mode: session.mode,
  paymentStatus: session.payment_status,
  eventId: event.id,
}
```

### Phase 2: Update Webhook Handler

**File:** `app/api/webhooks/stripe/route.ts`

**Changes:**

1. **Expand session retrieval** (if we need to fetch session manually):
```typescript
// When retrieving session for verification
const session = await stripe.checkout.sessions.retrieve(sessionId, {
  expand: ['payment_intent']  // Expand to get full payment intent object
})
```

**Note:** The webhook already receives the session object, so we just need to ensure it's expanded in the webhook event itself. Stripe automatically includes `payment_intent` as a string ID in `checkout.session.completed` events.

### Phase 3: Update Provider Dashboard Utility

**File:** `lib/utils/provider-dashboard.ts`

**Changes:**

Already updated to handle payment intent IDs! Current code:
```typescript
if (cleanId.startsWith("pi_")) {
  // Payment intent ID - can link directly
  const baseUrl = isTestMode
    ? "https://dashboard.stripe.com/test/payments"
    : "https://dashboard.stripe.com/payments"
  return `${baseUrl}/${cleanId}`
}
```

This will work once we store `pi_xxx` instead of `cs_xxx`.

### Phase 4: Data Migration (Optional)

**For existing records**, we can:

1. **Create a migration script** to backfill payment intent IDs:
```sql
-- Migration script (to be run carefully)
-- This would require calling Stripe API for each session ID
-- Best done as a background job
```

2. **Or leave existing records** and only fix new ones:
- Existing records continue to work (just no direct dashboard link)
- New records get proper payment intent IDs
- Gradually improves over time

---

## Testing Plan

### 1. Unit Tests

**File:** `__tests__/payments/adapters/StripeAdapter.test.ts`

```typescript
describe('StripeAdapter - Payment Intent ID', () => {
  it('should extract payment intent ID from checkout session', () => {
    const mockSession = {
      id: 'cs_test_xxx',
      payment_intent: 'pi_test_yyy',  // ← Should extract this
      mode: 'payment',
      // ... other fields
    }
    // Test that transactionId === 'pi_test_yyy'
  })

  it('should use subscription ID for recurring payments', () => {
    const mockSession = {
      id: 'cs_test_xxx',
      subscription: 'sub_test_zzz',  // ← Should extract this
      mode: 'subscription',
      // ... other fields
    }
    // Test that transactionId === 'sub_test_zzz'
  })
})
```

### 2. Integration Tests

1. **Test webhook with real Stripe event**
2. **Verify payment intent ID is stored in database**
3. **Test dashboard link generation**
4. **Test refund operations** (future)

### 3. Manual Testing

1. Create test donation
2. Complete payment in Stripe test mode
3. Verify webhook processes correctly
4. Check `payments.transaction_id` contains `pi_xxx`
5. Click "View in Dashboard" button
6. Verify it opens correct Stripe transaction

---

## Rollout Strategy

### Stage 1: Code Changes (Low Risk)
- Update StripeAdapter to extract payment_intent
- Update tests
- Deploy to staging

### Stage 2: Staging Validation
- Process test payments
- Verify payment intent IDs are stored
- Test dashboard links
- Monitor for errors

### Stage 3: Production Deployment
- Deploy during low-traffic period
- Monitor webhook processing
- Check error rates
- Verify new donations get payment intent IDs

### Stage 4: Monitoring
- Track dashboard link success rate
- Monitor Stripe API errors
- Verify refund operations work (when implemented)

---

## Rollback Plan

If issues occur:

1. **Immediate:** Revert StripeAdapter changes
2. **Database:** No schema changes, so no DB rollback needed
3. **Existing data:** Unaffected (still has session IDs)

---

## Success Metrics

- ✅ New donations store `pi_xxx` in `payments.transaction_id`
- ✅ Dashboard links open correct Stripe transaction
- ✅ No increase in webhook errors
- ✅ Refund operations work (future feature)
- ✅ Reconciliation is faster (future improvement)

---

## Timeline Estimate

- **Phase 1 (Adapter Update):** 2 hours
- **Phase 2 (Webhook Update):** 1 hour
- **Phase 3 (Dashboard Utility):** Already done ✓
- **Phase 4 (Testing):** 2 hours
- **Phase 5 (Deployment):** 1 hour
- **Total:** ~6 hours

---

## Dependencies

- Stripe SDK (already installed)
- No new packages needed
- No database schema changes
- No breaking changes to API

---

## Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Payment intent not available in webhook | High | Fallback to session ID, log warning |
| Existing integrations break | Medium | Maintain backward compatibility in queries |
| Stripe API rate limits | Low | Payment intent is included in webhook, no extra API calls |
| Data inconsistency | Low | Add validation to ensure ID format is correct |

---

## Next Steps

1. **Review this analysis** with team
2. **Approve implementation plan**
3. **Create feature branch:** `feature/stripe-payment-intent-id`
4. **Implement Phase 1** (StripeAdapter changes)
5. **Write tests**
6. **Deploy to staging**
7. **Validate and deploy to production**

---

## Questions to Answer

- [ ] Do we want to backfill existing records?
- [ ] Should we store both session ID and payment intent ID?
- [ ] What's the priority level for this fix?
- [ ] Any other systems that depend on session IDs?

---

## References

- [Stripe Checkout Session API](https://stripe.com/docs/api/checkout/sessions/object)
- [Stripe Payment Intent API](https://stripe.com/docs/api/payment_intents)
- [Stripe Dashboard URLs](https://stripe.com/docs/dashboard)
- Current implementation: `lib/payments/adapters/StripeAdapter.ts:230-235`
