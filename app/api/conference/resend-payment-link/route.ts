import { NextResponse } from "next/server"
import { resendConferencePaymentLink } from "@/lib/actions/conference-registration"
import { checkRateLimit, getClientIP } from "@/lib/rate-limit"

// Configuration from environment variables
const IP_RATE_LIMIT = parseInt(process.env.RESEND_PAYMENT_IP_LIMIT || "5", 10) // requests per window
const REG_RATE_LIMIT = parseInt(process.env.RESEND_PAYMENT_REG_LIMIT || "3", 10) // per registration
const RATE_WINDOW_MINUTES = parseInt(process.env.RESEND_PAYMENT_WINDOW_MINUTES || "60", 10)

// Public endpoint: resend the payment link email for a given registration.
// Protected by dual-key verification (id + email) and rate limiting (IP + registration ID).
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { registrationId, email } = body as { registrationId?: string; email?: string }

    if (!registrationId || !email) {
      return NextResponse.json({ ok: false, error: "registrationId and email are required." }, { status: 400 })
    }

    const rid = registrationId.trim()
    const emailTrimmed = email.trim()
    const clientIP = getClientIP(request)

    // ── Rate Limiting: Check IP-based limit ──────────────────────────────────
    // Skip IP rate limit when IP cannot be determined; the per-registration
    // limit below still enforces a meaningful cap.
    if (clientIP !== null) {
      const ipLimit = await checkRateLimit({
        identifier: `resend-payment:ip:${clientIP}`,
        maxAttempts: IP_RATE_LIMIT,
        windowMinutes: RATE_WINDOW_MINUTES,
      })

      if (!ipLimit.allowed) {
        console.warn("Rate limit exceeded (IP)", {
          ip: clientIP,
          registrationId: rid,
          resetAt: ipLimit.resetAt,
        })
        return NextResponse.json(
          {
            ok: false,
            error: "Too many requests. Please try again later.",
            resetAt: ipLimit.resetAt?.toISOString(),
          },
          { status: 429 },
        )
      }
    }

    // ── Rate Limiting: Check registration ID-based limit ────────────────────
    const regLimit = await checkRateLimit({
      identifier: `resend-payment:rid:${rid}`,
      maxAttempts: REG_RATE_LIMIT,
      windowMinutes: RATE_WINDOW_MINUTES,
    })

    if (!regLimit.allowed) {
      console.warn("Rate limit exceeded (registration ID)", {
        ip: clientIP,
        registrationId: rid,
        resetAt: regLimit.resetAt,
      })
      return NextResponse.json(
        {
          ok: false,
          error: "Too many resend attempts for this registration. Please try again later.",
          resetAt: regLimit.resetAt?.toISOString(),
        },
        { status: 429 },
      )
    }

    // ── Process request (dual-key verification happens inside action) ───────
    const result = await resendConferencePaymentLink(rid, emailTrimmed)
    return NextResponse.json({ ok: result.success, error: result.error })
  } catch (err) {
    console.error("resend-payment-link error:", err)
    return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 })
  }
}
