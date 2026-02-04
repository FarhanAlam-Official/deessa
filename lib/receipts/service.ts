/**
 * Receipt Service
 * Handles receipt generation, storage, and email delivery
 */

"use server"

import { createClient } from "@/lib/supabase/server"
import { generateReceiptNumber, generateReceiptHTML, getOrganizationDetails } from "./generator"
import { sendReceiptEmail } from "@/lib/email/receipt-mailer"
import { generateReceiptPDF } from "./pdf-generator"
import { format } from "date-fns"

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
): Promise<ReceiptGenerationResult> {
  try {
    const supabase = await createClient()

    // Check if receipt already exists
    const { data: existingDonation } = await supabase
      .from("donations")
      .select("receipt_number, receipt_url")
      .eq("id", donationId)
      .single()

    if (existingDonation?.receipt_number) {
      return {
        success: true,
        receiptNumber: existingDonation.receipt_number,
        receiptUrl: existingDonation.receipt_url || undefined,
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

    // Generate PDF from HTML
    let receiptPdfUrl: string | undefined
    try {
      const pdfBuffer = await generateReceiptPDF(receiptHTML)
      
      // Store PDF in Supabase Storage
      const pdfFileName = `${donationId}-${receiptNumber}.pdf`
      const { error: pdfUploadError } = await supabase.storage
        .from("receipts")
        .upload(pdfFileName, pdfBuffer, {
          contentType: "application/pdf",
          upsert: false,
        })

      if (pdfUploadError) {
        console.error("PDF upload error:", pdfUploadError)
        // Continue with HTML if PDF fails
      } else {
        // Get public URL for PDF
        const { data: pdfUrlData } = supabase.storage.from("receipts").getPublicUrl(pdfFileName)
        receiptPdfUrl = pdfUrlData?.publicUrl
      }
    } catch (pdfError) {
      console.error("PDF generation error:", pdfError)
      // Continue with HTML if PDF generation fails
    }

    // Store receipt HTML in Supabase Storage (as backup/preview)
    const htmlFileName = `${donationId}-${receiptNumber}.html`
    const { error: htmlUploadError } = await supabase.storage
      .from("receipts")
      .upload(htmlFileName, Buffer.from(receiptHTML), {
        contentType: "text/html",
        upsert: false,
      })

    if (htmlUploadError) {
      console.error("HTML upload error:", htmlUploadError)
    }

    // Use PDF URL as primary receipt URL, fallback to HTML if PDF not available
    const receiptUrl = receiptPdfUrl || (() => {
      const { data: htmlUrlData } = supabase.storage.from("receipts").getPublicUrl(htmlFileName)
      return htmlUrlData?.publicUrl
    })()

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
      receiptPdfUrl,
    })

    return {
      success: true,
      receiptNumber,
      receiptUrl,
      receiptPdfUrl,
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
): Promise<{ success: boolean; message: string }> {
  try {
    const supabase = await createClient()

    // Send email
    const emailResult = await sendReceiptEmail({
      donorName,
      donorEmail,
      receiptNumber,
      receiptUrl,
      amount,
      currency,
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
    const supabase = await createClient()

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
    const supabase = await createClient()

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

    // Send email
    const emailResult = await sendReceiptToDonor(
      donationId,
      donation.donor_name,
      donation.donor_email,
      donation.receipt_number,
      donation.receipt_url,
      donation.amount,
      donation.currency,
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
    const supabase = await createClient()

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
    const supabase = await createClient()

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
