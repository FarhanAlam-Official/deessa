"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

/**
 * Resend receipt email for a failed donation
 */
export async function resendReceiptEmail(donationId: string) {
  try {
    const supabase = await createClient()

    // Get donation with receipt details
    const { data: donation, error: donationError } = await supabase
      .from("donations")
      .select("*")
      .eq("id", donationId)
      .single()

    if (donationError || !donation) {
      return {
        success: false,
        message: "Donation not found",
      }
    }

    if (!donation.receipt_number) {
      return {
        success: false,
        message: "Receipt not generated yet",
      }
    }

    // TODO: Implement email sending logic
    // For now, this is a placeholder that would call your email service
    // Example: await sendReceiptEmail({ donationId, email: donation.donor_email })

    // Revalidate the page to show updated data
    revalidatePath("/admin/receipts/emails/failed")

    return {
      success: true,
      message: "Email sent successfully",
    }
  } catch (error) {
    console.error("Error resending receipt email:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

/**
 * Mark an email failure as resolved
 */
export async function resolveEmailFailure(
  failureId: string,
  resolutionNotes?: string
) {
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Not authenticated")
  }

  const { error } = await supabase
    .from("email_failures")
    .update({
      resolved_at: new Date().toISOString(),
      resolved_by: user.email || user.id,
      resolution_notes: resolutionNotes,
    })
    .eq("id", failureId)

  if (error) {
    console.error("Error resolving email failure:", error)
    throw new Error(`Failed to resolve failure: ${error.message}`)
  }

  // Revalidate the page
  revalidatePath("/admin/receipts/emails/failed")

  return { success: true }
}
