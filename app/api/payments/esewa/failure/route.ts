"use server"

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { logPaymentEvent, maskSensitiveData } from "@/lib/payments/security"

export async function GET(request: Request) {
  const url = new URL(request.url)

  // eSewa v2 sends data as base64 encoded query parameter (even on failure)
  const encodedData = url.searchParams.get("data")
  const isMock = url.searchParams.get("mock") === "1"

  let responseData: any = {}

  // Parse the Base64 encoded response if available
  if (encodedData) {
    try {
      const decodedData = Buffer.from(encodedData, "base64").toString("utf-8")
      responseData = JSON.parse(decodedData)
    } catch (error) {
      logPaymentEvent("eSewa failure - failed to decode response", {
        error: error instanceof Error ? error.message : "Unknown error",
      }, "warn")
    }
  }

  const { transaction_uuid, status } = responseData

  if (!transaction_uuid) {
    logPaymentEvent("eSewa failure - missing transaction_uuid", {}, "warn")
    return NextResponse.redirect(
      new URL(`/donate/cancel?provider=esewa&reason=payment_failed`, url.origin),
    )
  }

  // Extract donation ID from transaction_uuid (format: timestamp-donationIdPrefix)
  const parts = transaction_uuid.split("-")
  const donationIdPrefix = parts.length > 1 ? parts[1] : parts[0]

  const supabase = await createClient()

  // Find donation by ID prefix
  const { data: donations, error: searchError } = await supabase
    .from("donations")
    .select("*")
    .like("id", `${donationIdPrefix}%`)
    .order("created_at", { ascending: false })
    .limit(1)

  if (searchError || !donations || donations.length === 0) {
    logPaymentEvent("eSewa failure - donation not found", {
      transactionUuid: maskSensitiveData(transaction_uuid),
      donationIdPrefix,
    }, "warn")
    return NextResponse.redirect(
      new URL(`/donate/cancel?provider=esewa&reason=donation_not_found`, url.origin),
    )
  }

  const donation = donations[0]

  // Idempotency check
  if (donation.payment_status === "completed") {
    logPaymentEvent("eSewa failure - already completed", {
      donationId: donation.id,
      transactionUuid: maskSensitiveData(transaction_uuid),
      note: "Failure callback received but donation already completed",
    }, "warn")
    return NextResponse.redirect(
      new URL(`/donate/success?provider=esewa`, url.origin),
    )
  }

  if (donation.payment_status === "failed") {
    logPaymentEvent("eSewa failure - already failed", {
      donationId: donation.id,
      transactionUuid: maskSensitiveData(transaction_uuid),
    })
    return NextResponse.redirect(
      new URL(`/donate/cancel?provider=esewa&reason=payment_failed`, url.origin),
    )
  }

  // Update status to failed
  const { error: updateError } = await supabase
    .from("donations")
    .update({ payment_status: "failed" })
    .eq("id", donation.id)

  if (updateError) {
    logPaymentEvent("eSewa failure - update failed", {
      donationId: donation.id,
      error: updateError,
    }, "error")
  }

  logPaymentEvent("eSewa failure - payment failed", {
    donationId: donation.id,
    transactionUuid: maskSensitiveData(transaction_uuid),
    status: status || "unknown",
    isMock,
  })

  // Redirect to cancel page
  return NextResponse.redirect(
    new URL(`/donate/cancel?provider=esewa&reason=${encodeURIComponent(status || "payment_failed")}${isMock ? "&mock=1" : ""}`, url.origin),
  )
}
