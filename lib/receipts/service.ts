/**
 * Receipt Service
 * Handles receipt generation, storage, and email delivery
 */

"use server"

import { createClient as createServiceClient } from "@supabase/supabase-js"
import { generateReceiptNumber, generateReceiptHTML, getOrganizationDetails } from "./generator"
import { renderReceiptToPDF } from "./pdf-renderer"
import type { ReceiptPDFData } from "./receipt-document"
import { sendReceiptEmail } from "@/lib/email/receipt-mailer"
import { generateReceiptDownloadUrl } from "./token"
import { verificationQRBase64 } from "./qr"

/**
 * Returns a Supabase service-role client.
 * Used in receipt generation which runs as a fire-and-forget in API routes.
 * In that context there is no user session cookie, so the anon client is
 * blocked by RLS and silently fails on all DB writes.
 */
function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("Missing Supabase service role env vars")
  return createServiceClient(url, key)
}

export interface ReceiptGenerationResult {
  success: boolean
  receiptNumber?: string
  receiptUrl?: string
  receiptPdfUrl?: string
  message: string
}

/**
 * Generate and store receipt for a donation
 */
export async function generateAndStoreReceipt(
  donationId: string,
  donorName: string,
  donorEmail: string,
  donorPhone: string | undefined,
  amount: number,
  currency: string,
  paymentMethod: string,
  paymentDate: Date,
  isMonthly: boolean,
  providerRef?: string,
): Promise<ReceiptGenerationResult> {
  try {
    // IMPORTANT: use service-role client, NOT anon client.
    // This function runs fire-and-forget inside API routes that have no auth session.
    // Anon client is blocked by RLS and the receipt_number UPDATE silently fails.
    const supabase = getServiceSupabase()

    // Check if receipt already exists (idempotency guard)
    const { data: existingDonation } = await supabase
      .from("donations")
      .select("receipt_number, receipt_url")
      .eq("id", donationId)
      .single()

    if (existingDonation?.receipt_number) {
      // Generate token-based URL for existing receipt
      const tokenUrl = await generateReceiptDownloadUrl(
        donationId,
        existingDonation.receipt_number
      )

      // If this donation was created before we switched to token-based URLs,
      // update it to use the new secure URL format
      if (!existingDonation.receipt_url || !existingDonation.receipt_url.includes("token=")) {
        await supabase
          .from("donations")
          .update({ receipt_url: tokenUrl })
          .eq("id", donationId)
      }

      return {
        success: true,
        receiptNumber: existingDonation.receipt_number,
        receiptUrl: tokenUrl,
        message: "Receipt already generated for this donation",
      }
    }


    // Generate receipt number
    const receiptNumber = await generateReceiptNumber()

    // Get organization details
    const orgDetails = await getOrganizationDetails()

    // Generate receipt HTML
    const receiptHTML = generateReceiptHTML({
      donationId,
      donorName,
      donorEmail,
      donorPhone,
      amount,
      currency,
      paymentMethod,
      paymentDate,
      isMonthly,
      receiptNumber,
      organizationDetails: orgDetails,
    })

    // Store receipt HTML in Supabase Storage (source for email).
    const htmlFileName = `${donationId}-${receiptNumber}.html`
    const { error: htmlUploadError } = await supabase.storage
      .from("receipts")
      .upload(htmlFileName, Buffer.from(receiptHTML), {
        contentType: "text/html",
        upsert: true,
      })

    if (htmlUploadError) {
      console.error("HTML upload error:", htmlUploadError)
    }

    // Generate PDF using @react-pdf/renderer and upload alongside HTML.
    const pdfFileName = `${donationId}-${receiptNumber}.pdf`
    try {
      // Fetch verification_id from database (may be null for old donations)
      const { data: donationData } = await supabase
        .from("donations")
        .select("verification_id")
        .eq("id", donationId)
        .single()

      const verificationId = donationData?.verification_id
      let verificationQR: string | undefined

      // Generate QR code if verification_id exists
      if (verificationId) {
        try {
          verificationQR = await verificationQRBase64(verificationId)
        } catch (qrError) {
          console.warn("[ReceiptService] QR code generation failed (non-fatal):", qrError)
        }
      }

      const pdfData: ReceiptPDFData = {
        receiptNumber,
        donationId,
        paymentDate,
        donorName,
        donorEmail,
        donorPhone,
        amount,
        currency,
        paymentMethod,
        isMonthly,
        providerRef,
        organization: orgDetails,
        verificationId,
        verificationQR,
      }
      const pdfBuffer = await renderReceiptToPDF(pdfData)
      const { error: pdfUploadError } = await supabase.storage
        .from("receipts")
        .upload(pdfFileName, pdfBuffer, {
          contentType: "application/pdf",
          upsert: true,
        })
      if (pdfUploadError) {
        console.warn("[ReceiptService] PDF upload failed (non-fatal):", pdfUploadError.message)
      }
    } catch (pdfErr) {
      console.error(
        "[ReceiptService] PDF generation failed (non-fatal) — download will regenerate on-the-fly.",
        "\nError:", pdfErr instanceof Error ? pdfErr.message : pdfErr,
        "\nStack:", pdfErr instanceof Error ? pdfErr.stack : "(no stack)",
      )
    }

    // The canonical download URL now uses token-based authentication
    // for secure, time-limited access to receipts
    const receiptUrl = await generateReceiptDownloadUrl(donationId, receiptNumber)

    // Update donation with receipt info
    const { error: updateError } = await supabase
      .from("donations")
      .update({
        receipt_number: receiptNumber,
        receipt_url: receiptUrl,
        receipt_generated_at: new Date().toISOString(),
      })
      .eq("id", donationId)

    if (updateError) {
      // 23505 = unique_violation: receipt_number already exists on another row.
      // This happens when a previous run generated a malformed number (e.g. NaN)
      // and a retry generates the same broken value.
      // Treat as a soft error: the PDF was generated and uploaded; log and continue.
      if ((updateError as { code?: string }).code === "23505") {
        console.warn(
          "[ReceiptService] Duplicate receipt_number — likely a NaN collision from a previous run.",
          "receipt_number:", receiptNumber,
          "donation:", donationId,
          updateError,
        )
        // Return success so the webhook handler doesn't retry; the fix to
        // generateReceiptNumber() will produce unique numbers from now on.
        return {
          success: true,
          receiptNumber,
          receiptUrl,
          message: "Receipt PDF generated (duplicate number warning — see logs)",
        }
      }
      console.error("Failed to update donation with receipt:", updateError)
      return {
        success: false,
        message: "Failed to update donation record",
      }
    }

    // Log receipt generation
    await logReceiptAction(donationId, "generated", {
      receiptNumber,
      receiptUrl,
    })

    return {
      success: true,
      receiptNumber,
      receiptUrl,
      message: "Receipt generated successfully",
    }

  } catch (error) {
    console.error("Receipt generation error:", error)
    return {
      success: false,
      message: "An error occurred while generating the receipt",
    }
  }
}

/**
 * Send receipt email to donor
 */
export async function sendReceiptToDonor(
  donationId: string,
  donorName: string,
  donorEmail: string,
  receiptNumber: string,
  receiptUrl: string,
  amount: number,
  currency: string,
  verificationId?: string,
): Promise<{ success: boolean; message: string }> {
  try {
    const supabase = getServiceSupabase()

    // Send email
    const emailResult = await sendReceiptEmail({
      donorName,
      donorEmail,
      receiptNumber,
      receiptUrl,
      amount,
      currency,
      verificationId,
    })

    if (!emailResult.success) {
      console.error("Failed to send receipt email:", emailResult.message)
      return {
        success: false,
        message: "Failed to send receipt email",
      }
    }

    // Update donation with sent timestamp
    const { error: updateError } = await supabase
      .from("donations")
      .update({
        receipt_sent_at: new Date().toISOString(),
      })
      .eq("id", donationId)

    if (updateError) {
      console.error("Failed to update receipt_sent_at:", updateError)
    }

    // Log email sent
    await logReceiptAction(donationId, "sent", {
      sentTo: donorEmail,
      sentAt: new Date().toISOString(),
    })

    return {
      success: true,
      message: "Receipt email sent successfully",
    }
  } catch (error) {
    console.error("Error sending receipt email:", error)
    return {
      success: false,
      message: "An error occurred while sending the receipt email",
    }
  }
}

/**
 * Track receipt download
 */
export async function trackReceiptDownload(donationId: string): Promise<void> {
  try {
    const supabase = getServiceSupabase()

    // Increment download count
    const { data: donation } = await supabase
      .from("donations")
      .select("receipt_download_count")
      .eq("id", donationId)
      .single()

    const currentCount = donation?.receipt_download_count || 0

    await supabase
      .from("donations")
      .update({
        receipt_download_count: currentCount + 1,
      })
      .eq("id", donationId)

    // Log download
    await logReceiptAction(donationId, "downloaded", {
      downloadedAt: new Date().toISOString(),
      totalDownloads: currentCount + 1,
    })
  } catch (error) {
    console.error("Error tracking receipt download:", error)
  }
}

/**
 * Resend receipt email
 */
export async function resendReceiptEmail(
  donationId: string,
): Promise<{ success: boolean; message: string }> {
  try {
    const supabase = getServiceSupabase()

    // Get donation details
    const { data: donation, error } = await supabase
      .from("donations")
      .select("*")
      .eq("id", donationId)
      .single()

    if (error || !donation) {
      return {
        success: false,
        message: "Donation not found",
      }
    }

    if (!donation.receipt_number || !donation.receipt_url) {
      return {
        success: false,
        message: "Receipt not yet generated for this donation",
      }
    }

    // Generate fresh token-based URL for resend
    const tokenUrl = await generateReceiptDownloadUrl(
      donationId,
      donation.receipt_number
    )

    // Update to token-based URL if needed
    if (!donation.receipt_url.includes("token=")) {
      await supabase
        .from("donations")
        .update({ receipt_url: tokenUrl })
        .eq("id", donationId)
    }

    // Send email
    const emailResult = await sendReceiptToDonor(
      donationId,
      donation.donor_name,
      donation.donor_email,
      donation.receipt_number,
      tokenUrl,
      donation.amount,
      donation.currency,
      donation.verification_id,
    )

    if (emailResult.success) {
      // Log resend
      await logReceiptAction(donationId, "resent", {
        resentTo: donation.donor_email,
        resentAt: new Date().toISOString(),
      })
    }

    return emailResult
  } catch (error) {
    console.error("Error resending receipt email:", error)
    return {
      success: false,
      message: "An error occurred while resending the receipt email",
    }
  }
}

/**
 * Log receipt action for audit trail
 */
async function logReceiptAction(
  donationId: string,
  action: string,
  details: Record<string, unknown>,
): Promise<void> {
  try {
    const supabase = getServiceSupabase()

    await supabase.from("receipt_audit_log").insert({
      donation_id: donationId,
      action,
      details,
    })
  } catch (error) {
    console.error("Error logging receipt action:", error)
  }
}

/**
 * Get receipt details for a donation
 */
export async function getReceiptDetails(donationId: string) {
  try {
    const supabase = getServiceSupabase()

    const { data: donation, error } = await supabase
      .from("donations")
      .select(
        "id, receipt_number, receipt_url, receipt_generated_at, receipt_sent_at, receipt_download_count",
      )
      .eq("id", donationId)
      .single()

    if (error || !donation) {
      return null
    }

    return donation
  } catch (error) {
    console.error("Error fetching receipt details:", error)
    return null
  }
}
