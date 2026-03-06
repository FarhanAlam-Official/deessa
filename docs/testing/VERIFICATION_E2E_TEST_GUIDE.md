# Verification System End-to-End Test Guide

This guide provides step-by-step instructions for testing the complete verification system from receipt generation to public verification.

## Prerequisites

1. **Database Migration Applied:**
   ```bash
   psql $POSTGRES_URL -f scripts/payments-v2/029-add-verification-id-to-donations.sql
   ```

2. **Environment Variables Set:**
   ```bash
   NEXT_PUBLIC_APP_URL=http://localhost:3000  # or your production URL
   ```

3. **Development Server Running:**
   ```bash
   pnpm dev
   ```

4. **Mobile Device with QR Scanner** (for QR code testing)

## Automated Tests

Run the automated test suite first:

```bash
pnpm test verification-e2e.test.ts
```

**Expected Result:** ✅ All 24 tests pass

## Manual Test Scenarios

### Test 1: Complete Donation and Generate Receipt

**Steps:**
1. Navigate to donation page: `http://localhost:3000/donate`
2. Fill in donation form:
   - Name: "Test Donor"
   - Email: "test@example.com"
   - Amount: 5000 NPR
   - Payment method: Stripe (test mode)
3. Complete payment using test card: `4242 4242 4242 4242`
4. Wait for payment confirmation
5. Check email for receipt or download from confirmation page

**Expected Result:**
- ✅ Payment completes successfully
- ✅ Receipt email received
- ✅ Receipt PDF downloads successfully
- ✅ Receipt contains all donation details

### Test 2: Verify PDF Includes QR Code and Verification ID

**Steps:**
1. Open the downloaded receipt PDF
2. Scroll to bottom of receipt
3. Look for verification bar

**Expected Result:**
- ✅ Verification bar appears at bottom of receipt
- ✅ QR code (56×56pt) visible on left side
- ✅ "Scan to verify authenticity" label present
- ✅ Verification ID (UUID format) displayed on right
- ✅ Verification URL displayed below ID
- ✅ QR code is clear and scannable

**Visual Check:**
```
┌─────────────────────────────────────────────────────┐
│ [QR CODE]  Scan to verify    Verification ID:      │
│            authenticity       123e4567-e89b-12d3... │
│                              dessafoundation.org/... │
└─────────────────────────────────────────────────────┘
```

### Test 3: Scan QR Code with Mobile Device

**Steps:**
1. Open camera app or QR scanner on mobile device
2. Point camera at QR code on receipt PDF
3. Tap notification/link that appears

**Expected Result:**
- ✅ QR code scans successfully
- ✅ Mobile browser opens automatically
- ✅ Redirects to `/verify/[verification-id]` page
- ✅ Page loads without errors
- ✅ Works on both iOS and Android

**Troubleshooting:**
- If QR doesn't scan: Check PDF zoom level (should be 100%)
- If link doesn't open: Manually copy URL from QR code

### Test 4: Verify Landing on Verification Page

**Steps:**
1. After scanning QR code, observe the verification page
2. Check all displayed information

**Expected Result:**
- ✅ Page shows "Receipt Verified" heading with green checkmark
- ✅ Success message: "This is a valid donation receipt issued by Dessa Foundation"
- ✅ Receipt number displays correctly
- ✅ Donor name is masked (e.g., "T*** D***")
- ✅ Privacy note: "(Name masked for privacy)"
- ✅ Amount displays with currency
- ✅ Donation type shows (One-Time or Monthly Recurring)
- ✅ Date displays in readable format
- ✅ Verification ID shows at bottom
- ✅ "Verified by Dessa Foundation" badge displays

**Visual Check:**
```
┌─────────────────────────────────────┐
│         ✓ Receipt Verified          │
│                                     │
│ Receipt Number: DF-2026-00001       │
│ Donor Name: T*** D***               │
│ (Name masked for privacy)           │
│ Amount: NPR 5,000.00                │
│ Type: One-Time                      │
│ Date: March 3, 2026                 │
│ Verification ID: 123e4567...        │
│                                     │
│ 🛡️ Verified by Dessa Foundation    │
└─────────────────────────────────────┘
```

### Test 5: Test with Invalid UUID

**Steps:**
1. Navigate to: `http://localhost:3000/verify/invalid-uuid-here`
2. Observe the error page

**Expected Result:**
- ✅ Page shows "Receipt Not Found" heading
- ✅ Error icon displays (document with X)
- ✅ Error message: "The verification ID you provided is invalid or the receipt does not exist"
- ✅ Help text: "Please check the verification ID and try again"
- ✅ No sensitive data exposed
- ✅ No server errors in console

### Test 6: Test with Non-Existent UUID

**Steps:**
1. Generate a valid UUID: `550e8400-e29b-41d4-a716-446655440000`
2. Navigate to: `http://localhost:3000/verify/550e8400-e29b-41d4-a716-446655440000`
3. Observe the error page

**Expected Result:**
- ✅ Page shows "Receipt Not Found" heading
- ✅ Same error handling as invalid UUID
- ✅ No database errors
- ✅ No sensitive data exposed

### Test 7: Test Rate Limiting (25 Rapid Requests)

**Setup:**
Create a test script `test-rate-limit.js`:

```javascript
const verificationId = '123e4567-e89b-12d3-a456-426614174000'; // Use real ID
const baseUrl = 'http://localhost:3000';

async function testRateLimit() {
  console.log('Testing rate limit with 25 requests...\n');
  
  for (let i = 1; i <= 25; i++) {
    try {
      const response = await fetch(`${baseUrl}/verify/${verificationId}`);
      const status = response.status;
      
      if (status === 200) {
        console.log(`Request ${i}: ✅ Success (200)`);
      } else if (status === 429) {
        console.log(`Request ${i}: ⚠️  Rate Limited (429)`);
        const retryAfter = response.headers.get('Retry-After');
        console.log(`   Retry-After: ${retryAfter} seconds`);
      } else {
        console.log(`Request ${i}: ❌ Error (${status})`);
      }
    } catch (error) {
      console.log(`Request ${i}: ❌ Failed - ${error.message}`);
    }
    
    // Small delay to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 50));
  }
}

testRateLimit();
```

**Steps:**
1. Save the script above
2. Run: `node test-rate-limit.js`
3. Observe the output

**Expected Result:**
- ✅ Requests 1-20: Success (200)
- ✅ Requests 21-25: Rate Limited (429)
- ✅ Rate limit response includes:
  - Error message: "Rate limit exceeded. Please try again later."
  - `Retry-After` header with seconds
  - Reset time in response body
- ✅ After 1 minute, requests work again

**Alternative Manual Test:**
1. Open browser DevTools (Network tab)
2. Rapidly refresh `/verify/[id]` page 25 times
3. Observe responses after 20th request

### Test 8: Verify Existing Receipts Still Download

**Steps:**
1. Find an old donation (created before verification system)
2. Navigate to admin panel → Donations
3. Click "Download Receipt" for old donation
4. Open the PDF

**Expected Result:**
- ✅ Receipt downloads successfully
- ✅ PDF opens without errors
- ✅ All donation details display correctly
- ✅ No verification bar (backward compatible)
- ✅ Receipt is valid and complete

### Test 9: Test Backfilled verification_id on Old Donations

**Steps:**
1. Check database for old donations:
   ```sql
   SELECT id, receipt_number, verification_id, created_at
   FROM donations
   WHERE receipt_number IS NOT NULL
   ORDER BY created_at ASC
   LIMIT 10;
   ```

2. Verify backfill worked:
   ```sql
   SELECT COUNT(*) as total,
          COUNT(verification_id) as with_verification
   FROM donations
   WHERE receipt_number IS NOT NULL;
   ```

3. Test verification for old donation:
   - Copy `verification_id` from query result
   - Navigate to `/verify/[verification-id]`

**Expected Result:**
- ✅ All donations with receipts have `verification_id`
- ✅ `total` equals `with_verification` in count query
- ✅ Old donation verification page works
- ✅ Shows correct receipt details
- ✅ Donor name is masked

### Test 10: Cross-Browser Testing

**Browsers to Test:**
- Chrome/Edge (Windows, macOS)
- Firefox (Windows, macOS)
- Safari (macOS, iOS)
- Mobile browsers (iOS Safari, Chrome Android)

**For Each Browser:**
1. Navigate to verification page
2. Check layout and styling
3. Verify QR code displays
4. Test responsive design (resize window)

**Expected Result:**
- ✅ Page displays correctly in all browsers
- ✅ No layout issues
- ✅ QR code visible and scannable
- ✅ Responsive design works on mobile
- ✅ No console errors

### Test 11: Security Testing

**Test A: SQL Injection Attempt**
```
Navigate to: /verify/'; DROP TABLE donations; --
```
**Expected:** ✅ Shows "Receipt Not Found" (no SQL injection)

**Test B: XSS Attempt**
```
Navigate to: /verify/<script>alert('xss')</script>
```
**Expected:** ✅ Shows "Receipt Not Found" (no XSS execution)

**Test C: Path Traversal**
```
Navigate to: /verify/../../../etc/passwd
```
**Expected:** ✅ Shows "Receipt Not Found" (no path traversal)

**Test D: Donor Name Privacy**
1. Verify a receipt
2. Check page source (View → Page Source)
3. Search for full donor name

**Expected:** ✅ Full name not present in HTML (only masked version)

### Test 12: Performance Testing

**Test A: Page Load Time**
1. Open DevTools → Network tab
2. Navigate to verification page
3. Check "Load" time

**Expected:** ✅ Page loads in < 2 seconds

**Test B: Database Query Performance**
```sql
EXPLAIN ANALYZE
SELECT id, receipt_number, donor_name, amount, currency, created_at, is_monthly, payment_status
FROM donations
WHERE verification_id = '123e4567-e89b-12d3-a456-426614174000'
  AND payment_status = 'completed'
  AND receipt_number IS NOT NULL;
```

**Expected:** 
- ✅ Uses index on `verification_id`
- ✅ Execution time < 10ms
- ✅ Index Scan (not Seq Scan)

### Test 13: Error Recovery Testing

**Test A: Database Connection Lost**
1. Stop database temporarily
2. Try to verify receipt
3. Restart database

**Expected:**
- ✅ Shows user-friendly error message
- ✅ No stack traces exposed
- ✅ Works again after database restart

**Test B: Invalid QR Code Data**
1. Manually edit QR code URL to invalid format
2. Scan edited QR code

**Expected:**
- ✅ Shows "Receipt Not Found"
- ✅ No server errors

## Test Results Checklist

Mark each test as complete:

- [ ] ✅ Test 1: Complete donation and generate receipt
- [ ] ✅ Test 2: Verify PDF includes QR code and verification ID
- [ ] ✅ Test 3: Scan QR code with mobile device
- [ ] ✅ Test 4: Verify landing on verification page
- [ ] ✅ Test 5: Test with invalid UUID
- [ ] ✅ Test 6: Test with non-existent UUID
- [ ] ✅ Test 7: Test rate limiting (25 requests)
- [ ] ✅ Test 8: Verify existing receipts still download
- [ ] ✅ Test 9: Test backfilled verification_id
- [ ] ✅ Test 10: Cross-browser testing
- [ ] ✅ Test 11: Security testing
- [ ] ✅ Test 12: Performance testing
- [ ] ✅ Test 13: Error recovery testing

## Known Issues

Document any issues found during testing:

1. **Issue:** [Description]
   - **Severity:** High/Medium/Low
   - **Steps to Reproduce:** [Steps]
   - **Expected:** [Expected behavior]
   - **Actual:** [Actual behavior]
   - **Status:** Open/Fixed

## Sign-Off

**Tested By:** ___________________  
**Date:** ___________________  
**Environment:** Development / Staging / Production  
**Result:** Pass / Fail / Pass with Issues  

**Notes:**
_______________________________________________________
_______________________________________________________
_______________________________________________________

## Next Steps

After all tests pass:
1. ✅ Mark task 31.10 as complete
2. ✅ Document any issues in GitHub/issue tracker
3. ✅ Proceed to production migration (task 31.11)
4. ✅ Schedule production testing window
5. ✅ Prepare rollback plan if needed
