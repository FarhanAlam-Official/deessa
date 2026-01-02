"use server"

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { getPaymentMode } from "@/lib/payments/config"
import { verifyStripeSession } from "@/lib/payments/stripe"

// Create a service role client for updates (bypasses RLS)
function createServiceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase service role credentials")
  }

  return createServiceClient(supabaseUrl, serviceRoleKey)
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get("session_id")

    if (!sessionId) {
      return NextResponse.json(
        { error: "Missing session_id parameter" },
        { status: 400 }
      )
    }

    const mode = getPaymentMode()
    const verificationResult = await verifyStripeSession(sessionId, mode)

    if (!verificationResult.success) {
      return NextResponse.json(
        { error: verificationResult.error || "Session verification failed" },
        { status: verificationResult.statusCode || 400 }
      )
    }

    // Fetch donation details from database
    const supabase = await createClient()
    const donationId = verificationResult.session?.client_reference_id ||
      verificationResult.session?.metadata?.donation_id

    if (donationId) {
      const { data: donation } = await supabase
        .from("donations")
        .select("*")
        .eq("id", donationId)
        .single()

      // If donation exists and payment was successful, update status
      // This is a fallback for development/mock mode where webhooks may not work
      if (donation && donation.payment_status === "pending") {
        const session = verificationResult.session
        
        // Check if payment was completed
        // In Stripe, a session is considered complete when:
        // - payment_status is "paid" OR
        // - mode is mock and we have a session
        const isPaymentComplete = 
          session?.payment_status === "paid" || 
          (mode === "mock" && session?.id)

        if (isPaymentComplete) {
          // Use service role client to bypass RLS
          const serviceSupabase = createServiceRoleClient()
          
          // Update donation status to completed
          const { data: updatedDonation, error: updateError } = await serviceSupabase
            .from("donations")
            .update({
              payment_status: "completed",
              payment_id: session?.subscription
                ? `stripe:subscription:${session.subscription}`
                : `stripe:${session?.id}`,
            })
            .eq("id", donationId)
            .select()
            .single()

          if (!updateError && updatedDonation) {
            return NextResponse.json({
              success: true,
              session: verificationResult.session,
              donation: updatedDonation,
            })
          } else if (updateError) {
            console.error("Failed to update donation status:", updateError)
          }
        }
      }

      return NextResponse.json({
        success: true,
        session: verificationResult.session,
        donation: donation || null,
      })
    }

    return NextResponse.json({
      success: true,
      session: verificationResult.session,
      donation: null,
    })
  } catch (error) {
    console.error("Stripe session verification error:", error)
    return NextResponse.json(
      { error: "Internal server error during verification" },
      { status: 500 }
    )
  }
}

