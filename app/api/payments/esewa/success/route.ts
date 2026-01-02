"use server"

import crypto from "crypto"
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

/**
 * Verify HMAC-SHA256 signature for eSewa v2 API response
 */
function verifySignature(message: string, signature: string, secretKey: string): boolean {
  const hmac = crypto.createHmac("sha256", secretKey)
  hmac.update(message)
  const expectedSignature = hmac.digest("base64")
  return expectedSignature === signature
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

  // Extract donation ID from transaction_uuid (format: timestamp-donationIdPrefix)
  const parts = transaction_uuid.split("-")
  const donationIdPrefix = parts.length > 1 ? parts[1] : parts[0]
  
  // Use service role client to bypass RLS for payment verification
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
  }
  const supabase = createServiceClient(supabaseUrl, serviceRoleKey)

  // Find donation by ID prefix
  const { data: donations, error: searchError } = await supabase
    .from("donations")
    .select("*")
    .like("id", `${donationIdPrefix}%`)
    .order("created_at", { ascending: false })
    .limit(1)

  if (searchError || !donations || donations.length === 0) {
    logPaymentEvent("eSewa success - donation not found", {
      transactionUuid: transaction_uuid,
      donationIdPrefix,
      error: searchError,
    }, "warn")
    return NextResponse.json({ error: "Donation not found" }, { status: 404 })
  }

  const donation = donations[0]

  // Verify signature (skip for mock mode)
  if (!isMock && mode !== "mock" && signature && signed_field_names) {
    const secretKey = process.env.ESEWA_SECRET_KEY || "8gBm/:&EnhH.1/q"
    const fields = signed_field_names.split(",")
    const message = fields.map((field: string) => `${field}=${responseData[field]}`).join(",")
    
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
  }

  // Update donation status
  const { error: updateError } = await supabase
    .from("donations")
    .update({
      payment_status: "completed",
      payment_id: `esewa:${transaction_code || transaction_uuid}`,
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
