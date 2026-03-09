# Staging Deployment Checklist - Payment Architecture V2

## Pre-Deployment (1-2 hours before)

### Code Preparation
- [ ] All tests passing locally (`npm test -- --run`)
- [ ] No uncommitted changes or commit all changes
- [ ] Code reviewed and approved
- [ ] Branch merged to staging branch (if using separate branch)

### Environment Setup
- [ ] Staging environment variables configured in Vercel
- [ ] `PAYMENT_V2_ENABLED=false` set (will enable after smoke tests)
- [ ] `PAYMENT_MODE=mock` or `test` (use test provider keys)
- [ ] All provider test credentials configured
- [ ] `RECEIPT_TOKEN_SECRET` generated and set
- [ ] Email SMTP credentials configured
- [ ] Supabase staging project accessible

### Database Preparation
- [ ] Backup staging database (optional but recommended)
- [ ] Verify database connection from local machine
- [ ] Review migration scripts in `scripts/payments-v2/`

## Deployment Execution (30-60 minutes)

### Step 1: Database Migrations

**Time: 10-15 minutes**

- [ ] Open Supabase SQL Editor for staging project
- [ ] Execute migration: `020-create-payments-table.sql`
  - [ ] Verify no errors
  - [ ] Check table created: `SELECT * FROM payments LIMIT 1;`
- [ ] Execute migration: `021-create-receipts-table.sql`
  - [ ] Verify no errors
  - [ ] Check table created: `SELECT * FROM receipts LIMIT 1;`
- [ ] Execute migration: `023-enhance-payment-events.sql`
  - [ ] Verify no errors
  - [ ] Check columns added: `\d payment_events`
- [ ] Execute migration: `024-add-indexes.sql`
  - [ ] Verify no errors
  - [ ] Check indexes: `\di idx_*`
- [ ] Execute migration: `025-atomic-receipt-number.sql`
  - [ ] Verify no errors
  - [ ] Test function: `SELECT get_next_receipt_number();`
- [ ] Execute migration: `026-create-receipt-failures-table.sql`
  - [ ] Verify no errors
  - [ ] Check table created: `SELECT * FROM receipt_failures LIMIT 1;`
- [ ] Execute migration: `027-create-email-failures-table.sql`
  - [ ] Verify no errors
  - [ ] Check table created: `SELECT * FROM email_failures LIMIT 1;`

**Verification Query:**
```sql
-- Should return 5 tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('payments', 'receipts', 'payment_events', 'receipt_failures', 'email_failures');
```

### Step 2: Application Deployment

**Time: 10-15 minutes**

- [ ] Run build locally: `npm run build`
  - [ ] Verify no build errors
  - [ ] Check bundle size is reasonable
- [ ] Deploy to Vercel staging:
  - Option A: `vercel --env=preview` (CLI)
  - Option B: Push to staging branch (Git integration)
- [ ] Wait for deployment to complete
- [ ] Note deployment URL
- [ ] Check deployment logs for errors

### Step 3: Worker Deployment

**Time: 1 minute**

- [ ] Confirm using MVP inline processing (no separate worker)
- [ ] Note: Worker deployment not needed for MVP

### Step 4: Initial Verification

**Time: 5-10 minutes**

- [ ] Health check: `curl https://staging-url/api/health`
  - [ ] Status: `healthy`
  - [ ] Database check: `pass`
  - [ ] Payment config check: `pass`
- [ ] Configuration validation: `curl https://staging-url/api/config/validate`
  - [ ] No errors returned
- [ ] Check application loads: Open staging URL in browser
  - [ ] Homepage loads
  - [ ] No console errors
  - [ ] Donation form accessible

## Post-Deployment Verification (30-45 minutes)

### Smoke Tests

**Time: 30-45 minutes**

Run smoke tests (see task 28.2):

- [ ] Test Stripe payment flow (test mode)
  - [ ] Create donation
  - [ ] Complete payment with test card
  - [ ] Verify webhook received
  - [ ] Check donation status: CONFIRMED
  - [ ] Verify receipt generated
  - [ ] Check email sent
  
- [ ] Test Khalti payment flow (test mode)
  - [ ] Create donation
  - [ ] Complete payment with test credentials
  - [ ] Verify callback received
  - [ ] Check donation status: CONFIRMED
  - [ ] Verify receipt generated
  - [ ] Check email sent
  
- [ ] Test eSewa payment flow (test mode)
  - [ ] Create donation
  - [ ] Complete payment with test credentials
  - [ ] Verify callback received
  - [ ] Check donation status: CONFIRMED
  - [ ] Verify receipt generated
  - [ ] Check email sent

### Database Verification

- [ ] Check donations table:
  ```sql
  SELECT id, payment_status, provider, created_at 
  FROM donations 
  ORDER BY created_at DESC 
  LIMIT 10;
  ```
- [ ] Check payments table:
  ```sql
  SELECT * FROM payments ORDER BY created_at DESC LIMIT 5;
  ```
- [ ] Check receipts table:
  ```sql
  SELECT * FROM receipts ORDER BY created_at DESC LIMIT 5;
  ```
- [ ] Check payment_events table:
  ```sql
  SELECT * FROM payment_events ORDER BY created_at DESC LIMIT 10;
  ```
- [ ] Check no stuck donations:
  ```sql
  SELECT COUNT(*) FROM donations 
  WHERE payment_status = 'PENDING' 
  AND created_at < NOW() - INTERVAL '1 hour';
  ```
  - [ ] Count should be 0 or very low

### Error Tracking Verification

- [ ] Check receipt_failures table is empty:
  ```sql
  SELECT * FROM receipt_failures;
  ```
- [ ] Check email_failures table is empty:
  ```sql
  SELECT * FROM email_failures;
  ```
- [ ] Access admin interface: `https://staging-url/admin/receipts/failed`
  - [ ] Page loads
  - [ ] Shows "No failed receipts" or similar

### Monitoring Setup

- [ ] Vercel logs accessible: `vercel logs --env=preview`
- [ ] Supabase logs accessible in dashboard
- [ ] Error tracking configured (if using Sentry)
- [ ] Set up alerts for:
  - [ ] Webhook failures
  - [ ] Receipt generation failures
  - [ ] Email send failures

## Enable V2 (After successful smoke tests)

**Time: 5 minutes**

- [ ] Set `PAYMENT_V2_ENABLED=true` in Vercel staging environment
- [ ] Redeploy or wait for automatic redeployment
- [ ] Verify V2 is active:
  ```bash
  curl https://staging-url/api/health | jq '.features.paymentV2Enabled'
  ```
  - [ ] Should return `true`

### V2 Verification

- [ ] Repeat smoke tests with V2 enabled
- [ ] Monitor webhook processing:
  ```sql
  SELECT event_type, COUNT(*) 
  FROM payment_events 
  WHERE created_at > NOW() - INTERVAL '1 hour'
  GROUP BY event_type;
  ```
- [ ] Check PaymentService is being used (check logs)
- [ ] Verify no errors in logs

## Monitoring Period (24-48 hours)

### Continuous Monitoring

- [ ] Monitor error rates every 4 hours
- [ ] Check webhook success rate
- [ ] Check receipt generation success rate
- [ ] Check email send success rate
- [ ] Review stuck donations daily

### Metrics to Track

- [ ] Total donations processed
- [ ] Payment confirmation success rate (target: >99%)
- [ ] Receipt generation success rate (target: >98%)
- [ ] Email send success rate (target: >95%)
- [ ] Average webhook response time (target: <2s)
- [ ] Average confirmation latency (target: <1s)

### Daily Checks

**Day 1:**
- [ ] Morning: Review overnight metrics
- [ ] Afternoon: Check for any stuck donations
- [ ] Evening: Review error logs

**Day 2:**
- [ ] Morning: Review overnight metrics
- [ ] Afternoon: Final verification
- [ ] Evening: Prepare production deployment plan

## Rollback Procedure (If Needed)

### Application Rollback

- [ ] Identify issue and severity
- [ ] If critical, rollback immediately:
  ```bash
  vercel rollback [previous-deployment-url]
  ```
- [ ] Or disable V2:
  - [ ] Set `PAYMENT_V2_ENABLED=false`
  - [ ] Redeploy

### Database Rollback (Only if absolutely necessary)

⚠️ **Warning:** Database rollback should be last resort

- [ ] Restore database backup (if taken)
- [ ] Or execute rollback script:
  ```sql
  -- See scripts/payments-v2/README.md for rollback commands
  ```

## Sign-Off

### Deployment Team

- [ ] Developer: _________________ Date: _______
- [ ] QA: _________________ Date: _______
- [ ] DevOps: _________________ Date: _______

### Approval for Production

- [ ] All smoke tests passed
- [ ] No critical errors in 48-hour monitoring period
- [ ] Performance metrics meet targets
- [ ] Team consensus to proceed to production

**Approved by:** _________________ Date: _______

## Notes

Use this section to document any issues, workarounds, or observations during staging deployment:

```
[Add notes here]
```

---

**Deployment Date:** _________________

**Deployment Time:** _________________

**Deployed By:** _________________

**Staging URL:** _________________

**Supabase Project:** _________________
