/**
 * Donation Receipt Actions
 * Server actions for receipt generation and management
 */

"use server"

import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { generateAndStoreReceipt, sendReceiptToDonor } from "@/lib/receipts/service"
import { getOrganizationDetails } from "@/lib/receipts/generator"

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("Missing Supabase service role env vars")
  return createServiceClient(url, key)
}

export type GenerateReceiptInput = {
  donationId: string
}

export type GenerateReceiptResult = {
  success: boolean
  message: string
  receiptNumber?: string
  receiptUrl?: string
}

/**
 * Generate receipt after payment is confirmed
 * Called from webhook handlers or success page
 */
export async function generateReceiptForDonation(
  input: GenerateReceiptInput,
): Promise<GenerateReceiptResult> {
  try {
    const supabase = await createClient()

    // Get donation details
    const { data: donation, error } = await supabase
      .from("donations")
      .select("*")
      .eq("id", input.donationId)
      .single()

    if (error || !donation) {
      return {
        success: false,
        message: "Donation not found",
      }
    }

    // Check if payment is completed
    if (donation.payment_status !== "completed") {
      return {
        success: false,
        message: "Payment not yet confirmed",
      }
    }

    // Generate receipt
    const receiptResult = await generateAndStoreReceipt(
      donation.id,
      donation.donor_name,
      donation.donor_email,
      donation.donor_phone,
      donation.amount,
      donation.currency,
      donation.provider || "unknown",
      new Date(donation.created_at),
      donation.is_monthly,
    )

    if (!receiptResult.success) {
      return {
        success: false,
        message: receiptResult.message,
      }
    }

    // Send receipt email
    if (receiptResult.receiptNumber && receiptResult.receiptUrl) {
      const emailResult = await sendReceiptToDonor(
        donation.id,
        donation.donor_name,
        donation.donor_email,
        receiptResult.receiptNumber,
        receiptResult.receiptUrl,
        donation.amount,
        donation.currency,
      )

      if (!emailResult.success) {
        console.warn("Receipt email failed to send:", emailResult.message)
        // Don't fail the whole operation if email fails
      }
    }

    return {
      success: true,
      message: "Receipt generated and sent successfully",
      receiptNumber: receiptResult.receiptNumber,
      receiptUrl: receiptResult.receiptUrl,
    }
  } catch (error) {
    console.error("Generate receipt error:", error)
    return {
      success: false,
      message: "An error occurred while generating the receipt",
    }
  }
}

/**
 * Get receipt details for display
 * Uses service role client so receipt_number is readable regardless of RLS.
 */
export async function getReceiptForDisplay(donationId: string) {
  try {
    const supabase = getServiceSupabase()

    const { data: donation, error } = await supabase
      .from("donations")
      .select(
        "id, receipt_number, receipt_url, receipt_generated_at, receipt_sent_at, receipt_download_count, donor_name, donor_email, donor_phone, amount, currency, is_monthly, created_at, provider",
      )
      .eq("id", donationId)
      .single()

    if (error || !donation) {
      return null
    }

    return donation
  } catch (error) {
    console.error("Get receipt error:", error)
    return null
  }
}

/**
 * Get organization details for receipt display
 */
export async function getOrganizationDetailsForReceipt() {
  try {
    const orgDetails = await getOrganizationDetails()
    return {
      name: orgDetails.name,
      vatNumber: orgDetails.vat_registration_number,
      panNumber: orgDetails.pan_number,
      swcNumber: orgDetails.swc_registration_number,
    }
  } catch (error) {
    console.error("Get organization details error:", error)
    return {
      name: "Dessa Foundation",
      vatNumber: "",
      panNumber: "",
      swcNumber: "",
    }
  }
}

/**
 * Look up a donation by a payment-provider identifier.
 * Used by the success page to hydrate donation data for Khalti and eSewa
 * where the payment handler only redirects with a reference code (no donationId).
 *
 * Tries columns in order:
 *   1. khalti_pidx
 *   2. esewa_transaction_uuid
 *   3. stripe_session_id
 *   4. payment_id (composite string like "khalti:PIDX123")
 */
export async function getDonationByPaymentRef(ref: string): Promise<{
  id: string
  amount: number
  currency: string
  donor_name: string
  donor_email: string
  donor_phone: string | null
  is_monthly: boolean
  payment_status: string
  provider: string | null
  receipt_number: string | null
  receipt_url: string | null
  receipt_generated_at: string | null
  created_at: string
} | null> {
  if (!ref || ref.trim().length === 0) return null

  try {
    const supabase = await createClient()

    const selectFields =
      "id, amount, currency, donor_name, donor_email, donor_phone, is_monthly, payment_status, provider, receipt_number, receipt_url, receipt_generated_at, created_at"

    // Try khalti_pidx
    const { data: byPidx } = await supabase
      .from("donations")
      .select(selectFields)
      .eq("khalti_pidx", ref)
      .maybeSingle()
    if (byPidx) return byPidx

    // Try esewa_transaction_uuid
    const { data: byEsewaUuid } = await supabase
      .from("donations")
      .select(selectFields)
      .eq("esewa_transaction_uuid", ref)
      .maybeSingle()
    if (byEsewaUuid) return byEsewaUuid

    // Try esewa_transaction_code (returned in success URL as transaction_code param)
    const { data: byEsewaCode } = await supabase
      .from("donations")
      .select(selectFields)
      .eq("esewa_transaction_code", ref)
      .maybeSingle()
    if (byEsewaCode) return byEsewaCode

    // Try stripe_session_id
    const { data: byStripeSession } = await supabase
      .from("donations")
      .select(selectFields)
      .eq("stripe_session_id", ref)
      .maybeSingle()
    if (byStripeSession) return byStripeSession

    // Try payment_id (e.g., "esewa:TX123" or "khalti:PIDX123")
    const { data: byPaymentId } = await supabase
      .from("donations")
      .select(selectFields)
      .eq("payment_id", ref)
      .maybeSingle()
    if (byPaymentId) return byPaymentId

    // Try payment_id with provider-prefixed variants
    const variants = [`khalti:${ref}`, `esewa:${ref}`, `esewa:code:${ref}`]
    for (const variant of variants) {
      const { data: byVariant } = await supabase
        .from("donations")
        .select(selectFields)
        .eq("payment_id", variant)
        .maybeSingle()
      if (byVariant) return byVariant
    }

    return null
  } catch (error) {
    console.error("getDonationByPaymentRef error:", error)
    return null
  }
}

