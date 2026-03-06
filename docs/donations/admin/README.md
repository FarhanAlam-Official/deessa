# Transaction Detail Page Documentation

## Overview

The Transaction Detail page provides a comprehensive view of individual donation transactions for admin users with finance permissions. It includes transaction information, donor details, payment technical data, review management, and activity timeline.

## Page Structure

### Main Components

#### 1. TransactionHeader
**Location:** `components/transaction-header.tsx`

**Purpose:** Displays page header with navigation, status badges, and action buttons.

**Props:**
- `donationId` (string): The unique identifier of the donation
- `paymentStatus` (string): Current payment status (completed, pending, failed, review)
- `paymentProvider` (string): Payment gateway provider name
- `userRole` ("ADMIN" | "SUPER_ADMIN" | "FINANCE" | "EDITOR"): Current user's role
- `hasReceipt` (boolean): Whether a receipt exists for this donation
- `onResendReceipt` (() => void): Callback for resending receipt
- `onChangeStatus` (() => void): Callback for opening status change modal
- `onExportPDF` (() => void): Callback for exporting transaction as PDF
- `onViewDashboard` (() => void): Callback for viewing in provider dashboard
- `isLoading` (boolean): Loading state for action buttons

**Features:**
- Back navigation to donations list
- Status and provider badges with color coding
- Role-based action button visibility
- Responsive layout (stacks on mobile)
- Touch-friendly buttons (44x44px minimum)

---

#### 2. TransactionOverview
**Location:** `components/transaction-overview.tsx`

**Purpose:** Displays core transaction information in a two-column grid.

**Props:**
- `donation` (object): Donation data including:
  - `id`, `amount`, `currency`, `payment_status`, `payment_method`
  - `provider`, `receipt_number`, `created_at`, `confirmed_at`
  - `receipt_sent_at`, `reviewed_at`, `reviewed_by`
- `reviewedByName` (string | null): Name of admin who reviewed the transaction

**Features:**
- Prominent amount display (3xl font)
- Relative timestamps with absolute on hover
- Handles null values gracefully
- Responsive (single column on mobile)
- Copy-to-clipboard for transaction ID

---

#### 3. DonorInformation
**Location:** `components/donor-information.tsx`

**Purpose:** Displays donor contact information and message.

**Props:**
- `donor` (object):
  - `name` (string): Donor's full name
  - `email` (string): Donor's email address
  - `phone` (string | null): Donor's phone number
  - `message` (string | null): Donor's message

**Features:**
- Clickable email (mailto:) and phone (tel:) links
- Handles null phone and message
- Proper text wrapping for long messages
- Card styling with shadow

---

#### 4. PaymentTechnical
**Location:** `components/payment-technical.tsx`

**Purpose:** Displays payment gateway technical details with copy functionality.

**Props:**
- `payment` (object):
  - `provider_ref`, `stripe_session_id`, `khalti_pidx`
  - `esewa_transaction_uuid`, `payment_id`, `verification_id`
- `provider` (string): Payment provider name

**Features:**
- Copy-to-clipboard for all IDs
- Provider-specific field display
- Monospace font for IDs
- Hover tooltips explaining each field
- Touch-friendly copy buttons (44x44px)

---

#### 5. ReviewStatusCard
**Location:** `components/review-status-card.tsx`

**Purpose:** Allows admins to update review status of transactions.

**Props:**
- `donationId` (string): Transaction ID
- `currentStatus` ("unreviewed" | "verified" | "flagged" | "refunded"): Current review status
- `userRole` ("ADMIN" | "SUPER_ADMIN" | "FINANCE" | "EDITOR"): User's role

**Features:**
- Status badge with color coding
- Dropdown for status selection (admin only)
- Optimistic UI updates
- Network error handling
- Touch-friendly dropdown (44px height)

---

#### 6. ReviewNotesSection
**Location:** `components/review-notes-section.tsx`

**Purpose:** Displays and manages internal review notes.

**Props:**
- `donationId` (string): Transaction ID
- `notes` (array): Array of review note objects
- `userRole` ("ADMIN" | "SUPER_ADMIN" | "FINANCE" | "EDITOR"): User's role

**Features:**
- Chronological note display (newest first)
- Add note modal with validation (min 10 chars)
- Load more functionality (10 notes initially)
- Relative timestamps
- Admin-only access
- Inline validation with error messages

---

#### 7. ActivityTimeline
**Location:** `components/activity-timeline.tsx`

**Purpose:** Displays chronological activity log with filtering.

**Props:**
- `events` (array): Array of timeline event objects

**Features:**
- Event type filtering (All, System, Admin, Webhooks)
- Color-coded event icons
- Expandable event details
- Load more functionality (50 events initially)
- Relative timestamps with absolute on hover
- Responsive filter buttons (horizontally scrollable)
- Touch-friendly interactions

---

#### 8. StatusChangeModal
**Location:** `components/status-change-modal.tsx`

**Purpose:** Modal for changing payment status with mandatory reason.

**Props:**
- `donationId` (string): Transaction ID
- `currentStatus` (string): Current payment status
- `isOpen` (boolean): Modal visibility state
- `onClose` (() => void): Callback to close modal
- `onSuccess` (() => void): Callback on successful status change

**Features:**
- Status dropdown
- Mandatory reason field (min 10 chars)
- Inline validation with visual feedback
- Confirmation dialog for critical changes (from completed)
- Network error handling
- Touch-friendly form elements

---

#### 9. ErrorBoundary
**Location:** `components/error-boundary.tsx`

**Purpose:** Catches and displays component-level errors gracefully.

**Props:**
- `children` (ReactNode): Child components to wrap
- `fallback` (ReactNode, optional): Custom fallback UI

**Features:**
- User-friendly error messages
- Retry functionality (page reload)
- Error details in collapsible section
- Prevents entire page crash

---

## Accessibility Features

### Keyboard Navigation
- All interactive elements are focusable
- Logical tab order throughout the page
- Escape key closes modals
- Enter key submits forms

### ARIA Attributes
- `aria-label` on all buttons
- `aria-invalid` on form inputs with errors
- `aria-describedby` linking errors to inputs
- Semantic HTML with proper roles

### Focus Indicators
- 3px Ocean Blue outline on all focusable elements
- Enhanced visibility in dark mode
- High contrast mode support
- Meets WCAG 2.1 AA standards

### Screen Reader Support
- Semantic HTML structure (main, header, section)
- Hidden headings for screen readers (.sr-only)
- Descriptive button labels
- Status announcements via ARIA live regions

---

## Performance Optimizations

### Component Rendering
- React.memo on expensive components (ActivityTimeline, ReviewNotesSection)
- Proper key props on all lists
- Optimized re-render logic

### Data Fetching
- Parallel data fetching with Promise.all
- Specific column selection in queries
- Inner joins for related data
- Error handling for missing tables

### Loading States
- Skeleton loaders for initial page load
- Button loading spinners
- Optimistic UI updates where appropriate

---

## Error Handling

### Network Errors
- Automatic detection of fetch failures
- User-friendly error messages
- Retry suggestions
- Extended notification duration (5s)

### Rate Limiting
- Specific error messages for rate limits
- Clear explanation of limits (e.g., 3 resends per hour)
- Disabled buttons during rate limit period

### Validation Errors
- Inline validation with visual feedback
- Character count displays
- Disabled submit buttons when invalid
- Field-specific error messages

---

## Responsive Design

### Mobile Optimizations
- Single column layout on small screens
- Horizontally scrollable filter buttons
- Touch-friendly buttons (44x44px minimum)
- Stacked action buttons
- Full-width modals

### Breakpoints
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

---

## Security Considerations

### Role-Based Access
- Finance permission required to view page
- Admin-only actions (status change, review notes)
- Server-side permission enforcement
- Client-side UI hiding for unauthorized actions

### Data Protection
- No sensitive data in URLs
- Secure API endpoints
- Input validation on client and server
- XSS protection via React

---

## Usage Examples

### Viewing a Transaction
```typescript
// Navigate to transaction detail page
router.push(`/admin/donations/${donationId}`)
```

### Changing Payment Status (Admin Only)
1. Click "Change Status" button
2. Select new status from dropdown
3. Enter reason (minimum 10 characters)
4. Confirm if changing from completed
5. Click "Update Status"

### Adding a Review Note (Admin Only)
1. Click "Add Note" button
2. Enter note text (minimum 10 characters)
3. Click "Add Note" to submit

### Resending Receipt (Admin Only)
1. Click "Re-send Receipt" button
2. Confirm action
3. Receipt sent to donor's email
4. Limited to 3 times per hour

---

## Testing

### Manual Testing Checklist
- [ ] Page loads with valid donation ID
- [ ] 404 shown for invalid donation ID
- [ ] Unauthorized users redirected to /admin
- [ ] All sections render correctly
- [ ] Action buttons work as expected
- [ ] Modals open and close properly
- [ ] Form validation works
- [ ] Error messages display correctly
- [ ] Responsive layout works on mobile
- [ ] Keyboard navigation works
- [ ] Screen reader announces content

### Accessibility Testing
- [ ] Test with keyboard only
- [ ] Test with screen reader (NVDA/JAWS/VoiceOver)
- [ ] Verify focus indicators visible
- [ ] Check color contrast (4.5:1 minimum)
- [ ] Test in high contrast mode

---

## Troubleshooting

### Common Issues

**Issue:** Transaction Not Found error
- **Cause:** Invalid donation ID or missing permissions
- **Solution:** Verify donation exists and user has finance permission

**Issue:** Review notes/status changes not loading
- **Cause:** Database tables not created yet
- **Solution:** Run Phase 1 migrations to create tables

**Issue:** Network errors on actions
- **Cause:** API endpoint issues or connectivity problems
- **Solution:** Check network connection and server logs

**Issue:** Rate limit errors on receipt resend
- **Cause:** Exceeded 3 resends per hour limit
- **Solution:** Wait for rate limit to reset (1 hour)

---

## Future Enhancements

- Real-time updates via WebSockets
- Bulk actions on multiple transactions
- Advanced filtering and search
- Export to multiple formats (CSV, JSON)
- Audit log viewer
- Transaction comparison tool
- Automated fraud detection alerts
