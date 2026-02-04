/**
 * Receipt Resend API
 * Handles resending receipt emails
 */

import { createClient } from "@/lib/supabase/server"
import { resendReceiptEmail } from "@/lib/receipts/service"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { receiptNumber } = body

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
      .select("id")
      .eq("receipt_number", receiptNumber)
      .single()

    if (error || !donation) {
      return NextResponse.json(
        { error: "Receipt not found" },
        { status: 404 },
      )
    }

    // Resend email
    const result = await resendReceiptEmail(donation.id)

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: result.message,
    })
  } catch (error) {
    console.error("Receipt resend error:", error)
    return NextResponse.json(
      { error: "Failed to resend receipt email" },
      { status: 500 },
    )
  }
}
