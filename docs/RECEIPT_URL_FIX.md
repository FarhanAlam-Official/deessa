# Receipt Download URL Fix - ERR_BLOCKED_BY_CLIENT

## Problem

Receipt download URLs are using `localhost:3000` instead of the production domain, causing browser to block the requests with `ERR_BLOCKED_BY_CLIENT`.

**Error in browser console:**
```
Failed to load resource: net::ERR_BLOCKED_BY_CLIENT
localhost:3000/api/receipts/download?token=...
```

## Root Cause

The `NEXT_PUBLIC_SITE_URL` or `NEXT_PUBLIC_APP_URL` environment variable is not set in Vercel, so the receipt URL generation defaults to `http://localhost:3000`.

## Quick Fix (2 minutes)

### Step 1: Add Environment Variable in Vercel

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables

2. Add this variable:
   ```
   Key: NEXT_PUBLIC_APP_URL
   Value: https://your-actual-domain.com
   ```
   
   OR if you already have `NEXT_PUBLIC_SITE_URL`:
   ```
   Key: NEXT_PUBLIC_SITE_URL
   Value: https://your-actual-domain.com
   ```

3. Select all environments:
   - ✅ Production
   - ✅ Preview
   - ✅ Development

4. Click "Save"

### Step 2: Redeploy

The environment variable change will trigger an automatic redeployment. If not:

```bash
# Using Vercel CLI
vercel --prod

# Or push to your main branch
git push origin main
```

### Step 3: Verify

1. Make a test donation
2. Check the receipt URL in the database:
   ```sql
   SELECT receipt_url FROM donations ORDER BY created_at DESC LIMIT 1;
   ```
3. Should now show: `https://your-domain.com/api/receipts/download?token=...`
4. Click the receipt download link - should work without errors

## For Different Environments

### Production
```bash
NEXT_PUBLIC_APP_URL=https://dessafoundation.org
NEXT_PUBLIC_SITE_URL=https://dessafoundation.org
```

### Preview/Staging
```bash
NEXT_PUBLIC_APP_URL=https://staging.dessafoundation.org
NEXT_PUBLIC_SITE_URL=https://staging.dessafoundation.org
```

### Development (Local)
```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## What Changed in the Code

Updated `lib/receipts/token.ts` to prioritize `NEXT_PUBLIC_APP_URL` over `NEXT_PUBLIC_SITE_URL`:

```typescript
const siteUrl = baseUrl || 
                process.env.NEXT_PUBLIC_APP_URL || 
                process.env.NEXT_PUBLIC_SITE_URL || 
                "http://localhost:3000"
```

This ensures the receipt URLs use the correct domain in all environments.

## Fixing Existing Receipts

If you have existing receipts with `localhost:3000` URLs in the database, you can regenerate them:

### Option 1: Automatic Regeneration (Recommended)

The receipt system will automatically regenerate the URL when:
- A donor clicks "Resend Receipt"
- An admin resends the receipt
- The receipt is accessed via the `ensureReceiptSent` function

### Option 2: Manual Database Update

**⚠️ Use with caution - test on a single record first!**

```sql
-- First, verify the current URLs
SELECT id, receipt_url 
FROM donations 
WHERE receipt_url LIKE '%localhost:3000%'
LIMIT 5;

-- If you want to clear them (they'll be regenerated on next access)
UPDATE donations
SET receipt_url = NULL
WHERE receipt_url LIKE '%localhost:3000%'
  AND receipt_number IS NOT NULL;
```

After clearing, receipts will be regenerated with the correct URL when accessed.

### Option 3: Regenerate via Script

Create a script to regenerate all receipt URLs:

```typescript
// scripts/fix-receipt-urls.ts
import { createClient } from '@supabase/supabase-js';
import { generateReceiptDownloadUrl } from '@/lib/receipts/token';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function fixReceiptUrls() {
  // Get all donations with localhost URLs
  const { data: donations } = await supabase
    .from('donations')
    .select('id, receipt_number')
    .like('receipt_url', '%localhost:3000%')
    .not('receipt_number', 'is', null);

  console.log(`Found ${donations?.length || 0} receipts to fix`);

  for (const donation of donations || []) {
    // Generate new URL with correct domain
    const newUrl = await generateReceiptDownloadUrl(
      donation.id,
      donation.receipt_number
    );

    // Update database
    await supabase
      .from('donations')
      .update({ receipt_url: newUrl })
      .eq('id', donation.id);

    console.log(`Fixed receipt URL for donation ${donation.id}`);
  }

  console.log('Done!');
}

fixReceiptUrls();
```

Run with:
```bash
npx tsx scripts/fix-receipt-urls.ts
```

## Prevention

To prevent this issue in the future:

1. **Always set environment variables before first deployment:**
   - Add `NEXT_PUBLIC_APP_URL` to Vercel before deploying
   - Use the actual production domain, not localhost

2. **Use environment-specific values:**
   - Production: Real domain
   - Preview: Preview domain or staging domain
   - Development: localhost:3000

3. **Test in preview environment first:**
   - Deploy to preview branch
   - Test receipt generation
   - Verify URLs use correct domain
   - Then deploy to production

## Verification Checklist

After applying the fix:

- [ ] `NEXT_PUBLIC_APP_URL` or `NEXT_PUBLIC_SITE_URL` set in Vercel
- [ ] Value is the correct production domain (not localhost)
- [ ] Redeployed to production
- [ ] Made a test donation
- [ ] Receipt URL in database uses correct domain
- [ ] Receipt download link works in browser
- [ ] No `ERR_BLOCKED_BY_CLIENT` errors in console

## Related Issues

This same issue can affect:
- QR code verification URLs
- Email links
- Any other URLs generated server-side

Make sure `NEXT_PUBLIC_APP_URL` is set correctly for all URL generation.

## Need Help?

If the issue persists:

1. Check Vercel environment variables are saved correctly
2. Verify redeployment completed successfully
3. Clear browser cache and try again
4. Check browser console for other errors
5. Verify the domain in the environment variable matches your actual domain

---

**Quick Summary:**
1. Add `NEXT_PUBLIC_APP_URL=https://your-domain.com` to Vercel
2. Redeploy
3. Test receipt download
