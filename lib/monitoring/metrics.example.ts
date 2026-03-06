/**
 * Example usage of the metrics collection system
 * 
 * This file demonstrates how to use the metrics collection utilities
 * to monitor payment system health and performance.
 */

import { collectMetrics, formatMetrics } from './metrics'

/**
 * Example 1: Collect all metrics for the last hour
 */
async function example1_collectAllMetrics() {
  console.log('=== Example 1: Collect All Metrics (Last Hour) ===\n')
  
  const metrics = await collectMetrics({
    timeWindowMinutes: 60,
    includeConfirmation: true,
    includeJobs: true,
    includeState: true,
  })
  
  console.log(formatMetrics(metrics))
}

/**
 * Example 2: Collect only confirmation metrics for the last 24 hours
 */
async function example2_confirmationMetricsOnly() {
  console.log('\n=== Example 2: Confirmation Metrics Only (Last 24 Hours) ===\n')
  
  const metrics = await collectMetrics({
    timeWindowMinutes: 24 * 60, // 24 hours
    includeConfirmation: true,
    includeJobs: false,
    includeState: false,
  })
  
  console.log('Confirmation Success Rate:', metrics.confirmation.successRate + '%')
  console.log('Total Attempts:', metrics.confirmation.totalAttempts)
  console.log('Average Latency:', metrics.confirmation.averageLatencyMs + 'ms')
  console.log('Errors by Provider:', metrics.confirmation.errorsByProvider)
}

/**
 * Example 3: Monitor job health
 */
async function example3_monitorJobHealth() {
  console.log('\n=== Example 3: Monitor Job Health ===\n')
  
  const metrics = await collectMetrics({
    timeWindowMinutes: 60,
    includeConfirmation: false,
    includeJobs: true,
    includeState: false,
  })
  
  console.log('Receipt Job Success Rate:', metrics.jobs.receipt.successRate + '%')
  console.log('Receipt Job Failures:', metrics.jobs.receipt.failedJobs)
  console.log('Receipt Job Retry Rate:', metrics.jobs.receipt.retryRate + '%')
  console.log()
  console.log('Email Job Success Rate:', metrics.jobs.email.successRate + '%')
  console.log('Email Job Failures:', metrics.jobs.email.failedJobs)
  console.log('Email Job Retry Rate:', metrics.jobs.email.retryRate + '%')
  
  // Alert if failure rate is too high
  if (metrics.jobs.receipt.successRate < 95) {
    console.warn('⚠️  WARNING: Receipt job success rate below 95%!')
  }
  
  if (metrics.jobs.email.successRate < 95) {
    console.warn('⚠️  WARNING: Email job success rate below 95%!')
  }
}

/**
 * Example 4: Check for stuck donations
 */
async function example4_checkStuckDonations() {
  console.log('\n=== Example 4: Check for Stuck Donations ===\n')
  
  const metrics = await collectMetrics({
    timeWindowMinutes: 60,
    includeConfirmation: false,
    includeJobs: false,
    includeState: true,
  })
  
  console.log('Pending Donations:', metrics.state.pendingDonations.count)
  console.log('Oldest Pending Age:', metrics.state.pendingDonations.oldestAgeMinutes + ' minutes')
  console.log()
  console.log('Review Donations:', metrics.state.reviewDonations.count)
  console.log('Oldest Review Age:', metrics.state.reviewDonations.oldestAgeMinutes + ' minutes')
  
  // Alert if donations are stuck
  if (metrics.state.pendingDonations.oldestAgeMinutes && metrics.state.pendingDonations.oldestAgeMinutes > 60) {
    console.warn('⚠️  WARNING: Pending donations older than 1 hour detected!')
  }
  
  if (metrics.state.reviewDonations.oldestAgeMinutes && metrics.state.reviewDonations.oldestAgeMinutes > 24 * 60) {
    console.warn('⚠️  WARNING: Review donations older than 24 hours detected!')
  }
}

/**
 * Example 5: Health check endpoint
 */
async function example5_healthCheck() {
  console.log('\n=== Example 5: Health Check ===\n')
  
  const metrics = await collectMetrics({
    timeWindowMinutes: 5, // Last 5 minutes
    includeConfirmation: true,
    includeJobs: true,
    includeState: true,
  })
  
  const health = {
    status: 'healthy' as 'healthy' | 'degraded' | 'unhealthy',
    checks: {
      confirmationRate: metrics.confirmation.successRate >= 95,
      receiptJobRate: metrics.jobs.receipt.successRate >= 95,
      emailJobRate: metrics.jobs.email.successRate >= 95,
      noPendingStuck: !metrics.state.pendingDonations.oldestAgeMinutes || metrics.state.pendingDonations.oldestAgeMinutes < 60,
      noReviewStuck: !metrics.state.reviewDonations.oldestAgeMinutes || metrics.state.reviewDonations.oldestAgeMinutes < 24 * 60,
    },
    metrics,
  }
  
  // Determine overall health status
  const failedChecks = Object.values(health.checks).filter(check => !check).length
  
  if (failedChecks === 0) {
    health.status = 'healthy'
  } else if (failedChecks <= 2) {
    health.status = 'degraded'
  } else {
    health.status = 'unhealthy'
  }
  
  console.log('Overall Status:', health.status.toUpperCase())
  console.log('Health Checks:')
  console.log('  - Confirmation Rate OK:', health.checks.confirmationRate ? '✓' : '✗')
  console.log('  - Receipt Job Rate OK:', health.checks.receiptJobRate ? '✓' : '✗')
  console.log('  - Email Job Rate OK:', health.checks.emailJobRate ? '✓' : '✗')
  console.log('  - No Pending Stuck:', health.checks.noPendingStuck ? '✓' : '✗')
  console.log('  - No Review Stuck:', health.checks.noReviewStuck ? '✓' : '✗')
  
  return health
}

/**
 * Example 6: Scheduled metrics collection (cron job)
 */
async function example6_scheduledCollection() {
  console.log('\n=== Example 6: Scheduled Metrics Collection ===\n')
  
  // This would typically run as a cron job every 5 minutes
  const metrics = await collectMetrics({
    timeWindowMinutes: 5,
  })
  
  // Store metrics in database for historical tracking
  // await storeMetricsInDatabase(metrics)
  
  // Check for alerts
  const alerts: string[] = []
  
  if (metrics.confirmation.successRate < 95) {
    alerts.push(`Confirmation success rate: ${metrics.confirmation.successRate}% (threshold: 95%)`)
  }
  
  if (metrics.confirmation.averageLatencyMs > 1000) {
    alerts.push(`Confirmation latency: ${metrics.confirmation.averageLatencyMs}ms (threshold: 1000ms)`)
  }
  
  if (metrics.jobs.receipt.successRate < 95) {
    alerts.push(`Receipt job success rate: ${metrics.jobs.receipt.successRate}% (threshold: 95%)`)
  }
  
  if (metrics.jobs.email.successRate < 95) {
    alerts.push(`Email job success rate: ${metrics.jobs.email.successRate}% (threshold: 95%)`)
  }
  
  if (metrics.state.pendingDonations.oldestAgeMinutes && metrics.state.pendingDonations.oldestAgeMinutes > 60) {
    alerts.push(`Pending donations stuck: oldest is ${metrics.state.pendingDonations.oldestAgeMinutes} minutes old`)
  }
  
  if (metrics.state.reviewDonations.oldestAgeMinutes && metrics.state.reviewDonations.oldestAgeMinutes > 24 * 60) {
    alerts.push(`Review donations stuck: oldest is ${Math.round(metrics.state.reviewDonations.oldestAgeMinutes / 60)} hours old`)
  }
  
  if (alerts.length > 0) {
    console.log('🚨 ALERTS DETECTED:')
    alerts.forEach(alert => console.log('  -', alert))
    // await sendAdminAlert({ alerts, metrics })
  } else {
    console.log('✓ All metrics within normal thresholds')
  }
  
  return { metrics, alerts }
}

/**
 * Run all examples
 */
async function runAllExamples() {
  try {
    await example1_collectAllMetrics()
    await example2_confirmationMetricsOnly()
    await example3_monitorJobHealth()
    await example4_checkStuckDonations()
    await example5_healthCheck()
    await example6_scheduledCollection()
  } catch (error) {
    console.error('Error running examples:', error)
  }
}

// Uncomment to run examples
// runAllExamples()

export {
  example1_collectAllMetrics,
  example2_confirmationMetricsOnly,
  example3_monitorJobHealth,
  example4_checkStuckDonations,
  example5_healthCheck,
  example6_scheduledCollection,
}
