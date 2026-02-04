# Google Email Configuration Guide for Receipt System

## Overview

The receipt system is configured to send emails using Google Email (Gmail or Google Workspace). This guide walks you through setting up Google email authentication.

## Prerequisites

- Google Account (Gmail or Google Workspace)
- Node.js project with nodemailer installed
- Access to environment variables

## Step 1: Install Required Package

The system uses `nodemailer` to send emails via Gmail. It should already be in your dependencies, but verify:

```bash
npm install nodemailer
# or
yarn add nodemailer
```

## Step 2: Enable 2-Factor Authentication (Gmail Only)

**If using Gmail (not Google Workspace):**

1. Go to: https://myaccount.google.com/security
2. Click "2-Step Verification"
3. Follow the setup process
4. Verify your phone number

**If using Google Workspace:**
- Skip this step, go directly to Step 3

## Step 3: Generate App Password

### For Gmail Users:

1. Go to: https://myaccount.google.com/apppasswords
2. Select:
   - **App:** Mail
   - **Device:** Windows Computer (or your device)
3. Click "Generate"
4. Google will show a 16-character password
5. **Copy this password** - you'll need it in Step 4

### For Google Workspace Users:

1. Go to: https://admin.google.com
2. Navigate to: Security > App passwords
3. Select:
   - **App:** Mail
   - **Device:** Windows Computer (or your device)
4. Click "Generate"
5. **Copy the 16-character password**

## Step 4: Configure Environment Variables

Add these to your `.env.local` file:

```env
# Google Email Configuration
GOOGLE_EMAIL=your-email@gmail.com
GOOGLE_APP_PASSWORD=xxxx xxxx xxxx xxxx
```

**Important:**
- Replace `your-email@gmail.com` with your actual Gmail address
- Replace `xxxx xxxx xxxx xxxx` with the 16-character app password (keep the spaces)
- Do NOT use your regular Gmail password
- Do NOT commit `.env.local` to version control

## Step 5: Verify Configuration

Test your email setup by running this in your Next.js app:

```typescript
import { testGoogleEmailConfiguration } from "@/lib/email/receipt-mailer"

// Call this to verify setup
const result = await testGoogleEmailConfiguration()
console.log(result)
```

Expected output if successful:
```
{
  success: true,
  message: "Gmail connection successful. Emails will be sent from: your-email@gmail.com"
}
```

## Step 6: Test Email Sending

Make a test donation and verify:

1. Complete a test payment
2. Check the donor's email inbox
3. Verify receipt email was received
4. Check spam folder if not in inbox

## Troubleshooting

### Issue: "Invalid login" Error

**Solution:**
1. Verify you're using an App Password, not your regular password
2. Check that 2-Factor Authentication is enabled (Gmail only)
3. Verify the email address is correct
4. Try regenerating the App Password

### Issue: "Less secure app access" Error

**Solution:**
- This error means you're using a regular password instead of an App Password
- Follow Step 3 again to generate an App Password
- Use the 16-character password, not your regular password

### Issue: Email Not Sending

**Solution:**
1. Verify `GOOGLE_EMAIL` and `GOOGLE_APP_PASSWORD` are set in `.env.local`
2. Restart your development server after adding env variables
3. Check server logs for error messages
4. Verify internet connection
5. Check Gmail account for security alerts

### Issue: Emails Going to Spam

**Solution:**
1. Add your domain to Gmail's SPF/DKIM records (if using custom domain)
2. Check Gmail's "Sent Mail" folder to verify emails are being sent
3. Ask donors to mark emails as "Not Spam"
4. Consider using Google Workspace for better deliverability

## Email Configuration Details

### What Gets Sent

When a donation is completed:
1. Receipt email is automatically sent to donor
2. Email includes:
   - Receipt number
   - Donation amount
   - Organization details
   - Download link
   - Tax deductibility information
   - Thank you message

### Email Template

The email template is in: `lib/email/templates/receipt.ts`

It includes:
- Professional HTML formatting
- Responsive design (works on mobile)
- Organization branding
- Download button
- Next steps information

### Customizing Email

To customize the email template:

1. Edit: `lib/email/templates/receipt.ts`
2. Modify the HTML/CSS as needed
3. Restart development server
4. Test with a new donation

## Security Best Practices

✅ **Do:**
- Use App Passwords, not regular passwords
- Keep `.env.local` out of version control
- Rotate App Passwords periodically
- Use a dedicated email account if possible
- Monitor email sending logs

❌ **Don't:**
- Commit `.env.local` to git
- Share App Passwords
- Use regular Gmail password
- Disable 2-Factor Authentication
- Use the same password for multiple services

## Gmail Limits

Be aware of Gmail's sending limits:

- **Gmail Account:** 500 emails per day
- **Google Workspace:** Depends on plan (typically 2000+ per day)

For high-volume sending, consider Google Workspace.

## Alternative: Google Workspace

If you need higher email limits or professional email:

1. Set up Google Workspace account
2. Create a service account email
3. Follow the same App Password steps
4. Use the workspace email in `GOOGLE_EMAIL`

## Testing Checklist

- [ ] 2-Factor Authentication enabled (Gmail only)
- [ ] App Password generated
- [ ] Environment variables configured
- [ ] Development server restarted
- [ ] Email configuration test passed
- [ ] Test donation completed
- [ ] Receipt email received
- [ ] Email not in spam folder
- [ ] Email content looks correct
- [ ] Download link works

## Environment Variables Summary

```env
# Required
GOOGLE_EMAIL=your-email@gmail.com
GOOGLE_APP_PASSWORD=xxxx xxxx xxxx xxxx

# Optional (for development)
NODE_ENV=development
```

## Support

If you encounter issues:

1. Check Gmail account security settings
2. Verify App Password is correct
3. Check server logs for error messages
4. Ensure internet connection is working
5. Try regenerating App Password

## Next Steps

1. ✅ Complete setup above
2. ✅ Test email configuration
3. ✅ Make test donation
4. ✅ Verify receipt email received
5. ✅ Monitor email delivery
6. ✅ Gather donor feedback

## Additional Resources

- Gmail App Passwords: https://support.google.com/accounts/answer/185833
- Google Workspace: https://workspace.google.com
- Nodemailer Documentation: https://nodemailer.com
- Gmail SMTP Settings: https://support.google.com/mail/answer/7126229

---

**Email configuration complete!** 🎉

Your receipt system is now ready to send emails via Google Email.
