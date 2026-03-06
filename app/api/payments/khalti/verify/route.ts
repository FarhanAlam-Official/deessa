import { NextResponse } from "next/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { getPaymentMode } from "@/lib/payments/config"
import {
  validateUUID,
  verifyAmountMatch,
  fetchWithTimeout,
  logPaymentEvent,
  maskSensitiveData,
} from "@/lib/payments/security"
import { sendConferenceConfirmationEmail } from "@/lib/email/conference-mailer"
import { generateReceiptForDonation } from "@/lib/actions/donation-receipt"
import { createKhaltiAdapter } from "@/lib/payments/adapters/KhaltiAdapter"
import { getPaymentService } from "@/lib/payments/core/PaymentService"
import { VerificationError, ConfigurationError } from "@/lib/payments/core/errors"
import { checkRateLimit, getClientIP } from "@/lib/rate-limit"

export async function POST(request: Request) {
  const mode = getPaymentMode()

  try {
    // 1. Apply distributed rate limiting (10 requests per minute per IP)
    const clientIP = getClientIP(request)
    const rateLimitIdentifier = clientIP 
      ? `khalti-verify:ip:${clientIP}`
      : `khalti-verify:ip:unknown`
    
    const rateLimit = await checkRateLimit({
      identifier: rateLimitIdentifier,
      maxAttempts: 10,
      windowMinutes: 1,
    })
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { 
          ok: false,
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

    // 2. Validate request body
    const body = await request.json()
    const pidx = body.pidx as string | undefined
    const purchaseOrderId = body.purchase_order_id as string | undefined

    if (!pidx || typeof pidx !== "string" || pidx.trim().length === 0) {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing or invalid pidx",
          message: "Payment identifier (pidx) is required",
        },
        { status: 400 },
      )
    }

    // Use service role client to bypass RLS for payment verification
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { ok: false, error: "Server configuration error" },
        { status: 500 }
      )
    }
    const supabase = createServiceClient(supabaseUrl, serviceRoleKey)

    // Initialize PaymentService and KhaltiAdapter
    const paymentService = getPaymentService()
    const khaltiAdapter = createKhaltiAdapter()

    // Primary lookup: find donation by khalti_pidx
    let { data: donation } = await supabase
      .from("donations")
      .select("*")
      .eq("khalti_pidx", pidx)
      .single()

    // Fallback: khalti_pidx may not have been saved (e.g. RLS blocked the UPDATE
    // in donation.ts before the service-role fix). Khalti always sends
    // purchase_order_id = donation.id in the return URL, so use that.
    if (!donation && purchaseOrderId) {
      const uuidValidation = validateUUID(purchaseOrderId)
      if (uuidValidation.valid) {
        const { data: byId } = await supabase
          .from("donations")
          .select("*")
          .eq("id", purchaseOrderId)
          .single()
        if (byId) {
          donation = byId
          // Backfill khalti_pidx so future lookups work
          await supabase
            .from("donations")
            .update({ khalti_pidx: pidx, provider_ref: pidx, payment_id: `khalti:${pidx}` })
            .eq("id", purchaseOrderId)
          logPaymentEvent("Khalti verify - backfilled khalti_pidx", {
            donationId: purchaseOrderId,
            pidx: maskSensitiveData(pidx),
          }, "warn")
        }
      }
    }

    // If donation not found, check conference_registrations
    if (!donation) {
      const { data: reg } = await supabase
        .from("conference_registrations")
        .select("*")
        .eq("khalti_pidx", pidx)
        .single()

      if (reg) {
        // TODO: Task 8.2 - Extract to shared verification logic
        return await handleConferenceVerification(supabase, reg, pidx, mode)
      }

      // Neither donation nor conference registration found
      return NextResponse.json(
        { 
          ok: false, 
          error: "Payment record not found", 
          message: "Could not find donation or conference registration record. Please contact support with your payment ID." 
        },
        { status: 404 },
      )
    }

    // If caller provides purchase_order_id, validate it matches the donation we found
    if (purchaseOrderId) {
      const uuidValidation = validateUUID(purchaseOrderId)
      if (!uuidValidation.valid || purchaseOrderId !== donation.id) {
        logPaymentEvent("Khalti verify - purchase_order_id mismatch", {
          donationId: donation.id,
          providedPurchaseOrderId: maskSensitiveData(purchaseOrderId),
          pidx: maskSensitiveData(pidx),
        }, "warn")
        return NextResponse.json(
          { ok: false, error: "Invalid purchase order reference" },
          { status: 400 },
        )
      }
    }

    // Idempotency check: if already processed, return current status
    if (donation.payment_status === "completed" || donation.payment_status === "confirmed") {
      logPaymentEvent("Khalti verify - already processed", {
        donationId: donation.id,
        currentStatus: donation.payment_status,
        pidx: maskSensitiveData(pidx),
      })
      return NextResponse.json(
        {
          ok: true,
          status: donation.payment_status === "completed" ? "completed" : "paid",
          message: "Transaction already processed",
        },
        { status: 200 },
      )
    }

    if (donation.payment_status === "failed") {
      logPaymentEvent("Khalti verify - already failed", {
        donationId: donation.id,
        pidx: maskSensitiveData(pidx),
      })
      return NextResponse.json(
        {
          ok: false,
          status: "failed",
          message: "Payment previously failed",
        },
        { status: 200 },
      )
    }

    // Use KhaltiAdapter to verify the payment
    try {
      const verificationResult = await khaltiAdapter.verify(
        { pidx, donation_id: donation.id, amount: donation.amount },
        { mode }
      )

      // Use PaymentService to confirm the donation
      const confirmResult = await paymentService.confirmDonation({
        donationId: donation.id,
        provider: 'khalti',
        verificationResult,
        eventId: pidx, // Use pidx as event ID for idempotency
      })

      // Handle confirmation result
      if (!confirmResult.success) {
        logPaymentEvent("Khalti verify - confirmation failed", {
          donationId: donation.id,
          error: confirmResult.error,
          pidx: maskSensitiveData(pidx),
        }, "error")
        return NextResponse.json(
          {
            ok: false,
            status: "failed",
            error: confirmResult.error || "Payment confirmation failed",
          },
          { status: 400 },
        )
      }

      // Map confirmation status to response
      const responseStatus = confirmResult.status === 'confirmed' ? 'completed' : confirmResult.status
      
      // Fire-and-forget receipt generation for completed donations
      if (confirmResult.status === 'confirmed') {
        generateReceiptForDonation({ donationId: donation.id })
          .then((r) => {
            if (!r.success) {
              logPaymentEvent("Khalti verify - receipt generation failed (non-fatal)", {
                donationId: donation.id,
                message: r.message,
              }, "warn")
            }
          })
          .catch((e) =>
            logPaymentEvent("Khalti verify - receipt generation error (non-fatal)", {
              donationId: donation.id,
              error: e instanceof Error ? e.message : String(e),
            }, "error"),
          )
      }

      logPaymentEvent("Khalti verify - success", {
        donationId: donation.id,
        status: confirmResult.status,
        pidx: maskSensitiveData(pidx),
      })

      return NextResponse.json(
        {
          ok: true,
          status: responseStatus,
          khaltiStatus: verificationResult.metadata.khaltiStatus,
          transactionId: verificationResult.transactionId,
          amount: verificationResult.amount,
        },
        { status: 200 },
      )

    } catch (error) {
      // Handle verification errors
      if (error instanceof VerificationError) {
        logPaymentEvent("Khalti verify - verification error", {
          donationId: donation.id,
          error: error.message,
          pidx: maskSensitiveData(pidx),
        }, "error")

        // For pending/processing status, return appropriate response
        if (error.message.includes('pending') || error.message.includes('Pending')) {
          return NextResponse.json(
            {
              ok: true,
              status: "processing",
              message: "Payment is still pending",
            },
            { status: 200 },
          )
        }

        return NextResponse.json(
          {
            ok: false,
            status: "failed",
            error: error.message,
          },
          { status: 400 },
        )
      }

      if (error instanceof ConfigurationError) {
        logPaymentEvent("Khalti verify - configuration error", {
          donationId: donation.id,
          error: error.message,
        }, "error")
        return NextResponse.json(
          {
            ok: false,
            error: "Khalti not configured",
            message: error.message,
          },
          { status: 500 },
        )
      }

      throw error
    }
  } catch (err) {
    logPaymentEvent("Khalti verify - unexpected error", {
      error: err instanceof Error ? err.message : "Unknown error",
      stack: err instanceof Error ? err.stack : undefined,
    }, "error")
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 })
  }
}

/**
 * Handle conference registration verification
 * 
 * NOTE: This function contains duplicate logic from the donation verification flow.
 * The duplication exists because conference registrations use a separate database table
 * and have different business logic requirements.
 * 
 * FUTURE REFACTORING (Task 8.2):
 * - Create a unified PaymentService method that can handle both donations and conference registrations
 * - Extract common verification logic (Khalti API lookup, status mapping, amount verification)
 * - Use a strategy pattern or adapter to handle table-specific operations
 * - Consider migrating conference registrations to use the same payment architecture as donations
 * 
 * For now, this function is kept separate to maintain the existing conference registration
 * functionality while the donation flow is being migrated to V2 architecture.
 * 
 * TODO: Task 8.3 - Standardize response format to match donation flow
 */
async function handleConferenceVerification(
  supabase: any, // Using any to avoid complex Supabase type issues
  reg: any,
  pidx: string,
  mode: 'live' | 'mock'
) {
  // Idempotency check
  if (reg.payment_status === "paid") {
    return NextResponse.json({ ok: true, status: "paid", message: "Already confirmed" }, { status: 200 })
  }
  if (reg.payment_status === "failed") {
    return NextResponse.json({ ok: false, status: "failed", message: "Payment previously failed" }, { status: 200 })
  }
  if (reg.payment_status === "review") {
    return NextResponse.json({ ok: true, status: "review", message: "Payment under review" }, { status: 200 })
  }

  // Mock mode — confirm immediately
  if (mode === "mock") {
    const { error: updateError } = await supabase.from("conference_registrations").update({
      status: "confirmed",
      payment_status: "paid",
      payment_provider: "khalti",
      payment_id: `khalti:${pidx}`,
      provider_ref: pidx,
      payment_paid_at: new Date().toISOString(),
      confirmed_at: new Date().toISOString(),
    }).eq("id", reg.id)

    if (updateError) {
      logPaymentEvent("Khalti verify (conference mock) - update failed", {
        regId: reg.id,
        pidx: maskSensitiveData(pidx),
        error: updateError,
      }, "error")
      return NextResponse.json({ ok: false, error: "Failed to update registration" }, { status: 500 })
    }

    sendConferenceConfirmationEmail({
      fullName: reg.full_name,
      email: reg.email,
      registrationId: reg.id,
      attendanceMode: reg.attendance_mode || "",
      role: reg.role || undefined,
      workshops: reg.workshops || undefined,
    })
      .then((r) => {
        if (r.success)
          supabase.from("conference_registrations")
            .update({ last_confirmation_email_sent_at: new Date().toISOString() })
            .eq("id", reg.id).then(() => {})
      })
      .catch((e) => console.error("Non-fatal: Khalti conference confirmation email:", e))
    return NextResponse.json({ ok: true, status: "paid", mock: true }, { status: 200 })
  }

  // Live mode — call Khalti lookup API
  logPaymentEvent("Khalti verify (conference) - live lookup", { regId: reg.id, pidx: maskSensitiveData(pidx) })

  const secretKey = process.env.KHALTI_SECRET_KEY
  const baseUrl = process.env.KHALTI_BASE_URL || "https://khalti.com/api/v2"
  if (!secretKey) {
    return NextResponse.json({ ok: false, error: "Khalti not configured" }, { status: 500 })
  }

  let lookupRes: Response
  try {
    lookupRes = await fetchWithTimeout(
      `${baseUrl}/epayment/lookup/`,
      { 
        method: "POST", 
        headers: { 
          "Content-Type": "application/json", 
          Authorization: `Key ${secretKey}` 
        }, 
        body: JSON.stringify({ pidx }) 
      },
      30000,
    )
  } catch (netErr) {
    return NextResponse.json({ ok: false, error: "Failed to connect to Khalti" }, { status: 502 })
  }

  const lookupText = await lookupRes.text()
  let lookupData: { 
    pidx: string
    total_amount: number
    status: string
    transaction_id: string | null
    detail?: string
    error_key?: string 
  }
  try { 
    lookupData = JSON.parse(lookupText) 
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid response from Khalti" }, { status: 502 })
  }

  if (!lookupRes.ok) {
    return NextResponse.json({ ok: false, error: lookupData.detail || "Khalti lookup failed" }, { status: 400 })
  }

  // Handle different status codes
  switch (lookupData.status) {
    case "Completed":
      // Fall through to amount verification + confirmation
      break

    case "Pending":
    case "Initiated":
      logPaymentEvent("Khalti verify (conference) - pending status", {
        regId: reg.id,
        pidx: maskSensitiveData(pidx),
        khaltiStatus: lookupData.status,
      }, "warn")
      return NextResponse.json({ ok: true, status: "processing", khaltiStatus: lookupData.status }, { status: 200 })

    case "Refunded":
    case "Partially Refunded": {
      const { error: refundErr } = await supabase
        .from("conference_registrations")
        .update({ 
          payment_status: "failed", 
          payment_failed_at: new Date().toISOString(), 
          payment_provider: "khalti", 
          provider_ref: pidx 
        })
        .eq("id", reg.id)
      if (refundErr) {
        logPaymentEvent("Khalti verify (conference) - refund update failed", {
          regId: reg.id,
          pidx: maskSensitiveData(pidx),
          error: refundErr,
        }, "error")
      }
      logPaymentEvent("Khalti verify (conference) - refunded", {
        regId: reg.id,
        pidx: maskSensitiveData(pidx),
        khaltiStatus: lookupData.status,
      }, "warn")
      return NextResponse.json({ 
        ok: false, 
        status: "failed", 
        khaltiStatus: lookupData.status, 
        error: "Payment was refunded" 
      }, { status: 200 })
    }

    case "Expired":
    case "User canceled": {
      const { error: cancelErr } = await supabase
        .from("conference_registrations")
        .update({ 
          payment_status: "failed", 
          payment_failed_at: new Date().toISOString(), 
          payment_provider: "khalti", 
          provider_ref: pidx 
        })
        .eq("id", reg.id)
      if (cancelErr) {
        logPaymentEvent("Khalti verify (conference) - cancel/expire update failed", {
          regId: reg.id,
          pidx: maskSensitiveData(pidx),
          error: cancelErr,
        }, "error")
      }
      logPaymentEvent("Khalti verify (conference) - expired/cancelled", {
        regId: reg.id,
        pidx: maskSensitiveData(pidx),
        khaltiStatus: lookupData.status,
      }, "warn")
      return NextResponse.json({ 
        ok: false, 
        status: "failed", 
        khaltiStatus: lookupData.status, 
        error: "Payment expired or was cancelled" 
      }, { status: 200 })
    }

    default:
      logPaymentEvent("Khalti verify (conference) - unknown status", {
        regId: reg.id,
        pidx: maskSensitiveData(pidx),
        khaltiStatus: lookupData.status,
      }, "warn")
      return NextResponse.json({ ok: true, status: "processing", khaltiStatus: lookupData.status }, { status: 200 })
  }

  // Amount verification (fail-closed)
  const expectedPaisa = Math.round(Number(reg.payment_amount) * 100)
  const amountCheck = verifyAmountMatch(expectedPaisa, lookupData.total_amount, "NPR", 1)
  if (!amountCheck.valid) {
    const { error: reviewErr } = await supabase.from("conference_registrations")
      .update({ 
        payment_status: "review", 
        payment_review_at: new Date().toISOString(), 
        payment_provider: "khalti", 
        provider_ref: pidx 
      })
      .eq("id", reg.id)
    
    if (reviewErr) {
      logPaymentEvent("Khalti verify (conference) - amount mismatch update failed", {
        regId: reg.id,
        pidx: maskSensitiveData(pidx),
        error: reviewErr,
      }, "error")
      return NextResponse.json({ ok: false, error: "Failed to update registration" }, { status: 500 })
    }

    // Consistent response format: ok: true for review status (not a failure, requires manual review)
    return NextResponse.json({ 
      ok: true, 
      status: "review", 
      message: "Amount mismatch — flagged for review" 
    }, { status: 200 })
  }

  // Confirm the registration
  const { error: updateError } = await supabase.from("conference_registrations").update({
    status: "confirmed",
    payment_status: "paid",
    payment_provider: "khalti",
    payment_id: `khalti:${pidx}`,
    provider_ref: pidx,
    payment_paid_at: new Date().toISOString(),
    confirmed_at: new Date().toISOString(),
  }).eq("id", reg.id)

  if (updateError) {
    logPaymentEvent("Khalti verify (conference) - update failed", {
      regId: reg.id,
      pidx: maskSensitiveData(pidx),
      sessionId: lookupData.transaction_id,
      error: updateError,
    }, "error")
    return NextResponse.json({ ok: false, error: "Failed to update registration" }, { status: 500 })
  }

  sendConferenceConfirmationEmail({
    fullName: reg.full_name,
    email: reg.email,
    registrationId: reg.id,
    attendanceMode: reg.attendance_mode || "",
    role: reg.role || undefined,
    workshops: reg.workshops || undefined,
  })
    .then((r) => {
      if (r.success)
        supabase.from("conference_registrations")
          .update({ last_confirmation_email_sent_at: new Date().toISOString() })
          .eq("id", reg.id).then(() => {})
    })
    .catch((e) => console.error("Non-fatal: Khalti conference confirmation email:", e))

  logPaymentEvent("Khalti verify (conference) - confirmed", { regId: reg.id })
  return NextResponse.json({ ok: true, status: "paid", khaltiStatus: lookupData.status }, { status: 200 })
}
