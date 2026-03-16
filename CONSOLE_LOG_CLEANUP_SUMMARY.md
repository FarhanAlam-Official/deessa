# Console Log Cleanup Summary

## Changes Made

Cleaned up unnecessary console logs in the Stripe webhook handler while keeping essential logging for production monitoring and debugging.

## Logs Kept (Essential for Production)

### Error Logs (Always Keep)
- ✅ Payment confirmation failures
- ✅ Receipt generation failures
- ✅ Webhook signature verification failures
- ✅ Missing environment variables
- ✅ Database update failures
- ✅ Conference registration errors
- ✅ Amount/currency mismatches
- ✅ Subscription processing errors

### Success Logs (Keep for Monitoring)
- ✅ Payment confirmed (with donation ID and session ID)
- ✅ Receipt generated (with receipt number)
- ✅ Conference registration confirmed
- ✅ Subscription receipt generated

### Warning Logs (Keep for Observability)
- ✅ Missing donation ID in session
- ✅ Missing donation ID in subscription
- ✅ Session not paid (conference)
- ✅ Payment events table errors

## Logs Removed (Unnecessary Noise)

### Removed Verbose Logs
- ❌ "Starting receipt generation" (redundant - we log success/failure)
- ❌ "Receipt URL" in success logs (not needed for monitoring)
- ❌ "Full result object" in errors (too verbose)
- ❌ Stack traces in non-critical errors (clutters logs)
- ❌ "Payment session expired (no action)" (expected behavior)
- ❌ "Already processed" for idempotency (expected behavior)
- ❌ "Unhandled event type" (not actionable)
- ❌ Duplicate information in error messages

### Simplified Messages
- Before: `"Stripe webhook (conference): payment session expired (no action)"`
- After: Removed (silent - expected behavior)

- Before: `"Stripe webhook (conference): already processed"`
- After: Removed (silent - idempotency working as expected)

- Before: `"Stripe webhook: Starting receipt generation for donation X"`
- After: Removed (we log the result, not the start)

- Before: `"customer.subscription.created: No donation ID in subscription metadata", subscription.id`
- After: `"Stripe webhook: No donation ID in subscription metadata"` (cleaner)

## Log Levels Guide

### When to Use Each Level

**console.error()** - Use for:
- Payment processing failures
- Database errors
- Missing required data
- Configuration errors
- Any issue that requires immediate attention

**console.warn()** - Use for:
- Non-critical issues that should be monitored
- Unexpected but handled situations
- Deprecated behavior
- Missing optional data

**console.log()** - Use for:
- Successful operations (payment confirmed, receipt generated)
- Important state changes
- Audit trail events

**Don't Log** - Skip for:
- Expected behavior (idempotency checks passing)
- Verbose debugging info (unless debugging specific issue)
- Redundant information
- Internal implementation details

## Production Log Examples

### Good Logs (After Cleanup)

```
✅ Stripe webhook: Payment confirmed { donationId: 'xxx', sessionId: 'xxx', status: 'confirmed' }
✅ Stripe webhook: Receipt generated { donationId: 'xxx', receiptNumber: 'RCP-2026-00030' }
✅ Stripe webhook (conference): confirmed xxx
```

### Error Logs (Actionable)

```
❌ Stripe webhook: Payment confirmation failed { donationId: 'xxx', sessionId: 'xxx', error: 'xxx' }
❌ Stripe webhook: Receipt generation failed { donationId: 'xxx', reason: 'xxx' }
❌ STRIPE_WEBHOOK_SECRET is not configured
```

### Warning Logs (Monitor)

```
⚠️  Stripe webhook: No donation ID found in session xxx
⚠️  Stripe webhook (conference): session not paid { registrationId: 'xxx', sessionId: 'xxx' }
```

## Benefits of Cleanup

1. **Reduced Log Noise**: Easier to spot real issues in production logs
2. **Faster Debugging**: Only relevant information is logged
3. **Better Performance**: Fewer log writes (minimal impact but cleaner)
4. **Clearer Monitoring**: Success/failure patterns are obvious
5. **Cost Savings**: Fewer log entries in Vercel (if on paid plan with log limits)

## Monitoring Recommendations

### Key Logs to Monitor

1. **Error Rate**: Count of `console.error()` calls
   - Alert if > 5% of webhook calls result in errors

2. **Receipt Generation**: Count of "Receipt generated" vs "Receipt generation failed"
   - Should be 100% success rate

3. **Payment Confirmation**: Count of "Payment confirmed" messages
   - Should match Stripe payment count

4. **Missing Configuration**: Any "not configured" errors
   - Should be 0 in production

### Vercel Log Filters

Use these filters in Vercel Dashboard → Logs:

```
# Show only errors
level:error

# Show receipt issues
"Receipt generation failed" OR "Receipt generation error"

# Show payment confirmations
"Payment confirmed"

# Show configuration issues
"not configured"
```

## Files Modified

- `app/api/webhooks/stripe/route.ts` - Cleaned up console logs
- Removed unused import: `createClient` from `@/lib/supabase/server`

## Testing

After cleanup, verify logs still provide useful information:

1. Make a test donation
2. Check Vercel logs for:
   - ✅ "Payment confirmed" message
   - ✅ "Receipt generated" message
3. Trigger an error (wrong webhook secret)
4. Check Vercel logs for:
   - ✅ Clear error message
   - ✅ Actionable information

## Future Improvements

Consider implementing:

1. **Structured Logging**: Use a logging library (e.g., Pino, Winston) for consistent format
2. **Log Levels**: Environment-based log levels (verbose in dev, minimal in prod)
3. **Log Aggregation**: Send logs to external service (Datadog, Sentry) for better analysis
4. **Metrics**: Track success/failure rates as metrics instead of parsing logs

---

**Summary**: Removed 10+ unnecessary log statements while keeping all essential error, success, and warning logs. Production logs are now cleaner and more actionable.
