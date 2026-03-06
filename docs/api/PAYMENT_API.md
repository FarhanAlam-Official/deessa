# Payment Architecture V2 - API Documentation

## Overview

This document provides comprehensive API documentation for the Payment Architecture V2 system, including the PaymentService, provider adapters, and webhook endpoints.

## Table of Contents

- [PaymentService API](#paymentservice-api)
- [Provider Adapter Interface](#provider-adapter-interface)
- [Webhook Endpoints](#webhook-endpoints)
- [Status Endpoints](#status-endpoints)
- [Receipt Endpoints](#receipt-endpoints)
- [Admin Endpoints](#admin-endpoints)
- [Error Handling](#error-handling)
- [Type Definitions](#type-definitions)

---

## PaymentService API

### `PaymentService.confirmDonation()`

Core method for confirming payment transactions with transactional integrity.

#### Signature

```typescript
async confirmDonation(
  input: ConfirmDonationInput
): Promise<ConfirmDonationResult>
```

#### Parameters

**`input: ConfirmDonationInput`**

```typescript
interface ConfirmDonationInput {
  donationId: string          // UUID of the donation to confirm
  provider: PaymentProvider   // 'stripe' | 'khalti' | 'esewa'
  verificationResult: VerificationResult  // Result from provider adapter
  eventId?: string           // Optional event ID for idempotency
}
```

**`verificationResult: VerificationResult`**

```typescript
interface VerificationResult {
  success: boolean           // Whether verification succeeded
  donationId: string        // Donation ID from provider payload
  transactionId: string     // Provider transaction identifier
  amount: number            // Verified amount (major units)
  currency: string          // Verified currency code
  status: ProviderPaymentStatus  // 'paid' | 'pending' | 'failed'
  metadata: Record<string, unknown>  // Provider-specific metadata
  error?: string            // Error message if verification failed
}
```

#### Returns

**`Promise<ConfirmDonationResult>`**

```typescript
interface ConfirmDonationResult {
  success: boolean          // Whether confirmation succeeded
  status: 'confirmed' | 'review' | 'failed' | 'already_processed'
  donation?: {
    id: string
    payment_status: DonationStatus
    amount: number
    currency: string
    provider?: PaymentProvider
    provider_ref?: string
    confirmed_at?: Date
  }
  error?: string           // Error message if confirmation failed
  metadata?: {
    reviewReason?: 'amount_mismatch' | 'currency_mismatch' | 'verification_uncertain'
    mismatchDetails?: {
      expectedAmount?: number
      actualAmount?: number
      expectedCurrency?: string
      actualCurrency?: string
    }
  }
}
```

#### Behavior

1. **Fetches and locks donation row** using `SELECT FOR UPDATE`
2. **Validates current state** - must be PENDING to confirm
3. **Checks idempotency** - returns `already_processed` if event already handled
4. **Verifies amount and currency** - transitions to REVIEW if mismatch
5. **Updates donation status** atomically with conditional WHERE clause
6. **Inserts payment record** with verification details
7. **Inserts payment event** for idempotency tracking
8. **Triggers post-payment processing** (receipt generation, email)
9. **Sends admin alert** if status is REVIEW

#### State Transitions

- `PENDING → CONFIRMED` - Payment verified successfully
- `PENDING → REVIEW` - Amount or currency mismatch
- `PENDING → FAILED` - Verification failed
- `CONFIRMED → CONFIRMED` - Returns `already_processed`
- `FAILED → FAILED` - Returns `already_processed`

#### Error Handling

Throws `PaymentError` subclasses:
- `StateTransitionError` - Invalid state transition
- `TransactionError` - Database transaction failed
- `VerificationError` - Provider verification failed

#### Example Usage

```typescript
import { getPaymentService } from '@/lib/payments/core/PaymentService'
import { StripeAdapter } from '@/lib/payments/adapters/StripeAdapter'

// Verify payment with provider adapter
const adapter = new StripeAdapter()
const verificationResult = await adapter.verify(webhookPayload, context)

// Confirm donation
const paymentService = getPaymentService()
const result = await paymentService.confirmDonation({
  donationId: verificationResult.donationId,
  provider: 'stripe',
  verificationResult,
  eventId: stripeEvent.id
})

if (result.success) {
  if (result.status === 'confirmed') {
    console.log('Payment confirmed successfully')
  } else if (result.status === 'review') {
    console.log('Payment requires manual review:', result.metadata?.reviewReason)
  } else if (result.status === 'already_processed') {
    console.log('Payment already processed (idempotent)')
  }
} else {
  console.error('Payment confirmation failed:', result.error)
}
```

---

## Provider Adapter Interface

All provider adapters implement the `ProviderAdapter` interface.

### `ProviderAdapter.verify()`

Verifies payment from provider webhook/callback.

#### Signature

```typescript
async verify(
  payload: unknown,
  context?: VerificationContext
): Promise<VerificationResult>
```

#### Parameters

**`payload: unknown`**
- Raw webhook/callback payload from provider
- Can be string (raw body) or parsed object

**`context?: VerificationContext`**

```typescript
interface VerificationContext {
  headers?: Record<string, string | string[] | undefined>
  query?: Record<string, string | string[] | undefined>
  rawBody?: string
  mode?: 'live' | 'mock'
}
```

#### Returns

`Promise<VerificationResult>` - See PaymentService documentation above

#### Provider-Specific Behavior

**Stripe:**
- Verifies webhook signature using Stripe SDK
- Supports `checkout.session.completed` and `invoice.payment_succeeded` events
- Converts amount from cents to dollars
- Extracts donation ID from `client_reference_id` or `metadata.donation_id`

**Khalti:**
- Performs server-side transaction lookup via Khalti API
- Verifies transaction status is `Completed`
- Converts amount from paisa to NPR
- Extracts donation ID from `purchase_order_id`

**eSewa:**
- Verifies HMAC-SHA256 signature (timing-safe comparison)
- Performs server-side transaction status lookup
- Parses base64-encoded callback data
- Extracts donation ID from `transaction_uuid`

### `ProviderAdapter.extractMetadata()`

Extracts metadata from provider payload for logging.

#### Signature

```typescript
extractMetadata(payload: unknown): PaymentMetadata
```

### `ProviderAdapter.normalizePayload()`

Normalizes provider payload to common format.

#### Signature

```typescript
normalizePayload(payload: unknown): NormalizedPayment
```

### `ProviderAdapter.lookupTransaction()`

Looks up transaction status for reconciliation.

#### Signature

```typescript
async lookupTransaction(
  transactionId: string,
  donationId: string
): Promise<VerificationResult>
```

---

## Webhook Endpoints

### POST `/api/webhooks/stripe`

Handles Stripe webhook events.

#### Headers

- `stripe-signature` (required) - Stripe webhook signature

#### Request Body

Raw Stripe event JSON

#### Response

**Success (200 OK):**
```json
{
  "received": true
}
```

**Error (400 Bad Request):**
```json
{
  "error": "Invalid signature"
}
```

**Error (500 Internal Server Error):**
```json
{
  "error": "Internal server error"
}
```

#### Supported Events

- `checkout.session.completed` - One-time payment completed
- `invoice.payment_succeeded` - Subscription payment succeeded

### POST `/api/webhooks/khalti`

Handles Khalti webhook events (if implemented).

#### Headers

- `Authorization` (required) - Khalti webhook signature

#### Request Body

```json
{
  "pidx": "string",
  "total_amount": 100000,
  "status": "Completed",
  "transaction_id": "string",
  "purchase_order_id": "donation-uuid",
  "purchase_order_name": "string",
  "fee": 1000,
  "refunded": false
}
```

#### Response

Same as Stripe webhook

### GET `/api/payments/esewa/success`

Handles eSewa success callback.

#### Query Parameters

- `data` (required) - Base64-encoded callback data

**Decoded data structure:**
```json
{
  "transaction_code": "string",
  "status": "COMPLETE",
  "total_amount": 1000,
  "transaction_uuid": "timestamp-donation-uuid",
  "product_code": "MERCHANT_ID",
  "signed_field_names": "total_amount,transaction_uuid,product_code",
  "signature": "base64-hmac-signature"
}
```

#### Response

**Success:**
Redirects to `/donate/success?donation_id={id}&status=confirmed`

**Error:**
Redirects to `/donate/success?donation_id={id}&status=failed&error={message}`

### GET `/api/payments/esewa/failure`

Handles eSewa failure callback.

#### Query Parameters

Same as success callback

#### Response

Redirects to `/donate/success?donation_id={id}&status=failed`

---

## Status Endpoints

Read-only endpoints for checking payment status.

### GET `/api/payments/stripe/status`

Checks Stripe payment status.

#### Query Parameters

- `session_id` (required) - Stripe session ID

#### Response

```json
{
  "status": "confirmed" | "pending" | "failed",
  "donation": {
    "id": "uuid",
    "amount": 100,
    "currency": "USD",
    "payment_status": "confirmed",
    "receipt_number": "RCP-2024-0001",
    "receipt_url": "https://..."
  }
}
```

### GET `/api/payments/khalti/status`

Checks Khalti payment status.

#### Query Parameters

- `pidx` (required) - Khalti payment identifier

#### Response

Same as Stripe status endpoint

### GET `/api/payments/esewa/status`

Checks eSewa payment status.

#### Query Parameters

- `transaction_uuid` (required) - eSewa transaction UUID

#### Response

Same as Stripe status endpoint

---

## Receipt Endpoints

### GET `/api/receipts/download`

Downloads receipt PDF.

#### Query Parameters

- `token` (required) - JWT token for authentication
- `format` (optional) - `pdf` (default) or `html`

#### Response

**Success (200 OK):**
- Content-Type: `application/pdf` or `text/html`
- Content-Disposition: `attachment; filename="receipt-{number}.pdf"`
- Body: Receipt PDF or HTML

**Error (401 Unauthorized):**
```json
{
  "error": "Invalid or expired token"
}
```

**Error (404 Not Found):**
```json
{
  "error": "Receipt not found"
}
```

**Error (429 Too Many Requests):**
```json
{
  "error": "Rate limit exceeded",
  "retryAfter": 60
}
```

### POST `/api/receipts/resend`

Resends receipt email.

#### Authentication

Requires valid session or API key.

#### Request Body

```json
{
  "donationId": "uuid",
  "email": "donor@example.com"
}
```

#### Response

**Success (200 OK):**
```json
{
  "success": true,
  "message": "Receipt email sent successfully"
}
```

**Error (401 Unauthorized):**
```json
{
  "error": "Authentication required"
}
```

**Error (403 Forbidden):**
```json
{
  "error": "Email does not match donation"
}
```

**Error (429 Too Many Requests):**
```json
{
  "error": "Rate limit exceeded",
  "retryAfter": 60
}
```

---

## Admin Endpoints

### GET `/admin/donations/review`

Lists donations requiring manual review.

#### Authentication

Requires admin role.

#### Response

```json
{
  "donations": [
    {
      "id": "uuid",
      "donor_name": "John Doe",
      "donor_email": "john@example.com",
      "amount": 100,
      "currency": "USD",
      "payment_status": "review",
      "provider": "stripe",
      "provider_ref": "ch_123",
      "created_at": "2024-01-01T00:00:00Z",
      "review_reason": "amount_mismatch",
      "expected_amount": 100,
      "actual_amount": 150
    }
  ]
}
```

### POST `/admin/donations/review`

Approves or rejects donation in review.

#### Authentication

Requires admin role.

#### Request Body

```json
{
  "donationId": "uuid",
  "action": "approve" | "reject",
  "notes": "string"
}
```

#### Response

**Success (200 OK):**
```json
{
  "success": true,
  "status": "confirmed" | "failed"
}
```

---

## Error Handling

### Error Response Format

All API endpoints return errors in consistent format:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INVALID_SIGNATURE` | 401 | Webhook signature verification failed |
| `INVALID_TOKEN` | 401 | Receipt token invalid or expired |
| `AUTHENTICATION_REQUIRED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INVALID_STATE_TRANSITION` | 400 | Invalid donation state transition |
| `AMOUNT_MISMATCH` | 400 | Payment amount does not match |
| `CURRENCY_MISMATCH` | 400 | Payment currency does not match |
| `TRANSACTION_FAILED` | 500 | Database transaction failed |
| `PROVIDER_API_ERROR` | 502 | Provider API error |
| `INTERNAL_ERROR` | 500 | Internal server error |

---

## Type Definitions

### DonationStatus

```typescript
type DonationStatus = 
  | 'initiated'   // Donation created, payment not started
  | 'pending'     // Payment initiated, awaiting confirmation
  | 'confirmed'   // Payment verified and confirmed
  | 'review'      // Requires manual review
  | 'failed'      // Payment failed
  | 'refunded'    // Payment refunded
```

### PaymentProvider

```typescript
type PaymentProvider = 'stripe' | 'khalti' | 'esewa'
```

### ProviderPaymentStatus

```typescript
type ProviderPaymentStatus = 'paid' | 'pending' | 'failed'
```

### PaymentMode

```typescript
type PaymentMode = 'live' | 'mock'
```

---

## Rate Limiting

All public endpoints are rate-limited:

- **Receipt Download:** 10 requests per minute per IP
- **Receipt Resend:** 5 requests per minute per user
- **Payment Verification:** 20 requests per minute per IP
- **Status Endpoints:** 30 requests per minute per IP

Rate limit headers:
- `X-RateLimit-Limit` - Maximum requests allowed
- `X-RateLimit-Remaining` - Requests remaining
- `X-RateLimit-Reset` - Unix timestamp when limit resets
- `Retry-After` - Seconds to wait (on 429 response)

---

## Security

### Webhook Security

- **Stripe:** Signature verification using `stripe-signature` header
- **Khalti:** API key authentication (if webhook implemented)
- **eSewa:** HMAC-SHA256 signature verification with timing-safe comparison

### Receipt Security

- **Token-based authentication:** JWT tokens with 7-day expiry
- **No sequential access:** Cannot enumerate receipts by number
- **Rate limiting:** Prevents brute force attacks

### Admin Security

- **Session-based authentication:** Secure HTTP-only cookies
- **Role-based authorization:** Admin role required
- **CSRF protection:** CSRF tokens for state-changing operations
- **Audit logging:** All admin actions logged

---

## Best Practices

### Webhook Handling

1. **Always verify signatures** - Never skip signature verification in production
2. **Return 200 quickly** - Respond within 2 seconds to prevent retries
3. **Use idempotency** - Check event_id before processing
4. **Handle retries** - Providers retry failed webhooks for up to 3 days

### Error Handling

1. **Return 200 for duplicate events** - Prevent unnecessary retries
2. **Return 500 for transient errors** - Allow provider to retry
3. **Return 400 for permanent errors** - Prevent retry loops
4. **Log all errors** - Include full context for debugging

### Testing

1. **Use mock mode in development** - Set `PAYMENT_MODE=mock`
2. **Test with real webhooks** - Use provider test mode
3. **Test idempotency** - Send duplicate events
4. **Test error scenarios** - Invalid signatures, amount mismatches

---

## Support

For questions or issues:
- Review the [Design Document](../.kiro/specs/payment-architecture-v2/design.md)
- Check the [Operations Runbook](../operations/RUNBOOK.md)
- Contact the development team

---

**Last Updated:** 2024-01-01
**Version:** 2.0.0
