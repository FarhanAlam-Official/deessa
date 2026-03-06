# Payment Architecture V2

## Overview

Payment Architecture V2 is a complete refactor of the payment processing system, designed for reliability, security, and scalability. It introduces centralized payment confirmation, fail-closed verification, and comprehensive error handling.

## Key Features

✅ **Centralized Payment Confirmation** - Single source of truth for all payment state transitions
✅ **Fail-Closed Verification** - Amount/currency mismatches → REVIEW status
✅ **Transactional Integrity** - Atomic database operations with row-level locking
✅ **Idempotency** - Duplicate webhook/event handling
✅ **Provider Abstraction** - Unified interface for Stripe, Khalti, and eSewa
✅ **Security Hardening** - Signature verification, token authentication, rate limiting
✅ **Comprehensive Testing** - 340+ test cases covering unit, integration, and security
✅ **Operational Excellence** - Monitoring, alerting, reconciliation, and runbooks

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Payment Providers                        │
│                  (Stripe, Khalti, eSewa)                        │
└────────────────┬────────────────────────────────────────────────┘
                 │ Webhooks/Callbacks
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Webhook Endpoints                           │
│         /api/webhooks/stripe                                    │
│         /api/webhooks/khalti                                    │
│         /api/payments/esewa/success                             │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Provider Adapters                            │
│         StripeAdapter  │  KhaltiAdapter  │  EsewaAdapter        │
│         - verify()     │  - verify()     │  - verify()          │
│         - normalize()  │  - normalize()  │  - normalize()       │
└────────────────┬────────────────────────────────────────────────┘
                 │ VerificationResult
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                      PaymentService                              │
│                  confirmDonation()                               │
│         - State validation                                       │
│         - Idempotency check                                      │
│         - Amount/currency verification                           │
│         - Atomic database update                                 │
│         - Post-payment processing                                │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Database                                  │
│         donations  │  payments  │  payment_events               │
│         receipts   │  payment_jobs                              │
└─────────────────────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Post-Payment Processing                         │
│         Receipt Generation  │  Email Sending                     │
│         (Inline fire-and-forget)                                │
└─────────────────────────────────────────────────────────────────┘
```

## Key Changes from V1

### 1. Centralized Payment Confirmation

**V1:** Each webhook handler directly updated donation status
**V2:** All updates go through `PaymentService.confirmDonation()`

**Benefits:**
- Single source of truth
- Consistent state transitions
- Easier to test and maintain
- Audit trail for all changes

### 2. Fail-Closed Verification

**V1:** Amount mismatches were logged but donation still confirmed
**V2:** Amount/currency mismatches → REVIEW status → Manual approval required

**Benefits:**
- Prevents incorrect confirmations
- Protects against fraud
- Admin visibility into issues
- Clear audit trail

### 3. Transactional Integrity

**V1:** Multiple separate database operations
**V2:** Atomic transactions with row-level locking

**Benefits:**
- No partial updates
- Race condition prevention
- Data consistency guaranteed
- Rollback on errors

### 4. Idempotency

**V1:** Limited duplicate detection
**V2:** Comprehensive idempotency via `payment_events` table

**Benefits:**
- Handles provider webhook retries
- Prevents duplicate confirmations
- Safe to replay events
- Unique constraint enforcement

### 5. Provider Abstraction

**V1:** Provider-specific code scattered across codebase
**V2:** Unified `ProviderAdapter` interface

**Benefits:**
- Easy to add new providers
- Consistent verification logic
- Testable in isolation
- Clear separation of concerns

### 6. Security Hardening

**V1:** Basic signature verification
**V2:** Comprehensive security controls

**New Security Features:**
- Timing-safe HMAC comparison (eSewa)
- Token-based receipt authentication
- Rate limiting on all endpoints
- Mock mode prevention in production
- Replay attack prevention
- Security headers
- Audit logging

### 7. Testing

**V1:** Minimal tests
**V2:** Comprehensive test suite

**Test Coverage:**
- 90+ unit tests
- 120+ integration tests
- 130+ security tests
- Concurrency tests (100+ concurrent requests)
- Performance tests (1000 req/10s)

### 8. Operations

**V1:** Manual troubleshooting
**V2:** Comprehensive operational tools

**New Tools:**
- Reconciliation system
- Admin review interface
- Monitoring dashboard
- Operations runbook
- Deployment guide
- API documentation

## State Machine

```
┌──────────┐
│ INITIATED│
└────┬─────┘
     │ Payment initiated
     ▼
┌──────────┐
│ PENDING  │◄────────┐
└────┬─────┘         │
     │               │ Reconciliation
     │               │
     ├──────────────►│
     │ Verified      │
     ▼               │
┌──────────┐         │
│CONFIRMED │         │
└──────────┘         │
     │               │
     ├──────────────►│
     │ Mismatch      │
     ▼               │
┌──────────┐         │
│  REVIEW  │─────────┘
└────┬─────┘
     │ Admin action
     ├────────────┐
     │            │
     ▼            ▼
┌──────────┐ ┌──────────┐
│CONFIRMED │ │  FAILED  │
└──────────┘ └──────────┘
     │            │
     │ Refund     │
     ▼            │
┌──────────┐     │
│ REFUNDED │◄────┘
└──────────┘
```

## Database Schema

### New Tables

**`payments`** - Payment verification records
```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donation_id UUID NOT NULL REFERENCES donations(id),
  provider TEXT NOT NULL,
  transaction_id TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL,
  verified_amount DECIMAL(10,2),
  verified_currency TEXT,
  status TEXT NOT NULL,
  verified_at TIMESTAMPTZ,
  raw_payload JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**`receipts`** - Receipt metadata
```sql
CREATE TABLE receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donation_id UUID NOT NULL UNIQUE REFERENCES donations(id),
  receipt_number TEXT NOT NULL UNIQUE,
  receipt_url TEXT,
  generated_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  download_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**`payment_events`** - Idempotency tracking
```sql
CREATE TABLE payment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  event_id TEXT NOT NULL,
  donation_id UUID REFERENCES donations(id),
  event_type TEXT,
  raw_payload JSONB,
  processed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(provider, event_id)
);
```

**`payment_jobs`** - Async job queue (future)
```sql
CREATE TABLE payment_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donation_id UUID NOT NULL REFERENCES donations(id),
  job_type TEXT NOT NULL,
  status TEXT NOT NULL,
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  payload JSONB,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  next_retry_at TIMESTAMPTZ
);
```

## API Endpoints

### Webhook Endpoints

- `POST /api/webhooks/stripe` - Stripe webhook handler
- `POST /api/webhooks/khalti` - Khalti webhook handler (if implemented)
- `GET /api/payments/esewa/success` - eSewa success callback
- `GET /api/payments/esewa/failure` - eSewa failure callback

### Status Endpoints

- `GET /api/payments/stripe/status?session_id={id}` - Check Stripe payment status
- `GET /api/payments/khalti/status?pidx={id}` - Check Khalti payment status
- `GET /api/payments/esewa/status?transaction_uuid={id}` - Check eSewa payment status

### Receipt Endpoints

- `GET /api/receipts/download?token={jwt}` - Download receipt PDF
- `POST /api/receipts/resend` - Resend receipt email

### Admin Endpoints

- `GET /admin/donations/review` - List donations requiring review
- `POST /admin/donations/review` - Approve/reject donation
- `GET /admin/monitoring` - Monitoring dashboard
- `GET /admin/receipts/failed` - Failed receipt generation

## Environment Variables

### Required

```bash
# Node Environment
NODE_ENV=production

# Payment Mode (MUST be 'live' in production)
PAYMENT_MODE=live

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Khalti
KHALTI_SECRET_KEY=live_secret_key_...
KHALTI_BASE_URL=https://khalti.com/api/v2
NEXT_PUBLIC_KHALTI_PUBLIC_KEY=live_public_key_...

# eSewa
ESEWA_SECRET_KEY=your-secret-key
ESEWA_MERCHANT_ID=your-merchant-id
ESEWA_BASE_URL=https://epay.esewa.com.np

# Receipt Token Secret
RECEIPT_TOKEN_SECRET=your-32-character-secret

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@yourorg.org

# Redis (Rate Limiting)
UPSTASH_REDIS_URL=https://your-redis.upstash.io
UPSTASH_REDIS_TOKEN=your-redis-token
```

## Getting Started

### Installation

```bash
# Install dependencies
npm install

# Run database migrations
supabase db push

# Validate configuration
npm run validate-config

# Run tests
npm test

# Start development server
npm run dev
```

### Development

```bash
# Set mock mode for development
PAYMENT_MODE=mock

# Run with hot reload
npm run dev

# Run tests in watch mode
npm test:watch

# Check test coverage
npm test:coverage
```

### Deployment

See [Deployment Guide](./deployment/DEPLOYMENT_GUIDE.md) for detailed instructions.

```bash
# Deploy to Vercel
vercel --prod

# Or use Git integration
git push origin main
```

## Testing

### Run Tests

```bash
# All tests
npm test

# Unit tests only
npm test payments

# Integration tests only
npm test integration

# Security tests only
npm test security

# With coverage
npm test:coverage
```

### Test Coverage

- **Unit Tests:** 90+ tests
- **Integration Tests:** 120+ tests
- **Security Tests:** 130+ tests
- **Total:** 340+ tests

## Monitoring

### Key Metrics

- **Webhook Success Rate:** > 95%
- **Confirmation Latency:** < 1 second
- **Receipt Generation Success:** > 98%
- **Email Send Success:** > 95%
- **Error Rate:** < 1%

### Dashboards

- **System Health:** `/api/health`
- **Admin Monitoring:** `/admin/monitoring`
- **Vercel Analytics:** Vercel Dashboard
- **Supabase Metrics:** Supabase Dashboard

### Alerts

Set up alerts for:
- Webhook failure rate > 5%
- Confirmation latency > 2 seconds
- Receipt generation failure > 5%
- Email send failure > 10%
- Donations stuck in PENDING > 1 hour
- Donations stuck in REVIEW > 24 hours

## Operations

### Daily Tasks

- Check system health
- Review overnight donations
- Process donations in REVIEW
- Check receipt generation
- Run reconciliation

### Incident Response

See [Operations Runbook](./operations/RUNBOOK.md) for detailed procedures.

**Severity Levels:**
- **P0 (Critical):** All payments failing, database down, security breach
- **P1 (High):** Single provider failing, webhook endpoint down
- **P2 (Medium):** Slow response times, intermittent errors
- **P3 (Low):** Minor bugs, UI issues

## Documentation

- **API Documentation:** [docs/api/PAYMENT_API.md](./api/PAYMENT_API.md)
- **Deployment Guide:** [docs/deployment/DEPLOYMENT_GUIDE.md](./deployment/DEPLOYMENT_GUIDE.md)
- **Operations Runbook:** [docs/operations/RUNBOOK.md](./operations/RUNBOOK.md)
- **Design Document:** [.kiro/specs/payment-architecture-v2/design.md](../.kiro/specs/payment-architecture-v2/design.md)
- **Requirements:** [.kiro/specs/payment-architecture-v2/requirements.md](../.kiro/specs/payment-architecture-v2/requirements.md)
- **Test Documentation:** [__tests__/README.md](../../__tests__/README.md)

## Troubleshooting

### Common Issues

**Webhook signature verification fails:**
- Verify `STRIPE_WEBHOOK_SECRET` / `ESEWA_SECRET_KEY` is correct
- Check webhook endpoint URL in provider dashboard
- Ensure raw body is passed to verification

**Donation stuck in PENDING:**
- Run reconciliation: `npm run reconcile`
- Check provider transaction status
- Verify webhook was received
- Check logs for errors

**Receipt not generated:**
- Check `receipt_failures` table
- Verify RPC function works: `SELECT get_next_receipt_number();`
- Check Supabase Storage permissions
- Manually retry via `/admin/receipts/failed`

**Email not sent:**
- Check SMTP credentials
- Verify email rate limits
- Check spam filters
- Manually resend via `/api/receipts/resend`

See [Operations Runbook](./operations/RUNBOOK.md) for more troubleshooting procedures.

## Security

### Security Controls

- ✅ Webhook signature verification (Stripe, eSewa)
- ✅ HMAC-SHA256 with timing-safe comparison
- ✅ Token-based receipt authentication (JWT)
- ✅ Rate limiting (10 req/min)
- ✅ Session management (secure cookies)
- ✅ CSRF protection
- ✅ Mock mode prevention in production
- ✅ Replay attack prevention (idempotency)
- ✅ Security headers (CSP, HSTS, X-Frame-Options)
- ✅ Audit logging

### Security Best Practices

1. **Never skip signature verification** in production
2. **Rotate credentials** regularly
3. **Use strong secrets** (32+ characters)
4. **Enable rate limiting** on all endpoints
5. **Monitor for suspicious activity**
6. **Keep dependencies updated**
7. **Review audit logs** regularly

## Support

For questions or issues:
- Review documentation in `docs/` directory
- Check [Operations Runbook](./operations/RUNBOOK.md)
- Contact development team
- Create GitHub issue

## Contributing

1. Fork the repository
2. Create feature branch
3. Write tests for new features
4. Ensure all tests pass
5. Submit pull request

## License

[Your License Here]

---

**Version:** 2.0.0
**Last Updated:** 2024-01-01
**Status:** Production Ready
