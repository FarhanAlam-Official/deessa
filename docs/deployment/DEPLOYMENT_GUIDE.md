# Payment Architecture V2 - Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the Payment Architecture V2 system to staging and production environments.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Database Migrations](#database-migrations)
- [Application Deployment](#application-deployment)
- [Worker Deployment](#worker-deployment)
- [Verification](#verification)
- [Rollback Procedure](#rollback-procedure)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Tools

- Node.js 18+ and npm/pnpm
- PostgreSQL 14+ (Supabase)
- Git
- Vercel CLI (for Vercel deployments)
- Access to environment secrets

### Required Access

- Database admin access (Supabase dashboard)
- Deployment platform access (Vercel/hosting provider)
- Payment provider dashboards (Stripe, Khalti, eSewa)
- Email service access (SMTP credentials)
- Redis access (Upstash for rate limiting)

---

## Environment Variables

### Required Variables

Create `.env.production` file with the following variables:

```bash
# Node Environment
NODE_ENV=production

# Payment Mode
PAYMENT_MODE=live  # MUST be 'live' in production

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

# Receipt Token Secret (generate with: openssl rand -base64 32)
RECEIPT_TOKEN_SECRET=your-32-character-secret

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@yourorg.org

# Redis (Upstash for rate limiting)
UPSTASH_REDIS_URL=https://your-redis.upstash.io
UPSTASH_REDIS_TOKEN=your-redis-token

# Feature Flags
PAYMENT_V2_ENABLED=false  # Start with false, enable incrementally

# Optional: Monitoring
SENTRY_DSN=your-sentry-dsn
```

### Environment Variable Validation

Run validation script before deployment:

```bash
npm run validate-config
```

This checks:
- All required variables are set
- PAYMENT_MODE is 'live' in production
- Secrets are properly formatted
- Provider credentials are valid

---

## Database Migrations

### Migration Files

Migrations are located in `supabase/migrations/`:

```
020-create-payments-table.sql
021-create-receipts-table.sql
022-create-payment-jobs-table.sql
023-enhance-payment-events.sql
024-add-indexes.sql
025-create-receipt-number-function.sql
```

### Running Migrations

#### Option 1: Supabase CLI

```bash
# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

#### Option 2: Supabase Dashboard

1. Go to Supabase Dashboard → SQL Editor
2. Copy contents of each migration file
3. Execute in order (020, 021, 022, etc.)
4. Verify each migration succeeds before proceeding

#### Option 3: Manual SQL

```bash
# Connect to database
psql postgresql://postgres:[password]@db.your-project.supabase.co:5432/postgres

# Run each migration
\i supabase/migrations/020-create-payments-table.sql
\i supabase/migrations/021-create-receipts-table.sql
\i supabase/migrations/022-create-payment-jobs-table.sql
\i supabase/migrations/023-enhance-payment-events.sql
\i supabase/migrations/024-add-indexes.sql
\i supabase/migrations/025-create-receipt-number-function.sql
```

### Verify Migrations

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('payments', 'receipts', 'payment_jobs', 'payment_events');

-- Check indexes
SELECT indexname FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('payments', 'receipts', 'payment_jobs', 'payment_events');

-- Check RPC function
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'get_next_receipt_number';

-- Test receipt number generation
SELECT get_next_receipt_number();
```

---

## Application Deployment

### Vercel Deployment

#### 1. Install Vercel CLI

```bash
npm install -g vercel
```

#### 2. Login to Vercel

```bash
vercel login
```

#### 3. Link Project

```bash
vercel link
```

#### 4. Set Environment Variables

```bash
# Set all environment variables
vercel env add PAYMENT_MODE production
vercel env add STRIPE_SECRET_KEY production
# ... repeat for all variables
```

Or use Vercel Dashboard:
1. Go to Project Settings → Environment Variables
2. Add all variables from `.env.production`
3. Set scope to "Production"

#### 5. Deploy to Production

```bash
# Deploy to production
vercel --prod

# Or use Git integration (recommended)
git push origin main  # Triggers automatic deployment
```

### Alternative Hosting (Docker)

#### 1. Build Docker Image

```bash
docker build -t payment-app:v2 .
```

#### 2. Run Container

```bash
docker run -d \
  --name payment-app \
  -p 3000:3000 \
  --env-file .env.production \
  payment-app:v2
```

#### 3. Use Docker Compose

```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    image: payment-app:v2
    ports:
      - "3000:3000"
    env_file:
      - .env.production
    restart: unless-stopped
```

```bash
docker-compose up -d
```

---

## Worker Deployment

### MVP: Inline Processing (Current)

No separate worker deployment needed. Receipt generation and email sending happen inline (fire-and-forget).

**Monitoring:**
- Check `receipt_failures` table for failed attempts
- Use admin interface at `/admin/receipts/failed` for manual retry

### Future: Job Queue (Optional)

When scaling beyond inline processing, choose one of these options:

#### Option 1: Vercel Cron (Requires Pro Plan)

1. Add cron configuration to `vercel.json`:

```json
{
  "crons": [{
    "path": "/api/cron/process-jobs",
    "schedule": "* * * * *"
  }]
}
```

2. Deploy with cron enabled:

```bash
vercel --prod
```

#### Option 2: Upstash QStash (Free Tier)

1. Sign up for Upstash QStash
2. Add environment variables:

```bash
QSTASH_URL=https://qstash.upstash.io
QSTASH_TOKEN=your-token
```

3. No additional deployment needed (serverless)

#### Option 3: Separate Worker Process

1. Create worker script:

```bash
# scripts/workers/payment-worker.ts
```

2. Deploy to separate server:

```bash
# On worker server
npm install
npm run worker
```

3. Use PM2 for process management:

```bash
pm2 start scripts/workers/payment-worker.ts --name payment-worker
pm2 save
pm2 startup
```

---

## Verification

### Post-Deployment Checks

#### 1. Health Check

```bash
curl https://your-domain.com/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00Z",
  "checks": {
    "database": { "status": "pass", "message": "OK" },
    "paymentConfig": { "status": "pass", "message": "OK" },
    "providers": { "status": "pass", "message": "OK" }
  }
}
```

#### 2. Configuration Validation

```bash
curl https://your-domain.com/api/config/validate
```

Should return no errors.

#### 3. Database Connectivity

```sql
-- Check recent donations
SELECT id, payment_status, created_at 
FROM donations 
ORDER BY created_at DESC 
LIMIT 10;

-- Check payment_events table
SELECT COUNT(*) FROM payment_events;

-- Check receipts table
SELECT COUNT(*) FROM receipts;
```

#### 4. Provider Connectivity

Test each provider:

**Stripe:**
```bash
curl https://api.stripe.com/v1/balance \
  -u sk_live_...:
```

**Khalti:**
```bash
curl https://khalti.com/api/v2/epayment/lookup/ \
  -H "Authorization: Key live_secret_key_..." \
  -H "Content-Type: application/json" \
  -d '{"pidx":"test"}'
```

**eSewa:**
```bash
curl https://epay.esewa.com.np/api/epay/transaction/status/ \
  -H "Content-Type: application/json" \
  -d '{"product_code":"MERCHANT_ID","transaction_uuid":"test"}'
```

#### 5. Webhook Endpoints

Test webhook endpoints (use provider test mode):

```bash
# Stripe webhook test
stripe trigger checkout.session.completed

# Check logs
vercel logs --prod
```

---

## Rollback Procedure

### Quick Rollback

#### Vercel

```bash
# List deployments
vercel ls

# Rollback to previous deployment
vercel rollback [deployment-url]
```

Or use Vercel Dashboard:
1. Go to Deployments
2. Find previous working deployment
3. Click "Promote to Production"

#### Docker

```bash
# Stop current container
docker stop payment-app

# Start previous version
docker run -d \
  --name payment-app \
  -p 3000:3000 \
  --env-file .env.production \
  payment-app:v1
```

### Database Rollback

**⚠️ Warning:** Database rollbacks are complex. Only rollback if absolutely necessary.

```sql
-- Rollback migrations (in reverse order)
BEGIN;

-- Drop new tables
DROP TABLE IF EXISTS payment_jobs;
DROP TABLE IF EXISTS receipts;
DROP TABLE IF EXISTS payments;

-- Revert payment_events changes
ALTER TABLE payment_events DROP COLUMN IF EXISTS event_type;
ALTER TABLE payment_events DROP COLUMN IF EXISTS raw_payload;
ALTER TABLE payment_events DROP COLUMN IF EXISTS processed_at;

-- Drop receipt number function
DROP FUNCTION IF EXISTS get_next_receipt_number();
DROP SEQUENCE IF EXISTS receipt_number_seq;

COMMIT;
```

### Feature Flag Rollback

Disable V2 without full rollback:

```bash
# Set feature flag to false
vercel env add PAYMENT_V2_ENABLED false production

# Redeploy
vercel --prod
```

This reverts to V1 code path without database changes.

---

## Troubleshooting

### Common Issues

#### 1. Webhook Signature Verification Fails

**Symptoms:**
- 401 errors in webhook logs
- Payments not confirming

**Solutions:**
- Verify `STRIPE_WEBHOOK_SECRET` is correct
- Check webhook endpoint URL in provider dashboard
- Ensure raw body is passed to verification (not parsed JSON)
- Check `PAYMENT_MODE` is set correctly

#### 2. Database Connection Errors

**Symptoms:**
- 500 errors
- "Connection refused" in logs

**Solutions:**
- Verify `SUPABASE_SERVICE_ROLE_KEY` is correct
- Check database is accessible from deployment environment
- Verify connection pooling settings
- Check Supabase project is not paused

#### 3. Receipt Generation Fails

**Symptoms:**
- Donations confirmed but no receipt
- Errors in `receipt_failures` table

**Solutions:**
- Check `RECEIPT_TOKEN_SECRET` is set
- Verify Supabase Storage bucket exists
- Check RPC function `get_next_receipt_number()` works
- Review error logs in `receipt_failures` table

#### 4. Email Sending Fails

**Symptoms:**
- Receipts generated but not emailed
- SMTP errors in logs

**Solutions:**
- Verify SMTP credentials
- Check SMTP port and host
- Enable "Less secure app access" (Gmail)
- Use app-specific password (Gmail)
- Check email rate limits

#### 5. Rate Limiting Issues

**Symptoms:**
- 429 errors
- "Rate limit exceeded" messages

**Solutions:**
- Verify Redis connection (`UPSTASH_REDIS_URL`)
- Check Redis token is valid
- Adjust rate limit thresholds if needed
- Monitor Redis usage in Upstash dashboard

### Debug Mode

Enable debug logging:

```bash
# Add to environment variables
DEBUG=payment:*
LOG_LEVEL=debug
```

View logs:

```bash
# Vercel
vercel logs --prod --follow

# Docker
docker logs -f payment-app

# PM2
pm2 logs payment-worker
```

### Support Contacts

- **Database Issues:** Supabase support
- **Deployment Issues:** Vercel support
- **Provider Issues:** Stripe/Khalti/eSewa support
- **Application Issues:** Development team

---

## Deployment Checklist

### Pre-Deployment

- [ ] All tests passing (`npm test`)
- [ ] Code reviewed and approved
- [ ] Environment variables configured
- [ ] Database migrations tested in staging
- [ ] Provider credentials verified
- [ ] Backup database
- [ ] Notify team of deployment window

### Deployment

- [ ] Run database migrations
- [ ] Deploy application code
- [ ] Verify health check passes
- [ ] Test webhook endpoints
- [ ] Verify provider connectivity
- [ ] Check logs for errors

### Post-Deployment

- [ ] Monitor error rates (first 30 minutes)
- [ ] Test end-to-end payment flow
- [ ] Verify receipts generating
- [ ] Verify emails sending
- [ ] Check no stuck donations
- [ ] Update documentation
- [ ] Notify team of successful deployment

### Rollback Criteria

Rollback if:
- Error rate > 5%
- Webhook failure rate > 10%
- Database errors
- Payment confirmations failing
- Critical security issue discovered

---

## Incremental Rollout

### Phase 1: Staging (Week 1)

1. Deploy to staging environment
2. Run smoke tests
3. Enable `PAYMENT_V2_ENABLED=true`
4. Monitor for 1 week
5. Fix any issues

### Phase 2: Production Canary (Week 2)

1. Deploy to production
2. Keep `PAYMENT_V2_ENABLED=false`
3. Enable for 10% of traffic
4. Monitor metrics
5. Increase to 25% if stable

### Phase 3: Production Rollout (Week 3)

1. Increase to 50% of traffic
2. Monitor for 2 days
3. Increase to 75% of traffic
4. Monitor for 2 days
5. Increase to 100% of traffic

### Phase 4: Cleanup (Week 4)

1. Remove V1 fallback code
2. Remove `PAYMENT_V2_ENABLED` flag
3. Drop deprecated database columns
4. Update documentation

---

## Monitoring

### Key Metrics

- **Webhook Success Rate:** > 95%
- **Confirmation Latency:** < 1 second
- **Receipt Generation Success:** > 98%
- **Email Send Success:** > 95%
- **Error Rate:** < 1%

### Alerts

Set up alerts for:
- Webhook failure rate > 5%
- Confirmation latency > 2 seconds
- Receipt generation failure rate > 5%
- Email send failure rate > 10%
- Donations stuck in PENDING > 1 hour
- Donations stuck in REVIEW > 24 hours

### Dashboards

Monitor:
- Vercel Analytics
- Supabase Dashboard
- Provider dashboards (Stripe, Khalti, eSewa)
- Upstash Redis metrics
- Custom monitoring dashboard (`/admin/monitoring`)

---

**Last Updated:** 2024-01-01
**Version:** 2.0.0
