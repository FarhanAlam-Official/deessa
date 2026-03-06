"use server"

import { NextResponse } from "next/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { getPaymentMode } from "@/lib/payments/config"
import {
  logPaymentEvent,
  maskSensitiveData,
} from "@/lib/payments/security"
import { createEsewaAdapter } from "@/lib/payments/adapters/EsewaAdapter"
import { getPaymentService } from "@/lib/payments/core/PaymentService"
import { generateReceiptForDonation } from "@/lib/actions/donation-receipt"
import { handleConferenceVerification } from "./conference-handler"
import { checkRateLimit, getClientIP } from "@/lib/rate-limit"

/**
 * eSewa Success Callback Handler (V2)
 * 
 * This endpoint handles eSewa payment success callbacks using the V2 architecture:
 * - Uses EsewaAdapter for signature verification and payload normalization
 * - Uses PaymentService for centralized payment confirmation
 * - Removes inline donation status updates
 * - Maintains conference registration support (separate handler)
 * 
 * Flow:
 * 1. Parse and decode eSewa callback data
 * 2. Lookup donation by transaction_uuid
 * 3. If not found, check for conference registration
 * 4. Use EsewaAdapter.verify() for signature and server-side verification
 * 5. Use PaymentService.confirmDonation() for state transition
 * 6. Enqueue receipt generation (non-blocking)
 * 7. Redirect to success page
 */
export async function GET(request: Request) {
  const mode = getPaymentMode()
  const url = new URL(request.url)

  // 1. Apply distributed rate limiting (20 requests per minute per IP for callbacks)
  const clientIP = getClientIP(request)
  const rateLimitIdentifier = clientIP 
    ? `esewa-success:ip:${clientIP}`
    : `esewa-success:ip:unknown`
  
  const rateLimit = await checkRateLimit({
    identifier: rateLimitIdentifier,
    maxAttempts: 20, // Higher limit for legitimate callbacks
    windowMinutes: 1,
  })
  
  if (!rateLimit.allowed) {
    logPaymentEvent("eSewa success - rate limit exceeded", {
      ip: clientIP,
      resetAt: rateLimit.resetAt?.toISOString()
    }, "warn")
    return NextResponse.json(
      { 
        error: "Rate limit exceeded. Please try again later.",
        retryAfter: rateLimit.resetAt?.toISOString()
      },
      { 
        status: 429,
        headers: {
          "Retry-After": rateLimit.resetAt 
            ? Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 1000).toString()
            : "60"
        }
      },
    )
  }

  // 2. Parse eSewa callback data
  // eSewa v2 sends data as base64 encoded query parameter
  const encodedData = url.searchParams.get("data")
  const isMock = url.searchParams.get("mock") === "1"

  if (!encodedData && !isMock) {
    logPaymentEvent("eSewa success - missing data parameter", {}, "warn")
    return NextResponse.json({ error: "Missing response data" }, { status: 400 })
  }

  let responseData: any = {}

  // Parse the Base64 encoded response
  if (encodedData) {
    try {
      const decodedData = Buffer.from(encodedData, "base64").toString("utf-8")
      responseData = JSON.parse(decodedData)
    } catch (error) {
      logPaymentEvent("eSewa success - failed to decode response", {
        error: error instanceof Error ? error.message : "Unknown error",
      }, "error")
      return NextResponse.json({ error: "Invalid response data" }, { status: 400 })
    }
  } else if (isMock) {
    // Handle mock data from URL params for testing
    responseData = {
      transaction_code: url.searchParams.get("transaction_code") || "MOCK123",
      status: url.searchParams.get("status") || "COMPLETE",
      total_amount: parseFloat(url.searchParams.get("total_amount") || "0"),
      transaction_uuid: url.searchParams.get("transaction_uuid") || "",
      product_code: url.searchParams.get("product_code") || "EPAYTEST",
    }
  }

  const {
    transaction_code,
    transaction_uuid,
  } = responseData

  // Validate required fields
  if (!transaction_uuid) {
    logPaymentEvent("eSewa success - missing transaction_uuid", {}, "warn")
    return NextResponse.json({ error: "Missing transaction_uuid" }, { status: 400 })
  }

  // Use service role client to bypass RLS for payment verification
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
  }
  const supabase = createServiceClient(supabaseUrl, serviceRoleKey)

  // Find donation by exact transaction_uuid binding
  let { data: donation, error: searchError } = await supabase
    .from("donations")
    .select("*")
    .eq("esewa_transaction_uuid", transaction_uuid)
    .single()

  // Fallback: esewa_transaction_uuid format is "{timestamp}-{donationId}"
  // If the column was NULL (RLS blocked the UPDATE before service-role fix),
  // extract the donation ID from the UUID and look up by id directly.
  if (!donation && transaction_uuid && transaction_uuid.includes("-")) {
    const donationIdFromUuid = transaction_uuid.split("-").slice(1).join("-")
    if (donationIdFromUuid.length > 0) {
      const { data: byId } = await supabase
        .from("donations")
        .select("*")
        .eq("id", donationIdFromUuid)
        .single()
      if (byId) {
        donation = byId
        searchError = null
        // Backfill the column so future lookups work
        await supabase
          .from("donations")
          .update({ esewa_transaction_uuid: transaction_uuid, provider_ref: transaction_uuid })
          .eq("id", donationIdFromUuid)
        console.warn(`[eSewa] Backfilled esewa_transaction_uuid for donation ${donationIdFromUuid}`)
      }
    }
  }

  if (searchError || !donation) {
    // ── Conference registration fallback branch ─────────────────────────────────
    // eSewa may be paying for a conference registration instead of a donation.
    // This is handled by a separate function to avoid code duplication
    const conferenceResult = await handleConferenceVerification(
      supabase,
      transaction_uuid,
      responseData,
      url,
      mode,
      isMock
    )
    
    if (conferenceResult) {
      return conferenceResult
    }

    logPaymentEvent("eSewa success - donation not found", {
      transactionUuid: transaction_uuid,
      error: searchError,
    }, "warn")
    return NextResponse.json({ error: "Donation not found" }, { status: 404 })
  }

  // ── Donation Payment Verification (V2 Architecture) ─────────────────────────

  try {
    // Initialize adapters and services
    // ConfigurationError here means ESEWA_SECRET_KEY / ESEWA_MERCHANT_ID is missing in .env
    let esewaAdapter
    try {
      esewaAdapter = createEsewaAdapter()
    } catch (configError) {
      const msg = configError instanceof Error ? configError.message : String(configError)
      console.error('[eSewa] Adapter configuration error — check ESEWA_SECRET_KEY / ESEWA_MERCHANT_ID env vars:', msg)
      return NextResponse.redirect(
        new URL(`/donate/cancel?provider=esewa&reason=configuration_error`, url.origin)
      )
    }

    const paymentService = getPaymentService()

    // Verify payment using EsewaAdapter
    let verificationResult
    try {
      verificationResult = await esewaAdapter.verify(responseData, {
        mode: isMock ? 'mock' : mode,
        query: { data: encodedData || undefined },
      })
    } catch (verifyError) {
      const msg = verifyError instanceof Error ? verifyError.message : String(verifyError)
      console.error('[eSewa] Verification failed:', msg, { transaction_uuid, donationId: donation.id })
      return NextResponse.redirect(
        new URL(
          `/donate/cancel?provider=esewa&reason=${encodeURIComponent(msg.slice(0, 80))}`,
          url.origin
        )
      )
    }

    logPaymentEvent("eSewa success - verification completed", {
      donationId: donation.id,
      success: verificationResult.success,
      status: verificationResult.status,
      transactionUuid: maskSensitiveData(transaction_uuid),
    })

    // Extract event ID for idempotency
    const metadata = esewaAdapter.extractMetadata(responseData)
    const eventId = metadata.eventId

    // Confirm donation using PaymentService
    const confirmResult = await paymentService.confirmDonation({
      donationId: donation.id,
      provider: 'esewa',
      verificationResult,
      eventId,
    })

    logPaymentEvent("eSewa success - confirmation completed", {
      donationId: donation.id,
      status: confirmResult.status,
      success: confirmResult.success,
    })

    // Handle different confirmation results
    if (confirmResult.status === 'already_processed') {
      // Payment already processed - redirect to success
      return NextResponse.redirect(
        new URL(
          `/donate/success?provider=esewa&transaction_code=${encodeURIComponent(transaction_code || transaction_uuid)}&esewa_uuid=${encodeURIComponent(transaction_uuid)}${isMock ? "&mock=1" : ""}`,
          url.origin
        )
      )
    }

    if (confirmResult.status === 'review') {
      // Payment requires manual review - redirect to cancel with reason
      logPaymentEvent("eSewa success - payment requires review", {
        donationId: donation.id,
        reason: confirmResult.metadata?.reviewReason,
      }, "warn")
      
      return NextResponse.redirect(
        new URL(`/donate/cancel?provider=esewa&reason=amount_mismatch`, url.origin)
      )
    }

    if (confirmResult.status === 'failed' || !confirmResult.success) {
      // Payment verification failed - redirect to cancel
      logPaymentEvent("eSewa success - payment failed", {
        donationId: donation.id,
        error: confirmResult.error,
      }, "error")
      
      return NextResponse.redirect(
        new URL(
          `/donate/cancel?provider=esewa&reason=${encodeURIComponent(confirmResult.error || 'verification_failed')}`,
          url.origin
        )
      )
    }

    // Payment confirmed successfully
    logPaymentEvent("eSewa success - payment completed", {
      donationId: donation.id,
      transactionCode: maskSensitiveData(transaction_code || ""),
      transactionUuid: maskSensitiveData(transaction_uuid),
      amount: verificationResult.amount,
    })

    // Fire-and-forget receipt generation.
    // Non-blocking: never delays the redirect.
    // Idempotent: generateReceiptForDonation checks if receipt already exists.
    generateReceiptForDonation({ donationId: donation.id })
      .then((r) => {
        if (!r.success) {
          logPaymentEvent("eSewa success - receipt generation failed (non-fatal)", {
            donationId: donation.id,
            message: r.message,
          }, "warn")
        }
      })
      .catch((e) =>
        logPaymentEvent("eSewa success - receipt generation error (non-fatal)", {
          donationId: donation.id,
          error: e instanceof Error ? e.message : String(e),
        }, "error"),
      )

    // Redirect to success page
    return NextResponse.redirect(
      new URL(
        `/donate/success?provider=esewa&transaction_code=${encodeURIComponent(transaction_code || transaction_uuid)}&esewa_uuid=${encodeURIComponent(transaction_uuid)}${isMock ? "&mock=1" : ""}`,
        url.origin
      )
    )

  } catch (error) {
    // Handle verification or confirmation errors
    logPaymentEvent("eSewa success - unexpected error", {
      donationId: donation.id,
      error: error instanceof Error ? error.message : String(error),
    }, "error")

    return NextResponse.redirect(
      new URL(
        `/donate/cancel?provider=esewa&reason=${encodeURIComponent('system_error')}`,
        url.origin
      )
    )
  }
}
