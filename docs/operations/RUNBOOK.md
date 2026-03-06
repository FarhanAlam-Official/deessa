# Payment Architecture V2 - Operations Runbook

## Overview

This runbook provides operational procedures for managing the Payment Architecture V2 system, including reconciliation, manual review, and incident response.

## Table of Contents

- [Daily Operations](#daily-operations)
- [Reconciliation Procedure](#reconciliation-procedure)
- [Manual Review Procedure](#manual-review-procedure)
- [Incident Response](#incident-response)
- [Common Issues](#common-issues)
- [Maintenance Tasks](#maintenance-tasks)
- [Escalation](#escalation)

---

## Daily Operations

### Morning Checklist

**Time:** 9:00 AM daily

1. **Check System Health**
   ```bash
   curl https://your-domain.com/api/health
   ```
   - Verify all checks pass
   - Check database connectivity
   - Verify provider API status

2. **Review Overnight Donations**
   ```sql
   SELECT COUNT(*), payment_status 
   FROM donations 
   WHERE created_at >= NOW() - INTERVAL '24 hours'
   GROUP BY payment_status;
   ```
   - Verify no unusual patterns
   - Check for stuck donations

3. **Check Error Logs**
   ```bash
   vercel logs --prod --since 24h | grep ERROR
   ```
   - Review any errors
   - Investigate patterns
   - Create tickets if needed

4. **Review Donations in REVIEW Status**
   - Go to `/admin/donations/review`
   - Review any donations requiring manual approval
   - Process within 24 hours

5. **Check Receipt Generation**
   ```sql
   SELECT COUNT(*) 
   FROM donations 
   WHERE payment_status = 'confirmed' 
   AND receipt_number IS NULL 
   AND confirmed_at < NOW() - INTERVAL '1 hour';
   ```
   - Should be 0
   - If > 0, check `receipt_failures` table

6. **Check Email Sending**
   ```sql
   SELECT COUNT(*) 
   FROM donations 
   WHERE payment_status = 'confirmed' 
   AND receipt_number IS NOT NULL 
   AND receipt_sent_at IS NULL 
   AND confirmed_at < NOW() - INTERVAL '1 hour';
   ```
   - Should be 0
   - If > 0, check `email_failures` table

### Evening Checklist

**Time:** 5:00 PM daily

1. **Run Reconciliation**
   - See [Reconciliation Procedure](#reconciliation-procedure)

2. **Review Metrics**
   - Go to `/admin/monitoring`
   - Check success rates
   - Verify no alerts

3. **Check Pending Donations**
   ```sql
   SELECT id, donor_email, amount, created_at 
   FROM donations 
   WHERE payment_status = 'pending' 
   AND created_at < NOW() - INTERVAL '1 hour'
   ORDER BY created_at;
   ```
   - Investigate any stuck donations
   - Run reconciliation if needed

---

## Reconciliation Procedure

### Purpose

Reconciliation checks for donations stuck in PENDING status and verifies their actual status with payment providers.

### When to Run

- **Scheduled:** Daily at 5:00 PM
- **On-Demand:** When donations are stuck > 1 hour
- **After Incidents:** After provider outages or system issues

### Procedure

#### 1. Identify Stuck Donations

```sql
SELECT 
  id,
  donor_name,
  donor_email,
  amount,
  currency,
  provider,
  provider_ref,
  created_at,
  EXTRACT(EPOCH FROM (NOW() - created_at))/3600 AS hours_pending
FROM donations 
WHERE payment_status = 'pending' 
AND created_at < NOW() - INTERVAL '1 hour'
ORDER BY created_at;
```

#### 2. Run Reconciliation Script

```bash
# Manual reconciliation
npm run reconcile

# Or use API endpoint
curl -X POST https://your-domain.com/api/admin/reconcile \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

#### 3. Review Results

The script will:
- Query each provider for transaction status
- Update donation status based on provider response
- Generate receipts for newly confirmed donations
- Send emails for newly confirmed donations
- Log all actions

#### 4. Handle Failures

For donations that fail reconciliation:

**Stripe:**
```bash
# Lookup session manually
stripe checkout sessions retrieve cs_test_...
```

**Khalti:**
```bash
curl https://khalti.com/api/v2/epayment/lookup/ \
  -H "Authorization: Key $KHALTI_SECRET_KEY" \
  -H "Content-Type: application/json" \
  -d '{"pidx":"pidx_value"}'
```

**eSewa:**
```bash
curl https://epay.esewa.com.np/api/epay/transaction/status/ \
  -H "Content-Type: application/json" \
  -d '{"product_code":"$ESEWA_MERCHANT_ID","transaction_uuid":"uuid"}'
```

#### 5. Manual Updates (Last Resort)

If provider confirms payment but system won't update:

```sql
BEGIN;

-- Update donation status
UPDATE donations 
SET 
  payment_status = 'confirmed',
  confirmed_at = NOW(),
  provider_ref = 'manual_confirmation'
WHERE id = 'donation-uuid';

-- Insert payment record
INSERT INTO payments (
  donation_id,
  provider,
  transaction_id,
  amount,
  currency,
  status,
  verified_at
) VALUES (
  'donation-uuid',
  'stripe',
  'ch_123',
  100.00,
  'USD',
  'paid',
  NOW()
);

-- Insert payment event
INSERT INTO payment_events (
  provider,
  event_id,
  donation_id,
  event_type,
  processed_at
) VALUES (
  'stripe',
  'manual_' || gen_random_uuid(),
  'donation-uuid',
  'manual_reconciliation',
  NOW()
);

COMMIT;
```

Then manually trigger receipt generation:
- Go to `/admin/receipts/failed`
- Find donation
- Click "Retry"

#### 6. Document Actions

Log all manual interventions:
```sql
INSERT INTO admin_actions (
  admin_id,
  action_type,
  donation_id,
  notes,
  created_at
) VALUES (
  'admin-user-id',
  'manual_reconciliation',
  'donation-uuid',
  'Manually confirmed after provider verification',
  NOW()
);
```

---

## Manual Review Procedure

### Purpose

Review donations that require manual approval due to amount/currency mismatches or verification uncertainties.

### When to Review

- **Daily:** Check `/admin/donations/review` every morning
- **On Alert:** When admin alert email received
- **SLA:** Process within 24 hours

### Procedure

#### 1. Access Review Dashboard

Go to `/admin/donations/review`

#### 2. Review Donation Details

For each donation in REVIEW status, check:
- Donor information (name, email)
- Expected amount and currency
- Actual amount and currency from provider
- Provider transaction ID
- Raw provider payload
- Reason for review

#### 3. Verify with Provider

**Stripe:**
```bash
stripe charges retrieve ch_123
```

**Khalti:**
```bash
curl https://khalti.com/api/v2/epayment/lookup/ \
  -H "Authorization: Key $KHALTI_SECRET_KEY" \
  -H "Content-Type: application/json" \
  -d '{"pidx":"pidx_value"}'
```

**eSewa:**
```bash
curl https://epay.esewa.com.np/api/epay/transaction/status/ \
  -H "Content-Type: application/json" \
  -d '{"product_code":"$ESEWA_MERCHANT_ID","transaction_uuid":"uuid"}'
```

#### 4. Make Decision

**Approve if:**
- Amount difference is due to currency conversion
- Amount difference is minor (< 1%)
- Provider confirms correct amount
- Donor can be contacted for clarification

**Reject if:**
- Amount difference is significant (> 5%)
- Suspected fraud
- Provider shows different transaction
- Cannot verify payment

#### 5. Take Action

**To Approve:**
1. Click "Approve" button
2. Add notes explaining decision
3. System will:
   - Update status to CONFIRMED
   - Generate receipt
   - Send email to donor
   - Log admin action

**To Reject:**
1. Click "Reject" button
2. Add notes explaining decision
3. Select rejection reason
4. System will:
   - Update status to FAILED
   - Send notification to donor
   - Log admin action
   - Optionally initiate refund

#### 6. Contact Donor (if needed)

If clarification needed:

**Email Template:**
```
Subject: Donation Verification Required

Dear [Donor Name],

We received your donation of [Amount] [Currency] on [Date].

However, we need to verify some details:
- Expected amount: [Expected]
- Received amount: [Actual]

Please reply to this email to confirm the correct amount.

Thank you for your support!
```

#### 7. Document Decision

All actions are automatically logged, but add detailed notes:
- Reason for approval/rejection
- Provider verification details
- Any donor communication
- Special circumstances

---

## Incident Response

### Severity Levels

**P0 - Critical:**
- All payments failing
- Database down
- Security breach

**P1 - High:**
- Single provider failing
- Webhook endpoint down
- Receipt generation failing

**P2 - Medium:**
- Slow response times
- Intermittent errors
- Email sending issues

**P3 - Low:**
- Minor bugs
- UI issues
- Documentation errors

### Response Procedures

#### P0 - Critical Incident

**1. Immediate Actions (0-5 minutes)**
- Acknowledge incident
- Notify team via Slack/email
- Check system health dashboard
- Review error logs

**2. Triage (5-15 minutes)**
- Identify root cause
- Assess impact (how many users affected)
- Determine if rollback needed
- Communicate status to stakeholders

**3. Mitigation (15-60 minutes)**
- Implement fix or rollback
- Verify fix resolves issue
- Monitor error rates
- Update status page

**4. Recovery (1-4 hours)**
- Process stuck donations
- Run reconciliation
- Generate missing receipts
- Send delayed emails

**5. Post-Mortem (24-48 hours)**
- Document incident timeline
- Identify root cause
- Create action items
- Update runbook

#### P1 - High Priority Incident

**1. Assessment (0-15 minutes)**
- Verify issue
- Check affected provider/component
- Review recent changes
- Estimate impact

**2. Workaround (15-60 minutes)**
- Implement temporary fix
- Redirect traffic if possible
- Notify affected users
- Document workaround

**3. Permanent Fix (1-8 hours)**
- Develop proper fix
- Test thoroughly
- Deploy to production
- Verify resolution

**4. Follow-up (24 hours)**
- Monitor for recurrence
- Update documentation
- Communicate resolution

### Common Incidents

#### Webhook Endpoint Down

**Symptoms:**
- 500 errors in webhook logs
- Donations stuck in PENDING
- Provider showing failed webhook deliveries

**Response:**
1. Check application logs
2. Verify database connectivity
3. Check environment variables
4. Restart application if needed
5. Run reconciliation after recovery

#### Provider API Down

**Symptoms:**
- Verification failures
- Timeout errors
- Provider status page shows outage

**Response:**
1. Verify provider status page
2. Switch to backup verification method (if available)
3. Queue donations for later processing
4. Notify users of delay
5. Run reconciliation after provider recovery

#### Database Connection Issues

**Symptoms:**
- Connection timeout errors
- "Too many connections" errors
- Slow query performance

**Response:**
1. Check Supabase dashboard
2. Verify connection pool settings
3. Check for long-running queries
4. Restart application to reset connections
5. Scale database if needed

#### Receipt Generation Failures

**Symptoms:**
- Confirmed donations without receipts
- Errors in `receipt_failures` table
- Storage upload failures

**Response:**
1. Check Supabase Storage status
2. Verify `RECEIPT_TOKEN_SECRET` is set
3. Check RPC function works
4. Manually retry failed receipts
5. Monitor success rate

---

## Common Issues

### Issue: Donation Stuck in PENDING

**Diagnosis:**
```sql
SELECT * FROM donations WHERE id = 'donation-uuid';
SELECT * FROM payment_events WHERE donation_id = 'donation-uuid';
```

**Solutions:**
1. Run reconciliation
2. Check provider transaction status
3. Verify webhook was received
4. Check for errors in logs
5. Manual confirmation if verified

### Issue: Receipt Not Generated

**Diagnosis:**
```sql
SELECT * FROM donations WHERE id = 'donation-uuid';
SELECT * FROM receipt_failures WHERE donation_id = 'donation-uuid';
```

**Solutions:**
1. Check `receipt_failures` table for error
2. Verify RPC function works
3. Check Supabase Storage permissions
4. Manually retry via admin interface
5. Check `RECEIPT_TOKEN_SECRET` is set

### Issue: Email Not Sent

**Diagnosis:**
```sql
SELECT * FROM donations WHERE id = 'donation-uuid';
SELECT * FROM email_failures WHERE donation_id = 'donation-uuid';
```

**Solutions:**
1. Check SMTP credentials
2. Verify email rate limits
3. Check spam filters
4. Manually resend via admin interface
5. Verify donor email address

### Issue: Amount Mismatch

**Diagnosis:**
```sql
SELECT 
  d.id,
  d.amount AS expected_amount,
  p.amount AS actual_amount,
  d.currency AS expected_currency,
  p.currency AS actual_currency
FROM donations d
JOIN payments p ON d.id = p.donation_id
WHERE d.id = 'donation-uuid';
```

**Solutions:**
1. Verify with provider dashboard
2. Check currency conversion rates
3. Review raw provider payload
4. Approve if difference is minor
5. Contact donor if significant

---

## Maintenance Tasks

### Weekly Tasks

**Monday:**
- Review previous week's metrics
- Check for recurring issues
- Update documentation if needed

**Wednesday:**
- Review donations in REVIEW status
- Process any backlog
- Check receipt generation success rate

**Friday:**
- Review error logs for patterns
- Check provider API status
- Plan any maintenance for weekend

### Monthly Tasks

**First Monday:**
- Review monthly metrics
- Generate reports for stakeholders
- Plan improvements

**Mid-Month:**
- Review and update runbook
- Check for security updates
- Review access controls

**End of Month:**
- Archive old logs
- Clean up test data
- Review and rotate credentials (if needed)

### Quarterly Tasks

- Security audit
- Performance review
- Disaster recovery drill
- Update documentation
- Review and update SLAs

---

## Escalation

### Escalation Path

**Level 1: On-Call Engineer**
- Initial response
- Basic troubleshooting
- Implement known fixes

**Level 2: Senior Engineer**
- Complex issues
- Code changes required
- Architecture decisions

**Level 3: Tech Lead**
- Critical incidents
- Major outages
- Strategic decisions

**Level 4: CTO/Management**
- Business impact decisions
- External communication
- Resource allocation

### Contact Information

```
On-Call Engineer: [Phone/Slack]
Senior Engineer: [Phone/Slack]
Tech Lead: [Phone/Slack]
Database Admin: [Phone/Slack]
Security Team: [Email/Slack]
```

### When to Escalate

- Issue not resolved within SLA
- Security concern identified
- Data integrity issue
- Multiple systems affected
- Customer impact > 10 users
- Financial impact > $1000

---

## Monitoring & Alerts

### Key Metrics

Monitor these metrics:
- Webhook success rate (target: > 95%)
- Confirmation latency (target: < 1s)
- Receipt generation success (target: > 98%)
- Email send success (target: > 95%)
- Error rate (target: < 1%)

### Alert Thresholds

Set up alerts for:
- Webhook failure rate > 5%
- Confirmation latency > 2s
- Receipt generation failure > 5%
- Email send failure > 10%
- Donations pending > 1 hour
- Donations in REVIEW > 24 hours

### Dashboards

- **System Health:** `/api/health`
- **Admin Monitoring:** `/admin/monitoring`
- **Vercel Analytics:** Vercel Dashboard
- **Supabase Metrics:** Supabase Dashboard
- **Provider Dashboards:** Stripe/Khalti/eSewa

---

## Appendix

### Useful SQL Queries

**Find stuck donations:**
```sql
SELECT * FROM donations 
WHERE payment_status = 'pending' 
AND created_at < NOW() - INTERVAL '1 hour';
```

**Check recent confirmations:**
```sql
SELECT COUNT(*), payment_status 
FROM donations 
WHERE confirmed_at >= NOW() - INTERVAL '24 hours'
GROUP BY payment_status;
```

**Find failed receipts:**
```sql
SELECT d.id, d.donor_email, rf.error_message, rf.last_attempt_at
FROM donations d
JOIN receipt_failures rf ON d.id = rf.donation_id
WHERE rf.last_attempt_at >= NOW() - INTERVAL '24 hours';
```

**Check payment events:**
```sql
SELECT provider, event_type, COUNT(*) 
FROM payment_events 
WHERE processed_at >= NOW() - INTERVAL '24 hours'
GROUP BY provider, event_type;
```

### Useful Commands

**Check logs:**
```bash
vercel logs --prod --since 1h
```

**Run reconciliation:**
```bash
npm run reconcile
```

**Validate configuration:**
```bash
npm run validate-config
```

**Test provider connectivity:**
```bash
npm run test-providers
```

---

**Last Updated:** 2024-01-01
**Version:** 2.0.0
