# eSewa Payment Gateway Integration Guide

This document provides a comprehensive guide for integrating and managing eSewa payments in the Deesha Foundation application.

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

eSewa is a mobile wallet and payment gateway in Nepal that allows users to make payments using their eSewa wallet, mobile banking, and other payment methods.

### Features

- ePay integration
- Support for one-time donations
- Real-time transaction verification
- Success and failure callback handling
- Amount verification and idempotency checks

## Getting Started

### 1. Merchant Account Setup

1. **Sandbox Access:**
   - Sign up at [eSewa Developer Portal](https://developer.esewa.com.np)
   - Use test merchant ID: `EPAYTEST`
   - Complete merchant registration

2. **Production Access:**
   - Contact eSewa for production merchant account
   - Complete KYC verification
   - Obtain production credentials

### 2. Test Credentials

**Sandbox:**

- Merchant ID: `EPAYTEST`
- Use eSewa test accounts provided by eSewa

## Environment Configuration

### Required Environment Variables

Add these to your `.env` file:

```env
# eSewa Merchant ID
# Sandbox: EPAYTEST
# Production: Your merchant ID from eSewa
ESEWA_MERCHANT_ID=your_merchant_id_here

# eSewa Secret Key (if available)
ESEWA_SECRET_KEY=your_esewa_secret_key_here

# eSewa Base URL
# Sandbox: https://uat.esewa.com.np
# Production: https://esewa.com.np
ESEWA_BASE_URL=https://esewa.com.np

# Success Callback URL
ESEWA_SUCCESS_URL=https://yoursite.com/api/payments/esewa/success

# Failure Callback URL
ESEWA_FAILURE_URL=https://yoursite.com/api/payments/esewa/failure
```

### Environment-Specific Configuration

**Development (Sandbox):**

```env
ESEWA_MERCHANT_ID=EPAYTEST
ESEWA_BASE_URL=https://uat.esewa.com.np
ESEWA_SUCCESS_URL=http://localhost:3000/api/payments/esewa/success
ESEWA_FAILURE_URL=http://localhost:3000/api/payments/esewa/failure
```

**Production:**

```env
ESEWA_MERCHANT_ID=your_production_merchant_id
ESEWA_BASE_URL=https://esewa.com.np
ESEWA_SUCCESS_URL=https://yoursite.com/api/payments/esewa/success
ESEWA_FAILURE_URL=https://yoursite.com/api/payments/esewa/failure
```

## Payment Flow

### 1. Payment Initiation

When a user initiates a donation:

```typescript
// lib/actions/donation.ts calls:
startEsewaPayment({
  id: donation.id,
  amount: 100, // NPR
  currency: "NPR"
}, mode)
```

**What happens:**

1. Validates amount (minimum Rs. 1)
2. Generates reference ID: `esewa_<donationId>`
3. Builds redirect URL with all required parameters
4. Returns redirect URL
5. User is redirected to eSewa payment page

### 2. Payment Processing

User completes payment on eSewa's hosted page:

- User logs in to eSewa
- User selects payment method
- User completes payment

### 3. Callback Handling

After payment, eSewa redirects to callback URLs:

**Success Callback (`/api/payments/esewa/success`):**

- Receives: `refId`, `pid`, `amt`
- Verifies transaction with eSewa `transrec` endpoint
- Updates donation status to `completed` if verified
- Redirects user to success page

**Failure Callback (`/api/payments/esewa/failure`):**

- Receives: `pid` (product ID)
- Updates donation status to `failed`
- Redirects user to cancel page

### 4. Transaction Verification

The success handler verifies transactions:

1. **Extracts parameters** from callback URL
2. **Finds donation** by ID (from `pid`)
3. **Checks idempotency** - prevents duplicate processing
4. **Verifies amount** matches donation amount
5. **Calls eSewa transrec API**: `GET /epay/transrec?amt=...&scd=...&pid=...&rid=...`
6. **Checks response** for "success" string
7. **Updates database** with final status
8. **Redirects user** to appropriate page

## API Reference

### Payment Initiation

**URL:** `{ESEWA_BASE_URL}/epay/main?{params}`

**Parameters:**

- `amt`: Amount to be paid (excluding service charge)
- `psc`: Product service charge (0 for donations)
- `pdc`: Product delivery charge (0 for donations)
- `txAmt`: Tax amount (0 for donations)
- `tAmt`: Total amount (amt + psc + pdc + txAmt)
- `pid`: Product ID (unique identifier: `esewa_<donationId>`)
- `scd`: Service code (merchant ID)
- `su`: Success URL (callback on success)
- `fu`: Failure URL (callback on failure)

**Example:**

```bash
https://esewa.com.np/epay/main?amt=100.00&psc=0&pdc=0&txAmt=0&tAmt=100.00&pid=esewa_123&scd=EPAYTEST&su=https://yoursite.com/api/payments/esewa/success&fu=https://yoursite.com/api/payments/esewa/failure
```

### Transaction Verification

**Endpoint:** `GET {ESEWA_BASE_URL}/epay/transrec?{params}`

**Parameters:**

- `amt`: Amount paid
- `scd`: Service code (merchant ID)
- `pid`: Product ID
- `rid`: Reference ID (transaction ID from eSewa)

**Response:**

- Success: Response contains "success" (case-insensitive)
- Failure: Response does not contain "success"

**Example:**

``` bash
GET https://esewa.com.np/epay/transrec?amt=100.00&scd=EPAYTEST&pid=esewa_123&rid=REF123456
```

## Error Handling

### Common Errors

**1. Missing Parameters:**

```bash
Error: Missing required parameters
```

**Solution:** Ensure all required parameters (refId, pid, amt) are present in callback

**2. Invalid Donation ID:**

```bash
Error: Invalid donation identifier
```

**Solution:** Check that `pid` format is correct (`esewa_<uuid>`)

**3. Transaction Verification Failed:**

```bash
Error: eSewa verification failed
```

**Possible Causes:**

- Transaction not found in eSewa system
- Amount mismatch
- Invalid merchant ID

**Solutions:**

1. Check transaction in eSewa dashboard
2. Verify amount matches
3. Confirm merchant ID is correct

**4. Network Errors:**

- **Timeout:** Request exceeds 30 seconds
- **Solution:** Check network connectivity, retry with exponential backoff

### Error Handling in Code

The integration includes comprehensive error handling:

```typescript
// app/api/payments/esewa/success/route.ts
try {
  // Transaction verification
} catch (error) {
  // Log error
  // Return appropriate response
}
```

## Testing

### Sandbox Testing

1. **Set environment variables:**

   ```env
   ESEWA_BASE_URL=https://uat.esewa.com.np
   ESEWA_MERCHANT_ID=EPAYTEST
   PAYMENT_MODE=live
   ```

2. **Test scenarios:**
   - Successful payment
   - Payment cancellation
   - Invalid amount
   - Network failures
   - Duplicate callbacks (idempotency)

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

1. Callback URL not accessible
2. Verification endpoint failing
3. Network issues

**Solutions:**

1. Verify callback URLs are accessible
2. Check server logs for verification errors
3. Manually verify transaction using transrec API

### Amount Mismatch Warnings

**Symptoms:** Log shows "amount mismatch" warnings

**Possible Causes:**

1. Rounding differences
2. Currency conversion issues

**Solutions:**

1. Check tolerance settings (default: 0.01 NPR)
2. Verify amount formatting (2 decimal places)

### Callback Not Received

**Symptoms:** User completes payment but callback never arrives

**Possible Causes:**

1. Callback URL not accessible from eSewa servers
2. Firewall blocking eSewa IPs
3. SSL certificate issues

**Solutions:**

1. Verify callback URLs are publicly accessible
2. Check firewall rules
3. Ensure HTTPS is properly configured
4. Test callback URLs manually

### Duplicate Processing

**Symptoms:** Same transaction processed multiple times

**Solution:** Idempotency checks are implemented - verify they're working:

- Check if `payment_status` is already `completed` or `failed`
- Only update if status is still `pending`

## Security Best Practices

1. **Never expose merchant credentials:**
   - Keep `ESEWA_MERCHANT_ID` and `ESEWA_SECRET_KEY` server-side only
   - Never log full credentials
   - Use environment variables

2. **Always verify transactions:**
   - Never trust callback parameters alone
   - Always call `transrec` API before marking as completed
   - Verify amount matches

3. **Implement idempotency:**
   - Check if payment already processed
   - Prevent duplicate status updates
   - Use `payment_id` for lookups

4. **Validate inputs:**
   - Validate amount (minimum Rs. 1)
   - Validate UUID format for donation ID
   - Sanitize user inputs

5. **Secure logging:**
   - Mask sensitive data in logs
   - Don't log full credentials
   - Log payment events for auditing

6. **HTTPS only:**
   - All callbacks must use HTTPS in production
   - Verify SSL certificates

7. **Timeout handling:**
   - Set appropriate timeouts (30 seconds)
   - Handle network failures gracefully

8. **URL encoding:**
   - Properly encode callback URLs
   - Handle special characters in parameters

## Additional Resources

- [eSewa Developer Documentation](https://developer.esewa.com.np)
- [eSewa ePay Integration Guide](https://developer.esewa.com.np/pages/Epay)

## Support

For issues or questions:

1. Check this documentation
2. Review server logs
3. Contact eSewa support
4. Contact Deesha Foundation technical team
