# DEESSA Foundation — Conference Module: Admin Documentation

> **Version:** 1.0.0  
> **Last Updated:** February 28, 2026  
> **Audience:** Admin Users, Support Staff, Program Coordinators

---

## Table of Contents

1. [Admin Dashboard Overview](#1-admin-dashboard-overview)
2. [Registration Management](#2-registration-management)
3. [Admin Actions Reference](#3-admin-actions-reference)
4. [Settings Management](#4-settings-management)
5. [Common Workflows](#5-common-workflows)
6. [Troubleshooting for Admins](#6-troubleshooting-for-admins)

---

## 1. Admin Dashboard Overview

### 1.1 Accessing Admin Dashboard

**URL**: `https://deessa.org/admin/conference`

**Authentication**:

- Requires Supabase Auth login
- Email + password authentication
- Only authorized staff have accounts

**Login Process**:

1. Navigate to `/admin/conference`
2. If not logged in, redirected to Supabase login page
3. Enter email and password
4. Redirected back to admin dashboard

### 1.2 Dashboard Layout

```
┌─────────────────────────────────────────────────┐
│ DEESSA Foundation Admin                         │
│ [Home] [Conference] [Settings] [Logout]         │
├─────────────────────────────────────────────────┤
│                                                  │
│  Conference Registrations                       │
│                                                  │
│  [Export CSV] [Settings]                        │
│                                                  │
│  Filters:                                       │
│  [All] [Confirmed] [Pending Payment] [Expired] │
│                                                  │
│  Search: [_____________________] 🔍             │
│                                                  │
│  ┌───────────────────────────────────────────┐ │
│  │ Name        | Email      | Status | Date  │ │
│  ├───────────────────────────────────────────┤ │
│  │ John Doe    | j@ex.com   | Confirmed | ... │ │
│  │ Jane Smith  | jane@ex... | Pending   | ... │ │
│  │ ...                                        │ │
│  └───────────────────────────────────────────┘ │
│                                                  │
└─────────────────────────────────────────────────┘
```

### 1.3 Key Features

| Feature | Description | Use Case |
|---|---|---|
| **Registration List** | View all registrations in table format | Monitor registrations |
| **Detail View** | Click row to see full registration details + PII | Review specific registration |
| **Quick Actions** | One-click actions (confirm, cancel, extend) | Fast operations |
| **CSV Export** | Download all registrations as CSV | Excel analysis, printing badges |
| **Settings** | Edit conference name, dates, pricing | Update for new event |
| **Search** | Filter by name, email, registration ID | Find specific user |
| **Status Filter** | Show only confirmed/pending/expired | Focus on action items |

---

## 2. Registration Management

### 2.1 Registration List Page

**URL**: `/admin/conference`

**Columns Displayed**:

| Column | Description | Example |
|---|---|---|
| **Full Name** | Registrant's name | "John Doe" |
| **Email** | Contact email | "<john@example.com>" |
| **Attendance** | In-person or Virtual | "In-person" |
| **Status** | Registration status | "Confirmed" |
| **Payment Status** | Payment state | "Paid" |
| **Amount** | Payment amount | "$20" / "NPR 800" |
| **Created** | Registration date/time | "Feb 28, 2026 10:30 AM" |
| **Actions** | Quick action buttons | [View] [Confirm] [Cancel] |

**Status Badge Colors**:

- 🟢 **Green**: Confirmed (payment received)
- 🟡 **Yellow**: Pending Payment (awaiting payment)
- 🔴 **Red**: Expired (payment not received within 24h)
- ⚫ **Gray**: Cancelled (manually cancelled by admin)

### 2.2 Registration Detail Page

**URL**: `/admin/conference/[id]`

**Layout**:

```
┌─────────────────────────────────────────────────┐
│ ← Back to List                                  │
├─────────────────────────────────────────────────┤
│                                                  │
│ Registration Details                            │
│ Status: [Confirmed] | Payment: [Paid]           │
│                                                  │
│ ┌─────────────────────────────────────────────┐│
│ │ Personal Information                         ││
│ │ Full Name:    John Doe                       ││
│ │ Email:        john@example.com               ││
│ │ Phone:        +1 234-567-8900                ││
│ │ Country:      United States                  ││
│ │ Organization: Example Corp                   ││
│ │                                              ││
│ │ Conference Details                           ││
│ │ Attendance:   In-person                      ││
│ │ Dietary:      Vegetarian, No nuts            ││
│ │                                              ││
│ │ Payment Information                          ││
│ │ Provider:     Stripe                         ││
│ │ Amount:       $20.00 USD                     ││
│ │ Payment ID:   stripe:cs_live_abc123...       ││
│ │ Paid At:      Feb 28, 2026 10:35 AM          ││
│ │                                              ││
│ │ System Information                           ││
│ │ Registration ID: 550e8400-e29b-41d4-a716-... ││
│ │ Created:      Feb 28, 2026 10:30 AM          ││
│ │ Updated:      Feb 28, 2026 10:35 AM          ││
│ │ Expires:      (none - confirmed)             ││
│ └─────────────────────────────────────────────┘│
│                                                  │
│ Quick Actions                                   │
│ [📧 Resend Email] [📋 Copy ID] [✉️ Custom Email]│
│                                                  │
│ Admin Actions                                   │
│ [✅ Confirm] [❌ Cancel] [💰 Mark as Paid]       │
│ [⏰ Extend Expiry +24h]                         │
│                                                  │
│ Admin Notes                                     │
│ [Text area for private notes...]                │
│ [Save Notes]                                    │
│                                                  │
└─────────────────────────────────────────────────┘
```

**Information Sections**:

1. **Personal Information** (PII - handle carefully):
   - Full Name, Email, Phone, Country, Organization

2. **Conference Details**:
   - Attendance mode (In-person/Virtual)
   - Dietary preferences

3. **Payment Information**:
   - Payment provider (Stripe/Khalti/eSewa)
   - Amount and currency
   - Payment ID (gateway transaction reference)
   - Payment timestamp

4. **System Information**:
   - Registration ID (UUID)
   - Created/Updated timestamps
   - Expiry time (if pending payment)

---

## 3. Admin Actions Reference

### 3.1 Quick Actions (Always Available)

#### **Resend Email (📧)**

**What it does**: Resends the registration confirmation email to the user

**When to use**:

- User didn't receive original email
- Email went to spam
- User deleted email and needs new copy

**How it works**:

1. Click "Resend Email" button
2. System fetches registration data
3. Regenerates email with current payment link (if unpaid)
4. Sends via Nodemailer + Gmail SMTP
5. Shows success toast notification

**Limitations**:

- Gmail limit: 2000 emails/day
- If original email bounced (invalid address), this will also fail
- Does NOT create new payment session (reuses existing payment link)

---

#### **Copy ID (📋)**

**What it does**: Copies registration UUID to clipboard

**When to use**:

- Need to reference registration in logs
- Sharing with developer for debugging
- Creating support tickets

**How it works**:

1. Click "Copy ID" button
2. UUID copied to clipboard
3. Toast shows "ID copied!"

**Example UUID**: `550e8400-e29b-41d4-a716-446655440000`

---

#### **Send Custom Email (✉️)**

**What it does**: Allows free-form email to specific user

**When to use**:

- Need to ask user for additional information
- Explaining why payment failed
- Custom instructions for specific case

**UI Flow**:

1. Click "Custom Email"
2. Modal appears with:
   - To: [email] (pre-filled, read-only)
   - Subject: [text input]
   - Message: [textarea]
3. Click "Send"
4. System sends email immediately
5. Confirmation toast appears

**Best Practices**:

- Keep subject concise (< 50 characters)
- Sign with "DEESSA Foundation Team"
- Include action items clearly
- Provide contact info for follow-up

---

### 3.2 Admin Actions (Status-Dependent)

#### **Confirm (✅)**

**Button appears when**: Status is "Pending" or "Pending Payment"

**What it does**: Manually confirms registration + marks as paid + sends confirmation email

**When to use**:

- User paid via bank transfer (offline) → admin verifies → confirms
- Payment webhook failed but payment verified in gateway dashboard
- Special case: VIP invited guest (no payment needed)

**How it works**:

```sql
UPDATE conference_registrations SET
  status = 'confirmed',
  payment_status = 'paid',
  updated_at = now()
WHERE id = 'registration-id';
```

**⚠️ Warning**: This action is **irreversible** from UI. If done by mistake, must update database directly.

**After confirmation**:

- Status changes to "Confirmed"
- Confirmation email sent automatically
- Expiry timer cleared
- Row highlighted green in list

---

#### **Cancel (❌)**

**Button appears when**: Status is NOT "Cancelled"

**What it does**: Marks registration as cancelled (does NOT process refund)

**When to use**:

- User requests cancellation
- Duplicate registration detected
- Fraudulent registration identified
- User no longer attending

**How it works**:

```sql
UPDATE conference_registrations SET
  status = 'cancelled',
  updated_at = now()
WHERE id = 'registration-id';
```

**⚠️ Important**: This does NOT:

- Process refund in payment gateway (must do manually)
- Send cancellation email (optional, use "Custom Email")
- Delete data (row preserved for audit)

**Refund Process** (if payment was made):

1. Admin clicks "Cancel" in system
2. Go to payment gateway dashboard (Stripe/Khalti/eSewa)
3. Find transaction by `payment_id`
4. Issue refund manually
5. Refund processed by gateway (2-10 days)
6. (Optional) Send custom email to user confirming refund

---

#### **Mark as Paid (💰)**

**Button appears when**: Payment status is "Unpaid" or "Review"

**What it does**: Overrides payment status to "Paid" + confirms registration

**When to use**:

- **Amount mismatch** (status = "Review"): Verified payment in gateway, amount is correct despite mismatch
- **Webhook delayed**: Payment confirmed in Stripe dashboard but webhook hasn't arrived yet
- **Manual verification**: User sent screenshot, admin verified payment

**How it works**:

1. Admin verifies payment in gateway dashboard
2. Clicks "Mark as Paid"
3. Modal appears: "Are you sure? This cannot be undone."
4. Admin clicks "Confirm"
5. System updates:

   ```sql
   UPDATE conference_registrations SET
     payment_status = 'paid',
     status = 'confirmed',
     updated_at = now()
   WHERE id = 'registration-id';
   ```

6. Confirmation email sent

**⚠️ Critical**: Only use after verifying payment in gateway dashboard. Do NOT mark as paid without proof of payment.

---

#### **Extend Expiry +24h (⏰)**

**Button appears when**: Status is "Pending Payment" and expiry not yet passed

**What it does**: Adds 24 hours to expiry time

**When to use**:

- User requests more time to pay
- Payment gateway was temporarily down
- User had payment issue but resolved now

**How it works**:

```sql
UPDATE conference_registrations SET
  expires_at = expires_at + interval '24 hours',
  updated_at = now()
WHERE id = 'registration-id';
```

**Can be used multiple times**: Each click adds another 24 hours

**Limitations**:

- Once expired, this button disappears (status changed to "Expired" by cron)
- If expired, must use "Confirm" instead (which ignores expiry)

---

### 3.3 Admin Notes

**What it is**: Private text field for internal notes (not visible to user)

**When to use**:

- Document phone call with user
- Record why manual action was taken
- Track follow-up needed

**How it works**:

1. Type notes in textarea (bottom of detail page)
2. Click "Save Notes"
3. Notes saved to database:

   ```sql
   UPDATE conference_registrations SET
     admin_notes = 'User called, said payment failed due to card decline. Asked to retry.'
   WHERE id = 'registration-id';
   ```

**Best Practices**:

- Include date/time manually: "2026-02-28 3pm: User called..."
- Include your name: "- Admin Jane"
- Be concise and factual
- Do NOT include sensitive financial info (card numbers, passwords)

---

## 4. Settings Management

### 4.1 Accessing Settings

**URL**: `/admin/conference/settings`

**Button**: "Settings" button in top-right of registration list page

### 4.2 Settings Form Fields

| Field | Type | Description | Example |
|---|---|---|---|
| **Conference Name** | Text | Event title | "DEESSA Global Conference 2026" |
| **Conference Date** | Date | Event start date | "2026-06-15" |
| **Conference End Date** | Date | Event end date (optional) | "2026-06-17" |
| **Location** | Text | Physical address (for in-person) | "Kathmandu, Nepal" |
| **Virtual Link** | URL | Zoom/Teams link (shown to virtual attendees) | "<https://zoom.us/j/>..." |
| **Deadline** | DateTime | Last day to register | "2026-06-01 23:59" |
| **In-Person Price (USD)** | Number | Amount in US dollars | "20.00" |
| **Virtual Price (NPR)** | Number | Amount in Nepalese Rupees | "800" |
| **Registration Enabled** | Toggle | Enable/disable registration form | ON / OFF |

### 4.3 Updating Settings

**Process**:

1. Navigate to `/admin/conference/settings`
2. Edit fields as needed
3. Click "Save Settings"
4. System validates input (e.g., end date > start date)
5. Settings saved to `site_settings` table:

   ```sql
   UPDATE site_settings SET
     settings = jsonb_set(settings, '{conference}', '{"name":"...","date":"...",...}'),
     updated_at = now()
   WHERE id = 1;
   ```

6. Success toast appears
7. Changes immediately affect public registration page

**⚠️ Important**:

- Settings are **NOT versioned** (changes are immediate)
- If users are mid-registration when you change pricing, they see OLD price (calculated at form load)
- After changing pricing, click around to verify new prices display correctly

### 4.4 Settings Impact

| Setting Changed | Impact | Action Required |
|---|---|---|
| **Conference Name** | Updates landing page title | Verify homepage looks correct |
| **Dates** | Updates landing page info | Update marketing materials |
| **Price** | New registrants see new price | Existing pending registrations use OLD price (intended) |
| **Deadline** | Form shows "Registration closes on [date]" | None |
| **Virtual Link** | Sent in confirmation email | Test email to yourself |
| **Registration Enabled = OFF** | Form shows "Registration closed" | None (can toggle back ON anytime) |

---

## 5. Common Workflows

### 5.1 Workflow: User Says "I Paid But Still Shows Pending"

**Steps**:

1. Ask user for payment proof (screenshot, transaction ID)
2. Go to payment gateway dashboard (Stripe/Khalti/eSewa)
3. Search for transaction by:
   - Email (user's email)
   - Amount (registration amount)
   - Date (past 24 hours)
4. **If payment found in gateway**:
   - Go to admin detail page for registration
   - Click "Mark as Paid"
   - Confirm action
   - System sends confirmation email
   - Inform user: "Done! Confirmation email sent."
5. **If payment NOT found in gateway**:
   - Ask user to retry payment
   - Extend expiry (+24h) if needed
   - OR if expired, ask user to register again

---

### 5.2 Workflow: User Requests Cancellation + Refund

**Steps**:

1. Verify user identity (ask for registration ID or email)
2. Find registration in admin list
3. Check payment status:
   - **If unpaid**: Just click "Cancel" (no refund needed)
   - **If paid**: Proceed with refund
4. **For paid registrations**:
   - Note `payment_provider` and `payment_id` from detail page
   - Go to gateway dashboard:
     - **Stripe**: Payments → Search by session → Click → "Refund"
     - **Khalti**: Login → Merchant Dashboard → Transactions → Find → Refund
     - **eSewa**: Contact eSewa support (refund via email request)
   - Issue full or partial refund
   - Return to admin dashboard
   - Click "Cancel" in system
   - Send custom email: "Your refund of $20 has been processed. It will appear in 5-10 business days."
5. User receives refund (2-10 days depending on gateway)

**Refund Timeline**:

| Gateway | Refund Processing Time |
|---|---|
| Stripe | 5-10 business days |
| Khalti | 3-7 business days |
| eSewa | 7-14 business days (manual process) |

---

### 5.3 Workflow: Export List for Badge Printing

**Use Case**: Event is approaching, need to print name badges for in-person attendees

**Steps**:

1. Go to `/admin/conference`
2. Filter: Click "Confirmed" (only show confirmed registrations)
3. Click "Export CSV"
4. CSV downloads with all confirmed registrations
5. Open in Excel/Google Sheets
6. Filter `attendance_mode = "In-person"`
7. Select columns: `full_name`, `organization`, `country`
8. Use mail merge tool to generate badges

**CSV Columns** (example):

```csv
id,full_name,email,phone,country,organization,attendance_mode,dietary_restrictions,status,payment_status,payment_amount,payment_currency,created_at
550e8400-...,John Doe,j@ex.com,+1234567890,United States,Example Corp,In-person,Vegetarian,confirmed,paid,20.00,USD,2026-02-28T10:30:00Z
```

---

### 5.4 Workflow: User Lost Confirmation Email

**Steps**:

1. Search for user in admin list (by name or email)
2. Click on their registration
3. Click "Resend Email"
4. System sends new email with:
   - Registration ID
   - Conference details
   - Payment receipt (if paid)
   - Virtual link (if virtual attendee)
5. Inform user: "Email resent! Check inbox and spam folder."

**Alternative** (if resend fails):

- Click "Send Custom Email"
- Manually type confirmation details
- Include all relevant info (date, location, link)

---

### 5.5 Workflow: Registration Accidentally Expired

**Scenario**: User paid within 24h but cron job marked as expired (race condition)

**Steps**:

1. Check `payment_events` table (if you have database access):

   ```sql
   SELECT * FROM payment_events
   WHERE conference_registration_id = 'registration-id';
   ```

2. If payment event exists (payment succeeded):
   - Go to admin detail page
   - Click "Confirm" (overrides expiry)
   - System confirms + sends email
3. If no payment event:
   - Check gateway dashboard for payment
   - If found: Mark as Paid
   - If not found: Ask user to register + pay again

---

## 6. Troubleshooting for Admins

### 6.1 Issue: "Mark as Paid" Button Not Working

**Symptoms**: Button click does nothing, or shows error

**Possible Causes**:

1. **No internet connection**: Check your network
2. **Session expired**: Reload page, log in again
3. **Database error**: Contact developer

**Solution**:

- Refresh page
- Log out and log in again
- Try different browser
- If persistent: Contact developer

---

### 6.2 Issue: CSV Export Shows No Data

**Symptoms**: Downloaded CSV is empty or has only headers

**Possible Causes**:

1. **No registrations exist**: Check if list shows any rows
2. **Filter too restrictive**: Remove filters (click "All")
3. **Database connection issue**: Rare, check Supabase status

**Solution**:

- Click "All" filter first, then export
- Wait 10 seconds, try again
- If persistent: Contact developer

---

### 6.3 Issue: Settings Not Saving

**Symptoms**: Click "Save" but changes don't persist

**Possible Causes**:

1. **Validation error**: Check for red error messages under fields
2. **Session expired**: Log in again
3. **Database issue**: Server error

**Solution**:

- Check for validation errors (e.g., "Price must be positive number")
- Fix errors, save again
- If no errors shown but still fails: Developer issue

**Common Validation Rules**:

- Conference name: 1-200 characters
- Prices: Must be positive numbers
- Dates: End date must be after start date
- Virtual link: Must be valid URL (https://...)

---

### 6.4 Issue: User Still Shows "Pending Payment" After Admin Confirmed

**Symptoms**: Admin clicked "Confirm" but user says page still shows "Awaiting Payment"

**Cause**: User's browser cached old status

**Solution**:

1. Ask user to **hard refresh** page:
   - Windows: `Ctrl + Shift + R`
   - Mac: `Cmd + Shift + R`
2. Or ask user to visit: `/conference/success?rid=REGISTRATION_ID&email=EMAIL`
3. If still shows pending: Contact developer (cache issue)

---

### 6.5 Issue: Too Many Registrations, Page Loads Slow

**Symptoms**: Admin list page takes 10+ seconds to load

**Cause**: 500+ registrations loaded at once

**Solution** (Current):

- Use search to narrow results
- Use status filters to show subset

**Solution** (Future Enhancement)**:

- Developer must implement pagination (see [10: Improvements & Risks](10-improvements-risks.md) Section 3.4)

---

## Related Documentation

- **Previous**: [06: Payment Flows](06-payment-flows.md)
- **Next**: [08: Security](08-security.md)
- **See Also**: [05: API Documentation](05-api-documentation.md), [09: Deployment & Operations](09-deployment-operations.md)

---

**Document Maintained By**: Development Partner  
**Last Reviewed**: February 28, 2026  
**Next Review**: After admin features change or user feedback
