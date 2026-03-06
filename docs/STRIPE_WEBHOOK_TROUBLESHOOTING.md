# Stripe Webhook Troubleshooting Guide

This guide helps you diagnose and fix issues with Stripe webhooks in production (Vercel deployment).

## Quick Diagnostic Checklist

Use this checklist to quickly identify webhook configuration issues:

- [ ] **Webhook endpoint is accessible**
  - Visit `https://yourdomain.com/api/webhooks/stripe/test` in your browser
  - Should return JSON with configuration status
  - If you get 404, the endpoint isn't deployed correctly

- [ ] **Environment variables are configured in Vercel**
  - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
  - Verify all required variables are present (see section below)

- [ ] **Webhook is registered in Stripe Dashboard**
  - Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
  - Verify your production URL is listed
  - Check that status shows "Enabled"

- [ ] **Correct events are subscribed**
  - In Stripe webhook settings, verify these events are selected:
    - `checkout.session.completed`
    - `checkout.session.expired`
    - `payment_intent.payment_failed`
    - `invoice.payment_succeeded`

- [ ] **Webhook secret matches Vercel environment**
  - The `STRIPE_WEBHOOK_SECRET` in Vercel must match the signing secret shown in Stripe Dashboard
  - **Important:** This is different from the Stripe CLI secret used in local development

## 1. Vercel Environment Variable Setup

### Required Environment Variables

Your Vercel project needs these environment variables configured:

| Variable | Description | Example |
|----------|-------------|---------|
| `STRIPE_SECRET_KEY` | Your Stripe secret key | `sk_live_...` or `sk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret | `whsec_...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | `eyJ...` |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | `https://xxx.supabase.co` |
| `PAYMENT_MODE` | Payment mode | `live` for production |

### How to Add/Update Environment Variables in Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Click **Settings** → **Environment Variables**
4. For each variable:
   - Click **Add New**
   - Enter the **Key** (e.g., `STRIPE_WEBHOOK_SECRET`)
   - Enter the **Value** (paste the secret)
   - Select environment: **Production**, **Preview**, and **Development** (or just Production)
   - Click **Save**
5. **Redeploy your application** after adding/updating variables:
   - Go to **Deployments** tab
   - Click the three dots on the latest deployment
   - Click **Redeploy**

### Verifying Environment Variables

After deployment, test the diagnostic endpoint:

```bash
curl https://yourdomain.com/api/webhooks/stripe/test
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
    "paymentMode": "live",
    "timestamp": "2026-03-06T...",
    "environment": "production"
  },
  "message": "All required environment variables are configured"
}
```

If any value shows `false`, that environment variable is missing or not loaded correctly.

## 2. Stripe Dashboard Webhook Configuration

### Step 1: Create Webhook Endpoint

1. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
2. Click **Add endpoint**
3. Enter your webhook URL:
   ```
   https://yourdomain.com/api/webhooks/stripe
   ```
   Replace `yourdomain.com` with your actual Vercel deployment URL

4. Click **Select events**

### Step 2: Subscribe to Required Events

Select these events (minimum required):

**For Donations:**
- `checkout.session.completed` - When payment succeeds
- `checkout.session.expired` - When user cancels or session times out
- `payment_intent.payment_failed` - When payment fails (card declined, etc.)

**For Recurring Donations:**
- `invoice.payment_succeeded` - When subscription payment succeeds
- `invoice.payment_failed` - When subscription payment fails
- `customer.subscription.created` - When subscription is created
- `customer.subscription.deleted` - When subscription is cancelled

### Step 3: Copy Webhook Secret

1. After creating the endpoint, click on it to view details
2. Click **Reveal** next to "Signing secret"
3. Copy the secret (starts with `whsec_`)
4. Add this to Vercel environment variables as `STRIPE_WEBHOOK_SECRET`
5. Redeploy your application

### Step 4: Test Webhook Delivery

1. In the webhook details page, click **Send test webhook**
2. Select event type: `checkout.session.completed`
3. Click **Send test webhook**
4. Check the response:
   - **200 OK** = Success ✅
   - **400/500** = Error (see logs below)

## 3. Testing Webhook Delivery

### Method 1: Stripe Dashboard Test

1. Go to your webhook endpoint in Stripe Dashboard
2. Click **Send test webhook**
3. Select an event type
4. Click **Send test webhook**
5. View the response and logs

### Method 2: Real Payment Test

1. Make a test donation on your site
2. Use Stripe test card: `4242 4242 4242 4242`
3. Complete the payment
4. Check Vercel logs (see section below)
5. Verify donation status in your database

### Method 3: Cancelled Payment Test

1. Start a donation on your site
2. At Stripe checkout, click the back button or close the tab
3. Wait for session to expire (24 hours) or trigger manually
4. Verify donation status updates to "cancelled"

### Method 4: Failed Payment Test

1. Start a donation on your site
2. Use declined test card: `4000 0000 0000 0002`
3. Try to complete payment
4. Verify donation status updates to "failed"

## 4. Accessing Vercel Logs

Logs are essential for debugging webhook issues.

### Viewing Real-Time Logs

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Click **Logs** tab (or **Deployments** → Click deployment → **Logs**)
4. Filter by:
   - **Source:** Select your production deployment
   - **Search:** Enter "webhook" or "stripe"

### Key Log Messages

**Success:**
```
Stripe webhook: Payment confirmed {donationId: '...', sessionId: '...', status: 'confirmed'}
```

**Signature Verification Failed:**
```
Stripe webhook signature verification failed: ...
```
**Fix:** Check that `STRIPE_WEBHOOK_SECRET` matches Stripe Dashboard

**Missing Environment Variable:**
```
STRIPE_WEBHOOK_SECRET is not configured
```
**Fix:** Add the variable in Vercel settings and redeploy

**No Donation ID:**
```
Stripe webhook: No donation ID found in session
```
**Fix:** Check that donation creation includes `client_reference_id` or `metadata.donation_id`

### Downloading Logs

For detailed analysis:

1. In Vercel Logs, click **Download**
2. Select time range
3. Analyze locally with grep/search

```bash
# Search for webhook errors
grep "webhook" vercel-logs.txt | grep -i "error"

# Search for specific donation
grep "donation-id-here" vercel-logs.txt
```

## 5. Common Error Scenarios

### Error: "Invalid signature"

**Symptoms:**
- Webhook returns 400
- Logs show "Stripe webhook signature verification failed"

**Causes:**
1. Wrong webhook secret in Vercel
2. Using Stripe CLI secret instead of production secret
3. Webhook secret not updated after rotation

**Solutions:**
1. Get the correct secret from Stripe Dashboard → Webhooks → Your endpoint → Signing secret
2. Update `STRIPE_WEBHOOK_SECRET` in Vercel
3. Redeploy application
4. Test again

### Error: "Webhook not configured"

**Symptoms:**
- Webhook returns 500
- Logs show "STRIPE_WEBHOOK_SECRET is not configured"

**Causes:**
1. Environment variable not set in Vercel
2. Typo in variable name
3. Application not redeployed after adding variable

**Solutions:**
1. Add `STRIPE_WEBHOOK_SECRET` in Vercel → Settings → Environment Variables
2. Verify exact spelling (case-sensitive)
3. Redeploy application
4. Test diagnostic endpoint

### Error: Webhooks not being received at all

**Symptoms:**
- No webhook logs in Vercel
- Stripe Dashboard shows failed deliveries
- Donations stay in "pending" status

**Causes:**
1. Webhook endpoint not registered in Stripe Dashboard
2. Wrong URL in Stripe webhook configuration
3. Webhook endpoint not deployed

**Solutions:**
1. Verify webhook exists in Stripe Dashboard → Webhooks
2. Check URL matches your Vercel deployment: `https://yourdomain.com/api/webhooks/stripe`
3. Test endpoint accessibility: `curl https://yourdomain.com/api/webhooks/stripe/test`
4. Check Stripe Dashboard webhook status (should be "Enabled")

### Error: Donations stay "pending" after successful payment

**Symptoms:**
- Payment succeeds in Stripe
- Donation status remains "pending" in database
- No webhook logs in Vercel

**Causes:**
1. Webhook not configured (see above)
2. Webhook handler failing silently
3. Database update failing

**Solutions:**
1. Check Vercel logs for webhook processing
2. Check Stripe Dashboard → Webhooks → Recent deliveries
3. Verify `SUPABASE_SERVICE_ROLE_KEY` is configured
4. Test with diagnostic endpoint
5. Check database permissions

### Error: "checkout.session.completed" not updating status

**Symptoms:**
- Webhook is received (visible in logs)
- Logs show "No donation ID found"
- Status not updated

**Causes:**
1. Donation ID not passed to Stripe checkout
2. Missing `client_reference_id` or `metadata.donation_id`

**Solutions:**
1. Check donation creation code
2. Verify Stripe checkout session includes:
   ```typescript
   client_reference_id: donationId,
   metadata: { donation_id: donationId }
   ```
3. Test with a new donation

## 6. Verifying Webhook Configuration

### Complete Verification Checklist

Run through this checklist to ensure everything is configured correctly:

**1. Environment Variables**
```bash
curl https://yourdomain.com/api/webhooks/stripe/test
```
All values should be `true`

**2. Stripe Dashboard**
- [ ] Webhook endpoint exists
- [ ] URL is correct
- [ ] Status is "Enabled"
- [ ] Required events are subscribed
- [ ] Signing secret matches Vercel environment

**3. Test Webhook Delivery**
- [ ] Send test webhook from Stripe Dashboard
- [ ] Response is 200 OK
- [ ] Logs show webhook received

**4. End-to-End Test**
- [ ] Make test donation
- [ ] Payment succeeds
- [ ] Webhook received (check logs)
- [ ] Donation status updates to "confirmed"
- [ ] Receipt generated

**5. Failure Scenarios**
- [ ] Cancel payment → status updates to "cancelled"
- [ ] Declined card → status updates to "failed"
- [ ] Expired session → status updates to "cancelled"

## 7. Getting Help

If you've followed all steps and webhooks still aren't working:

1. **Check Stripe Status:** [https://status.stripe.com](https://status.stripe.com)
2. **Review Stripe Logs:** Dashboard → Developers → Logs
3. **Check Vercel Status:** [https://www.vercel-status.com](https://www.vercel-status.com)
4. **Contact Stripe Support:** They're very responsive and can check webhook delivery from their end

### Information to Provide

When seeking help, provide:
- Webhook endpoint URL
- Stripe webhook ID (from Dashboard)
- Example event ID that failed
- Vercel logs (redact sensitive data)
- Diagnostic endpoint response
- Steps you've already tried

## 8. Webhook Secret Rotation

For security, rotate webhook secrets quarterly:

1. In Stripe Dashboard → Webhooks → Your endpoint
2. Click **Roll secret**
3. Copy the new secret
4. Update `STRIPE_WEBHOOK_SECRET` in Vercel
5. Redeploy application
6. Test webhook delivery
7. Old secret remains valid for 24 hours (grace period)

## 9. Local vs Production Differences

| Aspect | Local Development | Production (Vercel) |
|--------|-------------------|---------------------|
| Webhook URL | `localhost:3000/api/webhooks/stripe` | `https://yourdomain.com/api/webhooks/stripe` |
| Webhook Secret | Stripe CLI generates temporary secret | Production secret from Stripe Dashboard |
| Webhook Delivery | Stripe CLI forwards events | Stripe sends directly to URL |
| Environment | `PAYMENT_MODE=mock` or test keys | `PAYMENT_MODE=live` with live keys |
| Testing | `stripe trigger` commands | Real payments or Dashboard test webhooks |

**Important:** Never use Stripe CLI webhook secret in production!

## 10. Monitoring Webhook Health

### Regular Checks

- **Daily:** Check Stripe Dashboard → Webhooks for failed deliveries
- **Weekly:** Review Vercel logs for webhook errors
- **Monthly:** Verify diagnostic endpoint returns all `true`
- **Quarterly:** Rotate webhook secrets

### Setting Up Alerts

Consider setting up alerts for:
- Webhook delivery failures (Stripe Dashboard)
- High error rates in Vercel logs
- Donations stuck in "pending" for > 1 hour

### Database Query for Stuck Donations

```sql
SELECT id, created_at, amount, payment_status, provider
FROM donations
WHERE payment_status = 'pending'
  AND created_at < NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;
```

If you find stuck donations, check:
1. Stripe Dashboard for corresponding payment
2. Vercel logs for webhook delivery
3. Webhook configuration in Stripe Dashboard

---

## Quick Reference

**Diagnostic Endpoint:**
```
GET https://yourdomain.com/api/webhooks/stripe/test
```

**Webhook Endpoint:**
```
POST https://yourdomain.com/api/webhooks/stripe
```

**Stripe Dashboard:**
- Webhooks: https://dashboard.stripe.com/webhooks
- Events: https://dashboard.stripe.com/events
- Logs: https://dashboard.stripe.com/logs

**Vercel Dashboard:**
- Logs: https://vercel.com/dashboard → Your Project → Logs
- Environment Variables: https://vercel.com/dashboard → Your Project → Settings → Environment Variables

**Test Cards:**
- Success: `4242 4242 4242 4242`
- Declined: `4000 0000 0000 0002`
- Insufficient funds: `4000 0000 0000 9995`
