"use server"

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { getPaymentMode } from "@/lib/payments/config"
import { verifyStripeSession } from "@/lib/payments/stripe"

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
      const { data: donation } = await supabase
        .from("donations")
        // Do not return donor PII from a public endpoint.
        .select("id,amount,currency,is_monthly,payment_status,provider_ref,stripe_session_id")
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
          // In live mode, only allow this if it matches the stored session id and amount/currency match.
          const storedSessionId = (donation as any).stripe_session_id as string | null
          const storedCurrency = (donation as any).currency as string | null
          const storedAmount = Number((donation as any).amount)
          const sessionCurrency = (session?.currency || "").toUpperCase()
          const sessionMinor = session?.amount_total ?? null
          const expectedMinor = Number.isFinite(storedAmount) ? Math.round(storedAmount * 100) : null

          const canWriteInLive =
            mode !== "live" ||
            (storedSessionId === sessionId &&
              storedCurrency?.toUpperCase() === sessionCurrency &&
              sessionMinor !== null &&
              expectedMinor !== null &&
              expectedMinor === sessionMinor)

          if (canWriteInLive) {
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
              })
              .eq("id", donationId)
              .select("id,amount,currency,is_monthly,payment_status,provider_ref,stripe_session_id")
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

