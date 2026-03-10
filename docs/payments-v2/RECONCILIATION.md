# Payment Reconciliation System

The reconciliation system automatically checks and resolves stuck/pending donations by verifying their status with payment providers.

## Overview

The reconciliation system handles:
- **Missed webhooks**: When webhook delivery fails
- **Browser-closed scenarios**: User closes browser before webhook arrives (Khalti, eSewa)
- **Network failures**: Temporary network issues during webhook delivery
- **Stuck donations**: Donations pending for > 1 hour

## How It Works

1. **Query**: Finds donations in PENDING status older than 1 hour
2. **Lookup**: Checks transaction status with payment provider API
3. **Reconcile**: Updates donation status based on provider response
   - `paid` → Confirms donation (calls PaymentService)
   - `failed/expired/canceled` → Marks donation as failed
   - `pending` → No action (still processing)
4. **Alert**: Sends admin notification for each reconciliation action

## Usage

### Manual Execution (CLI)

```bash
# Run with default settings (60 minutes, 100 limit)
tsx scripts/cron/reconcile-payments.ts

# Check donations older than 2 hours
tsx scripts/cron/reconcile-payments.ts --max-age 120

# Dry run to see what would be done (no changes)
tsx scripts/cron/reconcile-payments.ts --dry-run

# Process only 50 donations
tsx scripts/cron/reconcile-payments.ts --limit 50

# Show help
tsx scripts/cron/reconcile-payments.ts --help
```

### Scheduled Execution (Cron)

#### Option 1: System Cron (Linux/macOS)

Add to crontab (`crontab -e`):

```bash
# Run every hour
0 * * * * cd /path/to/project && tsx scripts/cron/reconcile-payments.ts >> /var/log/reconciliation.log 2>&1
```

#### Option 2: Vercel Cron (Recommended for Vercel deployments)

Add to `vercel.json`:

```json
{
  "crons": [{
    "path": "/api/cron/reconcile-payments",
    "schedule": "0 * * * *"
  }]
}
```

Set environment variable in Vercel:
```bash
CRON_SECRET=your-strong-random-secret
```

Generate secret:
```bash
openssl rand -hex 32
```

#### Option 3: Manual API Call

```bash
# GET request (default settings)
curl -X GET https://your-domain.com/api/cron/reconcile-payments \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# POST request (custom settings)
curl -X POST https://your-domain.com/api/cron/reconcile-payments \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "maxAgeMinutes": 120,
    "limit": 50,
    "dryRun": false
  }'
```

## Configuration

### Environment Variables

Required:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `CRON_SECRET` - Secret for API authentication

Provider credentials (at least one required):
- `STRIPE_SECRET_KEY` - Stripe secret key
- `KHALTI_SECRET_KEY` - Khalti secret key
- `ESEWA_SECRET_KEY` - eSewa secret key

Optional:
- `PAYMENT_MODE` - Payment mode (live or mock)

### Parameters

- **maxAge** (default: 60 minutes)
  - Maximum age of pending donations to check
  - Donations older than this will be reconciled
  - Recommended: 60-120 minutes

- **limit** (default: 100)
  - Maximum number of donations to process per run
  - Prevents overwhelming the system
  - Recommended: 50-200

- **dryRun** (default: false)
  - If true, only logs what would be done without making changes
  - Useful for testing and debugging

## Output

### CLI Output

```
================================================================================
Payment Reconciliation Cron Job
================================================================================
Started at: 2026-03-02T10:00:00.000Z
Max age: 60 minutes
Limit: 100 donations
Dry run: NO
Payment mode: live
================================================================================

[Reconciliation] Starting reconciliation run
[Reconciliation] Found 3 stuck donations to reconcile
[Reconciliation] Reconciling donation abc123 (provider: stripe)
[Reconciliation] Confirmed donation abc123
[Reconciliation] Reconciling donation def456 (provider: khalti)
[Reconciliation] Failed donation def456
[Reconciliation] Reconciling donation ghi789 (provider: esewa)
[Reconciliation] Donation ghi789 still pending, no action taken

================================================================================
Reconciliation Summary
================================================================================
Total checked: 3
Confirmed: 1
Failed: 1
No change: 1
Errors: 0
Duration: 1234ms
================================================================================

Detailed Results:
--------------------------------------------------------------------------------
[CONFIRMED] abc123
  Provider: stripe
  Status: pending → confirmed
  Transaction: cs_test_123

[FAILED] def456
  Provider: khalti
  Status: pending → failed
  Transaction: pidx_456

Reconciliation completed successfully
```

### API Response

```json
{
  "success": true,
  "summary": {
    "totalChecked": 3,
    "confirmed": 1,
    "failed": 1,
    "noChange": 1,
    "errors": 0,
    "durationMs": 1234
  },
  "timestamp": "2026-03-02T10:00:00.000Z"
}
```

## Admin Alerts

The reconciliation system sends email alerts to administrators for each action:

### Confirmation Alert
```
Subject: [INFO] Payment System Alert: Reconciliation: Donation Confirmed

Donation abc123 was automatically confirmed by reconciliation system.

Details:
- Donation ID: abc123
- Provider: stripe
- Previous Status: pending
- New Status: confirmed
- Action: confirmed
- Transaction ID: cs_test_123
```

### Failure Alert
```
Subject: [INFO] Payment System Alert: Reconciliation: Donation Failed

Donation def456 was automatically failed by reconciliation system.

Details:
- Donation ID: def456
- Provider: khalti
- Previous Status: pending
- New Status: failed
- Action: failed
- Transaction ID: pidx_456
```

## Monitoring

### Logs

All reconciliation runs are logged with:
- Start time and parameters
- Each donation processed
- Summary statistics
- Errors and warnings

### Metrics

Track reconciliation effectiveness:
- Number of donations reconciled per run
- Confirmation vs failure rate
- Average processing time
- Error rate

### Alerts

Administrators receive alerts for:
- Each reconciliation action (confirmed/failed)
- Errors during reconciliation
- Stuck donations that couldn't be reconciled

## Troubleshooting

### No donations found

**Cause**: No donations have been pending for > 1 hour

**Solution**: This is normal. The system only reconciles stuck donations.

### Provider API errors

**Cause**: Missing or invalid provider credentials

**Solution**: 
1. Check environment variables are set correctly
2. Verify credentials are valid
3. Check provider API status

### Authentication errors (API endpoint)

**Cause**: Missing or invalid CRON_SECRET

**Solution**:
1. Set CRON_SECRET in environment variables
2. Use correct Authorization header: `Bearer YOUR_CRON_SECRET`

### High error rate

**Cause**: Provider API issues or network problems

**Solution**:
1. Check provider API status
2. Review error logs for specific issues
3. Consider increasing retry logic

## Best Practices

1. **Run hourly**: Catches most stuck donations without overwhelming the system
2. **Monitor alerts**: Review reconciliation alerts to identify patterns
3. **Test in staging**: Use dry-run mode to test before deploying
4. **Set reasonable limits**: Start with 100 donations per run
5. **Rotate secrets**: Regularly rotate CRON_SECRET for security
6. **Review logs**: Periodically review logs for errors and patterns

## Architecture

### Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Reconciliation Cron                      │
│                  (Runs every hour)                          │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Query Pending Donations                        │
│         (payment_status = 'pending' AND                     │
│          created_at < NOW() - 1 hour)                       │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              For Each Donation:                             │
│                                                             │
│  1. Get provider reference (session_id, pidx, uuid)        │
│  2. Call provider adapter.lookupTransaction()              │
│  3. Determine action based on status:                      │
│     - paid → Confirm donation                              │
│     - failed/expired → Fail donation                       │
│     - pending → No action                                  │
│  4. Call PaymentService.confirmDonation()                  │
│  5. Send admin alert                                       │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  Return Summary                             │
│  - Total checked                                            │
│  - Confirmed count                                          │
│  - Failed count                                             │
│  - No change count                                          │
│  - Errors count                                             │
└─────────────────────────────────────────────────────────────┘
```

### Provider Lookup Methods

Each provider adapter implements `lookupTransaction()`:

**Stripe**:
- Retrieves checkout session or subscription
- Checks payment_status
- Returns current status

**Khalti**:
- Calls `/epayment/lookup/` API
- Verifies transaction status
- Returns current status

**eSewa**:
- Calls transaction status API
- Verifies transaction completion
- Returns current status

## Related Documentation

- [Payment Architecture V2 Design](./DESIGN.md)
- [PaymentService Documentation](./PAYMENT_SERVICE.md)
- [Provider Adapters](./PROVIDER_ADAPTERS.md)
- [Monitoring & Alerting](./MONITORING.md)
