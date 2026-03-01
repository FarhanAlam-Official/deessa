/**
 * Rate Limiting Utility - Supabase-backed distributed rate limiting
 * 
 * This module provides distributed rate limiting using Supabase as the storage backend.
 * It's designed for serverless environments where in-memory rate limiting doesn't work
 * across multiple function instances.
 * 
 * Architecture:
 * - Uses Supabase database table `rate_limits` for state storage
 * - Atomic increment via PostgreSQL RPC function `increment_rate_limit`
 * - Sliding window algorithm with automatic expiry
 * - Fail-open strategy (allows requests if rate limiting system fails)
 * 
 * Future Scaling:
 * - For higher throughput (>1000 req/s), consider migrating to Redis/Upstash
 * - Current Supabase implementation is sufficient for <500 donations/month
 * 
 * Requirements: 14.1, 14.2 (Payment Architecture V2)
 */

import { createClient as createServiceClient } from "@supabase/supabase-js"

interface RateLimitConfig {
  identifier: string // Composite key: "endpoint:type:value" (e.g., "receipt-download:ip:192.168.1.1")
  maxAttempts: number // Max requests allowed in window
  windowMinutes: number // Time window in minutes (sliding window)
}

interface RateLimitResult {
  allowed: boolean // Whether the request should be allowed
  remaining: number // Remaining requests in current window
  resetAt: Date | null // When the rate limit window resets
}

function createServiceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase service role credentials")
  }
  return createServiceClient(supabaseUrl, serviceRoleKey)
}

/**
 * Check and increment rate limit using Supabase.
 * Creates/updates a rate_limits table entry with TTL.
 *
 * Table structure (must be created manually or via migration):
 * - identifier: text (primary key)
 * - attempts: integer
 * - expires_at: timestamptz
 *
 * Required PostgreSQL function (run once as a migration):
 *
 *   CREATE OR REPLACE FUNCTION increment_rate_limit(
 *     p_identifier    text,
 *     p_window_minutes integer
 *   ) RETURNS TABLE(attempts integer, expires_at timestamptz) AS $$
 *   DECLARE
 *     v_now         timestamptz := NOW();
 *     v_new_expires timestamptz := v_now + (p_window_minutes * INTERVAL '1 minute');
 *   BEGIN
 *     INSERT INTO rate_limits (identifier, attempts, expires_at)
 *     VALUES (p_identifier, 1, v_new_expires)
 *     ON CONFLICT (identifier) DO UPDATE
 *       SET
 *         attempts   = CASE
 *                        WHEN rate_limits.expires_at < v_now THEN 1
 *                        ELSE rate_limits.attempts + 1
 *                      END,
 *         expires_at = CASE
 *                        WHEN rate_limits.expires_at < v_now THEN v_new_expires
 *                        ELSE rate_limits.expires_at
 *                      END
 *     RETURNING rate_limits.attempts, rate_limits.expires_at;
 *   END;
 *   $$ LANGUAGE plpgsql SECURITY DEFINER;
 *
 *   GRANT EXECUTE ON FUNCTION increment_rate_limit TO service_role;
 */
export async function checkRateLimit(config: RateLimitConfig): Promise<RateLimitResult> {
  const supabase = createServiceRoleClient()

  try {
    // Single atomic upsert: increments attempts (or resets if window expired)
    // and returns the resulting row — eliminates the TOCTOU race.
    const { data, error } = await supabase.rpc("increment_rate_limit", {
      p_identifier:     config.identifier,
      p_window_minutes: config.windowMinutes,
    })

    if (error) {
      console.error("Rate limit RPC error:", error)
      // Fail open in case of DB issues (allow request)
      return { allowed: true, remaining: config.maxAttempts, resetAt: null }
    }

    // rpc() with RETURNS TABLE comes back as an array; take the first row.
    const row = Array.isArray(data) ? data[0] : data
    if (!row) {
      console.error("Rate limit RPC returned no row")
      return { allowed: true, remaining: config.maxAttempts, resetAt: null }
    }

    const attempts: number = row.attempts ?? 1
    const resetAt = new Date(row.expires_at)
    const allowed  = attempts <= config.maxAttempts
    const remaining = Math.max(0, config.maxAttempts - attempts)

    return { allowed, remaining, resetAt }
  } catch (err) {
    console.error("Rate limit unexpected error:", err)
    // Fail open - allow request if rate limiting system fails
    return { allowed: true, remaining: config.maxAttempts, resetAt: null }
  }
}

/**
 * Extract client IP from request headers.
 * Checks x-forwarded-for (Vercel/proxy) then x-real-ip, returns null if unavailable.
 */
export function getClientIP(request: Request): string | null {
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) {
    // x-forwarded-for can be "client, proxy1, proxy2" - take first
    return forwarded.split(",")[0].trim()
  }

  const realIp = request.headers.get("x-real-ip")
  if (realIp) return realIp.trim()

  return null
}
