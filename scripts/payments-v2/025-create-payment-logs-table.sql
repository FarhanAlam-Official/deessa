-- Payment Architecture V2 - Payment Logs Table
-- 
-- This migration creates the payment_logs table for storing critical
-- payment system events, errors, and audit trail.
--
-- Features:
-- - Structured logging for payment events
-- - Error-level and critical event storage
-- - Amount/currency mismatch tracking
-- - State transition audit trail
-- - Performance metrics (duration)

-- Create payment_logs table
CREATE TABLE IF NOT EXISTS payment_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Log metadata
  level TEXT NOT NULL CHECK (level IN ('debug', 'info', 'warn', 'error', 'critical')),
  event_type TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Payment context
  donation_id UUID REFERENCES donations(id) ON DELETE SET NULL,
  provider TEXT,
  transaction_id TEXT,
  event_id TEXT,
  
  -- State information
  current_status TEXT,
  new_status TEXT,
  
  -- Verification details
  expected_amount DECIMAL(10, 2),
  actual_amount DECIMAL(10, 2),
  expected_currency TEXT,
  actual_currency TEXT,
  
  -- Error information
  error_message TEXT,
  error_code TEXT,
  error_stack TEXT,
  
  -- Additional metadata (JSONB for flexibility)
  metadata JSONB,
  
  -- Performance metrics
  duration_ms INTEGER
);

-- Create indexes for common queries

-- Index for querying by donation
CREATE INDEX IF NOT EXISTS idx_payment_logs_donation 
  ON payment_logs(donation_id);

-- Index for querying by level (for error/critical logs)
CREATE INDEX IF NOT EXISTS idx_payment_logs_level 
  ON payment_logs(level);

-- Index for querying by event type
CREATE INDEX IF NOT EXISTS idx_payment_logs_event_type 
  ON payment_logs(event_type);

-- Index for querying by provider
CREATE INDEX IF NOT EXISTS idx_payment_logs_provider 
  ON payment_logs(provider);

-- Index for time-based queries (most recent logs)
CREATE INDEX IF NOT EXISTS idx_payment_logs_created_at 
  ON payment_logs(created_at DESC);

-- Composite index for error logs by donation
CREATE INDEX IF NOT EXISTS idx_payment_logs_errors_by_donation 
  ON payment_logs(donation_id, level) 
  WHERE level IN ('error', 'critical');

-- Composite index for amount mismatch events
CREATE INDEX IF NOT EXISTS idx_payment_logs_amount_mismatch 
  ON payment_logs(event_type, created_at) 
  WHERE event_type = 'amount_mismatch';

-- Composite index for currency mismatch events
CREATE INDEX IF NOT EXISTS idx_payment_logs_currency_mismatch 
  ON payment_logs(event_type, created_at) 
  WHERE event_type = 'currency_mismatch';

-- Add comment to table
COMMENT ON TABLE payment_logs IS 'Audit log for payment system events, errors, and state transitions';

-- Add comments to important columns
COMMENT ON COLUMN payment_logs.level IS 'Log severity: debug, info, warn, error, critical';
COMMENT ON COLUMN payment_logs.event_type IS 'Type of payment event (e.g., confirmation_attempt, state_transition, amount_mismatch)';
COMMENT ON COLUMN payment_logs.donation_id IS 'Reference to donation (nullable for system-level events)';
COMMENT ON COLUMN payment_logs.metadata IS 'Additional context data in JSON format';
COMMENT ON COLUMN payment_logs.duration_ms IS 'Operation duration in milliseconds (for performance tracking)';

-- Grant permissions (adjust based on your RLS policies)
-- Note: This assumes you have a service role that needs access
-- Adjust permissions based on your security requirements

-- Example: Grant read access to authenticated users for their own donation logs
-- ALTER TABLE payment_logs ENABLE ROW LEVEL SECURITY;
-- 
-- CREATE POLICY "Users can view logs for their donations"
--   ON payment_logs
--   FOR SELECT
--   USING (
--     donation_id IN (
--       SELECT id FROM donations WHERE donor_email = auth.jwt() ->> 'email'
--     )
--   );

-- Example: Grant full access to service role
-- GRANT ALL ON payment_logs TO service_role;

-- Create a view for recent error logs (last 24 hours)
CREATE OR REPLACE VIEW recent_payment_errors AS
SELECT 
  id,
  level,
  event_type,
  message,
  donation_id,
  provider,
  transaction_id,
  error_message,
  error_code,
  created_at
FROM payment_logs
WHERE 
  level IN ('error', 'critical')
  AND created_at >= NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- Create a view for amount/currency mismatches
CREATE OR REPLACE VIEW payment_mismatches AS
SELECT 
  id,
  event_type,
  donation_id,
  provider,
  transaction_id,
  expected_amount,
  actual_amount,
  expected_currency,
  actual_currency,
  metadata,
  created_at
FROM payment_logs
WHERE 
  event_type IN ('amount_mismatch', 'currency_mismatch')
ORDER BY created_at DESC;

-- Create a function to clean up old logs (optional - for maintenance)
CREATE OR REPLACE FUNCTION cleanup_old_payment_logs(retention_days INTEGER DEFAULT 90)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete logs older than retention period, except critical errors
  DELETE FROM payment_logs
  WHERE 
    created_at < NOW() - (retention_days || ' days')::INTERVAL
    AND level NOT IN ('error', 'critical');
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$;

COMMENT ON FUNCTION cleanup_old_payment_logs IS 'Clean up payment logs older than specified days (default 90), preserving error/critical logs';

-- Example usage of cleanup function (run manually or via cron):
-- SELECT cleanup_old_payment_logs(90); -- Delete logs older than 90 days

-- Migration complete
-- 
-- Next steps:
-- 1. Run this migration: psql -d your_database -f 025-create-payment-logs-table.sql
-- 2. Verify table creation: \d payment_logs
-- 3. Test logging: INSERT INTO payment_logs (level, event_type, message) VALUES ('info', 'test', 'Test log entry');
-- 4. Configure RLS policies if needed for your security requirements
