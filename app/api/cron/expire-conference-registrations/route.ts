import { NextResponse } from "next/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"

/**
 * Cron job: expire unpaid conference registrations.
 * Called every hour by Vercel Cron (configured in vercel.json).
 *
 * Security: protected by CRON_SECRET header.
 * Any invocation without the correct secret is rejected with 401.
 */
export async function GET(request: Request) {
  // ── Authenticate the cron caller ─────────────────────────────────────────
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get("authorization")

  if (!cronSecret) {
    console.error("CRON_SECRET environment variable is not set")
    return NextResponse.json({ error: "Cron not configured" }, { status: 500 })
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // ── Use service role client (bypasses RLS) ────────────────────────────────
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: "Missing Supabase credentials" }, { status: 500 })
  }

  const supabase = createServiceClient(supabaseUrl, serviceRoleKey)

  try {
    // Mark all pending_payment (and legacy 'pending') registrations that are past
    // their expiry as 'expired'. Only affects those still unpaid.
    const { data, error } = await supabase
      .from("conference_registrations")
      .update({ status: "expired" })
      .in("status", ["pending_payment", "pending"])
      .eq("payment_status", "unpaid")
      .lt("expires_at", new Date().toISOString())
      .not("expires_at", "is", null)
      .select("id")

    if (error) {
      console.error("Expiry cron error:", error)
      return NextResponse.json({ error: "Failed to expire registrations" }, { status: 500 })
    }

    const expiredCount = data?.length ?? 0
    console.log(`Conference expiry cron: expired ${expiredCount} registrations`)

    return NextResponse.json({
      ok: true,
      expired: expiredCount,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    console.error("Conference expiry cron unexpected error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
