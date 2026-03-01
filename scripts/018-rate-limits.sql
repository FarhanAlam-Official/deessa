-- Migration: Create rate_limits table for API rate limiting
-- Description: Tracks API request attempts with TTL-based expiry
-- Usage: Used by lib/rate-limit.ts for resend-payment-link and other public endpoints

-- Create rate_limits table
CREATE TABLE IF NOT EXISTS public.rate_limits (
  identifier TEXT PRIMARY KEY,
  attempts INTEGER NOT NULL DEFAULT 1,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient cleanup of expired entries
CREATE INDEX IF NOT EXISTS idx_rate_limits_expires_at ON public.rate_limits(expires_at);

-- Enable Row Level Security
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Policy: Service role only (API routes use service role client)
CREATE POLICY "Service role full access" ON public.rate_limits
  FOR ALL
  USING (auth.role() = 'service_role');

-- Optional: Scheduled cleanup of expired entries (run daily)
-- This can be set up as a Supabase edge function or cron job
-- Example cleanup query (can be run manually or scheduled):
-- DELETE FROM public.rate_limits WHERE expires_at < NOW() - INTERVAL '1 day';

COMMENT ON TABLE public.rate_limits IS 'Stores API rate limiting state with TTL expiry';
COMMENT ON COLUMN public.rate_limits.identifier IS 'Composite key: "resend-payment:ip:192.168.1.1" or "resend-payment:rid:abc-123"';
COMMENT ON COLUMN public.rate_limits.attempts IS 'Number of requests made within the time window';
COMMENT ON COLUMN public.rate_limits.expires_at IS 'When this rate limit window expires (TTL)';
