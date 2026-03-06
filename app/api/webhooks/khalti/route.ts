/**
 * Payment Architecture V2 - Khalti Webhook Handler
 * 
 * This endpoint handles webhook notifications from Khalti for payment events.
 * It routes all verification and confirmation logic through the centralized
 * PaymentService to ensure consistency and transactional integrity.
 * 
 * Flow:
 * 1. Receive webhook payload from Khalti
 * 2. Verify webhook signature (when Khalti implements webhook signatures)
 * 3. Use KhaltiAdapter to verify and normalize the payment
 * 4. Call PaymentService.confirmDonation() to update donation status
 * 5. Return 200 OK to Khalti within 2 seconds
 * 
 * Note: As of implementation, Khalti may not have webhook signature verification.
 * This endpoint is prepared for future webhook support with signature verification.
 */

import { NextResponse } from 'next/server'
import { createKhaltiAdapter } from '@/lib/payments/adapters/KhaltiAdapter'
import { getPaymentService } from '@/lib/payments/core/PaymentService'
import { VerificationError, PaymentError } from '@/lib/payments/core/errors'

/**
 * POST /api/webhooks/khalti
 * 
 * Handles Khalti webhook notifications for payment events
 */
export async function POST(request: Request) {
  const startTime = Date.now()

  try {
    // Parse webhook payload
    const body = await request.json()

    // Extract pidx and purchase_order_id from payload
    const pidx = body.pidx as string | undefined
    const purchaseOrderId = body.purchase_order_id as string | undefined

    if (!pidx || typeof pidx !== 'string' || pidx.trim().length === 0) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Missing or invalid pidx',
          message: 'Payment identifier (pidx) is required',
        },
        { status: 400 }
      )
    }

    // Log webhook receipt
    console.log('[Khalti Webhook] Received webhook', {
      pidx: pidx.substring(0, 8) + '...',
      purchaseOrderId: purchaseOrderId?.substring(0, 8) + '...',
      status: body.status,
    })

    // Initialize adapter and service
    const adapter = createKhaltiAdapter()
    const paymentService = getPaymentService()

    // Verify payment using adapter
    // The adapter will perform server-side transaction lookup
    let verificationResult
    try {
      verificationResult = await adapter.verify(body, {
        headers: Object.fromEntries(request.headers.entries()),
        mode: process.env.PAYMENT_MODE as 'live' | 'mock',
      })
    } catch (error) {
      if (error instanceof VerificationError) {
        console.error('[Khalti Webhook] Verification failed:', {
          pidx: pidx.substring(0, 8) + '...',
          error: error.message,
          code: error.code,
        })

        return NextResponse.json(
          {
            ok: false,
            error: error.message,
            code: error.code,
          },
          { status: error.statusCode }
        )
      }

      throw error
    }

    // Extract donation ID from verification result
    const donationId = verificationResult.donationId

    if (!donationId) {
      console.error('[Khalti Webhook] Missing donation ID in verification result')
      return NextResponse.json(
        {
          ok: false,
          error: 'Missing donation ID',
          message: 'Could not extract donation ID from payment data',
        },
        { status: 400 }
      )
    }

    // Confirm donation using PaymentService
    // This handles all state transitions, idempotency, and database updates
    const confirmationResult = await paymentService.confirmDonation({
      donationId,
      provider: 'khalti',
      verificationResult,
      eventId: pidx, // Use pidx as event ID for idempotency
    })

    // Calculate processing time
    const processingTime = Date.now() - startTime

    // Log result
    console.log('[Khalti Webhook] Processing complete', {
      donationId: donationId.substring(0, 8) + '...',
      status: confirmationResult.status,
      success: confirmationResult.success,
      processingTime: `${processingTime}ms`,
    })

    // Return success response to Khalti
    // Always return 200 OK to prevent webhook retries for already-processed events
    return NextResponse.json(
      {
        ok: true,
        status: confirmationResult.status,
        message: this.getStatusMessage(confirmationResult.status),
      },
      { status: 200 }
    )

  } catch (error) {
    const processingTime = Date.now() - startTime

    // Log unexpected errors
    console.error('[Khalti Webhook] Unexpected error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      processingTime: `${processingTime}ms`,
    })

    // Return 500 for unexpected errors
    // Khalti will retry the webhook
    return NextResponse.json(
      {
        ok: false,
        error: 'Internal server error',
        message: 'An unexpected error occurred while processing the webhook',
      },
      { status: 500 }
    )
  }
}

/**
 * Get user-friendly message for confirmation status
 */
function getStatusMessage(status: string): string {
  switch (status) {
    case 'confirmed':
      return 'Payment confirmed successfully'
    case 'review':
      return 'Payment flagged for manual review'
    case 'failed':
      return 'Payment verification failed'
    case 'already_processed':
      return 'Payment already processed'
    default:
      return 'Payment processed'
  }
}

/**
 * GET /api/webhooks/khalti
 * 
 * Health check endpoint for Khalti webhook
 */
export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      message: 'Khalti webhook endpoint is active',
      timestamp: new Date().toISOString(),
    },
    { status: 200 }
  )
}
