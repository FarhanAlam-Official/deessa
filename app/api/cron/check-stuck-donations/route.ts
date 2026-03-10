/**
 * Cron endpoint to check for stuck donations
 * 
 * This endpoint should be called periodically (e.g., every hour) to check for:
 * - Pending donations > 1 hour old
 * - Review donations > 24 hours old
 * 
 * Can be triggered by:
 * - Vercel Cron (requires Pro plan)
 * - External cron service (e.g., cron-job.org)
 * - Manual trigger for testing
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { sendStuckDonationAlert, ALERT_THRESHOLDS } from '@/lib/monitoring/alerts'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * GET /api/cron/check-stuck-donations
 * 
 * Checks for stuck donations and sends alerts
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

    const results = {
      pendingDonations: { found: 0, alerted: false },
      reviewDonations: { found: 0, alerted: false },
    }

    // Check stuck pending donations (> 1 hour old)
    const pendingThresholdDate = new Date(
      Date.now() - ALERT_THRESHOLDS.pendingDonationAge * 60 * 1000
    )

    const { data: pendingDonations, error: pendingError } = await supabase
      .from('donations')
      .select('id, created_at')
      .eq('payment_status', 'pending')
      .lt('created_at', pendingThresholdDate.toISOString())

    if (pendingError) {
      console.error('[Cron] Error querying pending donations:', pendingError)
    } else if (pendingDonations && pendingDonations.length > 0) {
      results.pendingDonations.found = pendingDonations.length

      // Calculate oldest age
      const ages = pendingDonations.map(d => {
        const ageMs = Date.now() - new Date(d.created_at).getTime()
        return ageMs / (60 * 1000) // Convert to minutes
      })
      const oldestAgeMinutes = Math.max(...ages)

      // Send alert
      try {
        await sendStuckDonationAlert({
          donationIds: pendingDonations.slice(0, 10).map(d => d.id), // Limit to 10 IDs
          count: pendingDonations.length,
          oldestAgeMinutes: Math.round(oldestAgeMinutes),
          status: 'pending',
        })
        results.pendingDonations.alerted = true
      } catch (alertError) {
        console.error('[Cron] Failed to send stuck pending alert:', alertError)
      }
    }

    // Check stuck review donations (> 24 hours old)
    const reviewThresholdDate = new Date(
      Date.now() - ALERT_THRESHOLDS.reviewDonationAge * 60 * 1000
    )

    const { data: reviewDonations, error: reviewError } = await supabase
      .from('donations')
      .select('id, created_at')
      .eq('payment_status', 'review')
      .lt('created_at', reviewThresholdDate.toISOString())

    if (reviewError) {
      console.error('[Cron] Error querying review donations:', reviewError)
    } else if (reviewDonations && reviewDonations.length > 0) {
      results.reviewDonations.found = reviewDonations.length

      // Calculate oldest age
      const ages = reviewDonations.map(d => {
        const ageMs = Date.now() - new Date(d.created_at).getTime()
        return ageMs / (60 * 1000) // Convert to minutes
      })
      const oldestAgeMinutes = Math.max(...ages)

      // Send alert
      try {
        await sendStuckDonationAlert({
          donationIds: reviewDonations.slice(0, 10).map(d => d.id), // Limit to 10 IDs
          count: reviewDonations.length,
          oldestAgeMinutes: Math.round(oldestAgeMinutes),
          status: 'review',
        })
        results.reviewDonations.alerted = true
      } catch (alertError) {
        console.error('[Cron] Failed to send stuck review alert:', alertError)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Stuck donation check completed',
      results,
    })
  } catch (error) {
    console.error('[Cron] Error in stuck donation check:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
