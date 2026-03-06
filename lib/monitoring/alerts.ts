/**
 * Payment Architecture V2 - Alerting System
 * 
 * This module provides alerting utilities for monitoring payment system
 * health and sending notifications to administrators when issues occur.
 * 
 * Alert Types:
 * - REVIEW status alerts (immediate notification)
 * - Failure rate alerts (webhook, confirmation, job failures)
 * - Stuck donation alerts (pending > 1 hour, review > 24 hours)
 * - Performance alerts (latency thresholds)
 */

import { sendReceiptEmail } from '@/lib/email/receipt-mailer'
import { collectMetrics, type PaymentMetrics } from './metrics'
import type { PaymentProvider, DonationStatus } from '@/lib/payments/core/types'

/**
 * Alert severity levels
 */
export type AlertSeverity = 'info' | 'warning' | 'critical'

/**
 * Alert types
 */
export type AlertType =
  | 'review_status'
  | 'review_escalation'
  | 'webhook_failure_rate'
  | 'confirmation_latency'
  | 'job_failure_rate'
  | 'stuck_pending'
  | 'stuck_review'
  | 'system_error'

/**
 * Alert thresholds configuration
 */
export const ALERT_THRESHOLDS = {
  // Failure rate thresholds (percentage)
  webhookFailureRate: 5, // Alert when webhook failure rate > 5%
  jobFailureRate: 10, // Alert when job failure rate > 10%
  
  // Latency thresholds (milliseconds)
  confirmationLatency: 1000, // Alert when confirmation latency > 1s
  
  // Age thresholds (minutes)
  pendingDonationAge: 60, // Alert when pending donations > 1 hour old
  reviewDonationAge: 24 * 60, // Alert when review donations > 24 hours old
  
  // Escalation thresholds
  reviewEscalationHours: 24, // Escalate review after 24 hours
} as const

/**
 * Alert payload interface
 */
export interface Alert {
  type: AlertType
  severity: AlertSeverity
  title: string
  message: string
  metadata?: Record<string, unknown>
  timestamp: string
}

/**
 * REVIEW status alert payload
 */
export interface ReviewAlert {
  donationId: string
  amount: number
  currency: string
  provider: PaymentProvider
  reason: 'amount_mismatch' | 'currency_mismatch' | 'verification_uncertain'
  expectedAmount?: number
  actualAmount?: number
  expectedCurrency?: string
  actualCurrency?: string
}

/**
 * Stuck donation alert payload
 */
export interface StuckDonationAlert {
  donationIds: string[]
  count: number
  oldestAgeMinutes: number
  status: 'pending' | 'review'
}

/**
 * Reconciliation alert payload
 */
export interface ReconciliationAlert {
  donationId: string
  provider: PaymentProvider
  previousStatus: string
  newStatus: string
  action: 'confirmed' | 'failed'
  transactionId?: string
}

/**
 * Failure rate alert payload
 */
export interface FailureRateAlert {
  failureType: 'webhook' | 'confirmation' | 'job'
  failureRate: number
  threshold: number
  totalAttempts: number
  failedAttempts: number
  timeWindowMinutes: number
}

/**
 * Send admin alert
 * 
 * Central function for sending alerts to administrators.
 * Currently uses email, but can be extended to support:
 * - Slack notifications
 * - PagerDuty integration
 * - SMS alerts
 * - Webhook notifications
 * 
 * @param alert - Alert payload
 */
export async function sendAdminAlert(alert: Alert): Promise<void> {
  try {
    // Log alert to console
    console.log(`[ALERT] ${alert.severity.toUpperCase()}: ${alert.title}`)
    console.log(`[ALERT] ${alert.message}`)
    if (alert.metadata) {
      console.log('[ALERT] Metadata:', JSON.stringify(alert.metadata, null, 2))
    }

    // Get admin email from environment
    const adminEmail = process.env.ADMIN_EMAIL || process.env.GOOGLE_EMAIL

    if (!adminEmail) {
      console.warn('[ALERT] No admin email configured. Alert not sent via email.')
      return
    }

    // Format alert email
    const emailHtml = formatAlertEmail(alert)

    // Send email using nodemailer (reusing receipt mailer infrastructure)
    const nodemailer = await import('nodemailer')
    
    const transporter = nodemailer.default.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GOOGLE_EMAIL,
        pass: process.env.GOOGLE_APP_PASSWORD,
      },
    })

    await transporter.sendMail({
      from: process.env.GOOGLE_EMAIL,
      to: adminEmail,
      subject: `[${alert.severity.toUpperCase()}] Payment System Alert: ${alert.title}`,
      html: emailHtml,
    })

    console.log(`[ALERT] Alert sent to ${adminEmail}`)
  } catch (error) {
    console.error('[ALERT] Failed to send admin alert:', error)
    // Don't throw - alerting failures should not break the main flow
  }
}

/**
 * Send REVIEW status alert
 * 
 * Sends immediate notification when a donation enters REVIEW status
 * due to amount mismatch, currency mismatch, or verification uncertainty.
 * 
 * @param reviewAlert - REVIEW alert details
 */
export async function sendReviewAlert(reviewAlert: ReviewAlert): Promise<void> {
  const alert: Alert = {
    type: 'review_status',
    severity: 'warning',
    title: 'Donation Requires Manual Review',
    message: `Donation ${reviewAlert.donationId} has been flagged for manual review.`,
    metadata: {
      donationId: reviewAlert.donationId,
      amount: reviewAlert.amount,
      currency: reviewAlert.currency,
      provider: reviewAlert.provider,
      reason: reviewAlert.reason,
      expectedAmount: reviewAlert.expectedAmount,
      actualAmount: reviewAlert.actualAmount,
      expectedCurrency: reviewAlert.expectedCurrency,
      actualCurrency: reviewAlert.actualCurrency,
    },
    timestamp: new Date().toISOString(),
  }

  await sendAdminAlert(alert)
}

/**
 * Send REVIEW escalation alert
 * 
 * Sends escalation notification when a donation has been in REVIEW
 * status for more than 24 hours without resolution.
 * 
 * @param donationId - Donation ID
 * @param ageHours - Age of review in hours
 */
export async function sendReviewEscalationAlert(
  donationId: string,
  ageHours: number
): Promise<void> {
  const alert: Alert = {
    type: 'review_escalation',
    severity: 'critical',
    title: 'URGENT: Unresolved Review Donation',
    message: `Donation ${donationId} has been in REVIEW status for ${ageHours} hours without resolution.`,
    metadata: {
      donationId,
      ageHours,
      threshold: ALERT_THRESHOLDS.reviewEscalationHours,
    },
    timestamp: new Date().toISOString(),
  }

  await sendAdminAlert(alert)
}

/**
 * Send failure rate alert
 * 
 * Sends alert when failure rate exceeds threshold for:
 * - Webhook failures
 * - Confirmation failures
 * - Job failures (receipt/email)
 * 
 * @param failureAlert - Failure rate alert details
 */
export async function sendFailureRateAlert(
  failureAlert: FailureRateAlert
): Promise<void> {
  const alert: Alert = {
    type: failureAlert.failureType === 'webhook' 
      ? 'webhook_failure_rate'
      : failureAlert.failureType === 'confirmation'
      ? 'confirmation_latency'
      : 'job_failure_rate',
    severity: 'critical',
    title: `High ${failureAlert.failureType} Failure Rate`,
    message: `${failureAlert.failureType} failure rate (${failureAlert.failureRate.toFixed(2)}%) exceeds threshold (${failureAlert.threshold}%)`,
    metadata: {
      failureType: failureAlert.failureType,
      failureRate: failureAlert.failureRate,
      threshold: failureAlert.threshold,
      totalAttempts: failureAlert.totalAttempts,
      failedAttempts: failureAlert.failedAttempts,
      timeWindowMinutes: failureAlert.timeWindowMinutes,
    },
    timestamp: new Date().toISOString(),
  }

  await sendAdminAlert(alert)
}

/**
 * Send stuck donation alert
 * 
 * Sends alert when donations are stuck in PENDING or REVIEW status
 * beyond acceptable thresholds.
 * 
 * @param stuckAlert - Stuck donation alert details
 */
export async function sendStuckDonationAlert(
  stuckAlert: StuckDonationAlert | ReconciliationAlert
): Promise<void> {
  // Handle reconciliation alert (single donation)
  if ('action' in stuckAlert) {
    const alert: Alert = {
      type: 'stuck_pending',
      severity: 'info',
      title: `Reconciliation: Donation ${stuckAlert.action === 'confirmed' ? 'Confirmed' : 'Failed'}`,
      message: `Donation ${stuckAlert.donationId} was automatically ${stuckAlert.action} by reconciliation system.`,
      metadata: {
        donationId: stuckAlert.donationId,
        provider: stuckAlert.provider,
        previousStatus: stuckAlert.previousStatus,
        newStatus: stuckAlert.newStatus,
        action: stuckAlert.action,
        transactionId: stuckAlert.transactionId,
      },
      timestamp: new Date().toISOString(),
    }

    await sendAdminAlert(alert)
    return
  }

  // Handle bulk stuck donation alert
  const alert: Alert = {
    type: stuckAlert.status === 'pending' ? 'stuck_pending' : 'stuck_review',
    severity: stuckAlert.status === 'review' ? 'critical' : 'warning',
    title: `Stuck ${stuckAlert.status.toUpperCase()} Donations Detected`,
    message: `${stuckAlert.count} donation(s) stuck in ${stuckAlert.status.toUpperCase()} status. Oldest: ${stuckAlert.oldestAgeMinutes} minutes.`,
    metadata: {
      donationIds: stuckAlert.donationIds,
      count: stuckAlert.count,
      oldestAgeMinutes: stuckAlert.oldestAgeMinutes,
      status: stuckAlert.status,
      threshold: stuckAlert.status === 'pending' 
        ? ALERT_THRESHOLDS.pendingDonationAge
        : ALERT_THRESHOLDS.reviewDonationAge,
    },
    timestamp: new Date().toISOString(),
  }

  await sendAdminAlert(alert)
}

/**
 * Check metrics and send alerts if thresholds are exceeded
 * 
 * This function should be called periodically (e.g., every 5 minutes)
 * to monitor system health and send alerts when issues are detected.
 * 
 * @param timeWindowMinutes - Time window for metrics collection (default: 5)
 */
export async function checkMetricsAndAlert(
  timeWindowMinutes: number = 5
): Promise<void> {
  try {
    // Collect metrics
    const metrics = await collectMetrics({ timeWindowMinutes })

    // Check webhook failure rate
    await checkWebhookFailureRate(metrics)

    // Check confirmation latency
    await checkConfirmationLatency(metrics)

    // Check job failure rate
    await checkJobFailureRate(metrics)

    // Check stuck donations
    await checkStuckDonations(metrics)
  } catch (error) {
    console.error('[ALERT] Error checking metrics:', error)
    
    // Send system error alert
    await sendAdminAlert({
      type: 'system_error',
      severity: 'critical',
      title: 'Metrics Collection Failed',
      message: 'Failed to collect metrics for alerting system',
      metadata: {
        error: error instanceof Error ? error.message : String(error),
      },
      timestamp: new Date().toISOString(),
    })
  }
}

/**
 * Check webhook failure rate and send alert if threshold exceeded
 */
async function checkWebhookFailureRate(metrics: PaymentMetrics): Promise<void> {
  const { totalAttempts, failedConfirmations } = metrics.confirmation

  if (totalAttempts === 0) return

  const failureRate = (failedConfirmations / totalAttempts) * 100

  if (failureRate > ALERT_THRESHOLDS.webhookFailureRate) {
    await sendFailureRateAlert({
      failureType: 'webhook',
      failureRate,
      threshold: ALERT_THRESHOLDS.webhookFailureRate,
      totalAttempts,
      failedAttempts: failedConfirmations,
      timeWindowMinutes: metrics.timeWindowMinutes,
    })
  }
}

/**
 * Check confirmation latency and send alert if threshold exceeded
 */
async function checkConfirmationLatency(metrics: PaymentMetrics): Promise<void> {
  const { averageLatencyMs } = metrics.confirmation

  if (averageLatencyMs > ALERT_THRESHOLDS.confirmationLatency) {
    await sendAdminAlert({
      type: 'confirmation_latency',
      severity: 'warning',
      title: 'High Confirmation Latency',
      message: `Average confirmation latency (${averageLatencyMs}ms) exceeds threshold (${ALERT_THRESHOLDS.confirmationLatency}ms)`,
      metadata: {
        averageLatencyMs,
        threshold: ALERT_THRESHOLDS.confirmationLatency,
        timeWindowMinutes: metrics.timeWindowMinutes,
      },
      timestamp: new Date().toISOString(),
    })
  }
}

/**
 * Check job failure rate and send alert if threshold exceeded
 */
async function checkJobFailureRate(metrics: PaymentMetrics): Promise<void> {
  // Check receipt job failure rate
  const receiptFailureRate = 100 - metrics.jobs.receipt.successRate

  if (receiptFailureRate > ALERT_THRESHOLDS.jobFailureRate) {
    await sendFailureRateAlert({
      failureType: 'job',
      failureRate: receiptFailureRate,
      threshold: ALERT_THRESHOLDS.jobFailureRate,
      totalAttempts: metrics.jobs.receipt.totalJobs,
      failedAttempts: metrics.jobs.receipt.failedJobs,
      timeWindowMinutes: metrics.timeWindowMinutes,
    })
  }

  // Check email job failure rate
  const emailFailureRate = 100 - metrics.jobs.email.successRate

  if (emailFailureRate > ALERT_THRESHOLDS.jobFailureRate) {
    await sendFailureRateAlert({
      failureType: 'job',
      failureRate: emailFailureRate,
      threshold: ALERT_THRESHOLDS.jobFailureRate,
      totalAttempts: metrics.jobs.email.totalJobs,
      failedAttempts: metrics.jobs.email.failedJobs,
      timeWindowMinutes: metrics.timeWindowMinutes,
    })
  }
}

/**
 * Check stuck donations and send alerts if thresholds exceeded
 */
async function checkStuckDonations(metrics: PaymentMetrics): Promise<void> {
  // Import Supabase client
  const { createClient: createServiceClient } = await import('@supabase/supabase-js')
  
  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  )

  // Check stuck pending donations
  const { pendingDonations } = metrics.state

  if (
    pendingDonations.count > 0 &&
    pendingDonations.oldestAgeMinutes !== null &&
    pendingDonations.oldestAgeMinutes > ALERT_THRESHOLDS.pendingDonationAge
  ) {
    // Fetch donation IDs for pending donations older than threshold
    const thresholdDate = new Date(
      Date.now() - ALERT_THRESHOLDS.pendingDonationAge * 60 * 1000
    )
    
    const { data: pendingDonationsData } = await supabase
      .from('donations')
      .select('id')
      .eq('payment_status', 'pending')
      .lt('created_at', thresholdDate.toISOString())
      .limit(10) // Limit to 10 IDs for alert
    
    const donationIds = pendingDonationsData?.map(d => d.id) || []
    
    await sendStuckDonationAlert({
      donationIds,
      count: pendingDonations.count,
      oldestAgeMinutes: pendingDonations.oldestAgeMinutes,
      status: 'pending',
    })
  }

  // Check stuck review donations
  const { reviewDonations } = metrics.state

  if (
    reviewDonations.count > 0 &&
    reviewDonations.oldestAgeMinutes !== null &&
    reviewDonations.oldestAgeMinutes > ALERT_THRESHOLDS.reviewDonationAge
  ) {
    // Fetch donation IDs for review donations older than threshold
    const thresholdDate = new Date(
      Date.now() - ALERT_THRESHOLDS.reviewDonationAge * 60 * 1000
    )
    
    const { data: reviewDonationsData } = await supabase
      .from('donations')
      .select('id')
      .eq('payment_status', 'review')
      .lt('created_at', thresholdDate.toISOString())
      .limit(10) // Limit to 10 IDs for alert
    
    const donationIds = reviewDonationsData?.map(d => d.id) || []
    
    await sendStuckDonationAlert({
      donationIds,
      count: reviewDonations.count,
      oldestAgeMinutes: reviewDonations.oldestAgeMinutes,
      status: 'review',
    })
  }
}

/**
 * Format alert as HTML email
 */
function formatAlertEmail(alert: Alert): string {
  const severityColor = {
    info: '#3b82f6',
    warning: '#f59e0b',
    critical: '#ef4444',
  }[alert.severity]

  const metadataHtml = alert.metadata
    ? `
      <div style="margin-top: 20px; padding: 15px; background-color: #f3f4f6; border-radius: 5px;">
        <h3 style="margin: 0 0 10px 0; font-size: 14px; color: #6b7280;">Details:</h3>
        <pre style="margin: 0; font-size: 12px; color: #374151; white-space: pre-wrap; word-wrap: break-word;">${JSON.stringify(alert.metadata, null, 2)}</pre>
      </div>
    `
    : ''

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="border-left: 4px solid ${severityColor}; padding-left: 20px; margin-bottom: 20px;">
          <div style="display: inline-block; padding: 4px 12px; background-color: ${severityColor}; color: white; border-radius: 4px; font-size: 12px; font-weight: 600; text-transform: uppercase; margin-bottom: 10px;">
            ${alert.severity}
          </div>
          <h2 style="margin: 10px 0; font-size: 20px; color: #111827;">${alert.title}</h2>
          <p style="margin: 10px 0; font-size: 14px; color: #4b5563;">${alert.message}</p>
        </div>
        
        ${metadataHtml}
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af;">
          <p style="margin: 5px 0;">Alert Type: ${alert.type}</p>
          <p style="margin: 5px 0;">Timestamp: ${new Date(alert.timestamp).toLocaleString()}</p>
        </div>
        
        <div style="margin-top: 20px; padding: 15px; background-color: #fef3c7; border-radius: 5px; border-left: 4px solid #f59e0b;">
          <p style="margin: 0; font-size: 13px; color: #92400e;">
            <strong>Action Required:</strong> Please review the payment system and take appropriate action.
          </p>
        </div>
      </body>
    </html>
  `
}
