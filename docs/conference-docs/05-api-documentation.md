# DEESSA Foundation — Conference Module: API Reference

> **Version:** 1.0.0  
> **Last Updated:** February 28, 2026  
> **Audience:** Backend Developers, Integration Engineers, QA

---

## Table of Contents

1. [API Overview](#1-api-overview)
2. [Public APIs](#2-public-apis)
3. [Admin APIs](#3-admin-apis)
4. [Cron APIs](#4-cron-apis)
5. [Rate Limiting](#5-rate-limiting)
6. [Error Handling](#6-error-handling)

---

## 1. API Overview

### 1.1 Base URL

**Production**: `https://deessa.org`  
**Development**: `http://localhost:3000`

### 1.2 Authentication Methods

| API Type               | Auth Method            | Header/Param                          |
| ---------------------- | ---------------------- | ------------------------------------- |
| Public Conference APIs | Dual-key (rid + email) | Query params or body                  |
| Admin APIs             | Supabase Auth Session  | Cookie (automatic)                    |
| Cron Jobs              | Bearer Token           | `Authorization: Bearer {CRON_SECRET}` |
| Webhooks               | HMAC Signature         | Provider-specific headers             |

### 1.3 Response Format

**Success Response**:

```json
{
  "ok": true,
  "data": { ... },
  "message": "Optional success message"
}
```

**Error Response**:

```json
{
  "ok": false,
  "error": "Human-readable error message",
  "code": "ERROR_CODE_OPTIONAL"
}
```

---

## 2. Public APIs

### 2.1 POST /api/conference/start-payment

**Purpose**: Initiate payment session with chosen provider

**Authentication**: None (public) — dual-key verified in server action

**Rate Limit**: 10 requests per 60 seconds per IP

**Request Body**:

```json
{
  "registrationId": "uuid",
  "email": "user@example.com",
  "provider": "stripe" | "khalti" | "esewa"
}
```

**Validation**:

- `registrationId`: Non-empty string, must be valid UUID
- `email`: Must pass robust validation (RFC 5322-compatible regex or a dedicated email validation library such as validator.js). Acceptable format: local@domain with proper local part and domain, no bare `@` or multiple successive `@`. Recommended: use validator.js `isEmail()` or equivalent strict check.
- `provider`: Must be in `['stripe', 'khalti', 'esewa']`

**Success Response (Stripe/Khalti)**:

```json
{
  "ok": true,
  "redirectUrl": "https://checkout.stripe.com/c/pay/cs_live_...",
  "requiresFormSubmit": false
}
```

**Success Response (eSewa)**:

```json
{
  "ok": true,
  "redirectUrl": "https://esewa.com.np/epay/main",
  "formData": {
    "amount": "2500",
    "tax_amount": "0",
    "total_amount": "2500",
    "transaction_uuid": "uuid-v4",
    "product_code": "EPAYTEST",
    "product_service_charge": "0",
    "product_delivery_charge": "0",
    "success_url": "https://deessa.org/conference/register/payment-success?rid=...",
    "failure_url": "https://deessa.org/conference/register/failure?rid=...",
    "signed_field_names": "total_amount,transaction_uuid,product_code",
    "signature": "base64-encoded-hmac"
  },
  "requiresFormSubmit": true
}
```

**Error Responses**:

| Status | Error Message                                             | Scenario                      |
| ------ | --------------------------------------------------------- | ----------------------------- |
| 400    | "Registration ID and email are required"                  | Missing required fields       |
| 400    | "Invalid email format"                                    | Email doesn't contain @       |
| 400    | "Invalid payment provider"                                | Provider not recognized       |
| 404    | "Registration not found. Please check your ID and email." | Invalid rid+email combination |
| 400    | "Registration already confirmed"                          | Already paid/confirmed        |
| 400    | "Registration has been cancelled"                         | Admin cancelled               |
| 400    | "Registration has expired"                                | Past expiry window            |
| 500    | "Registration fee not configured"                         | Fee enabled but amount = 0    |
| 500    | "No payment methods available"                            | No providers configured       |

**Example cURL**:

```bash
curl -X POST https://deessa.org/api/conference/start-payment \
  -H "Content-Type: application/json" \
  -d '{
    "registrationId": "a1b2c3d4-...",
    "email": "user@example.com",
    "provider": "stripe"
  }'
```

---

### 2.2 POST /api/conference/confirm-stripe-session

**Purpose**: Verify Stripe payment directly after redirect (client-side verification)

**Authentication**: None (public) — session ID verified against DB

**Request Body**:

```json
{
  "rid": "uuid",
  "sessionId": "cs_live_..."
}
```

**Success Response (Confirmed)**:

```json
{
  "ok": true,
  "status": "confirmed",
  "message": "Payment verified successfully"
}
```

**Success Response (Already Confirmed - Idempotent)**:

```json
{
  "ok": true,
  "status": "confirmed",
  "alreadyConfirmed": true
}
```

**Success Response (Amount Mismatch - Review Needed)**:

```json
{
  "ok": true,
  "status": "review",
  "message": "Payment amount mismatch. Admin review required."
}
```

**Error Responses**:

| Status | Error                                         | Scenario                          |
| ------ | --------------------------------------------- | --------------------------------- |
| 400    | "Registration ID and session ID are required" | Missing params                    |
| 404    | "Registration not found"                      | Invalid rid                       |
| 403    | "Session ID mismatch"                         | sessionId doesn't match DB record |
| 400    | "Stripe session not found"                    | Session ID expired or invalid     |
| 500    | "Payment verification failed"                 | Stripe API error                  |

**Security**:

- `sessionId` must match `stripe_session_id` in database (prevents injection)
- Amount verified: `Math.round(payment_amount * 100) === session.amount_total`
- Currency mismatch is non-fatal (syncs to Stripe's currency)
- Uses Stripe SDK to retrieve session (not trusting client data)

**Example cURL**:

```bash
curl -X POST https://deessa.org/api/conference/confirm-stripe-session \
  -H "Content-Type: application/json" \
  -d '{
    "rid": "a1b2c3d4-...",
    "sessionId": "cs_live_abc123"
  }'
```

---

### 2.3 GET /api/conference/verify-registration

**Purpose**: Lookup registration for payment link page

**Authentication**: None (public) — dual-key verification

**Rate Limit**: 60 requests per 60 seconds per IP

**Query Parameters**:

- `rid` (required): Registration ID (UUID)
- `email` (required): Registrant email

**Success Response**:

```json
{
  "ok": true,
  "id": "a1b2c3d4-...",
  "status": "pending_payment",
  "paymentStatus": "unpaid",
  "paymentAmount": 2500,
  "paymentCurrency": "NPR",
  "expiresAt": "2026-03-01T12:00:00Z",
  "attendanceMode": "in-person",
  "fullName": "Jane Doe",
  "expiryHours": 24,
  "expired": false
}
```

**Field Notes**:

- `paymentAmount`: May be `null` if pre-dates fee config (resolved from current settings)
- `expired`: Computed from `status === 'expired'` OR `expires_at < now() AND payment_status !== 'paid'`

**Error Responses**:

| Status | Error                                                     | Scenario            |
| ------ | --------------------------------------------------------- | ------------------- |
| 400    | "Registration ID and email are required"                  | Missing params      |
| 400    | "Invalid registration ID format"                          | Not a valid UUID    |
| 404    | "Registration not found. Please check your ID and email." | Invalid combination |

**Example cURL**:

```bash
curl "https://deessa.org/api/conference/verify-registration?rid=a1b2c3d4&email=user@example.com"
```

---

### 2.4 GET /api/conference/status

**Purpose**: Lightweight status poll endpoint for payment-success page

**Authentication**: None (public) — by `rid` only (no email required post-payment)

**Query Parameters**:

- `rid` (required): Registration ID

**Success Response**:

```json
{
  "ok": true,
  "status": "confirmed",
  "paymentStatus": "paid",
  "fullName": "Jane Doe",
  "attendanceMode": "in-person",
  "expiresAt": null
}
```

**Security Note**: Only safe public fields returned (no email, phone, org, etc.)

**Error Responses**:

| Status | Error                         | Scenario          |
| ------ | ----------------------------- | ----------------- |
| 400    | "Registration ID is required" | Missing rid param |
| 404    | "Registration not found"      | Invalid rid       |

**Example cURL**:

```bash
curl "https://deessa.org/api/conference/status?rid=a1b2c3d4"
```

---

### 2.5 POST /api/conference/resend-payment-link

**Purpose**: Re-send payment link email to registrant

**Authentication**: None — security in server action (dual-key)

**Request Body**:

```json
{
  "registrationId": "uuid",
  "email": "user@example.com"
}
```

**Success Response**:

```json
{
  "ok": true,
  "message": "Payment link email sent successfully"
}
```

**Error Responses**:

| Status | Error                                    | Scenario           |
| ------ | ---------------------------------------- | ------------------ |
| 400    | "Registration ID and email are required" | Missing params     |
| 404    | "Registration not found"                 | Invalid rid+email  |
| 400    | "Payment already completed"              | Already paid       |
| 400    | "Registration expired"                   | Past expiry window |
| 500    | "Failed to send email"                   | SMTP error         |

**Note**: Email is sent to the stored DB email, not the email in request body (prevents email redirect attacks).

**Example cURL**:

```bash
curl -X POST https://deessa.org/api/conference/resend-payment-link \
  -H "Content-Type: application/json" \
  -d '{
    "registrationId": "a1b2c3d4-...",
    "email": "user@example.com"
  }'
```

---

## 3. Admin APIs

### 3.1 GET /api/admin/conference/export

**Purpose**: Export all registrations as CSV

**Authentication**: Required (Supabase Auth session)

**Query Parameters**: None

**Success Response**:

```
Content-Type: text/csv
Content-Disposition: attachment; filename="conference-registrations-2026-02-28.csv"

ID,Full Name,Email,Phone,Organization,Role,Attendance Mode,Status,Payment Status,Payment Amount,Payment Currency,Created At
a1b2c3d4-...,Jane Doe,jane@example.com,+9771234567890,ACME Corp,attendee,in-person,confirmed,paid,2500,NPR,2026-02-28T10:30:00Z
...
```

**Error Responses**:

| Status | Error           | Scenario        |
| ------ | --------------- | --------------- |
| 401    | "Unauthorized"  | No auth session |
| 500    | "Export failed" | Database error  |

**Example cURL**:

```bash
curl "https://deessa.org/api/admin/conference/export" \
  -H "Cookie: sb-access-token=..." \
  -o registrations.csv
```

---

## 4. Cron APIs

### 4.1 GET /api/cron/expire-conference-registrations

**Purpose**: Bulk-expire overdue unpaid registrations

**Authentication**: Bearer token (`CRON_SECRET`)

**Schedule**: Hourly (configured in vercel.json)

**Request Headers**:

```
Authorization: Bearer {CRON_SECRET}
```

**Success Response**:

```json
{
  "ok": true,
  "expired": 3,
  "timestamp": "2026-02-28T01:00:00Z"
}
```

**SQL Executed**:

```sql
UPDATE conference_registrations
SET status = 'expired', updated_at = now()
WHERE status IN ('pending_payment', 'pending')
  AND payment_status = 'unpaid'
  AND expires_at < now()
  AND expires_at IS NOT NULL
RETURNING id;
```

**Error Responses**:

| Status | Error                        | Scenario                       |
| ------ | ---------------------------- | ------------------------------ |
| 401    | "Unauthorized"               | Missing or invalid CRON_SECRET |
| 500    | "CRON_SECRET not configured" | Environment variable not set   |
| 500    | "Expiry job failed"          | Database error                 |

**Example cURL**:

```bash
curl "https://deessa.org/api/cron/expire-conference-registrations" \
  -H "Authorization: Bearer your-cron-secret-here"
```

**Vercel Cron Configuration** (vercel.json):

```json
{
  "crons": [
    {
      "path": "/api/cron/expire-conference-registrations",
      "schedule": "0 * * * *"
    }
  ]
}
```

---

## 5. Rate Limiting

### 5.1 Implementation

**Current**: In-memory Map-based (best-effort on serverless)

**File**: Inline in API route handlers

**Logic**:

```typescript
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (record.count >= limit) {
    return false; // Rate limit exceeded
  }

  record.count++;
  return true;
}
```

### 5.2 Rate Limits by Endpoint

| Endpoint                                 | Limit     | Window | IP-Based         |
| ---------------------------------------- | --------- | ------ | ---------------- |
| `/api/conference/start-payment`          | 10 req    | 60s    | Yes              |
| `/api/conference/verify-registration`    | 60 req    | 60s    | Yes              |
| `/api/conference/status`                 | 120 req   | 60s    | Yes              |
| `/api/conference/confirm-stripe-session` | 30 req    | 60s    | Yes              |
| `/api/conference/resend-payment-link`    | 5 req     | 60s    | Yes              |
| Admin APIs                               | Unlimited | -      | No               |
| Cron APIs                                | N/A       | -      | No (token-based) |

### 5.3 Rate Limit Error Response

```json
{
  "ok": false,
  "error": "Too many requests. Please try again later.",
  "retryAfter": 45
}
```

**HTTP Status**: `429 Too Many Requests`

**Headers**:

```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1709089260
Retry-After: 45
```

### 5.4 Production Recommendation

**Current limitation**: In-memory rate limiting resets on cold start (serverless)

**Recommended upgrade**: Upstash Redis + `@upstash/ratelimit`

**Example**:

```typescript
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "60 s"),
});

const { success } = await ratelimit.limit(ip);
if (!success)
  return Response.json({ error: "Rate limit exceeded" }, { status: 429 });
```

---

## 6. Error Handling

### 6.1 Error Response Schema

```typescript
interface ErrorResponse {
  ok: false;
  error: string; // Human-readable message
  code?: string; // Machine-readable code (optional)
  details?: any; // Additional debug info (dev only)
}
```

### 6.2 Standard Error Codes

| Code                  | HTTP Status | Meaning                           |
| --------------------- | ----------- | --------------------------------- |
| `VALIDATION_ERROR`    | 400         | Request body/params invalid       |
| `NOT_FOUND`           | 404         | Resource doesn't exist            |
| `UNAUTHORIZED`        | 401         | Missing or invalid auth           |
| `FORBIDDEN`           | 403         | Authenticated but not allowed     |
| `RATE_LIMIT_EXCEEDED` | 429         | Too many requests                 |
| `EXPIRED`             | 400         | Registration expired              |
| `ALREADY_CONFIRMED`   | 400         | Action not allowed (already done) |
| `PAYMENT_FAILED`      | 400         | Payment gateway declined          |
| `INTERNAL_ERROR`      | 500         | Unexpected server error           |
| `SERVICE_UNAVAILABLE` | 503         | External dependency down          |

### 6.3 Error Handling Pattern (API Routes)

```typescript
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validation
    if (!body.registrationId || !body.email) {
      return Response.json(
        { ok: false, error: "Registration ID and email are required" },
        { status: 400 },
      );
    }

    // Business logic
    const result = await someServerAction(body);

    if (!result.success) {
      return Response.json({ ok: false, error: result.error }, { status: 400 });
    }

    // Success
    return Response.json({ ok: true, data: result.data });
  } catch (error: any) {
    console.error("API error:", error);

    return Response.json(
      {
        ok: false,
        error: "An unexpected error occurred",
        ...(process.env.NODE_ENV === "development" && {
          details: error.message,
        }),
      },
      { status: 500 },
    );
  }
}
```

### 6.4 Client-Side Error Handling

**Recommended pattern**:

```typescript
async function callAPI() {
  try {
    const response = await fetch('/api/endpoint', { ... })
    const data = await response.json()

    if (!response.ok || !data.ok) {
      // API-level error (even if HTTP 200)
      throw new Error(data.error || 'Request failed')
    }

    return data

  } catch (error) {
    // Network error or API error
    console.error('API call failed:', error)
    toast.error(error instanceof Error ? error.message : 'Network error')
    throw error
  }
}
```

### 6.5 Logging & Monitoring

**Current**: Console logging only

**Recommended**: Sentry or similar error tracking

**Critical Events to Log**:

- Payment initiation failures
- Payment verification mismatches
- Email send failures
- Cron job execution (success/failure)
- Rate limit violations
- Database connection errors
- Webhook signature verification failures

**Example Structured Log**:

```json
{
  "timestamp": "2026-02-28T10:30:00Z",
  "level": "error",
  "service": "conference-api",
  "endpoint": "/api/conference/start-payment",
  "error": "Payment initiation failed",
  "registrationId": "a1b2c3d4-...",
  "provider": "stripe",
  "details": "Stripe API returned 400: amount must be positive",
  "ip": "192.168.1.1",
  "userAgent": "Mozilla/5.0 ..."
}
```

---

## 7. API Testing

### 7.1 Recommended Tools

- **Development**: Thunder Client (VS Code), Postman, or curl
- **Automated Testing**: Jest + Supertest
- **Load Testing**: k6 or Artillery

### 7.2 Test Scenarios

**Happy Path**:

1. Register → verify-registration → start-payment → confirm-stripe-session → status (confirmed)

**Error Paths**:

1. start-payment with expired registration → 400 error
2. confirm-stripe-session with wrong sessionId → 403 error
3. verify-registration with wrong email → 404 error
4. status polling after cancellation → status = "cancelled"

**Edge Cases**:

1. Duplicate webhook + direct verify (both should succeed due to idempotency)
2. Amount mismatch → status = "review"
3. Rate limit violation → 429 error
4. Payment after expiry → blocked

### 7.3 Example Test (Jest)\*\*

```typescript
describe("POST /api/conference/start-payment", () => {
  it("should initiate Stripe payment session", async () => {
    const response = await request(app)
      .post("/api/conference/start-payment")
      .send({
        registrationId: mockRegistrationId,
        email: "test@example.com",
        provider: "stripe",
      });

    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
    expect(response.body.redirectUrl).toContain("stripe.com");
  });

  it("should reject expired registration", async () => {
    // Mock expired registration
    const response = await request(app)
      .post("/api/conference/start-payment")
      .send({
        registrationId: expiredRegistrationId,
        email: "test@example.com",
        provider: "stripe",
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain("expired");
  });
});
```

---

## Related Documentation

- **Previous**: [04: Page Documentation](04-page-documentation.md)
- **Next**: [06: Payment Flows](06-payment-flows.md)
- **See Also**: [08: Security](08-security.md), [09: Deployment](09-deployment-operations.md)

---

**Document Maintained By**: Development Partner  
**Last Reviewed**: February 28, 2026
