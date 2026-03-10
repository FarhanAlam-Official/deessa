# Rate Limiting Implementation

## Overview

The payment system uses **Supabase-backed distributed rate limiting** to protect API endpoints from abuse. This implementation is designed for serverless environments where in-memory rate limiting doesn't work across multiple function instances.

## Architecture

### Storage Backend: Supabase Database

- **Table**: `rate_limits` (created by migration `018-rate-limits.sql`)
- **Algorithm**: Sliding window with automatic expiry
- **Strategy**: Fail-open (allows requests if rate limiting system fails)
- **Atomicity**: PostgreSQL RPC function ensures race-condition-free increments

### Why Supabase Instead of Redis?

**Current Implementation (MVP):**
- ✅ Works on Vercel Hobby plan (no additional cost)
- ✅ No external dependencies
- ✅ Sufficient for <500 donations/month
- ✅ Leverages existing Supabase infrastructure

**Future Scaling (When Needed):**
- For >1000 requests/second, consider migrating to Redis/Upstash
- Current implementation handles typical donation site traffic well
- Migration path documented in design.md

## Database Schema

```sql
CREATE TABLE public.rate_limits (
  identifier TEXT PRIMARY KEY,
  attempts INTEGER NOT NULL DEFAULT 1,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_rate_limits_expires_at ON public.rate_limits(expires_at);
```

### RPC Function

```sql
CREATE OR REPLACE FUNCTION increment_rate_limit(
  p_identifier    text,
  p_window_minutes integer
) RETURNS TABLE(attempts integer, expires_at timestamptz) AS $$
DECLARE
  v_now         timestamptz := NOW();
  v_new_expires timestamptz := v_now + (p_window_minutes * INTERVAL '1 minute');
BEGIN
  INSERT INTO rate_limits (identifier, attempts, expires_at)
  VALUES (p_identifier, 1, v_new_expires)
  ON CONFLICT (identifier) DO UPDATE
    SET
      attempts   = CASE
                     WHEN rate_limits.expires_at < v_now THEN 1
                     ELSE rate_limits.attempts + 1
                   END,
      expires_at = CASE
                     WHEN rate_limits.expires_at < v_now THEN v_new_expires
                     ELSE rate_limits.expires_at
                   END
  RETURNING rate_limits.attempts, rate_limits.expires_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Usage

### Basic Example

```typescript
import { checkRateLimit, getClientIP } from "@/lib/rate-limit"

export async function POST(request: Request) {
  // 1. Apply rate limiting
  const clientIP = getClientIP(request)
  const rateLimitIdentifier = clientIP 
    ? `my-endpoint:ip:${clientIP}`
    : `my-endpoint:ip:unknown`
  
  const rateLimit = await checkRateLimit({
    identifier: rateLimitIdentifier,
    maxAttempts: 10,
    windowMinutes: 1,
  })
  
  if (!rateLimit.allowed) {
    return Response.json(
      { 
        error: "Rate limit exceeded. Please try again later.",
        retryAfter: rateLimit.resetAt?.toISOString()
      },
      { 
        status: 429,
        headers: {
          "Retry-After": Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 1000).toString()
        }
      }
    )
  }

  // 2. Process request
  // ...
}
```

### Identifier Patterns

Use descriptive composite keys:

```typescript
// By IP address
`receipt-download:ip:192.168.1.1`

// By user ID
`receipt-resend:user:abc-123`

// By registration ID
`resend-payment:rid:xyz-789`

// By endpoint and IP
`stripe-verify:ip:192.168.1.1`
```

## Protected Endpoints

### Receipt Endpoints

| Endpoint | Limit | Window | Identifier Pattern |
|----------|-------|--------|-------------------|
| `/api/receipts/download` | 10 req | 1 min | `receipt-download:ip:{ip}` |
| `/api/receipts/resend` | 10 req (100 for admins) | 60 min | `receipt-resend:user:{userId}` or `receipt-resend:ip:{ip}` |

### Payment Verification Endpoints

| Endpoint | Limit | Window | Identifier Pattern |
|----------|-------|--------|-------------------|
| `/api/payments/stripe/verify` | 10 req | 1 min | `stripe-verify:ip:{ip}` |
| `/api/payments/khalti/verify` | 10 req | 1 min | `khalti-verify:ip:{ip}` |
| `/api/payments/esewa/success` | 20 req | 1 min | `esewa-success:ip:{ip}` |
| `/api/payments/esewa/failure` | 20 req | 1 min | `esewa-failure:ip:{ip}` |

### Conference Endpoints

| Endpoint | Limit | Window | Identifier Pattern |
|----------|-------|--------|-------------------|
| `/api/conference/verify-registration` | 10 req | 1 min | `verify-registration:ip:{ip}` |
| `/api/conference/resend-payment-link` | 5 req (IP) + 3 req (RID) | 60 min | `resend-payment:ip:{ip}` and `resend-payment:rid:{rid}` |

## Configuration

### Rate Limit Parameters

```typescript
interface RateLimitConfig {
  identifier: string      // Composite key
  maxAttempts: number     // Max requests in window
  windowMinutes: number   // Time window in minutes
}
```

### Recommended Limits

**Public Endpoints (Unauthenticated):**
- Read operations: 10-20 requests/minute
- Write operations: 5-10 requests/minute

**Authenticated Endpoints:**
- Regular users: 10-50 requests/minute
- Admin users: 100-500 requests/minute

**Payment Callbacks:**
- Higher limits (20-50 req/min) to accommodate legitimate retries
- Still protects against brute force attacks

## Error Responses

### 429 Too Many Requests

```json
{
  "error": "Rate limit exceeded. Please try again later.",
  "retryAfter": "2026-03-02T10:30:00.000Z"
}
```

**Headers:**
```
HTTP/1.1 429 Too Many Requests
Retry-After: 60
```

## Monitoring

### Database Queries

**Check current rate limits:**
```sql
SELECT identifier, attempts, expires_at
FROM rate_limits
WHERE expires_at > NOW()
ORDER BY attempts DESC
LIMIT 20;
```

**Find rate limit violations:**
```sql
SELECT identifier, attempts, expires_at
FROM rate_limits
WHERE attempts > 10
  AND expires_at > NOW()
ORDER BY attempts DESC;
```

**Cleanup expired entries:**
```sql
DELETE FROM rate_limits
WHERE expires_at < NOW() - INTERVAL '1 day';
```

### Metrics to Track

1. **Rate limit hit rate**: % of requests that hit rate limits
2. **Top rate-limited IPs**: Identify potential attackers
3. **False positives**: Legitimate users hitting limits
4. **System failures**: Rate limiter errors (should be rare)

## Fail-Open Strategy

The rate limiter uses a **fail-open** strategy:

```typescript
try {
  const result = await checkRateLimit(config)
  // ...
} catch (error) {
  console.error("Rate limit error:", error)
  // Allow request if rate limiting system fails
  return { allowed: true, remaining: config.maxAttempts, resetAt: null }
}
```

**Rationale:**
- Prevents payment system outage if rate limiting fails
- Logs errors for investigation
- Better to allow some abuse than block legitimate payments

## Maintenance

### Scheduled Cleanup

Set up a cron job to clean up expired entries:

```sql
-- Run daily
DELETE FROM rate_limits
WHERE expires_at < NOW() - INTERVAL '1 day';
```

**Options:**
1. Supabase Edge Function (scheduled)
2. Vercel Cron (if on Pro plan)
3. Manual cleanup via admin interface

### Adjusting Limits

To adjust rate limits for an endpoint:

1. Update the `maxAttempts` parameter in the endpoint code
2. Deploy the change
3. Monitor for false positives
4. Adjust as needed based on traffic patterns

## Future Enhancements

### Phase 1 (Current): Supabase-backed
- ✅ Distributed rate limiting
- ✅ Sliding window algorithm
- ✅ Fail-open strategy
- ✅ Works on Vercel Hobby plan

### Phase 2 (When Scaling): Redis/Upstash
- Migrate to Redis for higher throughput (>1000 req/s)
- Use `@upstash/ratelimit` library
- Maintain same API interface
- Add to environment variables:
  ```bash
  UPSTASH_REDIS_URL=...
  UPSTASH_REDIS_TOKEN=...
  ```

### Phase 3 (Advanced): Multi-tier Limits
- Per-user limits (authenticated)
- Per-IP limits (unauthenticated)
- Per-endpoint global limits
- Dynamic limits based on system load

## Troubleshooting

### Issue: Legitimate users hitting rate limits

**Solution:**
1. Check if limit is too restrictive
2. Increase `maxAttempts` or `windowMinutes`
3. Consider user-based limits instead of IP-based

### Issue: Rate limiter not working

**Checklist:**
1. Verify `rate_limits` table exists
2. Verify `increment_rate_limit` RPC function exists
3. Check Supabase service role credentials
4. Review error logs for RPC failures

### Issue: Database performance degradation

**Solution:**
1. Run cleanup query to remove expired entries
2. Verify index on `expires_at` exists
3. Consider archiving old rate limit data
4. If persistent, migrate to Redis

## Security Considerations

### IP Spoofing

The system uses `x-forwarded-for` header for IP detection:

```typescript
export function getClientIP(request: Request): string | null {
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) {
    return forwarded.split(",")[0].trim()
  }
  return request.headers.get("x-real-ip")?.trim() || null
}
```

**Limitations:**
- Relies on proxy headers (Vercel, Cloudflare)
- Can be spoofed in some configurations
- Mitigated by using multiple identifiers (IP + user ID)

### Distributed Attacks

For distributed attacks from many IPs:
- Consider global endpoint limits
- Implement CAPTCHA for suspicious patterns
- Use Cloudflare or similar WAF

## References

- Migration: `scripts/018-rate-limits.sql`
- Utility: `lib/rate-limit.ts`
- Requirements: 14.1, 14.2, 14.3, 14.4, 14.5 (Payment Architecture V2)
- Design: `docs/payments-v2/design.md` (Security Model section)
