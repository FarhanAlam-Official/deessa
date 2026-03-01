"use server"

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { logPaymentEvent, maskSensitiveData } from "@/lib/payments/security"

function createServiceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase service role credentials")
  }
  return createServiceClient(supabaseUrl, serviceRoleKey)
}

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

  // Use service role client to bypass RLS for payment verification
  const supabase = createServiceRoleClient()

  // Find donation by exact transaction_uuid binding
  const { data: donation, error: searchError } = await supabase
    .from("donations")
    .select("*")
    .eq("esewa_transaction_uuid", transaction_uuid)
    .single()

  if (searchError || !donation) {
    // ── Conference registration fallback ────────────────────────────────────
    const { data: reg, error: regError } = await supabase
      .from("conference_registrations")
      .select("id, payment_status, status")
      .eq("esewa_transaction_uuid", transaction_uuid)
      .single()

    // Handle real database errors (not just "not found")
    if (regError && regError.code !== "PGRST116") {
      logPaymentEvent("eSewa failure - conference registration query failed", {
        transactionUuid: maskSensitiveData(transaction_uuid),
        error: regError,
      }, "error")
      return NextResponse.json(
        { error: "Database error while checking registration" },
        { status: 500 }
      )
    }

    if (reg) {
      // Idempotency: already confirmed is not a failure
      if (reg.payment_status === "paid") {
        return NextResponse.redirect(new URL(`/conference/register/payment-success?rid=${reg.id}&paid=1`, url.origin))
      }
      // Idempotency: already failed — skip redundant DB write, redirect immediately
      if (reg.payment_status === "failed") {
        logPaymentEvent("eSewa failure - conference registration already failed", {
          regId: reg.id,
          transactionUuid: maskSensitiveData(transaction_uuid),
        }, "warn")
        return NextResponse.redirect(
          new URL(`/conference/register/payment-success?rid=${reg.id}&status=failed${isMock ? "&mock=1" : ""}`, url.origin),
        )
      }
      // Mark as failed — awaited to guarantee completion in serverless environments
      const { error: regUpdateError } = await supabase
        .from("conference_registrations")
        .update({ payment_status: "failed", payment_failed_at: new Date().toISOString() })
        .eq("id", reg.id)
      if (regUpdateError) {
        logPaymentEvent("eSewa failure - conference registration update failed", {
          regId: reg.id,
          transactionUuid: maskSensitiveData(transaction_uuid),
          error: regUpdateError,
        }, "error")
      }

      logPaymentEvent("eSewa failure - conference registration payment failed", {
        regId: reg.id,
        transactionUuid: maskSensitiveData(transaction_uuid),
        status: status || "unknown",
      })
      return NextResponse.redirect(
        new URL(`/conference/register/payment-success?rid=${reg.id}&status=failed${isMock ? "&mock=1" : ""}`, url.origin),
      )
    }

    logPaymentEvent("eSewa failure - donation not found", {
      transactionUuid: maskSensitiveData(transaction_uuid),
    }, "warn")
    return NextResponse.redirect(
      new URL(`/donate/cancel?provider=esewa&reason=donation_not_found`, url.origin),
    )
  }

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
    .update({ payment_status: "failed", provider: "esewa", provider_ref: transaction_uuid })
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
