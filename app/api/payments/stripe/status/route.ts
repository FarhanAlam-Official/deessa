import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/payments/stripe/status
 * 
 * Check the status of a Stripe payment by session ID
 * Used by the success page to poll for payment confirmation
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const sessionId = searchParams.get('session_id')

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Missing session_id parameter' },
        { status: 400 }
      )
    }

    // Query donation by Stripe session ID
    const supabase = await createClient()
    const { data: donation, error } = await supabase
      .from('donations')
      .select('id, payment_status, provider, amount, currency, donor_name, donor_email, donor_phone, is_monthly, created_at')
      .eq('stripe_session_id', sessionId)
      .single()

    if (error || !donation) {
      return NextResponse.json(
        { 
          error: 'Donation not found',
          status: 'not_found'
        },
        { status: 404 }
      )
    }

    // Return donation status
    return NextResponse.json({
      success: true,
      status: donation.payment_status,
      donation: {
        id: donation.id,
        amount: donation.amount,
        currency: donation.currency,
        donor_name: donation.donor_name,
        donor_email: donation.donor_email,
        donor_phone: donation.donor_phone,
        is_monthly: donation.is_monthly,
        payment_status: donation.payment_status,
        created_at: donation.created_at,
        provider: donation.provider
      }
    })

  } catch (error) {
    console.error('Error checking payment status:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        status: 'error'
      },
      { status: 500 }
    )
  }
}
