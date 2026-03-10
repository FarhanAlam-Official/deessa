"use server"

import { createClient } from "@/lib/supabase/server"
import { generateReceiptForDonation } from "@/lib/actions/donation-receipt"
import { revalidatePath } from "next/cache"

/**
 * Retry receipt generation for a failed donation
 */
export async function retryReceiptGeneration(donationId: string) {
  try {
    const result = await generateReceiptForDonation({ donationId })
    
    // Revalidate the page to show updated data
    revalidatePath("/admin/receipts/failed")
    
    return result
  } catch (error) {
    console.error("Error retrying receipt generation:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

/**
 * Mark a receipt failure as resolved
 */
export async function resolveReceiptFailure(
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
    .from("receipt_failures")
    .update({
      resolved_at: new Date().toISOString(),
      resolved_by: user.email || user.id,
      resolution_notes: resolutionNotes,
    })
    .eq("id", failureId)

  if (error) {
    console.error("Error resolving receipt failure:", error)
    throw new Error(`Failed to resolve failure: ${error.message}`)
  }

  // Revalidate the page
  revalidatePath("/admin/receipts/failed")

  return { success: true }
}
