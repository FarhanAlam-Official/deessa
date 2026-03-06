# Transaction Detail Page - User Guide

## Table of Contents
1. [Getting Started](#getting-started)
2. [Page Overview](#page-overview)
3. [Viewing Transaction Information](#viewing-transaction-information)
4. [Managing Review Status](#managing-review-status)
5. [Adding Review Notes](#adding-review-notes)
6. [Changing Payment Status](#changing-payment-status)
7. [Resending Receipts](#resending-receipts)
8. [Exporting Transactions](#exporting-transactions)
9. [Viewing Activity Timeline](#viewing-activity-timeline)
10. [Role-Based Permissions](#role-based-permissions)
11. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Accessing the Transaction Detail Page

1. Navigate to the Admin Dashboard
2. Click on "Donations" in the sidebar
3. Click on any donation row in the table
4. The Transaction Detail page will open

**Required Permission:** Finance access (ADMIN, SUPER_ADMIN, or FINANCE role)

**URL Format:** `/admin/donations/[transaction-id]`

---

## Page Overview

The Transaction Detail page is divided into several sections:

### Header Section
- **Back Button:** Returns to the donations list
- **Transaction Title:** Shows "Transaction Details"
- **Status Badges:** Displays payment status and provider
- **Action Buttons:** Quick access to common actions

### Main Content Sections
1. **Transaction Overview:** Core transaction information
2. **Donor Information:** Contact details and message
3. **Payment Technical Details:** Gateway-specific IDs
4. **Review Status:** Internal review management (Admin only)
5. **Review Notes:** Internal notes and comments (Admin only)
6. **Activity Timeline:** Chronological event history

---

## Viewing Transaction Information

### Transaction Overview

This section displays the core transaction details:

**Left Column:**
- Transaction ID (with copy button)
- Receipt Number
- Transaction Type (Donation)
- Amount (prominently displayed)
- Payment Status (with color-coded badge)
- Payment Method
- Payment Provider

**Right Column:**
- Created At (when transaction was initiated)
- Confirmed At (when payment was confirmed)
- Receipt Sent At (when receipt email was sent)
- Reviewed At (when admin reviewed)
- Reviewed By (admin who reviewed)

**Tips:**
- Hover over timestamps to see exact date and time
- Click the copy icon next to Transaction ID to copy to clipboard
- Status badges are color-coded:
  - Green: Completed
  - Yellow: Pending
  - Red: Failed
  - Orange: Review

### Donor Information

View donor contact details:
- Full Name
- Email Address (clickable to send email)
- Phone Number (clickable to call)
- Donor Message

**Tips:**
- Click email to open your default email client
- Click phone number to initiate a call (on mobile)
- Long messages are wrapped for readability

### Payment Technical Details

View payment gateway technical information:
- Provider Reference
- Payment ID
- Verification ID
- Provider-specific IDs (Stripe Session ID, Khalti PIDX, etc.)

**Tips:**
- Click the copy icon next to any ID to copy to clipboard
- Hover over field labels to see explanations
- Only relevant fields for the payment provider are shown

---

## Managing Review Status

**Available to:** ADMIN and SUPER_ADMIN only

### Viewing Current Review Status

The Review Status card shows the current status with a color-coded badge:
- **Gray:** Unreviewed (default)
- **Green:** Verified
- **Orange:** Flagged (requires attention)
- **Red:** Refunded

### Changing Review Status

1. Locate the "Review Status" card
2. Click the dropdown under "Change Status"
3. Select the new status:
   - **Unreviewed:** Not yet reviewed
   - **Verified:** Confirmed as legitimate
   - **Flagged:** Requires investigation
   - **Refunded:** Payment has been refunded
4. The status updates immediately

**Tips:**
- Status changes are logged automatically
- The "Reviewed At" and "Reviewed By" fields update automatically
- Use "Flagged" for suspicious transactions
- Use "Verified" for confirmed legitimate donations

---

## Adding Review Notes

**Available to:** ADMIN and SUPER_ADMIN only

### Viewing Existing Notes

- Notes are displayed in chronological order (newest first)
- Each note shows:
  - Admin name who created it
  - Timestamp (relative, e.g., "2 hours ago")
  - Note text

### Adding a New Note

1. Click the "Add Note" button in the Review Notes section
2. A modal dialog will open
3. Enter your note in the text area (minimum 10 characters)
4. The character count is displayed below the text area
5. Click "Add Note" to save

**Validation:**
- Minimum 10 characters required
- Maximum 2000 characters
- Submit button is disabled until minimum length is met
- Real-time character count displayed

**Tips:**
- Use notes to document:
  - Verification steps taken
  - Communication with donor
  - Suspicious activity
  - Follow-up actions needed
- Notes are internal only (not visible to donors)
- All notes are permanently logged with your name and timestamp

### Loading More Notes

If there are more than 10 notes:
1. Scroll to the bottom of the notes list
2. Click "Load More" button
3. Additional 10 notes will be displayed

---

## Changing Payment Status

**Available to:** ADMIN and SUPER_ADMIN only

### When to Change Payment Status

Change payment status when:
- Manual verification is needed
- Payment gateway status is incorrect
- Refund has been processed
- Transaction needs review

### How to Change Payment Status

1. Click the "Change Status" button in the header
2. A modal dialog will open showing:
   - Current Status
   - New Status dropdown
   - Reason field (required)
3. Select the new status from the dropdown
4. Enter a detailed reason (minimum 10 characters)
5. Click "Update Status"

**Available Status Options:**
- **Pending:** Payment is being processed
- **Completed:** Payment successful
- **Failed:** Payment unsuccessful
- **Review:** Requires manual review

**Important Notes:**
- Reason is mandatory for audit purposes
- Minimum 10 characters required for reason
- Changing from "Completed" requires confirmation
- All status changes are logged permanently
- Super admins are notified of status changes

**Warning:** Changing status from "Completed" may affect:
- Receipt validity
- Audit records
- Financial reports

### Confirmation Dialog

When changing from "Completed" status:
1. A warning message will appear
2. You must confirm the action
3. Click "Confirm Change" to proceed
4. Or click "Cancel" to abort

---

## Resending Receipts

**Available to:** ADMIN and SUPER_ADMIN only

### When to Resend Receipts

Resend receipts when:
- Donor didn't receive original email
- Email was sent to wrong address
- Donor requests a copy

### How to Resend Receipt

1. Click the "Re-send Receipt" button in the header
2. Confirm the action
3. Receipt email is sent to donor's email address
4. Success notification appears

**Rate Limiting:**
- Maximum 3 resends per hour per transaction
- Rate limit prevents spam and abuse
- Wait 1 hour if limit is reached

**Requirements:**
- Receipt must exist (transaction must be completed)
- Valid donor email address
- Within rate limit

**Tips:**
- Check donor's email address before resending
- Verify receipt was generated (receipt number exists)
- If rate limit is reached, wait or contact super admin

---

## Exporting Transactions

**Available to:** ADMIN, SUPER_ADMIN, and FINANCE roles

### Exporting as PDF

1. Click the "Export" button in the header
2. PDF is generated with all transaction details
3. PDF automatically downloads to your computer
4. Success notification appears

**PDF Contents:**
- Transaction overview
- Donor information
- Payment technical details
- Review notes (if any)
- Status change history
- Activity timeline

**Tips:**
- PDF is generated on-demand (not pre-generated)
- Large transactions may take a few seconds
- PDF includes timestamp of generation
- Use for offline review or record-keeping

### Viewing in Provider Dashboard

1. Click the "View in Dashboard" button
2. Provider's dashboard opens in a new tab
3. Transaction is displayed in the payment gateway

**Supported Providers:**
- Stripe (test and live mode)
- Khalti
- eSewa
- Fonepay

**Requirements:**
- Provider reference must exist
- Valid provider credentials
- Access to provider dashboard

---

## Viewing Activity Timeline

### Understanding the Timeline

The Activity Timeline shows all events related to the transaction:

**Event Types:**
- **System Events:** Automated actions (blue icon)
- **Admin Events:** Manual actions by admins (orange icon)
- **Webhook Events:** Payment gateway notifications (purple icon)
- **Receipt Events:** Receipt generation and sending (green icon)
- **Email Events:** Email notifications (blue icon)

### Filtering Events

1. Use the filter buttons at the top of the timeline:
   - **All:** Show all events
   - **System:** Show only system events
   - **Admin:** Show only admin actions
   - **Webhooks:** Show only webhook events
2. The event count updates based on the filter

### Viewing Event Details

Some events have additional metadata:
1. Look for events with "Show details" button
2. Click to expand and view full details
3. Click "Hide details" to collapse

**Expandable Events:**
- Webhook payloads (JSON data)
- Status change reasons
- Error details

### Loading More Events

If there are more than 50 events:
1. Scroll to the bottom of the timeline
2. Click "Load More" button
3. Additional 50 events will be displayed

**Tips:**
- Events are sorted newest first
- Hover over timestamps for exact date/time
- Use filters to focus on specific event types
- Webhook details help debug payment issues

---

## Role-Based Permissions

### Permission Levels

**SUPER_ADMIN:**
- Full access to all features
- Can change payment status
- Can add review notes
- Can update review status
- Can resend receipts
- Can export transactions
- Can view provider dashboard

**ADMIN:**
- Same as SUPER_ADMIN
- Receives notifications for critical changes

**FINANCE:**
- View all transaction details
- Export transactions
- View provider dashboard
- Cannot change status or add notes

**EDITOR:**
- No access to transaction details
- Redirected to admin dashboard

### Feature Visibility

Features are automatically hidden based on your role:
- Review Status card: ADMIN, SUPER_ADMIN only
- Review Notes section: ADMIN, SUPER_ADMIN only
- Change Status button: ADMIN, SUPER_ADMIN only
- Re-send Receipt button: ADMIN, SUPER_ADMIN only
- Export button: All finance roles
- View Dashboard button: All finance roles

---

## Troubleshooting

### Common Issues

#### "Transaction Not Found" Error

**Possible Causes:**
- Invalid transaction ID in URL
- Transaction doesn't exist
- Insufficient permissions

**Solutions:**
- Verify the transaction ID is correct
- Check if you have finance permission
- Contact super admin if issue persists

#### Cannot Change Payment Status

**Possible Causes:**
- Not an admin user
- Reason is too short (< 10 characters)
- Network connectivity issue

**Solutions:**
- Verify you have ADMIN or SUPER_ADMIN role
- Enter at least 10 characters for reason
- Check your internet connection
- Try again in a few moments

#### Receipt Resend Failed

**Possible Causes:**
- Rate limit exceeded (3 per hour)
- No receipt exists
- Invalid donor email
- Network error

**Solutions:**
- Wait 1 hour if rate limit reached
- Verify transaction is completed
- Check donor's email address
- Try again later

#### PDF Export Not Working

**Possible Causes:**
- Large transaction data
- Network timeout
- Server error

**Solutions:**
- Wait a few seconds and try again
- Check your internet connection
- Contact support if issue persists

#### Review Notes Not Loading

**Possible Causes:**
- Database tables not created
- Network error
- Insufficient permissions

**Solutions:**
- Contact super admin to verify database setup
- Refresh the page
- Check your internet connection

### Getting Help

If you encounter issues not covered in this guide:

1. **Check the browser console** for error messages
2. **Refresh the page** to clear temporary issues
3. **Contact your super admin** for permission issues
4. **Report bugs** with:
   - Transaction ID
   - Action you were trying to perform
   - Error message (if any)
   - Screenshots (if helpful)

---

## Best Practices

### Transaction Review

1. **Review transactions promptly**
   - Check new transactions daily
   - Flag suspicious activity immediately
   - Verify large donations

2. **Document your actions**
   - Add notes for verification steps
   - Explain status changes clearly
   - Include relevant details

3. **Use appropriate statuses**
   - "Verified" for confirmed legitimate donations
   - "Flagged" for suspicious transactions
   - "Review" for pending investigation

### Communication

1. **Internal notes**
   - Be clear and concise
   - Include dates and times
   - Document follow-up actions

2. **Status changes**
   - Provide detailed reasons
   - Explain the impact
   - Notify relevant team members

### Security

1. **Protect sensitive data**
   - Don't share transaction IDs publicly
   - Don't screenshot payment details
   - Use secure channels for communication

2. **Verify before acting**
   - Confirm donor identity before resending receipts
   - Verify refund requests
   - Double-check status changes

---

## Keyboard Shortcuts

### Navigation
- **Tab:** Move to next interactive element
- **Shift + Tab:** Move to previous element
- **Enter:** Activate button or link
- **Escape:** Close modal dialogs

### Accessibility
- **All interactive elements are keyboard accessible**
- **Focus indicators show current position**
- **Screen readers announce all content**

---

## Mobile Usage

The Transaction Detail page is fully responsive:

### Mobile Optimizations
- Single column layout on small screens
- Touch-friendly buttons (44x44px minimum)
- Horizontally scrollable filter buttons
- Stacked action buttons
- Full-width modals

### Mobile Tips
- Swipe horizontally on filter buttons
- Tap and hold for tooltips
- Use landscape mode for better view
- Pinch to zoom on technical details

---

## Frequently Asked Questions

**Q: How long are transactions stored?**
A: Transactions are stored indefinitely for audit purposes.

**Q: Can I delete a transaction?**
A: No, transactions cannot be deleted. Use status changes and notes instead.

**Q: Who can see review notes?**
A: Only ADMIN and SUPER_ADMIN users can see review notes.

**Q: Are status changes reversible?**
A: Yes, but all changes are logged permanently in the audit trail.

**Q: How do I know if a receipt was sent?**
A: Check the "Receipt Sent At" field in the Transaction Overview.

**Q: Can I export multiple transactions at once?**
A: Currently, only single transaction export is supported.

**Q: What happens if I change status from "Completed"?**
A: A confirmation dialog appears warning about audit implications.

**Q: How do I report a fraudulent transaction?**
A: Change review status to "Flagged" and add a detailed note.

---

## Updates and Changes

This guide is updated regularly. Check back for:
- New features
- Updated procedures
- Additional tips and tricks
- Resolved issues

**Last Updated:** [Current Date]
**Version:** 1.0.0

---

## Support Contact

For additional help:
- **Technical Issues:** Contact IT Support
- **Permission Issues:** Contact Super Admin
- **Feature Requests:** Submit via feedback form
- **Bug Reports:** Use the bug reporting system

---

## Appendix

### Status Definitions

**Payment Status:**
- **Pending:** Payment is being processed by the gateway
- **Completed:** Payment successfully received
- **Failed:** Payment was unsuccessful
- **Review:** Requires manual review before processing

**Review Status:**
- **Unreviewed:** Not yet reviewed by admin
- **Verified:** Confirmed as legitimate donation
- **Flagged:** Suspicious activity detected
- **Refunded:** Payment has been refunded to donor

### Event Types

**System Events:**
- Transaction created
- Payment confirmed
- Receipt generated
- Receipt sent

**Admin Events:**
- Status changed
- Review note added
- Review status updated

**Webhook Events:**
- Payment gateway notifications
- Status updates from provider
- Error notifications

### Color Coding

**Status Badges:**
- Green: Positive/Completed
- Yellow: Pending/Warning
- Red: Failed/Error
- Orange: Review/Attention
- Blue: Information
- Purple: External/Webhook

**Event Icons:**
- Blue Cog: System events
- Orange User: Admin actions
- Purple Lightning: Webhooks
- Green Receipt: Receipt events
- Blue Mail: Email events
