/**
 * Donation Receipt Actions
 * Server actions for receipt generation and management
 */

"use server"

import { createClient } from "@/lib/supabase/server"
import { generateAndStoreReceipt, sendReceiptToDonor } from "@/lib/receipts/service"
import { getOrganizationDetails } from "@/lib/receipts/generator"

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
 */
export async function getReceiptForDisplay(donationId: string) {
  try {
    const supabase = await createClient()

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
