"use server"

import crypto from "crypto"
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { getPaymentMode } from "@/lib/payments/config"
import {
  verifyAmountMatch,
  fetchWithTimeout,
  logPaymentEvent,
  maskSensitiveData,
} from "@/lib/payments/security"
import { sendConferenceConfirmationEmail } from "@/lib/email/conference-mailer"

/**
 * Verify HMAC-SHA256 signature for eSewa v2 API response.
 * Returns { valid: true } on success or { valid: false, reason } on failure.
 * Reused by both the donation and conference registration branches.
 */
function verifyEsewaSignature(
  responseData: any,
  signed_field_names: string | undefined,
  signature: string | undefined,
  secretKey: string,
): { valid: true } | { valid: false; reason: string } {
  if (!signature || !signed_field_names) {
    return { valid: false, reason: "missing_signature_fields" }
  }
  const fields = String(signed_field_names).split(",").map((s) => s.trim()).filter(Boolean)
  const required = ["total_amount", "transaction_uuid", "product_code"]
  if (!required.every((r) => fields.includes(r))) {
    return { valid: false, reason: "signed_fields_missing_required" }
  }
  const message = fields.map((field) => `${field}=${responseData[field]}`).join(",")
  const hmac = crypto.createHmac("sha256", secretKey)
  hmac.update(message)
  const expectedSignature = hmac.digest("base64")
  try {
    const isValid = crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signature))
    return isValid ? { valid: true } : { valid: false, reason: "signature_mismatch" }
  } catch {
    return { valid: false, reason: "signature_mismatch" }
  }
}

export async function GET(request: Request) {
  const mode = getPaymentMode()
  const url = new URL(request.url)

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
    status,
    total_amount,
    transaction_uuid,
    product_code,
    signed_field_names,
    signature,
  } = responseData

  // Validate required fields
  if (!transaction_uuid || !status || total_amount === undefined) {
    logPaymentEvent("eSewa success - missing required fields", {
      hasTransactionUuid: !!transaction_uuid,
      hasStatus: !!status,
      hasTotalAmount: total_amount !== undefined,
    }, "warn")
    return NextResponse.json({ error: "Missing required response fields" }, { status: 400 })
  }

  // Use service role client to bypass RLS for payment verification
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
  }
  const supabase = createServiceClient(supabaseUrl, serviceRoleKey)

  // Find donation by exact transaction_uuid binding
  const { data: donation, error: searchError } = await supabase
    .from("donations")
    .select("*")
    .eq("esewa_transaction_uuid", transaction_uuid)
    .single()

  if (searchError || !donation) {
    // ── Conference registration fallback branch ─────────────────────────────────
    // eSewa may be paying for a conference registration instead of a donation.
    const { data: reg } = await supabase
      .from("conference_registrations")
      .select("*")
      .eq("esewa_transaction_uuid", transaction_uuid)
      .single()

    if (reg) {
      // Validate status
      if (status !== "COMPLETE") {
        logPaymentEvent("eSewa success - conference payment not completed", {
          regId: reg.id,
          status,
          transactionUuid: maskSensitiveData(transaction_uuid),
        }, "warn")
        await supabase.from("conference_registrations").update({ payment_status: "failed" }).eq("id", reg.id)
        return NextResponse.redirect(new URL(`/conference/register/payment-success?rid=${reg.id}&status=failed`, url.origin))
      }
      if (reg.payment_status === "paid") {
        return NextResponse.redirect(new URL(`/conference/register/payment-success?rid=${reg.id}&paid=1`, url.origin))
      }

      // Amount verification
      const expectedAmt = parseFloat((reg.payment_amount || 0).toString())
      const actualAmt = parseFloat(total_amount.toString())
      const av = verifyAmountMatch(expectedAmt, actualAmt, "NPR", 0.01)
      if (!av.valid) {
        await supabase.from("conference_registrations")
          .update({ payment_status: "review", esewa_transaction_uuid: transaction_uuid })
          .eq("id", reg.id)
        return NextResponse.redirect(new URL(`/conference/register/payment-success?rid=${reg.id}&status=review`, url.origin))
      }

      // HMAC signature verification (required in live mode; skip for mock)
      if (!isMock && mode === "live") {
        const secretKey = process.env.ESEWA_SECRET_KEY
        if (!secretKey) {
          logPaymentEvent("eSewa success - missing ESEWA_SECRET_KEY in live mode", {}, "error")
          return NextResponse.json({ error: "Server misconfigured" }, { status: 500 })
        }
        const sigResult = verifyEsewaSignature(responseData, signed_field_names, signature, secretKey)
        if (!sigResult.valid) {
          logPaymentEvent("eSewa success - conference registration signature invalid", {
            regId: reg.id,
            transactionUuid: maskSensitiveData(transaction_uuid),
            reason: sigResult.reason,
          }, "error")
          await supabase
            .from("conference_registrations")
            .update({ payment_status: "failed" })
            .eq("id", reg.id)
          return NextResponse.redirect(
            new URL(`/conference/register/payment-success?rid=${reg.id}&status=failed`, url.origin),
          )
        }
      }

      const { error: regUpdateError } = await supabase
        .from("conference_registrations")
        .update({
          status: "confirmed",
          payment_status: "paid",
          payment_provider: "esewa",
          payment_id: `esewa:${transaction_uuid}`,
          provider_ref: transaction_uuid,
        })
        .eq("id", reg.id)

      if (regUpdateError) {
        logPaymentEvent("eSewa success - conference registration update failed", {
          regId: reg.id,
          transactionUuid: maskSensitiveData(transaction_uuid),
          error: regUpdateError,
        }, "error")
        return NextResponse.redirect(
          new URL(`/conference/register/payment-success?rid=${reg.id}&status=failed`, url.origin),
        )
      }

      sendConferenceConfirmationEmail({
        fullName: reg.full_name,
        email: reg.email,
        registrationId: reg.id,
        attendanceMode: reg.attendance_mode || "",
        role: reg.role || undefined,
        workshops: reg.workshops || undefined,
      }).catch((e) => console.error("Non-fatal: eSewa conference confirmation email:", e))

      return NextResponse.redirect(new URL(`/conference/register/payment-success?rid=${reg.id}&paid=1`, url.origin))
    }

    logPaymentEvent("eSewa success - donation not found", {
      transactionUuid: transaction_uuid,
      error: searchError,
    }, "warn")
    return NextResponse.json({ error: "Donation not found" }, { status: 404 })
  }

  // Verify signature (required in live mode; skip for mock)
  if (!isMock && mode === "live") {
    const secretKey = process.env.ESEWA_SECRET_KEY
    if (!secretKey) {
      logPaymentEvent("eSewa success - missing ESEWA_SECRET_KEY in live mode", {}, "error")
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 })
    }
    const sigResult = verifyEsewaSignature(responseData, signed_field_names, signature, secretKey)
    if (!sigResult.valid) {
      logPaymentEvent("eSewa success - invalid signature", {
        donationId: donation.id,
        transactionUuid: maskSensitiveData(transaction_uuid),
        reason: sigResult.reason,
      }, "error")
      return NextResponse.json({ error: "Invalid response signature" }, { status: 400 })
    }
  }

  // Check if payment status is COMPLETE
  if (status !== "COMPLETE") {
    logPaymentEvent("eSewa success - payment not completed", {
      donationId: donation.id,
      status,
      transactionUuid: maskSensitiveData(transaction_uuid),
    }, "warn")
    
    // Mark as failed
    await supabase
      .from("donations")
      .update({ payment_status: "failed" })
      .eq("id", donation.id)
    
    return NextResponse.redirect(
      new URL(`/donate/cancel?provider=esewa&reason=${encodeURIComponent(status)}`, url.origin),
    )
  }

  // Idempotency check
  if (donation.payment_status === "completed") {
    logPaymentEvent("eSewa success - already completed", {
      donationId: donation.id,
      transactionCode: maskSensitiveData(transaction_code || ""),
    })
    return NextResponse.redirect(
      new URL(`/donate/success?provider=esewa&transaction_code=${encodeURIComponent(transaction_code || "")}`, url.origin),
    )
  }

  // Verify amount matches
  const expectedAmount = parseFloat(donation.amount.toString())
  const actualAmount = parseFloat(total_amount.toString())
  const amountVerification = verifyAmountMatch(expectedAmount, actualAmount, "NPR", 0.01)

  if (!amountVerification.valid) {
    logPaymentEvent("eSewa success - amount mismatch", {
      donationId: donation.id,
      expected: expectedAmount,
      actual: actualAmount,
      warning: amountVerification.error,
    }, "warn")
    await supabase
      .from("donations")
      .update({ payment_status: "review", provider: "esewa", provider_ref: transaction_uuid })
      .eq("id", donation.id)

    return NextResponse.redirect(
      new URL(`/donate/cancel?provider=esewa&reason=amount_mismatch`, url.origin),
    )
  }

  // Idempotency / replay protection using payment_events ledger (best-effort if table exists)
  try {
    const eventId = transaction_code ? `code:${transaction_code}` : `uuid:${transaction_uuid}`
    const { error: eventErr } = await supabase
      .from("payment_events")
      .insert({ provider: "esewa", event_id: eventId, donation_id: donation.id })
    if (eventErr) {
      if ((eventErr as any).code === "23505" || String((eventErr as any).message || "").toLowerCase().includes("duplicate")) {
        return NextResponse.redirect(
          new URL(`/donate/success?provider=esewa&transaction_code=${encodeURIComponent(transaction_code || transaction_uuid)}${isMock ? "&mock=1" : ""}`, url.origin),
        )
      }
    }
  } catch {
    // ignore if ledger missing
  }

  // Update donation status
  const { error: updateError } = await supabase
    .from("donations")
    .update({
      payment_status: "completed",
      payment_id: `esewa:${transaction_code || transaction_uuid}`,
      provider: "esewa",
      provider_ref: transaction_uuid,
      esewa_transaction_code: transaction_code || null,
    })
    .eq("id", donation.id)

  if (updateError) {
    logPaymentEvent("eSewa success - update failed", {
      donationId: donation.id,
      error: updateError,
    }, "error")
    return NextResponse.json({ error: "Failed to update donation" }, { status: 500 })
  }

  logPaymentEvent("eSewa success - payment completed", {
    donationId: donation.id,
    transactionCode: maskSensitiveData(transaction_code || ""),
    transactionUuid: maskSensitiveData(transaction_uuid),
    amount: actualAmount,
  })

  // Redirect to success page
  return NextResponse.redirect(
    new URL(`/donate/success?provider=esewa&transaction_code=${encodeURIComponent(transaction_code || transaction_uuid)}${isMock ? "&mock=1" : ""}`, url.origin),
  )
}
