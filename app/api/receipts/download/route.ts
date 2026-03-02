/**
 * Receipt Download API
 * Generates a PDF on-demand from the stored HTML receipt and streams it to the browser.
 */

import { createClient as createServiceClient } from "@supabase/supabase-js"
import { generateReceiptPDF } from "@/lib/receipts/pdf-generator"
import { trackReceiptDownload } from "@/lib/receipts/service"
import { NextRequest, NextResponse } from "next/server"

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("Missing Supabase service role env vars")
  return createServiceClient(url, key)
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const receiptNumber = searchParams.get("id")

    if (!receiptNumber) {
      return NextResponse.json(
        { error: "Receipt number is required" },
        { status: 400 },
      )
    }

    const supabase = getServiceSupabase()

    // Get donation by receipt number
    const { data: donation, error } = await supabase
      .from("donations")
      .select("id, receipt_number")
      .eq("receipt_number", receiptNumber)
      .single()

    if (error || !donation) {
      return NextResponse.json(
        { error: "Receipt not found" },
        { status: 404 },
      )
    }

    // Fetch the stored HTML from Supabase Storage
    const htmlFileName = `${donation.id}-${receiptNumber}.html`
    const { data: htmlData, error: htmlError } = await supabase.storage
      .from("receipts")
      .download(htmlFileName)

    if (htmlError || !htmlData) {
      return NextResponse.json(
        { error: "Receipt source not found. It may still be generating — please try again in a moment." },
        { status: 404 },
      )
    }

    // Generate PDF from stored HTML
    const htmlText = await htmlData.text()

    let pdfBuffer: Buffer
    try {
      pdfBuffer = await generateReceiptPDF(htmlText)
    } catch (pdfError) {
      console.error("PDF generation failed:", pdfError)
      // Fallback: serve the raw HTML as a downloadable file
      const htmlBuffer = Buffer.from(htmlText)
      await trackReceiptDownload(donation.id)
      return new NextResponse(htmlBuffer, {
        headers: {
          "Content-Type": "text/html",
          "Content-Disposition": `attachment; filename="${receiptNumber}.html"`,
        },
      })
    }

    // Track and serve the PDF
    await trackReceiptDownload(donation.id)

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${receiptNumber}.pdf"`,
        "Cache-Control": "private, max-age=300", // cache for 5 min per session
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
