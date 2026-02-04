# deessa Foundation – Payments Architecture & Go-Live Guide

This document explains how the donation payment system works (Stripe + Khalti + eSewa), how to configure it per environment, and how to safely go live.

---

## 1. High-Level Architecture

- **Client (public site)**
  - `app/(public)/donate/page.tsx` renders `DonationForm`.
  - `components/donation-form.tsx`:
    - Lets donors pick **amount**, **frequency** (one-time / monthly), and **payment method** (Stripe / Khalti / eSewa).
    - Submits to the **server action** `startDonation` and then redirects to the provider’s secure page.
    - Never handles card numbers or secrets.

- **Server (Next.js + Supabase)**
  - `lib/actions/donation.ts` → `startDonation`:
    - Validates inputs.
    - Reads high‑level settings from `lib/payments/config.ts`.
    - Creates a `donations` row with `payment_status = "pending"`.
    - Delegates to provider helpers to create sessions/transactions:
      - `lib/payments/stripe.ts` → Stripe Checkout session.
      - `lib/payments/khalti.ts` → Khalti epayment init.
      - `lib/payments/esewa.ts` → eSewa redirect URL.
    - Stores the provider reference in `donations.payment_id` as `provider:transactionId`.
    - Returns a **redirect URL** to the client.

- **Webhooks & Verification**
  - Stripe: `app/api/webhooks/stripe/route.ts`.
  - Khalti: `app/api/payments/khalti/verify/route.ts`.
  - eSewa:
    - Success: `app/api/payments/esewa/success/route.ts`.
    - Failure: `app/api/payments/esewa/failure/route.ts`.
  - These handlers:
    - Verify the provider’s payload (signature, lookup, or `transrec`).
    - Look up the matching `donations` row.
    - Idempotently update `payment_status` from `pending` → `completed` / `failed`.
    - **Only webhooks/verification are trusted** to finalize a donation.

- **Admin**
  - Donation monitoring: `app/admin/donations/page.tsx`.
  - Payment config UI: `app/admin/settings/payments/page.tsx` with:
    - `components/admin/payment-settings-form.tsx`.
    - `lib/actions/admin-payments.ts`.
  - High‑level (non-secret) settings are stored via `site_settings` with key `"payments"`.

---

## 2. Database: `donations` Table

Defined in `scripts/001-create-tables.sql` and extended by usage:

- Core columns:
  - `id UUID PRIMARY KEY`
  - `amount DECIMAL(10,2) NOT NULL`
  - `currency TEXT DEFAULT 'INR'` (used as `"USD"` / `"NPR"` by the app)
  - `donor_name TEXT NOT NULL`
  - `donor_email TEXT NOT NULL`
  - `donor_phone TEXT`
  - `is_monthly BOOLEAN DEFAULT FALSE`
  - `payment_status TEXT DEFAULT 'pending'`
    - Values used by the app: `"pending" | "completed" | "failed"`.
  - `payment_id TEXT` – provider reference, in the form:
    - `"stripe:<checkout_session_id>"`
    - `"khalti:<pidx>"`
    - `"esewa:<refId>"`
  - `created_at TIMESTAMPTZ DEFAULT NOW()`

**Important:**  
`payment_status` is **only** set to `"completed"` or `"failed"` by webhook/verification handlers, never directly by the public client.

---

## 3. Payment Settings & Modes

### 3.1 Payment Mode

Controlled via environment variable:

- `PAYMENT_MODE="mock" | "live"`
  - `mock`:
    - No real network calls to payment providers.
    - Helpers and webhooks simulate realistic responses and status changes.
    - Safe for local development and demos.
  - `live`:
    - Uses real Stripe, Khalti, and eSewa endpoints.
    - Requires proper live API keys and webhook secrets in env.
    - **Production safety**: the app refuses to start in production unless `PAYMENT_MODE="live"` (guardrail in `lib/payments/config.ts`).

Implementation: `lib/payments/config.ts` → `getPaymentMode()`.

### 3.2 High-Level Payment Settings

Type: `PaymentSettings` (`lib/payments/config.ts`):

- `enabledProviders: ("stripe" | "khalti" | "esewa")[]`
- `primaryProvider: "stripe" | "khalti" | "esewa"`
- `defaultCurrency: "USD" | "NPR"` (used for Stripe)
- `allowRecurring: boolean`

Storage:

- Stored in `site_settings` table under key `"payments"` via:
  - `lib/actions/admin-settings.ts` (`updateSiteSetting`).
  - `lib/actions/admin-payments.ts` (`updatePaymentSettings`).

Loading / filtering:

- `lib/payments/config.ts`:
  - `getPaymentSettings()` – loads and merges DB settings with defaults.
  - `isProviderEnvConfigured(provider)` – checks secrets in env (for live mode).
  - `getSupportedProviders(settings)`:
    - In `mock` mode: returns all `enabledProviders`.
    - In `live` mode: returns only providers that are both enabled **and** have env keys set.

Admin UI:

- `app/admin/settings/payments/page.tsx` + `components/admin/payment-settings-form.tsx`:
  - Toggle enable/disable per provider.
  - Choose primary provider.
  - Change default Stripe currency.
  - Toggle allowing recurring (monthly) donations.
  - Shows whether each provider’s env keys are configured and whether it’s effectively visible to donors.

---

## 4. Environment Variables

**Never commit real keys** into the repo. Configure these in `.env.local` (dev) and the hosting platform (production).

### 4.1 Common

- `PAYMENT_MODE`  
  - `"mock"` (default-safe for local dev) or `"live"`.
- `NEXT_PUBLIC_SITE_URL`  
  - Base site URL for building return URLs (e.g. `https://deessa.org`).

### 4.2 Stripe

Required for live mode:

- `STRIPE_SECRET_KEY`  
  - Stripe secret (starts with `sk_live_` or `sk_test_`).
- `STRIPE_WEBHOOK_SECRET`  
  - Provided by Stripe when you configure a webhook endpoint.
- `STRIPE_SUCCESS_URL`  
  - e.g. `https://deessa.org/donate/success`
- `STRIPE_CANCEL_URL`  
  - e.g. `https://deessa.org/donate/cancel`

Used files:

- `lib/payments/stripe.ts`
- `app/api/webhooks/stripe/route.ts`

Stripe webhook path:

- `POST /api/webhooks/stripe`

### 4.3 Khalti

Required for live mode:

- `KHALTI_SECRET_KEY`
  - Sandbox: Get from [test-admin.khalti.com](https://test-admin.khalti.com) (use OTP: `987654`)
  - Production: Get from [admin.khalti.com](https://admin.khalti.com)
  - Format: `live_secret_key_...` (use the `live_secret_key` value, not test keys)
- `KHALTI_BASE_URL`  
  - Sandbox: `https://dev.khalti.com/api/v2`
  - Production: `https://khalti.com/api/v2`
- `KHALTI_RETURN_URL`  
  - e.g. `https://deessa.org/payments/khalti/return`
  - This is where users are redirected after payment completion
  - The return page calls the verification API endpoint
- `KHALTI_SANDBOX_MODE` (optional)
  - Set to `"true"` for sandbox testing, `"false"` or leave empty for production

Used files:

- `lib/payments/khalti.ts` - Payment initiation with enhanced features
- `app/api/payments/khalti/verify/route.ts` - Payment verification
- `app/(public)/payments/khalti/return/page.tsx` - Return page handler

Khalti verification path:

- `POST /api/payments/khalti/verify`
  - Body: `{ "pidx": "<khalti_pidx>" }`
  - Handles all status codes: Completed, Pending, Initiated, Refunded, Expired, Canceled, Partially Refunded

**Enhanced Features:**

- Customer information (name, email, phone)
- Amount breakdown for transparency
- Product details array
- Merchant metadata
- Comprehensive error handling
- Amount verification
- Idempotency checks

### 4.4 eSewa

Required for live mode:

- `ESEWA_MERCHANT_ID`  
  - Sandbox: `EPAYTEST`
  - Production: Your merchant ID from eSewa
- `ESEWA_SECRET_KEY`
  - **Required in live mode** for signature verification of eSewa v2 responses.
- `ESEWA_BASE_URL`  
  - Sandbox: `https://uat.esewa.com.np`
  - Production: `https://esewa.com.np`
- `ESEWA_SUCCESS_URL`  
  - e.g. `https://deessa.org/api/payments/esewa/success`
  - Must be publicly accessible from eSewa servers
  - Must use HTTPS in production
- `ESEWA_FAILURE_URL`  
  - e.g. `https://deessa.org/api/payments/esewa/failure`
  - Must be publicly accessible from eSewa servers
  - Must use HTTPS in production

Used files:

- `lib/payments/esewa.ts` - Payment initiation with validation
- `app/api/payments/esewa/success/route.ts` - Success callback handler
- `app/api/payments/esewa/failure/route.ts` - Failure callback handler

eSewa callback paths:

- Success: `GET /api/payments/esewa/success?refId=...&pid=...&amt=...`
- Failure: `GET /api/payments/esewa/failure?pid=...`

**Enhanced Features:**

- Proper parameter validation
- Amount verification against donation record
- Transaction verification via `transrec` endpoint
- Idempotency checks
- Comprehensive error handling
- Support for both sandbox and production URLs

---

## 5. Provider-Specific Flows

### 5.1 Stripe (Checkout)

1. `startDonation` calls `startStripeCheckout`:
   - Creates a Stripe Checkout session with:
     - `mode: "payment"`.
     - `line_items` based on amount and currency.
     - `client_reference_id = donation.id`.
     - `metadata.donation_id = donation.id`.
     - `success_url` / `cancel_url` from env.
   - Returns `session.url` and `session.id`.
2. `DonationForm` redirects the browser to `session.url`.
3. Stripe calls `POST /api/webhooks/stripe` on:
   - `checkout.session.completed` → mark donation `payment_status = "completed"` if still `pending`.
   - `checkout.session.expired` or `payment_intent.payment_failed` → mark `failed` if still `pending`.
4. Admins see final status in `Admin → Donations`.

Security:

- Webhook verified using `stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET)`.
- Client never sees `STRIPE_SECRET_KEY` or webhook secret.

### 5.2 Khalti

1. `startDonation` calls `startKhaltiPayment`:
   - Validates amount (minimum Rs. 10 = 1000 paisa), email, and name.
   - Calls `POST {KHALTI_BASE_URL}/epayment/initiate/` with:
     - `amount` in paisa (minor units).
     - `purchase_order_id = donation.id`.
     - `purchase_order_name = donor name`.
     - `return_url = KHALTI_RETURN_URL`.
     - `customer_info` with name, email, and optional phone.
     - `amount_breakdown` for transparency.
     - `product_details` array.
     - `merchant_extra` with donation metadata.
   - Stores `payment_id = "khalti:<pidx>"` on the donation.
   - Returns `payment_url` for redirect.
2. `DonationForm` redirects donor to Khalti's hosted payment page.
3. User completes payment on Khalti's page (payment link expires in 60 minutes).
4. Khalti redirects user to `KHALTI_RETURN_URL` with `pidx` and other parameters.
5. Return page (`app/(public)/payments/khalti/return/page.tsx`):
   - Extracts `pidx` from URL query parameters.
   - Calls `POST /api/payments/khalti/verify` with `{ pidx }`.
   - Shows loading state while verifying.
   - Redirects to success/failure page based on result.
6. `khalti/verify` handler:
   - Finds the donation by `payment_id = "khalti:<pidx>"`.
   - Checks idempotency (prevents duplicate processing).
   - Calls `POST {KHALTI_BASE_URL}/epayment/lookup/` with `Authorization: Key <KHALTI_SECRET_KEY>`.
   - Verifies amount matches donation amount (with tolerance).
   - Handles all status codes:
     - `Completed` → `payment_status = "completed"` (provide service).
     - `Pending` / `Initiated` → Keep as `pending` (hold, contact Khalti if needed).
     - `Refunded` / `Partially Refunded` → `payment_status = "failed"` (do not provide service).
     - `Expired` / `User canceled` → `payment_status = "failed"` (do not provide service).
   - Updates donation status and redirects user.

Security:

- Only server-side code talks to Khalti.
- `KHALTI_SECRET_KEY` is never exposed to the browser.
- Amount verification ensures payment matches donation.
- Idempotency prevents duplicate processing.
- Comprehensive error handling and logging (without sensitive data).

### 5.3 eSewa

1. `startDonation` calls `startEsewaPayment`:
   - Validates amount (minimum Rs. 1).
   - Builds a redirect URL with all required parameters:
     - `amt`: Amount (formatted to 2 decimal places).
     - `psc`: Product service charge (0 for donations).
     - `pdc`: Product delivery charge (0 for donations).
     - `txAmt`: Tax amount (0 for donations).
     - `tAmt`: Total amount (amt + psc + pdc + txAmt).
     - `pid`: Product ID (`esewa_<donationId>`) for callback mapping.
     - `scd`: Service code (merchant ID).
     - `su`: Success URL (callback on success).
     - `fu`: Failure URL (callback on failure).
   - Returns the URL for redirect.
2. `DonationForm` redirects donor to eSewa's payment page.
3. User completes payment on eSewa's page.
4. eSewa redirects back to callback URLs:
   - `ESEWA_SUCCESS_URL` on success → `GET /api/payments/esewa/success?refId=...&pid=...&amt=...`
   - `ESEWA_FAILURE_URL` on failure → `GET /api/payments/esewa/failure?pid=...`
5. Success handler (`app/api/payments/esewa/success/route.ts`):
   - Validates all required parameters (`refId`, `pid`, `amt`).
   - Validates UUID format of donation ID.
   - Finds donation by ID (extracted from `pid`).
   - Checks idempotency (prevents duplicate processing).
   - Verifies amount matches donation amount (with tolerance).
   - Calls `GET {ESEWA_BASE_URL}/epay/transrec?amt=...&scd=<merchantId>&pid=<pid>&rid=<refId>`.
   - If response contains `"success"` (case-insensitive):
     - Sets `payment_status = "completed"` and `payment_id = "esewa:<refId>"`.
     - Redirects user to success page.
   - Otherwise:
     - Sets `payment_status = "failed"`.
     - Redirects user to cancel page.
6. Failure handler (`app/api/payments/esewa/failure/route.ts`):
   - Validates `pid` parameter.
   - Derives `donationId` from `pid`.
   - Checks idempotency.
   - Sets `payment_status = "failed"` if still `pending`.
   - Redirects user to cancel page.

Security:

- Final status is only trusted after `transrec` verification.
- Secrets stay server-side.
- Amount verification ensures payment matches donation.
- Idempotency prevents duplicate processing.
- Comprehensive error handling and logging (without sensitive data).
- Proper URL encoding and parameter validation.

---

## 6. Admin Usage

### 6.1 Monitoring Donations

- URL: `/admin/donations`
- Access: roles allowed by `canViewFinance` (e.g. `SUPER_ADMIN`, `ADMIN`, `FINANCE`).
- Features:
  - Summary cards:
    - **Total Donations** – sum of amounts where `payment_status = "completed"`.
    - **Total Donors** – count of completed donations.
    - **Monthly Donors** – count of completed donations with `is_monthly = true`.
  - Table:
    - Donor name + email.
    - Amount (currently rendered as ₹; can be extended to show actual `currency`).
    - Type (Monthly vs One-time).
    - Status (`completed`, `pending`, `failed`).
    - Date.

### 6.2 Configuring Payment Providers

- URL: `/admin/settings/payments`
- Access: `SUPER_ADMIN` and `ADMIN`.
- What you can configure:
  - Enable/disable: Stripe, Khalti, eSewa.
  - Choose primary provider (preselected in the public form).
  - Choose default currency for Stripe (USD/NPR).
  - Toggle whether recurring (monthly) donations are allowed.
- What you **cannot** configure here:
  - API keys, webhook secrets, or live/mock mode (these are env-only for security).

---

## 7. Go-Live Checklist

### Step 1 – Local / Dev (Mock Mode)

1. Create `.env.local` with at minimum:
   - `PAYMENT_MODE="mock"`
   - `NEXT_PUBLIC_SITE_URL="http://localhost:3000"`
2. Run the app and open `/donate`:
   - Test donations with all three providers.
   - Confirm:
     - `donations` rows are created with `payment_status = "pending"`.
     - Mock webhooks/verification update them to `"completed"` or `"failed"`.
3. In `/admin/settings/payments`:
   - Toggle providers and confirm the donation form responds (providers appear/disappear).

### Step 2 – Staging (Live Mode with Test/Sandbox Keys)

1. Set environment variables on staging:
   - `PAYMENT_MODE="live"`.
   - Stripe test keys (`sk_test_...`, webhook secret).
   - Khalti test keys + base URL + return URL.
   - eSewa test merchant ID + base URL + success/failure URLs.
2. In each provider dashboard:
   - Configure webhooks/callback URLs to hit your staging domain:
     - Stripe → `https://staging.deessa.org/api/webhooks/stripe`.
     - Khalti → your front-end return URL that triggers `khalti/verify`.
     - eSewa → `https://staging.deessa.org/api/payments/esewa/success` and `/failure`.
3. Test flows with small amounts:
   - Stripe test cards.
   - Khalti and eSewa sandbox flows.
4. Verify in `/admin/donations`:
   - `payment_status` transitions from `pending` → `completed` or `failed` as expected.

### Step 3 – Production

1. Repeat Step 2 using **live** credentials and production domain.
2. Double-check:
   - All env vars are set.
  - `PAYMENT_MODE="live"` (production guardrail will fail startup otherwise).
   - Webhooks/callback URLs in provider dashboards point to the production domain.
   - `/admin/settings/payments` reflects the providers you actually want live.
3. Monitor:
   - Stripe, Khalti, and eSewa dashboards for errors.
   - Supabase `donations` table and `/admin/donations` for anomalies (e.g. mismatched amounts).

---

## 8. Security Features

The payment system includes comprehensive security measures:

### Input Validation

- Amount validation (minimums and maximums per currency)
- Email format validation
- Phone number validation
- UUID format validation
- Input sanitization to prevent XSS

### Transaction Security

- **Amount Verification**: All payments are verified to ensure amounts match between donation and gateway response
- **Idempotency**: Prevents duplicate processing of the same transaction
- **Server-Side Only**: All API keys and secrets stay server-side, never exposed to client
- **Verification Required**: Never trust client-side status; always verify with gateway API

### Secure Logging

- Sensitive data is masked in logs (API keys, transaction IDs)
- Payment events are logged for auditing without exposing PII
- Error logging includes context without sensitive details

### Error Handling

- Comprehensive error types and messages
- User-friendly error messages (internal errors not exposed)
- Proper HTTP status codes
- Retry logic for transient failures
- Timeout handling (30 seconds default)

### Security Utilities

- `lib/payments/security.ts` provides:
  - Input validation functions
  - Amount validation
  - Secure logging utilities
  - Idempotency key generation
  - Data masking functions

## 9. Maintenance Notes

- **Adding a new provider**:
  - Extend `PaymentProvider` type in `lib/payments/config.ts`.
  - Add a helper in `lib/payments/<provider>.ts`.
  - Add its init in `startDonation`.
  - Add a new webhook/verify route under `app/api/...`.
  - Extend the admin payment settings form and donation form provider selector.
  - Update this documentation.

- **Changing API versions or endpoints**:
  - Stripe: update `apiVersion` in `lib/payments/stripe.ts` when upgrading the Stripe SDK.
  - Khalti/eSewa: adjust URLs and payload shapes only inside their helper + verify files.
  - Update documentation with new endpoints/parameters.

- **Security checks**:
  - Never log full request bodies from providers (to avoid leaking PII).
  - Keep Stripe/Khalti/eSewa secrets only in environment variables.
  - Do not trust query params alone for success; always confirm via webhook/verify call.
  - Regularly review and update security utilities.
  - Monitor for security advisories from payment providers.

- **Testing**:
  - Always test in sandbox/staging before production.
  - Test all error scenarios (network failures, invalid amounts, etc.).
  - Verify idempotency works correctly.
  - Test amount verification with edge cases.

## 10. Additional Documentation

For detailed provider-specific documentation, see:

- [Khalti Integration Guide](./KHALTI_INTEGRATION.md) - Complete Khalti setup and troubleshooting
- [eSewa Integration Guide](./ESEWA_INTEGRATION.md) - Complete eSewa setup and troubleshooting

## 11. Support and Troubleshooting

### Common Issues

**Payment stuck in pending:**

- Check verification endpoint logs
- Manually verify payment using provider's lookup API
- Check callback/return URLs are accessible

**Amount mismatches:**

- Verify currency conversion is correct
- Check tolerance settings (default: 1 paisa for NPR, 1 cent for USD)
- Review donation amount calculation

**Callback not received:**

- Verify callback URLs are publicly accessible
- Check firewall rules allow provider IPs
- Ensure HTTPS is properly configured
- Test callback URLs manually

### Getting Help

1. Check provider-specific documentation (Khalti/eSewa guides)
2. Review server logs (check for error messages)
3. Verify environment variables are set correctly
4. Test in sandbox/staging environment
5. Contact provider support if issue persists
6. Contact Deesha Foundation technical team

This document should give future maintainers everything needed to understand, audit, and safely evolve the payment system without re-reading all of the implementation code. If you change any payment-related logic, please update this file accordingly.
