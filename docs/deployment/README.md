# Payment Architecture V2 - Deployment Documentation

## Overview

This directory contains all documentation and guides for deploying Payment Architecture V2 to staging and production environments.

## Quick Start

### For First-Time Deployment

1. **Read the deployment summary:**
   - Start with [`DEPLOYMENT_SUMMARY.md`](./DEPLOYMENT_SUMMARY.md)

2. **Deploy to staging:**
   - Follow [`STAGING_DEPLOYMENT_CHECKLIST.md`](./STAGING_DEPLOYMENT_CHECKLIST.md)
   - Run `scripts/deploy-staging.ps1` or `.sh`

3. **Run smoke tests:**
   - Follow [`SMOKE_TEST_GUIDE.md`](./SMOKE_TEST_GUIDE.md)
   - Run `scripts/smoke-tests-staging.ps1` or `.sh`

4. **Deploy to production:**
   - Follow [`PRODUCTION_DEPLOYMENT_CHECKLIST.md`](./PRODUCTION_DEPLOYMENT_CHECKLIST.md)
   - Run `scripts/deploy-production.ps1`

5. **Enable V2 incrementally:**
   - Follow [`INCREMENTAL_ROLLOUT_GUIDE.md`](./INCREMENTAL_ROLLOUT_GUIDE.md)
   - Run `scripts/enable-v2-staging.ps1` or `.sh`

6. **Clean up V1 code:**
   - Follow [`V1_CLEANUP_GUIDE.md`](./V1_CLEANUP_GUIDE.md)

## Documentation Index

### Comprehensive Guides

- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Complete deployment reference
  - Prerequisites
  - Environment variables
  - Database migrations
  - Application deployment
  - Worker deployment
  - Verification procedures
  - Troubleshooting
  - Monitoring

### Checklists

- **[STAGING_DEPLOYMENT_CHECKLIST.md](./STAGING_DEPLOYMENT_CHECKLIST.md)**
  - Pre-deployment preparation
  - Deployment execution steps
  - Post-deployment verification
  - Monitoring plan
  - Sign-off template

- **[PRODUCTION_DEPLOYMENT_CHECKLIST.md](./PRODUCTION_DEPLOYMENT_CHECKLIST.md)**
  - Critical safety checks
  - Team coordination
  - Deployment execution
  - Rollback criteria
  - Sign-off template

### Operational Guides

- **[SMOKE_TEST_GUIDE.md](./SMOKE_TEST_GUIDE.md)**
  - Automated test procedures
  - Manual test procedures
  - Provider-specific tests
  - Database verification
  - Performance testing
  - Security testing

- **[INCREMENTAL_ROLLOUT_GUIDE.md](./INCREMENTAL_ROLLOUT_GUIDE.md)**
  - Rollout strategy
  - Implementation options
  - Monitoring procedures
  - Rollback procedures
  - Success criteria

- **[V1_CLEANUP_GUIDE.md](./V1_CLEANUP_GUIDE.md)**
  - Feature flag removal
  - V1 code removal
  - Database cleanup
  - Verification procedures

### Summary

- **[DEPLOYMENT_SUMMARY.md](./DEPLOYMENT_SUMMARY.md)**
  - Overview of all deployment artifacts
  - Quick reference commands
  - Workflow diagrams
  - Timeline summary

## Scripts

All deployment scripts are located in the `scripts/` directory:

### Staging
- `scripts/deploy-staging.ps1` - PowerShell staging deployment
- `scripts/deploy-staging.sh` - Bash staging deployment
- `scripts/smoke-tests-staging.ps1` - PowerShell smoke tests
- `scripts/smoke-tests-staging.sh` - Bash smoke tests
- `scripts/enable-v2-staging.ps1` - PowerShell V2 enablement
- `scripts/enable-v2-staging.sh` - Bash V2 enablement
- `scripts/monitor-staging.ps1` - PowerShell monitoring

### Production
- `scripts/deploy-production.ps1` - PowerShell production deployment

## Database Migrations

All migration scripts are located in `scripts/payments-v2/`:

1. `020-create-payments-table.sql`
2. `021-create-receipts-table.sql`
3. `023-enhance-payment-events.sql`
4. `024-add-indexes.sql`
5. `025-atomic-receipt-number.sql`
6. `026-create-receipt-failures-table.sql`
7. `027-create-email-failures-table.sql`

See `scripts/payments-v2/README.md` for detailed migration documentation.

## Deployment Workflow

```
┌─────────────────────────────────────────────────────────┐
│                   Staging Deployment                    │
│                                                         │
│  1. Pre-deployment checks                              │
│  2. Database migrations                                │
│  3. Application deployment                             │
│  4. Smoke tests                                        │
│  5. Enable V2                                          │
│  6. Monitor 24-48 hours                                │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                 Production Deployment                   │
│                                                         │
│  1. Pre-deployment checks                              │
│  2. Database migrations                                │
│  3. Application deployment (V2 disabled)               │
│  4. Verify V1 working                                  │
│  5. Enable V2 incrementally                            │
│  6. Monitor 7+ days                                    │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                    V1 Code Cleanup                      │
│                                                         │
│  1. Remove feature flags                               │
│  2. Remove V1 code                                     │
│  3. Database cleanup (optional)                        │
│  4. Final verification                                 │
└─────────────────────────────────────────────────────────┘
```

## Quick Commands

### Staging Deployment

```bash
# PowerShell
.\scripts\deploy-staging.ps1 -StagingUrl https://staging.vercel.app

# Bash
./scripts/deploy-staging.sh https://staging.vercel.app
```

### Smoke Tests

```bash
# PowerShell
.\scripts\smoke-tests-staging.ps1 -StagingUrl https://staging.vercel.app

# Bash
./scripts/smoke-tests-staging.sh https://staging.vercel.app
```

### Enable V2

```bash
# PowerShell
.\scripts\enable-v2-staging.ps1

# Bash
./scripts/enable-v2-staging.sh
```

### Production Deployment

```bash
# PowerShell
.\scripts\deploy-production.ps1 -ProductionUrl https://production.com
```

### Monitoring

```bash
# PowerShell
.\scripts\monitor-staging.ps1 -StagingUrl https://staging.vercel.app -Once
```

## Environment Variables

### Critical Variables

```bash
# Payment Mode (MUST be 'live' in production)
PAYMENT_MODE=live

# Feature Flag (start disabled in production)
PAYMENT_V2_ENABLED=false

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Provider Credentials (LIVE keys for production)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
KHALTI_SECRET_KEY=live_secret_key_...
ESEWA_SECRET_KEY=your-secret-key

# Security
RECEIPT_TOKEN_SECRET=your-32-character-secret
```

See `.env.example` for complete list.

## Rollback Procedures

### Application Rollback

```bash
# Vercel
vercel rollback [previous-deployment-url]
```

### Feature Flag Rollback

```bash
# Disable V2
vercel env add PAYMENT_V2_ENABLED false production
vercel --prod
```

### Database Rollback

See `scripts/payments-v2/README.md` for rollback commands.

## Monitoring

### Key Metrics

- Payment success rate (target: >99%)
- Receipt generation rate (target: >98%)
- Email send rate (target: >95%)
- Webhook response time (target: <2s)
- Confirmation latency (target: <1s)
- Error rate (target: <1%)

### Monitoring Queries

```sql
-- Recent donations
SELECT payment_status, COUNT(*) 
FROM donations 
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY payment_status;

-- Stuck donations
SELECT COUNT(*) FROM donations 
WHERE payment_status = 'PENDING' 
AND created_at < NOW() - INTERVAL '1 hour';

-- Recent failures
SELECT COUNT(*) FROM receipt_failures 
WHERE created_at > NOW() - INTERVAL '1 hour';
```

## Troubleshooting

### Common Issues

1. **Health check fails**
   - Check application logs
   - Verify database connection
   - Check environment variables

2. **Webhook signature verification fails**
   - Verify webhook secrets
   - Check PAYMENT_MODE setting
   - Review provider dashboard configuration

3. **Receipt generation fails**
   - Check receipt_failures table
   - Verify RECEIPT_TOKEN_SECRET
   - Check Supabase Storage access

4. **Email sending fails**
   - Check email_failures table
   - Verify SMTP credentials
   - Check rate limits

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed troubleshooting.

## Timeline

### Minimum Timeline

- Week 1: Staging deployment and testing
- Week 2: Production deployment (V2 disabled)
- Week 3: Enable V2, monitor
- Week 4+: Cleanup

### Recommended Timeline

- Week 1-2: Staging deployment and extended testing
- Week 3: Production deployment (V2 disabled)
- Week 4: Enable V2, intensive monitoring
- Week 5-6: Stabilization
- Week 7+: Cleanup

## Support

### Documentation

- Design: `.kiro/specs/payment-architecture-v2/design.md`
- Requirements: `.kiro/specs/payment-architecture-v2/requirements.md`
- Tasks: `.kiro/specs/payment-architecture-v2/tasks.md`

### Migration Documentation

- `scripts/payments-v2/README.md`
- `scripts/payments-v2/QUICK_START.md`
- `scripts/payments-v2/MIGRATION_ORDER.md`

## Success Criteria

### Staging Success
- ✅ All smoke tests passed
- ✅ No critical errors in 24-48 hours
- ✅ All metrics meeting targets

### Production Success
- ✅ V1 working after deployment
- ✅ V2 enabled successfully
- ✅ No critical errors in 7 days
- ✅ All metrics meeting targets

### Cleanup Success
- ✅ All V1 code removed
- ✅ All feature flags removed
- ✅ Metrics stable for 7 days

## Contributing

When updating deployment documentation:

1. Update relevant guide(s)
2. Update DEPLOYMENT_SUMMARY.md
3. Update this README if needed
4. Test any script changes
5. Document any new procedures

---

**Last Updated:** 2024-01-01
**Version:** 2.0.0
