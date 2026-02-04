# Receipt System Implementation Guide

## Overview

The receipt system enables automatic generation, storage, and delivery of tax-deductible donation receipts to donors. Receipts include organization details, VAT/tax registration numbers, and donor information.

## Features

✅ **Automatic Receipt Generation** - Receipts are generated after successful payment
✅ **Email Delivery** - Receipts sent automatically to donor email
✅ **PDF Download** - Donors can download receipts anytime
✅ **Tax Compliance** - Includes VAT, PAN, and SWC registration numbers
✅ **Audit Trail** - Complete logging of receipt actions
✅ **Admin Management** - Resend receipts, view history, manage settings

## Database Schema

### New Columns on `donations` Table
```sql
receipt_number TEXT UNIQUE              -- Unique receipt identifier (RCP-2024-001)
receipt_generated_at TIMESTAMPTZ        -- When receipt was created
receipt_url TEXT                        -- Storage URL for receipt
receipt_sent_at TIMESTAMPTZ             -- When email was sent
receipt_download_count INTEGER          -- Number of downloads
```

### New Tables

#### `receipt_audit_log`
Tracks all receipt-related actions for audit purposes:
- `donation_id` - Reference to donation
- `action` - 'generated', 'sent', 'downloaded', 'resent'
- `details` - JSON with action details
- `created_at` - Timestamp

## Configuration

### Organization Details

Set organization details in Admin > Settings > Organization:

```json
{
  "name": "Dessa Foundation",
  "vat_registration_number": "610123456789",
  "pan_number": "610123456",
  "swc_registration_number": "SWC-XXXX",
  "address": "Organization address",
  "phone": "+977-1-XXXXXXX",
  "email": "info@dessafoundation.org",
  "logo_url": "https://example.com/logo.png",
  "receipt_prefix": "RCP",
  "receipt_number_start": 1000
}
```

### Email Service Configuration

The system supports two email services:

#### Option 1: Resend (Recommended)
```env
EMAIL_SERVICE=resend
RESEND_API_KEY=your_resend_api_key
EMAIL_FROM=noreply@dessafoundation.org
```

#### Option 2: SendGrid
```env
EMAIL_SERVICE=sendgrid
SENDGRID_API_KEY=your_sendgrid_api_key
EMAIL_FROM=noreply@dessafoundation.org
```

## File Structure

### Core Libraries
- `lib/receipts/generator.ts` - Receipt HTML generation
- `lib/receipts/service.ts` - Receipt business logic
- `lib/email/receipt-mailer.ts` - Email sending
- `lib/email/templates/receipt.ts` - Email template

### Components
- `components/receipt-preview.tsx` - Receipt display on success page
- `components/admin/organization-settings-form.tsx` - Admin settings form

### API Routes
- `app/api/receipts/download/route.ts` - Download receipt
- `app/api/receipts/resend/route.ts` - Resend receipt email

### Admin Pages
- `app/admin/settings/organization/page.tsx` - Organization settings

### Server Actions
- `lib/actions/donation-receipt.ts` - Receipt generation actions

## Workflow

### 1. Payment Completion
When a payment is successfully processed:
1. Donation status is marked as "completed"
2. Receipt generation is triggered

### 2. Receipt Generation
```typescript
const result = await generateReceiptForDonation({
  donationId: "uuid"
})
```

Process:
1. Generate unique receipt number (RCP-2024-001)
2. Create receipt HTML with organization details
3. Store receipt in Supabase Storage
4. Update donation record with receipt info
5. Log action in audit trail

### 3. Email Delivery
```typescript
const emailResult = await sendReceiptToDonor(
  donationId,
  donorName,
  donorEmail,
  receiptNumber,
  receiptUrl,
  amount,
  currency
)
```

Process:
1. Generate email HTML from template
2. Send via configured email service
3. Update receipt_sent_at timestamp
4. Log email sent action

### 4. Donor Access
On success page:
- Receipt preview displayed
- Download button available
- Resend email option
- Copy link option

## Integration with Payment Webhooks

### Stripe Webhook
After Stripe webhook confirms payment:
```typescript
// In webhook handler
await generateReceiptForDonation({ donationId })
```

### Khalti Webhook
After Khalti confirms payment:
```typescript
// In webhook handler
await generateReceiptForDonation({ donationId })
```

### eSewa Webhook
After eSewa confirms payment:
```typescript
// In webhook handler
await generateReceiptForDonation({ donationId })
```

## API Endpoints

### Download Receipt
```
GET /api/receipts/download?id=RCP-2024-001
```
- Tracks download count
- Redirects to receipt URL
- Logs download action

### Resend Receipt Email
```
POST /api/receipts/resend
Body: { receiptNumber: "RCP-2024-001" }
```
- Resends receipt email to donor
- Updates receipt_sent_at
- Logs resend action

## Admin Features

### Organization Settings
Path: `/admin/settings/organization`

Manage:
- Organization name and contact info
- Tax registration numbers (VAT, PAN, SWC)
- Logo URL
- Receipt prefix and starting number

### Receipt Management
In donations table:
- View receipt number
- View receipt generation date
- View email sent date
- Download count
- Resend email button
- View audit log

## Receipt Content

### Header
- Organization logo
- Organization name
- Contact details (address, phone, email)
- Receipt number and date

### Donor Information
- Full name
- Email address
- Phone number (if provided)

### Donation Details
- Payment method (Stripe/Khalti/eSewa)
- Donation type (One-time/Monthly)
- Currency
- Amount donated

### Tax Information
- Tax deductibility statement
- VAT registration number
- PAN number
- SWC registration number

### Footer
- Thank you message
- Organization registration details
- Audit trail information

## Security Considerations

✅ **Access Control**
- Only admins can view receipt audit logs
- Donors can only access their own receipts
- Download links include donation ID verification

✅ **Data Protection**
- Receipts stored in secure Supabase Storage
- Email addresses not exposed in URLs
- Sensitive data encrypted in transit

✅ **Audit Trail**
- All receipt actions logged
- Timestamps recorded
- Admin can view complete history

## Troubleshooting

### Receipt Not Generated
1. Check donation payment_status is "completed"
2. Verify organization details are configured
3. Check Supabase Storage permissions
4. Review server logs for errors

### Email Not Sent
1. Verify email service is configured
2. Check EMAIL_FROM environment variable
3. Verify donor email is valid
4. Check email service API key
5. Review email service logs

### Download Not Working
1. Verify receipt_url is set in database
2. Check Supabase Storage public access
3. Verify file exists in storage
4. Check browser console for errors

## Future Enhancements

- [ ] PDF generation with pdfkit or html2pdf
- [ ] QR code on receipts linking to verification page
- [ ] Receipt templates customization
- [ ] Bulk receipt generation
- [ ] Receipt search and filtering
- [ ] Receipt analytics dashboard
- [ ] Multi-language receipt support
- [ ] Recurring donation receipt bundling

## Testing

### Manual Testing
1. Make a test donation
2. Verify receipt is generated
3. Check email received
4. Download receipt
5. Verify receipt content
6. Test resend email
7. Check admin audit log

### Automated Testing
```typescript
// Test receipt generation
const result = await generateReceiptForDonation({
  donationId: "test-id"
})
expect(result.success).toBe(true)
expect(result.receiptNumber).toBeDefined()
```

## Support

For issues or questions:
1. Check server logs: `npm run dev`
2. Review database: Supabase dashboard
3. Check email service: Provider dashboard
4. Contact support: support@dessafoundation.org
