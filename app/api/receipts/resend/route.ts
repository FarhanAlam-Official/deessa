/**
 * Receipt Resend API
 * Handles resending receipt emails
 */

import { createClient as createServiceClient } from "@supabase/supabase-js"
import { resendReceiptEmail } from "@/lib/receipts/service"
import { NextRequest, NextResponse } from "next/server"

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("Missing Supabase service role env vars")
  return createServiceClient(url, key)
}

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

    const supabase = getServiceSupabase()

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
