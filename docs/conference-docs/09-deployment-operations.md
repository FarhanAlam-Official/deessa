# DEESSA Foundation — Conference Module: Deployment & Operations Manual

> **Version:** 1.0.0  
> **Last Updated:** February 28, 2026  
> **Audience:** DevOps Engineers, System Administrators, Operations Staff

---

## Table of Contents

1. [Environment Variables](#1-environment-variables)
2. [Deployment Procedures](#2-deployment-procedures)
3. [Operational Runbooks](#3-operational-runbooks)
4. [Monitoring & Alerts](#4-monitoring--alerts)
5. [Backup & Recovery](#5-backup--recovery)
6. [Troubleshooting Guide](#6-troubleshooting-guide)

---

## 1. Environment Variables

### 1.1 Complete Environment Variables List

```env
# ============================================
# Next.js
# ============================================
NODE_ENV=production
NEXT_PUBLIC_SITE_URL=https://deessa.org

# ============================================
# Supabase (Database + Auth)
# ============================================
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUz...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ============================================
# Email (Gmail SMTP)
# ============================================
GOOGLE_EMAIL=noreply@deessa.org
GOOGLE_EMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx

# ============================================
# Stripe (Global Payments)
# ============================================
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# ============================================
# Khalti (Nepal Payments)
# ============================================
KHALTI_SECRET_KEY=live_secret_key_...
KHALTI_PUBLIC_KEY=live_public_key_...

# ============================================
# eSewa (Nepal Payments)
# ============================================
ESEWA_MERCHANT_CODE=EPAYTEST
ESEWA_SECRET_KEY=8gBm...
ESEWA_ENVIRONMENT=production

# ============================================
# Cron Jobs
# ============================================
CRON_SECRET=your-secure-random-string-here

# ============================================
# Optional: Error Tracking
# ============================================
SENTRY_DSN=https://...@sentry.io/...
```

### 1.2 Environment Variable Reference

| Variable | Required | Visibility | Description |
|---|---|---|---|
| **NODE_ENV** | Yes | Server | `development` / `production` |
| **NEXT_PUBLIC_SITE_URL** | Yes | Both | Base URL (used in emails, redirects) |
| **NEXT_PUBLIC_SUPABASE_URL** | Yes | Both | Supabase project URL |
| **NEXT_PUBLIC_SUPABASE_ANON_KEY** | Yes | Both | Public anon key (safe to expose) |
| **SUPABASE_SERVICE_ROLE_KEY** | Yes | Server | Service role key (NEVER expose to client) |
| **GOOGLE_EMAIL** | Yes | Server | Gmail account for sending emails |
| **GOOGLE_EMAIL_APP_PASSWORD** | Yes | Server | Gmail app-specific password |
| **STRIPE_SECRET_KEY** | Conditional | Server | Stripe secret key (live or test) |
| **STRIPE_PUBLISHABLE_KEY** | Conditional | Both | Stripe publishable key |
| **STRIPE_WEBHOOK_SECRET** | Conditional | Server | Stripe webhook signing secret |
| **KHALTI_SECRET_KEY** | Conditional | Server | Khalti API secret key |
| **KHALTI_PUBLIC_KEY** | Conditional | Both | Khalti public key |
| **ESEWA_MERCHANT_CODE** | Conditional | Server | eSewa merchant/product code |
| **ESEWA_SECRET_KEY** | Conditional | Server | eSewa signing secret |
| **ESEWA_ENVIRONMENT** | Conditional | Server | `production` / `development` |
| **CRON_SECRET** | Yes | Server | Random string for cron auth |
| **SENTRY_DSN** | Optional | Server | Error tracking endpoint |

**Conditional**: At least ONE payment provider must be configured (Stripe, Khalti, or eSewa).

### 1.3 How to Obtain Keys

**Supabase**:

1. Go to [supabase.com](https://supabase.com)
2. Select project → Settings → API
3. Copy `URL`, `anon key`, and `service_role key`

**Gmail SMTP**:

1. Enable 2FA on Google account
2. Go to Security → App passwords
3. Generate app password for "Mail"
4. Use generated 16-character password (spaces included)

**Stripe**:

1. Go to [dashboard.stripe.com](https://dashboard.stripe.com)
2. Developers → API keys
3. Copy `Secret key` and `Publishable key`
4. Webhooks → Add endpoint → Copy signing secret

**Khalti**:

1. Go to [khalti.com](https://khalti.com) merchant dashboard
2. Request live keys from Khalti support
3. Copy `Secret Key` and `Public Key`

**eSewa**:

1. Contact [esewa.com.np](https://esewa.com.np) merchant support
2. Complete KYC verification
3. Receive `Merchant Code` and `Secret Key`

### 1.4 Environment Variable Security

**Rotation Schedule**:

| Key Type | Rotation Frequency | Procedure |
|---|---|---|
| Database keys | Annually | Rotate in Supabase dashboard → Update Vercel |
| Payment gateway keys | Annually or after breach | Rotate in gateway dashboard → Update Vercel |
| CRON_SECRET | Annually | Generate new random string → Update Vercel + cron config |
| Email password | On security alert | Regenerate app password → Update Vercel |

**Access Control**:

- Only DevOps team has access to production environment variables
- Test keys can be shared with developers
- Production keys stored in Vercel (encrypted at rest)
- Local `.env.local` files excluded in `.gitignore` (never committed)

**Vercel Storage**:

```bash
# Set variable in Vercel
vercel env add STRIPE_SECRET_KEY production

# Pull variables to local
vercel env pull .env.local
```

---

## 2. Deployment Procedures

### 2.1 Production Deployment Checklist

**Pre-Deployment**:

- [ ] Run tests locally (`npm test`)
- [ ] Check for TypeScript errors (`npm run build`)
- [ ] Review database migrations (if any)
- [ ] Verify all environment variables set in Vercel
- [ ] Create backup of current database (manual export)
- [ ] Notify stakeholders of deployment window

**Deployment**:

- [ ] Merge PR to `main` branch
- [ ] Vercel auto-deploys (monitor build logs)
- [ ] Build completes successfully (~2-5 minutes)
- [ ] Automatic deployment to production

**Post-Deployment**:

- [ ] Verify homepage loads (`https://deessa.org`)
- [ ] Test conference landing page (`/conference`)
- [ ] Test registration form (submit one test registration)
- [ ] Verify admin dashboard loads (`/admin/conference`)
- [ ] Check error logs in Vercel dashboard (first 10 minutes)
- [ ] Send "Deployment Complete" notification

**Rollback Procedure** (if issues detected):

```bash
# Via Vercel Dashboard
1. Go to Deployments tab
2. Find previous working deployment
3. Click "..." → "Promote to Production"

# Via CLI
vercel rollback
```

### 2.2 Database Migration Procedure

**Step-by-Step**:

1. **Write Migration Script**:

```sql
-- scripts/migrations/018-add-conference-field.sql
ALTER TABLE conference_registrations
ADD COLUMN new_field text;

CREATE INDEX idx_new_field ON conference_registrations(new_field);
```

1. **Test in Development**:

```bash
# Connect to local Supabase
psql $DEV_DATABASE_URL -f scripts/migrations/018-add-conference-field.sql
```

1. **Backup Production Database**:

```bash
# Via Supabase Dashboard
Projects → [Project] → Database → Backups → "Backup Now"
```

1. **Apply to Production**:

```bash
# Via Supabase SQL Editor (recommended)
# Copy/paste migration script → Run

# OR via CLI
psql $SUPABASE_DATABASE_URL -f scripts/migrations/018-add-conference-field.sql
```

1. **Verify**:

```sql
-- Check column exists
SELECT new_field FROM conference_registrations LIMIT 1;

-- Check index exists
SELECT * FROM pg_indexes WHERE tablename = 'conference_registrations';
```

1. **Deploy Code**:

```bash
# Merge code that uses new column
git push origin main
```

### 2.3 Vercel Configuration

**vercel.json**:

```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "pnpm install",
  "framework": "nextjs",
  "crons": [
    {
      "path": "/api/cron/expire-conference-registrations",
      "schedule": "0 * * * *"
    }
  ]
}
```

**Cron Schedule Format** (Unix cron):

```
 ┌─ minute (0-59)
 │ ┌─ hour (0-23)
 │ │ ┌─ day of month (1-31)
 │ │ │ ┌─ month (1-12)
 │ │ │ │ ┌─ day of week (0-6, Sunday=0)
 │ │ │ │ │
 * * * * *
```

Examples:

- `0 * * * *` - Every hour at minute 0
- `*/15 * * * *` - Every 15 minutes
- `0 9 * * *` - Daily at 9 AM
- `0 0 * * 0` - Weekly on Sunday at midnight

---

## 3. Operational Runbooks

### 3.1 Runbook: Payment Webhook Failed

**Symptom**: User paid but registration still shows "Awaiting Payment"

**Diagnosis**:

```bash
# Check webhook logs in Stripe Dashboard
1. Developers → Webhooks → [Endpoint] → Events
2. Look for failed deliveries (red X)
3. Note event ID (e.g., evt_...)

# Check payment_events table
SELECT * FROM payment_events WHERE event_id = 'evt_...';
# If no row: webhook never reached server
```

**Resolution**:

```bash
# Option 1: Manual verification via admin dashboard
1. Go to /admin/conference/[id]
2. Click "Mark as Paid (Override)"
3. Confirm action
4. System updates status + sends confirmation email

# Option 2: Replay webhook manually
# In Stripe Dashboard:
1. Find failed event
2. Click "..." → "Resend event"
3. Monitor server logs for processing

# Option 3: Direct SQL (last resort)
UPDATE conference_registrations
SET 
  status = 'confirmed',
  payment_status = 'paid',
  payment_provider = 'stripe',
  payment_id = 'stripe:cs_live_...',
  updated_at = now()
WHERE id = 'registration-uuid-here';

# Then manually send email
# Via admin dashboard: Send Custom Email
```

---

### 3.2 Runbook: Email Not Sent

**Symptom**: User registered but didn't receive email

**Diagnosis**:

```bash
# Check Vercel logs
vercel logs --since 1h | grep "Email send failed"

# Check Gmail SMTP status
# Visit: https://www.google.com/appsstatus
# Look for Gmail service issues

# Check daily send limit
# Gmail allows 2000 emails/day from Workspace accounts
# Check if limit hit (unlikely for conferences)
```

**Resolution**:

```bash
# Resend email via admin dashboard
1. Go to /admin/conference/[id]
2. Quick Actions → "Send Custom Email"
3. Select template (Registration/Confirmation)
4. Click "Send"

# Verify email address
# Common issues:
# - Typo in email (user entered wrong email)
# - Email in spam folder (user should check)
# - Invalid email domain (bounced)

# Check user's spam folder
# Ask user to check spam/junk folder
# Add noreply@deessa.org to contacts
```

---

### 3.3 Runbook: Registration Expired by Mistake

**Symptom**: User paid within 24 hours but cron marked as expired

**Diagnosis**:

```bash
# Check registration record
SELECT 
  id, status, payment_status, expires_at, created_at, updated_at
FROM conference_registrations
WHERE id = 'registration-uuid';

# Check payment_events
SELECT * FROM payment_events
WHERE conference_registration_id = 'registration-uuid'
ORDER BY created_at DESC;

# Likely cause: Payment webhook arrived AFTER expiry cron ran
```

**Resolution**:

```bash
# Option 1: Admin force confirm
1. Go to /admin/conference/[id]
2. Click "Force Confirm"
3. System overrides expiry + confirms

# Option 2: Extend expiry + wait for webhook
1. Click "Extend Expiry +24h"
2. If webhook is delayed, it will confirm when it arrives

# Option 3: Direct SQL (if payment verified in Stripe)
UPDATE conference_registrations
SET 
  status = 'confirmed',
  payment_status = 'paid',
  expires_at = NULL,
  updated_at = now()
WHERE id = 'registration-uuid';
```

---

### 3.4 Runbook: Cron Job Not Running

**Symptom**: Registrations past 24 hours still show "Pending Payment"

**Diagnosis**:

```bash
# Check Vercel cron logs
vercel logs --since 24h | grep "/api/cron/"

# Check cron configuration
# vercel.json should have:
{
  "crons": [{
    "path": "/api/cron/expire-conference-registrations",
    "schedule": "0 * * * *"
  }]
}

# Test cron endpoint manually
curl https://deessa.org/api/cron/expire-conference-registrations \
  -H "Authorization: Bearer $CRON_SECRET"

# Should return:
# {"ok":true,"expired":N,"timestamp":"..."}
```

**Resolution**:

```bash
# If cron disabled in Vercel
1. Vercel Dashboard → Project Settings → Cron Jobs
2. Ensure "Enable Cron Jobs" is checked

# If CRON_SECRET wrong/missing
1. Vercel → Settings → Environment Variables
2. Verify CRON_SECRET is set
3. Update vercel.json if needed
4. Redeploy

# Manual expiry (temporary fix)
# Via Supabase SQL Editor:
UPDATE conference_registrations
SET status = 'expired', updated_at = now()
WHERE status IN ('pending_payment', 'pending')
  AND payment_status = 'unpaid'
  AND expires_at < now()
  AND expires_at IS NOT NULL;
```

---

### 3.5 Runbook: Amount Mismatch (Review Status)

**Symptom**: Payment received but registration shows "Review" status

**Diagnosis**:

```bash
# Check registration
SELECT 
  payment_amount, payment_currency, payment_provider, payment_id, payment_status
FROM conference_registrations
WHERE id = 'registration-uuid';

# Get Stripe session (if Stripe)
# Via Stripe Dashboard:
1. Payments → Search by session ID (from payment_id)
2. Check amount charged vs. expected

# Possible causes:
# - Settings changed mid-payment
# - Currency mismatch (NPR vs USD)
# - Partial payment / refund
```

**Resolution**:

```bash
# Verify amount with gateway
# If amount is correct:
1. Admin dashboard → "Mark as Paid"
2. Updates status to 'confirmed'

# If amount is wrong:
1. Initiate refund via payment gateway dashboard
2. Admin dashboard → "Cancel Registration"
3. Ask user to register again with correct amount

# Update DB if needed
UPDATE conference_registrations
SET payment_status = 'paid', status = 'confirmed'
WHERE id = 'registration-uuid' AND payment_amount = (verified_amount);
```

---

## 4. Monitoring & Alerts

### 4.1 Key Metrics to Monitor

| Metric | Tool | Alert Threshold | Action |
|---|---|---|---|
| **Error Rate** | Vercel / Sentry | >5% of requests | Check logs, investigate |
| **Build Failures** | Vercel | Any failure | Fix build errors immediately |
| **Database CPU** | Supabase | >80% sustained | Upgrade tier or optimize queries |
| **Email Failures** | Application logs | >10% failure rate | Check SMTP status, daily limit |
| **Payment Failures** | Gateway dashboards | >20% decline rate | Check gateway status, amounts |
| **Cron Job Failures** | Vercel logs | Missed execution | Check CRON_SECRET, redeploy |
| **Page Load Time** | Vercel Analytics | >3 seconds p95 | Optimize queries, add caching |

### 4.2 Recommended Alerting Setup

**Using Vercel Log Drains** (forward logs to external service):

```bash
# Add log drain (e.g., to Logtail, Datadog)
vercel integrations add logtail

# Or manual webhook
vercel log-drains add <webhook-url>
```

**Email Alerts**:

```bash
# Set up notification rules in Vercel
# Dashboard → Project → Settings → Notifications
# - Deployment failure
# - Domain errors
# - Function errors (>10 in 5 min)
```

**Uptime Monitoring** (external):

- Use UptimeRobot or Pingdom
- Monitor: `https://deessa.org/conference`
- Alert if down >2 minutes

### 4.3 Log Analysis Queries

**View recent errors**:

```bash
vercel logs --since 1h | grep "ERROR"
```

**View payment API calls**:

```bash
vercel logs --since 24h | grep "/api/conference/start-payment"
```

**View cron execution**:

```bash
vercel logs --since 7d | grep "/api/cron/"
```

**View database connection errors**:

```bash
vercel logs --since 1h | grep "ECONNREFUSED"
```

---

## 5. Backup & Recovery

### 5.1 Backup Strategy

| Data | Backup Method | Frequency | Retention | Owner |
|---|---|---|---|---|
| Database | Supabase auto-backup | Daily | 7 days | Supabase |
| Database | Manual SQL export | Weekly | 30 days | DevOps team |
| Registration CSV | Admin export | Before each event | Indefinite | Program staff |
| Code | Git repository | On every commit | Indefinite | Git hosting |
| Environment variables | Documented | On changes | Indefinite | DevOps team (secure storage) |

### 5.2 Database Backup Procedure

**Automatic** (Supabase Pro):

- Daily snapshots (retained 7 days)
- Point-in-time recovery (PITR) to any second in last 7 days

**Manual Export**:

```bash
# Via Supabase Dashboard
1. Database → Tables → conference_registrations
2. Click "..." → Export as CSV

# Via psql
pg_dump $SUPABASE_DATABASE_URL \
  --table=conference_registrations \
  --data-only \
  --file=backup-$(date +%Y%m%d).sql

# Via SQL
COPY (SELECT * FROM conference_registrations) 
TO '/tmp/registrations.csv' CSV HEADER;
```

### 5.3 Restore Procedure

**From Supabase Backup** (Pro tier):

```bash
1. Supabase Dashboard → Database → Backups
2. Select backup date
3. Click "Restore"
4. Confirm (WARNING: overwrites current data)

# OR Point-in-time recovery:
# Contact Supabase support with exact timestamp
```

**From Manual SQL Export**:

```bash
# Restore single table
psql $SUPABASE_DATABASE_URL -f backup-20260228.sql

# Restore with data only (preserves schema)
psql $SUPABASE_DATABASE_URL -c "TRUNCATE conference_registrations;"
psql $SUPABASE_DATABASE_URL -c "\\COPY conference_registrations FROM 'backup.csv' CSV HEADER;"
```

### 5.4 Disaster Recovery Plan

**Scenario 1: Database Corruption**

- **RPO**: 24 hours (daily backup)
- **RTO**: 2 hours (restore time)
- **Procedure**: Restore from latest Supabase backup

**Scenario 2: Accidental DELETE**

- **RPO**: 5 minutes (PITR available)
- **RTO**: 1 hour (PITR restore + verification)
- **Procedure**: Use point-in-time recovery to 5 min before DELETE

**Scenario 3: Vercel Account Compromise**

- **RPO**: 0 (code in Git)
- **RTO**: 2 hours (deploy to new account)
- **Procedure**:
  1. Create new Vercel account
  2. Import project from Git
  3. Set environment variables
  4. Update DNS records

**Scenario 4: Complete Data Loss**

- **RPO**: 24 hours (backup interval)
- **RTO**: 4 hours (restore + verify)
- **Procedure**:
  1. Restore database from latest backup
  2. Redeploy application from Git
  3. Verify all services operational
  4. Notify affected users (if data loss occurred)

---

## 6. Troubleshooting Guide

### 6.1 Common Issues

| Issue | Symptoms | Solution |
|---|---|---|
| **Build fails** | Vercel shows "Build Failed" | Check logs for TypeScript/ESLint errors; fix and redeploy |
| **500 errors** | Pages show "Internal Server Error" | Check Vercel logs; likely database connection or missing env var |
| **Slow page loads** | Pages take >5 seconds | Check Supabase database CPU; add indexes; optimize queries |
| **Payment not confirming** | Stuck in "Processing" | Check webhook logs; manually confirm via admin dashboard |
| **Emails not sending** | No emails received | Check SMTP settings; verify Gmail app password; check spam |
| **Cron not executing** | Registrations don't expire | Check CRON_SECRET; test endpoint manually; check Vercel logs |
| **Rate limiting hit** | 429 errors | Wait for rate limit window to reset; upgrade rate limit logic |
| **Database connection errors** | "ECONNREFUSED" in logs | Check Supabase status; verify connection pooling; restart functions |

### 6.2 Debug Commands

**Check environment variables**:

```bash
vercel env ls
```

**View real-time logs**:

```bash
vercel logs --follow
```

**Test database connection**:

```bash
psql $SUPABASE_DATABASE_URL -c "SELECT 1;"
```

**Test SMTP connection**:

```bash
# Via Node.js REPL
node -e "require('nodemailer').createTransport({host:'smtp.gmail.com',port:587,auth:{user:process.env.GOOGLE_EMAIL,pass:process.env.GOOGLE_EMAIL_APP_PASSWORD}}).verify().then(console.log).catch(console.error)"
```

**Test payment gateway API**:

```bash
# Stripe
curl https://api.stripe.com/v1/balance \
  -u $STRIPE_SECRET_KEY:

# Khalti
curl https://khalti.com/api/v2/merchant-transaction/ \
  -H "Authorization: Key $KHALTI_SECRET_KEY"
```

---

## Related Documentation

- **Previous**: [08: Security](08-security.md)
- **Next**: [10: Improvements & Risks](10-improvements-risks.md)
- **See Also**: [01: Overview](01-overview.md), [05: API Documentation](05-api-documentation.md)

---

**Document Maintained By**: Development Partner  
**Last Reviewed**: February 28, 2026  
**Next Review**: After next major deployment or incident
