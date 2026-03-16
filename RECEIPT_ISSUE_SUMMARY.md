# Receipt Generation Issue - Investigation Summary

## Problem Statement

Receipts are not being generated in Vercel deployment after successful Stripe payments.

## Root Cause Analysis

Based on code review and your error message, the receipt generation system has these configuration issues in Vercel:

### 1. Wrong Site URL (CONFIRMED - Your Issue)
- **Required:** `NEXT_PUBLIC_APP_URL` or `NEXT_PUBLIC_SITE_URL` set to production domain
- **Impact:** Receipt URLs use `localhost:3000`, browser blocks with `ERR_BLOCKED_BY_CLIENT`
- **Evidence:** Error shows `localhost:3000/api/receipts/download?token=...`
- **Fix:** Set `NEXT_PUBLIC_APP_URL=https://your-domain.com` in Vercel

### 2. Missing Email Configuration (Likely)
- **Required:** `GOOGLE_EMAIL` and `GOOGLE_APP_PASSWORD` environment variables
- **Impact:** Receipt generation fails silently because email cannot be sent
- **Evidence:** Code requires these variables in `lib/email/receipt-mailer.ts`

### 2. Missing Service Role Key
- **Required:** `SUPABASE_SERVICE_ROLE_KEY` environment variable
- **Impact:** Database writes fail silently due to RLS (Row Level Security)
- **Evidence:** Receipt service uses service role client to bypass RLS

### 3. Wrong Webhook Secret
- **Required:** Production `STRIPE_WEBHOOK_SECRET` (not Stripe CLI secret)
- **Impact:** Webhooks are rejected with "Invalid signature" error
- **Evidence:** Webhook handler verifies signature before processing

### 4. Webhook Not Configured in Stripe
- **Required:** Webhook endpoint registered in Stripe Dashboard
- **Impact:** Stripe never sends webhook events to production
- **Evidence:** No webhook logs in Vercel

## Code Changes Made

### Enhanced Error Logging

Updated `app/api/webhooks/stripe/route.ts` to provide more detailed logging:

1. Added logging before receipt generation starts
2. Added full error details including stack traces
3. Added receipt URL to success logs
4. Added full result object to error logs

This will help identify the exact failure point in Vercel logs.

### Files Modified:
- `app/api/webhooks/stripe/route.ts` - Enhanced logging for receipt generation

## Documentation Created

### 1. Receipt Generation Troubleshooting Guide
**File:** `docs/RECEIPT_GENERATION_TROUBLESHOOTING.md`

Comprehensive troubleshooting guide covering:
- Quick diagnostic steps
- Common issues and solutions
- Database queries for debugging
- Manual receipt generation procedures
- Production deployment checklist

### 2. Vercel Deployment Checklist
**File:** `docs/VERCEL_RECEIPT_DEPLOYMENT_CHECKLIST.md`

Step-by-step deployment guide including:
- Pre-deployment checklist
- Environment variable setup
- Stripe webhook configuration
- Post-deployment verification
- Monitoring and rollback procedures

### 3. Quick Fix Guide
**File:** `docs/RECEIPT_QUICK_FIX.md`

Fast reference for common issues:
- 2-minute diagnosis
- Quick fixes for each issue
- Verification steps
- Prevention tips

### 4. SQL Diagnostic Queries
**File:** `scripts/diagnose-receipt-issue.sql`

Database queries to identify:
- Donations without receipts
- Receipt generation success rate
- Webhook event processing
- Email sending failures

## Diagnostic Tools

### Webhook Test Endpoint
**URL:** `https://your-domain.vercel.app/api/webhooks/stripe/test`

Already implemented in `app/api/webhooks/stripe/test/route.ts`

Returns:
```json
{
  "status": "ok" | "missing_configuration",
  "diagnostics": {
    "stripeSecretKey": true/false,
    "webhookSecret": true/false,
    "supabaseServiceRole": true/false,
    "supabaseUrl": true/false,
    "paymentMode": "live" | "mock" | "not_set"
  }
}
```

## Recommended Action Plan

### Immediate Steps (5 minutes)

1. **Check diagnostic endpoint:**
   ```bash
   curl https://your-vercel-domain.vercel.app/api/webhooks/stripe/test
   ```

2. **Check Vercel environment variables:**
   - Go to Vercel Dashboard → Settings → Environment Variables
   - Verify these are set:
     - `GOOGLE_EMAIL`
     - `GOOGLE_APP_PASSWORD`
     - `SUPABASE_SERVICE_ROLE_KEY`
     - `STRIPE_WEBHOOK_SECRET`

3. **Check Stripe webhook configuration:**
   - Go to Stripe Dashboard → Webhooks
   - Verify endpoint exists for production URL
   - Check "Recent deliveries" for errors

### If Variables Are Missing (10 minutes)

Follow the quick fix guide: `docs/RECEIPT_QUICK_FIX.md`

Key steps:
1. Generate Gmail App Password
2. Get Supabase Service Role Key
3. Add to Vercel environment variables
4. Redeploy

### Verification (5 minutes)

1. Make a test donation
2. Check Vercel logs for:
   - "Starting receipt generation"
   - "Receipt generated for donation"
   - "Receipt email sent"
3. Check email inbox for receipt
4. Check database for receipt data

## Expected Behavior After Fix

### Successful Flow:

1. User completes payment in Stripe
2. Stripe sends webhook to Vercel
3. Webhook handler confirms payment
4. Receipt generation starts (logged)
5. Receipt PDF created and stored
6. Receipt email sent (logged)
7. Database updated with receipt info
8. User receives email with receipt

### Logs You Should See:

```
Stripe webhook: Payment confirmed { donationId: '...', sessionId: '...' }
Stripe webhook: Starting receipt generation for donation ...
Stripe webhook: Receipt generated for donation ... { receiptNumber: 'RCP-...', receiptUrl: '...' }
Receipt email sent: ...
```

## Monitoring

### Daily Check Query:

```sql
SELECT 
  COUNT(*) as total_completed,
  COUNT(receipt_number) as receipts_generated,
  COUNT(receipt_sent_at) as receipts_sent
FROM donations
WHERE payment_status = 'completed'
  AND created_at > NOW() - INTERVAL '24 hours';
```

Expected: All three counts should be equal (100% success rate).

### Alert Conditions:

Set up alerts for:
- Any donation with `payment_status = 'completed'` and `receipt_number IS NULL` for > 5 minutes
- Vercel logs containing "Receipt generation failed"
- Stripe webhook delivery failures

## Related Files

### Code Files:
- `app/api/webhooks/stripe/route.ts` - Webhook handler
- `app/api/webhooks/stripe/test/route.ts` - Diagnostic endpoint
- `lib/actions/donation-receipt.ts` - Receipt generation action
- `lib/receipts/service.ts` - Receipt service (PDF, email)
- `lib/email/receipt-mailer.ts` - Email sending

### Documentation:
- `docs/RECEIPT_GENERATION_TROUBLESHOOTING.md` - Detailed troubleshooting
- `docs/VERCEL_RECEIPT_DEPLOYMENT_CHECKLIST.md` - Deployment guide
- `docs/RECEIPT_QUICK_FIX.md` - Quick reference
- `docs/STRIPE_SETUP_GUIDE.md` - Stripe configuration

### Scripts:
- `scripts/diagnose-receipt-issue.sql` - Database diagnostic queries

## Next Steps

1. **Run the diagnostic endpoint** to identify which variables are missing
2. **Check Vercel logs** for specific error messages
3. **Follow the quick fix guide** to add missing configuration
4. **Test with a donation** to verify the fix
5. **Monitor for 24 hours** to ensure stability

## Support

If issues persist after following the guides:

1. Check Vercel logs for the specific error message
2. Run the SQL diagnostic queries
3. Verify all environment variables are set correctly
4. Test locally with Stripe CLI to isolate the issue
5. Check Stripe Dashboard for webhook delivery status

---

**Created:** 2026-03-06
**Status:** Investigation complete, documentation provided
**Action Required:** Check Vercel environment variables and follow quick fix guide
