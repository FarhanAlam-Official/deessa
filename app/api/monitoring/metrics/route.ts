/**
 * Metrics API Endpoint
 * 
 * GET /api/monitoring/metrics
 * 
 * Returns payment system metrics for monitoring and alerting.
 * Requires authentication (admin only).
 */

import { NextRequest, NextResponse } from 'next/server'
import { collectMetrics, formatMetrics } from '@/lib/monitoring/metrics'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // TODO: Add admin role check
    // For now, any authenticated user can access metrics
    // In production, restrict to admin users only

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const timeWindowMinutes = parseInt(searchParams.get('timeWindow') || '60', 10)
    const format = searchParams.get('format') || 'json' // 'json' or 'text'
    const includeConfirmation = searchParams.get('includeConfirmation') !== 'false'
    const includeJobs = searchParams.get('includeJobs') !== 'false'
    const includeState = searchParams.get('includeState') !== 'false'

    // Collect metrics
    const metrics = await collectMetrics({
      timeWindowMinutes,
      includeConfirmation,
      includeJobs,
      includeState,
    })

    // Return formatted response
    if (format === 'text') {
      return new NextResponse(formatMetrics(metrics), {
        status: 200,
        headers: {
          'Content-Type': 'text/plain',
        },
      })
    }

    return NextResponse.json(metrics, { status: 200 })

  } catch (error) {
    console.error('[Metrics API] Error collecting metrics:', error)
    return NextResponse.json(
      {
        error: 'Failed to collect metrics',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
