# Error Tracking Tables Guide

## Overview

The error tracking tables (`receipt_failures` and `email_failures`) support the MVP inline processing approach for post-payment operations. They provide visibility into failures and enable manual retry workflows without requiring a full job queue system.

## When to Use

**Use error tracking tables when:**
- Deploying on Vercel Hobby plan (no Pro subscription)
- Low to medium volume (<500 donations/month)
- Manual intervention acceptable for failures (<10 failures/week)
- Want to avoid external dependencies

**Scale to job queue when:**
- Manual retry becomes burdensome (>10 failures/week)
- Volume exceeds 500 donations/month
- Need guaranteed delivery SLA
- Want automated retry and monitoring

See `Phase 4 Scaling Guide` in `tasks.md` for job queue options.

## Table Schemas

### receipt_failures

Tracks receipt generation failures with automatic attempt counting.

**Columns:**
- `id` - UUID primary key
- `donation_id` - Foreign key to donations table
- `error_type` - Category: generation_failed, storage_failed, rpc_failed, unexpected_error
- `error_message` - Human-readable error message
- `error_stack` - Full stack trace for debugging
- `attempt_count` - Number of failed attempts (auto-incremented)
- `last_attempt_at` - Timestamp of most recent failure
- `resolved_at` - Timestamp when resolved (NULL if pending)
- `resolved_by` - Admin user who resolved the issue
- `resolution_notes` - Notes about resolution
- `created_at` - First failure timestamp

**Indexes:**
- `idx_receipt_failures_donation` - Lookup by donation
- `idx_receipt_failures_unresolved` - Partial index on unresolved (for admin dashboard)
- `idx_receipt_failures_created` - Time-based queries
- `idx_receipt_failures_error_type` - Filter by error category

**Trigger:**
- `receipt_failure_upsert` - Automatically increments attempt_count on duplicate donation_id

### email_failures

Tracks email send failures with automatic attempt counting.

**Columns:**
- `id` - UUID primary key
- `donation_id` - Foreign key to donations table
- `error_type` - Category: smtp_failed, timeout, auth_failed, network_error, unexpected_error
- `error_message` - Human-readable error message
- `error_stack` - Full stack trace for debugging
- `recipient_email` - Email address that failed
- `attempt_count` - Number of failed attempts (auto-incremented)
- `last_attempt_at` - Timestamp of most recent failure
- `resolved_at` - Timestamp when resolved (NULL if pending)
- `resolved_by` - Admin user who resolved the issue
- `resolution_notes` - Notes about resolution
- `created_at` - First failure timestamp

**Indexes:**
- `idx_email_failures_donation` - Lookup by donation
- `idx_email_failures_unresolved` - Partial index on unresolved (for admin dashboard)
- `idx_email_failures_created` - Time-based queries
- `idx_email_failures_error_type` - Filter by error category
- `idx_email_failures_recipient` - Track problematic email addresses

**Trigger:**
- `email_failure_upsert` - Automatically increments attempt_count on duplicate donation_id

## Usage Examples

### Logging a Receipt Failure

```typescript
async function logReceiptFailure(failure: {
  donationId: string
  errorType: 'generation_failed' | 'storage_failed' | 'rpc_failed' | 'unexpected_error'
  errorMessage: string
  errorStack?: string
}) {
  // Insert failure record (trigger handles duplicates)
  const { error } = await supabase
    .from('receipt_failures')
    .insert({
      donation_id: failure.donationId,
      error_type: failure.errorType,
      error_message: failure.errorMessage,
      error_stack: failure.errorStack,
      last_attempt_at: new Date().toISOString()
    })
  
  if (error) {
    console.error('Failed to log receipt failure:', error)
  }
}

// Usage in receipt generation
generateReceiptForDonation({ donationId })
  .catch(async (error) => {
    await logReceiptFailure({
      donationId,
      errorType: 'generation_failed',
      errorMessage: error.message,
      errorStack: error.stack
    })
  })
```

### Logging an Email Failure

```typescript
async function logEmailFailure(failure: {
  donationId: string
  errorType: 'smtp_failed' | 'timeout' | 'auth_failed' | 'network_error' | 'unexpected_error'
  errorMessage: string
  recipientEmail: string
  errorStack?: string
}) {
  const { error } = await supabase
    .from('email_failures')
    .insert({
      donation_id: failure.donationId,
      error_type: failure.errorType,
      error_message: failure.errorMessage,
      error_stack: failure.errorStack,
      recipient_email: failure.recipientEmail,
      last_attempt_at: new Date().toISOString()
    })
  
  if (error) {
    console.error('Failed to log email failure:', error)
  }
}

// Usage in email sending
sendReceiptEmail({ donationId, email })
  .catch(async (error) => {
    await logEmailFailure({
      donationId,
      errorType: error.code === 'ETIMEDOUT' ? 'timeout' : 'smtp_failed',
      errorMessage: error.message,
      recipientEmail: email,
      errorStack: error.stack
    })
  })
```

### Querying Unresolved Failures

```typescript
// Get all unresolved receipt failures
const { data: receiptFailures } = await supabase
  .from('receipt_failures')
  .select('*, donations(*)')
  .is('resolved_at', null)
  .order('last_attempt_at', { ascending: false })

// Get all unresolved email failures
const { data: emailFailures } = await supabase
  .from('email_failures')
  .select('*, donations(*)')
  .is('resolved_at', null)
  .order('last_attempt_at', { ascending: false })

// Get failures by error type
const { data: storageFailures } = await supabase
  .from('receipt_failures')
  .select('*')
  .eq('error_type', 'storage_failed')
  .is('resolved_at', null)
```

### Marking Failure as Resolved

```typescript
async function resolveReceiptFailure(
  failureId: string,
  adminUserId: string,
  notes?: string
) {
  const { error } = await supabase
    .from('receipt_failures')
    .update({
      resolved_at: new Date().toISOString(),
      resolved_by: adminUserId,
      resolution_notes: notes
    })
    .eq('id', failureId)
  
  if (error) {
    throw new Error(`Failed to resolve failure: ${error.message}`)
  }
}

// Usage after manual retry succeeds
await generateReceiptForDonation({ donationId })
await resolveReceiptFailure(failureId, adminUserId, 'Manually retried successfully')
```

### Getting Failure Statistics

```sql
-- Receipt failure rate (last 24 hours)
SELECT 
  COUNT(DISTINCT rf.donation_id) as failed_receipts,
  COUNT(DISTINCT d.id) as total_donations,
  ROUND(COUNT(DISTINCT rf.donation_id)::numeric / NULLIF(COUNT(DISTINCT d.id), 0) * 100, 2) as failure_rate_percent
FROM donations d
LEFT JOIN receipt_failures rf ON d.id = rf.donation_id 
  AND rf.created_at > NOW() - INTERVAL '24 hours'
WHERE d.payment_status = 'confirmed'
  AND d.confirmed_at > NOW() - INTERVAL '24 hours';

-- Email failure rate (last 7 days)
SELECT 
  COUNT(DISTINCT ef.donation_id) as failed_emails,
  COUNT(DISTINCT d.id) as total_donations,
  ROUND(COUNT(DISTINCT ef.donation_id)::numeric / NULLIF(COUNT(DISTINCT d.id), 0) * 100, 2) as failure_rate_percent
FROM donations d
LEFT JOIN email_failures ef ON d.id = ef.donation_id 
  AND ef.created_at > NOW() - INTERVAL '7 days'
WHERE d.payment_status = 'confirmed'
  AND d.confirmed_at > NOW() - INTERVAL '7 days';

-- Failures by error type
SELECT 
  error_type,
  COUNT(*) as count,
  AVG(attempt_count) as avg_attempts
FROM receipt_failures
WHERE resolved_at IS NULL
GROUP BY error_type
ORDER BY count DESC;
```

## Admin Interface Examples

### Failed Receipts Dashboard

```typescript
// app/admin/receipts/failed/page.tsx
export default async function FailedReceiptsPage() {
  const supabase = createClient()
  
  const { data: failures } = await supabase
    .from('receipt_failures')
    .select(`
      *,
      donations (
        id,
        amount,
        currency,
        donor_name,
        donor_email,
        confirmed_at
      )
    `)
    .is('resolved_at', null)
    .order('last_attempt_at', { ascending: false })
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Failed Receipts</h1>
      
      {failures?.length === 0 ? (
        <p className="text-muted-foreground">No failed receipts</p>
      ) : (
        <div className="space-y-4">
          {failures?.map(failure => (
            <FailureCard
              key={failure.id}
              failure={failure}
              onRetry={async () => {
                await generateReceiptForDonation({
                  donationId: failure.donation_id
                })
                await resolveReceiptFailure(
                  failure.id,
                  'admin-user-id',
                  'Manually retried from admin dashboard'
                )
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
```

### Failure Card Component

```typescript
// components/admin/FailureCard.tsx
interface FailureCardProps {
  failure: {
    id: string
    error_type: string
    error_message: string
    attempt_count: number
    last_attempt_at: string
    donations: {
      donor_name: string
      donor_email: string
      amount: number
      currency: string
    }
  }
  onRetry: () => Promise<void>
}

export function FailureCard({ failure, onRetry }: FailureCardProps) {
  const [isRetrying, setIsRetrying] = useState(false)
  
  const handleRetry = async () => {
    setIsRetrying(true)
    try {
      await onRetry()
      toast.success('Retry successful')
    } catch (error) {
      toast.error('Retry failed: ' + error.message)
    } finally {
      setIsRetrying(false)
    }
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{failure.donations.donor_name}</span>
          <Badge variant="destructive">{failure.error_type}</Badge>
        </CardTitle>
        <CardDescription>
          {failure.donations.donor_email} • 
          {failure.donations.amount} {failure.donations.currency}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            <strong>Error:</strong> {failure.error_message}
          </p>
          <p className="text-sm text-muted-foreground">
            <strong>Attempts:</strong> {failure.attempt_count}
          </p>
          <p className="text-sm text-muted-foreground">
            <strong>Last attempt:</strong> {new Date(failure.last_attempt_at).toLocaleString()}
          </p>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleRetry} 
          disabled={isRetrying}
        >
          {isRetrying ? 'Retrying...' : 'Retry Now'}
        </Button>
      </CardFooter>
    </Card>
  )
}
```

## Monitoring and Alerts

### Alert Thresholds

Set up monitoring to alert when:
- Failure rate exceeds 5% in last 24 hours
- Any single donation has >3 failed attempts
- Unresolved failures older than 24 hours
- Specific error types spike (e.g., SMTP auth failures)

### Example Alert Query

```sql
-- Alert: High failure rate (>5%)
WITH stats AS (
  SELECT 
    COUNT(DISTINCT rf.donation_id) as failed_count,
    COUNT(DISTINCT d.id) as total_count
  FROM donations d
  LEFT JOIN receipt_failures rf ON d.id = rf.donation_id 
    AND rf.created_at > NOW() - INTERVAL '24 hours'
  WHERE d.payment_status = 'confirmed'
    AND d.confirmed_at > NOW() - INTERVAL '24 hours'
)
SELECT 
  failed_count,
  total_count,
  ROUND(failed_count::numeric / NULLIF(total_count, 0) * 100, 2) as failure_rate
FROM stats
WHERE (failed_count::numeric / NULLIF(total_count, 0)) > 0.05;
```

## Migration to Job Queue

When you're ready to scale to a job queue system:

1. **Keep error tracking tables** - They provide valuable audit trail
2. **Add job queue tables** - Run migrations 022 (payment_jobs)
3. **Update code** - Replace inline calls with job enqueue
4. **Parallel run** - Run both systems temporarily
5. **Monitor** - Compare failure rates between systems
6. **Cutover** - Switch to job queue fully
7. **Archive** - Keep error tracking for historical data

The error tracking tables complement job queue systems and can continue to provide value for monitoring and debugging.

## Best Practices

1. **Always log failures** - Even if you think they're rare
2. **Include stack traces** - Essential for debugging
3. **Set up alerts** - Don't wait for users to report issues
4. **Review regularly** - Check dashboard weekly
5. **Document resolutions** - Use resolution_notes field
6. **Track patterns** - Look for recurring error types
7. **Plan scaling** - Monitor failure rates and volume

## Troubleshooting

### Trigger not incrementing attempt_count

Check if trigger exists:
```sql
SELECT * FROM information_schema.triggers 
WHERE event_object_table = 'receipt_failures';
```

Manually test trigger:
```sql
-- Insert first failure
INSERT INTO receipt_failures (donation_id, error_type, error_message)
VALUES ('test-uuid', 'generation_failed', 'Test error');

-- Insert duplicate (should increment, not create new row)
INSERT INTO receipt_failures (donation_id, error_type, error_message)
VALUES ('test-uuid', 'generation_failed', 'Test error 2');

-- Check result (should have attempt_count = 2)
SELECT * FROM receipt_failures WHERE donation_id = 'test-uuid';
```

### High failure rates

1. Check error types to identify root cause
2. Review error messages for patterns
3. Check provider status (SMTP, storage, etc.)
4. Verify environment variables
5. Check network connectivity
6. Review recent code changes

### Performance issues

If queries are slow:
1. Verify indexes exist (see schema above)
2. Check query plans with EXPLAIN ANALYZE
3. Consider archiving old resolved failures
4. Add composite indexes for specific queries

## Support

For questions or issues:
1. Check Phase 4 Scaling Guide in tasks.md
2. Review design.md for architecture details
3. See MIGRATION_ORDER.md for setup instructions
