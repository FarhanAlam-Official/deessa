# Payment Systems Analysis & Improvement Plan

## Executive Summary

This document compares the **Donation Payment System** and **Conference Payment System**, identifies issues, and provides actionable recommendations for improvement.

### Key Issues Identified

1. ❌ **Currency Inconsistency**: Conference shows NPR but settles in USD with Stripe
2. ❌ **Status Update Disparity**: Conference confirms easily, donations stay pending
3. ❌ **Architectural Inconsistency**: Two different payment confirmation flows
4. ⚠️ **User Experience**: Confusing currency display and status delays

---

## System Comparison Matrix

| Feature                   | Donation System                              | Conference System                           | Winner         |
| ------------------------- | -------------------------------------------- | ------------------------------------------- | -------------- |
| **Payment Confirmation**  | PaymentService (V2 Architecture)             | Direct webhook update                       | 🏆 Donation    |
| **Status Updates**        | `pending` → `completed` (via PaymentService) | `pending_payment` → `confirmed` (direct)    | 🏆 Conference  |
| **Currency Handling**     | Dynamic: Stripe=USD, Local=NPR               | Hardcoded: All providers=NPR (display only) | ⚠️ Both flawed |
| **Idempotency**           | ✅ Via payment_events + state checks         | ✅ Via payment_events                       | 🤝 Tie         |
| **Amount Verification**   | ✅ Fail-closed with review status            | ✅ Fail-closed with review status           | 🤝 Tie         |
| **Currency Verification** | ✅ Yes (logs mismatch)                       | ⚠️ Partial (syncs DB to Stripe)             | 🏆 Donation    |
| **Receipt Generation**    | ✅ Automated in webhook                      | ❌ Not implemented                          | 🏆 Donation    |
| **Email Confirmation**    | ✅ With receipt                              | ✅ Separate confirmation email              | 🤝 Tie         |
| **Error Handling**        | ✅ Robust (PaymentService)                   | ✅ Good (direct)                            | 🏆 Donation    |
| **Architecture**          | ✅ Centralized (PaymentService)              | ❌ Scattered (direct DB updates)            | 🏆 Donation    |

---

## Issue #1: Currency Inconsistency 💰

### Problem

#### Donation Flow

```typescript
// lib/actions/donation.ts
const currency =
  input.provider === "stripe"
    ? settings.defaultCurrency || "USD" // ← Stripe uses USD
    : ("NPR" as const); // ← Local gateways use NPR
```

**Result**: ✅ Works correctly - Stripe charges in USD, local gateways in NPR

#### Conference Flow

```typescript
// lib/actions/conference-registration.ts
const currency =
  actualProvider === "khalti" || actualProvider === "esewa"
    ? ("NPR" as const)
    : (fee.currency as "NPR" | "USD" | "EUR" | "GBP" | "INR");
```

**But the UI shows:**

```typescript
// app/(public)/conference/register/payment-options/page.tsx
const currency = sp.get("currency") ?? "NPR"; // ← Always shows NPR
```

**Result**: ❌ Display shows NPR, but Stripe actually charges in USD

### Root Cause

1. Conference settings store `currency: "NPR"` but don't specify provider-specific currency
2. When Stripe is selected, the `fee.currency` is passed as "NPR" to Stripe
3. Stripe **cannot charge NPR** (not supported), so it likely:
   - Converts to USD automatically
   - Or settles in USD without proper currency conversion
4. User sees "NPR 5,000" but is charged "$50 USD"

### Evidence in Code

**Conference webhook shows currency mismatch handling:**

```typescript
// app/api/webhooks/stripe/route.ts (lines 104-125)
const sessionCurrency = String(session.currency || "").toLowerCase();
const regCurrency = String(reg.payment_currency || "NPR").toLowerCase();

// Currency mismatch is non-fatal — sync DB to Stripe's currency
if (regCurrency !== sessionCurrency) {
  await supabase
    .from("conference_registrations")
    .update({ payment_currency: sessionCurrency.toUpperCase() })
    .eq("id", registrationId);
}
```

This **silently corrects** NPR → USD, hiding the issue from the user!

---

## Issue #2: Status Update Disparity 🔄

### Donation System (More Complex, Potentially Slower)

**Flow:**

```
Webhook → confirmDonation() → PaymentService
  ↓
1. Fetch donation (SELECT)
2. Check idempotency (payment_events)
3. Validate state transition
4. Verify amount (fail if mismatch)
5. Verify currency (review if mismatch)
6. Update status to 'completed'
7. Generate receipt (async, fire-and-forget)
```

**Status Mapping:**

```typescript
// PaymentService maps 'confirmed' → 'completed' for V1 compatibility
const dbStatus = finalStatus === "confirmed" ? "completed" : finalStatus;
```

**Potential Issues:**

- ❌ More steps = slower confirmation
- ❌ Currency mismatch → `review` status (not `completed`)
- ✅ Better error handling and validation

### Conference System (Simpler, Faster)

**Flow:**

```
Webhook → confirmConferenceRegistrationFromWebhook()
  ↓
1. Check idempotency (payment_events)
2. Fetch registration
3. Verify amount (fail if mismatch)
4. Sync currency (NPR → USD if needed)
5. Update status to 'confirmed'
6. Send confirmation email
```

**Why It's Faster:**

- ✅ Direct DB update (no PaymentService layer)
- ✅ Currency mismatch is **non-fatal** (auto-fixes)
- ✅ Fewer validation steps

### The Real Problem

**Donations can get stuck in `review` status if:**

1. Currency mismatch detected (e.g., DB says NPR, Stripe says USD)
2. Amount has floating-point precision issues
3. PaymentService's strict verification fails

**Conference registrations always confirm because:**

1. Currency mismatch is auto-corrected
2. Simpler flow with fewer failure points

---

## Issue #3: Webhook Signing (Not the Issue)

Both systems use the **SAME** webhook secret:

```typescript
const signature = request.headers.get("stripe-signature");
const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
```

✅ **Signing is NOT the problem** - both systems properly verify signatures.

---

## Architectural Inconsistency 🏗️

### Current State

```
┌─────────────────────┐         ┌──────────────────────┐
│  Donation Payment   │         │ Conference Payment   │
│                     │         │                      │
│  Webhook            │         │  Webhook             │
│    ↓                │         │    ↓                 │
│  PaymentService     │         │  Direct DB Update    │
│    ↓                │         │    ↓                 │
│  Complex validation │         │  Simple confirmation │
│    ↓                │         │    ↓                 │
│  'completed' status │         │  'confirmed' status  │
│    ↓                │         │    ↓                 │
│  Receipt generation │         │  Email only          │
└─────────────────────┘         └──────────────────────┘
```

### Issues

1. **Inconsistent Terminology**: `completed` vs `confirmed`
2. **Duplicate Logic**: Two payment confirmation flows
3. **Maintenance Burden**: Changes must be made in two places
4. **Feature Disparity**: Donations have receipts, conferences don't

---

## Root Cause Analysis 🔍

### 1. Currency Issue

**Primary Cause**: Conference fee currency is set to NPR but Stripe doesn't support NPR

**Contributing Factors:**

- No currency validation when setting conference fees
- No provider-specific currency mapping
- Silent currency conversion in webhook hides the issue

### 2. Status Issue

**Primary Cause**: PaymentService has strict verification that can trigger `review` status

**Contributing Factors:**

- Currency mismatch between DB and Stripe (NPR vs USD)
- PaymentService logs currency mismatch but continues to `review` status
- Conference system auto-corrects currency, donation system doesn't

### 3. Architectural Issue

**Primary Cause**: Conference system built before PaymentService (V2) existed

**Contributing Factors:**

- No migration plan to unify systems
- Fear of breaking existing conference functionality
- Time constraints during development

---

## Recommended Fixes 🛠️

### Fix #1: Standardize Currency Handling (HIGH PRIORITY) 🚨

#### Option A: Stripe-Only for International Currency (Recommended)

**Change:**

```typescript
// lib/actions/conference-registration.ts
const currency =
  actualProvider === "khalti" || actualProvider === "esewa"
    ? "NPR"
    : settings.defaultCurrency || "USD"; // Use global settings, like donations
```

**Benefits:**

- ✅ Consistent with donation system
- ✅ Stripe handles USD/EUR/GBP correctly
- ✅ Local gateways use NPR correctly
- ✅ No silent currency conversion

**Impact:**

- UI must display correct currency based on provider selection
- Conference settings should specify currency per payment provider

#### Option B: Force NPR for All Conference Payments

**Change:**

```typescript
// lib/actions/conference-registration.ts
if (actualProvider === "stripe" && fee.currency === "NPR") {
  return {
    ok: false,
    message:
      "Stripe does not support NPR. Please use Khalti or eSewa for NPR payments.",
  };
}
```

**Benefits:**

- ✅ Clear error message to users
- ✅ Prevents silent currency conversion
- ✅ Forces correct payment method selection

**Drawbacks:**

- ❌ Limits international users to local payment methods
- ❌ Blocks Stripe for conferences (may lose international attendees)

### Fix #2: Unify Payment Confirmation (MEDIUM PRIORITY)

**Migrate conference payments to PaymentService:**

```typescript
// app/api/webhooks/stripe/route.ts
async function confirmConferenceRegistration(
  session: Stripe.Checkout.Session,
  eventId: string,
): Promise<boolean> {
  const registrationId = session.metadata?.conference_registration_id;
  if (!registrationId) return false;

  // Use PaymentService instead of direct DB update
  const adapter = createStripeAdapter();
  const stripeEvent = {
    type: "checkout.session.completed",
    data: { object: session },
    id: eventId,
  } as Stripe.Event;

  const verificationResult = await adapter.processVerifiedEvent(stripeEvent);

  const paymentService = getPaymentService();
  const result = await paymentService.confirmConferencePayment({
    registrationId,
    provider: "stripe",
    verificationResult,
    eventId,
  });

  // Generate receipt if confirmed
  if (result.success && result.status === "confirmed") {
    await generateConferenceReceipt({ registrationId });
  }

  return result.success;
}
```

**Benefits:**

- ✅ Single source of truth for payment confirmation
- ✅ Consistent error handling and logging
- ✅ Idempotency guaranteed
- ✅ Easier to maintain and test

**Implementation Steps:**

1. Create `confirmConferencePayment()` method in PaymentService
2. Add `conference_registrations` table support to PaymentService
3. Update webhook to use PaymentService
4. Add receipt generation for conferences
5. Test thoroughly with all payment providers

### Fix #3: Currency Display Accuracy (HIGH PRIORITY) 🚨

**Update conference payment UI:**

```typescript
// app/(public)/conference/register/payment-options/page.tsx
const getCurrencyForProvider = (provider: PaymentProvider): string => {
  if (provider === "khalti" || provider === "esewa") {
    return "NPR";
  }
  // Get from settings or default to USD for Stripe
  return settings.defaultCurrency || "USD";
};

const displayCurrency = getCurrencyForProvider(selectedProvider);
const displayAmount =
  currency === "NPR"
    ? fee.amount.toLocaleString("en-IN") // 5,000
    : fee.amount.toLocaleString("en-US"); // 50.00
```

**Update conference settings validation:**

```typescript
// Validate currency is supported by provider
if (provider === "stripe" && !["USD", "EUR", "GBP", "INR"].includes(currency)) {
  return {
    ok: false,
    message: `Stripe does not support ${currency}. Please use USD, EUR, GBP, or INR.`,
  };
}
```

### Fix #4: Auto-Correct Currency Mismatch in Donations (LOW PRIORITY)

**Make donation webhook behave like conference:**

```typescript
// lib/payments/core/PaymentService.ts
if (!currencyVerification.valid) {
  // Instead of setting to 'review', auto-correct like conference does
  await this.supabase
    .from("donations")
    .update({ currency: verificationResult.currency.toUpperCase() })
    .eq("id", donationId);

  console.warn("[PaymentService] Auto-corrected currency", {
    donationId,
    from: donation.currency,
    to: verificationResult.currency,
  });

  // Continue to 'confirmed' instead of 'review'
  finalStatus = "confirmed";
}
```

**Benefits:**

- ✅ Donations confirm faster
- ✅ No manual admin review needed for currency mismatches
- ✅ Consistent with conference behavior

**Risks:**

- ⚠️ Hides potential configuration issues
- ⚠️ User might be charged different currency than expected

---

## Implementation Priority 📋

### Phase 1: Critical Fixes (Ship This Week)

1. **Fix Currency Display** (2 hours)
   - Update payment UI to show correct currency per provider
   - Add validation to prevent NPR + Stripe combination
   - Test with all payment providers

2. **Document Currency Behavior** (1 hour)
   - Add admin documentation about currency support
   - Update payment configuration guide
   - Add currency selection to conference settings

### Phase 2: Architecture Improvements (Next Sprint)

3. **Unify Payment Confirmation** (1 week)
   - Extend PaymentService to support conferences
   - Migrate conference webhook to use PaymentService
   - Add comprehensive tests

4. **Add Conference Receipts** (3 days)
   - Generate receipts for conference payments
   - Email receipts to attendees
   - Add receipt download to registration dashboard

### Phase 3: Polish & Optimization (Future)

5. **Currency Conversion** (1 week)
   - Add real-time currency conversion
   - Display amount in user's local currency
   - Settle in supported currency (USD for Stripe, NPR for local)

6. **Unified Status Model** (3 days)
   - Standardize on `confirmed` status across both systems
   - Update all queries to handle both `completed` and `confirmed`
   - Add database migration

---

## Testing Checklist ✅

### Currency Testing

- [ ] **Donation → Stripe → USD**
  - Shows USD amount
  - Charges in USD
  - Receipt shows USD

- [ ] **Donation → Khalti → NPR**
  - Shows NPR amount
  - Charges in NPR
  - Receipt shows NPR

- [ ] **Conference → Stripe → USD**
  - Shows USD amount (currently shows NPR ❌)
  - Charges in USD
  - Confirmation email shows USD

- [ ] **Conference → Khalti → NPR**
  - Shows NPR amount
  - Charges in NPR
  - Confirmation email shows NPR

### Status Testing

- [ ] **Donation payment successful**
  - Status updates to `completed`
  - Receipt generated
  - Email sent

- [ ] **Conference payment successful**
  - Status updates to `confirmed`
  - Confirmation email sent

- [ ] **Currency mismatch**
  - Donation: Auto-corrects or goes to review (document behavior)
  - Conference: Auto-corrects and confirms

- [ ] **Amount mismatch**
  - Both: Go to review status
  - Admin notified

### Webhook Testing

- [ ] **Duplicate webhook events**
  - Both: Idempotent (no duplicate confirmations)

- [ ] **Webhook signature invalid**
  - Both: Reject with 401

- [ ] **Webhook timeout**
  - Both: Return 200 OK (Stripe will retry)

---

## Comparison Summary

### What Donation System Does Better

1. ✅ **Centralized Architecture** (PaymentService)
2. ✅ **Receipt Generation** automated
3. ✅ **Currency Verification** with logging
4. ✅ **Extensible Design** for future payment providers

### What Conference System Does Better

1. ✅ **Faster Confirmation** (simpler flow)
2. ✅ **Auto-Corrects Currency** (better UX)
3. ✅ **Less Prone to Review Status** (fewer failure points)

### What Both Need

1. ❌ **Currency Display Accuracy** (show what user will actually pay)
2. ❌ **Unified Architecture** (one payment confirmation flow)
3. ❌ **Better Error Messages** (tell user what went wrong)
4. ❌ **Admin Clarity** (consistent status terminology)

---

## Immediate Action Items 🎯

### For Developers

1. **Fix currency display in conference payment UI** ← START HERE
2. Add provider-specific currency mapping
3. Update conference settings validation
4. Test all payment provider combinations

### For Admin/Support

1. Check all pending/review donations for currency mismatches
2. Manually confirm those with correct amounts
3. Document which currencies work with which providers
4. Update help documentation

### For Product/UX

1. Design currency selection UI for conference payments
2. Add warning when user selects unsupported currency
3. Show estimated amount in user's local currency
4. Clarify "pending" vs "review" status meanings

---

## Questions & Answers 💬

### Q: Why do donations stay pending?

**A:** Donations use PaymentService which has strict verification. If the currency in the database (NPR) doesn't match what Stripe charged (USD), the payment goes to `review` status instead of `completed`.

**Fix:** Auto-correct currency like conference system does, or ensure currency is set correctly from the start.

### Q: Why does conference show NPR but charge USD?

**A:** The conference fee is configured as NPR, but when passed to Stripe (which doesn't support NPR), Stripe silently converts/charges in USD. The webhook then corrects the database currency.

**Fix:** Validate currency against provider capabilities before payment initiation, and show correct currency in UI.

### Q: Are there webhook signing issues?

**A:** No, both systems use the same signature verification. This is not the cause of status update differences.

### Q: Should we migrate conference to PaymentService?

**A:** Yes, eventually. Benefits:

- Single source of truth
- Consistent behavior
- Easier maintenance
- Better error handling

**Timeline:** Not urgent, but recommended for Phase 2.

### Q: Which currency should we use for Stripe?

**A:** **USD is recommended** for Stripe. Reasons:

- Stripe's default currency
- Lowest fees
- Best exchange rates
- Most stable

If targeting Nepali users, use Khalti/eSewa (NPR only).

---

## Conclusion 🎬

Both payment systems work, but have different strengths and issues:

- **Donation system**: Better architecture, but stricter verification can cause delays
- **Conference system**: Faster, but uses auto-correction which hides configuration issues

**Recommended Path Forward:**

1. **Week 1**: Fix currency display (HIGH PRIORITY)
2. **Week 2-3**: Unify payment confirmation architecture
3. **Week 4**: Add conference receipts
4. **Future**: Add currency conversion and better UX

**Success Metrics:**

- ✅ 0% payments stuck in review status
- ✅ 100% currency accuracy in UI
- ✅ <2 second webhook response time
- ✅ 0% duplicate payment confirmations

---

**Document Version:** 1.0  
**Last Updated:** March 6, 2026  
**Next Review:** After Phase 1 implementation  
**Owner:** Engineering Team
