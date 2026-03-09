# Production Deployment Checklist - Payment Architecture V2

## ⚠️ CRITICAL: Read Before Proceeding

This checklist is for deploying Payment Architecture V2 to **PRODUCTION** with real financial transactions. Follow every step carefully.

**Prerequisites:**
- ✅ Staging deployment successful
- ✅ All smoke tests passed in staging
- ✅ Staging monitored for 24-48 hours with no critical issues
- ✅ Team approval obtained
- ✅ Deployment window scheduled
- ✅ Rollback plan prepared

---

## Pre-Deployment (2-4 hours before)

### Team Coordination
- [ ] Deployment window scheduled and communicated
- [ ] All team members notified
- [ ] On-call engineer identified
- [ ] Rollback authority designated
- [ ] Communication channels ready (Slack, email, etc.)

### Code Preparation
- [ ] All tests passing locally (`npm test -- --run`)
- [ ] No uncommitted changes
- [ ] On main/master branch
- [ ] Latest code pulled from repository
- [ ] Code reviewed and approved
- [ ] Version tagged in git (e.g., `v2.0.0`)

### Environment Verification
- [ ] Production environment variables verified
- [ ] `PAYMENT_MODE=live` confirmed
- [ ] `PAYMENT_V2_ENABLED=false` set (will enable incrementally)
- [ ] All provider LIVE credentials configured
- [ ] `RECEIPT_TOKEN_SECRET` generated and set
- [ ] Email SMTP credentials verified
- [ ] Supabase production project accessible
- [ ] All secrets rotated within last 90 days

### Database Preparation
- [ ] **CRITICAL: Production database backed up**
- [ ] Backup verified and downloadable
- [ ] Backup restoration tested (if possible)
- [ ] Database connection verified
- [ ] Migration scripts reviewed
- [ ] Rollback scripts prepared

### Monitoring Setup
- [ ] Error tracking configured (Sentry, etc.)
- [ ] Log aggregation ready
- [ ] Alert thresholds configured
- [ ] Dashboard access verified
- [ ] On-call rotation configured

---

## Deployment Execution (1-2 hours)

### Step 1: Database Migrations

**Time: 15-30 minutes**

⚠️ **CRITICAL: Backup database before proceeding**

- [ ] **BACKUP PRODUCTION DATABASE**
- [ ] Verify backup completed successfully
- [ ] Open Supabase SQL Editor for production project
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

**If any migration fails:**
- [ ] STOP immediately
- [ ] Do NOT proceed with deployment
- [ ] Review error message
- [ ] Consult with team
- [ ] Consider rollback

### Step 2: Application Deployment

**Time: 15-30 minutes**

- [ ] Run build locally: `npm run build`
  - [ ] Verify no build errors
  - [ ] Check bundle size is reasonable
- [ ] Tag release in git:
  ```bash
  git tag -a v2.0.0 -m "Payment Architecture V2 Production Release"
  git push origin v2.0.0
  ```
- [ ] Deploy to Vercel production:
  ```bash
  vercel --prod
  ```
- [ ] Wait for deployment to complete
- [ ] Note deployment URL and ID
- [ ] Check deployment logs for errors

### Step 3: Worker Deployment

**Time: 1 minute**

- [ ] Confirm using MVP inline processing (no separate worker)
- [ ] Note: Worker deployment not needed for MVP

### Step 4: Initial Verification

**Time: 10-15 minutes**

- [ ] Wait 30 seconds for deployment to propagate
- [ ] Health check: `curl https://production-url/api/health`
  - [ ] Status: `healthy`
  - [ ] Database check: `pass`
  - [ ] Payment config check: `pass`
  - [ ] V2 enabled: `false` (should be disabled initially)
- [ ] Configuration validation: `curl https://production-url/api/config/validate`
  - [ ] No errors returned
- [ ] Check application loads: Open production URL in browser
  - [ ] Homepage loads
  - [ ] No console errors
  - [ ] Donation form accessible
- [ ] Verify existing V1 flow still works:
  - [ ] Create test donation (small amount)
  - [ ] Complete payment
  - [ ] Verify success
  - [ ] Check receipt received

---

## Post-Deployment Monitoring (First 2 hours)

### Immediate Checks (First 15 minutes)

- [ ] Monitor error rates in real-time
- [ ] Check webhook processing (should use V1)
- [ ] Verify no spike in errors
- [ ] Check database connections stable
- [ ] Monitor response times

### Continuous Monitoring (First 2 hours)

**Every 15 minutes:**
- [ ] Check error rates
- [ ] Review recent logs
- [ ] Check donation success rate
- [ ] Verify receipts generating
- [ ] Check emails sending

**Metrics to Track:**
- [ ] Total donations processed
- [ ] Payment success rate (target: >99%)
- [ ] Receipt generation rate (target: >98%)
- [ ] Email send rate (target: >95%)
- [ ] Average response time (target: <2s)
- [ ] Error rate (target: <1%)

### Database Checks

```sql
-- Recent donations (last hour)
SELECT payment_status, COUNT(*) 
FROM donations 
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY payment_status;

-- Stuck donations
SELECT COUNT(*) FROM donations 
WHERE payment_status = 'PENDING' 
AND created_at < NOW() - INTERVAL '1 hour';
-- Expected: 0 or very low

-- Recent failures
SELECT COUNT(*) FROM receipt_failures 
WHERE created_at > NOW() - INTERVAL '1 hour';
-- Expected: 0

SELECT COUNT(*) FROM email_failures 
WHERE created_at > NOW() - INTERVAL '1 hour';
-- Expected: 0
```

---

## Rollback Criteria

**Rollback immediately if:**
- [ ] Error rate > 5%
- [ ] Payment success rate < 95%
- [ ] Database errors
- [ ] Critical security issue discovered
- [ ] Webhook processing failures
- [ ] Receipt generation failures > 10%

**Rollback Procedure:**

1. **Application Rollback:**
   ```bash
   vercel rollback [previous-deployment-url]
   ```

2. **Database Rollback (if necessary):**
   - Restore from backup
   - Or execute rollback script (see scripts/payments-v2/README.md)

3. **Notify Team:**
   - Announce rollback
   - Document reason
   - Schedule post-mortem

---

## Sign-Off

### Deployment Team

- [ ] Developer: _________________ Date: _______ Time: _______
- [ ] QA: _________________ Date: _______ Time: _______
- [ ] DevOps: _________________ Date: _______ Time: _______
- [ ] Security: _________________ Date: _______ Time: _______

### Deployment Approval

- [ ] All pre-deployment checks completed
- [ ] Database migrations successful
- [ ] Application deployed successfully
- [ ] Initial verification passed
- [ ] No critical errors in first 2 hours

**Approved by:** _________________ Date: _______ Time: _______

---

## Next Steps

After successful production deployment with V1 active:

1. ✅ Monitor for 1-2 hours
2. ✅ Verify V1 flow working normally
3. ✅ Prepare for V2 incremental rollout (Task 28.5)
4. ✅ Schedule V2 enablement window
5. ✅ Notify team of next phase

---

## Notes

Use this section to document any issues, workarounds, or observations during production deployment:

```
[Add notes here]
```

---

## Deployment Record

**Deployment Date:** _________________

**Deployment Time (Start):** _________________

**Deployment Time (End):** _________________

**Deployed By:** _________________

**Production URL:** _________________

**Deployment ID:** _________________

**Git Tag:** _________________

**Supabase Project:** _________________

**Database Backup Location:** _________________

**Rollback Plan:** _________________

---

## Post-Deployment Tasks

### Within 24 Hours
- [ ] Monitor metrics continuously
- [ ] Review all logs
- [ ] Check for any anomalies
- [ ] Verify no stuck donations
- [ ] Confirm receipts and emails working
- [ ] Document any issues

### Within 48 Hours
- [ ] Prepare V2 incremental rollout plan
- [ ] Review metrics and trends
- [ ] Get team approval for V2 enablement
- [ ] Schedule V2 rollout window

### Within 1 Week
- [ ] Complete V2 incremental rollout (Task 28.5)
- [ ] Monitor V2 performance
- [ ] Plan V1 code removal (Task 28.6)

---

**Last Updated:** 2024-01-01
**Version:** 2.0.0
