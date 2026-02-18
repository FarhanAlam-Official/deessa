"use server"

import { NextResponse } from "next/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { getPaymentMode } from "@/lib/payments/config"
import { verifyStripeSession } from "@/lib/payments/stripe"
import { sendConferenceConfirmationEmail } from "@/lib/email/conference-mailer"
import { getConferenceSettings } from "@/lib/actions/conference-settings"

/**
 * POST /api/conference/confirm-stripe-session
 *
 * Called by the payment-success page immediately after Stripe redirects back.
 * Verifies the Stripe session directly and confirms the registration without
 * waiting for a webhook — essential for local development and as a fallback
 * in production if the webhook is delayed.
 *
 * Body: { rid: string, sessionId: string }
 *
 * Security:
 * - Requires (rid + sessionId) pair — sessionId comes from Stripe and is unguessable
 * - Amount/currency verified against DB record (fail-closed)
 * - Idempotent — safe to call multiple times
 */

function createServiceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRoleKey) throw new Error("Missing Supabase service role credentials")
  return createServiceClient(supabaseUrl, serviceRoleKey)
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const rid = (body.rid as string)?.trim()
    const sessionId = (body.sessionId as string)?.trim()

    if (!rid || !sessionId) {
      return NextResponse.json({ ok: false, error: "rid and sessionId are required" }, { status: 400 })
    }

    const mode = getPaymentMode()
    const supabase = createServiceRoleClient()

    // ── 1. Fetch registration ─────────────────────────────────────────────────
    const { data: reg, error: fetchErr } = await supabase
      .from("conference_registrations")
      .select("*")
      .eq("id", rid)
      .single()

    if (fetchErr || !reg) {
      return NextResponse.json({ ok: false, error: "Registration not found" }, { status: 404 })
    }

    // Idempotency — already confirmed
    if (reg.status === "confirmed" && reg.payment_status === "paid") {
      return NextResponse.json({ ok: true, status: "confirmed", alreadyConfirmed: true })
    }

    // Verify the sessionId belongs to this registration
    if (reg.stripe_session_id && reg.stripe_session_id !== sessionId) {
      return NextResponse.json({ ok: false, error: "Session ID mismatch" }, { status: 403 })
    }

    // ── 2. Verify with Stripe ─────────────────────────────────────────────────
    const verification = await verifyStripeSession(sessionId, mode)
    if (!verification.success || !verification.session) {
      return NextResponse.json(
        { ok: false, error: verification.error || "Could not verify Stripe session" },
        { status: 400 },
      )
    }

    const session = verification.session

    // Only proceed if Stripe reports the session as paid
    if (session.payment_status !== "paid") {
      return NextResponse.json({
        ok: true,
        status: "processing",
        paymentStatus: session.payment_status,
      })
    }

    // ── 3. Amount / currency verification (fail-closed) ───────────────────────
    if (reg.payment_amount !== null && session.mode === "payment") {
      const expectedMinor = Math.round(Number(reg.payment_amount) * 100)
      const actualMinor = session.amount_total ?? null
      const sessionCurrency = String(session.currency || "").toLowerCase()
      const regCurrency = String(reg.payment_currency || "npr").toLowerCase()

      if (actualMinor === null) {
        return NextResponse.json({ ok: false, error: "Invalid session amount" }, { status: 400 })
      }

      if (expectedMinor !== actualMinor) {
        // Amount mismatch — flag for admin review
        await supabase
          .from("conference_registrations")
          .update({ payment_status: "review", stripe_session_id: sessionId })
          .eq("id", rid)
        return NextResponse.json({ ok: true, status: "review" })
      }

      // Currency mismatch is non-fatal — sync DB to Stripe (from previous bug fix)
      if (regCurrency !== sessionCurrency) {
        await supabase
          .from("conference_registrations")
          .update({ payment_currency: sessionCurrency.toUpperCase() })
          .eq("id", rid)
      }
    }

    // ── 4. Confirm registration ───────────────────────────────────────────────
    const { error: updateErr } = await supabase
      .from("conference_registrations")
      .update({
        status: "confirmed",
        payment_status: "paid",
        payment_provider: "stripe",
        payment_id: `stripe:${sessionId}`,
        provider_ref: sessionId,
        stripe_session_id: sessionId,
      })
      .eq("id", rid)

    if (updateErr) {
      console.error("confirm-stripe-session: DB update failed", updateErr)
      return NextResponse.json({ ok: false, error: "Failed to confirm registration" }, { status: 500 })
    }

    // ── 5. Send confirmation email (non-blocking) ─────────────────────────────
    sendConferenceConfirmationEmail({
      fullName: reg.full_name,
      email: reg.email,
      registrationId: reg.id,
      attendanceMode: reg.attendance_mode || "",
      role: reg.role || undefined,
      workshops: reg.workshops || undefined,
    }).catch((err) => console.error("Non-fatal: confirmation email failed:", err))

    console.log("confirm-stripe-session: confirmed registration", rid)
    return NextResponse.json({ ok: true, status: "confirmed" })
  } catch (err) {
    console.error("confirm-stripe-session error:", err)
    return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 })
  }
}
