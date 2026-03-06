/**
 * Reconciliation Cron API Endpoint
 * 
 * This endpoint is designed to be called by Vercel Cron or other
 * scheduled task systems to reconcile stuck/pending donations.
 * 
 * Configuration (vercel.json):
 * {
 *   "crons": [{
 *     "path": "/api/cron/reconcile-payments",
 *     "schedule": "0 * * * *"
 *   }]
 * }
 * 
 * Security:
 * - Requires CRON_SECRET environment variable for authentication
 * - Only accepts requests with valid Authorization header
 * 
 * Response:
 * - 200: Reconciliation completed successfully
 * - 401: Unauthorized (missing or invalid secret)
 * - 500: Reconciliation failed
 */

import { NextRequest, NextResponse } from 'next/server'
import { reconcilePendingDonations } from '@/lib/payments/reconciliation'

/**
 * GET handler for reconciliation cron job
 * 
 * Vercel Cron sends GET requests with Authorization header
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret) {
      console.error('[Reconciliation Cron] CRON_SECRET not configured')
      return NextResponse.json(
        { error: 'Cron secret not configured' },
        { status: 500 }
      )
    }

    // Check authorization header
    const expectedAuth = `Bearer ${cronSecret}`
    if (authHeader !== expectedAuth) {
      console.error('[Reconciliation Cron] Unauthorized request')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('[Reconciliation Cron] Starting reconciliation run')

    // Run reconciliation with default settings
    const summary = await reconcilePendingDonations({
      maxAge: 60 * 60 * 1000, // 1 hour
      limit: 100,
      dryRun: false,
    })

    const durationMs = Date.now() - startTime

    console.log('[Reconciliation Cron] Reconciliation completed', {
      totalChecked: summary.totalChecked,
      confirmed: summary.confirmed,
      failed: summary.failed,
      noChange: summary.noChange,
      errors: summary.errors,
      durationMs,
    })

    // Return summary
    return NextResponse.json({
      success: true,
      summary: {
        totalChecked: summary.totalChecked,
        confirmed: summary.confirmed,
        failed: summary.failed,
        noChange: summary.noChange,
        errors: summary.errors,
        durationMs: summary.durationMs,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[Reconciliation Cron] Fatal error:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

/**
 * POST handler for manual reconciliation trigger
 * 
 * Allows manual triggering of reconciliation with custom parameters
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret) {
      console.error('[Reconciliation Cron] CRON_SECRET not configured')
      return NextResponse.json(
        { error: 'Cron secret not configured' },
        { status: 500 }
      )
    }

    // Check authorization header
    const expectedAuth = `Bearer ${cronSecret}`
    if (authHeader !== expectedAuth) {
      console.error('[Reconciliation Cron] Unauthorized request')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse request body for custom parameters
    const body = await request.json().catch(() => ({}))
    const maxAgeMinutes = body.maxAgeMinutes || 60
    const limit = body.limit || 100
    const dryRun = body.dryRun || false

    console.log('[Reconciliation Cron] Starting manual reconciliation', {
      maxAgeMinutes,
      limit,
      dryRun,
    })

    // Run reconciliation with custom settings
    const summary = await reconcilePendingDonations({
      maxAge: maxAgeMinutes * 60 * 1000,
      limit,
      dryRun,
    })

    const durationMs = Date.now() - startTime

    console.log('[Reconciliation Cron] Manual reconciliation completed', {
      totalChecked: summary.totalChecked,
      confirmed: summary.confirmed,
      failed: summary.failed,
      noChange: summary.noChange,
      errors: summary.errors,
      durationMs,
    })

    // Return summary with detailed results
    return NextResponse.json({
      success: true,
      summary: {
        totalChecked: summary.totalChecked,
        confirmed: summary.confirmed,
        failed: summary.failed,
        noChange: summary.noChange,
        errors: summary.errors,
        durationMs: summary.durationMs,
      },
      results: summary.results,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[Reconciliation Cron] Fatal error:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
