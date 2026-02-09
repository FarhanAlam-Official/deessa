# Receipt System - Troubleshooting Guide

## Issue: Receipt Not Showing on Success Page

### What Was Fixed

The success page now has a **"Generate & Download Receipt"** button that appears after payment is completed.

**Updated File:** `app/(public)/donate/success/success-content.tsx`

### How It Works Now

1. **Payment Completed** → Success page loads
2. **Button Appears** → "Generate & Download Receipt" button shows
3. **Click Button** → Receipt is generated
4. **Receipt Displays** → Receipt preview shows with download options
5. **Email Sent** → Receipt emailed to donor

---

## Testing the Receipt System

### Step 1: Make a Test Donation

1. Go to: `http://localhost:3000/donate`
2. Fill in donation form
3. Select payment method (Stripe recommended for testing)
4. Complete payment

### Step 2: Check Success Page

1. After payment, you should see success page
2. Look for **"Generate & Download Receipt"** button
3. Click the button
4. Receipt should generate and display

### Step 3: Verify Receipt

Receipt preview should show:
- ✅ Receipt number (RCP-2024-001)
- ✅ Organization details
- ✅ Donor information
- ✅ Donation amount
- ✅ Download button
- ✅ Resend email button

### Step 4: Check Email

1. Check donor email inbox
2. Look for receipt email from: `your-email@gmail.com`
3. Email should contain:
   - Receipt number
   - Donation amount
   - Download link
   - Thank you message

---

## Troubleshooting

### Issue: Button Doesn't Appear

**Cause:** Payment status is not "completed"

**Solution:**
1. Check database: `SELECT payment_status FROM donations WHERE id = 'xxx'`
2. Verify payment was actually completed
3. Check payment provider webhook

### Issue: Receipt Generation Fails

**Cause:** Organization details not configured

**Solution:**
1. Go to: `/admin/settings/organization`
2. Fill in all fields
3. Click "Save Organization Details"
4. Try again

### Issue: Email Not Received

**Cause:** Google email not configured

**Solution:**
1. Check `.env.local` has:
   - `GOOGLE_EMAIL=your-email@gmail.com`
   - `GOOGLE_APP_PASSWORD=xxxx xxxx xxxx xxxx`
2. Restart dev server: `npm run dev`
3. Check email service logs

### Issue: Receipt URL Not Working

**Cause:** Supabase Storage bucket not created

**Solution:**
1. Run SQL script again: `scripts/011-receipt-system-complete.sql`
2. Verify receipts bucket exists in Supabase Storage
3. Check bucket is public

---

## Debugging Steps

### Check Database

```sql
-- Check if receipt was created
SELECT 
  id, 
  receipt_number, 
  receipt_url, 
  receipt_generated_at,
  payment_status
FROM donations
WHERE id = 'your-donation-id';
```

### Check Server Logs

Look for errors in terminal:
```
npm run dev
```

Watch for:
- Receipt generation errors
- Email sending errors
- Storage upload errors

### Check Email Configuration

Test email setup:
```typescript
import { testGoogleEmailConfiguration } from "@/lib/email/receipt-mailer"

const result = await testGoogleEmailConfiguration()
console.log(result)
```

Expected output:
```
{
  success: true,
  message: "Gmail connection successful. Emails will be sent from: your-email@gmail.com"
}
```

---

## Complete Workflow

```
1. Donor Makes Donation
   ↓
2. Payment Completed
   ↓
3. Success Page Loads
   ↓
4. "Generate & Download Receipt" Button Shows
   ↓
5. Donor Clicks Button
   ↓
6. Receipt Generated
   ↓
7. Receipt Stored in Supabase Storage
   ↓
8. Email Sent to Donor
   ↓
9. Receipt Preview Displays
   ↓
10. Donor Can Download/Resend/Share
```

---

## Files Updated

- `app/(public)/donate/success/success-content.tsx` - Added receipt generation button and display

---

## Next Steps

1. ✅ Restart dev server: `npm run dev`
2. ✅ Make test donation
3. ✅ Click "Generate & Download Receipt" button
4. ✅ Verify receipt displays
5. ✅ Check email received
6. ✅ Test download functionality

---

## Support

If you still have issues:

1. Check server logs for errors
2. Verify organization details are saved
3. Verify Google email is configured
4. Check Supabase Storage bucket exists
5. Run SQL script again if needed

---

**Everything should work now!** 🎉

Make a test donation and click the receipt button to see it in action.
