# Vercel Receipt Generation Deployment Checklist

## Overview

This checklist ensures that receipt generation works correctly in your Vercel production deployment. Follow each step in order.

## Pre-Deployment Checklist

### 1. Gmail Configuration

- [ ] Created a Gmail account or have access to existing one
- [ ] Enabled 2-Factor Authentication on Gmail account
- [ ] Generated App-Specific Password:
  - Go to https://myaccount.google.com/apppasswords
  - Select "Mail" as the app
  - Copy the 16-character password (format: `xxxx xxxx xxxx xxxx`)
- [ ] Tested email sending locally with these credentials

### 2. Supabase Configuration

- [ ] Have Supabase project URL (format: `https://xxx.supabase.co`)
- [ ] Have Supabase Service Role Key (starts with `eyJ...`)
  - Found in: Supabase Dashboard → Project Settings → API → service_role key
- [ ] Verified Service Role Key has full database access (bypasses RLS)

### 3. Stripe Configuration

- [ ] Have production Stripe Secret Key (starts with `sk_live_...`)
  - NOT the test key (`sk_test_...`)
- [ ] Have production Webhook Secret (starts with `whsec_...`)
  - NOT the Stripe CLI secret
- [ ] Know your production domain (e.g., `https://dessafoundation.org`)

## Vercel Environment Variables Setup

### Step 1: Access Vercel Environment Variables

1. Go to https://vercel.com/dashboard
2. Select your project
3. Click "Settings" tab
4. Click "Environment Variables" in the left sidebar

### Step 2: Add Required Variables

Add each of these variables. For each one:
- Click "Add New"
- Enter the key name
- Enter the value
- Select environments: ✅ Production, ✅ Preview, ✅ Development
- Click "Save"

#### Required Variables:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Stripe Configuration
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email Configuration
GOOGLE_EMAIL=your-email@gmail.com
GOOGLE_APP_PASSWORD=xxxx xxxx xxxx xxxx

# Site Configuration
NEXT_PUBLIC_SITE_URL=https://your-domain.com
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Payment Mode
PAYMENT_MODE=live

# Receipt Security
RECEIPT_TOKEN_SECRET=your-random-secret-here
```

#### Generate Random Secrets:

For `RECEIPT_TOKEN_SECRET`, generate a secure random string:

```bash
# On Mac/Linux:
openssl rand -base64 32

# On Windows (PowerShell):
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

### Step 3: Verify Variables

After adding all variables, verify they're set:

1. Click on each variable to expand it
2. Verify the value is correct (first few characters)
3. Verify all three environments are checked (Production, Preview, Development)

## Stripe Webhook Configuration

### Step 1: Create Webhook Endpoint

1. Go to https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. Enter endpoint URL: `https://your-domain.com/api/webhooks/stripe`
   - Replace `your-domain.com` with your actual Vercel domain
4. Click "Select events"
5. Select these events:
   - ✅ `checkout.session.completed`
   - ✅ `checkout.session.expired`
   - ✅ `invoice.payment_succeeded`
   - ✅ `invoice.payment_failed`
   - ✅ `payment_intent.payment_failed`
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.deleted`
6. Click "Add events"
7. Click "Add endpoint"

### Step 2: Get Webhook Secret

1. Click on the newly created endpoint
2. Click "Reveal" next to "Signing secret"
3. Copy the secret (starts with `whsec_...`)
4. Go back to Vercel → Environment Variables
5. Update `STRIPE_WEBHOOK_SECRET` with this value
6. Click "Save"

### Step 3: Verify Webhook Status

1. In Stripe Dashboard, verify the endpoint shows:
   - Status: ✅ Enabled
   - Events: 7 events selected
   - URL: Your production URL

## Deployment

### Step 1: Deploy to Vercel

If you haven't deployed yet:

```bash
# Install Vercel CLI (if not installed)
npm i -g vercel

# Deploy to production
vercel --prod
```

Or push to your main branch if you have automatic deployments enabled.

### Step 2: Wait for Deployment

1. Wait for deployment to complete
2. Note the deployment URL (e.g., `https://your-project.vercel.app`)
3. Verify the deployment is live by visiting the URL

## Post-Deployment Verification

### Step 1: Test Environment Configuration

Visit the diagnostic endpoint:

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
  },
  "message": "All required environment variables are configured"
}
```

**If any value is `false`:**
- Go back to Vercel → Environment Variables
- Add the missing variable
- Redeploy (or wait for auto-deploy)

### Step 2: Test Webhook Delivery

1. Go to Stripe Dashboard → Webhooks
2. Click on your endpoint
3. Click "Send test webhook"
4. Select event type: `checkout.session.completed`
5. Click "Send test webhook"

**Expected result:**
- Status: 200 OK
- Response time: < 5 seconds

**If you see errors:**
- 400 "Invalid signature": Wrong webhook secret in Vercel
- 500 "Webhook not configured": Missing environment variables
- Timeout: Check Vercel logs for errors

### Step 3: Test Complete Payment Flow

Use Stripe test mode first:

1. Temporarily switch to test mode:
   - Vercel → Environment Variables
   - Change `STRIPE_SECRET_KEY` to test key (`sk_test_...`)
   - Change `STRIPE_WEBHOOK_SECRET` to test webhook secret
   - Redeploy

2. Make a test donation:
   - Go to your donation page
   - Enter test card: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., `12/34`)
   - CVC: Any 3 digits (e.g., `123`)
   - Complete the donation

3. Verify the flow:
   - [ ] Redirected to success page
   - [ ] Donation status shows "completed"
   - [ ] Receipt number is displayed
   - [ ] Receipt email received

4. Check Vercel logs:
   - Go to Vercel Dashboard → Your Project → Logs
   - Filter by "Runtime Logs"
   - Look for:
     ```
     Stripe webhook: Payment confirmed
     Stripe webhook: Receipt generated for donation
     Receipt email sent
     ```

5. Check database:
   ```sql
   SELECT 
     id, 
     payment_status, 
     receipt_number, 
     receipt_generated_at, 
     receipt_sent_at
   FROM donations
   ORDER BY created_at DESC
   LIMIT 1;
   ```
   - [ ] `payment_status` = "completed"
   - [ ] `receipt_number` is set
   - [ ] `receipt_generated_at` is set
   - [ ] `receipt_sent_at` is set

### Step 4: Switch to Live Mode

Once test mode works:

1. Update Vercel environment variables:
   - `STRIPE_SECRET_KEY` → Live key (`sk_live_...`)
   - `STRIPE_WEBHOOK_SECRET` → Live webhook secret
   - `PAYMENT_MODE` → `live`

2. Update Stripe webhook endpoint:
   - Ensure it's pointing to production URL
   - Ensure it's using live mode (not test mode)

3. Redeploy

4. Make a small real donation to test (or use Stripe test cards in live mode)

## Troubleshooting

### Issue: Receipts Not Generated

**Check:**
1. Vercel logs for errors
2. Database: Are donations marked as "completed"?
3. Stripe Dashboard: Are webhooks being delivered?

**Common causes:**
- Missing `GOOGLE_EMAIL` or `GOOGLE_APP_PASSWORD`
- Missing `SUPABASE_SERVICE_ROLE_KEY`
- Wrong webhook secret

**Solution:** See [Receipt Generation Troubleshooting Guide](./RECEIPT_GENERATION_TROUBLESHOOTING.md)

### Issue: Webhooks Not Received

**Check:**
1. Stripe Dashboard → Webhooks → Recent deliveries
2. Look for failed deliveries or timeouts

**Common causes:**
- Webhook endpoint URL is wrong
- Webhook secret doesn't match
- Endpoint is not enabled

**Solution:**
1. Verify webhook URL in Stripe matches your Vercel domain
2. Verify webhook secret in Vercel matches Stripe
3. Ensure endpoint is enabled in Stripe Dashboard

### Issue: Email Not Sent

**Check:**
1. Vercel logs for email errors
2. Gmail account for sending limits or blocks

**Common causes:**
- Wrong Gmail credentials
- App password not generated
- Gmail account locked or requires verification

**Solution:**
1. Regenerate Gmail app password
2. Verify credentials are correct in Vercel
3. Check Gmail account status

## Monitoring

### Daily Checks

Run this query in Supabase to check receipt generation:

```sql
SELECT 
  DATE(created_at) as date,
  COUNT(*) as total_donations,
  COUNT(receipt_number) as receipts_generated,
  COUNT(receipt_sent_at) as receipts_sent
FROM donations
WHERE created_at > NOW() - INTERVAL '7 days'
  AND payment_status = 'completed'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

Expected: 100% receipt generation and email sending rate.

### Weekly Checks

1. Check Stripe Dashboard → Webhooks for any failed deliveries
2. Check Vercel logs for any recurring errors
3. Verify email sending is working (check Gmail sent folder)

## Rollback Plan

If issues occur in production:

1. **Immediate:** Set `PAYMENT_MODE=mock` in Vercel to stop real payments
2. **Investigate:** Check Vercel logs and Stripe Dashboard
3. **Fix:** Update environment variables or code as needed
4. **Test:** Use test mode to verify fix
5. **Resume:** Set `PAYMENT_MODE=live` after verification

## Success Criteria

✅ Deployment is successful when:

- [ ] Diagnostic endpoint returns all green
- [ ] Test donation completes successfully
- [ ] Receipt is generated automatically
- [ ] Receipt email is received
- [ ] Stripe webhook shows 200 OK
- [ ] Database shows receipt data
- [ ] Vercel logs show no errors

## Support

If you continue to have issues:

1. Check [Receipt Generation Troubleshooting Guide](./RECEIPT_GENERATION_TROUBLESHOOTING.md)
2. Check [Stripe Setup Guide](./STRIPE_SETUP_GUIDE.md)
3. Review Vercel logs for specific error messages
4. Check Stripe Dashboard for webhook delivery status

## Related Documentation

- [Receipt Generation Troubleshooting](./RECEIPT_GENERATION_TROUBLESHOOTING.md)
- [Stripe Setup Guide](./STRIPE_SETUP_GUIDE.md)
- [Receipt System Documentation](./RECEIPT_SYSTEM.md)
