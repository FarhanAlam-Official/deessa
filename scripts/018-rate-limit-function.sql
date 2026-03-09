-- Migration: Create increment_rate_limit RPC function
-- Description: Atomic rate limit increment with sliding window
-- Required by: lib/rate-limit.ts

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS increment_rate_limit(text, integer);

-- Create the rate limit increment function
CREATE OR REPLACE FUNCTION increment_rate_limit(
  p_identifier text,
  p_window_minutes integer
) 
RETURNS TABLE(attempts integer, expires_at timestamptz) 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
DECLARE
  v_now timestamptz := NOW();
  v_new_expires timestamptz := v_now + (p_window_minutes * INTERVAL '1 minute');
BEGIN
  -- Atomic upsert: increment or reset based on expiry.
  -- RETURN QUERY is required so the result has a destination (PostgreSQL 42601).
  RETURN QUERY
  INSERT INTO rate_limits (identifier, attempts, expires_at)
  VALUES (p_identifier, 1, v_new_expires)
  ON CONFLICT (identifier) DO UPDATE
    SET
      attempts = CASE
                   WHEN rate_limits.expires_at < v_now THEN 1
                   ELSE rate_limits.attempts + 1
                 END,
      expires_at = CASE
                     WHEN rate_limits.expires_at < v_now THEN v_new_expires
                     ELSE rate_limits.expires_at
                   END
  RETURNING rate_limits.attempts, rate_limits.expires_at;
END;
$$;

-- Grant execute permission to service_role
GRANT EXECUTE ON FUNCTION increment_rate_limit TO service_role;

-- Add comment
COMMENT ON FUNCTION increment_rate_limit IS 'Atomically increments rate limit attempts with sliding window expiry';
