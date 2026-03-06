# Payment Architecture V2 - Migration Scripts

## Overview
This document lists the migration scripts for Payment Architecture V2 in the order they should be executed.

## Migration Order

### Phase 1: Database Schema Setup (Task 1)

Execute these scripts in order:

1. **020-create-payments-table.sql**
   - Creates `payments` table for provider-specific payment details
   - Adds foreign key to donations table
   - Creates indexes on donation_id, provider, transaction_id

2. **021-create-receipts-table.sql**
   - Creates `receipts` table for receipt metadata
   - Adds foreign key to donations table
   - Creates indexes on donation_id, receipt_number
   - Adds unique constraint on donation_id

3. **022-create-payment-jobs-table.sql**
   - Creates `payment_jobs` table for async workers
   - Adds status check constraint
   - Creates indexes on status, next_retry_at, donation_id

4. **023-enhance-payment-events.sql**
   - Enhances existing `payment_events` table
   - Adds event_type, raw_payload, processed_at columns
   - Ensures unique constraint on (provider, event_id)

5. **024-add-indexes.sql**
   - Adds performance indexes on donations table
   - Adds indexes on payment_events table
   - Creates composite indexes for stuck/review donation queries

6. **025-atomic-receipt-number.sql**
   - Creates `receipt_number_seq` sequence
   - Creates `get_next_receipt_number()` RPC function
   - Ensures atomic receipt number generation

7. **026-create-receipt-failures-table.sql** (MVP Error Tracking)
   - Creates `receipt_failures` table for tracking receipt generation failures
   - Adds trigger for automatic attempt count increment
   - Creates indexes for admin dashboard queries
   - Enables manual retry workflow

8. **027-create-email-failures-table.sql** (MVP Error Tracking)
   - Creates `email_failures` table for tracking email send failures
   - Adds trigger for automatic attempt count increment
   - Creates indexes for admin dashboard queries
   - Enables manual resend workflow

## Notes on Error Tracking Tables (026-027)

These tables support the MVP inline processing approach for Vercel Hobby plan:
- Track failures without requiring a full job queue system
- Enable admin visibility into failed operations
- Support manual retry/resend workflows
- Automatically increment attempt counts on duplicate failures
- Can be used alongside job queue system when scaling

**When to use:**
- MVP deployment on Vercel Hobby plan
- Low to medium volume (<500 donations/month)
- Manual intervention acceptable for failures

**When to scale:**
- See Phase 4 Scaling Guide in tasks.md
- Consider job queue when failures exceed 10/week
- Upgrade to automated retry system for high volume

## Execution Instructions

### Using Supabase Dashboard
1. Navigate to SQL Editor in Supabase Dashboard
2. Copy and paste each script in order
3. Execute each script
4. Verify no errors before proceeding to next script

### Using Supabase CLI
```bash
# Execute all migrations in order
supabase db push

# Or execute individually
psql $DATABASE_URL -f scripts/payments-v2/020-create-payments-table.sql
psql $DATABASE_URL -f scripts/payments-v2/021-create-receipts-table.sql
psql $DATABASE_URL -f scripts/payments-v2/022-create-payment-jobs-table.sql
psql $DATABASE_URL -f scripts/payments-v2/023-enhance-payment-events.sql
psql $DATABASE_URL -f scripts/payments-v2/024-add-indexes.sql
psql $DATABASE_URL -f scripts/payments-v2/025-atomic-receipt-number.sql
psql $DATABASE_URL -f scripts/payments-v2/026-create-receipt-failures-table.sql
psql $DATABASE_URL -f scripts/payments-v2/027-create-email-failures-table.sql
```

## Verification

After running all migrations, verify the schema:

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('payments', 'receipts', 'payment_jobs', 'receipt_failures', 'email_failures');

-- Check payment_events enhancements
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'payment_events';

-- Check indexes
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('payments', 'receipts', 'payment_jobs', 'donations', 'payment_events', 'receipt_failures', 'email_failures');

-- Test receipt number generation
SELECT get_next_receipt_number();
SELECT get_next_receipt_number();
-- Should return: RCP-2026-0001, RCP-2026-0002

-- Verify error tracking triggers
SELECT trigger_name, event_manipulation, event_object_table 
FROM information_schema.triggers 
WHERE event_object_table IN ('receipt_failures', 'email_failures');
```

## Rollback

If you need to rollback these migrations:

```sql
-- Drop in reverse order
DROP TRIGGER IF EXISTS email_failure_upsert ON email_failures;
DROP FUNCTION IF EXISTS increment_email_failure_attempt();
DROP TABLE IF EXISTS email_failures CASCADE;

DROP TRIGGER IF EXISTS receipt_failure_upsert ON receipt_failures;
DROP FUNCTION IF EXISTS increment_receipt_failure_attempt();
DROP TABLE IF EXISTS receipt_failures CASCADE;

DROP FUNCTION IF EXISTS get_next_receipt_number();
DROP SEQUENCE IF EXISTS receipt_number_seq;
DROP TABLE IF EXISTS payment_jobs CASCADE;
DROP TABLE IF EXISTS receipts CASCADE;
DROP TABLE IF EXISTS payments CASCADE;

-- Revert payment_events enhancements
ALTER TABLE payment_events 
  DROP COLUMN IF EXISTS event_type,
  DROP COLUMN IF EXISTS raw_payload,
  DROP COLUMN IF EXISTS processed_at;
```

## Notes

- All migrations are idempotent (safe to run multiple times)
- Foreign key constraints ensure referential integrity
- Indexes are created with `IF NOT EXISTS` to prevent errors
- The `payment_events` table is enhanced, not recreated (preserves existing data)
- Error tracking tables (026-027) include automatic triggers for attempt count management
- Error tracking tables support MVP inline processing approach (no job queue required)
