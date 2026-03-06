# Quick Start Guide - Unit Tests

## Installation

```bash
# Install test dependencies
npm install

# Verify installation
npm test -- --version
```

## Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test PaymentService
npm test StripeAdapter
npm test KhaltiAdapter
npm test EsewaAdapter
npm test post-payment

# Run with coverage
npm test:coverage

# Watch mode (auto-rerun on changes)
npm test:watch
```

## Test Structure Overview

```
__tests__/
├── payments/
│   ├── core/
│   │   └── PaymentService.test.ts       # Core payment logic
│   ├── adapters/
│   │   ├── StripeAdapter.test.ts        # Stripe integration
│   │   ├── KhaltiAdapter.test.ts        # Khalti integration
│   │   └── EsewaAdapter.test.ts         # eSewa integration
│   └── workers/
│       └── post-payment.test.ts         # Receipt & email
├── setup.ts                              # Test configuration
├── README.md                             # Full documentation
├── IMPLEMENTATION_SUMMARY.md             # Implementation details
└── QUICK_START.md                        # This file
```

## What's Tested

### ✅ PaymentService (Core Engine)
- Payment confirmation flow
- Amount/currency mismatch handling
- Idempotency (duplicate events)
- Transaction rollback
- State machine validation
- Race condition handling

### ✅ Provider Adapters
- **Stripe:** Webhook signature, payload normalization, amount conversion
- **Khalti:** API lookup, status mapping, paisa→NPR conversion
- **eSewa:** HMAC signature, base64 decoding, transaction lookup

### ✅ Post-Payment Processing
- Receipt generation (atomic number, HTML storage)
- Email sending (SMTP, error handling)
- Error tracking (failure logging)
- Idempotency (duplicate prevention)

## Test Status

All test files are created with comprehensive test skeletons. Each test currently has a placeholder implementation (`expect(true).toBe(true)`) that can be replaced with actual test logic.

## Next Steps

1. **Run tests to verify setup:**
   ```bash
   npm test
   ```

2. **Implement test logic incrementally:**
   - Replace placeholder assertions with real test code
   - Add mocks for external dependencies (Supabase, Stripe, etc.)
   - Use test helpers from `setup.ts`

3. **Check coverage:**
   ```bash
   npm test:coverage
   ```

## Test Helpers

Available in `__tests__/setup.ts`:

```typescript
// Mock Supabase client
const supabase = createMockSupabaseClient()

// Mock verification result
const verificationResult = createMockVerificationResult({
  amount: 100,
  currency: 'USD',
})

// Mock donation
const donation = createMockDonation({
  payment_status: 'pending',
})
```

## Custom Matchers

```typescript
// Check if string is valid UUID
expect(donationId).toBeValidUUID()

// Check if string is valid receipt number (RCP-YYYY-NNNN)
expect(receiptNumber).toBeValidReceiptNumber()
```

## Environment Variables

Test environment is pre-configured with mock values:
- `NODE_ENV=test`
- `PAYMENT_MODE=mock`
- All provider credentials (Stripe, Khalti, eSewa)
- Supabase URLs and keys
- Receipt token secret

## Troubleshooting

**Tests not running?**
```bash
# Check Jest is installed
npm list jest

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

**TypeScript errors?**
```bash
# Check tsconfig.json includes __tests__
# Verify ts-jest is installed
npm list ts-jest
```

**Coverage not generating?**
```bash
# Run with verbose output
npm test:coverage -- --verbose
```

## Documentation

- **Full Documentation:** `__tests__/README.md`
- **Implementation Summary:** `__tests__/IMPLEMENTATION_SUMMARY.md`
- **Jest Config:** `jest.config.js`
- **Test Setup:** `__tests__/setup.ts`

## Support

For questions or issues:
1. Check `__tests__/README.md` for detailed documentation
2. Review test file comments for specific test scenarios
3. Consult Payment Architecture V2 design docs in `.kiro/specs/`
