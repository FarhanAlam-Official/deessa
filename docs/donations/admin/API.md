# Transaction Detail API Documentation

## Overview

This document describes the server actions available for the Transaction Detail page. All actions require authentication and appropriate role-based permissions.

---

## Server Actions

### 1. changePaymentStatus

**File:** `lib/actions/admin-donation-actions.ts`

**Purpose:** Changes the payment status of a donation with mandatory audit trail.

**Authorization:** ADMIN, SUPER_ADMIN only

**Input:**
```typescript
{
  donationId: string;      // UUID of the donation
  newStatus: "pending" | "completed" | "failed" | "review";
  reason: string;          // Minimum 10 characters
}
```

**Validation Rules:**
- `donationId`: Must be a valid UUID
- `newStatus`: Must be one of the allowed status values
- `reason`: Minimum 10 characters, maximum 500 characters
- User must have ADMIN or SUPER_ADMIN role
- Donation must exist

**Process:**
1. Authenticate user and verify role
2. Validate input parameters
3. Fetch current donation status
4. Update `payment_status` in donations table
5. Insert audit record in `status_change_log` table
6. If changing to "completed", trigger receipt generation
7. Send alert notification to super admins
8. Revalidate page path

**Response:**
```typescript
{
  ok: boolean;
  message: string;
}
```

**Success Response:**
```json
{
  "ok": true,
  "message": "Payment status updated successfully"
}
```

**Error Responses:**
```json
{
  "ok": false,
  "message": "Unauthorized: Admin access required"
}
```

```json
{
  "ok": false,
  "message": "Reason must be at least 10 characters"
}
```

```json
{
  "ok": false,
  "message": "Donation not found"
}
```

**Rate Limiting:** None

**Audit Logging:** Yes - all status changes logged to `status_change_log`

---

### 2. addReviewNote

**File:** `lib/actions/admin-donation-actions.ts`

**Purpose:** Adds an internal review note to a donation.

**Authorization:** ADMIN, SUPER_ADMIN only

**Input:**
```typescript
{
  donationId: string;      // UUID of the donation
  noteText: string;        // Minimum 10 characters
}
```

**Validation Rules:**
- `donationId`: Must be a valid UUID
- `noteText`: Minimum 10 characters, maximum 2000 characters
- User must have ADMIN or SUPER_ADMIN role
- Donation must exist

**Process:**
1. Authenticate user and verify role
2. Validate input parameters
3. Insert record in `review_notes` table with admin_id
4. Revalidate page path

**Response:**
```typescript
{
  ok: boolean;
  message: string;
}
```

**Success Response:**
```json
{
  "ok": true,
  "message": "Review note added successfully"
}
```

**Error Responses:**
```json
{
  "ok": false,
  "message": "Unauthorized: Admin access required"
}
```

```json
{
  "ok": false,
  "message": "Note must be at least 10 characters"
}
```

**Rate Limiting:** None

**Audit Logging:** Yes - all notes stored with timestamp and admin_id

---

### 3. updateReviewStatus

**File:** `lib/actions/admin-donation-actions.ts`

**Purpose:** Updates the review status of a donation.

**Authorization:** ADMIN, SUPER_ADMIN only

**Input:**
```typescript
{
  donationId: string;      // UUID of the donation
  reviewStatus: "unreviewed" | "verified" | "flagged" | "refunded";
}
```

**Validation Rules:**
- `donationId`: Must be a valid UUID
- `reviewStatus`: Must be one of the allowed values
- User must have ADMIN or SUPER_ADMIN role
- Donation must exist

**Process:**
1. Authenticate user and verify role
2. Validate input parameters
3. Update `review_status`, `reviewed_at`, and `reviewed_by` in donations table
4. Revalidate page path

**Response:**
```typescript
{
  ok: boolean;
  message: string;
}
```

**Success Response:**
```json
{
  "ok": true,
  "message": "Review status updated successfully"
}
```

**Error Responses:**
```json
{
  "ok": false,
  "message": "Unauthorized: Admin access required"
}
```

```json
{
  "ok": false,
  "message": "Invalid review status"
}
```

**Rate Limiting:** None

**Audit Logging:** Yes - reviewed_at and reviewed_by tracked

---

### 4. resendReceipt

**File:** `lib/actions/admin-donation-actions.ts`

**Purpose:** Resends the donation receipt email to the donor.

**Authorization:** ADMIN, SUPER_ADMIN only

**Input:**
```typescript
{
  donationId: string;      // UUID of the donation
}
```

**Validation Rules:**
- `donationId`: Must be a valid UUID
- User must have ADMIN or SUPER_ADMIN role
- Donation must exist
- Receipt must exist (receipt_number not null)
- Rate limit: Maximum 3 resends per hour per donation

**Process:**
1. Authenticate user and verify role
2. Validate input parameters
3. Check rate limit (3 per hour)
4. Fetch donation and verify receipt exists
5. Send receipt email via email service
6. Log resend event to `payment_events` table
7. Revalidate page path

**Response:**
```typescript
{
  ok: boolean;
  message: string;
}
```

**Success Response:**
```json
{
  "ok": true,
  "message": "Receipt resent successfully"
}
```

**Error Responses:**
```json
{
  "ok": false,
  "message": "Unauthorized: Admin access required"
}
```

```json
{
  "ok": false,
  "message": "Rate limit exceeded: Maximum 3 resends per hour"
}
```

```json
{
  "ok": false,
  "message": "No receipt found for this donation"
}
```

**Rate Limiting:** 3 resends per hour per donation

**Audit Logging:** Yes - all resend events logged to `payment_events`

---

### 5. exportTransactionPDF

**File:** `lib/actions/admin-donation-actions.ts`

**Purpose:** Generates and exports a PDF report of the transaction.

**Authorization:** ADMIN, SUPER_ADMIN, FINANCE

**Input:**
```typescript
{
  donationId: string;      // UUID of the donation
}
```

**Validation Rules:**
- `donationId`: Must be a valid UUID
- User must have ADMIN, SUPER_ADMIN, or FINANCE role
- Donation must exist

**Process:**
1. Authenticate user and verify role
2. Validate input parameters
3. Fetch all transaction data (donation, notes, status changes, events)
4. Generate PDF using PDF generation utility
5. Upload PDF to Supabase storage (admin-exports bucket)
6. Generate signed URL with 1-hour expiration
7. Log export event to `payment_events` table
8. Return signed URL

**Response:**
```typescript
{
  ok: boolean;
  message: string;
  pdfUrl?: string;         // Signed URL valid for 1 hour
}
```

**Success Response:**
```json
{
  "ok": true,
  "message": "Transaction exported successfully",
  "pdfUrl": "https://storage.supabase.co/..."
}
```

**Error Responses:**
```json
{
  "ok": false,
  "message": "Unauthorized: Finance permission required"
}
```

```json
{
  "ok": false,
  "message": "Failed to generate PDF"
}
```

**Rate Limiting:** None

**Audit Logging:** Yes - all exports logged to `payment_events`

---

## Database Schema

### donations table
```sql
- id: uuid (primary key)
- amount: numeric
- currency: varchar
- payment_status: varchar (pending, completed, failed, review)
- payment_method: varchar
- provider: varchar
- receipt_number: varchar
- created_at: timestamp
- confirmed_at: timestamp
- receipt_sent_at: timestamp
- reviewed_at: timestamp
- reviewed_by: uuid (foreign key to admin_users)
- review_status: varchar (unreviewed, verified, flagged, refunded)
- donor_name: varchar
- donor_email: varchar
- donor_phone: varchar
- donor_message: text
- provider_ref: varchar
- stripe_session_id: varchar
- khalti_pidx: varchar
- esewa_transaction_uuid: varchar
- payment_id: varchar
- verification_id: uuid
- is_monthly: boolean
```

### review_notes table
```sql
- id: uuid (primary key)
- donation_id: uuid (foreign key to donations)
- admin_id: uuid (foreign key to admin_users)
- note_text: text
- created_at: timestamp

Indexes:
- (donation_id, created_at DESC)
```

### status_change_log table
```sql
- id: uuid (primary key)
- donation_id: uuid (foreign key to donations)
- admin_id: uuid (foreign key to admin_users)
- old_status: varchar
- new_status: varchar
- reason: text
- created_at: timestamp

Indexes:
- (donation_id, created_at DESC)
```

### payment_events table
```sql
- id: uuid (primary key)
- donation_id: uuid (foreign key to donations)
- event_type: varchar
- event_data: jsonb
- created_at: timestamp
- provider_event_id: varchar

Indexes:
- (donation_id, created_at DESC)
```

---

## Error Handling

### Error Types

**Authentication Errors (401)**
- User not logged in
- Invalid session token

**Authorization Errors (403)**
- Insufficient permissions for action
- Role not authorized

**Validation Errors (400)**
- Invalid input format
- Missing required fields
- Input length constraints violated

**Not Found Errors (404)**
- Donation not found
- Receipt not found

**Rate Limit Errors (429)**
- Too many requests
- Rate limit exceeded

**Server Errors (500)**
- Database connection failed
- External service unavailable
- Unexpected error

### Error Response Format
```typescript
{
  ok: false;
  message: string;        // User-friendly error message
  code?: string;          // Optional error code
  details?: any;          // Optional error details (dev mode only)
}
```

---

## Security Considerations

### Authentication
- All actions require valid authentication
- Session tokens validated on every request
- Expired sessions automatically rejected

### Authorization
- Role-based access control (RBAC)
- Server-side permission checks
- No client-side permission bypass possible

### Input Validation
- All inputs validated on server
- SQL injection prevention via parameterized queries
- XSS prevention via input sanitization

### Rate Limiting
- Receipt resend: 3 per hour per donation
- Prevents abuse and spam
- Rate limit tracked per donation, not per user

### Audit Logging
- All critical actions logged
- Includes timestamp, admin_id, and action details
- Immutable audit trail

---

## Performance Considerations

### Database Queries
- Indexed columns for fast lookups
- Specific column selection (no SELECT *)
- Parallel data fetching where possible

### Caching
- No caching for real-time data
- Signed URLs cached for 1 hour (PDF exports)

### Optimization
- Batch operations where possible
- Async processing for heavy operations
- Connection pooling for database

---

## Testing

### Unit Tests
```typescript
// Test authentication
test('rejects unauthenticated requests')
test('rejects unauthorized roles')

// Test validation
test('validates minimum character length')
test('validates UUID format')
test('validates enum values')

// Test business logic
test('creates audit log entry')
test('updates donation status')
test('enforces rate limits')
```

### Integration Tests
```typescript
// Test end-to-end flows
test('status change flow')
test('review note addition flow')
test('receipt resend flow')
test('PDF export flow')
```

---

## Migration Guide

### Phase 1: Database Setup
1. Run migration to create `review_notes` table
2. Run migration to create `status_change_log` table
3. Run migration to add `review_status` column to donations
4. Create indexes for performance

### Phase 2: Deploy Server Actions
1. Deploy `admin-donation-actions.ts` file
2. Verify authentication middleware
3. Test each action in staging
4. Monitor error logs

### Phase 3: Enable Features
1. Enable status change feature
2. Enable review notes feature
3. Enable receipt resend feature
4. Enable PDF export feature

---

## Monitoring

### Metrics to Track
- Action success/failure rates
- Average response times
- Rate limit hits
- Error rates by type
- PDF generation times

### Alerts
- High error rate (> 5%)
- Slow response times (> 2s)
- Rate limit abuse
- Failed PDF generations

---

## Support

### Common Questions

**Q: How do I increase the rate limit for receipt resends?**
A: Modify the rate limit check in `resendReceipt` action. Current limit is 3 per hour.

**Q: Can I add custom fields to review notes?**
A: Yes, modify the `review_notes` table schema and update the `addReviewNote` action.

**Q: How long are PDF exports stored?**
A: PDFs are stored indefinitely in Supabase storage. Signed URLs expire after 1 hour.

**Q: Can I export transactions in other formats?**
A: Currently only PDF is supported. Add new export actions for other formats.

---

## Changelog

### Version 1.0.0 (Initial Release)
- changePaymentStatus action
- addReviewNote action
- updateReviewStatus action
- resendReceipt action with rate limiting
- exportTransactionPDF action
- Complete audit logging
- Error handling and validation
