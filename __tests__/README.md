# Test Suite Documentation

This directory contains the comprehensive test suite for the Payment Architecture V2 implementation.

## Directory Structure

```
__tests__/
├── payments/
│   ├── core/
│   │   └── PaymentService.test.ts       # Core payment confirmation engine tests
│   ├── adapters/
│   │   ├── StripeAdapter.test.ts        # Stripe provider adapter tests
│   │   ├── KhaltiAdapter.test.ts        # Khalti provider adapter tests
│   │   └── EsewaAdapter.test.ts         # eSewa provider adapter tests
│   └── workers/
│       └── post-payment.test.ts         # Post-payment processing tests
├── integration/
│   ├── payment-flows.test.ts            # End-to-end payment flow tests
│   ├── amount-mismatch.test.ts          # Amount mismatch scenario tests
│   └── concurrency.test.ts              # Concurrency and race condition tests
├── security/
│   ├── signature-verification.test.ts   # Signature and HMAC verification tests
│   └── authentication.test.ts           # Authentication and authorization tests
├── setup.ts                              # Global test configuration
├── README.md                             # This file
├── IMPLEMENTATION_SUMMARY.md             # Implementation details
└── QUICK_START.md                        # Quick reference guide
```

## Test Categories

### 1. PaymentService Tests (`payments/core/PaymentService.test.ts`)

Tests the core payment confirmation engine with focus on:
- **Success Path**: Valid payment confirmation flow
- **Amount Mismatch**: Fail-closed behavior → REVIEW status
- **Currency Mismatch**: Fail-closed behavior → REVIEW status
- **Idempotency**: Duplicate event handling
- **Transaction Rollback**: Error handling and atomicity
- **State Validation**: State machine enforcement
- **Race Conditions**: Concurrent confirmation attempts

### 2. Provider Adapter Tests (`payments/adapters/*.test.ts`)

Tests provider-specific verification and normalization:

#### StripeAdapter
- Webhook signature verification (valid/invalid)
- Payload normalization (checkout sessions, invoices)
- Amount conversion (minor → major units)
- Error handling (missing credentials, API errors)
- Transaction lookup for reconciliation

#### KhaltiAdapter
- Server-side transaction lookup via API
- Status mapping (Completed, Pending, Expired, etc.)
- Amount conversion (paisa → NPR)
- Error handling (API timeout, invalid response)
- Mock mode bypass for development

#### EsewaAdapter
- HMAC-SHA256 signature verification
- Base64 payload decoding
- Server-side transaction status lookup
- Timing-safe signature comparison
- Error handling (invalid signature, API errors)

### 3. Post-Payment Processing Tests (`payments/workers/post-payment.test.ts`)

Tests inline receipt generation and email sending:
- **Receipt Generation**: Atomic number generation, HTML storage
- **Email Sending**: SMTP integration, error handling
- **Error Tracking**: Failure logging, audit trail
- **Idempotency**: Duplicate prevention
- **Fire-and-Forget**: Non-blocking behavior

### 4. Integration Tests (`integration/*.test.ts`)

Tests complete end-to-end flows and system behavior:

#### Payment Flows (`payment-flows.test.ts`)
- Complete Stripe payment flow (webhook → confirmation → receipt → email)
- Complete Khalti payment flow (verification → confirmation → receipt → email)
- Complete eSewa payment flow (callback → confirmation → receipt → email)
- Cross-provider consistency
- Receipt generation integration
- Email sending integration

#### Amount Mismatch (`amount-mismatch.test.ts`)
- Amount mismatch detection for all providers
- Currency mismatch detection
- REVIEW status workflow
- Admin alert integration
- Manual review workflow
- Floating point precision handling
- Audit trail logging

#### Concurrency (`concurrency.test.ts`)
- 100+ concurrent webhook processing
- Database transaction contention
- Row-level locking verification
- Idempotency under load
- State machine integrity
- Receipt generation concurrency
- Performance under load
- Stress testing

### 5. Security Tests (`security/*.test.ts`)

Tests security-critical functionality and attack prevention:

#### Signature Verification (`signature-verification.test.ts`)
- Stripe webhook signature verification (valid/invalid)
- eSewa HMAC-SHA256 verification (valid/invalid)
- Khalti API authentication
- Mock mode prevention in production
- Timing attack prevention (constant-time comparison)
- Replay attack prevention (idempotency)
- Credential validation
- Input validation (SQL injection, XSS)

#### Authentication (`authentication.test.ts`)
- Receipt download token authentication
- Receipt resend authentication
- Admin interface authentication and authorization
- Rate limiting enforcement (10 req/min)
- Token validation (signature, expiry, tampering)
- Session management (secure cookies, expiry)
- CSRF protection
- Authorization checks (resource ownership)
- Security headers (CSP, HSTS, X-Frame-Options)
- Audit logging (auth attempts, admin actions)

## Running Tests

### Prerequisites

Install test dependencies:
```bash
npm install --save-dev jest @jest/globals @types/jest ts-jest
```

### Run All Tests
```bash
npm test
```

### Run Specific Test Suite
```bash
npm test PaymentService
npm test StripeAdapter
npm test post-payment
```

### Run with Coverage
```bash
npm test -- --coverage
```

### Watch Mode (Development)
```bash
npm test -- --watch
```

## Test Configuration

Tests use Jest with TypeScript support. Configuration is in `jest.config.js` at the project root.

Key settings:
- **Test Environment**: Node.js
- **Test Match**: `**/__tests__/**/*.test.ts`
- **Transform**: ts-jest for TypeScript
- **Coverage**: Minimum 80% for core payment logic

## Writing Tests

### Test Structure

Follow the Arrange-Act-Assert pattern:

```typescript
it('should confirm donation with valid verification result', async () => {
  // Arrange: Set up test data and mocks
  const mockDonation = { id: '123', amount: 100, status: 'pending' }
  
  // Act: Execute the function under test
  const result = await paymentService.confirmDonation(input)
  
  // Assert: Verify the outcome
  expect(result.success).toBe(true)
  expect(result.status).toBe('confirmed')
})
```

### Mocking Guidelines

- Mock external dependencies (Supabase, Stripe SDK, fetch)
- Use real logic for core business rules
- Avoid over-mocking - test real behavior where possible
- Mock time-dependent functions (Date.now, setTimeout)

### Test Data

Use realistic test data that matches production scenarios:
- Valid donation IDs (UUIDs)
- Realistic amounts (avoid edge cases like 0.01)
- Real provider response formats
- Actual error messages from providers

## Coverage Goals

| Component | Target Coverage |
|-----------|----------------|
| PaymentService | 90%+ |
| Provider Adapters | 85%+ |
| Post-Payment Workers | 80%+ |
| Error Handlers | 100% |

## Continuous Integration

Tests run automatically on:
- Every commit (pre-commit hook)
- Pull requests (GitHub Actions)
- Before deployment (CI/CD pipeline)

## Troubleshooting

### Common Issues

**Tests timing out:**
- Increase Jest timeout: `jest.setTimeout(10000)`
- Check for unresolved promises
- Verify mock implementations

**Database connection errors:**
- Ensure test environment variables are set
- Use test database, not production
- Mock Supabase client for unit tests

**Flaky tests:**
- Avoid time-dependent assertions
- Use deterministic test data
- Properly clean up after each test

## Contributing

When adding new features:
1. Write tests first (TDD approach)
2. Ensure all tests pass
3. Maintain coverage above thresholds
4. Update this README if adding new test categories

## References

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Best Practices](https://testingjavascript.com/)
- [Payment Architecture V2 Design](../.kiro/specs/payment-architecture-v2/design.md)
- [Requirements Document](../.kiro/specs/payment-architecture-v2/requirements.md)
