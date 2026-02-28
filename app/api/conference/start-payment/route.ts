import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { getConferenceRegistrationByToken, startConferencePayment } from "@/lib/actions/conference-registration"
import type { PaymentProvider } from "@/lib/payments/config"

// In-memory rate limiter (best-effort on serverless)
const ipHits = new Map<string, { count: number; resetAt: number }>()
const MAX_IP_ENTRIES = 10000 // Prevent unbounded growth

function shouldRateLimit(ip: string, now: number): boolean {
  const windowMs = 60_000
  const max = 10 // Low limit — payment session creation is expensive

  // Cleanup expired entries periodically (every minute)
  cleanupExpiredEntries(now)

  const entry = ipHits.get(ip)
  if (!entry || entry.resetAt <= now) {
    // Delete stale entry explicitly
    if (entry && entry.resetAt <= now) {
      ipHits.delete(ip)
    }

    // Enforce max size limit (simple LRU: evict oldest if full)
    if (ipHits.size >= MAX_IP_ENTRIES) {
      evictOldestEntries(now)
    }

    ipHits.set(ip, { count: 1, resetAt: now + windowMs })
    return false
  }
  entry.count += 1
  return entry.count > max
}

// Periodic cleanup (throttled to run max once per minute)
let lastCleanup = 0
function cleanupExpiredEntries(now: number): void {
  if (now - lastCleanup < 60_000) return // Run at most once per minute
  lastCleanup = now

  try {
    for (const [ip, entry] of ipHits.entries()) {
      if (entry.resetAt <= now) {
        ipHits.delete(ip)
      }
    }
  } catch (err) {
    console.error("Rate limit cleanup error:", err)
  }
}

// Evict oldest entries when map is full
function evictOldestEntries(now: number): void {
  try {
    const entries = Array.from(ipHits.entries())
    // Sort by resetAt (oldest first)
    entries.sort((a, b) => a[1].resetAt - b[1].resetAt)
    
    // Remove oldest 10% of entries
    const toRemove = Math.max(1, Math.floor(entries.length * 0.1))
    for (let i = 0; i < toRemove; i++) {
      ipHits.delete(entries[i][0])
    }
  } catch (err) {
    console.error("Rate limit eviction error:", err)
    // Fail-safe: clear all if eviction fails
    ipHits.clear()
  }
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
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email || typeof email !== "string" || !emailRegex.test(email.trim())) {
      return NextResponse.json({ ok: false, error: "Valid email is required" }, { status: 400 })
    }    if (!provider || !["stripe", "khalti", "esewa"].includes(provider)) {
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
