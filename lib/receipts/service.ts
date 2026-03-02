/**
 * Receipt Service
 * Handles receipt generation, storage, and email delivery
 */

"use server"

import { createClient as createServiceClient } from "@supabase/supabase-js"
import { generateReceiptNumber, generateReceiptHTML, getOrganizationDetails } from "./generator"
import { sendReceiptEmail } from "@/lib/email/receipt-mailer"

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
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
      const canonicalUrl = `${baseUrl}/api/receipts/download?id=${existingDonation.receipt_number}`
      const existingUrl = existingDonation.receipt_url || undefined

      // If this donation was created before we switched to the download API as the
      // canonical URL, repair it so email links never point at raw HTML storage.
      if (!existingUrl || !existingUrl.includes("/api/receipts/download")) {
        await supabase
          .from("donations")
          .update({ receipt_url: canonicalUrl })
          .eq("id", donationId)
      }

      return {
        success: true,
        receiptNumber: existingDonation.receipt_number,
        receiptUrl: canonicalUrl,
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

    // Store receipt HTML in Supabase Storage.
    // PDFs are generated on-demand by the download route (/api/receipts/download?id=...)
    // so we only need to persist the HTML source here.
    const htmlFileName = `${donationId}-${receiptNumber}.html`
    const { error: htmlUploadError } = await supabase.storage
      .from("receipts")
      .upload(htmlFileName, Buffer.from(receiptHTML), {
        contentType: "text/html",
        upsert: true, // overwrite if re-generated
      })

    if (htmlUploadError) {
      console.error("HTML upload error:", htmlUploadError)
    }

    // The canonical download URL points to our API route which generates the PDF
    // live from the stored HTML. This works in all environments (dev + prod) and
    // avoids the Puppeteer/Chromium setup issue at receipt-creation time.
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
    const receiptUrl = `${baseUrl}/api/receipts/download?id=${receiptNumber}`

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

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
    const canonicalUrl = `${baseUrl}/api/receipts/download?id=${donation.receipt_number}`
    const effectiveUrl =
      typeof donation.receipt_url === "string" && donation.receipt_url.includes("/api/receipts/download")
        ? donation.receipt_url
        : canonicalUrl

    if (effectiveUrl !== donation.receipt_url) {
      await supabase
        .from("donations")
        .update({ receipt_url: effectiveUrl })
        .eq("id", donationId)
    }

    // Send email
    const emailResult = await sendReceiptToDonor(
      donationId,
      donation.donor_name,
      donation.donor_email,
      donation.receipt_number,
      effectiveUrl,
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
