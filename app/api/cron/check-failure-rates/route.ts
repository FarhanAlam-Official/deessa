/**
 * Cron endpoint to check failure rates and send alerts
 * 
 * This endpoint should be called periodically (e.g., every 5 minutes) to monitor:
 * - Webhook failure rate (> 5%)
 * - Confirmation latency (> 1s)
 * - Job failure rate (> 10%)
 * 
 * Can be triggered by:
 * - Vercel Cron (requires Pro plan)
 * - External cron service (e.g., cron-job.org)
 * - Manual trigger for testing
 */

import { NextRequest, NextResponse } from 'next/server'
import { checkMetricsAndAlert } from '@/lib/monitoring/alerts'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * GET /api/cron/check-failure-rates
 * 
 * Collects metrics and sends alerts if thresholds are exceeded
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret (optional but recommended)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get time window from query params (default: 5 minutes)
    const url = new URL(request.url)
    const timeWindowMinutes = parseInt(url.searchParams.get('window') || '5', 10)

    // Check metrics and send alerts if needed
    await checkMetricsAndAlert(timeWindowMinutes)

    return NextResponse.json({
      success: true,
      message: 'Failure rate check completed',
      timeWindowMinutes,
    })
  } catch (error) {
    console.error('[Cron] Error in failure rate check:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
