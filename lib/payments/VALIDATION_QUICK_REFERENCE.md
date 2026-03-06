# Payment Configuration Validation - Quick Reference

## 🚀 Quick Start

### Check System Health
```bash
curl http://localhost:3000/api/health
```

### Run Validation Script
```bash
npm run validate-config
```

### Programmatic Check
```typescript
import { validateOrThrow } from '@/lib/payments/validation'
await validateOrThrow()
```

## 📋 Required Environment Variables

### Core (Always Required)
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_SITE_URL=https://your-site.com
PAYMENT_MODE=live  # or "mock" for development
```

### Stripe (If Using Stripe)
```bash
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Khalti (If Using Khalti)
```bash
KHALTI_SECRET_KEY=your_secret_key
KHALTI_BASE_URL=https://khalti.com/api/v2
```

### eSewa (If Using eSewa)
```bash
ESEWA_MERCHANT_ID=your_merchant_id
ESEWA_SECRET_KEY=your_secret_key
ESEWA_BASE_URL=https://esewa.com.np
```

### Security
```bash
RECEIPT_TOKEN_SECRET=your_random_secret  # Generate: openssl rand -base64 32
```

### Email (Optional)
```bash
GOOGLE_EMAIL=your-email@gmail.com
GOOGLE_APP_PASSWORD=your_app_password
```

## 🔍 Health Check Response

### Healthy System (200)
```json
{
  "status": "healthy",
  "checks": {
    "database": { "status": "pass" },
    "paymentConfig": { "status": "pass" },
    "providers": { "status": "pass" }
  }
}
```

### Unhealthy System (503)
```json
{
  "status": "unhealthy",
  "checks": {
    "database": { "status": "fail", "message": "Connection failed" }
  }
}
```

## ⚠️ Common Errors

### MOCK_MODE_IN_PRODUCTION
**Problem**: Mock mode enabled in production
**Fix**: Set `PAYMENT_MODE=live` in production environment

### PAYMENT_EVENTS_TABLE_MISSING
**Problem**: Required database table missing
**Fix**: Run database migrations
```bash
psql -d your_db -f scripts/023-enhance-payment-events.sql
```

### MISSING_STRIPE_WEBHOOK_SECRET
**Problem**: Stripe webhooks won't work
**Fix**: Add `STRIPE_WEBHOOK_SECRET` from Stripe dashboard

### STRIPE_VALIDATION_FAILED
**Problem**: Cannot connect to Stripe API
**Fix**: 
1. Check API key is correct
2. Verify network connectivity
3. Check Stripe API status

## 🔧 Integration Examples

### CI/CD Pipeline
```yaml
- name: Validate Config
  run: npm run validate-config
```

### Docker Health Check
```dockerfile
HEALTHCHECK CMD curl -f http://localhost:3000/api/health || exit 1
```

### Kubernetes Probe
```yaml
readinessProbe:
  httpGet:
    path: /api/health
    port: 3000
```

### Next.js Middleware
```typescript
import { validatePaymentConfiguration } from '@/lib/payments/validation'

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api/payments')) {
    const result = await validatePaymentConfiguration()
    if (!result.valid) {
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
    }
  }
  return NextResponse.next()
}
```

## 📊 Exit Codes (CLI Script)

- `0` - All checks passed ✅
- `1` - Critical errors found ❌
- `2` - Warnings found ⚠️

## 🔗 Related Files

- `lib/payments/validation.ts` - Core validation logic
- `app/api/health/route.ts` - Health check endpoint
- `scripts/validate-payment-config.ts` - CLI script
- `lib/payments/VALIDATION_GUIDE.md` - Full documentation

## 📞 Support

For detailed documentation, see:
- [Validation Guide](./VALIDATION_GUIDE.md)
- [Implementation Summary](./CONFIGURATION_VALIDATION_SUMMARY.md)
- [Design Document](../../.kiro/specs/payment-architecture-v2/design.md)
