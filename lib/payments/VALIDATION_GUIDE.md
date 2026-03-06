# Payment Configuration Validation Guide

This guide explains how to use the payment configuration validation system to ensure your application is properly configured before processing transactions.

## Overview

The validation system checks:
- ✅ Required environment variables are set
- ✅ Payment mode is correctly configured for the environment
- ✅ Database schema and required tables exist
- ✅ Provider credentials are valid (non-blocking)

## Usage

### Option 1: Health Check Endpoint (Recommended)

The easiest way to check system health is via the health check endpoint:

```bash
curl http://localhost:3000/api/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2024-03-02T10:30:00.000Z",
  "checks": {
    "database": {
      "status": "pass",
      "message": "Database connection successful",
      "responseTime": 45
    },
    "paymentConfig": {
      "status": "pass",
      "message": "Payment configuration valid",
      "responseTime": 120
    },
    "providers": {
      "status": "pass",
      "message": "Stripe: available; Khalti: available",
      "responseTime": 230
    }
  },
  "responseTime": "395ms"
}
```

### Option 2: Programmatic Validation

You can call the validation function directly in your code:

```typescript
import { validatePaymentConfiguration, validateOrThrow } from '@/lib/payments/validation'

// Option A: Get detailed validation results
const result = await validatePaymentConfiguration()

if (!result.valid) {
  console.error('Validation failed:', result.errors)
  // Handle errors appropriately
}

if (result.warnings.length > 0) {
  console.warn('Validation warnings:', result.warnings)
}

// Option B: Fail fast on critical errors
try {
  await validateOrThrow()
  console.log('✅ Payment system ready')
} catch (error) {
  console.error('❌ Payment system not ready:', error.message)
  process.exit(1)
}
```

### Option 3: Startup Script

Create a startup validation script:

```typescript
// scripts/validate-config.ts
import { validateOrThrow } from '@/lib/payments/validation'

async function main() {
  console.log('Validating payment configuration...')
  
  try {
    await validateOrThrow()
    console.log('✅ All checks passed')
    process.exit(0)
  } catch (error) {
    console.error('❌ Validation failed:', error.message)
    process.exit(1)
  }
}

main()
```

Run before deployment:
```bash
npm run validate-config
```

## Validation Checks

### 1. Environment Variables

**Critical Variables:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SITE_URL`
- `PAYMENT_MODE` (must be "live" or "mock")

**Provider Variables (in live mode):**
- Stripe: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- Khalti: `KHALTI_SECRET_KEY`, `KHALTI_BASE_URL`
- eSewa: `ESEWA_MERCHANT_ID`, `ESEWA_SECRET_KEY`, `ESEWA_BASE_URL`

**Security Variables:**
- `RECEIPT_TOKEN_SECRET` (required for secure receipt access)

### 2. Payment Mode Validation

**Critical Rule:** `PAYMENT_MODE` must be `"live"` in production.

This prevents mock mode from being accidentally enabled in production, which would:
- Skip signature verification
- Allow unauthorized payment confirmations
- Create security vulnerabilities

### 3. Database Schema

**Required Tables:**
- `payment_events` - Critical for idempotency
- `donations` - Core donation records

**Optional Tables:**
- `receipts` - For receipt storage
- `payment_jobs` - For job queue (MVP uses inline processing)

### 4. Provider Credentials

**Non-blocking validation** that checks:
- Stripe: API key validity via balance retrieval
- Khalti: Configuration presence and URL format
- eSewa: Configuration presence and URL format

These checks return warnings instead of errors to avoid blocking startup if provider APIs are temporarily unavailable.

## Error Codes

### Critical Errors (Block Startup)

- `MISSING_ENV_VAR` - Required environment variable not set
- `MISSING_PAYMENT_MODE` - PAYMENT_MODE not configured
- `INVALID_PAYMENT_MODE` - PAYMENT_MODE has invalid value
- `MOCK_MODE_IN_PRODUCTION` - Mock mode enabled in production
- `PAYMENT_EVENTS_TABLE_MISSING` - payment_events table not found
- `DONATIONS_TABLE_MISSING` - donations table not found
- `DB_CONNECTION_FAILED` - Cannot connect to database

### Non-Critical Errors

- `MISSING_STRIPE_WEBHOOK_SECRET` - Webhooks won't work but checkout will
- `MISSING_KHALTI_BASE_URL` - Khalti not fully configured
- `MISSING_ESEWA_SECRET_KEY` - eSewa not fully configured
- `MISSING_RECEIPT_TOKEN_SECRET` - Receipt security compromised

### Warnings

- `MOCK_MODE_ACTIVE` - Running in mock mode (expected in dev)
- `STRIPE_VALIDATION_FAILED` - Stripe API check failed
- `KHALTI_VALIDATION_FAILED` - Khalti API check failed
- `ESEWA_VALIDATION_FAILED` - eSewa config check failed
- `EMAIL_NOT_CONFIGURED` - Email sending disabled

## Integration Examples

### Next.js Middleware

```typescript
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

let validationChecked = false
let validationPassed = false

export async function middleware(request: NextRequest) {
  // Only validate once on startup
  if (!validationChecked) {
    validationChecked = true
    
    try {
      const { validatePaymentConfiguration } = await import('@/lib/payments/validation')
      const result = await validatePaymentConfiguration()
      
      const criticalErrors = result.errors.filter(e => e.severity === 'critical')
      validationPassed = criticalErrors.length === 0
      
      if (!validationPassed) {
        console.error('❌ Payment configuration validation failed')
      }
    } catch (error) {
      console.error('❌ Validation check failed:', error)
      validationPassed = false
    }
  }
  
  // Block payment routes if validation failed
  if (!validationPassed && request.nextUrl.pathname.startsWith('/api/payments')) {
    return NextResponse.json(
      { error: 'Payment system not configured' },
      { status: 503 }
    )
  }
  
  return NextResponse.next()
}
```

### Docker Health Check

```dockerfile
# Dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1
```

### Kubernetes Readiness Probe

```yaml
# deployment.yaml
readinessProbe:
  httpGet:
    path: /api/health
    port: 3000
  initialDelaySeconds: 10
  periodSeconds: 10
  failureThreshold: 3
```

## Troubleshooting

### "PAYMENT_EVENTS_TABLE_MISSING" Error

Run the database migrations:
```bash
# Run all migrations in order
psql -d your_database -f scripts/001-create-tables.sql
psql -d your_database -f scripts/023-enhance-payment-events.sql
```

### "MOCK_MODE_IN_PRODUCTION" Error

Update your production environment variables:
```bash
# In production environment
PAYMENT_MODE=live
```

### "STRIPE_VALIDATION_FAILED" Warning

Check your Stripe API key:
```bash
# Test Stripe key manually
curl https://api.stripe.com/v1/balance \
  -u sk_test_your_key:
```

### Provider Validation Timeouts

Provider validation has a 5-second timeout. If checks consistently fail:
1. Check network connectivity to provider APIs
2. Verify API keys are correct
3. Check if provider APIs are experiencing downtime

## Best Practices

1. **Run validation in CI/CD pipeline** before deployment
2. **Monitor health endpoint** with uptime monitoring service
3. **Set up alerts** for health check failures
4. **Test in staging** with production-like configuration
5. **Document** any expected warnings in your deployment notes

## Related Documentation

- [Payment Architecture V2 Design](../../.kiro/specs/payment-architecture-v2/design.md)
- [Requirements Document](../../.kiro/specs/payment-architecture-v2/requirements.md)
- [Environment Variables Guide](../../docs/ENVIRONMENT_VARIABLES.md)
