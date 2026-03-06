/**
 * Receipt Download API
 *
 * Serves pre-generated PDF receipts from Supabase Storage.
 * If the PDF is missing (e.g. legacy donation), generates it on-the-fly
 * with @react-pdf/renderer, caches it to storage, then serves it.
 * No Puppeteer / Chromium involved.
 *
 * Security: Token-based authentication (JWT). Legacy ?id= path supported
 * only when LEGACY_RECEIPT_ACCESS=true env var is set.
 */

import { createClient as createServiceClient } from "@supabase/supabase-js"
import { trackReceiptDownload } from "@/lib/receipts/service"
import { getOrganizationDetails } from "@/lib/receipts/generator"
import { renderReceiptToPDF } from "@/lib/receipts/pdf-renderer"
import { verifyReceiptToken } from "@/lib/receipts/token"
import { checkRateLimit, getClientIP } from "@/lib/rate-limit"
import { verificationQRBase64 } from "@/lib/receipts/qr"
import { NextRequest, NextResponse } from "next/server"

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("Missing Supabase service role env vars")
  return createServiceClient(url, key)
}

export async function GET(request: NextRequest) {
  try {
    // 1. Apply rate limiting (10 requests per minute per IP)
    const clientIP = getClientIP(request)
    const rateLimitIdentifier = clientIP 
      ? `receipt-download:ip:${clientIP}`
      : `receipt-download:ip:unknown`
    
    const rateLimit = await checkRateLimit({
      identifier: rateLimitIdentifier,
      maxAttempts: 10,
      windowMinutes: 1,
    })
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { 
          error: "Rate limit exceeded. Please try again later.",
          retryAfter: rateLimit.resetAt?.toISOString()
        },
        { 
          status: 429,
          headers: {
            "Retry-After": rateLimit.resetAt 
              ? Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 1000).toString()
              : "60"
          }
        },
      )
    }

    // 2. Authenticate request (token or legacy receipt number)
    const { searchParams } = new URL(request.url)
    const token = searchParams.get("token")
    const legacyReceiptNumber = searchParams.get("id")
    
    // Check if legacy access is enabled
    const legacyAccessEnabled = process.env.LEGACY_RECEIPT_ACCESS === "true"
    
    let donationId: string
    let receiptNumber: string
    
    // Primary path: Token-based authentication
    if (token) {
      try {
        const verified = await verifyReceiptToken(token)
        donationId = verified.donationId
        receiptNumber = verified.receiptNumber
      } catch (error) {
        console.error("Token verification failed:", error)
        return NextResponse.json(
          { error: error instanceof Error ? error.message : "Invalid or expired token" },
          { status: 401 },
        )
      }
    }
    // Legacy path: Receipt number-based access (deprecated)
    else if (legacyReceiptNumber && legacyAccessEnabled) {
      console.warn(
        `Legacy receipt access used for receipt ${legacyReceiptNumber}. ` +
        `This method is deprecated and will be removed in a future version.`
      )
      
      const supabase = getServiceSupabase()
      const { data: donation, error } = await supabase
        .from("donations")
        .select("id, receipt_number")
        .eq("receipt_number", legacyReceiptNumber)
        .single()

      if (error || !donation) {
        return NextResponse.json(
          { error: "Receipt not found" },
          { status: 404 },
        )
      }
      
      donationId = donation.id
      receiptNumber = donation.receipt_number
    }
    // No valid authentication method provided
    else {
      return NextResponse.json(
        { 
          error: legacyAccessEnabled 
            ? "Token or receipt number is required" 
            : "Token is required for receipt access"
        },
        { status: 401 },
      )
    }

    const supabase = getServiceSupabase()

    // Verify the donation exists and has the expected receipt number
    const { data: donation, error: donationError } = await supabase
      .from("donations")
      .select("id, receipt_number")
      .eq("id", donationId)
      .eq("receipt_number", receiptNumber)
      .single()

    if (donationError || !donation) {
      return NextResponse.json(
        { error: "Receipt not found or token mismatch" },
        { status: 404 },
      )
    }

    // Serve pre-generated PDF from storage (fast path — normal case)
    const pdfFileName = `${donation.id}-${receiptNumber}.pdf`
    const { data: storedPdf } = await supabase.storage
      .from("receipts")
      .download(pdfFileName)

    if (storedPdf) {
      const pdfBuffer = Buffer.from(await storedPdf.arrayBuffer())
      await trackReceiptDownload(donation.id)
      return new NextResponse(new Uint8Array(pdfBuffer), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `inline; filename="${receiptNumber}.pdf"`,
          "Cache-Control": "private, max-age=300",
        },
      })
    }

    // PDF missing — legacy donation that pre-dates react-pdf.
    // Generate on-the-fly from DB data, upload to storage so future downloads are instant.
    const { data: fullDonation } = await supabase
      .from("donations")
      .select("donor_name, donor_email, donor_phone, amount, currency, provider, created_at, is_monthly, provider_ref, verification_id")
      .eq("id", donation.id)
      .single()

    if (!fullDonation) {
      return NextResponse.json(
        { error: "Receipt data not found. Please contact support." },
        { status: 404 },
      )
    }

    // Generate QR code if verification_id exists
    const verificationId = fullDonation.verification_id
    let verificationQR: string | undefined

    if (verificationId) {
      try {
        verificationQR = await verificationQRBase64(verificationId)
      } catch (qrError) {
        console.warn("[Download] QR code generation failed (non-fatal):", qrError)
      }
    }

    const orgDetails = await getOrganizationDetails()
    const pdfBuffer = await renderReceiptToPDF({
      receiptNumber,
      donationId: donation.id,
      paymentDate: new Date(fullDonation.created_at),
      donorName: fullDonation.donor_name,
      donorEmail: fullDonation.donor_email,
      donorPhone: fullDonation.donor_phone ?? undefined,
      amount: fullDonation.amount,
      currency: fullDonation.currency,
      paymentMethod: fullDonation.provider ?? "unknown",
      isMonthly: fullDonation.is_monthly ?? false,
      providerRef: fullDonation.provider_ref ?? undefined,
      organization: orgDetails,
      verificationId,
      verificationQR,
    })

    // Cache for future downloads (non-fatal if upload fails)
    supabase.storage
      .from("receipts")
      .upload(pdfFileName, pdfBuffer, { contentType: "application/pdf", upsert: true })
      .catch((err) => console.warn("[Download] PDF cache upload failed:", err))

    await trackReceiptDownload(donation.id)

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${receiptNumber}.pdf"`,
        "Cache-Control": "private, max-age=300",
      },
    })
  } catch (error) {
    console.error("Receipt download error:", error)
    return NextResponse.json(
      { error: "Failed to download receipt" },
      { status: 500 },
    )
  }
}
