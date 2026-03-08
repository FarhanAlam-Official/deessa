# Payment System: Stripe Webhook Fix & PAYMENT_MODE Removal

> **Date:** 2026-03-07  
> **Scope:** `lib/payments/*`, `app/api/webhooks/stripe/*`, all provider adapters, server actions, API routes  
> **Author:** Engineering session — AI-assisted refactor

---

## 1. What Was the Problem?

### 1.1 Donations Stuck in "Pending" on Vercel

After commit `35fca4e1b2f3524d419005b4d5311dfa061a9f32`, Stripe donations were no longer transitioning from `pending` → `completed` on Vercel deployments. The Stripe Dashboard confirmed webhooks were being sent and received (HTTP 200), but the donation status in the database never updated.

**Root causes identified:**

| # | Root Cause | Location |
|---|-----------|----------|
| 1 | `PAYMENT_MODE` env var missing/wrong on Vercel caused `getPaymentMode()` to throw or return `'mock'`, which short-circuited real webhook signature verification | `lib/payments/config.ts`, `app/api/webhooks/stripe/route.ts` |
| 2 | In mock mode, the stripe webhook handler did `JSON.parse(body)` instead of `constructEvent()` — meaning the real Stripe event was never properly parsed | `app/api/webhooks/stripe/route.ts` |
| 3 | Currency mismatch: donation DB record stored `NPR` while Stripe returned `USD` — causing `PaymentService.verifyCurrency()` to short-circuit with `review` status instead of `completed` | `lib/payments/core/PaymentService.ts` |

**Why it worked locally:** Local dev used `stripe listen --forward-to localhost:3000/api/webhooks/stripe`, which sends properly signed events. But locally `PAYMENT_MODE=mock` bypassed signature verification entirely, masking the configuration mismatch.

### 1.2 `PAYMENT_MODE` as an Unnecessary Complexity

The `PAYMENT_MODE` environment variable attempted to distinguish `mock` (development) from `live` (production) modes. In practice:

- It was a third source of truth alongside `NODE_ENV` and Stripe's own test/live key distinction.
- A missing or incorrectly set `PAYMENT_MODE` on Vercel would throw errors or silently bypass real payment verification.
- Stripe itself handles test vs. live via the `sk_test_` vs. `sk_live_` key prefix — `PAYMENT_MODE` was redundant.

---

## 2. What Was Done

### 2.1 Removed `PAYMENT_MODE` Entirely

Every reference to `PAYMENT_MODE` was removed across the codebase:

**Core payment library:**

- `lib/payments/config.ts` — Removed `PaymentMode` type, `getPaymentMode()` function, and mock-mode guards in `isProviderEnvConfigured()` / `getSupportedProviders()`
- `lib/payments/stripe.ts` — Removed `mode` param from `startStripeCheckout()` and `verifyStripeSession()`
- `lib/payments/khalti.ts` — Removed `mode` param from `startKhaltiPayment()`
- `lib/payments/esewa.ts` — Removed `mode` param from `startEsewaPayment()`
- `lib/payments/validation.ts` — Removed `validatePaymentMode()` function and `PAYMENT_MODE` env checks

**Adapters:**

- `lib/payments/adapters/StripeAdapter.ts` — Removed `getPaymentMode()` private method and mock-mode signature bypass
- `lib/payments/adapters/KhaltiAdapter.ts` — Removed `getPaymentMode()` and mock verification bypass
- `lib/payments/adapters/EsewaAdapter.ts` — Removed `getPaymentMode()` and mock HMAC bypass

**Server actions:**

- `lib/actions/donation.ts` — Removed `mode` variable and `mode` arg from all payment calls
- `lib/actions/conference-registration.ts` — Same cleanup

**API routes:**

- `app/api/webhooks/stripe/route.ts` — **Critical fix**: removed mock-mode branch, webhook now always uses `constructEvent()` with real signature verification
- `app/api/payments/stripe/verify/route.ts` — Removed `getPaymentMode()` and mock-based `isPaymentComplete` shortcut
- `app/api/payments/khalti/verify/route.ts` — Removed `getPaymentMode()` and mock verification bypass
- `app/api/payments/esewa/success/route.ts` — Removed `getPaymentMode()` from handler
- `app/api/payments/esewa/success/conference-handler.ts` — HMAC verification now always runs (was conditional on `mode === 'live'`)
- `app/api/conference/confirm-stripe-session/route.ts` — Removed `getPaymentMode()` usage

**Frontend:**

- `app/(public)/donate/page.tsx` — Removed mode badge display
- `app/admin/settings/payments/page.tsx` — Removed `paymentMode` prop passing
- `components/admin/payment-settings-form.tsx` — Made `paymentMode` optional, removed mock-mode shortcut in availability logic

### 2.2 Fixed Currency Mismatch (Non-Fatal)

`PaymentService.verifyCurrency()` was updated to be non-fatal when amounts match:

- If currencies differ but amounts are correct, the DB currency is synced to match Stripe's returned currency and the donation proceeds to `completed`.
- This prevents legitimate USD donations (stored as NPR in the DB during creation) from being stuck in `review`.

---

## 3. Current State After Fix

- ✅ Stripe webhooks always verify signature — no bypass possible
- ✅ `PAYMENT_MODE` env var no longer needed on Vercel (can be removed from all environments)
- ✅ Currency mismatches are non-fatal when amounts match; DB is auto-corrected
- ✅ All three adapters (Stripe, Khalti, eSewa) always use real API calls
- ✅ Conference registration Khalti and eSewa verification always hits real APIs
- ✅ Health check route no longer skips provider checks in "mock mode"

---

## 4. What More Could Be Done

### 4.1 High Priority

- **Remove `PAYMENT_MODE` from all Vercel environment variable configs** — it is no longer read anywhere. Leaving it set to wrong values could confuse future developers.
- **Add a TypeScript compile check to CI** — `pnpm tsc --noEmit` should run on every PR to catch type regressions before deployment.
- **Currency consistency at donation creation** — The root cause of the currency mismatch was that `donation.ts` stored `NPR` for all providers but Stripe actually charges in `USD`. The auto-sync fix is a band-aid; a better fix would be to always store the currency Stripe actually charges in at the time of checkout session creation.

### 4.2 Medium Priority

- **Unify conference registration Khalti verification** (Task 8.2) — `handleConferenceVerification()` in `khalti/verify/route.ts` duplicates the same Khalti lookup logic as the donation flow. Both should use `KhaltiAdapter.verify()` routed through `PaymentService`.
- **Unify conference registration eSewa verification** — `conference-handler.ts` contains its own HMAC verification logic that duplicates `EsewaAdapter.verifySignature()`. Should delegate to the adapter.
- **Standardize response format** (Task 8.3) — `/api/payments/khalti/verify` and `/api/payments/esewa/success` return slightly different shapes. Unify into `{ ok, status, message?, error?, transactionId? }`.
- **Add webhook idempotency at DB level** — `payment_events` table exists but conference registration handlers don't use it. A unique constraint on `(event_id, provider)` would make replayed webhooks truly safe.

### 4.3 Low Priority / Future Architecture

- **Remove `isMock` parameter from eSewa conference handler** — The only remaining use of mock-like behaviour is `isMock` in `conference-handler.ts` (triggered by `?mock=1` in the URL). This is a dev convenience that should be gated behind `NODE_ENV !== 'production'` at minimum.
- **Replace `any` types in conference handlers** — `handleConferenceVerification(supabase: any, reg: any, ...)` should use generated Supabase types.
- **Migrate conference registrations to PaymentService** — Conference payments currently bypass `PaymentService.confirmDonation()` entirely. Migrating them would give conference payments the same idempotency, logging, and state-machine guarantees as donations.
- **Stripe webhook retry resilience** — If the webhook handler throws a 5xx, Stripe retries up to 3 days. Consider adding a dead-letter mechanism so failed events can be replayed manually from the admin panel.
- **Monitor currency sync events** — The currency auto-sync in `PaymentService.verifyCurrency()` currently only logs a warning. Add a `payment_events` entry or Sentry breadcrumb so ops can audit how often this happens.

---

## 5. Environment Variables Reference

| Variable | Status | Notes |
|----------|--------|-------|
| `PAYMENT_MODE` | ❌ **Remove** | No longer used anywhere |
| `STRIPE_SECRET_KEY` | ✅ Required | `sk_test_…` for local, `sk_live_…` for Vercel |
| `STRIPE_WEBHOOK_SECRET` | ✅ Required | From Stripe Dashboard → Webhooks → Signing secret |
| `KHALTI_SECRET_KEY` | ✅ Required if using Khalti | |
| `KHALTI_BASE_URL` | ✅ Required if using Khalti | `https://khalti.com/api/v2` |
| `ESEWA_SECRET_KEY` | ✅ Required if using eSewa | |
| `ESEWA_MERCHANT_ID` | ✅ Required if using eSewa | |
| `ESEWA_BASE_URL` | ✅ Required if using eSewa | |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ Required | |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Required | Used for payment status updates (bypasses RLS) |
| `RECEIPT_TOKEN_SECRET` | ✅ Required | `openssl rand -base64 32` |
