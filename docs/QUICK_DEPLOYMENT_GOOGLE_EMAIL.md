# Receipt System - Quick Deployment Guide (Google Email)

## Complete Setup in 4 Steps

### Step 1: Run SQL Script in Supabase (5 minutes)

**File:** `scripts/011-receipt-system-complete.sql`

1. Open Supabase Dashboard: https://app.supabase.com
2. Go to: SQL Editor
3. Click: "New Query"
4. Copy entire contents of `scripts/011-receipt-system-complete.sql`
5. Paste into the SQL Editor
6. Click: "Run"
7. Wait for completion (should see verification results)

**What this does:**
- Adds receipt columns to donations table
- Creates receipt_audit_log table
- Sets up indexes for performance
- Configures RLS policies
- Creates storage bucket for receipts
- Initializes organization settings

**Verification:**
You should see results from these queries at the bottom:
- Receipt columns in donations table
- receipt_audit_log table exists
- organization_details setting exists
- receipts storage bucket exists

---

### Step 2: Configure Google Email (10 minutes)

**Follow:** `docs/GOOGLE_EMAIL_SETUP.md`

Quick summary:
1. Enable 2-Factor Authentication on Gmail account
2. Generate App Password at: https://myaccount.google.com/apppasswords
3. Add to `.env.local`:

```env
GOOGLE_EMAIL=your-email@gmail.com
GOOGLE_APP_PASSWORD=xxxx xxxx xxxx xxxx
```

4. Restart development server: `npm run dev`

---

### Step 3: Configure Organization Details (10 minutes)

1. Start development server: `npm run dev`
2. Go to: `http://localhost:3000/admin/settings/organization`
3. Fill in all fields:
   - Organization name: "Dessa Foundation"
   - Email: your-email@gmail.com
   - Phone: +977-1-XXXXXXX
   - Address: Your organization address
   - VAT Registration Number: (if applicable)
   - PAN Number: (if applicable)
   - SWC Registration Number: (if applicable)
   - Logo URL: https://your-domain.com/logo.png
   - Receipt Prefix: RCP
   - Starting Receipt Number: 1000
4. Click: "Save Organization Details"
5. Verify success message

---

### Step 4: Integrate with Payment Webhooks (15 minutes)

Add receipt generation to your payment webhook handlers.

**For Stripe Webhook:**

```typescript
import { generateReceiptForDonation } from "@/lib/actions/donation-receipt"

// In your Stripe webhook handler
if (event.type === "checkout.session.completed") {
  const session = event.data.object
  const donationId = session.client_reference_id
  
  // Update donation status
  await supabase
    .from("donations")
    .update({ payment_status: "completed" })
    .eq("id", donationId)
  
  // Generate receipt (this will also send email)
  await generateReceiptForDonation({ donationId })
}
```

**For Khalti Webhook:**

```typescript
import { generateReceiptForDonation } from "@/lib/actions/donation-receipt"

// In your Khalti webhook handler
if (body.event_type === "payment.success") {
  const { data: donation } = await supabase
    .from("donations")
    .select("id")
    .eq("khalti_pidx", body.data.pidx)
    .single()
  
  if (donation) {
    await supabase
      .from("donations")
      .update({ payment_status: "completed" })
      .eq("id", donation.id)
    
    await generateReceiptForDonation({ donationId: donation.id })
  }
}
```

**For eSewa Webhook:**

```typescript
import { generateReceiptForDonation } from "@/lib/actions/donation-receipt"

// In your eSewa webhook handler
if (body.status === "COMPLETE") {
  const { data: donation } = await supabase
    .from("donations")
    .select("id")
    .eq("esewa_transaction_uuid", body.transaction_uuid)
    .single()
  
  if (donation) {
    await supabase
      .from("donations")
      .update({ payment_status: "completed" })
      .eq("id", donation.id)
    
    await generateReceiptForDonation({ donationId: donation.id })
  }
}
```

---

## Testing (20 minutes)

### Test Receipt Generation

1. Make a test donation
2. Complete payment
3. Check email inbox for receipt
4. Verify receipt displays on success page
5. Test download functionality
6. Test resend email button

### Test Admin Features

1. Go to: `/admin/settings/organization`
2. Verify organization details display
3. Go to: `/admin/donations`
4. Find test donation
5. Verify receipt number displays
6. Test resend email button

### Verify Email Configuration

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

## Environment Variables

Add to `.env.local`:

```env
# Google Email Configuration
GOOGLE_EMAIL=your-email@gmail.com
GOOGLE_APP_PASSWORD=xxxx xxxx xxxx xxxx

# Site Configuration
NEXT_PUBLIC_SITE_URL=https://dessafoundation.org
```

---

## Verification Checklist

- [ ] SQL script executed successfully
- [ ] All verification queries returned results
- [ ] Google email configured
- [ ] Environment variables set
- [ ] Development server restarted
- [ ] Organization details configured
- [ ] Webhook integration added
- [ ] Test donation completed
- [ ] Receipt generated
- [ ] Email received
- [ ] Receipt displays on success page
- [ ] Download works
- [ ] Resend email works
- [ ] Admin settings accessible
- [ ] No errors in server logs

---

## Troubleshooting

### SQL Script Errors

**Issue:** "relation already exists"
- **Solution:** This is normal if running script multiple times. The `IF NOT EXISTS` clauses prevent errors.

**Issue:** "permission denied"
- **Solution:** Ensure you're using a Supabase admin account with full permissions.

### Email Not Sending

**Issue:** "Invalid login"
- **Solution:** 
  1. Verify you're using App Password, not regular password
  2. Check 2-Factor Authentication is enabled
  3. Regenerate App Password

**Issue:** "ECONNREFUSED"
- **Solution:** Check internet connection and Gmail account status

### Receipt Not Generating

**Issue:** Receipt not appearing on success page
- **Solution:**
  1. Check donation payment_status is "completed"
  2. Verify organization details are saved
  3. Check server logs for errors
  4. Verify Supabase Storage bucket exists

---

## File References

- **SQL Script:** `scripts/011-receipt-system-complete.sql`
- **Email Setup:** `docs/GOOGLE_EMAIL_SETUP.md`
- **Complete Docs:** `docs/RECEIPT_SYSTEM.md`
- **Webhook Integration:** `docs/RECEIPT_WEBHOOK_INTEGRATION.md`

---

## Timeline

- **Step 1 (SQL):** 5 minutes
- **Step 2 (Email):** 10 minutes
- **Step 3 (Organization):** 10 minutes
- **Step 4 (Webhooks):** 15 minutes
- **Testing:** 20 minutes

**Total: ~60 minutes**

---

## Next Steps

1. ✅ Run SQL script
2. ✅ Configure Google email
3. ✅ Set organization details
4. ✅ Integrate webhooks
5. ✅ Test system
6. ✅ Monitor email delivery
7. ✅ Gather donor feedback

---

**Deployment complete!** 🎉

Your receipt system is ready to send tax-deductible receipts via Google Email.
