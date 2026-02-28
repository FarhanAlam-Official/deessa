"use server"

import { NextResponse } from "next/server"
import { resendConferencePaymentLink } from "@/lib/actions/conference-registration"

// Public endpoint: resend the payment link email for a given registration.
// No auth needed — the action itself does (id, email) dual-key verification.
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { registrationId, email } = body as { registrationId?: string; email?: string }

    if (!registrationId || !email) {
      return NextResponse.json({ ok: false, error: "registrationId and email are required." }, { status: 400 })
    }

    const result = await resendConferencePaymentLink(registrationId.trim())
    return NextResponse.json({ ok: result.success, error: result.error })
  } catch (err) {
    console.error("resend-payment-link error:", err)
    return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 })
  }
}
