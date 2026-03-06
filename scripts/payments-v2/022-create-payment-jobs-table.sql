-- Payment Architecture V2: Payment Jobs Table
-- Async job queue for post-payment processing (receipt generation, email sending)
-- Supports retry logic with exponential backoff

CREATE TABLE IF NOT EXISTS payment_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donation_id UUID NOT NULL REFERENCES donations(id) ON DELETE CASCADE,
  job_type TEXT NOT NULL, -- 'receipt_generation', 'email_send'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  attempts INT NOT NULL DEFAULT 0,
  max_attempts INT NOT NULL DEFAULT 3,
  payload JSONB,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  next_retry_at TIMESTAMPTZ,
  
  CONSTRAINT check_job_status CHECK (status IN ('pending', 'processing', 'completed', 'failed'))
);

-- Composite index on status and next_retry_at for efficient job queue polling
CREATE INDEX IF NOT EXISTS idx_payment_jobs_status ON payment_jobs(status, next_retry_at);

-- Index on donation_id for looking up jobs by donation
CREATE INDEX IF NOT EXISTS idx_payment_jobs_donation ON payment_jobs(donation_id);

-- Index on created_at for time-based queries and monitoring
CREATE INDEX IF NOT EXISTS idx_payment_jobs_created ON payment_jobs(created_at DESC);

-- Add comments for documentation
COMMENT ON TABLE payment_jobs IS 'Async job queue for post-payment processing with retry support';
COMMENT ON COLUMN payment_jobs.job_type IS 'Type of job: receipt_generation or email_send';
COMMENT ON COLUMN payment_jobs.status IS 'Current job status: pending, processing, completed, or failed';
COMMENT ON COLUMN payment_jobs.attempts IS 'Number of processing attempts (for retry logic)';
COMMENT ON COLUMN payment_jobs.next_retry_at IS 'Timestamp for next retry attempt (exponential backoff)';
COMMENT ON COLUMN payment_jobs.payload IS 'Job-specific data (e.g., email template variables)';
