"use server"

import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { getConferenceRegistrationByToken, startConferencePayment } from "@/lib/actions/conference-registration"
import type { PaymentProvider } from "@/lib/payments/config"

// In-memory rate limiter (best-effort on serverless)
const ipHits = new Map<string, { count: number; resetAt: number }>()
function shouldRateLimit(ip: string, now: number): boolean {
  const windowMs = 60_000
  const max = 10 // Low limit — payment session creation is expensive
  const entry = ipHits.get(ip)
  if (!entry || entry.resetAt <= now) {
    ipHits.set(ip, { count: 1, resetAt: now + windowMs })
    return false
  }
  entry.count += 1
  return entry.count > max
}

export async function POST(request: Request) {
  try {
    const headersList = await headers()
    const ip =
      headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      headersList.get("x-real-ip") ||
      "unknown"

    if (shouldRateLimit(ip, Date.now())) {
      return NextResponse.json(
        { ok: false, error: "Too many requests. Please wait before trying again." },
        { status: 429 },
      )
    }

    const body = await request.json()
    const registrationId = body.registrationId as string | undefined
    const email = body.email as string | undefined
    const provider = body.provider as PaymentProvider | undefined

    // Input validation
    if (!registrationId || typeof registrationId !== "string" || registrationId.trim().length === 0) {
      return NextResponse.json({ ok: false, error: "registrationId is required" }, { status: 400 })
    }
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ ok: false, error: "Valid email is required" }, { status: 400 })
    }
    if (!provider || !["stripe", "khalti", "esewa"].includes(provider)) {
      return NextResponse.json({ ok: false, error: "Invalid payment provider" }, { status: 400 })
    }

    // Verify registration exists and belongs to this email BEFORE starting payment
    const reg = await getConferenceRegistrationByToken(registrationId.trim(), email.trim())
    if (!reg) {
      // Return a generic message to prevent email enumeration
      return NextResponse.json(
        { ok: false, error: "Registration not found or email does not match." },
        { status: 404 },
      )
    }

    const result = await startConferencePayment(registrationId.trim(), email.trim(), provider)

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.message }, { status: 400 })
    }

    return NextResponse.json({
      ok: true,
      redirectUrl: result.redirectUrl,
      formData: result.formData,
      requiresFormSubmit: result.requiresFormSubmit ?? false,
    })
  } catch (err) {
    console.error("Conference start-payment API error:", err)
    return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 })
  }
}
