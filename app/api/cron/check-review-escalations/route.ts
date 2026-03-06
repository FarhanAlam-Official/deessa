/**
 * Cron endpoint to check for review donations that need escalation
 * 
 * This endpoint should be called periodically (e.g., every hour) to check
 * for donations that have been in REVIEW status for more than 24 hours.
 * 
 * Can be triggered by:
 * - Vercel Cron (requires Pro plan)
 * - External cron service (e.g., cron-job.org)
 * - Manual trigger for testing
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { sendReviewEscalationAlert, ALERT_THRESHOLDS } from '@/lib/monitoring/alerts'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * GET /api/cron/check-review-escalations
 * 
 * Checks for review donations that need escalation and sends alerts
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

    // Create Supabase client with service role
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

    // Calculate threshold timestamp (24 hours ago)
    const thresholdDate = new Date(
      Date.now() - ALERT_THRESHOLDS.reviewEscalationHours * 60 * 60 * 1000
    )

    // Query donations in REVIEW status older than threshold
    const { data: reviewDonations, error } = await supabase
      .from('donations')
      .select('id, created_at, amount, currency, provider')
      .eq('payment_status', 'review')
      .lt('created_at', thresholdDate.toISOString())

    if (error) {
      console.error('[Cron] Error querying review donations:', error)
      return NextResponse.json(
        { error: 'Database query failed', details: error.message },
        { status: 500 }
      )
    }

    // Send escalation alerts for each stuck review donation
    const alerts: Array<{ donationId: string; ageHours: number; success: boolean }> = []

    for (const donation of reviewDonations || []) {
      const ageMs = Date.now() - new Date(donation.created_at).getTime()
      const ageHours = Math.floor(ageMs / (60 * 60 * 1000))

      try {
        await sendReviewEscalationAlert(donation.id, ageHours)
        alerts.push({ donationId: donation.id, ageHours, success: true })
      } catch (alertError) {
        console.error(`[Cron] Failed to send escalation alert for ${donation.id}:`, alertError)
        alerts.push({ donationId: donation.id, ageHours, success: false })
      }
    }

    const successCount = alerts.filter(a => a.success).length
    const failureCount = alerts.filter(a => !a.success).length

    return NextResponse.json({
      success: true,
      message: 'Review escalation check completed',
      reviewDonationsFound: reviewDonations?.length || 0,
      alertsSent: successCount,
      alertsFailed: failureCount,
      alerts,
    })
  } catch (error) {
    console.error('[Cron] Error in review escalation check:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
