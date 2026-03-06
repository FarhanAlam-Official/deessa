-- Payment Architecture V2: Receipt Failures Table (MVP Error Tracking)
-- Tracks receipt generation failures for inline processing approach
-- Enables admin visibility and manual retry workflow

CREATE TABLE IF NOT EXISTS receipt_failures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donation_id UUID NOT NULL REFERENCES donations(id) ON DELETE CASCADE,
  error_type TEXT NOT NULL, -- 'generation_failed', 'storage_failed', 'rpc_failed', 'unexpected_error'
  error_message TEXT NOT NULL,
  error_stack TEXT,
  attempt_count INT NOT NULL DEFAULT 1,
  last_attempt_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT, -- Admin user ID or email who resolved the issue
  resolution_notes TEXT, -- Optional notes about how the issue was resolved
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT check_error_type CHECK (error_type IN ('generation_failed', 'storage_failed', 'rpc_failed', 'unexpected_error'))
);

-- Index on donation_id for looking up failures by donation
CREATE INDEX IF NOT EXISTS idx_receipt_failures_donation ON receipt_failures(donation_id);

-- Partial index on unresolved failures for admin dashboard
CREATE INDEX IF NOT EXISTS idx_receipt_failures_unresolved ON receipt_failures(resolved_at) 
  WHERE resolved_at IS NULL;

-- Index on created_at for time-based queries and monitoring
CREATE INDEX IF NOT EXISTS idx_receipt_failures_created ON receipt_failures(created_at DESC);

-- Index on error_type for filtering by error category
CREATE INDEX IF NOT EXISTS idx_receipt_failures_error_type ON receipt_failures(error_type);

-- Add comments for documentation
COMMENT ON TABLE receipt_failures IS 'Tracks receipt generation failures for MVP inline processing approach';
COMMENT ON COLUMN receipt_failures.error_type IS 'Category of error: generation_failed, storage_failed, rpc_failed, or unexpected_error';
COMMENT ON COLUMN receipt_failures.error_message IS 'Human-readable error message';
COMMENT ON COLUMN receipt_failures.error_stack IS 'Full error stack trace for debugging';
COMMENT ON COLUMN receipt_failures.attempt_count IS 'Number of failed attempts (incremented on each retry)';
COMMENT ON COLUMN receipt_failures.last_attempt_at IS 'Timestamp of most recent failure';
COMMENT ON COLUMN receipt_failures.resolved_at IS 'Timestamp when issue was resolved (NULL if still pending)';
COMMENT ON COLUMN receipt_failures.resolved_by IS 'Admin user who resolved the issue';
COMMENT ON COLUMN receipt_failures.resolution_notes IS 'Notes about how the issue was resolved';

-- Function to increment attempt count on duplicate donation_id
CREATE OR REPLACE FUNCTION increment_receipt_failure_attempt()
RETURNS TRIGGER AS $$
BEGIN
  -- If a failure already exists for this donation, increment attempt count
  UPDATE receipt_failures
  SET 
    attempt_count = attempt_count + 1,
    last_attempt_at = NEW.last_attempt_at,
    error_message = NEW.error_message,
    error_stack = NEW.error_stack,
    error_type = NEW.error_type
  WHERE donation_id = NEW.donation_id
    AND resolved_at IS NULL;
  
  -- If update affected a row, prevent the insert
  IF FOUND THEN
    RETURN NULL;
  END IF;
  
  -- Otherwise, allow the insert
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to handle duplicate failures
CREATE TRIGGER receipt_failure_upsert
  BEFORE INSERT ON receipt_failures
  FOR EACH ROW
  EXECUTE FUNCTION increment_receipt_failure_attempt();

COMMENT ON FUNCTION increment_receipt_failure_attempt() IS 'Automatically increments attempt count when same donation fails again';
COMMENT ON TRIGGER receipt_failure_upsert ON receipt_failures IS 'Prevents duplicate failure records, increments attempt count instead';
