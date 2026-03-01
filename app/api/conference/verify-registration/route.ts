import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { getConferenceRegistrationByToken } from "@/lib/actions/conference-registration"
import { getConferenceSettings } from "@/lib/actions/conference-settings"
import { checkRateLimit, getClientIP } from "@/lib/rate-limit"

// Configuration from environment variables
const VERIFY_RATE_LIMIT = parseInt(process.env.VERIFY_REGISTRATION_LIMIT || "60", 10)
const VERIFY_WINDOW_MINUTES = parseInt(process.env.VERIFY_REGISTRATION_WINDOW_MINUTES || "1", 10)

// Normalise DB attendance_mode key ("in-person") to settings key ("inPerson")
function normaliseModeKey(mode: string) {
  return mode.replace(/-([a-z])/g, (_: string, c: string) => c.toUpperCase())
}

export async function POST(request: Request) {
  try {
    const headersList = await headers()
    const ip =
      headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      headersList.get("x-real-ip") ||
      "unknown"

    // Distributed rate limiting (cross-instance enforcement)
    const rateLimit = await checkRateLimit({
      identifier: `verify-registration:ip:${ip}`,
      maxAttempts: VERIFY_RATE_LIMIT,
      windowMinutes: VERIFY_WINDOW_MINUTES,
    })

    if (!rateLimit.allowed) {
      console.warn("Rate limit exceeded (verify-registration)", {
        ip,
        resetAt: rateLimit.resetAt,
      })
      return NextResponse.json(
        {
          ok: false,
          error: "Too many requests. Please try again later.",
          resetAt: rateLimit.resetAt?.toISOString(),
        },
        { status: 429 },
      )
    }

    const body = await request.json()
    const rid = body.rid?.trim()
    const email = body.email?.trim()

    if (!rid || !email) {
      return NextResponse.json(
        { ok: false, error: "rid and email are required" },
        { status: 400 },
      )
    }

    // Basic format sanity check before hitting the DB
    if (!email.includes("@")) {
      return NextResponse.json({ ok: false, error: "Invalid email format" }, { status: 400 })
    }

    const reg = await getConferenceRegistrationByToken(rid, email)

    if (!reg) {
      // Generic message — do not reveal whether the ID exists (prevents enumeration)
      return NextResponse.json(
        { ok: false, error: "Registration not found. Please check your ID and email." },
        { status: 404 },
      )
    }

    const now = new Date()
    const expired =
      reg.status === "expired" ||
      (reg.expires_at !== null && new Date(reg.expires_at) < now && reg.payment_status !== "paid")

    // ── Fee resolution ─────────────────────────────────────────────────────────
    // payment_amount in the DB may be null if the registration was created before
    // fees were configured, or if it was never set. In that case, resolve live from
    // settings so the payment pages always show the correct amount.
    let paymentAmount = reg.payment_amount ?? null
    let paymentCurrency = reg.payment_currency ?? "NPR"
    let expiryHours = 24

    if (paymentAmount === null && !expired && reg.payment_status !== "paid") {
      try {
        const cfg = await getConferenceSettings()
        expiryHours = cfg.registrationExpiryHours ?? 24
        if (cfg.registrationFeeEnabled) {
          const byMode = cfg.registrationFeeByMode ?? {}
          const mode = reg.attendance_mode ?? ""
          const camelKey = normaliseModeKey(mode)
          const override =
            typeof byMode[camelKey] === "number" ? byMode[camelKey]
            : typeof byMode[mode] === "number" ? byMode[mode]
            : undefined
          paymentAmount = typeof override === "number" ? override : cfg.registrationFee ?? 0
          paymentCurrency = cfg.registrationFeeCurrency ?? "NPR"
        }
      } catch {
        // Non-fatal — return null amount rather than crashing
      }
    }

    return NextResponse.json({
      ok: true,
      id: reg.id,
      status: reg.status,
      paymentStatus: reg.payment_status,
      paymentAmount,
      paymentCurrency,
      expiresAt: reg.expires_at,
      attendanceMode: reg.attendance_mode,
      fullName: reg.full_name,
      expiryHours,
      expired,
    })
  } catch (err) {
    console.error("Conference verify-registration API error:", err)
    return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 })
  }
}
