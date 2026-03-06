# What's New: MVP Error Tracking Tables

## Summary

Added two new migration scripts (026 and 027) that create error tracking tables for the MVP inline processing approach. These tables enable Vercel Hobby plan compatibility without requiring a full job queue system.

## New Files

### Migration Scripts

- **026-create-receipt-failures-table.sql** - Tracks receipt generation failures
- **027-create-email-failures-table.sql** - Tracks email send failures

### Documentation

- **ERROR_TRACKING_GUIDE.md** - Comprehensive guide for using error tracking tables
- **QUICK_START.md** - Fast setup guide with MVP vs Full implementation paths
- **WHATS_NEW.md** - This file

### Updated Files

- **MIGRATION_ORDER.md** - Added migrations 026-027 to execution order
- **README.md** - Updated with new tables and MVP approach

## What These Tables Do

### receipt_failures

- Tracks failed receipt generation attempts
- Automatically increments attempt count on duplicate failures
- Enables admin visibility and manual retry
- Supports resolution tracking (who fixed it, when, how)

### email_failures

- Tracks failed email send attempts
- Automatically increments attempt count on duplicate failures
- Enables admin visibility and manual resend
- Tracks problematic email addresses

## Key Features

### Automatic Attempt Counting

Both tables include triggers that automatically increment `attempt_count` when the same donation fails again, preventing duplicate records.

### Admin Resolution Tracking

Track who resolved the issue, when, and how with `resolved_at`, `resolved_by`, and `resolution_notes` fields.

### Error Categorization

Predefined error types help identify patterns:

- Receipt: `generation_failed`, `storage_failed`, `rpc_failed`, `unexpected_error`
- Email: `smtp_failed`, `timeout`, `auth_failed`, `network_error`, `unexpected_error`

### Efficient Queries

Partial indexes on unresolved failures make admin dashboards fast, even with thousands of historical records.

## Why This Matters

### Vercel Hobby Plan Compatible

The MVP approach with error tracking tables works on Vercel's free tier without requiring:

- Vercel Pro subscription ($20/month)
- External job queue services
- Separate worker processes
- Additional infrastructure

### Clear Scaling Path

When you're ready to scale:

1. Keep error tracking tables (valuable audit trail)
2. Add job queue (choose from 5 options documented)
3. Implement automated retry
4. Monitor both systems during transition

### Production Ready

Even without a job queue, you get:

- ✅ Visibility into all failures
- ✅ Manual retry capability
- ✅ Failure rate monitoring
- ✅ Error pattern analysis
- ✅ Resolution audit trail

## Migration Path

### For New Deployments

Run all migrations (020-027) in order. Skip 022 (payment_jobs) if using MVP approach.

### For Existing V2 Deployments

If you already ran migrations 020-025, just add:

1. Run 026-create-receipt-failures-table.sql
2. Run 027-create-email-failures-table.sql
3. Implement error logging in your code
4. Create admin retry interfaces

## Quick Start

### 1. Run Migrations

```sql
-- In Supabase SQL Editor
-- Copy and paste 026-create-receipt-failures-table.sql
-- Click "Run"
-- Copy and paste 027-create-email-failures-table.sql
-- Click "Run"
```

### 2. Verify Installation

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables
WHERE table_name IN ('receipt_failures', 'email_failures');

-- Check triggers exist
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE event_object_table IN ('receipt_failures', 'email_failures');
```

### 3. Implement Error Logging

```typescript
// In your receipt generation code
generateReceiptForDonation({ donationId }).catch(async (error) => {
  await supabase.from("receipt_failures").insert({
    donation_id: donationId,
    error_type: "generation_failed",
    error_message: error.message,
    error_stack: error.stack,
  });
});
```

### 4. Create Admin Interface

See `ERROR_TRACKING_GUIDE.md` for complete examples of:

- Admin dashboard for viewing failures
- Retry buttons for manual intervention
- Resolution tracking
- Failure statistics

## Documentation

### Start Here

- **QUICK_START.md** - Fast setup guide (5 minutes)

### Deep Dives

- **ERROR_TRACKING_GUIDE.md** - Complete usage guide with code examples
- **MIGRATION_ORDER.md** - Detailed migration instructions
- **Phase 4 Scaling Guide** in `tasks.md` - Job queue options when ready to scale

### Architecture

- **design.md** - Full architecture documentation
- **tasks.md** - Implementation task list

## Comparison: MVP vs Job Queue

| Feature         | MVP (Error Tracking)      | Job Queue                        |
| --------------- | ------------------------- | -------------------------------- |
| **Cost**        | Free (Vercel Hobby)       | $0-20/month                      |
| **Setup Time**  | 1 hour                    | 4-8 hours                        |
| **Auto Retry**  | ❌ Manual                 | ✅ Automatic                     |
| **Visibility**  | ✅ Full                   | ✅ Full                          |
| **Reliability** | Medium                    | High                             |
| **Maintenance** | Low                       | Medium                           |
| **Best For**    | MVP, <500 donations/month | Production, >500 donations/month |

## When to Scale

Consider moving to a job queue when:

- Manual retry becomes burdensome (>10 failures/week)
- Volume exceeds 500 donations/month
- Need guaranteed delivery SLA
- Want automated monitoring and alerting
- Failure rate consistently above 5%

## Support

### Questions?

1. Check **ERROR_TRACKING_GUIDE.md** for usage examples
2. Check **QUICK_START.md** for setup instructions
3. Check **Phase 4 Scaling Guide** in tasks.md for job queue options
4. Review design.md for architecture details

### Issues?

1. Verify migrations ran successfully
2. Check triggers exist (see verification query above)
3. Test trigger behavior (see ERROR_TRACKING_GUIDE.md)
4. Review Supabase logs for errors

## Changelog

### 2026-03-02

- Added 026-create-receipt-failures-table.sql
- Added 027-create-email-failures-table.sql
- Added ERROR_TRACKING_GUIDE.md
- Added QUICK_START.md
- Updated MIGRATION_ORDER.md
- Updated README.md
- Added WHATS_NEW.md

## Next Steps

1. ✅ Run migrations 026-027
2. ✅ Verify installation
3. 🔄 Implement error logging (Task 10.1, 10.4)
4. 🔄 Create failure tracking tables (Task 10.2, 10.5)
5. 🔄 Build admin retry interfaces (Task 10.3, 10.5)
6. 🔄 Add monitoring dashboard (Task 10.6)
7. 📊 Monitor failure rates
8. 🚀 Scale to job queue when needed

## Summary

The error tracking tables provide a production-ready solution for post-payment processing on Vercel Hobby plan. They offer full visibility into failures, enable manual intervention, and provide a clear path to scale when needed.

**Status:** ✅ Production Ready for MVP

**Compatibility:** ✅ Vercel Hobby Plan

**Scaling Path:** ✅ Documented (5 options)

**Risk:** ✅ Minimal

**Recommendation:** ✅ Deploy for MVP, scale when needed
