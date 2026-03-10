-- Payment Architecture V2: Email Failures Table (MVP Error Tracking)
-- Tracks email send failures for inline processing approach
-- Enables admin visibility and manual resend workflow

CREATE TABLE IF NOT EXISTS email_failures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donation_id UUID NOT NULL REFERENCES donations(id) ON DELETE CASCADE,
  error_type TEXT NOT NULL, -- 'smtp_failed', 'timeout', 'auth_failed', 'network_error', 'unexpected_error'
  error_message TEXT NOT NULL,
  error_stack TEXT,
  recipient_email TEXT, -- Email address that failed to receive
  attempt_count INT NOT NULL DEFAULT 1,
  last_attempt_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT, -- Admin user ID or email who resolved the issue
  resolution_notes TEXT, -- Optional notes about how the issue was resolved
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT check_error_type CHECK (error_type IN ('smtp_failed', 'timeout', 'auth_failed', 'network_error', 'unexpected_error'))
);

-- Index on donation_id for looking up failures by donation
CREATE INDEX IF NOT EXISTS idx_email_failures_donation ON email_failures(donation_id);

-- Partial index on unresolved failures for admin dashboard
CREATE INDEX IF NOT EXISTS idx_email_failures_unresolved ON email_failures(resolved_at) 
  WHERE resolved_at IS NULL;

-- Index on created_at for time-based queries and monitoring
CREATE INDEX IF NOT EXISTS idx_email_failures_created ON email_failures(created_at DESC);

-- Index on error_type for filtering by error category
CREATE INDEX IF NOT EXISTS idx_email_failures_error_type ON email_failures(error_type);

-- Index on recipient_email for tracking problematic email addresses
CREATE INDEX IF NOT EXISTS idx_email_failures_recipient ON email_failures(recipient_email);

-- Add comments for documentation
COMMENT ON TABLE email_failures IS 'Tracks email send failures for MVP inline processing approach';
COMMENT ON COLUMN email_failures.error_type IS 'Category of error: smtp_failed, timeout, auth_failed, network_error, or unexpected_error';
COMMENT ON COLUMN email_failures.error_message IS 'Human-readable error message';
COMMENT ON COLUMN email_failures.error_stack IS 'Full error stack trace for debugging';
COMMENT ON COLUMN email_failures.recipient_email IS 'Email address that failed to receive the message';
COMMENT ON COLUMN email_failures.attempt_count IS 'Number of failed attempts (incremented on each retry)';
COMMENT ON COLUMN email_failures.last_attempt_at IS 'Timestamp of most recent failure';
COMMENT ON COLUMN email_failures.resolved_at IS 'Timestamp when issue was resolved (NULL if still pending)';
COMMENT ON COLUMN email_failures.resolved_by IS 'Admin user who resolved the issue';
COMMENT ON COLUMN email_failures.resolution_notes IS 'Notes about how the issue was resolved';

-- Function to increment attempt count on duplicate donation_id
CREATE OR REPLACE FUNCTION increment_email_failure_attempt()
RETURNS TRIGGER AS $$
BEGIN
  -- If a failure already exists for this donation, increment attempt count
  UPDATE email_failures
  SET 
    attempt_count = attempt_count + 1,
    last_attempt_at = NEW.last_attempt_at,
    error_message = NEW.error_message,
    error_stack = NEW.error_stack,
    error_type = NEW.error_type,
    recipient_email = NEW.recipient_email
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
CREATE TRIGGER email_failure_upsert
  BEFORE INSERT ON email_failures
  FOR EACH ROW
  EXECUTE FUNCTION increment_email_failure_attempt();

COMMENT ON FUNCTION increment_email_failure_attempt() IS 'Automatically increments attempt count when same donation fails again';
COMMENT ON TRIGGER email_failure_upsert ON email_failures IS 'Prevents duplicate failure records, increments attempt count instead';
