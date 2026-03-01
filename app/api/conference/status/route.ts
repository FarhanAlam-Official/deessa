import { NextResponse } from "next/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"

/**
 * Public status-polling endpoint for the payment-success page.
 * Returns registration status and full name for payment confirmation display.
 * Accessed by rid only — used after the payment redirect.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const rid = searchParams.get("rid")?.trim()

  if (!rid) {
    return NextResponse.json({ ok: false, error: "rid is required" }, { status: 400 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 })
  }

  const supabase = createServiceClient(supabaseUrl, serviceKey)

  const { data, error } = await supabase
    .from("conference_registrations")
    .select("id, status, payment_status, full_name, attendance_mode, expires_at")
    .eq("id", rid)
    .single()

  if (error || !data) {
    return NextResponse.json({ ok: false, error: "Registration not found" }, { status: 404 })
  }

  return NextResponse.json({
    ok: true,
    status: data.status,
    paymentStatus: data.payment_status,
    fullName: data.full_name,
    attendanceMode: data.attendance_mode,
    expiresAt: data.expires_at,
  })
}
