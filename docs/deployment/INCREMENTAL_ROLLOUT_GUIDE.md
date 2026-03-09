# Incremental V2 Rollout Guide - Payment Architecture V2

## Overview

This guide provides step-by-step instructions for incrementally enabling Payment Architecture V2 in production. The incremental approach minimizes risk by gradually increasing traffic to V2 while monitoring for issues.

## Prerequisites

- ✅ Production deployment completed (Task 28.4)
- ✅ V1 flow verified working in production
- ✅ No critical errors in first 2 hours
- ✅ Team approval for V2 enablement
- ✅ Monitoring dashboards ready
- ✅ Rollback plan prepared

## Rollout Strategy

### Phase 1: 10% Traffic (Day 1)
- Enable V2 for 10% of donations
- Monitor for 4-6 hours
- Rollback if error rate > 5%

### Phase 2: 25% Traffic (Day 2)
- Increase to 25% if Phase 1 successful
- Monitor for 4-6 hours
- Rollback if error rate > 3%

### Phase 3: 50% Traffic (Day 3)
- Increase to 50% if Phase 2 successful
- Monitor for 6-8 hours
- Rollback if error rate > 2%

### Phase 4: 75% Traffic (Day 4)
- Increase to 75% if Phase 3 successful
- Monitor for 6-8 hours
- Rollback if error rate > 1%

### Phase 5: 100% Traffic (Day 5)
- Increase to 100% if Phase 4 successful
- Monitor for 24 hours
- Plan V1 code removal

## Implementation Options

### Option 1: Feature Flag (Recommended)

**Pros:**
- Simple to implement
- Easy rollback
- No code changes needed

**Cons:**
- All-or-nothing (not true percentage-based)
- Requires redeployment to change

**Implementation:**
```bash
# Enable V2 globally
vercel env add PAYMENT_V2_ENABLED true production
vercel --prod
```

### Option 2: Percentage-Based Rollout (Advanced)

**Pros:**
- True percentage-based control
- Gradual rollout
- Can adjust without redeployment

**Cons:**
- Requires code changes
- More complex implementation

**Implementation:**

1. Add percentage-based logic to webhook handlers:

```typescript
// lib/payments/feature-flags.ts
export function shouldUseV2(donationId: string): boolean {
  const rolloutPercentage = parseInt(process.env.V2_ROLLOUT_PERCENTAGE || '0')
  
  if (rolloutPercentage === 0) return false
  if (rolloutPercentage === 100) return true
  
  // Use donation ID hash for consistent routing
  const hash = createHash('md5').update(donationId).digest('hex')
  const hashValue = parseInt(hash.substring(0, 8), 16)
  const bucket = hashValue % 100
  
  return bucket < rolloutPercentage
}
```

2. Update webhook handlers:

```typescript
// app/api/webhooks/stripe/route.ts
export async function POST(request: Request) {
  // ... signature verification ...
  
  const donationId = extractDonationId(event)
  
  if (shouldUseV2(donationId)) {
    // Use V2 flow
    return await handleV2(event)
  } else {
    // Use V1 flow
    return await handleV1(event)
  }
}
```

3. Set rollout percentage:

```bash
vercel env add V2_ROLLOUT_PERCENTAGE 10 production
vercel --prod
```

### Option 3: Provider-Based Rollout

**Pros:**
- Test V2 with one provider first
- Lower risk
- Easy to understand

**Cons:**
- Not percentage-based
- Requires code changes

**Implementation:**

```typescript
// lib/payments/feature-flags.ts
export function shouldUseV2(provider: string): boolean {
  const v2Providers = (process.env.V2_ENABLED_PROVIDERS || '').split(',')
  return v2Providers.includes(provider)
}
```

```bash
# Enable V2 for Stripe only
vercel env add V2_ENABLED_PROVIDERS stripe production

# Enable V2 for Stripe and Khalti
vercel env add V2_ENABLED_PROVIDERS stripe,khalti production

# Enable V2 for all providers
vercel env add V2_ENABLED_PROVIDERS stripe,khalti,esewa production
```

## Recommended Approach: Simple Feature Flag

For MVP deployment, we recommend **Option 1: Feature Flag** with manual monitoring between phases.

## Rollout Procedure

### Phase 1: Enable V2 (10% - Simulated)

**Time: Day 1, 4-6 hours**

1. **Pre-enablement checks:**
   - [ ] V1 working normally
   - [ ] No stuck donations
   - [ ] No recent errors
   - [ ] Team ready to monitor

2. **Enable V2:**
   ```bash
   # Set feature flag
   vercel env add PAYMENT_V2_ENABLED true production
   
   # Redeploy
   vercel --prod
   ```

3. **Immediate verification (first 15 minutes):**
   - [ ] Health check shows V2 enabled
   - [ ] No spike in errors
   - [ ] Webhooks processing
   - [ ] Donations confirming

4. **Continuous monitoring (4-6 hours):**
   - [ ] Check metrics every 30 minutes
   - [ ] Review logs hourly
   - [ ] Verify receipts generating
   - [ ] Check emails sending

5. **Success criteria:**
   - [ ] Error rate < 5%
   - [ ] Payment success rate > 95%
   - [ ] Receipt generation rate > 95%
   - [ ] No critical issues

6. **If success criteria not met:**
   - [ ] Rollback immediately
   - [ ] Document issues
   - [ ] Fix issues
   - [ ] Retry Phase 1

### Phase 2-5: Increase Traffic

**Note:** Since we're using a simple feature flag (all-or-nothing), we'll monitor V2 at 100% for extended periods before declaring success.

**Modified Rollout Plan:**

1. **Day 1-2: Enable V2, Monitor Closely**
   - Enable V2 for all traffic
   - Monitor every 30 minutes for first 6 hours
   - Monitor every 2 hours for next 18 hours

2. **Day 3-4: Continue Monitoring**
   - Monitor every 4 hours
   - Review daily metrics
   - Check for any anomalies

3. **Day 5-7: Stabilization**
   - Monitor daily
   - Verify all metrics stable
   - Prepare for V1 code removal

## Monitoring Checklist

### Real-Time Metrics (Every 30 minutes, first 6 hours)

- [ ] Error rate
- [ ] Payment success rate
- [ ] Webhook response time
- [ ] Confirmation latency
- [ ] Receipt generation rate
- [ ] Email send rate

### Database Checks

```sql
-- V2 adoption rate (if using percentage-based)
SELECT 
  COUNT(*) FILTER (WHERE payment_status = 'CONFIRMED') as confirmed,
  COUNT(*) FILTER (WHERE payment_status = 'REVIEW') as review,
  COUNT(*) FILTER (WHERE payment_status = 'FAILED') as failed,
  COUNT(*) FILTER (WHERE payment_status = 'PENDING') as pending
FROM donations 
WHERE created_at > NOW() - INTERVAL '1 hour';

-- Recent payment events
SELECT event_type, COUNT(*) 
FROM payment_events 
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY event_type;

-- Stuck donations
SELECT COUNT(*) FROM donations 
WHERE payment_status = 'PENDING' 
AND created_at < NOW() - INTERVAL '1 hour';

-- Recent failures
SELECT COUNT(*) FROM receipt_failures 
WHERE created_at > NOW() - INTERVAL '1 hour';

SELECT COUNT(*) FROM email_failures 
WHERE created_at > NOW() - INTERVAL '1 hour';

-- REVIEW status donations (should be rare)
SELECT COUNT(*) FROM donations 
WHERE payment_status = 'REVIEW' 
AND created_at > NOW() - INTERVAL '24 hours';
```

### Log Monitoring

```bash
# Follow production logs
vercel logs --prod --follow

# Filter for errors
vercel logs --prod | grep -i error

# Filter for V2-specific logs
vercel logs --prod | grep -i "paymentservice"
```

## Rollback Procedure

### Immediate Rollback (< 1 hour)

If critical issues detected:

1. **Disable V2:**
   ```bash
   vercel env add PAYMENT_V2_ENABLED false production
   vercel --prod
   ```

2. **Verify rollback:**
   ```bash
   curl https://production-url/api/health | jq '.features.paymentV2Enabled'
   # Should return: false
   ```

3. **Monitor V1:**
   - Verify V1 working normally
   - Check no stuck donations
   - Review error rates

4. **Document issues:**
   - What went wrong
   - Error messages
   - Affected donations
   - Metrics at time of rollback

### Gradual Rollback (> 1 hour)

If non-critical issues detected:

1. **Assess severity:**
   - Is it affecting all donations?
   - Is it provider-specific?
   - Is it intermittent?

2. **Consider partial rollback:**
   - Disable V2 for specific provider
   - Reduce rollout percentage
   - Fix issue and retry

3. **Full rollback if needed:**
   - Follow immediate rollback procedure

## Success Criteria

### Phase Completion Criteria

Each phase is considered successful if:

- [ ] Error rate < target threshold
- [ ] Payment success rate > 99%
- [ ] Receipt generation rate > 98%
- [ ] Email send rate > 95%
- [ ] Webhook response time < 2s
- [ ] Confirmation latency < 1s
- [ ] No critical issues
- [ ] No stuck donations
- [ ] REVIEW status donations < 1%

### Overall Rollout Success

V2 rollout is considered successful if:

- [ ] All phases completed
- [ ] Metrics stable for 7 days
- [ ] No critical issues
- [ ] Team consensus
- [ ] Customer feedback positive (if any)

## Post-Rollout Tasks

After successful 100% rollout:

1. **Monitor for 7 days:**
   - [ ] Daily metric reviews
   - [ ] Weekly team sync
   - [ ] Document any issues

2. **Prepare V1 removal:**
   - [ ] Plan V1 code removal (Task 28.6)
   - [ ] Identify deprecated code
   - [ ] Schedule removal window

3. **Documentation:**
   - [ ] Update runbooks
   - [ ] Document lessons learned
   - [ ] Update architecture diagrams

## Rollout Decision Matrix

| Metric | Target | Action if Below Target |
|--------|--------|------------------------|
| Error Rate | < 1% | Investigate, consider rollback if > 5% |
| Payment Success | > 99% | Investigate immediately, rollback if < 95% |
| Receipt Generation | > 98% | Investigate, not critical for rollback |
| Email Send | > 95% | Investigate, not critical for rollback |
| Webhook Response | < 2s | Investigate, optimize if > 3s |
| Confirmation Latency | < 1s | Investigate, optimize if > 2s |

## Communication Plan

### Before Rollout
- [ ] Notify team of rollout schedule
- [ ] Prepare status update template
- [ ] Set up monitoring alerts

### During Rollout
- [ ] Hourly status updates (first 6 hours)
- [ ] Immediate notification of issues
- [ ] Daily summary reports

### After Rollout
- [ ] Final status report
- [ ] Lessons learned document
- [ ] Celebrate success! 🎉

## Rollout Log Template

```
# V2 Incremental Rollout Log

## Phase 1: 10% Traffic
- Start Time: [timestamp]
- End Time: [timestamp]
- Status: SUCCESS / FAILED / ROLLED BACK
- Error Rate: [percentage]
- Payment Success Rate: [percentage]
- Issues: [list any issues]
- Notes: [additional notes]

## Phase 2: 25% Traffic
- Start Time: [timestamp]
- End Time: [timestamp]
- Status: SUCCESS / FAILED / ROLLED BACK
- Error Rate: [percentage]
- Payment Success Rate: [percentage]
- Issues: [list any issues]
- Notes: [additional notes]

[Continue for all phases...]

## Final Status
- Rollout Complete: YES / NO
- Total Duration: [hours/days]
- Total Donations Processed: [count]
- Overall Success Rate: [percentage]
- Recommendation: PROCEED TO V1 REMOVAL / CONTINUE MONITORING / ROLLBACK

## Sign-Off
- Completed By: _________________
- Date: _________________
- Approved By: _________________
```

---

**Last Updated:** 2024-01-01
**Version:** 2.0.0
