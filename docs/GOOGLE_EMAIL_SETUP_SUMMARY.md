# Receipt System - Google Email Configuration Complete

## What You Need to Do

### 1. Copy & Paste SQL Script (5 minutes)

**File:** `scripts/011-receipt-system-complete.sql`

Steps:
1. Open: https://app.supabase.com
2. Go to: SQL Editor → New Query
3. Copy entire contents of `scripts/011-receipt-system-complete.sql`
4. Paste into SQL Editor
5. Click "Run"
6. Done! ✅

This script does everything:
- Adds receipt columns to donations table
- Creates receipt_audit_log table
- Sets up indexes
- Configures security policies
- Creates storage bucket
- Initializes organization settings

---

### 2. Configure Google Email (10 minutes)

**Follow:** `docs/GOOGLE_EMAIL_SETUP.md`

Quick steps:
1. Enable 2-Factor Authentication on Gmail: https://myaccount.google.com/security
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Add to `.env.local`:

```env
GOOGLE_EMAIL=your-email@gmail.com
GOOGLE_APP_PASSWORD=xxxx xxxx xxxx xxxx
```

4. Restart dev server: `npm run dev`

That's it! ✅

---

### 3. Set Organization Details (10 minutes)

1. Go to: `http://localhost:3000/admin/settings/organization`
2. Fill in all fields
3. Click "Save Organization Details"
4. Done! ✅

---

### 4. Add to Payment Webhooks (15 minutes)

Add this to your Stripe/Khalti/eSewa webhook handlers:

```typescript
import { generateReceiptForDonation } from "@/lib/actions/donation-receipt"

// After payment is confirmed
await generateReceiptForDonation({ donationId })
```

See: `docs/RECEIPT_WEBHOOK_INTEGRATION.md` for full examples

---

## Files Created/Updated

### New Files
- `scripts/011-receipt-system-complete.sql` - Complete SQL setup
- `docs/GOOGLE_EMAIL_SETUP.md` - Google email configuration guide
- `docs/QUICK_DEPLOYMENT_GOOGLE_EMAIL.md` - Quick deployment guide

### Updated Files
- `lib/email/receipt-mailer.ts` - Google email integration

---

## Environment Variables

Add to `.env.local`:

```env
# Google Email (Required)
GOOGLE_EMAIL=your-email@gmail.com
GOOGLE_APP_PASSWORD=xxxx xxxx xxxx xxxx

# Site URL (Optional but recommended)
NEXT_PUBLIC_SITE_URL=https://dessafoundation.org
```

---

## Testing

1. Make test donation
2. Complete payment
3. Check email for receipt
4. Verify receipt on success page
5. Test download
6. Test resend email

---

## Key Features

✅ Automatic receipt generation after payment
✅ Email sent via Google Email (Gmail/Google Workspace)
✅ Professional receipt with organization details
✅ Tax compliance (VAT, PAN, SWC numbers)
✅ Download receipt anytime
✅ Resend email option
✅ Admin management
✅ Audit logging
✅ Security best practices

---

## Documentation

- **Quick Start:** `docs/QUICK_DEPLOYMENT_GOOGLE_EMAIL.md`
- **Email Setup:** `docs/GOOGLE_EMAIL_SETUP.md`
- **Complete Docs:** `docs/RECEIPT_SYSTEM.md`
- **Webhook Integration:** `docs/RECEIPT_WEBHOOK_INTEGRATION.md`

---

## Support

For issues:
1. Check `docs/GOOGLE_EMAIL_SETUP.md` troubleshooting section
2. Verify environment variables are set
3. Check server logs
4. Restart development server

---

**Everything is ready!** 🎉

Just follow the 4 steps above and you're done.
