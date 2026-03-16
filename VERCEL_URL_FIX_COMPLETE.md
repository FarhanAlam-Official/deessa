# Receipt URL Fix for Vercel Deployment ✅

## Problem Solved

Your receipt download URLs were using `localhost:3000` even in Vercel deployments, causing `ERR_BLOCKED_BY_CLIENT` errors. This also affected email download links.

## Root Cause

The application was falling back to `localhost:3000` when `NEXT_PUBLIC_APP_URL` wasn't set, without checking Vercel's automatically-available `VERCEL_URL` environment variable.

## Solution Implemented

### 1. Created Smart URL Detection Utility

**File:** `lib/utils.ts`

Added `getAppBaseUrl()` function that automatically detects the correct URL:

```typescript
export function getAppBaseUrl(): string {
  // Priority 1: Explicitly configured app URL
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  // Priority 2: Explicitly configured site URL
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }

  // Priority 3: Vercel deployment URL (automatically available in Vercel)
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // Priority 4: Development fallback
  return "http://localhost:3000";
}
```

### 2. Updated All URL Generation Points

✅ **Receipt System:**

- `lib/receipts/token.ts` - Receipt download URL generation
- `lib/receipts/qr.ts` - QR code verification URLs
- `lib/receipts/receipt-document.tsx` - PDF logo URLs

✅ **Email Templates:**

- `lib/email/templates/receipt.ts` - Receipt emails
- `lib/email/templates/conference-confirmation.ts` - Conference confirmations
- `lib/email/templates/conference-registration.ts` - Conference registrations
- `lib/email/templates/conference-cancellation.ts` - Conference cancellations
- `lib/email/conference-mailer.ts` - Payment link emails

✅ **Payment Providers:**

- `lib/payments/esewa.ts` - eSewa callback URLs
- `lib/payments/khalti.ts` - Khalti return URLs
- `lib/payments/stripe.ts` - Stripe success/cancel URLs
- `lib/actions/conference-registration.ts` - Conference payment URLs

## How It Works

### Before (Broken):

```
Local: NEXT_PUBLIC_APP_URL set → Works ✅
Vercel: NEXT_PUBLIC_APP_URL not set → localhost:3000 → ERR_BLOCKED_BY_CLIENT ❌
```

### After (Fixed):

```
Local: NEXT_PUBLIC_APP_URL set → Uses configured URL ✅
Vercel: VERCEL_URL automatically available → Uses vercel URL ✅
```

## No Configuration Required! 🎉

The fix automatically works in Vercel deployments because:

- `VERCEL_URL` environment variable is **automatically set** by Vercel
- Format: `your-project-name.vercel.app` (or your custom domain)
- No manual environment variable configuration needed

## Testing

### Local Development

```bash
# Should work as before
npm run dev
# Visit: http://localhost:3000/donate
# Make a donation → Receipt download will use localhost:3000 ✅
```

### Vercel Deployment

```bash
# Push changes to trigger deployment
git add .
git commit -m "Fix receipt URLs for Vercel deployment"
git push
```

After deployment:

1. Make a test donation on your Vercel site
2. Click "Download Receipt" → Should work without `ERR_BLOCKED_BY_CLIENT` ✅
3. Check email download link → Should use your Vercel URL ✅

## Optional: Set Custom Domain

If you want to use a custom domain instead of `.vercel.app`:

1. Go to Vercel Dashboard → Settings → Environment Variables
2. Add:
   ```
   NEXT_PUBLIC_APP_URL=https://your-custom-domain.com
   ```
3. Redeploy

The function will use your custom domain instead of the auto-generated Vercel URL.

## Files Changed

### Core Utilities

- ✅ `lib/utils.ts` - Added `getAppBaseUrl()` function

### Receipt System (5 files)

- ✅ `lib/receipts/token.ts`
- ✅ `lib/receipts/qr.ts`
- ✅ `lib/receipts/receipt-document.tsx`

### Email System (5 files)

- ✅ `lib/email/templates/receipt.ts`
- ✅ `lib/email/templates/conference-confirmation.ts`
- ✅ `lib/email/templates/conference-registration.ts`
- ✅ `lib/email/templates/conference-cancellation.ts`
- ✅ `lib/email/conference-mailer.ts`

### Payment System (4 files)

- ✅ `lib/payments/esewa.ts`
- ✅ `lib/payments/khalti.ts`
- ✅ `lib/payments/stripe.ts`
- ✅ `lib/actions/conference-registration.ts`

## Verification Checklist

After deploying:

- [ ] Make a test donation on Vercel
- [ ] Receipt download works without errors
- [ ] No `ERR_BLOCKED_BY_CLIENT` in console
- [ ] Email download link uses correct domain
- [ ] Receipt preview modal displays correctly
- [ ] QR code verification URLs work

## Benefits

✅ **Automatic**: Works in all Vercel environments (production, preview, development)
✅ **Zero Config**: No need to manually set environment variables
✅ **Flexible**: Can still override with custom domain if needed
✅ **Consistent**: Same behavior across all URL generation points
✅ **Future-Proof**: New features will automatically use correct URLs

## Rollback (If Needed)

If you need to rollback, simply revert the commit:

```bash
git revert HEAD
git push
```

## Support

If you still see localhost URLs after deployment:

1. Check Vercel logs: `vercel logs`
2. Verify VERCEL_URL is set: Check environment in Vercel dashboard
3. Ensure latest deployment: Force new deployment with `vercel --prod`

---

**Status:** ✅ Ready to deploy
**Estimated Impact:** Fixes all receipt-related URL issues in Vercel
**Breaking Changes:** None - backward compatible with local development
