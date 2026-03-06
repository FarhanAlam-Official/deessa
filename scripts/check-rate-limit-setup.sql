-- Check if rate limit infrastructure exists

\echo 'Checking if rate_limits table exists...'
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'rate_limits'
) as table_exists;

\echo ''
\echo 'Checking if increment_rate_limit function exists...'
SELECT EXISTS (
  SELECT FROM pg_proc 
  WHERE proname = 'increment_rate_limit'
) as function_exists;

\echo ''
\echo 'If either is false, run these migrations in order:'
\echo '1. psql $POSTGRES_URL -f scripts/payments-v2/022-create-payment-jobs-table.sql'
\echo '2. psql $POSTGRES_URL -f scripts/018-rate-limit-function.sql'
