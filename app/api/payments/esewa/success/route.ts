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

/**
 * Verify HMAC-SHA256 signature for eSewa v2 API response
 */
function verifySignature(message: string, signature: string, secretKey: string): boolean {
  const hmac = crypto.createHmac("sha256", secretKey)
  hmac.update(message)
  const expectedSignature = hmac.digest("base64")
  try {
    return crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signature))
  } catch {
    return false
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
    if (!signature || !signed_field_names) {
      logPaymentEvent("eSewa success - missing signature fields in live mode", {
        donationId: donation.id,
        transactionUuid: maskSensitiveData(transaction_uuid),
      }, "error")
      return NextResponse.json({ error: "Invalid response signature" }, { status: 400 })
    }

    const fields = String(signed_field_names).split(",").map((s) => s.trim()).filter(Boolean)
    const required = ["total_amount", "transaction_uuid", "product_code"]
    if (!required.every((r) => fields.includes(r))) {
      logPaymentEvent("eSewa success - signed fields missing required fields", {
        donationId: donation.id,
        signed_field_names,
      }, "error")
      return NextResponse.json({ error: "Invalid response signature" }, { status: 400 })
    }

    const message = fields.map((field) => `${field}=${responseData[field]}`).join(",")
    const isValid = verifySignature(message, signature, secretKey)
    if (!isValid) {
      logPaymentEvent("eSewa success - invalid signature", {
        donationId: donation.id,
        transactionUuid: maskSensitiveData(transaction_uuid),
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
