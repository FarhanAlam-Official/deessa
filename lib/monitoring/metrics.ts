/**
 * Payment Architecture V2 - Metrics Collection
 * 
 * This module provides metrics collection utilities for monitoring
 * payment system health, performance, and reliability.
 * 
 * Metrics Categories:
 * - Confirmation metrics (success rate, latency, errors by provider)
 * - Job metrics (receipt/email success rate, retry rate)
 * - State metrics (donation counts by status, age of pending/review)
 */

import { createClient as createServiceClient } from '@supabase/supabase-js'
import type { PaymentProvider, DonationStatus } from '@/lib/payments/core/types'

/**
 * Payment system metrics interface
 */
export interface PaymentMetrics {
  // Confirmation metrics
  confirmation: {
    successRate: number // Percentage of successful confirmations
    totalAttempts: number
    successfulConfirmations: number
    failedConfirmations: number
    reviewConfirmations: number
    averageLatencyMs: number
    errorsByProvider: Record<PaymentProvider, number>
  }
  
  // Job metrics (receipt and email processing)
  jobs: {
    receipt: {
      successRate: number
      totalJobs: number
      successfulJobs: number
      failedJobs: number
      retryRate: number
    }
    email: {
      successRate: number
      totalJobs: number
      successfulJobs: number
      failedJobs: number
      retryRate: number
    }
  }
  
  // State metrics
  state: {
    donationsByStatus: Record<DonationStatus, number>
    pendingDonations: {
      count: number
      oldestAgeMinutes: number | null
      averageAgeMinutes: number | null
    }
    reviewDonations: {
      count: number
      oldestAgeMinutes: number | null
      averageAgeMinutes: number | null
    }
  }
  
  // Metadata
  collectedAt: string
  timeWindowMinutes: number
}

/**
 * Metrics collection options
 */
export interface MetricsOptions {
  timeWindowMinutes?: number // Time window for metrics (default: 60)
  includeConfirmation?: boolean // Include confirmation metrics (default: true)
  includeJobs?: boolean // Include job metrics (default: true)
  includeState?: boolean // Include state metrics (default: true)
}

/**
 * Collect payment system metrics
 * 
 * Queries the database to collect metrics across different categories:
 * - Confirmation metrics from payment_events and donations
 * - Job metrics from receipt_failures and email_failures
 * - State metrics from donations table
 * 
 * @param options - Metrics collection options
 * @returns Complete payment metrics
 */
export async function collectMetrics(
  options: MetricsOptions = {}
): Promise<PaymentMetrics> {
  const {
    timeWindowMinutes = 60,
    includeConfirmation = true,
    includeJobs = true,
    includeState = true,
  } = options

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

  const timeWindowStart = new Date(Date.now() - timeWindowMinutes * 60 * 1000).toISOString()

  // Collect confirmation metrics
  const confirmationMetrics = includeConfirmation
    ? await collectConfirmationMetrics(supabase, timeWindowStart)
    : getEmptyConfirmationMetrics()

  // Collect job metrics
  const jobMetrics = includeJobs
    ? await collectJobMetrics(supabase, timeWindowStart)
    : getEmptyJobMetrics()

  // Collect state metrics
  const stateMetrics = includeState
    ? await collectStateMetrics(supabase)
    : getEmptyStateMetrics()

  return {
    confirmation: confirmationMetrics,
    jobs: jobMetrics,
    state: stateMetrics,
    collectedAt: new Date().toISOString(),
    timeWindowMinutes,
  }
}

/**
 * Collect confirmation metrics
 * 
 * Tracks:
 * - Confirmation success rate
 * - Confirmation latency
 * - Confirmation errors by provider
 */
async function collectConfirmationMetrics(
  supabase: ReturnType<typeof createServiceClient>,
  timeWindowStart: string
) {
  // Query donations confirmed within time window
  const { data: donations, error } = await supabase
    .from('donations')
    .select('payment_status, provider, confirmed_at, created_at')
    .gte('confirmed_at', timeWindowStart)
    .not('confirmed_at', 'is', null)

  if (error) {
    console.error('[Metrics] Error collecting confirmation metrics:', error)
    return getEmptyConfirmationMetrics()
  }

  const totalAttempts = donations?.length || 0
  const successfulConfirmations = donations?.filter(d => d.payment_status === 'confirmed').length || 0
  const failedConfirmations = donations?.filter(d => d.payment_status === 'failed').length || 0
  const reviewConfirmations = donations?.filter(d => d.payment_status === 'review').length || 0

  // Calculate success rate
  const successRate = totalAttempts > 0
    ? (successfulConfirmations / totalAttempts) * 100
    : 0

  // Calculate average latency (time from creation to confirmation)
  let totalLatencyMs = 0
  let latencyCount = 0

  donations?.forEach(donation => {
    if (donation.confirmed_at && donation.created_at) {
      const latency = new Date(donation.confirmed_at).getTime() - new Date(donation.created_at).getTime()
      totalLatencyMs += latency
      latencyCount++
    }
  })

  const averageLatencyMs = latencyCount > 0 ? totalLatencyMs / latencyCount : 0

  // Count errors by provider
  const errorsByProvider: Record<PaymentProvider, number> = {
    stripe: 0,
    khalti: 0,
    esewa: 0,
  }

  donations?.forEach(donation => {
    if (donation.payment_status === 'failed' && donation.provider) {
      const provider = donation.provider as PaymentProvider
      if (provider in errorsByProvider) {
        errorsByProvider[provider]++
      }
    }
  })

  return {
    successRate: Math.round(successRate * 100) / 100,
    totalAttempts,
    successfulConfirmations,
    failedConfirmations,
    reviewConfirmations,
    averageLatencyMs: Math.round(averageLatencyMs),
    errorsByProvider,
  }
}

/**
 * Collect job metrics (receipt and email processing)
 * 
 * Tracks:
 * - Receipt job success rate
 * - Email job success rate
 * - Job retry rate
 */
async function collectJobMetrics(
  supabase: ReturnType<typeof createServiceClient>,
  timeWindowStart: string
) {
  // Query receipt failures within time window
  const { data: receiptFailures, error: receiptError } = await supabase
    .from('receipt_failures')
    .select('id, attempt_count, resolved_at')
    .gte('created_at', timeWindowStart)

  if (receiptError) {
    console.error('[Metrics] Error collecting receipt metrics:', receiptError)
  }

  // Query email failures within time window
  const { data: emailFailures, error: emailError } = await supabase
    .from('email_failures')
    .select('id, attempt_count, resolved_at')
    .gte('created_at', timeWindowStart)

  if (emailError) {
    console.error('[Metrics] Error collecting email metrics:', emailError)
  }

  // Query successful donations (confirmed) within time window
  const { data: confirmedDonations, error: confirmedError } = await supabase
    .from('donations')
    .select('id')
    .eq('payment_status', 'confirmed')
    .gte('confirmed_at', timeWindowStart)

  if (confirmedError) {
    console.error('[Metrics] Error collecting confirmed donations:', confirmedError)
  }

  const totalConfirmed = confirmedDonations?.length || 0

  // Calculate receipt metrics
  const receiptFailureCount = receiptFailures?.length || 0
  const receiptSuccessCount = Math.max(0, totalConfirmed - receiptFailureCount)
  const receiptTotalJobs = totalConfirmed
  const receiptSuccessRate = receiptTotalJobs > 0
    ? (receiptSuccessCount / receiptTotalJobs) * 100
    : 100

  // Calculate receipt retry rate
  const receiptRetries = receiptFailures?.reduce((sum, f) => sum + (f.attempt_count - 1), 0) || 0
  const receiptRetryRate = receiptTotalJobs > 0
    ? (receiptRetries / receiptTotalJobs) * 100
    : 0

  // Calculate email metrics
  const emailFailureCount = emailFailures?.length || 0
  const emailSuccessCount = Math.max(0, totalConfirmed - emailFailureCount)
  const emailTotalJobs = totalConfirmed
  const emailSuccessRate = emailTotalJobs > 0
    ? (emailSuccessCount / emailTotalJobs) * 100
    : 100

  // Calculate email retry rate
  const emailRetries = emailFailures?.reduce((sum, f) => sum + (f.attempt_count - 1), 0) || 0
  const emailRetryRate = emailTotalJobs > 0
    ? (emailRetries / emailTotalJobs) * 100
    : 0

  return {
    receipt: {
      successRate: Math.round(receiptSuccessRate * 100) / 100,
      totalJobs: receiptTotalJobs,
      successfulJobs: receiptSuccessCount,
      failedJobs: receiptFailureCount,
      retryRate: Math.round(receiptRetryRate * 100) / 100,
    },
    email: {
      successRate: Math.round(emailSuccessRate * 100) / 100,
      totalJobs: emailTotalJobs,
      successfulJobs: emailSuccessCount,
      failedJobs: emailFailureCount,
      retryRate: Math.round(emailRetryRate * 100) / 100,
    },
  }
}

/**
 * Collect state metrics
 * 
 * Tracks:
 * - Count of donations by status
 * - Age of pending donations
 * - Age of review donations
 */
async function collectStateMetrics(
  supabase: ReturnType<typeof createServiceClient>
) {
  // Query all donations grouped by status
  const { data: statusCounts, error: statusError } = await supabase
    .from('donations')
    .select('payment_status')

  if (statusError) {
    console.error('[Metrics] Error collecting status counts:', statusError)
    return getEmptyStateMetrics()
  }

  // Count donations by status
  const donationsByStatus: Record<DonationStatus, number> = {
    initiated: 0,
    pending: 0,
    confirmed: 0,
    review: 0,
    failed: 0,
    refunded: 0,
  }

  statusCounts?.forEach(donation => {
    const status = donation.payment_status as DonationStatus
    if (status in donationsByStatus) {
      donationsByStatus[status]++
    }
  })

  // Query pending donations with age
  const { data: pendingDonations, error: pendingError } = await supabase
    .from('donations')
    .select('created_at')
    .eq('payment_status', 'pending')

  if (pendingError) {
    console.error('[Metrics] Error collecting pending donations:', pendingError)
  }

  const pendingAges = pendingDonations?.map(d => {
    const ageMs = Date.now() - new Date(d.created_at).getTime()
    return ageMs / (60 * 1000) // Convert to minutes
  }) || []

  const pendingMetrics = {
    count: pendingAges.length,
    oldestAgeMinutes: pendingAges.length > 0 ? Math.round(Math.max(...pendingAges)) : null,
    averageAgeMinutes: pendingAges.length > 0
      ? Math.round(pendingAges.reduce((sum, age) => sum + age, 0) / pendingAges.length)
      : null,
  }

  // Query review donations with age
  const { data: reviewDonations, error: reviewError } = await supabase
    .from('donations')
    .select('created_at')
    .eq('payment_status', 'review')

  if (reviewError) {
    console.error('[Metrics] Error collecting review donations:', reviewError)
  }

  const reviewAges = reviewDonations?.map(d => {
    const ageMs = Date.now() - new Date(d.created_at).getTime()
    return ageMs / (60 * 1000) // Convert to minutes
  }) || []

  const reviewMetrics = {
    count: reviewAges.length,
    oldestAgeMinutes: reviewAges.length > 0 ? Math.round(Math.max(...reviewAges)) : null,
    averageAgeMinutes: reviewAges.length > 0
      ? Math.round(reviewAges.reduce((sum, age) => sum + age, 0) / reviewAges.length)
      : null,
  }

  return {
    donationsByStatus,
    pendingDonations: pendingMetrics,
    reviewDonations: reviewMetrics,
  }
}

/**
 * Helper functions to return empty metrics structures
 */
function getEmptyConfirmationMetrics() {
  return {
    successRate: 0,
    totalAttempts: 0,
    successfulConfirmations: 0,
    failedConfirmations: 0,
    reviewConfirmations: 0,
    averageLatencyMs: 0,
    errorsByProvider: {
      stripe: 0,
      khalti: 0,
      esewa: 0,
    } as Record<PaymentProvider, number>,
  }
}

function getEmptyJobMetrics() {
  return {
    receipt: {
      successRate: 100,
      totalJobs: 0,
      successfulJobs: 0,
      failedJobs: 0,
      retryRate: 0,
    },
    email: {
      successRate: 100,
      totalJobs: 0,
      successfulJobs: 0,
      failedJobs: 0,
      retryRate: 0,
    },
  }
}

function getEmptyStateMetrics() {
  return {
    donationsByStatus: {
      initiated: 0,
      pending: 0,
      confirmed: 0,
      review: 0,
      failed: 0,
      refunded: 0,
    } as Record<DonationStatus, number>,
    pendingDonations: {
      count: 0,
      oldestAgeMinutes: null,
      averageAgeMinutes: null,
    },
    reviewDonations: {
      count: 0,
      oldestAgeMinutes: null,
      averageAgeMinutes: null,
    },
  }
}

/**
 * Format metrics for display
 * 
 * Converts metrics object to human-readable format
 */
export function formatMetrics(metrics: PaymentMetrics): string {
  const lines: string[] = [
    `Payment System Metrics (${metrics.timeWindowMinutes}min window)`,
    `Collected at: ${new Date(metrics.collectedAt).toLocaleString()}`,
    '',
    '=== Confirmation Metrics ===',
    `Success Rate: ${metrics.confirmation.successRate}%`,
    `Total Attempts: ${metrics.confirmation.totalAttempts}`,
    `  - Successful: ${metrics.confirmation.successfulConfirmations}`,
    `  - Failed: ${metrics.confirmation.failedConfirmations}`,
    `  - Review: ${metrics.confirmation.reviewConfirmations}`,
    `Average Latency: ${metrics.confirmation.averageLatencyMs}ms`,
    `Errors by Provider:`,
    `  - Stripe: ${metrics.confirmation.errorsByProvider.stripe}`,
    `  - Khalti: ${metrics.confirmation.errorsByProvider.khalti}`,
    `  - eSewa: ${metrics.confirmation.errorsByProvider.esewa}`,
    '',
    '=== Job Metrics ===',
    `Receipt Jobs:`,
    `  - Success Rate: ${metrics.jobs.receipt.successRate}%`,
    `  - Total: ${metrics.jobs.receipt.totalJobs}`,
    `  - Successful: ${metrics.jobs.receipt.successfulJobs}`,
    `  - Failed: ${metrics.jobs.receipt.failedJobs}`,
    `  - Retry Rate: ${metrics.jobs.receipt.retryRate}%`,
    `Email Jobs:`,
    `  - Success Rate: ${metrics.jobs.email.successRate}%`,
    `  - Total: ${metrics.jobs.email.totalJobs}`,
    `  - Successful: ${metrics.jobs.email.successfulJobs}`,
    `  - Failed: ${metrics.jobs.email.failedJobs}`,
    `  - Retry Rate: ${metrics.jobs.email.retryRate}%`,
    '',
    '=== State Metrics ===',
    `Donations by Status:`,
    `  - Initiated: ${metrics.state.donationsByStatus.initiated}`,
    `  - Pending: ${metrics.state.donationsByStatus.pending}`,
    `  - Confirmed: ${metrics.state.donationsByStatus.confirmed}`,
    `  - Review: ${metrics.state.donationsByStatus.review}`,
    `  - Failed: ${metrics.state.donationsByStatus.failed}`,
    `  - Refunded: ${metrics.state.donationsByStatus.refunded}`,
    `Pending Donations:`,
    `  - Count: ${metrics.state.pendingDonations.count}`,
    `  - Oldest Age: ${metrics.state.pendingDonations.oldestAgeMinutes !== null ? `${metrics.state.pendingDonations.oldestAgeMinutes}min` : 'N/A'}`,
    `  - Average Age: ${metrics.state.pendingDonations.averageAgeMinutes !== null ? `${metrics.state.pendingDonations.averageAgeMinutes}min` : 'N/A'}`,
    `Review Donations:`,
    `  - Count: ${metrics.state.reviewDonations.count}`,
    `  - Oldest Age: ${metrics.state.reviewDonations.oldestAgeMinutes !== null ? `${metrics.state.reviewDonations.oldestAgeMinutes}min` : 'N/A'}`,
    `  - Average Age: ${metrics.state.reviewDonations.averageAgeMinutes !== null ? `${metrics.state.reviewDonations.averageAgeMinutes}min` : 'N/A'}`,
  ]

  return lines.join('\n')
}
