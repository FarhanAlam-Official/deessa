# Receipt Token Migration Guide

## Overview

This guide outlines the migration from legacy receipt number-based access to secure token-based authentication for receipt downloads.

## Background

**Previous Implementation (Legacy):**
- Receipt downloads used sequential receipt numbers in URLs: `/api/receipts/download?id=RCP-2024-001`
- No authentication required - anyone with a receipt number could access any receipt
- Security risk: Sequential numbers allow enumeration attacks to access all receipts

**New Implementation (Token-Based):**
- Receipt downloads require signed JWT tokens: `/api/receipts/download?token=eyJhbGc...`
- Tokens are time-limited (30 days default) and cryptographically signed
- Tokens bind donation ID to receipt number, preventing unauthorized access
- Tokens cannot be guessed or enumerated

## Migration Timeline

### Phase 1: Dual Support (Current)
**Duration:** 90 days from deployment
**Status:** Active

- Both token-based and legacy receipt number access are supported
- Legacy access requires `LEGACY_RECEIPT_ACCESS=true` environment variable
- All new receipt emails include token-based URLs
- Legacy URLs continue to work for existing receipts

**Action Items:**
1. Deploy new code with `LEGACY_RECEIPT_ACCESS=true`
2. Generate `RECEIPT_TOKEN_SECRET` and add to environment:
   ```bash
   openssl rand -base64 32
   ```
3. Monitor logs for legacy access usage
4. Communicate migration to stakeholders

### Phase 2: Deprecation Warning (Days 60-90)
**Duration:** 30 days
**Status:** Pending

- Add deprecation warnings to legacy access logs
- Send notification emails to users who accessed receipts via legacy URLs
- Update documentation to reflect token-based access as the standard

**Action Items:**
1. Review legacy access logs
2. Identify users still using old URLs
3. Send migration notification emails
4. Update any internal tools/scripts using legacy URLs

### Phase 3: Legacy Removal (Day 90+)
**Duration:** Permanent
**Status:** Pending

- Set `LEGACY_RECEIPT_ACCESS=false` in all environments
- Remove legacy access code path from download endpoint
- All receipt access requires valid tokens

**Action Items:**
1. Set `LEGACY_RECEIPT_ACCESS=false` in production
2. Monitor for any access errors
3. Remove legacy code in next major version
4. Update documentation to remove legacy references

## Implementation Details

### Token Generation

Tokens are generated using the `jose` library with HS256 algorithm:

```typescript
import { generateReceiptToken } from "@/lib/receipts/token"

const token = await generateReceiptToken(donationId, receiptNumber)
// Returns: eyJhbGciOiJIUzI1NiJ9.eyJkb25hdGlvbklkIjoiYWJjLTEyMyIsInJlY2VpcHROdW1iZXIiOiJSQ1AtMjAyNC0wMDEiLCJpYXQiOjE3MDk1NjgwMDAsImV4cCI6MTcxMjE2MDAwMCwic3ViIjoiYWJjLTEyMyJ9.signature
```

### Token Verification

Tokens are verified on each download request:

```typescript
import { verifyReceiptToken } from "@/lib/receipts/token"

try {
  const { donationId, receiptNumber } = await verifyReceiptToken(token)
  // Token is valid, proceed with download
} catch (error) {
  // Token is invalid or expired
  return NextResponse.json({ error: error.message }, { status: 401 })
}
```

### URL Generation

Receipt URLs are generated with embedded tokens:

```typescript
import { generateReceiptDownloadUrl } from "@/lib/receipts/token"

const receiptUrl = await generateReceiptDownloadUrl(donationId, receiptNumber)
// Returns: https://example.com/api/receipts/download?token=eyJhbGc...
```

## Environment Variables

### Required

```bash
# Receipt Token Secret (for JWT signing)
# Generate with: openssl rand -base64 32
RECEIPT_TOKEN_SECRET=your-strong-random-secret-here
```

### Optional (Migration Only)

```bash
# Legacy Receipt Access (deprecated)
# Set to "true" to allow old receipt URLs during migration
# Set to "false" to enforce token-based authentication
# Default: false
LEGACY_RECEIPT_ACCESS=true
```

## Security Considerations

### Token Security

- Tokens are signed with HS256 using `RECEIPT_TOKEN_SECRET`
- Secret must be at least 32 bytes (256 bits) for security
- Secret should be generated using cryptographically secure random generator
- Secret must be kept confidential and never committed to version control

### Token Expiry

- Default expiry: 30 days from generation
- Expiry can be customized per token if needed
- Expired tokens are rejected with clear error message
- Users can request new receipt emails to get fresh tokens

### Token Binding

- Tokens bind donation ID to receipt number
- Verification checks both fields match database records
- Prevents token reuse for different donations
- Prevents tampering with receipt numbers

## Monitoring

### Metrics to Track

1. **Legacy Access Usage**
   - Count of requests using `?id=` parameter
   - Identify users/IPs still using legacy URLs
   - Track decline over migration period

2. **Token Verification Failures**
   - Count of invalid token attempts
   - Count of expired token attempts
   - Identify potential security issues

3. **Receipt Access Patterns**
   - Total downloads per day
   - Peak access times
   - Most accessed receipts

### Log Examples

**Legacy Access (Warning):**
```
[WARN] Legacy receipt access used for receipt RCP-2024-001. 
This method is deprecated and will be removed in a future version.
```

**Token Verification Failure:**
```
[ERROR] Token verification failed: Receipt token has expired
```

## Troubleshooting

### Issue: "Token is required for receipt access"

**Cause:** User is trying to access receipt without token and legacy access is disabled

**Solution:**
1. Check if `LEGACY_RECEIPT_ACCESS=true` is needed during migration
2. Resend receipt email to get new token-based URL
3. Use admin interface to generate new token

### Issue: "Receipt token has expired"

**Cause:** Token is older than 30 days

**Solution:**
1. Resend receipt email to get fresh token
2. Use admin interface to generate new token
3. Consider extending token expiry if needed

### Issue: "Invalid receipt token"

**Cause:** Token signature verification failed

**Solution:**
1. Verify `RECEIPT_TOKEN_SECRET` is set correctly
2. Ensure secret hasn't changed since token generation
3. Check for URL encoding issues in token parameter

### Issue: "Receipt not found or token mismatch"

**Cause:** Token is valid but doesn't match database records

**Solution:**
1. Verify donation ID exists in database
2. Check receipt number matches donation record
3. Investigate potential data corruption

## Rollback Plan

If critical issues arise during migration:

1. **Immediate:** Set `LEGACY_RECEIPT_ACCESS=true` in production
2. **Short-term:** Investigate and fix token generation/verification issues
3. **Long-term:** Extend migration timeline if needed

## Testing

### Manual Testing

1. **Token-based access:**
   ```bash
   # Generate token for test donation
   curl https://example.com/api/receipts/download?token=eyJhbGc...
   ```

2. **Legacy access (with flag enabled):**
   ```bash
   curl https://example.com/api/receipts/download?id=RCP-2024-001
   ```

3. **Legacy access (with flag disabled):**
   ```bash
   # Should return 401 Unauthorized
   curl https://example.com/api/receipts/download?id=RCP-2024-001
   ```

### Automated Testing

See test files:
- `lib/receipts/__tests__/token.test.ts` - Token generation/verification
- `app/api/receipts/download/__tests__/route.test.ts` - Endpoint integration

## Support

For questions or issues during migration:
- Review this guide
- Check application logs
- Contact development team
- Escalate security concerns immediately

## References

- Requirements: 1.3, 10.1, 10.2, 15.3
- Design Document: Payment Architecture V2
- Implementation: Task 14 - Receipt Access Control
