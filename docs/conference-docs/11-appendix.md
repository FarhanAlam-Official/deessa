# DEESSA Foundation — Conference Module: Appendix & Reference

> **Version:** 1.0.0  
> **Last Updated:** February 28, 2026  
> **Audience:** All Stakeholders

---

## Table of Contents

1. [Glossary](#1-glossary)
2. [File Inventory](#2-file-inventory)
3. [Changelog](#3-changelog)
4. [Quick Reference Tables](#4-quick-reference-tables)
5. [External Resources](#5-external-resources)
6. [Contributors](#6-contributors)

---

## 1. Glossary

### A-E

**Admin Dashboard**  
Web interface accessible only to authenticated staff for managing conference registrations (view, confirm, cancel, export).

**API Route**  
Server-side endpoint in Next.js that handles HTTP requests (`/api/conference/*`). Runs on serverless functions.

**Attendance Mode**  
User's participation format: "In-person" (physical attendance) or "Virtual" (online via Zoom/Teams).

**Client Component**  
React component rendered in browser (uses `'use client'` directive). Can use hooks like `useState`, `useEffect`.

**Cold Start**  
Delay when serverless function is invoked after being idle. Vercel serverless functions may have 1-2s cold start.

**Cron Job**  
Scheduled task that runs automatically (e.g., hourly expiry job). Managed by Vercel Cron system.

**CSR (Client-Side Rendering)**  
Page content rendered in browser using JavaScript. SEO-unfriendly but allows dynamic interactions.

**Dual-Key Security**  
Authentication method using two identifiers (registrationId + email) to verify user identity without passwords.

**Dual-Path Verification**  
Payment confirmation via TWO methods (direct API polling + webhook callback) to ensure reliability.

**Environment Variable**  
Configuration value injected at runtime (e.g., `STRIPE_SECRET_KEY`). Never committed to Git, stored in Vercel dashboard.

**eSewa**  
Nepal-based digital wallet supporting NPR payments. Used for local attendees paying in local currency.

---

### F-M

**Idempotency**  
Property that ensures repeat requests have same effect as single request. Prevents duplicate payment confirmations.

**Khalti**  
Nepal-based payment gateway (credit/debit cards + wallet). Alternative to Stripe for NPR transactions.

**NPR (Nepalese Rupee)**  
Currency code for Nepal's currency. Used for pricing virtual attendance and local payments.

**Pagination**  
Loading data in chunks (pages) instead of all at once. Improves performance for large datasets (500+ registrations).

**Payment Gateway**  
Third-party service that processes online payments (Stripe, Khalti, eSewa). Handles card data securely.

**Payment Provider**  
Same as Payment Gateway. Service that facilitates money transfer from user to merchant.

**PCI Compliance**  
Payment Card Industry security standard. Ensures card data is handled securely. (DEESSA does NOT store card data locally.)

**Polling**  
Repeatedly checking status by making API requests at intervals (e.g., every 5 seconds for 90 seconds).

**RLS (Row-Level Security)**  
Database feature that restricts data access based on user roles. In Supabase, RLS policies define who can read/write each row.

**Rate Limiting**  
Restricting number of requests a user can make in a time window (e.g., 10 requests per minute). Prevents abuse.

---

### N-Z

**Server Action**  
Next.js feature that allows calling server-side functions directly from client components (alternative to API routes).

**Server Component**  
React component rendered on server. Cannot use client-side hooks. Default in Next.js App Router.

**Service Role Key**  
Supabase secret key that bypasses RLS policies. Used by backend to access all data. **Never expose to client.**

**SSR (Server-Side Rendering)**  
Page content rendered on server before sending to browser. SEO-friendly and fast initial load.

**Stripe**  
Global payment processor supporting 135+ currencies, credit cards, Apple Pay, Google Pay. Industry-standard for online payments.

**Supabase**  
Backend-as-a-Service built on PostgreSQL. Provides database, authentication, storage, realtime subscriptions.

**TypeScript**  
Programming language (superset of JavaScript) with static type checking. Prevents bugs at compile time.

**Vercel**  
Cloud platform for deploying Next.js applications. Provides serverless functions, CDN, edge network.

**Webhook**  
HTTP callback from third-party service (e.g., Stripe) to notify your server of events (e.g., "payment succeeded").

**Zod**  
TypeScript-first schema validation library. Used to validate user input before processing.

---

## 2. File Inventory

### 2.1 Frontend Pages

| File Path                                          | Purpose                               | Auth Required       |
| -------------------------------------------------- | ------------------------------------- | ------------------- |
| `app/(public)/conference/page.tsx`                 | Conference landing page (SSR)         | No                  |
| `app/(public)/conference/register/page.tsx`        | Registration form (CSR)               | No                  |
| `app/(public)/conference/payment-options/page.tsx` | Payment gateway selection (CSR)       | No                  |
| `app/(public)/conference/pending-payment/page.tsx` | Payment processing + polling (CSR)    | No                  |
| `app/(public)/conference/payment-success/page.tsx` | Payment gateway success landing (SSR) | No                  |
| `app/(public)/conference/success/page.tsx`         | Final confirmation page (SSR)         | No                  |
| `app/(public)/conference/failure/page.tsx`         | Payment failed page (SSR)             | No                  |
| `app/admin/conference/page.tsx`                    | Admin registration list (SSR)         | Yes (Supabase Auth) |
| `app/admin/conference/[id]/page.tsx`               | Admin detail page (SSR)               | Yes                 |
| `app/admin/conference/settings/page.tsx`           | Settings form (CSR)                   | Yes                 |

### 2.2 API Routes

| File Path                                               | Purpose                     | Auth Method                |
| ------------------------------------------------------- | --------------------------- | -------------------------- |
| `app/api/conference/start-payment/route.ts`             | Create payment session      | Dual-key (rid+email)       |
| `app/api/conference/confirm-stripe-session/route.ts`    | Verify Stripe payment       | Dual-key                   |
| `app/api/conference/verify-registration/route.ts`       | Verify Khalti/eSewa payment | Dual-key                   |
| `app/api/conference/status/route.ts`                    | Get registration status     | Dual-key                   |
| `app/api/conference/resend-payment-link/route.ts`       | Resend payment email        | Dual-key                   |
| `app/api/conference/webhooks/stripe/route.ts`           | Stripe webhook callback     | HMAC signature             |
| `app/api/admin/conference/export-csv/route.ts`          | Export registrations CSV    | Supabase session           |
| `app/api/cron/expire-conference-registrations/route.ts` | Expire old registrations    | Bearer token (CRON_SECRET) |

### 2.3 Components

| File Path                                                | Purpose                                   | Type   |
| -------------------------------------------------------- | ----------------------------------------- | ------ |
| `components/conference/conference-registration-form.tsx` | 4-step registration wizard (orchestrator) | Client |
| `components/conference/step-1-basic-info.tsx`            | Name, email, phone, country               | Client |
| `components/conference/step-2-attendance.tsx`            | Attendance mode selector                  | Client |
| `components/conference/step-3-dietary.tsx`               | Dietary preferences                       | Client |
| `components/conference/step-4-review.tsx`                | Review + submit                           | Client |
| `components/conference/payment-option-card.tsx`          | Payment gateway card UI                   | Client |
| `components/admin/registration-detail.tsx`               | Admin detail view with actions            | Client |
| `components/admin/settings-form.tsx`                     | Conference settings editor                | Client |

### 2.4 Utilities & Services

| File Path                       | Purpose                                    |
| ------------------------------- | ------------------------------------------ |
| `lib/supabase/client.ts`        | Supabase client factory (browser + server) |
| `lib/utils.ts`                  | Utility functions (cn helper, formatters)  |
| `lib/validations/conference.ts` | Zod schemas for registration               |
| `data/countries.ts`             | List of 195 countries (static)             |
| `styles/globals.css`            | Global Tailwind CSS + custom styles        |

### 2.5 Database

| Item                        | Type  | Purpose                                |
| --------------------------- | ----- | -------------------------------------- |
| `conference_registrations`  | Table | Main registrations table (30 columns)  |
| `site_settings`             | Table | Stores settings JSON blob (single row) |
| `payment_events`            | Table | Idempotency + audit log for webhooks   |
| `idx_registrations_status`  | Index | Query by status                        |
| `idx_registrations_email`   | Index | Lookup by email                        |
| `idx_registrations_created` | Index | Sort by created_at                     |
| `idx_registrations_expires` | Index | Cron job expiry query                  |
| `idx_payment_id`            | Index | Webhook lookup by payment_id           |

### 2.6 Configuration Files

| File Path            | Purpose                                     |
| -------------------- | ------------------------------------------- |
| `package.json`       | Dependencies, scripts                       |
| `tsconfig.json`      | TypeScript configuration                    |
| `next.config.mjs`    | Next.js configuration                       |
| `tailwind.config.ts` | Tailwind CSS configuration                  |
| `postcss.config.mjs` | PostCSS plugins                             |
| `components.json`    | Shadcn/ui component configuration           |
| `.env.local`         | Local environment variables (gitignored)    |
| `vercel.json`        | Vercel deployment configuration (cron jobs) |
| `.eslintrc.json`     | ESLint rules                                |
| `.prettierrc`        | Code formatting rules                       |

### 2.7 Documentation Files

| File Path                                          | Description                             |
| -------------------------------------------------- | --------------------------------------- |
| `docs/conference-docs/00-executive-summary.md`     | Non-technical overview for stakeholders |
| `docs/conference-docs/01-overview.md`              | Technical scope and stack               |
| `docs/conference-docs/02-architecture.md`          | System topology and responsibilities    |
| `docs/conference-docs/03-database-schema.md`       | Database structure with ERD             |
| `docs/conference-docs/04-page-documentation.md`    | Frontend pages reference                |
| `docs/conference-docs/05-api-documentation.md`     | API endpoints reference                 |
| `docs/conference-docs/06-payment-flows.md`         | Payment state machines                  |
| `docs/conference-docs/07-admin-documentation.md`   | Admin features guide                    |
| `docs/conference-docs/08-security.md`              | Security architecture                   |
| `docs/conference-docs/09-deployment-operations.md` | Operations manual                       |
| `docs/conference-docs/10-improvements-risks.md`    | Limitations and roadmap                 |
| `docs/conference-docs/11-appendix.md`              | This file (glossary, references)        |

---

## 3. Changelog

### Version 1.0.0 (February 28, 2026)

**Initial Release**

**Features**:

- ✅ Registration with 8 custom fields
- ✅ Dual attendance mode (In-person USD / Virtual NPR)
- ✅ Three payment gateways (Stripe, Khalti, eSewa)
- ✅ Dual-path payment verification
- ✅ Automated confirmation emails (Nodemailer + Gmail)
- ✅ Admin dashboard (list, detail, CSV export)
- ✅ Database-driven settings (no code deploy for config changes)
- ✅ 24-hour expiry with hourly cron job
- ✅ Responsive design (mobile-first)
- ✅ GDPR-ready (data export, retention policies)

**Technical Stack**:

- Next.js 14.1.0
- TypeScript 5.3.3
- Supabase (PostgreSQL 15)
- Stripe SDK 14.14.0
- Tailwind CSS 3.4.1
- Shadcn/ui components
- Zod 3.22.4 (validation)
- Vercel (hosting)

**Known Issues**:

- No user accounts (users cannot log in to view registrations)
- Single conference limitation (cannot run multiple events)
- In-memory rate limiting (resets on cold start)
- 6228-line monolith (needs refactoring)
- No automated refunds

**Contributors**:

- Architecture & Implementation: Development Partner
- Requirements & Testing: DEESSA Program Team
- Payment Gateway Setup: Finance Team

---

### Future Versions (Planned)

**Version 1.1.0** (Q2 2026):

- [ ] Multi-event support
- [ ] Redis-based rate limiting
- [ ] Request ID tracing
- [ ] Integration tests

**Version 1.2.0** (Q3 2026):

- [ ] User accounts
- [ ] Discount codes
- [ ] QR check-in system
- [ ] Advanced reporting dashboard

**Version 2.0.0** (Q4 2026):

- [ ] Major refactor (service-oriented architecture)
- [ ] Mobile app (React Native)
- [ ] Multi-language support
- [ ] Certificate generation

---

## 4. Quick Reference Tables

### 4.1 Registration Status Flow

```
pending → pending_payment → confirmed
  ↓            ↓               ↓
cancelled   expired       (final state)
```

### 4.2 Payment Status States

| Status     | Meaning                 | Next Action              |
| ---------- | ----------------------- | ------------------------ |
| **unpaid** | No payment attempted    | User must pay            |
| **paid**   | Payment confirmed       | N/A (done)               |
| **failed** | Payment declined/failed | Retry payment            |
| **review** | Amount mismatch         | Admin reviews + confirms |

### 4.3 Email Triggers

| Trigger                          | Template Type             | Sent To         |
| -------------------------------- | ------------------------- | --------------- |
| Registration submitted           | Registration Confirmation | User            |
| Payment confirmed (webhook)      | Payment Confirmation      | User            |
| Payment confirmed (admin manual) | Payment Notification      | User            |
| Registration cancelled           | Cancellation Notice       | User (optional) |
| Custom email (admin)             | Custom Text               | Selected user   |

### 4.4 Payment Gateway Comparison

| Feature             | Stripe               | Khalti        | eSewa       |
| ------------------- | -------------------- | ------------- | ----------- |
| **Region**          | Global               | Nepal only    | Nepal only  |
| **Currency**        | USD (135+)           | NPR           | NPR         |
| **Payment Methods** | Cards, Wallets, Bank | Cards, Wallet | Wallet only |
| **Fee**             | 2.9% + $0.30         | 3.5% + NPR 15 | 2%          |
| **Settlement**      | 2-7 days             | 3-5 days      | 1-2 days    |
| **Webhook**         | ✅ Yes               | ❌ No         | ❌ No       |
| **Refund API**      | ✅ Automated         | ✅ Automated  | ❌ Manual   |
| **Metadata**        | ✅ Yes               | ❌ No         | ❌ No       |

### 4.5 Admin Quick Actions

| Action                | What It Does                                 | Reversible?        |
| --------------------- | -------------------------------------------- | ------------------ |
| **Confirm**           | Mark registration as confirmed (sends email) | No                 |
| **Cancel**            | Mark as cancelled (does NOT refund)          | No                 |
| **Mark as Paid**      | Override payment status to paid              | No                 |
| **Extend Expiry**     | Add 24 hours to expiry time                  | Yes (extend again) |
| **Resend Email**      | Send registration confirmation again         | N/A                |
| **Send Custom Email** | Free-form email to user                      | N/A                |
| **Copy ID**           | Copy registration UUID to clipboard          | N/A                |

### 4.6 Environment Variables Checklist

| Category        | Variables                                                                          | Count |
| --------------- | ---------------------------------------------------------------------------------- | ----- |
| **Next.js**     | NODE_ENV, NEXT_PUBLIC_SITE_URL                                                     | 2     |
| **Supabase**    | NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY | 3     |
| **Google Maps** | NEXT_PUBLIC_GOOGLE_MAPS_API_KEY                                                    | 1     |
| **Email**       | GOOGLE_EMAIL, GOOGLE_EMAIL_APP_PASSWORD                                            | 2     |
| **Stripe**      | STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY, STRIPE_WEBHOOK_SECRET                   | 3     |
| **Khalti**      | KHALTI_SECRET_KEY, KHALTI_PUBLIC_KEY                                               | 2     |
| **eSewa**       | ESEWA_MERCHANT_CODE, ESEWA_SECRET_KEY, ESEWA_ENVIRONMENT                           | 3     |
| **Cron**        | CRON_SECRET                                                                        | 1     |
| **Optional**    | SENTRY_DSN                                                                         | 1     |
| **TOTAL**       |                                                                                    | 18    |

---

## 5. External Resources

### 5.1 Official Documentation

**Technology Docs**:

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Stripe API Reference](https://stripe.com/docs/api)
- [Khalti Integration](https://docs.khalti.com/)
- [eSewa Developer Guide](https://developer.esewa.com.np/)
- [Vercel Documentation](https://vercel.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Shadcn/ui Components](https://ui.shadcn.com/)

**Learning Resources**:

- [Next.js Learn Course](https://nextjs.org/learn) (free, official)
- [Supabase YouTube Channel](https://www.youtube.com/@supabase)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [MDN Web Docs](https://developer.mozilla.org/) (HTML, CSS, JavaScript reference)

### 5.2 Tools & Services

**Development**:

- [VS Code](https://code.visualstudio.com/) (recommended editor)
- [Postman](https://www.postman.com/) (API testing)
- [TablePlus](https://tableplus.com/) (database GUI)
- [DBeaver](https://dbeaver.io/) (free database GUI)

**Testing**:

- [Stripe Test Cards](https://stripe.com/docs/testing#cards)
- [Khalti Test Environment](https://test-pay.khalti.com/)
- [Mailtrap](https://mailtrap.io/) (email testing)
- [Playwright](https://playwright.dev/) (E2E testing)

**Monitoring**:

- [Vercel Analytics](https://vercel.com/analytics) (built-in)
- [Supabase Dashboard](https://app.supabase.com/) (database metrics)
- [Sentry](https://sentry.io/) (error tracking)
- [UptimeRobot](https://uptimerobot.com/) (uptime monitoring)

### 5.3 Community Support

**Where to Ask Questions**:

- [Next.js GitHub Discussions](https://github.com/vercel/next.js/discussions)
- [Supabase Discord](https://discord.supabase.com/)
- [Stripe Developers Slack](https://stripe.com/docs/support)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/next.js) (use tags: `next.js`, `supabase`, `stripe`)

---

## 6. Contributors

### Development Team

**Lead Developer**: Development Partner  
**Role**: System architecture, implementation, documentation  
**Contact**: [via DEESSA Foundation]

**DEESSA Foundation Team**:

- **Program Manager**: Requirements, user acceptance testing
- **Finance Officer**: Payment gateway setup, reconciliation
- **IT Coordinator**: Server configuration, email setup

### Acknowledgments

**Open Source Libraries**:

- Next.js team (Vercel)
- Supabase team
- Stripe developer relations
- Tailwind Labs
- Shadcn (Shadcn/ui creator)
- Zod maintainers

**Design Inspiration**:

- Stripe Checkout UX
- Vercel Dashboard UI
- Linear (clean, minimal design)

---

## Related Documentation

- **Documentation Index**: [00: executive-summary](00-executive-summary.md)
- **Quick Start**: [01: Overview](01-overview.md)
- **For Developers**: [02: Architecture](02-architecture.md), [05: API Documentation](05-api-documentation.md)
- **For Operations**: [09: Deployment & Operations](09-deployment-operations.md)
- **For Stakeholders**: [00: Executive Summary](00-executive-summary.md)

---

**Document Maintained By**: Development Partner  
**Last Reviewed**: February 28, 2026  
**Next Review**: Quarterly or when major features added

---

## Appendix: Versioning Strategy

This documentation follows [Semantic Versioning](https://semver.org/):

**Format**: MAJOR.MINOR.PATCH

- **MAJOR**: Breaking changes (e.g., new database schema requiring migration)
- **MINOR**: New features (backward-compatible)
- **PATCH**: Bug fixes, documentation updates

**Current Version**: 1.0.0 (February 28, 2026)

**Next Version**: 1.1.0 (when multi-event support is added)
