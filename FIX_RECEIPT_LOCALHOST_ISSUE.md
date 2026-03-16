# URGENT FIX: Receipt URLs Using Localhost Instead of Production Domain

## Your Specific Issue

**Error:** `Failed to load resource: net::ERR_BLOCKED_BY_CLIENT`  
**URL:** `localhost:3000/api/receipts/download?token=...`

**Root Cause:** The `NEXT_PUBLIC_APP_URL` environment variable is not set in Vercel, so receipt URLs default to `localhost:3000`.

---

## 🚀 Quick Fix (3 minutes)

### Step 1: Add Environment Variable to Vercel

1. Go to https://vercel.com/dashboard
2. Select your project
3. Click **Settings** → **Environment Variables**
4. Click **Add New**
5. Enter:
   - **Key:** `NEXT_PUBLIC_APP_URL`
   - **Value:** `https://your-actual-domain.com` (replace with your real domain)
   - **Environments:** Check all three (Production, Preview, Development)
6. Click **Save**

### Step 2: Redeploy

Vercel will automatically redeploy. If not:
- Go to **Deployments** tab
- Click **Redeploy** on the latest deployment

OR push a commit:
```bash
git commit --allow-empty -m "Trigger redeploy for env var update"
git push
```

### Step 3: Verify the Fix

1. Wait for deployment to complete (1-2 minutes)
2. Make a test donation
3. Try to download the receipt
4. Should work without `ERR_BLOCKED_BY_CLIENT` error

---

## What This Fixes

### Before (Broken):
```
Receipt URL: http://localhost:3000/api/receipts/download?token=...
Browser: ❌ ERR_BLOCKED_BY_CLIENT (can't access localhost from production)
```

### After (Fixed):
```
Receipt URL: https://your-domain.com/api/receipts/download?token=...
Browser: ✅ Downloads receipt successfully
```

---

## For Your Specific Setup

Based on your `.env` file, you should set:

```bash
# In Vercel Environment Variables:
NEXT_PUBLIC_APP_URL=https://dessafoundation.org
NEXT_PUBLIC_SITE_URL=https://dessafoundation.org
```

Replace `dessafoundation.org` with your actual production domain.

---

## Fixing Existing Receipts

Receipts that were already generated with `localhost:3000` URLs will be automatically fixed when:
- A donor clicks "Resend Receipt"
- An admin resends the receipt
- The receipt is accessed again

Or you can manually regenerate them (see [Receipt URL Fix Guide](./docs/RECEIPT_URL_FIX.md) for details).

---

## Verification Checklist

After deploying:

- [ ] Environment variable `NEXT_PUBLIC_APP_URL` is set in Vercel
- [ ] Value is your production domain (not localhost)
- [ ] Deployment completed successfully
- [ ] Made a test donation
- [ ] Receipt download works without errors
- [ ] No `ERR_BLOCKED_BY_CLIENT` in browser console

---

## If Still Not Working

1. **Check the environment variable is saved:**
   - Go to Vercel → Settings → Environment Variables
   - Verify `NEXT_PUBLIC_APP_URL` shows your domain

2. **Verify deployment used the new variable:**
   - Go to Vercel → Deployments → Latest deployment
   - Click on it → Environment Variables tab
   - Should show `NEXT_PUBLIC_APP_URL` with your domain

3. **Clear browser cache:**
   - Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
   - Or open in incognito/private window

4. **Check the receipt URL in database:**
   ```sql
   SELECT receipt_url FROM donations ORDER BY created_at DESC LIMIT 1;
   ```
   Should show your domain, not localhost

---

## Additional Environment Variables to Check

While you're in Vercel environment variables, also verify these are set:

```bash
# Required for receipt generation:
GOOGLE_EMAIL=your-email@gmail.com
GOOGLE_APP_PASSWORD=your-app-password
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret
RECEIPT_TOKEN_SECRET=your-random-secret
```

See [Receipt Quick Fix Guide](./docs/RECEIPT_QUICK_FIX.md) for details on each variable.

---

## Summary

**Problem:** Receipt URLs using localhost  
**Solution:** Set `NEXT_PUBLIC_APP_URL` in Vercel  
**Time:** 3 minutes  
**Impact:** Fixes receipt downloads immediately  

**Next Steps:**
1. Add environment variable
2. Redeploy
3. Test receipt download
4. ✅ Done!
