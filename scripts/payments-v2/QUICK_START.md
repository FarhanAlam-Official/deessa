# Quick Start: Payment Architecture V2 Migrations

## TL;DR

Run these 8 SQL scripts in order in your Supabase SQL Editor:

1. `020-create-payments-table.sql`
2. `021-create-receipts-table.sql`
3. `022-create-payment-jobs-table.sql` (optional for MVP, required for job queue scaling)
4. `023-enhance-payment-events.sql`
5. `024-add-indexes.sql`
6. `025-atomic-receipt-number.sql`
7. `026-create-receipt-failures-table.sql` ⭐ **MVP Error Tracking**
8. `027-create-email-failures-table.sql` ⭐ **MVP Error Tracking**

## MVP vs Full Implementation

### MVP (Vercel Hobby Plan)
**Required migrations:** 020, 021, 023, 024, 025, 026, 027
**Optional:** 022 (payment_jobs - only needed when scaling to job queue)

**What you get:**
- ✅ Core payment architecture
- ✅ Receipt generation (inline)
- ✅ Email sending (inline)
- ✅ Error tracking and visibility
- ✅ Manual retry interface
- ✅ Works on free tier

### Full Implementation (Job Queue)
**Required migrations:** All (020-027)

**What you get:**
- ✅ Everything in MVP
- ✅ Automatic retry with exponential backoff
- ✅ Background job processing
- ✅ Better reliability
- ⚠️ Requires Vercel Pro or external service

## Step-by-Step Instructions

### 1. Open Supabase SQL Editor

Navigate to: https://supabase.com/dashboard/project/YOUR_PROJECT/sql

### 2. Run Migrations in Order

Copy and paste each script, then click "Run".

**Script 1: Payments Table**
```sql
-- Copy contents of 020-create-payments-table.sql
-- Click "Run"
-- Verify: "Success. No rows returned"
```

**Script 2: Receipts Table**
```sql
-- Copy contents of 021-create-receipts-table.sql
-- Click "Run"
-- Verify: "Success. No rows returned"
```

**Script 3: Payment Jobs Table** (Optional for MVP)
```sql
-- Copy contents of 022-create-payment-jobs-table.sql
-- Click "Run"
-- Verify: "Success. No rows returned"
```

**Script 4: Enhance Payment Events**
```sql
-- Copy contents of 023-enhance-payment-events.sql
-- Click "Run"
-- Verify: "Success. No rows returned"
```

**Script 5: Add Indexes**
```sql
-- Copy contents of 024-add-indexes.sql
-- Click "Run"
-- Verify: "Success. No rows returned"
```

**Script 6: Atomic Receipt Numbers**
```sql
-- Copy contents of 025-atomic-receipt-number.sql
-- Click "Run"
-- Verify: "Success. No rows returned"
```

**Script 7: Receipt Failures Table** ⭐
```sql
-- Copy contents of 026-create-receipt-failures-table.sql
-- Click "Run"
-- Verify: "Success. No rows returned"
```

**Script 8: Email Failures Table** ⭐
```sql
-- Copy contents of 027-create-email-failures-table.sql
-- Click "Run"
-- Verify: "Success. No rows returned"
```

### 3. Verify Installation

Run this verification query:

```sql
-- Check all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'payments', 
  'receipts', 
  'payment_jobs',
  'receipt_failures',
  'email_failures'
)
ORDER BY table_name;

-- Should return 5 rows (or 4 if you skipped payment_jobs)
```

Test receipt number generation:

```sql
SELECT get_next_receipt_number();
-- Should return: RCP-2026-0001

SELECT get_next_receipt_number();
-- Should return: RCP-2026-0002
```

Verify error tracking triggers:

```sql
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE event_object_table IN ('receipt_failures', 'email_failures');

-- Should return 2 rows:
-- receipt_failure_upsert | receipt_failures
-- email_failure_upsert   | email_failures
```

## What's Next?

### For MVP Deployment:

1. **Implement error logging** - See `ERROR_TRACKING_GUIDE.md`
2. **Create admin interfaces** - See Phase 4 tasks in `tasks.md`
3. **Set up monitoring** - Track failure rates
4. **Deploy and test** - Start with test donations

### For Job Queue Scaling:

1. **Choose job queue option** - See Phase 4 Scaling Guide in `tasks.md`
2. **Implement job enqueue** - Replace inline calls
3. **Set up worker process** - Based on chosen option
4. **Monitor and tune** - Adjust retry logic as needed

## Common Issues

### "relation already exists"
**Solution:** Migrations are idempotent. Safe to re-run.

### "column already exists"
**Solution:** Script checks for existing columns. Safe to re-run.

### "function already exists"
**Solution:** Scripts use `CREATE OR REPLACE`. Safe to re-run.

### Receipt number not incrementing
**Solution:** Check sequence exists:
```sql
SELECT * FROM information_schema.sequences 
WHERE sequence_name = 'receipt_number_seq';
```

### Trigger not working
**Solution:** Verify trigger exists:
```sql
SELECT * FROM information_schema.triggers 
WHERE event_object_table IN ('receipt_failures', 'email_failures');
```

## Rollback

If you need to undo everything:

```sql
-- WARNING: This will delete all data in these tables!

-- Drop error tracking
DROP TRIGGER IF EXISTS email_failure_upsert ON email_failures;
DROP FUNCTION IF EXISTS increment_email_failure_attempt();
DROP TABLE IF EXISTS email_failures CASCADE;

DROP TRIGGER IF EXISTS receipt_failure_upsert ON receipt_failures;
DROP FUNCTION IF EXISTS increment_receipt_failure_attempt();
DROP TABLE IF EXISTS receipt_failures CASCADE;

-- Drop core tables
DROP FUNCTION IF EXISTS get_next_receipt_number();
DROP SEQUENCE IF EXISTS receipt_number_seq;
DROP TABLE IF EXISTS payment_jobs CASCADE;
DROP TABLE IF EXISTS receipts CASCADE;
DROP TABLE IF EXISTS payments CASCADE;

-- Revert payment_events
ALTER TABLE payment_events 
  DROP COLUMN IF EXISTS event_type,
  DROP COLUMN IF EXISTS raw_payload,
  DROP COLUMN IF EXISTS processed_at;
```

## Need Help?

- **Full documentation:** See `MIGRATION_ORDER.md`
- **Error tracking guide:** See `ERROR_TRACKING_GUIDE.md`
- **Scaling options:** See Phase 4 in `tasks.md`
- **Architecture details:** See `design.md`

## Checklist

- [ ] Ran migration 020 (payments table)
- [ ] Ran migration 021 (receipts table)
- [ ] Ran migration 022 (payment_jobs - optional for MVP)
- [ ] Ran migration 023 (enhance payment_events)
- [ ] Ran migration 024 (add indexes)
- [ ] Ran migration 025 (atomic receipt numbers)
- [ ] Ran migration 026 (receipt failures) ⭐
- [ ] Ran migration 027 (email failures) ⭐
- [ ] Verified all tables exist
- [ ] Tested receipt number generation
- [ ] Verified error tracking triggers
- [ ] Ready to implement error logging
- [ ] Ready to create admin interfaces
