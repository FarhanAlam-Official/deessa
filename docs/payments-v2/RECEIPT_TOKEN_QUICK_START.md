# Receipt Token Quick Start Guide

## Setup (5 minutes)

### 1. Generate Secrets

```bash
# Generate receipt token secret
openssl rand -base64 32

# Generate API key (optional, for programmatic access)
openssl rand -hex 32
```

### 2. Add to Environment

Add to `.env.local`:

```bash
RECEIPT_TOKEN_SECRET=<output-from-step-1>
RECEIPT_RESEND_API_KEY=<output-from-step-1-optional>
LEGACY_RECEIPT_ACCESS=true  # Set to true during migration
```

### 3. Install Dependencies

```bash
pnpm install
```

That's it! The system is ready to use.

## Usage Examples

### Generate Token-Based Receipt URL

```typescript
import { generateReceiptDownloadUrl } from "@/lib/receipts/token"

// In your receipt generation code
const receiptUrl = await generateReceiptDownloadUrl(
  donationId,
  receiptNumber
)
// Returns: https://example.com/api/receipts/download?token=eyJhbGc...
```

### Verify Token (Internal Use)

```typescript
import { verifyReceiptToken } from "@/lib/receipts/token"

try {
  const { donationId, receiptNumber } = await verifyReceiptToken(token)
  // Token is valid, proceed
} catch (error) {
  // Token is invalid or expired
  console.error(error.message)
}
```

### Download Receipt (User)

**With Token (Secure):**
```
GET /api/receipts/download?token=eyJhbGc...
```

**With Receipt Number (Legacy, requires LEGACY_RECEIPT_ACCESS=true):**
```
GET /api/receipts/download?id=RCP-2024-001
```

### Resend Receipt (Admin)

**With Session:**
```bash
# User must be logged in as admin
curl -X POST https://example.com/api/receipts/resend \
  -H "Content-Type: application/json" \
  -d '{"receiptNumber": "RCP-2024-001", "email": "donor@example.com"}'
```

**With API Key:**
```bash
curl -X POST https://example.com/api/receipts/resend \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key-here" \
  -d '{"receiptNumber": "RCP-2024-001"}'
```

## Migration Path

### Week 1-8: Dual Support
- Deploy with `LEGACY_RECEIPT_ACCESS=true`
- Both old and new URLs work
- Monitor usage patterns

### Week 9-12: Deprecation Warnings
- Add warnings to logs
- Notify users still using old URLs
- Prepare for cutover

### Week 13+: Token-Only
- Set `LEGACY_RECEIPT_ACCESS=false`
- Only token-based access works
- Remove legacy code in next version

## Troubleshooting

### "Token is required for receipt access"
**Solution:** Generate token using `generateReceiptDownloadUrl()` or enable legacy access temporarily.

### "Receipt token has expired"
**Solution:** Tokens expire after 30 days. Resend receipt email to get fresh token.

### "Invalid receipt token"
**Solution:** Check `RECEIPT_TOKEN_SECRET` is set correctly and hasn't changed.

### "Rate limit exceeded"
**Solution:** Wait for rate limit window to reset (shown in error response) or contact admin.

## Security Notes

- ✅ Never commit `RECEIPT_TOKEN_SECRET` to version control
- ✅ Use strong random secrets (32+ bytes)
- ✅ Rotate secrets periodically (every 90 days recommended)
- ✅ Monitor for suspicious token verification failures
- ✅ Disable legacy access after migration complete

## API Reference

### Token Functions

```typescript
// Generate token (30-day expiry)
generateReceiptToken(donationId: string, receiptNumber: string, expiryDays?: number): Promise<string>

// Verify token
verifyReceiptToken(token: string): Promise<{ donationId: string, receiptNumber: string }>

// Generate full download URL
generateReceiptDownloadUrl(donationId: string, receiptNumber: string, baseUrl?: string): Promise<string>
```

### Endpoints

```typescript
// Download receipt
GET /api/receipts/download?token=<jwt>
GET /api/receipts/download?id=<receipt-number>  // Legacy only

// Resend receipt
POST /api/receipts/resend
Headers: x-api-key (optional)
Body: { receiptNumber: string, email?: string }
```

## Rate Limits

- **Users:** 10 resend requests per hour
- **Admins:** 100 resend requests per hour
- **API Key:** 100 requests per hour

## Support

- Full documentation: `docs/RECEIPT_ACCESS_CONTROL_IMPLEMENTATION.md`
- Migration guide: `docs/RECEIPT_TOKEN_MIGRATION.md`
- Spec: `.kiro/specs/payment-architecture-v2/tasks.md` (Task 14)
