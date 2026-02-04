# Receipt System - Quick Setup Guide

## Step 1: Run Database Migration

Execute the SQL migration to add receipt tables and columns:

```bash
# In Supabase SQL Editor, run:
# scripts/010-receipt-system.sql
```

This creates:
- Receipt columns on donations table
- receipt_audit_log table
- Indexes for performance
- Default organization settings

## Step 2: Configure Email Service

Choose one email service and add to `.env.local`:

### Option A: Resend (Recommended)
```env
EMAIL_SERVICE=resend
RESEND_API_KEY=re_xxxxxxxxxxxxx
EMAIL_FROM=noreply@dessafoundation.org
NEXT_PUBLIC_SITE_URL=https://dessafoundation.org
```

Get API key: https://resend.com

### Option B: SendGrid
```env
EMAIL_SERVICE=sendgrid
SENDGRID_API_KEY=SG.xxxxxxxxxxxxx
EMAIL_FROM=noreply@dessafoundation.org
NEXT_PUBLIC_SITE_URL=https://dessafoundation.org
```

Get API key: https://sendgrid.com

## Step 3: Configure Organization Details

1. Go to Admin Dashboard
2. Navigate to Settings > Organization
3. Fill in:
   - Organization name
   - Contact information
   - Tax registration numbers (VAT, PAN, SWC)
   - Logo URL
   - Receipt settings (prefix, starting number)
4. Click "Save Organization Details"

## Step 4: Set Up Supabase Storage

Create a public bucket for receipts:

```sql
-- In Supabase SQL Editor
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', true)
ON CONFLICT DO NOTHING;

-- Create policy for public read access
CREATE POLICY "Public read access" ON storage.objects
  FOR SELECT USING (bucket_id = 'receipts');
```

## Step 5: Integrate with Payment Webhooks

After payment confirmation, trigger receipt generation:

```typescript
// In your webhook handler (Stripe/Khalti/eSewa)
import { generateReceiptForDonation } from "@/lib/actions/donation-receipt"

// After payment is confirmed
await generateReceiptForDonation({
  donationId: donation.id
})
```

## Step 6: Test the System

1. Make a test donation
2. Complete payment
3. Check email for receipt
4. Verify receipt displays on success page
5. Test download functionality
6. Test resend email

## Verification Checklist

- [ ] Database migration executed
- [ ] Email service configured
- [ ] Organization details set
- [ ] Supabase storage bucket created
- [ ] Webhook integration added
- [ ] Test donation completed
- [ ] Receipt email received
- [ ] Receipt displays on success page
- [ ] Download works
- [ ] Admin can resend email

## Environment Variables Summary

```env
# Email Service
EMAIL_SERVICE=resend                    # or 'sendgrid'
RESEND_API_KEY=your_api_key            # if using Resend
SENDGRID_API_KEY=your_api_key          # if using SendGrid
EMAIL_FROM=noreply@dessafoundation.org

# Site Configuration
NEXT_PUBLIC_SITE_URL=https://dessafoundation.org
```

## File Locations

- Database: `scripts/010-receipt-system.sql`
- Libraries: `lib/receipts/`, `lib/email/`
- Components: `components/receipt-preview.tsx`, `components/admin/organization-settings-form.tsx`
- API: `app/api/receipts/`
- Admin: `app/admin/settings/organization/`
- Documentation: `docs/RECEIPT_SYSTEM.md`

## Common Issues

### Email not sending
- Check EMAIL_SERVICE is set correctly
- Verify API key is valid
- Check EMAIL_FROM is configured
- Review email service logs

### Receipt not generating
- Verify payment_status is "completed"
- Check organization details are saved
- Verify Supabase Storage bucket exists
- Check server logs

### Download not working
- Verify receipt_url is set in database
- Check Supabase Storage public access
- Verify file exists in storage

## Next Steps

1. ✅ Complete setup steps above
2. ✅ Test with real donation
3. ✅ Monitor email delivery
4. ✅ Check admin audit logs
5. ✅ Gather donor feedback
6. ✅ Optimize as needed

## Support

For detailed documentation, see: `docs/RECEIPT_SYSTEM.md`
