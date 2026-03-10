# Payment System Monitoring & Alerting

This directory contains the monitoring and alerting infrastructure for the Payment Architecture V2 system.

## Components

### 1. Metrics Collection (`metrics.ts`)

Collects payment system metrics across three categories:

- **Confirmation Metrics**: Success rate, latency, errors by provider
- **Job Metrics**: Receipt and email processing success rates
- **State Metrics**: Donation counts by status, age of pending/review donations

**Usage:**

```typescript
import { collectMetrics, formatMetrics } from '@/lib/monitoring/metrics'

// Collect metrics for the last 60 minutes
const metrics = await collectMetrics({ timeWindowMinutes: 60 })

// Format for display
console.log(formatMetrics(metrics))
```

### 2. Alerting System (`alerts.ts`)

Sends alerts to administrators when issues are detected:

- **REVIEW Status Alerts**: Immediate notification when donation enters REVIEW
- **Review Escalation Alerts**: Escalation after 24 hours without resolution
- **Failure Rate Alerts**: Webhook, confirmation, or job failure rate > threshold
- **Stuck Donation Alerts**: Pending > 1 hour, Review > 24 hours
- **Performance Alerts**: Confirmation latency > 1s

**Alert Thresholds:**

```typescript
{
  webhookFailureRate: 5,      // Alert when > 5%
  jobFailureRate: 10,          // Alert when > 10%
  confirmationLatency: 1000,   // Alert when > 1s
  pendingDonationAge: 60,      // Alert when > 1 hour
  reviewDonationAge: 1440,     // Alert when > 24 hours
  reviewEscalationHours: 24,   // Escalate after 24 hours
}
```

**Usage:**

```typescript
import { sendReviewAlert, sendStuckDonationAlert } from '@/lib/monitoring/alerts'

// Send REVIEW status alert
await sendReviewAlert({
  donationId: 'abc-123',
  amount: 100,
  currency: 'USD',
  provider: 'stripe',
  reason: 'amount_mismatch',
  expectedAmount: 100,
  actualAmount: 95,
})

// Check metrics and send alerts automatically
import { checkMetricsAndAlert } from '@/lib/monitoring/alerts'
await checkMetricsAndAlert(5) // Check last 5 minutes
```

## Cron Endpoints

Three cron endpoints are provided for periodic monitoring:

### 1. Check Review Escalations

**Endpoint:** `GET /api/cron/check-review-escalations`

**Purpose:** Check for review donations > 24 hours old and send escalation alerts

**Recommended Schedule:** Every hour

**Example:**

```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://your-domain.com/api/cron/check-review-escalations
```

### 2. Check Failure Rates

**Endpoint:** `GET /api/cron/check-failure-rates?window=5`

**Purpose:** Monitor webhook, confirmation, and job failure rates

**Recommended Schedule:** Every 5 minutes

**Example:**

```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://your-domain.com/api/cron/check-failure-rates?window=5
```

### 3. Check Stuck Donations

**Endpoint:** `GET /api/cron/check-stuck-donations`

**Purpose:** Check for pending (> 1 hour) and review (> 24 hours) donations

**Recommended Schedule:** Every hour

**Example:**

```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://your-domain.com/api/cron/check-stuck-donations
```

## Configuration

### Environment Variables

```bash
# Admin email for alerts (required)
ADMIN_EMAIL=admin@example.com

# Google email configuration (for sending alerts)
GOOGLE_EMAIL=your-email@gmail.com
GOOGLE_APP_PASSWORD=your-app-password

# Cron secret for securing endpoints (optional but recommended)
CRON_SECRET=your-random-secret

# Supabase configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Setting Up Cron Jobs

#### Option 1: Vercel Cron (Requires Pro Plan)

Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/check-failure-rates?window=5",
      "schedule": "*/5 * * * *"
    },
    {
      "path": "/api/cron/check-review-escalations",
      "schedule": "0 * * * *"
    },
    {
      "path": "/api/cron/check-stuck-donations",
      "schedule": "0 * * * *"
    }
  ]
}
```

#### Option 2: External Cron Service (Free)

Use services like:
- [cron-job.org](https://cron-job.org)
- [EasyCron](https://www.easycron.com)
- [Uptime Robot](https://uptimerobot.com) (with monitoring)

Configure each endpoint with:
- URL: `https://your-domain.com/api/cron/[endpoint]`
- Method: GET
- Headers: `Authorization: Bearer YOUR_CRON_SECRET`
- Schedule: As recommended above

#### Option 3: GitHub Actions (Free)

Create `.github/workflows/cron-monitoring.yml`:

```yaml
name: Payment System Monitoring

on:
  schedule:
    # Every 5 minutes
    - cron: '*/5 * * * *'
    # Every hour
    - cron: '0 * * * *'

jobs:
  check-failure-rates:
    runs-on: ubuntu-latest
    steps:
      - name: Check Failure Rates
        run: |
          curl -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            https://your-domain.com/api/cron/check-failure-rates?window=5

  check-escalations:
    runs-on: ubuntu-latest
    if: github.event.schedule == '0 * * * *'
    steps:
      - name: Check Review Escalations
        run: |
          curl -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            https://your-domain.com/api/cron/check-review-escalations

  check-stuck-donations:
    runs-on: ubuntu-latest
    if: github.event.schedule == '0 * * * *'
    steps:
      - name: Check Stuck Donations
        run: |
          curl -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            https://your-domain.com/api/cron/check-stuck-donations
```

## Alert Delivery

Alerts are currently delivered via email using the Gmail SMTP configuration. The system can be extended to support:

### Future Alert Channels

1. **Slack Integration**
   ```typescript
   // Add to alerts.ts
   async function sendSlackAlert(alert: Alert) {
     await fetch(process.env.SLACK_WEBHOOK_URL, {
       method: 'POST',
       body: JSON.stringify({
         text: `[${alert.severity}] ${alert.title}`,
         blocks: [/* formatted alert */]
       })
     })
   }
   ```

2. **PagerDuty Integration**
   ```typescript
   // Add to alerts.ts
   async function sendPagerDutyAlert(alert: Alert) {
     await fetch('https://events.pagerduty.com/v2/enqueue', {
       method: 'POST',
       headers: {
         'Authorization': `Token token=${process.env.PAGERDUTY_TOKEN}`
       },
       body: JSON.stringify({
         routing_key: process.env.PAGERDUTY_ROUTING_KEY,
         event_action: 'trigger',
         payload: {
           summary: alert.title,
           severity: alert.severity,
           source: 'payment-system'
         }
       })
     })
   }
   ```

3. **SMS Alerts (Twilio)**
   ```typescript
   // Add to alerts.ts
   async function sendSMSAlert(alert: Alert) {
     const twilio = require('twilio')(
       process.env.TWILIO_ACCOUNT_SID,
       process.env.TWILIO_AUTH_TOKEN
     )
     
     await twilio.messages.create({
       body: `[${alert.severity}] ${alert.title}`,
       from: process.env.TWILIO_PHONE_NUMBER,
       to: process.env.ADMIN_PHONE_NUMBER
     })
   }
   ```

## Testing

### Manual Testing

Test each alert type manually:

```typescript
// Test REVIEW alert
import { sendReviewAlert } from '@/lib/monitoring/alerts'

await sendReviewAlert({
  donationId: 'test-123',
  amount: 100,
  currency: 'USD',
  provider: 'stripe',
  reason: 'amount_mismatch',
  expectedAmount: 100,
  actualAmount: 95,
})

// Test stuck donation alert
import { sendStuckDonationAlert } from '@/lib/monitoring/alerts'

await sendStuckDonationAlert({
  donationIds: ['test-1', 'test-2'],
  count: 2,
  oldestAgeMinutes: 120,
  status: 'pending',
})
```

### Testing Cron Endpoints

```bash
# Test locally
curl http://localhost:3000/api/cron/check-failure-rates?window=5

# Test with authentication
curl -H "Authorization: Bearer test-secret" \
  http://localhost:3000/api/cron/check-review-escalations
```

## Monitoring Dashboard

For a visual monitoring dashboard, see:
- `app/admin/monitoring/post-payment/page.tsx` (Task 10.6)

The dashboard displays:
- Real-time metrics
- Success rates (24h, 7d, 30d)
- Recent failures with retry actions
- Alert history

## Troubleshooting

### Alerts Not Being Sent

1. Check environment variables:
   ```bash
   echo $ADMIN_EMAIL
   echo $GOOGLE_EMAIL
   echo $GOOGLE_APP_PASSWORD
   ```

2. Test email configuration:
   ```typescript
   import { testGoogleEmailConfiguration } from '@/lib/email/receipt-mailer'
   const result = await testGoogleEmailConfiguration()
   console.log(result)
   ```

3. Check logs for alert errors:
   ```bash
   # Vercel logs
   vercel logs --follow

   # Local logs
   grep "\[ALERT\]" logs/*.log
   ```

### Cron Jobs Not Running

1. Verify cron secret matches:
   ```bash
   # In your cron service, ensure Authorization header matches
   Authorization: Bearer YOUR_CRON_SECRET
   ```

2. Check endpoint accessibility:
   ```bash
   curl https://your-domain.com/api/cron/check-failure-rates
   ```

3. Review cron service logs (external service dashboard)

### High Alert Volume

If receiving too many alerts:

1. Adjust thresholds in `alerts.ts`:
   ```typescript
   export const ALERT_THRESHOLDS = {
     webhookFailureRate: 10, // Increase from 5 to 10
     // ...
   }
   ```

2. Add alert deduplication:
   ```typescript
   // Track recent alerts to avoid duplicates
   const recentAlerts = new Map<string, number>()
   
   function shouldSendAlert(alertKey: string): boolean {
     const lastSent = recentAlerts.get(alertKey)
     if (lastSent && Date.now() - lastSent < 3600000) {
       return false // Don't send if sent within last hour
     }
     recentAlerts.set(alertKey, Date.now())
     return true
   }
   ```

## Best Practices

1. **Set up alerts before going live** - Test all alert types in staging
2. **Monitor alert volume** - Too many alerts = alert fatigue
3. **Adjust thresholds based on traffic** - Higher volume sites may need different thresholds
4. **Use multiple alert channels** - Email + Slack for redundancy
5. **Document alert response procedures** - What to do when each alert fires
6. **Review alerts weekly** - Identify patterns and adjust thresholds
7. **Test alert delivery monthly** - Ensure email/Slack still working

## Requirements Satisfied

This implementation satisfies the following requirements from the spec:

- **Requirement 16.1**: Admin alerts when donation enters REVIEW
- **Requirement 23.1**: Immediate notification for REVIEW status
- **Requirement 23.4**: Escalation after 24 hours
- **Requirement 25.1**: Webhook failure rate alerts (> 5%)
- **Requirement 25.2**: Confirmation latency alerts (> 1s)
- **Requirement 25.5**: Stuck donation alerts (pending > 1h, review > 24h)
