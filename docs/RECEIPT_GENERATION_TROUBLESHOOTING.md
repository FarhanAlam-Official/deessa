# Receipt Generation Troubleshooting Guide

## Problem: Receipts Not Being Generated in Vercel Deployment

This guide helps diagnose and fix issues where receipts are not being generated after successful payments in production (Vercel).

## Quick Diagnostic Steps

### 1. Check Environment Variables in Vercel

Go to your Vercel project → Settings → Environment Variables and verify these are set:

**Required for Receipt Generation:**
- ✅ `SUPABASE_SERVICE_ROLE_KEY` - Required for database writes
- ✅ `GOOGLE_EMAIL` - Gmail address for sending receipts
- ✅ `GOOGLE_APP_PASSWORD` - Gmail app-specific password
- ✅ `STRIPE_WEBHOOK_SECRET` - Production webhook secret (not CLI secret)
- ✅ `STRIPE_SECRET_KEY` - Production Stripe key (sk_live_...)
- ✅ `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- ✅ `PAYMENT_MODE` - Should be "live" for production

### 2. Test Environment Configuration

Visit your diagnostic endpoint:
```
https://your-domain.vercel.app/api/webhooks/stripe/test
```

Expected response:
```json
{
  "status": "ok",
  "diagnostics": {
    "stripeSecretKey": true,
    "webhookSecret": true,
    "supabaseServiceRole": true,
    "supabaseUrl": true,
    "paymentMode": "live"
  }
}
```

If any value is `false`, that environment variable is missing in Vercel.

### 3. Check Vercel Logs

1. Go to Vercel Dashboard → Your Project → Logs
2. Filter by "Runtime Logs"
3. Look for these messages after a payment:

**Success indicators:**
```
Stripe webhook: Payment confirmed { donationId: '...', sessionId: '...' }
Stripe webhook: Receipt generated for donation ... { receiptNumber: 'RCP-...' }
Receipt email sent: ...
```

**Error indicators:**
```
GOOGLE_EMAIL or GOOGLE_APP_PASSWORD not configured
Failed to send receipt email
Receipt generation error
Failed to update donation with receipt
```

### 4. Check Stripe Dashboard

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click on your production webhook endpoint
3. Check "Recent deliveries" tab
4. Look for:
   - ✅ Status 200 (success)
   - ❌ Status 400/500 (error)
   - ❌ Timeout (webhook taking too long)

## Common Issues and Solutions

### Issue 1: Email Configuration Missing

**Symptoms:**
- Webhook succeeds (200 OK)
- Donation status updates to "completed"
- Receipt number is NOT generated
- Logs show: "GOOGLE_EMAIL or GOOGLE_APP_PASSWORD not configured"

**Solution:**

1. Generate a Gmail App Password:
   - Go to https://myaccount.google.com/apppasswords
   - Create a new app password for "Mail"
   - Copy the 16-character password

2. Add to Vercel environment variables:
   ```
   GOOGLE_EMAIL=your-email@gmail.com
   GOOGLE_APP_PASSWORD=your-16-char-app-password
   ```

3. Redeploy your application (or wait for auto-deploy)

### Issue 2: Service Role Key Missing

**Symptoms:**
- Webhook succeeds (200 OK)
- Logs show receipt generation attempt
- Receipt is NOT saved to database
- No error messages (silent failure due to RLS)

**Solution:**

1. Get your Supabase Service Role Key:
   - Go to Supabase Dashboard → Project Settings → API
   - Copy the "service_role" key (starts with "eyJ...")

2. Add to Vercel environment variables:
   ```
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

3. Redeploy your application

### Issue 3: Wrong Webhook Secret

**Symptoms:**
- Stripe Dashboard shows webhook delivery failures
- Status 400 "Invalid signature"
- Logs show: "Stripe webhook signature verification failed"

**Solution:**

1. Get the correct production webhook secret:
   - Go to Stripe Dashboard → Developers → Webhooks
   - Click on your production endpoint
   - Click "Reveal" next to "Signing secret"
   - Copy the secret (starts with "whsec_")

2. Update Vercel environment variable:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_your_production_secret
   ```

3. Redeploy your application

**Important:** The Stripe CLI secret (from `stripe listen`) is DIFFERENT from the production webhook secret!

### Issue 4: Webhook Not Configured in Stripe

**Symptoms:**
- Payments succeed in Stripe
- Donations remain in "pending" status
- No webhook logs in Vercel
- Stripe Dashboard shows no webhook deliveries

**Solution:**

1. Create webhook endpoint in Stripe Dashboard:
   - Go to Stripe Dashboard → Developers → Webhooks
   - Click "Add endpoint"
   - Enter URL: `https://your-domain.vercel.app/api/webhooks/stripe`
   - Select events:
     - ✅ `checkout.session.completed`
     - ✅ `invoice.payment_succeeded`
     - ✅ `checkout.session.expired`
     - ✅ `payment_intent.payment_failed`
   - Click "Add endpoint"

2. Copy the webhook signing secret and add to Vercel (see Issue 3)

### Issue 5: Receipt Generation Timeout

**Symptoms:**
- Stripe Dashboard shows webhook timeouts (30s)
- Donation status updates but receipt not generated
- Logs show receipt generation started but not completed

**Solution:**

This is rare but can happen if:
- PDF generation is slow
- Email sending is slow
- Database is slow

The code already handles this with fire-and-forget receipt generation. If you see this:

1. Check Supabase performance (query times)
2. Verify email service is responding quickly
3. Consider implementing a job queue for receipt generation (future enhancement)

### Issue 6: Receipt Generated But Email Not Sent

**Symptoms:**
- Receipt number exists in database
- Receipt URL is generated
- Email was not received by donor
- Logs show: "Receipt email failed to send"

**Solution:**

1. Verify Gmail credentials are correct (see Issue 1)

2. Check Gmail account:
   - Ensure "Less secure app access" is NOT required (use App Password instead)
   - Check if account is locked or requires verification
   - Verify sending limits haven't been reached

3. Test email configuration:
   ```bash
   # Create a test script or use the diagnostic endpoint
   curl https://your-domain.vercel.app/api/test-email
   ```

4. Manual receipt resend:
   - Receipts can be resent from the admin dashboard
   - Or use the `ensureReceiptSent` function

## Verification Checklist

After fixing issues, verify the complete flow:

- [ ] Make a test donation using Stripe test card (4242 4242 4242 4242)
- [ ] Check Stripe Dashboard → Payments (payment should show as succeeded)
- [ ] Check Stripe Dashboard → Webhooks → Recent deliveries (should show 200 OK)
- [ ] Check Vercel logs (should show "Payment confirmed" and "Receipt generated")
- [ ] Check database: `SELECT * FROM donations WHERE id = 'donation-id'`
  - [ ] `payment_status` should be "completed"
  - [ ] `receipt_number` should be set (e.g., "RCP-2026-03-001")
  - [ ] `receipt_url` should be set
  - [ ] `receipt_generated_at` should be set
  - [ ] `receipt_sent_at` should be set
- [ ] Check donor's email inbox (receipt email should be received)

## Database Queries for Debugging

### Check donations without receipts:
```sql
SELECT 
  id, 
  donor_email, 
  amount, 
  payment_status, 
  receipt_number,
  receipt_generated_at,
  created_at
FROM donations
WHERE payment_status = 'completed'
  AND receipt_number IS NULL
ORDER BY created_at DESC
LIMIT 10;
```

### Check recent receipt generation:
```sql
SELECT 
  id,
  donor_email,
  amount,
  receipt_number,
  receipt_generated_at,
  receipt_sent_at,
  created_at
FROM donations
WHERE receipt_number IS NOT NULL
ORDER BY receipt_generated_at DESC
LIMIT 10;
```

### Check webhook event processing:
```sql
SELECT 
  event_id,
  provider,
  donation_id,
  created_at
FROM payment_events
ORDER BY created_at DESC
LIMIT 20;
```

## Manual Receipt Generation

If receipts failed to generate automatically, you can trigger them manually:

### Option 1: Using Admin Dashboard
(If implemented)
1. Go to Admin → Donations
2. Find the donation
3. Click "Generate Receipt" or "Resend Receipt"

### Option 2: Using Database Function
```sql
-- This would require implementing a database function
-- For now, receipts can be regenerated by calling the API
```

### Option 3: Using API Endpoint
Create a script to call the receipt generation function:

```typescript
// scripts/regenerate-receipt.ts
import { generateReceiptForDonation } from '@/lib/actions/donation-receipt';

const donationId = 'your-donation-id';
const result = await generateReceiptForDonation({ donationId });
console.log(result);
```

## Production Deployment Checklist

Before deploying to production:

- [ ] All environment variables configured in Vercel
- [ ] Webhook endpoint created in Stripe Dashboard
- [ ] Webhook secret matches between Stripe and Vercel
- [ ] Using production Stripe keys (sk_live_..., not sk_test_...)
- [ ] PAYMENT_MODE set to "live"
- [ ] Gmail App Password generated and configured
- [ ] Test donation completed successfully end-to-end
- [ ] Receipt email received
- [ ] Diagnostic endpoint returns all green

## Getting Help

If issues persist:

1. **Check Vercel Logs**: Most issues show up in runtime logs
2. **Check Stripe Logs**: Webhook delivery issues show up here
3. **Check Supabase Logs**: Database issues show up here
4. **Test Locally**: Use Stripe CLI to test webhook flow locally first

## Related Documentation

- [Stripe Setup Guide](./STRIPE_SETUP_GUIDE.md)
- [Receipt System Documentation](./RECEIPT_SYSTEM.md)
- [Webhook Integration Guide](./RECEIPT_WEBHOOK_INTEGRATION.md)
