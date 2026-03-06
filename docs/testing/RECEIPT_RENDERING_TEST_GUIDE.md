# Receipt Rendering Test Guide

This document provides manual testing procedures for receipt rendering with stamps, signatures, and verification features.

## Automated Tests

Run the automated test suite:

```bash
pnpm test receipt-rendering.test.ts
```

**Test Coverage:**
- ✅ 21 tests covering all scenarios
- ✅ Stamp and signature URL combinations
- ✅ URL validation (HTTPS, relative, invalid)
- ✅ Verification QR code rendering
- ✅ Backward compatibility
- ✅ Edge cases (special characters, large amounts, etc.)

## Manual Testing Scenarios

### Prerequisites

1. Ensure database migration 029 is applied:
   ```bash
   psql $POSTGRES_URL -f scripts/payments-v2/029-add-verification-id-to-donations.sql
   ```

2. Set environment variable:
   ```bash
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

3. Have test images ready:
   - Official stamp image (recommended: 200×200px PNG with transparency)
   - Digital signature image (recommended: 300×100px PNG with transparency)

### Test Scenario 1: Both Stamp and Signature URLs

**Setup:**
1. Navigate to Admin → Organization Settings
2. Add stamp URL: `https://example.com/stamp.png`
3. Add signature URL: `https://example.com/signature.png`
4. Save settings

**Test:**
1. Create a test donation
2. Generate receipt
3. Download PDF

**Expected Result:**
- ✅ Signature image appears on left side of footer (120×40px)
- ✅ Stamp image appears on right side of footer (80×80px)
- ✅ Both images render clearly
- ✅ No console warnings

### Test Scenario 2: Only Stamp URL

**Setup:**
1. Navigate to Admin → Organization Settings
2. Add stamp URL: `https://example.com/stamp.png`
3. Leave signature URL empty
4. Save settings

**Test:**
1. Create a test donation
2. Generate receipt
3. Download PDF

**Expected Result:**
- ✅ Stamp image appears on right side of footer
- ✅ Signature line appears (no image) on left side
- ✅ "Authorized Signatory" text displays
- ✅ No console errors

### Test Scenario 3: Only Signature URL

**Setup:**
1. Navigate to Admin → Organization Settings
2. Leave stamp URL empty
3. Add signature URL: `https://example.com/signature.png`
4. Save settings

**Test:**
1. Create a test donation
2. Generate receipt
3. Download PDF

**Expected Result:**
- ✅ Signature image appears on left side of footer
- ✅ No stamp image on right side
- ✅ Receipt metadata displays correctly
- ✅ No console errors

### Test Scenario 4: No URLs (Backward Compatibility)

**Setup:**
1. Navigate to Admin → Organization Settings
2. Leave both stamp URL and signature URL empty
3. Save settings

**Test:**
1. Create a test donation
2. Generate receipt
3. Download PDF

**Expected Result:**
- ✅ Receipt generates successfully
- ✅ Signature line appears (no image)
- ✅ No stamp section
- ✅ All other receipt elements display correctly
- ✅ No console errors

### Test Scenario 5: Relative URLs (Should Skip)

**Setup:**
1. Navigate to Admin → Organization Settings
2. Add stamp URL: `/images/stamp.png` (relative path)
3. Add signature URL: `./signature.png` (relative path)
4. Save settings

**Test:**
1. Create a test donation
2. Generate receipt
3. Check browser console

**Expected Result:**
- ✅ Receipt generates successfully
- ✅ Images do NOT render (skipped)
- ⚠️ Console warning: "Invalid or relative URL for stamp_url"
- ⚠️ Console warning: "Invalid or relative URL for signature_url"
- ✅ Receipt falls back to text-only footer

### Test Scenario 6: Invalid URLs (Should Skip)

**Setup:**
1. Navigate to Admin → Organization Settings
2. Add stamp URL: `ftp://example.com/stamp.png` (invalid protocol)
3. Add signature URL: `not-a-url` (invalid format)
4. Save settings

**Test:**
1. Create a test donation
2. Generate receipt
3. Check browser console

**Expected Result:**
- ✅ Receipt generates successfully
- ✅ Images do NOT render (skipped)
- ⚠️ Console warnings for invalid URLs
- ✅ Receipt falls back to text-only footer

### Test Scenario 7: Verification QR Code

**Setup:**
1. Ensure migration 029 is applied (adds verification_id)
2. Create a new donation (will have verification_id)

**Test:**
1. Generate receipt for new donation
2. Download PDF
3. Check verification bar at bottom

**Expected Result:**
- ✅ Verification bar appears at bottom of receipt
- ✅ QR code (56×56pt) displays on left
- ✅ "Scan to verify authenticity" label displays
- ✅ Verification ID displays on right
- ✅ Verification URL displays
- ✅ QR code scans correctly to verification page

### Test Scenario 8: Legacy Receipt (No Verification)

**Setup:**
1. Find an old donation created before migration 029
2. Or manually set verification_id to NULL in database

**Test:**
1. Generate receipt for legacy donation
2. Download PDF

**Expected Result:**
- ✅ Receipt generates successfully
- ✅ No verification bar appears
- ✅ All other receipt elements display correctly
- ✅ Backward compatible with old receipts

### Test Scenario 9: Supabase Storage URLs

**Setup:**
1. Upload stamp image to Supabase Storage
2. Upload signature image to Supabase Storage
3. Get public URLs (format: `https://[project].supabase.co/storage/v1/object/public/...`)
4. Add URLs to organization settings

**Test:**
1. Create a test donation
2. Generate receipt
3. Download PDF

**Expected Result:**
- ✅ Images load from Supabase Storage
- ✅ Images render correctly in PDF
- ✅ No CORS errors
- ✅ No console warnings

### Test Scenario 10: Private Supabase URLs (Should Fail)

**Setup:**
1. Upload images to private Supabase bucket
2. Get authenticated URLs (with tokens)
3. Add URLs to organization settings

**Test:**
1. Create a test donation
2. Generate receipt
3. Check browser console

**Expected Result:**
- ⚠️ Images may fail to load (authentication required)
- ✅ Receipt still generates (graceful fallback)
- ⚠️ Console errors about image loading
- ✅ Receipt falls back to text-only footer

## Verification Page Testing

### Test Scenario 11: Valid Verification ID

**Test:**
1. Generate a receipt with verification
2. Copy verification ID from receipt
3. Navigate to `/verify/[verification-id]`

**Expected Result:**
- ✅ "Receipt Verified" success message
- ✅ Receipt number displays
- ✅ Masked donor name (e.g., "J*** S***")
- ✅ Amount and currency display
- ✅ Donation type displays
- ✅ Date displays
- ✅ Verification ID displays

### Test Scenario 12: Invalid Verification ID

**Test:**
1. Navigate to `/verify/invalid-uuid-here`

**Expected Result:**
- ✅ "Receipt Not Found" error message
- ✅ Helpful error text
- ✅ No sensitive data exposed

### Test Scenario 13: Rate Limiting

**Test:**
1. Make 21+ requests to `/verify/[id]` within 1 minute

**Expected Result:**
- ✅ First 20 requests succeed
- ✅ 21st request returns "Rate Limit Exceeded"
- ✅ Retry-After header present
- ✅ Reset time displays

### Test Scenario 14: QR Code Scanning

**Test:**
1. Generate receipt with verification
2. Print or display PDF
3. Scan QR code with mobile device

**Expected Result:**
- ✅ QR code scans successfully
- ✅ Opens verification page in browser
- ✅ Displays receipt details
- ✅ Works on iOS and Android

## Performance Testing

### Test Scenario 15: Concurrent Receipt Generation

**Test:**
1. Generate 10 receipts simultaneously
2. Monitor server logs
3. Check all PDFs

**Expected Result:**
- ✅ All receipts generate successfully
- ✅ No race conditions
- ✅ Verification IDs are unique
- ✅ Receipt numbers are sequential
- ✅ No database deadlocks

### Test Scenario 16: Large Image Files

**Test:**
1. Upload large stamp image (>5MB)
2. Upload large signature image (>5MB)
3. Generate receipt

**Expected Result:**
- ⚠️ PDF generation may be slow
- ✅ Receipt still generates
- ⚠️ Consider image optimization warning
- ✅ Recommend max 500KB per image

## Browser Compatibility

Test receipt download and verification page in:
- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari (macOS/iOS)
- ✅ Mobile browsers (iOS Safari, Chrome Android)

## Checklist

Before marking task 30.4 complete, verify:

- [x] Automated tests pass (21/21)
- [ ] Manual test scenario 1 (both URLs) ✅
- [ ] Manual test scenario 2 (stamp only) ✅
- [ ] Manual test scenario 3 (signature only) ✅
- [ ] Manual test scenario 4 (no URLs) ✅
- [ ] Manual test scenario 5 (relative URLs) ⚠️
- [ ] Manual test scenario 6 (invalid URLs) ⚠️
- [ ] Manual test scenario 7 (verification QR) ✅
- [ ] Manual test scenario 8 (legacy receipt) ✅
- [ ] Manual test scenario 9 (Supabase URLs) ✅
- [ ] Manual test scenario 10 (private URLs) ⚠️
- [ ] Manual test scenario 11 (valid verification) ✅
- [ ] Manual test scenario 12 (invalid verification) ✅
- [ ] Manual test scenario 13 (rate limiting) ✅
- [ ] Manual test scenario 14 (QR scanning) ✅
- [ ] Manual test scenario 15 (concurrent) ✅
- [ ] Manual test scenario 16 (large images) ⚠️

## Known Issues

None identified during automated testing.

## Recommendations

1. **Image Optimization**: Recommend max 500KB per image for optimal PDF generation speed
2. **HTTPS Only**: Enforce HTTPS URLs in production (add validation in admin UI)
3. **Image Dimensions**: Recommend specific dimensions in admin UI help text
4. **Caching**: Consider caching generated PDFs with stamps/signatures
5. **Monitoring**: Add metrics for PDF generation time with images

## Next Steps

After completing manual testing:
1. Document any issues found
2. Update test cases if needed
3. Mark task 30.4 as complete
4. Proceed to deployment testing
