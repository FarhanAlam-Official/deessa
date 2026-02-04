/**
 * Receipt Download API
 * Handles receipt PDF downloads
 */

import { createClient } from "@/lib/supabase/server"
import { trackReceiptDownload } from "@/lib/receipts/service"
import { NextRequest, NextResponse } from "next/server"

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

    const supabase = await createClient()

    // Get donation by receipt number
    const { data: donation, error } = await supabase
      .from("donations")
      .select("id, receipt_url, receipt_number")
      .eq("receipt_number", receiptNumber)
      .single()

    if (error || !donation) {
      return NextResponse.json(
        { error: "Receipt not found" },
        { status: 404 },
      )
    }

    if (!donation.receipt_url) {
      return NextResponse.json(
        { error: "Receipt URL not available" },
        { status: 404 },
      )
    }

    // Try to fetch PDF from storage
    // Extract file name from receipt URL or construct it
    const fileName = `${donation.id}-${receiptNumber}.pdf`
    
    // Try to download PDF from Supabase Storage
    const { data: pdfData, error: pdfError } = await supabase.storage
      .from("receipts")
      .download(fileName)

    if (pdfError || !pdfData) {
      // If PDF not found, try HTML as fallback
      const htmlFileName = `${donation.id}-${receiptNumber}.html`
      const { data: htmlData, error: htmlError } = await supabase.storage
        .from("receipts")
        .download(htmlFileName)

      if (htmlError || !htmlData) {
        // If neither PDF nor HTML found, redirect to receipt URL
        await trackReceiptDownload(donation.id)
        return NextResponse.redirect(donation.receipt_url)
      }

      // Serve HTML with proper headers
      const htmlBuffer = await htmlData.arrayBuffer()
      await trackReceiptDownload(donation.id)
      
      return new NextResponse(htmlBuffer, {
        headers: {
          "Content-Type": "text/html",
          "Content-Disposition": `attachment; filename="${receiptNumber}.html"`,
        },
      })
    }

    // Serve PDF with proper headers
    const pdfBuffer = await pdfData.arrayBuffer()
    await trackReceiptDownload(donation.id)

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${receiptNumber}.pdf"`,
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
