# V1 Code Cleanup Guide - Payment Architecture V2

## Overview

This guide provides instructions for removing V1 payment code and feature flags after V2 has been successfully running in production for an extended period.

## Prerequisites

⚠️ **DO NOT proceed unless ALL of the following are true:**

- ✅ V2 enabled at 100% for at least 7 days
- ✅ No critical issues in V2
- ✅ All metrics meeting targets
- ✅ Team consensus to remove V1
- ✅ Backup plan prepared
- ✅ Rollback strategy documented

## Cleanup Phases

### Phase 1: Remove Feature Flags (Low Risk)
- Remove `PAYMENT_V2_ENABLED` environment variable
- Remove feature flag checks in code
- Deploy and verify

### Phase 2: Remove V1 Code (Medium Risk)
- Remove V1 webhook handlers
- Remove V1 helper functions
- Remove V1 imports
- Deploy and verify

### Phase 3: Database Cleanup (High Risk - Optional)
- Drop deprecated columns
- Remove unused indexes
- Optimize schema

## Phase 1: Remove Feature Flags

### Step 1.1: Identify Feature Flag Usage

Search for all occurrences of `PAYMENT_V2_ENABLED`:

```bash
# PowerShell
Get-ChildItem -Recurse -Include *.ts,*.tsx,*.js,*.jsx | Select-String "PAYMENT_V2_ENABLED"

# Bash
grep -r "PAYMENT_V2_ENABLED" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx"
```

Expected locations:
- Webhook handlers
- Configuration files
- Environment variable files

### Step 1.2: Remove Feature Flag Checks

**Before:**
```typescript
// app/api/webhooks/stripe/route.ts
export async function POST(request: Request) {
  const useV2 = process.env.PAYMENT_V2_ENABLED === 'true'
  
  if (useV2) {
    return await handleStripeWebhookV2(request)
  } else {
    return await handleStripeWebhookV1(request)
  }
}
```

**After:**
```typescript
// app/api/webhooks/stripe/route.ts
export async function POST(request: Request) {
  return await handleStripeWebhookV2(request)
}
```

### Step 1.3: Remove Environment Variable

```bash
# Remove from Vercel
vercel env rm PAYMENT_V2_ENABLED production

# Remove from .env.example
# Edit .env.example and remove PAYMENT_V2_ENABLED line
```

### Step 1.4: Update Documentation

- [ ] Remove feature flag from deployment guides
- [ ] Update README
- [ ] Update environment variable documentation

### Step 1.5: Deploy and Verify

```bash
# Build and test
npm run build
npm test -- --run

# Deploy to staging first
vercel --env=preview

# Verify staging
# ... run smoke tests ...

# Deploy to production
vercel --prod

# Verify production
curl https://production-url/api/health
```

## Phase 2: Remove V1 Code

### Step 2.1: Identify V1 Code

Files likely containing V1 code:
- `app/api/webhooks/stripe/route.ts`
- `app/api/webhooks/khalti/route.ts` (if exists)
- `app/api/payments/esewa/success/route.ts`
- `app/api/payments/esewa/failure/route.ts`
- `app/api/payments/khalti/verify/route.ts`
- Any files with `V1` or `Legacy` in the name

### Step 2.2: Remove V1 Webhook Handlers

**Stripe Webhook:**

```typescript
// app/api/webhooks/stripe/route.ts

// REMOVE THIS:
async function handleStripeWebhookV1(request: Request) {
  // ... old V1 logic ...
}

// KEEP THIS:
async function handleStripeWebhookV2(request: Request) {
  // ... V2 logic using PaymentService ...
}

// Update main handler:
export async function POST(request: Request) {
  // Remove V1 fallback
  return await handleStripeWebhookV2(request)
}
```

**Khalti Verify Endpoint:**

```typescript
// app/api/payments/khalti/verify/route.ts

// REMOVE: Old inline donation update logic
// KEEP: PaymentService.confirmDonation() calls
```

**eSewa Callbacks:**

```typescript
// app/api/payments/esewa/success/route.ts

// REMOVE: Old inline donation update logic
// KEEP: PaymentService.confirmDonation() calls
```

### Step 2.3: Remove V1 Helper Functions

Search for and remove:
- `updateDonationStatusV1()`
- `generateReceiptInline()`
- `sendEmailInline()`
- Any functions marked as "legacy" or "deprecated"

### Step 2.4: Remove V1 Imports

```typescript
// Remove unused imports
// Before:
import { handleV1, handleV2 } from './handlers'

// After:
import { handleV2 } from './handlers'
```

### Step 2.5: Update Tests

Remove V1-specific tests:
- `__tests__/payments/v1-webhook.test.ts` (if exists)
- V1 test cases in integration tests

Update remaining tests to only test V2 flow.

### Step 2.6: Deploy and Verify

```bash
# Build and test
npm run build
npm test -- --run

# Deploy to staging
vercel --env=preview

# Run comprehensive tests in staging
# ... smoke tests ...
# ... integration tests ...

# Deploy to production
vercel --prod

# Monitor closely for first 24 hours
```

## Phase 3: Database Cleanup (Optional)

⚠️ **HIGH RISK: Only proceed if absolutely necessary**

### Step 3.1: Identify Deprecated Columns

Columns that may be deprecated:
- None currently - V2 uses same donation columns as V1

**Note:** V2 was designed to be backward compatible, so there are likely no deprecated columns to remove.

### Step 3.2: Backup Database

```bash
# CRITICAL: Backup before any schema changes
# Use Supabase dashboard or pg_dump
```

### Step 3.3: Drop Deprecated Columns (If Any)

```sql
-- Example (only if columns are truly unused)
-- ALTER TABLE donations DROP COLUMN IF EXISTS old_column_name;

-- Verify no application code references the column first!
```

### Step 3.4: Remove Unused Indexes (If Any)

```sql
-- Check for unused indexes
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0
AND indexname NOT LIKE 'pg_%';

-- Drop unused indexes (carefully!)
-- DROP INDEX IF EXISTS unused_index_name;
```

## Verification Checklist

After each phase:

### Code Verification
- [ ] No references to `PAYMENT_V2_ENABLED`
- [ ] No V1 function calls
- [ ] No V1 imports
- [ ] All tests passing
- [ ] No build warnings

### Deployment Verification
- [ ] Staging deployment successful
- [ ] Staging smoke tests passed
- [ ] Production deployment successful
- [ ] Production health check passed

### Runtime Verification
- [ ] No errors in logs
- [ ] Webhooks processing correctly
- [ ] Donations confirming
- [ ] Receipts generating
- [ ] Emails sending

### Database Verification
```sql
-- No stuck donations
SELECT COUNT(*) FROM donations 
WHERE payment_status = 'PENDING' 
AND created_at < NOW() - INTERVAL '1 hour';
-- Expected: 0

-- Recent donations successful
SELECT payment_status, COUNT(*) 
FROM donations 
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY payment_status;
-- Expected: Mostly CONFIRMED

-- No recent failures
SELECT COUNT(*) FROM receipt_failures 
WHERE created_at > NOW() - INTERVAL '24 hours';
-- Expected: 0 or very low

SELECT COUNT(*) FROM email_failures 
WHERE created_at > NOW() - INTERVAL '24 hours';
-- Expected: 0 or very low
```

## Rollback Procedure

If issues are discovered after V1 removal:

### Immediate Rollback

1. **Revert code changes:**
   ```bash
   git revert [commit-hash]
   git push origin main
   ```

2. **Redeploy:**
   ```bash
   vercel --prod
   ```

3. **Verify:**
   - Check health endpoint
   - Verify webhooks processing
   - Monitor error rates

### Database Rollback

If database changes were made:

1. **Restore from backup:**
   - Use Supabase dashboard
   - Or restore from pg_dump

2. **Verify restoration:**
   - Check all tables exist
   - Check all columns exist
   - Run test queries

## Cleanup Checklist

### Pre-Cleanup
- [ ] V2 stable for 7+ days
- [ ] All metrics meeting targets
- [ ] Team approval obtained
- [ ] Backup created
- [ ] Rollback plan documented

### Phase 1: Feature Flags
- [ ] Feature flag usage identified
- [ ] Feature flag checks removed
- [ ] Environment variable removed
- [ ] Documentation updated
- [ ] Deployed to staging
- [ ] Deployed to production
- [ ] Verified working

### Phase 2: V1 Code
- [ ] V1 code identified
- [ ] V1 handlers removed
- [ ] V1 helpers removed
- [ ] V1 imports removed
- [ ] Tests updated
- [ ] Deployed to staging
- [ ] Deployed to production
- [ ] Verified working

### Phase 3: Database (Optional)
- [ ] Deprecated columns identified
- [ ] Database backed up
- [ ] Columns dropped (if any)
- [ ] Indexes removed (if any)
- [ ] Verified working

### Post-Cleanup
- [ ] All tests passing
- [ ] No errors in logs
- [ ] Metrics stable
- [ ] Documentation updated
- [ ] Team notified

## Timeline

**Recommended Timeline:**

- **Week 1:** V2 at 100%, monitor closely
- **Week 2:** Continue monitoring, prepare cleanup plan
- **Week 3:** Execute Phase 1 (feature flags)
- **Week 4:** Monitor Phase 1, execute Phase 2 (V1 code)
- **Week 5:** Monitor Phase 2, consider Phase 3 (database)

**Minimum Timeline:**

- V2 stable for 7 days minimum before starting cleanup
- 3-5 days between each phase
- 7 days monitoring after final phase

## Success Criteria

V1 cleanup is considered successful if:

- [ ] All V1 code removed
- [ ] All feature flags removed
- [ ] All tests passing
- [ ] No errors in production
- [ ] Metrics stable for 7 days post-cleanup
- [ ] Team consensus

## Documentation Updates

After cleanup, update:

- [ ] README.md
- [ ] Architecture diagrams
- [ ] API documentation
- [ ] Deployment guides
- [ ] Runbooks
- [ ] Environment variable documentation

## Celebration! 🎉

Once V1 cleanup is complete:

- [ ] Announce to team
- [ ] Document lessons learned
- [ ] Update project status
- [ ] Plan next improvements
- [ ] Celebrate the successful migration!

---

**Last Updated:** 2024-01-01
**Version:** 2.0.0
