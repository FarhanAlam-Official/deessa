"use server"

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { getPaymentMode } from "@/lib/payments/config"
import { verifyStripeSession } from "@/lib/payments/stripe"
import { generateReceiptForDonation } from "@/lib/actions/donation-receipt"

// Very small in-memory throttle to slow down brute force of session IDs.
// Note: On serverless this is best-effort; on a single Node process it is effective.
const ipHits = new Map<string, { count: number; resetAt: number }>()
function shouldRateLimit(ip: string, now: number): boolean {
  const windowMs = 60_000
  const max = 60
  const entry = ipHits.get(ip)
  if (!entry || entry.resetAt <= now) {
    ipHits.set(ip, { count: 1, resetAt: now + windowMs })
    return false
  }
  entry.count += 1
  return entry.count > max
}

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
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown"
    if (shouldRateLimit(ip, Date.now())) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 })
    }

    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get("session_id")

    if (!sessionId) {
      return NextResponse.json(
        { error: "Missing session_id parameter" },
        { status: 400 }
      )
    }

    // Basic format check to reduce accidental logs / abuse
    if (!sessionId.startsWith("cs_")) {
      return NextResponse.json({ error: "Invalid session_id" }, { status: 400 })
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
      const supabase2 = createServiceRoleClient() // use service role so RLS doesn't block PII read
      const { data: donation } = await supabase2
        .from("donations")
        // Include donor PII — this endpoint is gated behind a valid Stripe session ID
        // so PII exposure is scoped to the session owner only.
        .select("id,amount,currency,donor_name,donor_email,donor_phone,is_monthly,payment_status,provider_ref,stripe_session_id")
        .eq("id", donationId)
        .single()

      // If donation exists and payment was successful, update status
      // This is a fallback for development/mock mode where webhooks may not work
      if (donation && donation.payment_status === "pending") {
        const session = verificationResult.session

        // Check if payment was completed
        // In Stripe, a session is considered complete when payment_status is "paid"
        const isPaymentComplete =
          session?.payment_status === "paid" ||
          (mode === "mock" && session?.id)

        if (isPaymentComplete) {
          const storedSessionId = (donation as any).stripe_session_id as string | null

          // Validate: session ID must match what was stored at checkout creation.
          // If stripe_session_id was never stored (legacy rows), skip the check.
          const sessionIdMatch = !storedSessionId || storedSessionId === sessionId

          if (sessionIdMatch) {
            // Use service role client to bypass RLS
            const serviceSupabase = createServiceRoleClient()

            const { data: updatedDonation, error: updateError } = await serviceSupabase
              .from("donations")
              .update({
                payment_status: "completed",
                payment_id: session?.subscription
                  ? `stripe:subscription:${session.subscription}`
                  : `stripe:${session?.id}`,
                stripe_subscription_id:
                  session?.subscription && typeof session.subscription === "string"
                    ? session.subscription
                    : null,
                // Ensure session ID is persisted for future idempotency checks
                stripe_session_id: sessionId,
              })
              .eq("id", donationId)
              // Include donor PII so the receipt preview can render on success page
              .select("id,amount,currency,donor_name,donor_email,donor_phone,is_monthly,payment_status,provider_ref,stripe_session_id")
              .single()

            if (!updateError && updatedDonation) {
              // Fire-and-forget receipt generation.
              // Non-blocking: never delays the API response.
              // Idempotent: generateReceiptForDonation checks if receipt already exists.
              generateReceiptForDonation({ donationId })
                .then((r) => {
                  if (!r.success) console.warn("Stripe verify - receipt generation failed (non-fatal):", r.message)
                })
                .catch((e) => console.error("Stripe verify - receipt generation error (non-fatal):", e))

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
      }

      // Return current donation state (including PII now that we use service role client)
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

