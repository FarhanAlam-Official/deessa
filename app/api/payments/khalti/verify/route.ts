"use server"

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { getPaymentMode } from "@/lib/payments/config"
import {
  validateUUID,
  verifyAmountMatch,
  fetchWithTimeout,
  logPaymentEvent,
  maskSensitiveData,
} from "@/lib/payments/security"

type KhaltiStatus =
  | "Completed"
  | "Pending"
  | "Initiated"
  | "Refunded"
  | "Expired"
  | "User canceled"
  | "Partially Refunded"

interface KhaltiLookupResponse {
  pidx: string
  total_amount: number
  status: KhaltiStatus
  transaction_id: string | null
  fee: number
  refunded: boolean
  detail?: string
  error_key?: string
}

export async function POST(request: Request) {
  const mode = getPaymentMode()

  try {
    const body = await request.json()
    const pidx = body.pidx as string | undefined
    const purchaseOrderId = body.purchase_order_id as string | undefined // optional; used only for additional validation

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

    // Strict mapping: donation must already be associated to this pidx
    const { data: donation } = await supabase
      .from("donations")
      .select("*")
      .eq("khalti_pidx", pidx)
      .single()

    // If donation still not found, return error
    if (!donation) {
      return NextResponse.json(
        {
          ok: false,
          error: "Donation not found",
          message: "Could not find donation record. Please contact support with your payment ID.",
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
    if (donation.payment_status === "completed" || donation.payment_status === "failed") {
      logPaymentEvent("Khalti verify - already processed", {
        donationId: donation.id,
        currentStatus: donation.payment_status,
        pidx: maskSensitiveData(pidx),
      })
      return NextResponse.json(
        {
          ok: true,
          status: donation.payment_status,
          message: "Transaction already processed",
        },
        { status: 200 },
      )
    }

    if (mode === "mock") {
      // In mock mode, mark as completed
      const { error: updateError } = await supabase
        .from("donations")
        .update({
          payment_status: "completed",
          provider: "khalti",
          provider_ref: pidx,
          payment_id: `khalti:${pidx}`,
        })
        .eq("id", donation.id)

      if (updateError) {
        logPaymentEvent("Khalti verify - mock update failed", { donationId: donation.id, error: updateError }, "error")
        return NextResponse.json({ error: "Failed to update donation" }, { status: 500 })
      }

      logPaymentEvent("Khalti verify - mock success", { donationId: donation.id, pidx })
      return NextResponse.json({ ok: true, status: "completed", mock: true }, { status: 200 })
    }

    const secretKey = process.env.KHALTI_SECRET_KEY
    const baseUrl = process.env.KHALTI_BASE_URL || "https://khalti.com/api/v2"

    if (!secretKey) {
      logPaymentEvent("Khalti verify - not configured", { donationId: donation.id }, "error")
      return NextResponse.json(
        {
          ok: false,
          error: "Khalti not configured",
          message: "KHALTI_SECRET_KEY environment variable is missing",
        },
        { status: 500 },
      )
    }



    // Call Khalti lookup API with timeout
    let res: Response
    try {
      res = await fetchWithTimeout(
        `${baseUrl}/epayment/lookup/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Key ${secretKey}`,
          },
          body: JSON.stringify({ pidx }),
        },
        30000, // 30 second timeout
      )
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      logPaymentEvent("Khalti verify - network error", {
        donationId: donation.id,
        error: errorMessage,
        pidx: maskSensitiveData(pidx),
        baseUrl,
      }, "error")
      return NextResponse.json(
        {
          ok: false,
          error: "Failed to connect to Khalti",
          message: `Network error: ${errorMessage}. Please try again.`,
        },
        { status: 502 },
      )
    }

    const responseText = await res.text()
    let data: KhaltiLookupResponse

    try {
      data = JSON.parse(responseText)
    } catch {
      logPaymentEvent("Khalti verify - invalid JSON response", {
        donationId: donation.id,
        status: res.status,
        response: responseText.slice(0, 200),
      }, "error")
      return NextResponse.json({ error: "Invalid response from Khalti" }, { status: 502 })
    }

    if (!res.ok) {
      logPaymentEvent("Khalti verify - lookup failed", {
        donationId: donation.id,
        status: res.status,
        error: data.detail || "Unknown error",
        errorKey: data.error_key,
        responseText: responseText.slice(0, 500),
      }, "error")

      // If pidx not found or invalid, mark as failed
      if (res.status === 404 || data.error_key === "validation_error" || data.detail?.includes("Not found")) {
        const { error: updateError } = await supabase
          .from("donations")
          .update({ payment_status: "failed" })
          .eq("id", donation.id)

        if (updateError) {
          logPaymentEvent("Khalti verify - failed to update status", { donationId: donation.id, error: updateError }, "error")
        }

        return NextResponse.json(
          {
            ok: false,
            status: "failed",
            error: data.detail || "Transaction not found in Khalti system",
            message: "Payment verification failed. Please contact support if your payment was successful.",
          },
          { status: 200 },
        )
      }

      // For 401 (unauthorized), return error but don't mark as failed (might be config issue)
      if (res.status === 401) {
        return NextResponse.json(
          {
            ok: false,
            error: "Khalti API authentication failed",
            message: "Invalid API key. Please check your KHALTI_SECRET_KEY configuration.",
            detail: data.detail || "Unauthorized",
          },
          { status: 500 },
        )
      }

      return NextResponse.json(
        {
          ok: false,
          error: data.detail || "Khalti verification failed",
          message: `Khalti API returned error: ${data.detail || `Status ${res.status}`}`,
        },
        { status: res.status },
      )
    }

    // Verify amount matches (with tolerance for rounding)
    const expectedAmountInPaisa = Math.round(Number(donation.amount) * 100)
    const amountVerification = verifyAmountMatch(expectedAmountInPaisa, data.total_amount, "NPR", 1) // 1 paisa tolerance

    if (!amountVerification.valid) {
      logPaymentEvent("Khalti verify - amount mismatch", {
        donationId: donation.id,
        expected: expectedAmountInPaisa,
        actual: data.total_amount,
        warning: amountVerification.error,
      }, "warn")
      // Fail-closed: do not complete on amount mismatch.
      await supabase
        .from("donations")
        .update({ payment_status: "review", provider: "khalti", provider_ref: pidx })
        .eq("id", donation.id)
      return NextResponse.json(
        { ok: false, status: "failed", error: "Amount mismatch; requires manual review" },
        { status: 400 },
      )
    }

    // Handle different status codes according to Khalti documentation
    let newStatus: "completed" | "failed" | "pending"
    let shouldUpdate = true

    switch (data.status) {
      case "Completed":
        newStatus = "completed"
        break

      case "Pending":
      case "Initiated":
        // Hold the transaction, don't provide service yet
        newStatus = "pending"
        shouldUpdate = false // Keep as pending, don't update
        logPaymentEvent("Khalti verify - pending status", {
          donationId: donation.id,
          status: data.status,
          message: "Transaction is pending, contact Khalti team if needed",
        }, "warn")
        break

      case "Refunded":
      case "Partially Refunded":
        // Transaction has been refunded, do not provide service
        newStatus = "failed"
        logPaymentEvent("Khalti verify - refunded", {
          donationId: donation.id,
          status: data.status,
          refunded: data.refunded,
        }, "warn")
        break

      case "Expired":
      case "User canceled":
        // User canceled or payment expired, do not provide service
        newStatus = "failed"
        break

      default:
        // Unknown status - hold and log
        newStatus = "pending"
        shouldUpdate = false
        logPaymentEvent("Khalti verify - unknown status", {
          donationId: donation.id,
          status: data.status,
          message: "Unknown status, holding transaction",
        }, "warn")
    }

    if (shouldUpdate) {
      // Replay/idempotency protection using payment_events ledger (best-effort if table exists)
      if (newStatus === "completed" || newStatus === "failed") {
        try {
          const eventId = data.transaction_id ? `tx:${data.transaction_id}` : `pidx:${pidx}`
          const { error: eventErr } = await supabase
            .from("payment_events")
            .insert({ provider: "khalti", event_id: eventId, donation_id: donation.id })
          if (eventErr) {
            if ((eventErr as any).code === "23505" || String((eventErr as any).message || "").toLowerCase().includes("duplicate")) {
              return NextResponse.json(
                { ok: true, status: donation.payment_status, message: "Transaction already processed" },
                { status: 200 },
              )
            }
          }
        } catch {
          // ignore if ledger missing
        }
      }

      // Update payment_status and ensure payment_id is set correctly
      const updateData: { payment_status: string; payment_id?: string } = {
        payment_status: newStatus,
      }

      // If payment_id is not set or doesn't match, update it
      updateData.payment_id = `khalti:${pidx}`

      const { error: updateError } = await supabase
        .from("donations")
        .update(updateData)
        .eq("id", donation.id)

      if (updateError) {
        logPaymentEvent("Khalti verify - update failed", { donationId: donation.id, error: updateError }, "error")
        return NextResponse.json({ error: "Failed to update donation status" }, { status: 500 })
      }
    }

    logPaymentEvent("Khalti verify - success", {
      donationId: donation.id,
      status: data.status,
      newStatus,
      transactionId: data.transaction_id,
    })

    return NextResponse.json(
      {
        ok: true,
        status: newStatus,
        khaltiStatus: data.status,
        transactionId: data.transaction_id,
        amount: data.total_amount,
        refunded: data.refunded,
      },
      { status: 200 },
    )
  } catch (err) {
    logPaymentEvent("Khalti verify - unexpected error", {
      error: err instanceof Error ? err.message : "Unknown error",
      stack: err instanceof Error ? err.stack : undefined,
    }, "error")
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}


