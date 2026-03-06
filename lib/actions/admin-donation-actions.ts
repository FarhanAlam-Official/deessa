"use server"

import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { renderTransactionExportToPDF } from "@/lib/admin/transaction-export-pdf"
import type { TransactionExportData } from "@/lib/admin/transaction-export-document"
import { revalidatePath } from "next/cache"
import { generateReceiptForDonation } from "./donation-receipt"

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("Missing Supabase service role env vars")
  return createServiceClient(url, key)
}

// ============================================================================
// Type Definitions
// ============================================================================

export type ChangePaymentStatusInput = {
  donationId: string
  newStatus: "pending" | "completed" | "failed" | "review"
  reason: string
}

export type ChangePaymentStatusResult = {
  ok: boolean
  message: string
}

export type AddReviewNoteInput = {
  donationId: string
  noteText: string
}

export type AddReviewNoteResult = {
  ok: boolean
  message: string
}

export type UpdateReviewStatusInput = {
  donationId: string
  reviewStatus: "unreviewed" | "verified" | "flagged" | "refunded"
}

export type UpdateReviewStatusResult = {
  ok: boolean
  message: string
}

export type ResendReceiptInput = {
  donationId: string
}

export type ResendReceiptResult = {
  ok: boolean
  message: string
}


// ============================================================================
// 1. Change Payment Status
// ============================================================================

/**
 * Change payment status with mandatory reason and audit logging
 * Only accessible to admin and super_admin roles
 */
export async function changePaymentStatus(
  input: ChangePaymentStatusInput
): Promise<ChangePaymentStatusResult> {
  try {
    // 1. Verify authentication
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { ok: false, message: "Unauthorized" }
    }

    // 2. Verify admin role
    const { data: adminUser, error: adminError } = await supabase
      .from("admin_users")
      .select("id, role, full_name")
      .eq("user_id", user.id)
      .single()

    if (adminError || !adminUser) {
      console.error("Admin user lookup error:", adminError)
      return { ok: false, message: "Admin user not found" }
    }

    // Check role - must be ADMIN or SUPER_ADMIN
    if (!["ADMIN", "SUPER_ADMIN"].includes(adminUser.role)) {
      return { ok: false, message: "Insufficient permissions. Admin or Super Admin role required." }
    }

    // 3. Validate reason
    if (!input.reason || input.reason.trim().length < 10) {
      return { ok: false, message: "Reason must be at least 10 characters" }
    }

    // 4. Get current donation using service role
    const serviceSupabase = getServiceSupabase()
    const { data: donation, error: donationError } = await serviceSupabase
      .from("donations")
      .select("payment_status, receipt_number")
      .eq("id", input.donationId)
      .single()

    if (donationError || !donation) {
      console.error("Donation lookup error:", donationError)
      return { ok: false, message: "Donation not found" }
    }

    // Check if status is already the target status
    if (donation.payment_status === input.newStatus) {
      return { ok: false, message: `Status is already set to ${input.newStatus}` }
    }

    // 5. Update payment status
    const { error: updateError } = await serviceSupabase
      .from("donations")
      .update({ payment_status: input.newStatus })
      .eq("id", input.donationId)

    if (updateError) {
      console.error("Failed to update payment status:", updateError)
      return { ok: false, message: "Failed to update status" }
    }

    // 6. Log status change
    const { error: logError } = await serviceSupabase.from("status_change_log").insert({
      donation_id: input.donationId,
      admin_user_id: adminUser.id,
      old_status: donation.payment_status,
      new_status: input.newStatus,
      reason: input.reason.trim(),
    })

    if (logError) {
      console.error("Failed to log status change:", logError)
      // Don't fail the operation, but log the error
    }

    // 7. Trigger receipt generation if changing to completed and no receipt exists
    if (input.newStatus === "completed" && !donation.receipt_number) {
      // Fire-and-forget receipt generation
      generateReceiptForDonation({ donationId: input.donationId }).catch((error) => {
        console.error("Receipt generation failed after status change:", error)
      })
    }

    // 8. Log to payment_events for audit trail
    await serviceSupabase.from("payment_events").insert({
      provider: "system",
      event_id: `manual_status_change:${input.donationId}:${Date.now()}`,
      donation_id: input.donationId,
      event_type: "manual_status_change",
      raw_payload: {
        admin_user_id: adminUser.id,
        admin_name: adminUser.full_name,
        old_status: donation.payment_status,
        new_status: input.newStatus,
        reason: input.reason.trim(),
      },
    })

    // 9. Revalidate page
    revalidatePath(`/admin/donations/${input.donationId}`)
    revalidatePath("/admin/donations")

    return {
      ok: true,
      message: `Payment status updated from ${donation.payment_status} to ${input.newStatus}`,
    }
  } catch (error) {
    console.error("changePaymentStatus error:", error)
    return {
      ok: false,
      message: "An unexpected error occurred while updating payment status",
    }
  }
}


// ============================================================================
// 2. Add Review Note
// ============================================================================

/**
 * Add a new review note to a donation
 * Only accessible to admin and super_admin roles
 */
export async function addReviewNote(input: AddReviewNoteInput): Promise<AddReviewNoteResult> {
  try {
    // 1. Verify authentication
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { ok: false, message: "Unauthorized" }
    }

    // 2. Verify admin role
    const { data: adminUser, error: adminError } = await supabase
      .from("admin_users")
      .select("id, role")
      .eq("user_id", user.id)
      .single()

    if (adminError || !adminUser) {
      console.error("Admin user lookup error:", adminError)
      return { ok: false, message: "Admin user not found" }
    }

    // Check role - must be ADMIN or SUPER_ADMIN
    if (!["ADMIN", "SUPER_ADMIN"].includes(adminUser.role)) {
      return { ok: false, message: "Insufficient permissions. Admin or Super Admin role required." }
    }

    // 3. Validate note text
    if (!input.noteText || input.noteText.trim().length < 10) {
      return { ok: false, message: "Note must be at least 10 characters" }
    }

    // 4. Insert review note using service role
    const serviceSupabase = getServiceSupabase()
    const { error: insertError } = await serviceSupabase.from("review_notes").insert({
      donation_id: input.donationId,
      admin_user_id: adminUser.id,
      note_text: input.noteText.trim(),
    })

    if (insertError) {
      console.error("Failed to add review note:", insertError)
      return { ok: false, message: "Failed to add note" }
    }

    // 5. Revalidate page
    revalidatePath(`/admin/donations/${input.donationId}`)

    return { ok: true, message: "Review note added successfully" }
  } catch (error) {
    console.error("addReviewNote error:", error)
    return {
      ok: false,
      message: "An unexpected error occurred while adding review note",
    }
  }
}

// ============================================================================
// 3. Update Review Status
// ============================================================================

/**
 * Update the review status of a donation
 * Only accessible to admin and super_admin roles
 */
export async function updateReviewStatus(
  input: UpdateReviewStatusInput
): Promise<UpdateReviewStatusResult> {
  try {
    // 1. Verify authentication
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { ok: false, message: "Unauthorized" }
    }

    // 2. Verify admin role
    const { data: adminUser, error: adminError } = await supabase
      .from("admin_users")
      .select("id, role")
      .eq("user_id", user.id)
      .single()

    if (adminError || !adminUser) {
      console.error("Admin user lookup error:", adminError)
      return { ok: false, message: "Admin user not found" }
    }

    // Check role - must be ADMIN or SUPER_ADMIN
    if (!["ADMIN", "SUPER_ADMIN"].includes(adminUser.role)) {
      return { ok: false, message: "Insufficient permissions. Admin or Super Admin role required." }
    }

    // 3. Update review status using service role
    const serviceSupabase = getServiceSupabase()
    const { error: updateError } = await serviceSupabase
      .from("donations")
      .update({
        review_status: input.reviewStatus,
        reviewed_at: new Date().toISOString(),
        reviewed_by: adminUser.id,
      })
      .eq("id", input.donationId)

    if (updateError) {
      console.error("Failed to update review status:", updateError)
      return { ok: false, message: "Failed to update review status" }
    }

    // 4. Revalidate page
    revalidatePath(`/admin/donations/${input.donationId}`)
    revalidatePath("/admin/donations")

    return { ok: true, message: "Review status updated successfully" }
  } catch (error) {
    console.error("updateReviewStatus error:", error)
    return {
      ok: false,
      message: "An unexpected error occurred while updating review status",
    }
  }
}


// ============================================================================
// 4. Resend Receipt
// ============================================================================

/**
 * Resend receipt email with rate limiting
 * Only accessible to admin and super_admin roles
 */
export async function resendReceipt(input: ResendReceiptInput): Promise<ResendReceiptResult> {
  try {
    // 1. Verify authentication
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { ok: false, message: "Unauthorized" }
    }

    // 2. Verify admin role
    const { data: adminUser, error: adminError } = await supabase
      .from("admin_users")
      .select("id, role")
      .eq("user_id", user.id)
      .single()

    if (adminError || !adminUser) {
      console.error("Admin user lookup error:", adminError)
      return { ok: false, message: "Admin user not found" }
    }

    // Check role - must be ADMIN or SUPER_ADMIN
    if (!["ADMIN", "SUPER_ADMIN"].includes(adminUser.role)) {
      return { ok: false, message: "Insufficient permissions. Admin or Super Admin role required." }
    }

    // 3. Check rate limit (3 per hour per donation)
    const serviceSupabase = getServiceSupabase()
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { count, error: countError } = await serviceSupabase
      .from("payment_events")
      .select("id", { count: "exact", head: true })
      .eq("donation_id", input.donationId)
      .eq("event_type", "receipt_resend")
      .gte("created_at", oneHourAgo)

    if (countError) {
      console.error("Rate limit check error:", countError)
    }

    if (count && count >= 3) {
      return {
        ok: false,
        message: "Rate limit exceeded. Maximum 3 receipt resends per hour per donation.",
      }
    }

    // 4. Get donation with receipt
    const { data: donation, error: donationError } = await serviceSupabase
      .from("donations")
      .select("*")
      .eq("id", input.donationId)
      .single()

    if (donationError || !donation) {
      console.error("Donation lookup error:", donationError)
      return { ok: false, message: "Donation not found" }
    }

    if (!donation.receipt_number) {
      return { ok: false, message: "No receipt exists for this donation. Generate receipt first." }
    }

    // 5. Trigger receipt email resend
    // Use the existing generateReceiptForDonation which handles email sending
    const result = await generateReceiptForDonation({ donationId: input.donationId })

    if (!result.success) {
      return { ok: false, message: result.message || "Failed to resend receipt" }
    }

    // 6. Log resend event
    await serviceSupabase.from("payment_events").insert({
      provider: "system",
      event_id: `receipt_resend:${input.donationId}:${Date.now()}`,
      donation_id: input.donationId,
      event_type: "receipt_resend",
      raw_payload: {
        admin_user_id: adminUser.id,
        resent_at: new Date().toISOString(),
      },
    })

    // 7. Revalidate page
    revalidatePath(`/admin/donations/${input.donationId}`)

    return { ok: true, message: "Receipt email sent successfully" }
  } catch (error) {
    console.error("resendReceipt error:", error)
    return {
      ok: false,
      message: "An unexpected error occurred while resending receipt",
    }
  }
}

// ============================================================================
// 5. Export Transaction PDF
// ============================================================================

export type ExportTransactionPDFInput = {
  donationId: string
}

export type ExportTransactionPDFResult = {
  ok: boolean
  message: string
  pdfUrl?: string
  fileName?: string
}

/**
 * Generate and export transaction details as PDF
 * Accessible to all users with finance permission
 */
export async function exportTransactionPDF(
  input: ExportTransactionPDFInput
): Promise<ExportTransactionPDFResult> {
  try {
    // 1. Verify authentication
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { ok: false, message: "Unauthorized" }
    }

    // 2. Verify admin role and finance permission
    const { data: adminUser, error: adminError } = await supabase
      .from("admin_users")
      .select("id, role, full_name")
      .eq("user_id", user.id)
      .single()

    if (adminError || !adminUser) {
      console.error("Admin user lookup error:", adminError)
      return { ok: false, message: "Admin user not found" }
    }

    // Check if user has finance permission (ADMIN, SUPER_ADMIN, or FINANCE roles)
    if (!["ADMIN", "SUPER_ADMIN", "FINANCE"].includes(adminUser.role)) {
      return { ok: false, message: "Insufficient permissions. Finance access required." }
    }

    // 3. Fetch all transaction data using service role
    const serviceSupabase = getServiceSupabase()

    const [donationResult, reviewNotesResult, statusChangesResult, paymentEventsResult] =
      await Promise.all([
        // Main donation data
        serviceSupabase.from("donations").select("*").eq("id", input.donationId).single(),

        // Review notes with admin user info
        serviceSupabase
          .from("review_notes")
          .select(
            `
            id,
            note_text,
            created_at,
            admin_users (
              full_name,
              email
            )
          `
          )
          .eq("donation_id", input.donationId)
          .order("created_at", { ascending: false }),

        // Status change log with admin user info
        serviceSupabase
          .from("status_change_log")
          .select(
            `
            id,
            old_status,
            new_status,
            reason,
            created_at,
            admin_users (
              full_name
            )
          `
          )
          .eq("donation_id", input.donationId)
          .order("created_at", { ascending: false }),

        // Payment events
        serviceSupabase
          .from("payment_events")
          .select("*")
          .eq("donation_id", input.donationId)
          .order("created_at", { ascending: false }),
      ])

    if (donationResult.error || !donationResult.data) {
      console.error("Donation lookup error:", donationResult.error)
      return { ok: false, message: "Donation not found" }
    }

    // 4. Prepare data for PDF generation
    const donation = donationResult.data
    const reviewNotes = reviewNotesResult.data || []
    const statusChanges = statusChangesResult.data || []

    // Fetch payment data for technical details
    const { data: paymentData } = await serviceSupabase
      .from("payments")
      .select("payment_intent_id, session_id, subscription_id, customer_id")
      .eq("donation_id", input.donationId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    const exportData: TransactionExportData = {
      // Transaction
      donationId: donation.id,
      receiptNumber: donation.receipt_number,
      amount: donation.amount,
      currency: donation.currency,
      paymentStatus: donation.payment_status,
      reviewStatus: donation.review_status || "unreviewed",
      provider: donation.provider || "unknown",
      createdAt: new Date(donation.created_at),
      confirmedAt: donation.confirmed_at ? new Date(donation.confirmed_at) : null,
      reviewedAt: donation.reviewed_at ? new Date(donation.reviewed_at) : null,
      
      // Donor
      donorName: donation.donor_name,
      donorEmail: donation.donor_email,
      donorPhone: donation.donor_phone,
      donorMessage: donation.donor_message,
      
      // Payment Technical
      paymentIntentId: paymentData?.payment_intent_id || null,
      sessionId: paymentData?.session_id || null,
      subscriptionId: paymentData?.subscription_id || null,
      customerId: paymentData?.customer_id || null,
      paymentId: donation.payment_id,
      verificationId: donation.verification_id,
      
      // Review Notes
      reviewNotes: reviewNotes.map((note: any) => ({
        noteText: note.note_text,
        createdAt: new Date(note.created_at),
        adminName: note.admin_users?.full_name || "Unknown",
      })),
      
      // Status Changes
      statusChanges: statusChanges.map((change: any) => ({
        oldStatus: change.old_status,
        newStatus: change.new_status,
        reason: change.reason,
        createdAt: new Date(change.created_at),
        adminName: change.admin_users?.full_name || "Unknown",
      })),
      
      // Export metadata
      exportedBy: adminUser.full_name,
      exportedAt: new Date(),
    }

    // 5. Generate PDF
    const pdfBuffer = await renderTransactionExportToPDF(exportData)
    
    // Create a descriptive filename with receipt number or donation ID
    const fileIdentifier = donation.receipt_number || `DON-${donation.id.substring(0, 8)}`
    const dateStr = new Date().toISOString().split('T')[0] // YYYY-MM-DD
    const fileName = `Deesha-Transaction-${fileIdentifier}-${dateStr}.pdf`
    
    // Convert to base64 data URL for download
    const base64 = pdfBuffer.toString('base64')
    const dataUrl = `data:application/pdf;base64,${base64}`

    // 6. Log export action
    await serviceSupabase.from("payment_events").insert({
      provider: "system",
      event_id: `pdf_export:${input.donationId}:${Date.now()}`,
      donation_id: input.donationId,
      event_type: "pdf_export",
      raw_payload: {
        admin_user_id: adminUser.id,
        admin_name: adminUser.full_name,
        file_name: fileName,
        method: 'pdf_direct_download',
      },
    })

    return {
      ok: true,
      message: "Transaction export generated successfully",
      pdfUrl: dataUrl,
      fileName: fileName,
    }
  } catch (error) {
    console.error("exportTransactionPDF error:", error)
    return {
      ok: false,
      message: "An unexpected error occurred while generating export",
    }
  }
}

/**
 * Generate text content for transaction PDF export
 * This is a simple text-based export for MVP
 * Can be enhanced with proper PDF formatting later
 */
function generateTransactionPDFContent(data: {
  donation: any
  reviewNotes: any[]
  statusChanges: any[]
  paymentEvents: any[]
  exportedBy: string
  exportedAt: string
}): string {
  const { donation, reviewNotes, statusChanges, paymentEvents, exportedBy, exportedAt } = data

  let content = `
================================================================================
TRANSACTION DETAILS EXPORT
================================================================================

Exported By: ${exportedBy}
Exported At: ${new Date(exportedAt).toLocaleString()}

================================================================================
TRANSACTION OVERVIEW
================================================================================

Transaction ID: ${donation.id}
Receipt Number: ${donation.receipt_number || "Not generated"}
Amount: ${donation.amount} ${donation.currency}
Payment Status: ${donation.payment_status}
Review Status: ${donation.review_status || "unreviewed"}
Payment Provider: ${donation.provider}
Payment Method: ${donation.payment_method || "N/A"}

Created At: ${new Date(donation.created_at).toLocaleString()}
Confirmed At: ${donation.confirmed_at ? new Date(donation.confirmed_at).toLocaleString() : "Not confirmed"}
Receipt Sent At: ${donation.receipt_sent_at ? new Date(donation.receipt_sent_at).toLocaleString() : "Not sent"}
Reviewed At: ${donation.reviewed_at ? new Date(donation.reviewed_at).toLocaleString() : "Not reviewed"}

================================================================================
DONOR INFORMATION
================================================================================

Name: ${donation.donor_name}
Email: ${donation.donor_email}
Phone: ${donation.donor_phone || "Not provided"}
Message: ${donation.donor_message || "No message"}

================================================================================
PAYMENT TECHNICAL DETAILS
================================================================================

Provider Reference: ${donation.provider_ref || "N/A"}
Payment ID: ${donation.payment_id || "N/A"}
Stripe Session ID: ${donation.stripe_session_id || "N/A"}
Khalti PIDX: ${donation.khalti_pidx || "N/A"}
eSewa Transaction UUID: ${donation.esewa_transaction_uuid || "N/A"}
Verification ID: ${donation.verification_id || "N/A"}

================================================================================
REVIEW NOTES (${reviewNotes.length})
================================================================================

`

  if (reviewNotes.length === 0) {
    content += "No review notes\n\n"
  } else {
    reviewNotes.forEach((note, index) => {
      content += `
[${index + 1}] ${new Date(note.created_at).toLocaleString()}
By: ${note.admin_users?.full_name || "Unknown"}
${note.note_text}

`
    })
  }

  content += `
================================================================================
STATUS CHANGE LOG (${statusChanges.length})
================================================================================

`

  if (statusChanges.length === 0) {
    content += "No status changes\n\n"
  } else {
    statusChanges.forEach((change, index) => {
      content += `
[${index + 1}] ${new Date(change.created_at).toLocaleString()}
By: ${change.admin_users?.full_name || "Unknown"}
Changed: ${change.old_status} → ${change.new_status}
Reason: ${change.reason}

`
    })
  }

  content += `
================================================================================
PAYMENT EVENTS (${paymentEvents.length})
================================================================================

`

  if (paymentEvents.length === 0) {
    content += "No payment events\n\n"
  } else {
    paymentEvents.forEach((event, index) => {
      content += `
[${index + 1}] ${new Date(event.created_at).toLocaleString()}
Provider: ${event.provider}
Event Type: ${event.event_type}
Event ID: ${event.event_id}

`
    })
  }

  content += `
================================================================================
END OF REPORT
================================================================================
`

  return content
}
