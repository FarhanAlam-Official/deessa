# DEESSA Foundation — Conference Module: Technical Overview

> **Version:** 1.0.0  
> **Last Updated:** February 28, 2026  
> **Document Type:** Technical Overview  
> **Audience:** Developers, Technical Architects, Code Reviewers

---

## 1. Document Scope & Purpose

### 1.1 Scope

This document covers all files that directly or indirectly affect the Conference feature as of the February 2026 codebase snapshot.

**In Scope:**

- Conference registration end-to-end workflow
- Multi-provider payment integration (Stripe, Khalti, eSewa)
- Admin conference management interface
- Email notification system
- Automatic expiry cron job
- Conference settings management

**Out of Scope:**

- Donation system (separate module)
- Volunteer management (separate module)
- Organization-wide authentication (shared infrastructure)
- Global payment webhook handlers (shared with donation module, but behavior documented)

### 1.2 Purpose

This documentation serves multiple audiences:

| Audience              | Use Case                                              |
| --------------------- | ----------------------------------------------------- |
| **New Developers**    | Onboarding and understanding system architecture      |
| **Code Reviewers**    | Conducting security and quality audits                |
| **System Architects** | Evaluating scalability and integration patterns       |
| **DevOps Engineers**  | Understanding deployment and operational requirements |
| **QA Engineers**      | Designing test scenarios and edge case validation     |
| **Product Owners**    | Understanding technical constraints and capabilities  |

### 1.3 Documentation Structure

This documentation set is divided into 12 files:

| File                          | Focus                                           | Audience                                  |
| ----------------------------- | ----------------------------------------------- | ----------------------------------------- |
| `00-executive-summary.md`     | Non-technical overview                          | Directors, program managers, stakeholders |
| `01-overview.md`              | **This file** - Technical scope and stack       | All technical readers                     |
| `02-architecture.md`          | System topology, components, data flow          | Architects, senior developers             |
| `03-database-schema.md`       | Tables, relationships, indexes, migrations      | Backend developers, DBAs                  |
| `04-page-documentation.md`    | Frontend pages and components                   | Frontend developers                       |
| `05-api-documentation.md`     | API endpoints, request/response specs           | Backend developers, integrators           |
| `06-payment-flows.md`         | Payment state machines and provider integration | Payment engineers, QA                     |
| `07-admin-documentation.md`   | Admin interface and workflows                   | Full-stack developers, support staff      |
| `08-security.md`              | Authentication, authorization, data protection  | Security engineers, auditors              |
| `09-deployment-operations.md` | Environment variables, deployment, runbooks     | DevOps, SRE, operations                   |
| `10-improvements-risks.md`    | Known limitations, technical debt, roadmap      | Product managers, architects              |
| `11-appendix.md`              | File inventory, glossary, changelog             | All audiences                             |

---

## 2. Technology Stack

### 2.1 Core Framework

| Layer               | Technology | Version         | Rationale                                                         |
| ------------------- | ---------- | --------------- | ----------------------------------------------------------------- |
| **Framework**       | Next.js    | 14 (App Router) | Modern React framework with SSR, API routes, and optimal bundling |
| **Language**        | TypeScript | 5.x             | Type safety, improved IDE support, reduced runtime errors         |
| **Runtime**         | Node.js    | 18+             | Long-term support, serverless compatibility                       |
| **Package Manager** | pnpm       | Latest          | Faster installs, efficient disk usage, strict dependencies        |

### 2.2 Backend Services

| Service             | Technology               | Purpose                                             |
| ------------------- | ------------------------ | --------------------------------------------------- |
| **Database**        | Supabase (PostgreSQL 15) | Primary data store with real-time capabilities      |
| **Authentication**  | Supabase Auth            | Admin authentication (public pages unauthenticated) |
| **Email**           | Nodemailer + Gmail SMTP  | Transactional email delivery                        |
| **Cron Scheduling** | Vercel Cron Jobs         | Time-based task automation                          |
| **File Storage**    | Supabase Storage         | Future-ready for PDF receipts, attachments          |

### 2.3 Payment Providers

| Provider   | Region | Currency                     | Use Case                                          |
| ---------- | ------ | ---------------------------- | ------------------------------------------------- |
| **Stripe** | Global | USD, EUR, NPR (configurable) | International credit/debit cards, digital wallets |
| **Khalti** | Nepal  | NPR only                     | Nepali banks, mobile wallets, local cards         |
| **eSewa**  | Nepal  | NPR only                     | Nepali digital wallet (very popular domestically) |

**Key Characteristics:**

- All providers use redirect-based flows (user leaves site, returns after payment)
- All providers support webhooks for asynchronous payment confirmation
- All providers use HMAC or signature verification for security

### 2.4 Frontend

| Layer                | Technology               | Rationale                                                 |
| -------------------- | ------------------------ | --------------------------------------------------------- |
| **UI Library**       | React 18                 | Virtual DOM, component reusability, ecosystem             |
| **Styling**          | Tailwind CSS             | Utility-first, small bundle size, consistency             |
| **UI Components**    | Shadcn/ui                | Accessible, customizable, Radix UI primitives             |
| **Forms**            | React Hook Form          | Performance, minimal re-renders, built-in validation      |
| **State Management** | React Context + useState | Sufficient for form wizard state (no global state needed) |
| **Icons**            | Lucide React             | Consistent icon set, tree-shakeable                       |

### 2.5 Hosting & Infrastructure

| Component               | Provider   | Tier              | Key Features                                                  |
| ----------------------- | ---------- | ----------------- | ------------------------------------------------------------- |
| **Application Hosting** | Vercel     | Pro (recommended) | Edge network, auto-scaling, zero-config deployment            |
| **Database Hosting**    | Supabase   | Pro (recommended) | Automatic backups, point-in-time recovery, connection pooling |
| **Email Relay**         | Gmail SMTP | Google Workspace  | 2000 emails/day limit, enterprise-grade delivery              |
| **Domain & SSL**        | Vercel     | Included          | Automatic SSL, custom domain support                          |

**Cost Profile:**

- **Development**: Free (Vercel Hobby + Supabase Free tier)
- **Production**: ~$20-70/month (Vercel Pro $20 + Supabase Pro $25 + payment fees)

---

## 3. Feature Summary

### 3.1 Public Features (No Authentication Required)

| Feature                     | Description                                 | Entry Point                            |
| --------------------------- | ------------------------------------------- | -------------------------------------- |
| **Conference Landing Page** | Marketing page with dynamic content from DB | `/conference`                          |
| **Registration Form**       | 4-step wizard collecting attendee data      | `/conference/register`                 |
| **Payment Options**         | Pay Now vs. Pay Later decision page         | `/conference/register/payment-options` |
| **Payment Processing**      | Multi-gateway payment initiation            | `/conference/register/pending-payment` |
| **Payment Verification**    | Post-payment status confirmation            | `/conference/register/payment-success` |
| **Success Confirmation**    | Registration complete (free events)         | `/conference/register/success`         |

### 3.2 Admin Features (Authentication Required)

| Feature                    | Description                              | Entry Point                    |
| -------------------------- | ---------------------------------------- | ------------------------------ |
| **Registration Dashboard** | Statistics and full registration list    | `/admin/conference`            |
| **Registration Detail**    | Full PII view + admin actions            | `/admin/conference/[id]`       |
| **Conference Settings**    | Configure event details, pricing, emails | `/admin/conference/settings`   |
| **CSV Export**             | Download all registration data           | `/api/admin/conference/export` |

### 3.3 Automated Processes

| Process                | Trigger                              | Implementation                                  |
| ---------------------- | ------------------------------------ | ----------------------------------------------- |
| **Registration Email** | On form submit                       | Inline function call in server action           |
| **Payment Link Email** | On pending_payment creation          | Inline function call in server action           |
| **Confirmation Email** | On payment verified OR admin confirm | Inline function call after status update        |
| **Cancellation Email** | On admin cancel                      | Inline function call in cancel action           |
| **Expiry Cron**        | Hourly (Vercel Cron)                 | `GET /api/cron/expire-conference-registrations` |

---

## 4. System Characteristics

### 4.1 Architecture Pattern

**Pattern**: Monolithic Next.js application with server-side rendering and API routes

**Rationale**:

- Simplicity - Single deployment unit
- Performance - Co-located frontend and backend
- Developer Experience - Shared types between client and server
- Cost Efficiency - Single hosting bill

**Not a Microservices Architecture Because**:

- Scale requirements don't justify distributed complexity
- Feature domain is cohesive (conference management)
- Team size is small (<5 developers)

### 4.2 Rendering Strategy

| Page Type               | Rendering Mode              | Rationale                                     |
| ----------------------- | --------------------------- | --------------------------------------------- |
| Conference landing page | Server-Side Rendering (SSR) | SEO-critical, content changes frequently      |
| Registration form       | Client-Side Rendering (CSR) | Interactive wizard with complex state         |
| Admin pages             | Server-Side Rendering (SSR) | Real-time data, no client-side caching needed |
| Payment pages           | Client-Side Rendering (CSR) | External redirects, polling logic             |

### 4.3 Data Access Pattern

**Server Actions** (preferred for mutations):

```typescript
"use server";
export async function registerForConference(data: FormData) {
  // Direct DB access, no API route needed
}
```

**API Routes** (used for):

- Payment initiation (requires external redirects)
- Webhook receivers (called by external services)
- Cron jobs (called by Vercel infrastructure)
- CSV export (direct download response)

**Why Both?**

- Server Actions: Better DX, type safety, no duplicate validation
- API Routes: Required for webhooks, cron, and binary responses

### 4.4 Security Model

| Layer                    | Mechanism                                                            |
| ------------------------ | -------------------------------------------------------------------- |
| **Admin Access**         | Supabase Auth session (cookie-based, server-side verified)           |
| **Public API Endpoints** | Dual-key verification (registrationId + email)                       |
| **Database**             | Row-Level Security (RLS) policies + service-role bypass where needed |
| **Payment Webhooks**     | HMAC signature verification (provider-specific)                      |
| **Cron Endpoints**       | Bearer token (`CRON_SECRET`)                                         |

**Note**: Public conference pages are **intentionally unauthenticated** - registrants do not create user accounts. Identity is managed via registration ID + email pairs.

### 4.5 Email Delivery Model

**SMTP Configuration**:

```
Host: smtp.gmail.com
Port: 587 (STARTTLS)
Auth: GOOGLE_EMAIL + GOOGLE_EMAIL_APP_PASSWORD
```

**Email Types**:

1. Registration Received (always sent)
2. Payment Link (sent if fee > 0)
3. Confirmation (sent on payment verified or admin confirm)
4. Cancellation (sent on admin cancel)
5. Custom Admin Email (sent via admin quick action)

**Failure Handling**:

- Email sends are **non-blocking** (`.catch()` used)
- Email failures are logged to the application logs (server console and Vercel dashboard); no centralized log sink (e.g., ELK) is currently configured
- Monitoring/alerting for email failures is planned but not yet implemented; no integration with PagerDuty, CloudWatch, or Sentry as of February 2026
- When email failures are detected (via logs or admin report), admins should manually resend emails using the dashboard's "Resend" button on the affected registration; no automated notification is sent to admins, so regular log review is recommended
- SLA: Admins are expected to review logs and address email failures within 24 hours during active registration periods

**Rate Limits**:

- Gmail SMTP: 2000 emails/day (Google Workspace limit)
- Sufficient for conferences with <1000 attendees per day

---

## 5. Data Flow Summary

### 5.1 Registration Flow (High-Level)

```
User visits /conference
    └─▶ Fetches conference_settings from DB (SSR)

User submits registration form
    └─▶ Calls registerForConference() server action
        └─▶ Inserts row in conference_registrations table
        └─▶ Sends registration email (non-blocking)
        └─▶ Returns { success, paymentRequired, registrationId }

If paymentRequired:
    └─▶ Redirects to /payment-options with query params

User clicks "Pay Now"
    └─▶ Redirects to /pending-payment

User selects payment provider
    └─▶ POST /api/conference/start-payment
        └─▶ Calls startConferencePayment() server action
            └─▶ Creates Stripe/Khalti/eSewa session
            └─▶ Updates registration with provider refs
            └─▶ Returns { redirectUrl, formData }
        └─▶ Browser redirects to gateway URL

User completes payment at gateway
    └─▶ Gateway redirects back to /payment-success

/payment-success page confirms payment
    └─▶ Direct verify (POST /api/conference/confirm-stripe-session)
    └─▶ Polls status (GET /api/conference/status?rid=...)
        └─▶ Returns { status, paymentStatus, ... }

Webhook fires in parallel (production reliability)
    └─▶ POST /api/webhooks/stripe (or Khalti webhook)
        └─▶ Verifies signature
        └─▶ Idempotency check via payment_events table
        └─▶ Updates conference_registrations
        └─▶ Sends confirmation email
```

### 5.2 Admin Confirmation Flow (High-Level)

```
Admin opens /admin/conference/[id]
    └─▶ Fetches registration via getConferenceRegistration(id)
    └─▶ Displays full detail + action buttons

Admin clicks "Confirm Registration"
    └─▶ Calls confirmConferenceRegistration(id, force=false)
        └─▶ Validates current status
        └─▶ Updates status = 'confirmed'
        └─▶ Sends confirmation email (non-blocking)
        └─▶ Revalidates page
```

### 5.3 Expiry Flow (Automated)

```
Vercel Cron triggers hourly
    └─▶ GET /api/cron/expire-conference-registrations
        └─▶ Validates CRON_SECRET Bearer token
        └─▶ Bulk UPDATE:
            conference_registrations
            SET status = 'expired'
            WHERE status IN ('pending_payment', 'pending')
              AND payment_status = 'unpaid'
              AND expires_at < now()
              AND expires_at IS NOT NULL
        └─▶ Returns { ok: true, expired: count }
```

---

## 6. Key Design Decisions

### 6.1 Why Server Actions Over API Routes?

**Decision**: Use Server Actions for most mutations (registration, admin actions, status updates)

**Rationale**:

- **Type Safety**: Shared TypeScript types between client and server
- **Less Boilerplate**: No need for separate request parsing, validation, response formatting
- **Better DX**: Direct function calls with TypeScript autocomplete
- **Progressive Enhancement**: Forms work even if JavaScript fails (not currently used, but possible)

**Exception**: Payment initiation uses API routes because external redirects require traditional HTTP responses

### 6.2 Why Dual-Key (ID + Email) Security?

**Decision**: All public API endpoints require both `registrationId` (UUID) and `email` to access registration data

**Rationale**:

- **No User Accounts**: Registrants don't create accounts, so no session-based auth
- **Reduced Attack Surface**: UUID alone is guessable with enough attempts; email serves as shared secret
- **Time-Based Security**: Payment links expire after configured hours (default: 24)
- **User-Friendly**: Email is something users always know and have in their inbox

**Alternative Considered**: Signed JWT tokens - Rejected as more complex with no significant security gain

### 6.3 Why Three Payment Gateways?

**Decision**: Support Stripe (global), Khalti (Nepal), and eSewa (Nepal) simultaneously

**Rationale**:

- **Geographic Coverage**: Nepal has limited credit card adoption; digital wallets dominate
- **User Preference**: Different users prefer different gateways based on existing accounts
- **Conversion Optimization**: More payment options = higher completion rate
- **Fee Optimization**: Domestic gateways (Khalti/eSewa) have lower fees than international cards

**Complexity Trade-off**: Yes, supporting three gateways adds code complexity, but the ROI in registration conversion justifies it

### 6.4 Why Expiry Window?

**Decision**: Automatically expire registrations after configured hours (default: 24) if payment not completed

**Rationale**:

- **Prevent Ghost Bookings**: Ensures abandoned registrations don't block real attendees
- **Financial Planning**: Admin knows within 24 hours which registrations are real
- **Urgency Creation**: Encourages prompt payment completion
- **Capacity Management**: Frees up slots for waiting attendees

**Alternative Considered**: Manual admin pruning - Rejected as labor-intensive and error-prone

### 6.5 Why Non-Blocking Email Sends?

**Decision**: All email sends use `.catch()` to prevent email failures from crashing registration workflow

**Rationale**:

- **Reliability**: SMTP failures are common (rate limits, DNS issues, provider downtime)
- **User Experience**: Attendee shouldn't see error message if email fails but registration succeeded
- **Recoverability**: Admin can manually resend emails via dashboard
- **Priority**: Registration data persistence > email delivery

**Monitoring**: Email failures are logged; production monitoring should alert if failure rate exceeds threshold

---

## 7. Performance Characteristics

### 7.1 Expected Load Profile

| Metric                       | Typical Conference       | Large Conference  |
| ---------------------------- | ------------------------ | ----------------- |
| **Total Registrations**      | 100-300                  | 500-1000          |
| **Peak Registration Period** | 2-3 days before deadline | Week before event |
| **Peak Requests/Hour**       | ~50-100                  | ~200-500          |
| **Database Queries/Request** | 2-5                      | 2-5 (same)        |
| **Email Volume**             | 300-900 total            | 1500-3000 total   |

**Bottleneck Analysis**:

- **Not CPU-bound**: Form processing is lightweight
- **Not I/O-bound**: Database queries are simple, indexed
- **Potentially email-bound**: Gmail SMTP has 2000/day limit (adequate for most conferences)

### 7.2 Caching Strategy

| Data                        | Cache Level               | Invalidation                           |
| --------------------------- | ------------------------- | -------------------------------------- |
| **Conference Settings**     | Server-side (no cache)    | N/A (read on every request)            |
| **Admin Registration List** | None                      | Real-time data shown                   |
| **Public Landing Page**     | Browser cache (5 minutes) | Manual revalidation on settings update |

**Opportunities**:

- Conference settings could be cached in-memory or Redis (rarely change during registration period)
- Admin list could use stale-while-revalidate pattern

**Why Not Aggressive Caching?**:

- Registration data changes frequently (payment status updates)
- Admin needs real-time view for decision-making
- Settings updates should reflect immediately on public page

---

## 8. Testing Strategy

### 8.1 Current Test Coverage

**As of February 2026:**

- No automated test suite exists
- Testing done manually via:
  - Stripe test mode
  - Khalti sandbox
  - eSewa staging environment
  - Manual admin workflow testing

### 8.2 Recommended Test Pyramid

**Unit Tests** (40% of test suite):

- `resolveRegistrationFee()` logic
- `normaliseModeKey()` utility
- Email template variable replacement
- Amount/currency validation functions

**Integration Tests** (40% of test suite):

- Server action end-to-end flows (mock DB)
- Payment provider session creation (mock APIs)
- Email sending (mock SMTP)
- Admin actions with different permission levels

**End-to-End Tests** (20% of test suite):

- Full registration workflow (Playwright/Cypress)
- Payment flow with test cards
- Admin dashboard operations
- CSV export functionality

### 8.3 Critical Test Scenarios

1. **Registration with free event** (fee = 0)
2. **Registration with payment required** → Pay Now → Stripe success
3. **Registration with payment required** → Pay Later → email sent
4. **Payment amount mismatch** → Review status
5. **Payment expiry** → Cron marks expired
6. **Admin manual confirmation** → Confirmation email sent
7. **Admin cancel** → Cancellation email sent
8. **Webhook duplicate** → Idempotency prevents double-processing

---

## 9. Monitoring & Observability

> These are recommendations; monitoring is not yet implemented as of February 2026. Metrics, logging, and error tracking are planned for future releases. See Section 10: Improvements & Risks for implementation roadmap.

### 9.1 Recommended Metrics

**Application Metrics**:

- Registration submission rate (per hour)
- Payment success rate (by provider)
- Average time-to-payment (from registration to payment completion)
- Email delivery success rate
- API error rate (by endpoint)

**Infrastructure Metrics**:

- Vercel function execution time (95th percentile)
- Supabase database connection pool utilization
- Email queue depth (if using queue in future)

**Business Metrics**:

- Total confirmed registrations
- Revenue by payment provider
- Registration drop-off by step (form analytics)
- Expiry rate (% of registrations that expire unpaid)

### 9.2 Recommended Logging

**Structured Logging** (JSON format):

```json
{
  "timestamp": "2026-02-28T10:30:00Z",
  "level": "info",
  "service": "conference",
  "action": "payment_started",
  "registrationId": "uuid",
  "provider": "stripe",
  "amount": 2500,
  "currency": "NPR"
}
```

**Critical Events to Log**:

- Registration created
- Payment initiated (with provider and amount)
- Payment verified (with source: webhook/direct)
- Payment amount mismatch detected
- Admin action performed (with admin email)
- Email send failure
- Cron job execution (with expired count)

### 9.3 Error Tracking

**Recommended**: Sentry or similar error tracking service

**Key Error Categories**:

- Payment provider API failures
- Database constraint violations
- Email SMTP failures
- Webhook signature verification failures
- Cron authentication failures

---

## 10. Development Workflow

### 10.1 Local Development Setup

**Prerequisites**:

```bash
# Required
Node.js 18+
pnpm 8+

# Optional but recommended
Docker (for local Supabase instance)
Stripe CLI (for webhook testing)
```

**Environment Variables** (see `09-deployment-operations.md` for complete list):

```env
# Minimum required for local dev
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GOOGLE_EMAIL=
GOOGLE_EMAIL_APP_PASSWORD=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

**Start Development Server**:

```bash
pnpm install
pnpm dev
# Navigate to http://localhost:3000/conference
```

### 10.2 Code Organization Principles

**Directory Structure**:

```
app/
  (public)/conference/          # Public-facing pages
  admin/conference/             # Admin pages
  api/conference/               # Public API routes
  api/admin/conference/         # Admin API routes
  api/cron/                     # Scheduled jobs

components/
  conference/                   # Public UI components
  admin/                        # Admin UI components

lib/
  actions/
    conference-registration.ts  # Core business logic
    conference-settings.ts      # Settings management
  email/
    conference-mailer.ts        # Email send functions
    templates/                  # HTML templates
  types/
    conference.ts               # Shared TypeScript types
```

**Naming Conventions**:

- Server Actions: `verbNoun()` (e.g., `registerForConference()`)
- API Routes: RESTful (`/api/resource/action`)
- Components: PascalCase (`ConferenceRegistrationForm`)
- Types: PascalCase with descriptive suffix (`ConferenceRegistration`, `StartPaymentResult`)

### 10.3 Git Workflow

**Branch Strategy**:

- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/<name>` - Individual feature branches

**Commit Message Format**:

```
type(scope): short description

Longer description if needed.

Fixes #123
```

**Types**: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`

---

## 11. Dependencies

### 11.1 Critical Dependencies

| Package                 | Version | Purpose            | Risk Level                  |
| ----------------------- | ------- | ------------------ | --------------------------- |
| `next`                  | ^14.0.0 | Framework core     | Low (stable)                |
| `@supabase/supabase-js` | ^2.39.0 | Database client    | Low (stable)                |
| `stripe`                | ^14.0.0 | Payment processing | Low (stable, versioned API) |
| `nodemailer`            | ^6.9.0  | Email sending      | Low (mature)                |
| `react-hook-form`       | ^7.49.0 | Form management    | Low (stable)                |
| `zod`                   | ^3.22.0 | Input validation   | Low (stable)                |

### 11.2 Update Strategy

**Security Updates**: Apply immediately (automated via Dependabot)

**Minor Updates**: Review and apply monthly

- Check changelog for breaking changes
- Run test suite before merging

**Major Updates**: Quarterly review

- Evaluate breaking changes
- Create feature branch for testing
- Update in batches (not all at once)

---

## 12. Version History

| Version | Date     | Changes                       | Migration Required                   |
| ------- | -------- | ----------------------------- | ------------------------------------ |
| 1.0.0   | Feb 2026 | Initial production release    | Database setup (see migration files) |
| -       | -        | (Future versions listed here) | -                                    |

---

## 13. Related Documentation

- **Previous**: [00: Executive Summary](00-executive-summary.md)
- **Next**: [02: Architecture & Responsibilities](02-architecture.md)
- **See Also**: [11: Appendix (Glossary, File Inventory)](11-appendix.md)

---

**Document Maintained By**: Development Partner  
**Last Reviewed**: February 28, 2026  
**Next Review Due**: After next major conference (May 2026) or significant code changes
