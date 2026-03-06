# Smoke Test Guide - Payment Architecture V2

## Overview

This guide provides detailed instructions for running smoke tests in the staging environment after deploying Payment Architecture V2.

## Prerequisites

- Staging environment deployed
- Database migrations completed
- Test payment provider credentials configured
- Access to staging environment logs
- Access to Supabase dashboard

## Quick Start

### Automated Tests

```bash
# PowerShell
.\scripts\smoke-tests-staging.ps1 -StagingUrl https://your-staging.vercel.app

# Bash
./scripts/smoke-tests-staging.sh https://your-staging.vercel.app
```

### Manual Tests

Follow the detailed test procedures below for each payment provider.

## Test Procedures

### Test 1: Health Check (Automated)

**Purpose:** Verify application is running and healthy

**Steps:**
1. Run: `curl https://staging-url/api/health`
2. Verify response status: 200
3. Verify response body contains:
   ```json
   {
     "status": "healthy",
     "checks": {
       "database": { "status": "pass" },
       "paymentConfig": { "status": "pass" }
     }
   }
   ```

**Expected Result:** ✅ Health check returns healthy status

**Troubleshooting:**
- If 500 error: Check application logs
- If database check fails: Verify Supabase connection
- If payment config fails: Check environment variables

---

### Test 2: Stripe Payment Flow (Manual)

**Purpose:** Verify end-to-end Stripe payment processing

**Test Data:**
- Amount: $10.00 USD
- Email: test@example.com
- Card: 4242 4242 4242 4242
- Expiry: Any future date
- CVC: Any 3 digits

**Steps:**

1. **Navigate to donation form**
   - Go to: `https://staging-url/donate`
   - Verify form loads without errors

2. **Fill donation form**
   - Enter amount: 10
   - Enter email: test@example.com
   - Select payment method: Stripe
   - Click "Donate"

3. **Complete Stripe checkout**
   - Verify redirect to Stripe checkout page
   - Enter test card: 4242 4242 4242 4242
   - Enter expiry: 12/34
   - Enter CVC: 123
   - Click "Pay"

4. **Verify success page**
   - Verify redirect to success page
   - Verify success message displays
   - Verify donation ID shown
   - Note donation ID for verification

5. **Verify webhook processing**
   - Check Vercel logs: `vercel logs --env=preview`
   - Look for: "Stripe webhook received"
   - Look for: "Payment confirmed"
   - Verify no errors

6. **Verify database**
   ```sql
   -- Check donation status
   SELECT id, payment_status, provider, amount 
   FROM donations 
   WHERE id = '[donation-id]';
   -- Expected: payment_status = 'CONFIRMED', provider = 'stripe'
   
   -- Check payment record
   SELECT * FROM payments WHERE donation_id = '[donation-id]';
   -- Expected: 1 row with Stripe transaction details
   
   -- Check receipt
   SELECT * FROM receipts WHERE donation_id = '[donation-id]';
   -- Expected: 1 row with receipt number
   
   -- Check payment event
   SELECT * FROM payment_events WHERE donation_id = '[donation-id]';
   -- Expected: 1+ rows with webhook events
   ```

7. **Verify receipt email**
   - Check test email inbox
   - Verify receipt email received
   - Verify receipt PDF attached or download link present
   - Verify receipt number matches database

**Expected Result:** ✅ Complete payment flow works end-to-end

**Troubleshooting:**
- If webhook not received: Check Stripe webhook configuration
- If payment not confirmed: Check PaymentService logs
- If receipt not generated: Check receipt_failures table
- If email not sent: Check email_failures table and SMTP logs

---

### Test 3: Khalti Payment Flow (Manual)

**Purpose:** Verify end-to-end Khalti payment processing

**Test Data:**
- Amount: NPR 100
- Email: test@example.com
- Khalti test credentials (from Khalti dashboard)

**Steps:**

1. **Navigate to donation form**
   - Go to: `https://staging-url/donate`
   - Verify form loads without errors

2. **Fill donation form**
   - Enter amount: 100
   - Select currency: NPR
   - Enter email: test@example.com
   - Select payment method: Khalti
   - Click "Donate"

3. **Complete Khalti payment**
   - Verify redirect to Khalti payment page
   - Enter test credentials from Khalti dashboard
   - Complete payment

4. **Verify success page**
   - Verify redirect to success page
   - Verify success message displays
   - Note donation ID for verification

5. **Verify callback processing**
   - Check Vercel logs
   - Look for: "Khalti callback received"
   - Look for: "Payment confirmed"
   - Verify no errors

6. **Verify database** (same queries as Stripe test, replace donation-id)

7. **Verify receipt email** (same as Stripe test)

**Expected Result:** ✅ Complete payment flow works end-to-end

**Troubleshooting:**
- If callback not received: Check Khalti return URL configuration
- If verification fails: Check Khalti API credentials
- If amount mismatch: Check currency conversion logic

---

### Test 4: eSewa Payment Flow (Manual)

**Purpose:** Verify end-to-end eSewa payment processing

**Test Data:**
- Amount: NPR 100
- Email: test@example.com
- eSewa test credentials (from eSewa dashboard)

**Steps:**

1. **Navigate to donation form**
   - Go to: `https://staging-url/donate`
   - Verify form loads without errors

2. **Fill donation form**
   - Enter amount: 100
   - Select currency: NPR
   - Enter email: test@example.com
   - Select payment method: eSewa
   - Click "Donate"

3. **Complete eSewa payment**
   - Verify redirect to eSewa payment page
   - Enter test credentials from eSewa dashboard
   - Complete payment

4. **Verify success page**
   - Verify redirect to success page
   - Verify success message displays
   - Note donation ID for verification

5. **Verify callback processing**
   - Check Vercel logs
   - Look for: "eSewa callback received"
   - Look for: "HMAC signature verified"
   - Look for: "Payment confirmed"
   - Verify no errors

6. **Verify database** (same queries as Stripe test, replace donation-id)

7. **Verify receipt email** (same as Stripe test)

**Expected Result:** ✅ Complete payment flow works end-to-end

**Troubleshooting:**
- If signature verification fails: Check ESEWA_SECRET_KEY
- If callback not received: Check eSewa success URL configuration
- If transaction lookup fails: Check eSewa API credentials

---

### Test 5: Receipt Generation (Automated)

**Purpose:** Verify receipt generation works correctly

**Steps:**

1. **Check receipt_failures table**
   ```sql
   SELECT * FROM receipt_failures 
   WHERE created_at > NOW() - INTERVAL '1 hour';
   ```
   - Expected: 0 rows (no failures)

2. **Verify receipt numbers are sequential**
   ```sql
   SELECT receipt_number, created_at 
   FROM receipts 
   ORDER BY created_at DESC 
   LIMIT 10;
   ```
   - Expected: Sequential numbers (RCP-2026-0001, RCP-2026-0002, etc.)

3. **Test receipt download**
   - Get receipt token from email
   - Access: `https://staging-url/api/receipts/download?token=[token]`
   - Verify PDF downloads
   - Verify PDF contains correct donation details

**Expected Result:** ✅ Receipts generate correctly with no failures

**Troubleshooting:**
- If receipt_failures has entries: Check error messages
- If numbers not sequential: Check get_next_receipt_number() function
- If download fails: Check RECEIPT_TOKEN_SECRET

---

### Test 6: Email Sending (Automated)

**Purpose:** Verify email sending works correctly

**Steps:**

1. **Check email_failures table**
   ```sql
   SELECT * FROM email_failures 
   WHERE created_at > NOW() - INTERVAL '1 hour';
   ```
   - Expected: 0 rows (no failures)

2. **Verify emails sent**
   - Check test email inbox
   - Verify all test donations have receipt emails
   - Verify email formatting is correct
   - Verify download links work

**Expected Result:** ✅ Emails send correctly with no failures

**Troubleshooting:**
- If email_failures has entries: Check SMTP credentials
- If emails not received: Check spam folder
- If SMTP errors: Check SMTP host/port configuration

---

### Test 7: Error Handling (Manual)

**Purpose:** Verify error handling works correctly

**Test Cases:**

#### 7.1: Invalid Card (Stripe)
- Use card: 4000 0000 0000 0002 (declined)
- Expected: Payment fails gracefully
- Expected: Donation status: FAILED
- Expected: User sees error message

#### 7.2: Amount Mismatch
- Manually trigger webhook with wrong amount
- Expected: Donation status: REVIEW
- Expected: Admin alert sent
- Expected: Visible in admin review interface

#### 7.3: Duplicate Webhook
- Manually replay webhook event
- Expected: Idempotency check prevents duplicate processing
- Expected: No duplicate receipt generated
- Expected: No duplicate email sent

**Expected Result:** ✅ All error cases handled gracefully

---

### Test 8: Performance (Automated)

**Purpose:** Verify performance meets targets

**Metrics to Check:**

1. **Webhook Response Time**
   ```bash
   # Test webhook endpoint
   time curl -X POST https://staging-url/api/webhooks/stripe \
     -H "Content-Type: application/json" \
     -d '{"type":"test"}'
   ```
   - Target: < 2 seconds

2. **Confirmation Latency**
   - Measure time from webhook received to donation confirmed
   - Check logs for timing information
   - Target: < 1 second

3. **Receipt Generation Time**
   - Measure time from confirmation to receipt generated
   - Check logs for timing information
   - Target: < 5 seconds

**Expected Result:** ✅ All performance targets met

---

### Test 9: Security (Manual)

**Purpose:** Verify security measures are in place

**Test Cases:**

#### 9.1: Receipt Access Without Token
```bash
curl https://staging-url/api/receipts/download
```
- Expected: 401 Unauthorized

#### 9.2: Invalid Webhook Signature (Stripe)
```bash
curl -X POST https://staging-url/api/webhooks/stripe \
  -H "Content-Type: application/json" \
  -H "Stripe-Signature: invalid" \
  -d '{"type":"test"}'
```
- Expected: 401 Unauthorized

#### 9.3: Rate Limiting
```bash
# Send 20 requests rapidly
for i in {1..20}; do
  curl https://staging-url/api/receipts/download?token=test
done
```
- Expected: 429 Too Many Requests after threshold

**Expected Result:** ✅ All security measures working

---

## Test Results Template

Use this template to document test results:

```
# Smoke Test Results - [Date]

## Environment
- Staging URL: [url]
- Tested By: [name]
- Date: [date]
- Time: [time]

## Test Results

### Automated Tests
- [ ] Health Check: PASS / FAIL
- [ ] Homepage Load: PASS / FAIL
- [ ] Donation Form: PASS / FAIL

### Payment Provider Tests
- [ ] Stripe Payment: PASS / FAIL
  - Donation ID: [id]
  - Receipt Number: [number]
  - Notes: [any issues]

- [ ] Khalti Payment: PASS / FAIL
  - Donation ID: [id]
  - Receipt Number: [number]
  - Notes: [any issues]

- [ ] eSewa Payment: PASS / FAIL
  - Donation ID: [id]
  - Receipt Number: [number]
  - Notes: [any issues]

### System Tests
- [ ] Receipt Generation: PASS / FAIL
- [ ] Email Sending: PASS / FAIL
- [ ] Error Handling: PASS / FAIL
- [ ] Performance: PASS / FAIL
- [ ] Security: PASS / FAIL

## Issues Found

[List any issues discovered during testing]

## Recommendations

[Any recommendations before production deployment]

## Sign-Off

Tested By: _________________ Date: _______
Approved By: _________________ Date: _______
```

---

## Continuous Monitoring

After smoke tests pass, monitor these metrics for 24-48 hours:

### Key Metrics
- Payment confirmation success rate (target: >99%)
- Receipt generation success rate (target: >98%)
- Email send success rate (target: >95%)
- Webhook response time (target: <2s)
- Error rate (target: <1%)

### Monitoring Queries

```sql
-- Payment confirmation rate (last 24 hours)
SELECT 
  COUNT(*) FILTER (WHERE payment_status = 'CONFIRMED') * 100.0 / COUNT(*) as success_rate
FROM donations 
WHERE created_at > NOW() - INTERVAL '24 hours';

-- Receipt generation rate (last 24 hours)
SELECT 
  COUNT(*) FILTER (WHERE receipt_number IS NOT NULL) * 100.0 / 
  COUNT(*) FILTER (WHERE payment_status = 'CONFIRMED') as receipt_rate
FROM donations 
WHERE created_at > NOW() - INTERVAL '24 hours';

-- Stuck donations (pending > 1 hour)
SELECT COUNT(*) 
FROM donations 
WHERE payment_status = 'PENDING' 
AND created_at < NOW() - INTERVAL '1 hour';

-- Recent failures
SELECT * FROM receipt_failures 
WHERE created_at > NOW() - INTERVAL '24 hours';

SELECT * FROM email_failures 
WHERE created_at > NOW() - INTERVAL '24 hours';
```

---

## Next Steps

After successful smoke tests:

1. ✅ Document test results
2. ✅ Review any issues found
3. ✅ Fix critical issues
4. ✅ Enable V2 with feature flag (Task 28.3)
5. ✅ Monitor for 24-48 hours
6. ✅ Prepare production deployment (Task 28.4)

---

**Last Updated:** 2024-01-01
**Version:** 2.0.0
