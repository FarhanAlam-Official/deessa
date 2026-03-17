/**
 * eSewa Conference Registration Handler
 * 
 * This module handles eSewa payment verification for conference registrations.
 * Extracted from the main success callback to avoid code duplication.
 * 
 * ARCHITECTURAL DECISION:
 * Conference registrations currently use inline payment verification logic
 * instead of the centralized PaymentService. This is a known architectural
 * inconsistency that should be addressed in a future refactor.
 * 
 * Future Work:
 * - Create a unified payment confirmation service that handles both donations
 *   and conference registrations
 * - Implement proper state machine for conference payment status
 * - Add transactional integrity for conference payment updates
 * - Use payment_events table for conference payment idempotency
 * 
 * For now, this handler consolidates the conference verification logic to
 * avoid duplication between donation and conference branches.
 */

import crypto from "crypto"
import { NextResponse } from "next/server"
import type { SupabaseClient } from "@supabase/supabase-js"
import {
  verifyAmountMatch,
  logPaymentEvent,
  maskSensitiveData,
} from "@/lib/payments/security"
import { sendConferenceConfirmationEmail } from "@/lib/email/conference-mailer"

/**
 * Verify HMAC-SHA256 signature for eSewa v2 API response.
 * Returns { valid: true } on success or { valid: false, reason } on failure.
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

/**
 * Handle eSewa payment verification for conference registrations
 * 
 * @param supabase - Supabase service client
 * @param transaction_uuid - eSewa transaction UUID
 * @param responseData - Parsed eSewa callback data
 * @param url - Request URL for redirects
 * @param mode - Payment mode (live/mock)
 * @param isMock - Whether this is a mock transaction
 * @returns NextResponse if conference registration found, null otherwise
 */
export async function handleConferenceVerification(
  supabase: SupabaseClient,
  transaction_uuid: string,
  responseData: any,
  url: URL,
  isMock: boolean
): Promise<NextResponse | null> {
  const {
    transaction_code,
    status,
    total_amount,
    signed_field_names,
    signature,
  } = responseData

  // Check if this is a conference registration payment
  const { data: reg } = await supabase
    .from("conference_registrations")
    .select("*")
    .eq("esewa_transaction_uuid", transaction_uuid)
    .single()

  if (!reg) {
    return null // Not a conference registration
  }

  // Validate status
  if (status !== "COMPLETE") {
    logPaymentEvent("eSewa success - conference payment not completed", {
      regId: reg.id,
      status,
      transactionUuid: maskSensitiveData(transaction_uuid),
    }, "warn")
    await supabase
      .from("conference_registrations")
      .update({ 
        payment_status: "failed", 
        payment_failed_at: new Date().toISOString() 
      })
      .eq("id", reg.id)
    return NextResponse.redirect(
      new URL(`/conference/register/payment-success?rid=${reg.id}&status=failed`, url.origin)
    )
  }

  // Check if already paid (idempotency)
  if (reg.payment_status === "paid") {
    return NextResponse.redirect(
      new URL(`/conference/register/payment-success?rid=${reg.id}&paid=1`, url.origin)
    )
  }

  // Amount verification
  const expectedAmt = parseFloat((reg.payment_amount || 0).toString())
  const actualAmt = parseFloat(total_amount.toString())
  const av = verifyAmountMatch(expectedAmt, actualAmt, "NPR", 0.01)
  
  if (!av.valid) {
    await supabase
      .from("conference_registrations")
      .update({ 
        payment_status: "review", 
        esewa_transaction_uuid: transaction_uuid, 
        payment_review_at: new Date().toISOString() 
      })
      .eq("id", reg.id)
    return NextResponse.redirect(
      new URL(`/conference/register/payment-success?rid=${reg.id}&status=review`, url.origin)
    )
  }

  // HMAC signature verification (required; skip for isMock)
  if (!isMock) {
    const secretKey = process.env.ESEWA_SECRET_KEY
    if (!secretKey) {
      logPaymentEvent("eSewa success - missing ESEWA_SECRET_KEY", {}, "error")
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
        .update({ 
          payment_status: "failed", 
          payment_failed_at: new Date().toISOString() 
        })
        .eq("id", reg.id)
      return NextResponse.redirect(
        new URL(`/conference/register/payment-success?rid=${reg.id}&status=failed`, url.origin)
      )
    }
  }

  // Update conference registration status
  const { error: regUpdateError } = await supabase
    .from("conference_registrations")
    .update({
      status: "confirmed",
      payment_status: "paid",
      payment_provider: "esewa",
      payment_id: `esewa:${transaction_uuid}`,
      provider_ref: transaction_uuid,
      payment_paid_at: new Date().toISOString(),
      confirmed_at: new Date().toISOString(),
    })
    .eq("id", reg.id)

  if (regUpdateError) {
    logPaymentEvent("eSewa success - conference registration update failed", {
      regId: reg.id,
      transactionUuid: maskSensitiveData(transaction_uuid),
      error: regUpdateError,
    }, "error")
    return NextResponse.redirect(
      new URL(`/conference/register/payment-success?rid=${reg.id}&status=failed`, url.origin)
    )
  }

  // Send confirmation email (non-blocking)
  sendConferenceConfirmationEmail({
    fullName: reg.full_name,
    email: reg.email,
    registrationId: reg.id,
    attendanceMode: reg.attendance_mode || "",
    role: reg.role || undefined,
    workshops: reg.workshops || undefined,
  })
    .then((r) => {
      if (r.success) {
        supabase
          .from("conference_registrations")
          .update({ last_confirmation_email_sent_at: new Date().toISOString() })
          .eq("id", reg.id)
          .then(() => {})
      }
    })
    .catch((e) => console.error("Non-fatal: eSewa conference confirmation email:", e))

  return NextResponse.redirect(
    new URL(`/conference/register/payment-success?rid=${reg.id}&paid=1`, url.origin)
  )
}
