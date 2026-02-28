# DEESSA Foundation — Conference Module: Security Architecture

> **Version:** 1.0.0  
> **Last Updated:** February 28, 2026  
> **Audience:** Security Engineers, Compliance Officers, IT Auditors

---

## Table of Contents

1. [Security Overview](#1-security-overview)
2. [Authentication Architecture](#2-authentication-architecture)
3. [Authorization Model](#3-authorization-model)
4. [Data Security](#4-data-security)
5. [API Security](#5-api-security)
6. [Payment Security](#6-payment-security)
7. [Compliance & Standards](#7-compliance--standards)
8. [Security Best Practices](#8-security-best-practices)

---

## 1. Security Overview

### 1.1 Security Principles

This system follows these core security principles:

| Principle | Implementation |
|---|---|
| **Least Privilege** | Users only access their own data; admins only access necessary fields |
| **Defense in Depth** | Multiple layers: RLS, dual-key auth, rate limiting, HTTPS |
| **Data Minimization** | Collect only necessary PII; no credit card storage |
| **Encryption Everywhere** | TLS 1.3 in transit, AES-256 at rest (Supabase) |
| **Audit Trails** | All mutations logged with timestamps |
| **Separation of Concerns** | Payment handling delegated to PCI-compliant gateways |

### 1.2 Threat Model

**Protected Against**:

- ✅ SQL injection (parameterized queries + Supabase ORM)
- ✅ XSS (React auto-escaping + Content Security Policy)
- ✅ CSRF (SameSite cookies + token validation)
- ✅ Brute force (rate limiting)
- ✅ Unauthorized data access (RLS policies + dual-key auth)
- ✅ Man-in-the-middle (TLS 1.3)
- ✅ Payment data theft (no local storage, gateway-handled)

**Partial Protection**:

- ⚠️ DDoS (Vercel has some protection, but not enterprise-grade WAF)
- ⚠️ Webhook replay attacks (idempotency table prevents duplicate processing, but no timestamp check)

**NOT Protected Against** (out of scope):

- ❌ Physical access to Vercel/Supabase data centers (rely on vendor security)
- ❌ Compromised admin credentials (no 2FA currently, see improvements)
- ❌ Social engineering (user training required)

### 1.3 Security Responsibility Matrix

| Layer | Controller | Responsibility |
|---|---|---|
| **Infrastructure Security** | Vercel, Supabase | Physical security, network security, patching |
| **Application Security** | Development Partner | Code security, authentication, authorization |
| **Data Security** | DEESSA Foundation | Access control, data retention, backup |
| **Endpoint Security** | Stripe, Khalti, eSewa | Payment processing, PCI compliance, fraud detection |
| **User Security** | End Users | Strong passwords, email security, phishing awareness |

---

## 2. Authentication Architecture

### 2.1 Admin Authentication (Supabase Auth)

**Method**: Email + Password authentication

**Flow**:

```
┌────────────┐         ┌───────────────┐         ┌──────────────┐
│   Admin    │         │  Supabase Auth│         │  Next.js App │
│   User     │         │   Service     │         │   (Server)   │
└─────┬──────┘         └───────┬───────┘         └──────┬───────┘
      │                        │                        │
      ├─ POST /auth/signin ───>│                        │
      │  email, password        │                        │
      │                        │                        │
      │<─── JWT access_token ──┤                        │
      │     + refresh_token     │                        │
      │                        │                        │
      ├─ GET /admin/conference ──────────────────────>  │
      │  Cookie: sb-access-token│                        │
      │                        │                        │
      │                        │<─ Verify JWT ──────────┤
      │                        │   (check signature,     │
      │                        │    expiry, role)        │
      │                        │                        │
      │                        ├─ Valid ───────────────>│
      │                        │                        │
      │<── Admin Dashboard ────────────────────────────┤
      │                        │                        │
```

**Token Lifecycle**:

- **Access Token**: Valid for 1 hour, stored in HTTP-only cookie
- **Refresh Token**: Valid for 30 days, used to get new access token
- **Rotation**: Access token auto-refreshed when <10 min remaining

**Password Requirements** (Supabase default):

- Minimum 6 characters (WEAK - should be increased to 12+)
- No complexity requirements (IMPROVEMENT NEEDED)

**Session Management**:

```typescript
// Server-side session check (every admin page)
import { createServerClient } from '@/lib/supabase/server';

export default async function AdminPage() {
  const supabase = createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    redirect('/login'); // Not authenticated
  }
  
  // Render admin UI
}
```

### 2.2 Public API Authentication (Dual-Key)

**Method**: Registration ID + Email verification

**Why Not Traditional Auth**:

- Users don't create accounts (friction)
- Only need to access their OWN registration (not others')
- Dual-key provides sufficient security for low-risk operations

**Security Properties**:

| Property | Value |
|---|---|
| **Key Space** | UUID (128-bit) + email (variable) = ~340 undecillion combinations |
| **Brute Force Feasibility** | Infeasible (would take trillions of years) |
| **Enumeration Attack** | Mitigated by rate limiting (10 req/min) |
| **Guessing Attack** | Impossible (UUID v4 is cryptographically random) |

**Example Request**:

```bash
curl -X POST https://deessa.org/api/conference/status \
  -H "Content-Type: application/json" \
  -d '{
    "registrationId": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com"
  }'
```

**Server Validation**:

```typescript
const { registrationId, email } = await req.json();

// Query with BOTH parameters (AND condition)
const { data } = await supabase
  .from('conference_registrations')
  .select('*')
  .eq('id', registrationId)
  .eq('email', email)
  .single();

if (!data) {
  return new Response(JSON.stringify({ error: 'NOT_FOUND' }), {
    status: 404
  });
}

// Both matched → authorized
```

### 2.3 Cron Authentication

**Method**: Bearer Token (shared secret)

**Configuration**:

```env
CRON_SECRET=your-secure-random-string-here
```

**Request**:

```bash
curl -X GET https://deessa.org/api/cron/expire-conference-registrations \
  -H "Authorization: Bearer your-secure-random-string-here"
```

**Server Validation**:

```typescript
export async function GET(req: Request) {
  const authHeader = req.headers.get('Authorization');
  
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response(JSON.stringify({ error: 'UNAUTHORIZED' }), {
      status: 401
    });
  }
  
  // Authorized → run cron job
}
```

**Vercel Cron Auto-Authentication**:

- Vercel automatically adds `Authorization` header when invoking cron
- No manual configuration needed
- Secret stored in Vercel environment variables (encrypted at rest)

---

## 3. Authorization Model

### 3.1 Row-Level Security (RLS)

**What is RLS**:
PostgreSQL feature that restricts database rows visible to a query based on user role/session.

**DEESSA Implementation**:

```sql
-- Enable RLS on table
ALTER TABLE conference_registrations ENABLE ROW LEVEL SECURITY;

-- Policy: Public can insert (registration)
CREATE POLICY "Public can insert registrations"
ON conference_registrations FOR INSERT
TO anon
WITH CHECK (true);

-- Policy: Users can read ONLY their own registration (dual-key)
CREATE POLICY "Users can read own registration"
ON conference_registrations FOR SELECT
TO anon
USING (id = current_setting('app.registration_id')::uuid 
   AND email = current_setting('app.email'));

-- Policy: Admins can do anything (authenticated role)
CREATE POLICY "Admins have full access"
ON conference_registrations
TO authenticated
USING (true)
WITH CHECK (true);
```

**Why We BYPASS RLS** (using service-role key):

- RLS designed for user-scoped operations
- Our public APIs need to query by `id + email` (RLS can't express this easily)
- Service-role client bypasses RLS, but we validate dual-key in application code

**Security Trade-off**:

- ❌ **Lost**: Database-level enforcement (RLS would block invalid queries)
- ✅ **Gained**: Flexibility (can implement custom auth logic)
- ✅ **Mitigation**: Thorough application-level validation before database queries

### 3.2 Admin Role Authorization

**Admin Capabilities** (authenticated session required):

- View all registrations (no filtering)
- Update any registration status
- Delete registrations (if implemented)
- Export all data (CSV)
- Modify settings

**Role Assignment**:

- Manual: Supabase dashboard → Authentication → Users → Invite user
- No self-registration (closed system)
- Only DEESSA staff have accounts

**Permission Escalation Protection**:

- Public users CANNOT access admin endpoints (session check fails)
- Admin users CANNOT be created via public API (Supabase Auth signup disabled)

### 3.3 Service-Role Client Security

**What is it**:
Supabase client using `SUPABASE_SERVICE_ROLE_KEY` that bypasses RLS policies.

**Usage**:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // NEVER expose to client
  {
    auth: {
      persistSession: false, // No cookies
      autoRefreshToken: false
    }
  }
);
```

**Why SERVICE_ROLE_KEY Must Stay Secret**:

- Full database access (read + write + delete)
- Bypasses all RLS policies
- Can impersonate any user
- If leaked: Complete data breach

**Protection Mechanisms**:

- ✅ Stored in Vercel environment variables (encrypted)
- ✅ Never committed to Git (`.env.local` in `.gitignore`)
- ✅ Only used in server-side code (API routes, Server Components)
- ✅ Never sent to client (Next.js `NEXT_PUBLIC_` prefix not used)

**Verification** (that key is not exposed):

```bash
# Search codebase for accidental exposure
grep -r "SUPABASE_SERVICE_ROLE_KEY" app/
# Should ONLY appear in server-side files, never in client components
```

---

## 4. Data Security

### 4.1 Encryption

**At Rest** (Supabase):

- AES-256 encryption for all database files
- Managed by AWS RDS (Supabase uses AWS under the hood)
- Encryption keys rotated automatically (AWS KMS)

**In Transit**:

- TLS 1.3 for all HTTP connections
- Certificate: Let's Encrypt (auto-renewed by Vercel)
- HSTS enabled (forces HTTPS)

**Verification**:

```bash
# Check TLS version
curl -I https://deessa.org | grep -i "strict-transport"
# Should return: strict-transport-security: max-age=31536000

# Test TLS connection
openssl s_client -connect deessa.org:443 -tls1_3
# Should succeed (TLS 1.3 supported)
```

### 4.2 PII (Personally Identifiable Information)

**PII Fields Collected**:

| Field | Sensitivity | Encrypted at Rest | Access Control |
|---|---|---|---|
| **Full Name** | Medium | ✅ Yes (database-level) | Admins + User (dual-key) |
| **Email** | High | ✅ Yes | Admins + User (dual-key) |
| **Phone** | High | ✅ Yes | Admins + User (dual-key) |
| **Country** | Low | ✅ Yes | Admins + User (dual-key) |
| **Organization** | Low | ✅ Yes | Admins + User (dual-key) |
| **Dietary Restrictions** | Medium | ✅ Yes | Admins + User (dual-key) |

**NOT Collected** (by design):

- ❌ Credit card numbers (handled by payment gateways)
- ❌ Government IDs (not needed)
- ❌ Home address (only country collected)
- ❌ Date of birth (not needed)

**Data Retention**:

- **Active registrations**: Stored indefinitely (or until user requests deletion)
- **Cancelled registrations**: Retained 90 days for audit, then deleted
- **Logs**: Vercel logs retained 30 days, Supabase 7 days

**Right to Deletion** (GDPR):

- User can request data deletion via email
- Admin runs:

  ```sql
  DELETE FROM conference_registrations WHERE email = 'user@example.com';
  ```

- Permanent deletion (no soft delete)

### 4.3 Secrets Management

**Environment Variables Storage**:

| Secret | Stored Where | Access Control |
|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel (encrypted) | Team members only |
| `STRIPE_SECRET_KEY` | Vercel | Team members only |
| `GOOGLE_EMAIL_APP_PASSWORD` | Vercel | Team members only |
| `CRON_SECRET` | Vercel | Team members only |

**Access Audit**:

```bash
# View who accessed secrets (Vercel dashboard)
# Audit Log → Filter: "Environment Variables"
# Shows: Who, When, What changed
```

**Secret Rotation Procedure**:

1. Generate new secret in service dashboard (Stripe/Supabase/etc.)
2. Update Vercel environment variable
3. Redeploy application (Vercel auto-redeploys on env var change)
4. Verify new secret works
5. Revoke old secret in service dashboard
6. Document rotation in audit log

---

## 5. API Security

### 5.1 Rate Limiting

**Current Implementation**: In-memory map (per serverless function instance)

**Limits by Endpoint**:

| Endpoint | Limit | Window | Reasoning |
|---|---|---|---|
| `/api/conference/start-payment` | 10 req | 60s | High-cost operation (creates gateway session) |
| `/api/conference/confirm-stripe-session` | 10 req | 60s | Webhook verification, rare operation |
| `/api/conference/verify-registration` | 30 req | 60s | User may retry failed payment |
| `/api/conference/status` | 120 req | 60s | Called every 5s during polling (18 polls = 90s) |
| `/api/conference/resend-payment-link` | 5 req | 60s | Prevent spam, email is expensive |
| `/api/conference/webhooks/*` | Unlimited | - | Webhooks are authenticated (HMAC) |

**Rate Limit Response**:

```json
{
  "error": "RATE_LIMIT_EXCEEDED",
  "message": "Too many requests. Please try again in 60 seconds.",
  "retryAfter": 58
}
```

**Status Code**: `429 Too Many Requests`

**Limitation** (see [10: Improvements & Risks](10-improvements-risks.md)):

- In-memory rate limiting resets on cold start
- Ineffective for distributed serverless functions
- Recommended: Migrate to Redis (Upstash) for shared state

### 5.2 Input Validation

**Method**: Zod schema validation

**Example** (registration form):

```typescript
import { z } from 'zod';

const registrationSchema = z.object({
  fullName: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().regex(/^[+]?[0-9\s\-()]+$/),
  country: z.string().min(1),
  organization: z.string().max(200).optional(),
  attendanceMode: z.enum(['In-person', 'Virtual']),
  dietaryRestrictions: z.string().max(500).optional()
});

// Validate
const result = registrationSchema.safeParse(formData);
if (!result.success) {
  return { error: 'VALIDATION_ERROR', details: result.error.issues };
}
```

**Validation Rules**:

- **Email**: RFC 5322 compliant (checked by Zod)
- **Phone**: International format allowed (+ prefix optional)
- **Names**: 1-100 characters (no SQL keywords checked, safe with parameterized queries)
- **Text fields**: Max 500 characters (prevents large payloads)

**SQL Injection Prevention**:

- ✅ All queries use parameterized statements (Supabase ORM)
- ✅ No raw SQL with user input
- ✅ Example safe query:

  ```typescript
  supabase
    .from('conference_registrations')
    .select('*')
    .eq('email', userInput); // Supabase escapes `userInput`
  ```

### 5.3 CORS (Cross-Origin Resource Sharing)

**Configuration**:

```typescript
// next.config.mjs
module.exports = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: 'https://deessa.org' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' }
        ]
      }
    ];
  }
};
```

**Effect**: Only `https://deessa.org` can call APIs from browser (blocks 3rd-party sites)

---

## 6. Payment Security

### 6.1 PCI Compliance

**Who Handles Card Data**:

- ❌ DEESSA system does NOT store, process, or transmit card data
- ✅ Stripe, Khalti, eSewa handle all card data (PCI Level 1 certified)

**Compliance Status**:

| Entity | PCI DSS Level | Responsibility |
|---|---|---|
| **DEESSA Foundation** | SAQ A (simplest) | No card data handling |
| **Stripe** | Level 1 Service Provider | Card processing, storage, transmission |
| **Khalti** | Level 1 Service Provider | Card processing (via partner banks) |
| **eSewa** | Wallet provider | Wallet balance processing (no cards stored by DEESSA) |

**What DEESSA Stores** (payment-related):

- `payment_provider`: "stripe" / "khalti" / "esewa"
- `payment_id`: Gateway transaction ID (e.g., "cs_live_abc123")
- `payment_amount`: Final charged amount
- `payment_currency`: "USD" or "NPR"
- `payment_status`: "paid" / "unpaid" / "failed" / "review"

**NO CARD DATA** stored:

- ❌ Card number
- ❌ CVV
- ❌ Expiry date
- ❌ Cardholder name

### 6.2 Webhook Security (HMAC)

**Why Webhooks Need Security**:

- Anyone can POST to `/api/conference/webhooks/stripe`
- Must verify request actually came from Stripe (not attacker)

**HMAC Verification** (Stripe example):

```typescript
import Stripe from 'stripe';

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');
  
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature!,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return new Response('Unauthorized', { status: 401 });
  }
  
  // Signature valid → process event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    // Update database
  }
  
  return new Response('OK', { status: 200 });
}
```

**How HMAC Works**:

1. Stripe signs webhook payload with shared secret (`STRIPE_WEBHOOK_SECRET`)
2. Stripe sends payload + signature in `stripe-signature` header
3. Server recomputes signature using same secret + payload
4. If computed signature matches header signature → request is authentic

**Protection Against**:

- ✅ Spoofed webhooks (attacker can't sign without secret)
- ✅ Replay attacks (partially - idempotency table prevents duplicate processing)

**Khalti/eSewa**:

- ❌ NO webhook signature verification (they don't offer webhooks)
- ✅ Mitigation: Dual-path verification (polling + manual check in gateway dashboard)

### 6.3 Amount Verification

**Attack Scenario**:
User tampers with payment amount client-side:

1. Registration form shows "$20"
2. User intercepts POST request
3. Changes `amount: 20` to `amount: 1`
4. Pays $1 instead of $20

**Protection** (server-side recalculation):

```typescript
// Client sends:
{ registrationId: "...", paymentProvider: "stripe" }

// Server:
const registration = await fetchRegistration(registrationId);
const settings = await getSettings();

// Recalculate expected amount (DON'T trust client)
const expectedAmount = calculateAmount(
  registration.attendance_mode,
  settings.inPersonPriceUSD,
  settings.virtualPriceNPR
);

// Create payment session with SERVER amount (not client amount)
const session = await stripe.checkout.sessions.create({
  amount: expectedAmount.amount * 100, // Stripe uses cents
  currency: expectedAmount.currency
});
```

**Verification Flow**:

```
Client says: "Charge $1"
       ↓
Server ignores client amount
       ↓
Server calculates: attendanceMode="In-person" → $20
       ↓
Server creates Stripe session for $20
       ↓
User pays $20 (cannot pay $1)
```

**Webhook Verification**:

```typescript
// When webhook arrives:
const session = event.data.object; // Stripe session
const paidAmount = session.amount_total / 100; // Convert cents to dollars

// Fetch expected amount from database
const registration = await fetchRegistration(session.metadata.registrationId);
const expectedAmount = calculateAmount(...);

// Compare (with rounding tolerance)
if (Math.abs(paidAmount - expectedAmount.amount) > 0.01) {
  // Amount mismatch → Set payment_status = 'review'
  await updatePaymentStatus(registration.id, 'review');
  await notifyAdmin('Amount mismatch detected for ' + registration.id);
} else {
  // Amount correct → Confirm
  await confirmRegistration(registration.id);
}
```

---

## 7. Compliance & Standards

### 7.1 GDPR Compliance Checklist

**Article 13 (Right to be Informed)**:

- ✅ Privacy policy published at `/privacy`
- ✅ Registration form includes consent checkbox: "I agree to privacy policy"
- ✅ Users informed: data collected, purpose, retention, contact for questions

**Article 15 (Right of Access)**:

- ✅ Users can access their data via dual-key (registrationId + email)
- ✅ Admin can export user's data (CSV)

**Article 16 (Right to Rectification)**:

- ⚠️ PARTIALLY: Users must contact admin to update (no self-service edit)
- ✅ Admin can update registration details

**Article 17 (Right to Erasure)**:

- ✅ Users can request deletion via email
- ✅ Admin can delete registration:

  ```sql
  DELETE FROM conference_registrations WHERE email = 'user@example.com';
  ```

**Article 32 (Security of Processing)**:

- ✅ Encryption at rest (AES-256)
- ✅ Encryption in transit (TLS 1.3)
- ✅ Access control (RLS, dual-key, admin auth)
- ✅ Regular backups (daily)

**Article 33 (Breach Notification)**:

- ⚠️ Process documented but not tested
- ✅ Breach notification within 72 hours (manual process)

**Data Processing Agreement (DPA)**:

- ✅ Vercel DPA signed (for hosting)
- ✅ Supabase DPA signed (for database)
- ✅ Stripe DPA signed (for payments)

### 7.2 Accessibility (WCAG 2.1 AA)

**Current Status**: Partial compliance

**Keyboard Navigation**:

- ✅ All forms navigable with Tab
- ✅ Enter key submits forms
- ⚠️ Modal dialogs need Escape key support

**Screen Readers**:

- ⚠️ Missing ARIA labels on some buttons
- ⚠️ Form errors not announced (need aria-live)
- ✅ Semantic HTML used (`<button>`, `<form>`, `<label>`)

**Color Contrast**:

- ✅ Text meets 4.5:1 ratio (checked with WebAIM tool)
- ⚠️ Some status badges may fail for colorblind users (rely on color only)

**Recommended Improvements**:

```typescript
// Add ARIA labels
<button aria-label="Confirm registration for John Doe">
  Confirm
</button>

// Add live regions for errors
<div role="alert" aria-live="assertive">
  {errorMessage}
</div>

// Add skip links
<a href="#main-content" className="sr-only">
  Skip to main content
</a>
```

### 7.3 Audit Trails

**Logged Events**:

| Event | Data Logged | Retention |
|---|---|---|
| **Registration created** | Full registration data, timestamp | Indefinite |
| **Payment initiated** | Provider, amount, timestamp | Indefinite |
| **Payment completed** | Gateway transaction ID, amount, timestamp | Indefinite |
| **Admin action** | Admin email, action type, registration ID, timestamp | Indefinite |
| **Settings changed** | Old value, new value, timestamp | Via Git history |
| **Webhook received** | Event type, event ID, timestamp, payload hash | 7 days (payment_events table) |

**Audit Query Examples**:

```sql
-- Who confirmed this registration?
SELECT admin_email, created_at FROM audit_log
WHERE action = 'confirm' AND registration_id = '...';

-- When was payment received?
SELECT created_at, payment_id FROM conference_registrations
WHERE id = '...' AND payment_status = 'paid';

-- All actions by admin user
SELECT * FROM audit_log WHERE admin_email = 'admin@deessa.org'
ORDER BY created_at DESC;
```

**Current Limitation**:

- ⚠️ No dedicated `audit_log` table (actions logged via updated_at timestamps)
- ⚠️ Admin actions not explicitly logged (IMPROVEMENT NEEDED)

---

## 8. Security Best Practices

### 8.1 For Developers

**Code Review Checklist**:

- [ ] No secrets in code (use environment variables)
- [ ] All user input validated (Zod schemas)
- [ ] Database queries parameterized (no raw SQL)
- [ ] Authentication checked on all admin pages
- [ ] Service-role key never exposed to client
- [ ] Rate limiting on all public APIs
- [ ] HTTPS-only cookies (secure flag)
- [ ] Content Security Policy headers set

**Security Testing**:

```bash
# Test SQL injection
curl -X POST https://deessa.org/api/conference/status \
  -d '{"email":"'; DROP TABLE conference_registrations; --"}'
# Should return validation error (not execute SQL)

# Test XSS
curl -X POST https://deessa.org/api/conference/start-payment \
  -d '{"fullName":"<script>alert(1)</script>"}'
# Should be escaped in HTML (not execute script)

# Test rate limiting
for i in {1..20}; do
  curl https://deessa.org/api/conference/status -d '{"registrationId":"...","email":"..."}'
done
# Should return 429 after 10 requests
```

### 8.2 For Admins

**Account Security**:

- Use strong password (12+ characters, mixed case, numbers, symbols)
- Don't share credentials
- Log out after use (especially on shared computers)
- Report suspicious activity immediately

**Data Handling**:

- Don't export CSV to personal email (use secure file transfer)
- Delete CSV exports after use (contains PII)
- Don't share registration IDs publicly (they are sensitive)
- Verify user identity before sending custom email

### 8.3 For Operations

**Environment Variable Security**:

- Rotate secrets annually (or after breach)
- Never log secrets (check logs for accidental exposure)
- Use separate keys for staging vs production
- Document key rotation procedures

**Backup Security**:

- Encrypt backups (database exports)
- Store backups in different region (disaster recovery)
- Test restore procedure quarterly
- Limit backup access to ops team only

**Monitoring**:

```bash
# Alert on suspicious patterns
# - Multiple failed login attempts (brute force)
# - Unusual API traffic spikes (DDoS)
# - Database slow queries (SQL injection attempt)
# - Failed webhook verifications (attacker probing)
```

---

## Related Documentation

- **Previous**: [07: Admin Documentation](07-admin-documentation.md)
- **Next**: [09: Deployment & Operations](09-deployment-operations.md)
- **See Also**: [03: Database Schema](03-database-schema.md), [05: API Documentation](05-api-documentation.md)

---

**Document Maintained By**: Development Partner  
**Last Reviewed**: February 28, 2026  
**Next Review**: Quarterly or after security incident

---

## Appendix: Security Incident Response Plan

### Phase 1: Detection

- Monitoring alerts trigger (Vercel logs, Supabase metrics)
- User reports issue (suspicious email, unauthorized action)
- Routine audit discovers anomaly

### Phase 2: Containment

1. Identify affected systems (database, API, email)
2. Disable compromised accounts/keys immediately
3. Block suspicious IP addresses (Vercel firewall)
4. Preserve logs for forensics

### Phase 3: Eradication

1. Identify root cause (SQL injection, XSS, leaked key)
2. Apply security patch (code fix + redeploy)
3. Rotate all potentially compromised secrets
4. Verify vulnerability fixed (penetration testing)

### Phase 4: Recovery

1. Restore from last known good backup (if data corrupted)
2. Re-enable services
3. Monitor for 48 hours (ensure attack stopped)
4. Communicate with affected users

### Phase 5: Lessons Learned

1. Post-mortem document (what happened, why, how to prevent)
2. Update documentation (add to threat model)
3. Implement additional security controls
4. Train team on new procedures

**Contact**: Incident response should be led by development partner in coordination with DEESSA IT team.
