# Khalti Payment Gateway Integration Guide

This document provides a comprehensive guide for integrating and managing Khalti payments in the Deesha Foundation application.

## Table of Contents

1. [Overview](#overview)
2. [Getting Started](#getting-started)
3. [Environment Configuration](#environment-configuration)
4. [Payment Flow](#payment-flow)
5. [API Reference](#api-reference)
6. [Error Handling](#error-handling)
7. [Testing](#testing)
8. [Troubleshooting](#troubleshooting)
9. [Security Best Practices](#security-best-practices)

## Overview

Khalti is a digital wallet and payment gateway in Nepal that allows users to make payments using their Khalti wallet, mobile banking, eBanking, SCT/VISA cards, and connectIPS.

### Features

- Web Checkout (KPG-2) integration
- Support for one-time donations
- Real-time payment verification
- Comprehensive status handling (Completed, Pending, Refunded, Expired, Canceled)
- Amount verification and idempotency checks

## Getting Started

### 1. Merchant Account Setup

1. **Sandbox Access:**
   - Sign up at [test-admin.khalti.com](https://test-admin.khalti.com)
   - Use OTP: `987654` for sandbox login
   - Complete merchant registration

2. **Production Access:**
   - Visit [admin.khalti.com](https://admin.khalti.com)
   - Complete KYC verification
   - Obtain production credentials

### 2. Test Credentials

**Sandbox Test Accounts:**

- Khalti ID: `9800000000` through `9800000005`
- MPIN: `1111`
- OTP: `987654`

## Environment Configuration

### Required Environment Variables

Add these to your `.env` file:

```env
# Khalti Secret Key
# Sandbox: Get from test-admin.khalti.com
# Production: Get from admin.khalti.com
KHALTI_SECRET_KEY=your_khalti_secret_key_here

# Khalti API Base URL
# Sandbox: https://dev.khalti.com/api/v2
# Production: https://khalti.com/api/v2
KHALTI_BASE_URL=https://khalti.com/api/v2

# Return URL (where users are redirected after payment)
KHALTI_RETURN_URL=https://yoursite.com/payments/khalti/return

# Optional: Sandbox mode flag
KHALTI_SANDBOX_MODE=false
```

### Environment-Specific Configuration

**Development (Sandbox):**

```env
KHALTI_SECRET_KEY=live_secret_key_from_test_admin
KHALTI_BASE_URL=https://dev.khalti.com/api/v2
KHALTI_RETURN_URL=http://localhost:3000/payments/khalti/return
KHALTI_SANDBOX_MODE=true
```

**Production:**

```env
KHALTI_SECRET_KEY=live_secret_key_from_production_admin
KHALTI_BASE_URL=https://khalti.com/api/v2
KHALTI_RETURN_URL=https://yoursite.com/payments/khalti/return
KHALTI_SANDBOX_MODE=false
```

## Payment Flow

### 1. Payment Initiation

When a user initiates a donation:

```typescript
// lib/actions/donation.ts calls:
startKhaltiPayment({
  id: donation.id,
  amount: 100, // NPR
  currency: "NPR",
  donorName: "John Doe",
  donorEmail: "john@example.com",
  donorPhone: "+9779800000000" // Optional
}, mode)
```

**What happens:**

1. Validates amount (minimum Rs. 10 = 1000 paisa)
2. Validates donor information
3. Calls Khalti API: `POST /epayment/initiate/`
4. Returns `payment_url` and `pidx` (payment identifier)
5. User is redirected to Khalti payment page

### 2. Payment Processing

User completes payment on Khalti's hosted page:

- User selects payment method (wallet, banking, card)
- User completes authentication
- Khalti processes the payment

### 3. Return and Verification

After payment, user is redirected to return URL with parameters:

- `pidx`: Payment identifier
- `status`: Payment status
- `transaction_id`: Transaction ID (if successful)
- `amount`: Amount paid
- `mobile`: Payer's Khalti ID

**Return Page Flow:**

1. `app/(public)/payments/khalti/return/page.tsx` receives callback
2. Extracts `pidx` from URL
3. Calls verification API: `POST /api/payments/khalti/verify`
4. Verification endpoint calls Khalti lookup API
5. Updates donation status based on verification result
6. Redirects user to success/failure page

### 4. Verification Process

The verification endpoint (`app/api/payments/khalti/verify/route.ts`):

1. **Finds donation** by `payment_id = "khalti:<pidx>"`
2. **Checks idempotency** - prevents duplicate processing
3. **Calls Khalti lookup API**: `POST /epayment/lookup/`
4. **Verifies amount** matches donation amount
5. **Handles all status codes:**
   - `Completed` → `payment_status = "completed"`
   - `Pending` / `Initiated` → Keep as `pending` (hold transaction)
   - `Refunded` / `Partially Refunded` → `payment_status = "failed"`
   - `Expired` / `User canceled` → `payment_status = "failed"`
6. **Updates database** with final status

## API Reference

### Payment Initiation

**Endpoint:** `POST {KHALTI_BASE_URL}/epayment/initiate/`

**Headers:**

```
Authorization: Key <KHALTI_SECRET_KEY>
Content-Type: application/json
```

**Request Body:**

```json
{
  "return_url": "https://yoursite.com/payments/khalti/return",
  "website_url": "https://yoursite.com",
  "amount": 1000,
  "purchase_order_id": "donation-uuid",
  "purchase_order_name": "Donation to Deesha Foundation",
  "customer_info": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+9779800000000"
  },
  "amount_breakdown": [
    {
      "label": "Donation Amount",
      "amount": 1000
    }
  ],
  "product_details": [
    {
      "identity": "donation-uuid",
      "name": "Donation to Deesha Foundation",
      "total_price": 1000,
      "quantity": 1,
      "unit_price": 1000
    }
  ],
  "merchant_extra": "{\"donation_id\":\"uuid\",\"currency\":\"NPR\"}"
}
```

**Response:**

```json
{
  "pidx": "HT6o6PEZRWFJ5ygavzHWd5",
  "payment_url": "https://pay.khalti.com/...",
  "expires_at": "2024-01-01T12:00:00Z",
  "expires_in": 3600
}
```

### Payment Verification (Lookup)

**Endpoint:** `POST {KHALTI_BASE_URL}/epayment/lookup/`

**Headers:**

```
Authorization: Key <KHALTI_SECRET_KEY>
Content-Type: application/json
```

**Request Body:**

```json
{
  "pidx": "HT6o6PEZRWFJ5ygavzHWd5"
}
```

**Success Response:**

```json
{
  "pidx": "HT6o6PEZRWFJ5ygavzHWd5",
  "total_amount": 1000,
  "status": "Completed",
  "transaction_id": "GFq9PFS7b2iYvL8Lir9oXe",
  "fee": 0,
  "refunded": false
}
```

**Status Codes:**

- `Completed` - Payment successful
- `Pending` - Payment in progress
- `Initiated` - Payment initiated but not completed
- `Refunded` - Payment refunded
- `Partially Refunded` - Partial refund
- `Expired` - Payment link expired
- `User canceled` - User canceled payment

## Error Handling

### Common Errors

**1. Invalid Amount:**

```json
{
  "amount": ["Amount should be greater than Rs. 10, that is 1000 paisa."],
  "error_key": "validation_error"
}
```

**Solution:** Ensure amount is at least Rs. 10 (1000 paisa)

**2. Invalid Authorization:**

```json
{
  "detail": "Invalid token.",
  "status_code": 401
}
```

**Solution:** Check `KHALTI_SECRET_KEY` is correct and has "Key " prefix

**3. Missing pidx:**

```json
{
  "detail": "Not found.",
  "error_key": "validation_error"
}
```

**Solution:** Ensure pidx is valid and not expired (links expire in 60 minutes)

**4. Network Errors:**

- **Timeout:** Request exceeds 30 seconds
- **Solution:** Check network connectivity, retry with exponential backoff

### Error Handling in Code

The integration includes comprehensive error handling:

```typescript
// lib/payments/khalti.ts
try {
  // Payment initiation
} catch (error) {
  if (error instanceof KhaltiError) {
    // Handle Khalti-specific errors
  } else {
    // Handle network/unknown errors
  }
}
```

## Testing

### Sandbox Testing

1. **Set environment variables:**

   ```env
   KHALTI_BASE_URL=https://dev.khalti.com/api/v2
   KHALTI_SECRET_KEY=your_sandbox_secret_key
   PAYMENT_MODE=live
   ```

2. **Use test credentials:**
   - Khalti ID: `9800000000`
   - MPIN: `1111`
   - OTP: `987654`

3. **Test scenarios:**
   - Successful payment
   - Payment cancellation
   - Payment expiration (wait 60 minutes)
   - Invalid amount (< Rs. 10)
   - Network failures

### Mock Mode Testing

Set `PAYMENT_MODE=mock` for testing without real API calls:

```env
PAYMENT_MODE=mock
```

Mock mode:

- Skips actual API calls
- Returns simulated responses
- Useful for development and demos

## Troubleshooting

### Payment Not Completing

**Symptoms:** Payment shows as pending after user completes payment

**Possible Causes:**

1. Return URL not accessible
2. Verification endpoint failing
3. Network issues

**Solutions:**

1. Verify `KHALTI_RETURN_URL` is accessible
2. Check server logs for verification errors
3. Manually verify payment using lookup API

### Amount Mismatch Warnings

**Symptoms:** Log shows "amount mismatch" warnings

**Possible Causes:**

1. Rounding differences
2. Currency conversion issues

**Solutions:**

1. Check tolerance settings (default: 1 paisa)
2. Verify amount calculation (amount * 100 for paisa)

### Payment Link Expired

**Symptoms:** User sees "Expired" status

**Possible Causes:**

1. User took too long to complete payment (> 60 minutes)
2. Payment link was generated too long ago

**Solutions:**

1. Generate new payment link
2. Inform user to complete payment within 60 minutes

## Security Best Practices

1. **Never expose secret keys:**
   - Keep `KHALTI_SECRET_KEY` server-side only
   - Never log full secret keys
   - Use environment variables

2. **Always verify payments:**
   - Never trust client-side status
   - Always call lookup API before marking as completed
   - Verify amount matches

3. **Implement idempotency:**
   - Check if payment already processed
   - Prevent duplicate status updates
   - Use `payment_id` for lookups

4. **Validate inputs:**
   - Validate amount (minimum Rs. 10)
   - Validate email format
   - Sanitize user inputs

5. **Secure logging:**
   - Mask sensitive data in logs
   - Don't log full API keys
   - Log payment events for auditing

6. **HTTPS only:**
   - All callbacks must use HTTPS in production
   - Verify SSL certificates

7. **Timeout handling:**
   - Set appropriate timeouts (30 seconds)
   - Handle network failures gracefully

## Additional Resources

- [Khalti Official Documentation](https://docs.khalti.com/khalti-epayment/)
- [Khalti Sandbox Dashboard](https://test-admin.khalti.com)
- [Khalti Production Dashboard](https://admin.khalti.com)

## Support

For issues or questions:

1. Check this documentation
2. Review server logs
3. Contact Khalti support
4. Contact Deesha Foundation technical team
