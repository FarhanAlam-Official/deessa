# Receipt Generation Quick Fix Guide

## Problem: Receipts not being generated in Vercel

### 🔍 Quick Diagnosis (2 minutes)

1. **Check if webhooks are being received:**
   - Go to Stripe Dashboard → Webhooks → Your endpoint
   - Look at "Recent deliveries"
   - If empty or showing errors → **Issue A: Webhook not configured**
   - If showing 200 OK → **Issue B: Receipt generation failing**

2. **Check environment variables:**
   - Visit: `https://your-domain.vercel.app/api/webhooks/stripe/test`
   - If any value is `false` → **Issue C: Missing environment variables**

3. **Check Vercel logs:**
   - Vercel Dashboard → Your Project → Logs
   - Search for "Receipt generated" or "Receipt generation failed"
   - If no logs → **Issue A: Webhook not configured**
   - If error logs → **Issue D: Specific error**

---

## Issue A: Webhook Not Configured

**Symptoms:** No webhook logs in Vercel, Stripe shows no deliveries

**Fix (5 minutes):**

1. Go to https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. URL: `https://your-domain.vercel.app/api/webhooks/stripe`
4. Events: Select `checkout.session.completed` and `invoice.payment_succeeded`
5. Click "Add endpoint"
6. Copy the "Signing secret" (starts with `whsec_`)
7. Go to Vercel → Settings → Environment Variables
8. Add/Update: `STRIPE_WEBHOOK_SECRET` = the signing secret
9. Redeploy or wait for auto-deploy

**Test:** Make a test donation and check Stripe Dashboard for webhook delivery.

---

## Issue B: Receipt Generation Failing

**Symptoms:** Webhook received (200 OK), but no receipt generated

**Most likely cause:** Missing email configuration

**Fix (3 minutes):**

1. Generate Gmail App Password:
   - Go to https://myaccount.google.com/apppasswords
   - Create new app password for "Mail"
   - Copy the 16-character password

2. Add to Vercel:
   - Go to Vercel → Settings → Environment Variables
   - Add: `GOOGLE_EMAIL` = your-email@gmail.com
   - Add: `GOOGLE_APP_PASSWORD` = the 16-char password (with spaces)
   - Select all environments (Production, Preview, Development)
   - Save

3. Redeploy

**Test:** Make a test donation and check email inbox.

---

## Issue C: Missing Environment Variables

**Symptoms:** Diagnostic endpoint shows `false` for some variables

**Fix:** Add the missing variables to Vercel

### Required Variables:

```bash
# Supabase (get from Supabase Dashboard → Settings → API)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Stripe (get from Stripe Dashboard → Developers → API keys)
STRIPE_SECRET_KEY=sk_live_...  # Use sk_live_ for production
STRIPE_WEBHOOK_SECRET=whsec_...  # From webhook endpoint settings

# Email (generate from Gmail)
GOOGLE_EMAIL=your-email@gmail.com
GOOGLE_APP_PASSWORD=xxxx xxxx xxxx xxxx

# Site URLs (CRITICAL - must be your actual domain, not localhost!)
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_SITE_URL=https://your-domain.com
PAYMENT_MODE=live

# Security (generate with: openssl rand -base64 32)
RECEIPT_TOKEN_SECRET=your-random-secret
```

**Steps:**
1. Go to Vercel → Settings → Environment Variables
2. Add each missing variable
3. Select all environments
4. Save
5. Redeploy

---

## Issue D: Specific Errors

### Error: "ERR_BLOCKED_BY_CLIENT" - Receipt URLs using localhost

**Symptoms:**
- Browser console shows: `Failed to load resource: net::ERR_BLOCKED_BY_CLIENT`
- Receipt URL shows `localhost:3000` instead of your domain
- Receipt download button doesn't work

**Fix:**
1. Go to Vercel → Settings → Environment Variables
2. Add or update:
   ```
   NEXT_PUBLIC_APP_URL=https://your-actual-domain.com
   ```
3. Redeploy
4. Test receipt download

**Detailed guide:** See [Receipt URL Fix Guide](./RECEIPT_URL_FIX.md)

### Error: "GOOGLE_EMAIL or GOOGLE_APP_PASSWORD not configured"

**Fix:** See Issue B above

### Error: "Missing Supabase service role credentials"

**Fix:**
1. Go to Supabase Dashboard → Settings → API
2. Copy the "service_role" key (starts with `eyJ...`)
3. Add to Vercel as `SUPABASE_SERVICE_ROLE_KEY`
4. Redeploy

### Error: "Invalid signature"

**Fix:**
1. Go to Stripe Dashboard → Webhooks → Your endpoint
2. Click "Reveal" next to "Signing secret"
3. Copy the secret
4. Update `STRIPE_WEBHOOK_SECRET` in Vercel
5. Redeploy

### Error: "Donation not found"

**Cause:** Webhook received before donation was created (race condition)

**Fix:** This is rare and usually resolves itself. Stripe will retry the webhook.

---

## Verification Steps

After fixing, verify everything works:

1. **Test the diagnostic endpoint:**
   ```
   https://your-domain.vercel.app/api/webhooks/stripe/test
   ```
   Should return: `"status": "ok"`

2. **Make a test donation:**
   - Use test card: 4242 4242 4242 4242
   - Complete the payment
   - Check email for receipt

3. **Check Vercel logs:**
   - Should see: "Receipt generated for donation"
   - Should see: "Receipt email sent"

4. **Check database:**
   ```sql
   SELECT receipt_number, receipt_sent_at 
   FROM donations 
   ORDER BY created_at DESC 
   LIMIT 1;
   ```
   Both should have values.

---

## Still Not Working?

### Check Vercel Logs for Specific Errors

1. Go to Vercel Dashboard → Your Project → Logs
2. Filter by "Runtime Logs"
3. Look for errors after making a donation
4. Common errors and fixes:

| Error Message | Fix |
|--------------|-----|
| "GOOGLE_EMAIL or GOOGLE_APP_PASSWORD not configured" | Add email credentials (Issue B) |
| "Missing Supabase service role credentials" | Add SUPABASE_SERVICE_ROLE_KEY |
| "Invalid signature" | Update STRIPE_WEBHOOK_SECRET |
| "Failed to send receipt email" | Check Gmail credentials |
| "Receipt generation error" | Check all environment variables |

### Manual Receipt Generation

If you need to generate receipts for past donations:

1. Get the donation ID from database
2. Run this query in Supabase SQL Editor:
   ```sql
   -- Check if donation is ready for receipt
   SELECT id, payment_status, receipt_number
   FROM donations
   WHERE id = 'your-donation-id';
   ```
3. If `payment_status` = 'completed' and `receipt_number` is NULL, contact support

---

## Prevention

To avoid this issue in the future:

1. **Always test in staging first:**
   - Deploy to preview environment
   - Test with Stripe test mode
   - Verify receipts work before going live

2. **Monitor receipt generation:**
   - Check this query daily:
     ```sql
     SELECT COUNT(*) as missing_receipts
     FROM donations
     WHERE payment_status = 'completed'
       AND receipt_number IS NULL
       AND created_at > NOW() - INTERVAL '24 hours';
     ```
   - Should always be 0

3. **Set up alerts:**
   - Use Vercel log drains to send errors to Slack/email
   - Alert on "Receipt generation failed" messages

---

## Need More Help?

- **Detailed troubleshooting:** [Receipt Generation Troubleshooting Guide](./RECEIPT_GENERATION_TROUBLESHOOTING.md)
- **Full deployment guide:** [Vercel Receipt Deployment Checklist](./VERCEL_RECEIPT_DEPLOYMENT_CHECKLIST.md)
- **Stripe setup:** [Stripe Setup Guide](./STRIPE_SETUP_GUIDE.md)
