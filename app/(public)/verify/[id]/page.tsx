/**
 * Public Receipt Verification Page
 * 
 * Allows anyone to verify the authenticity of a donation receipt
 * by entering or scanning the verification ID from the receipt.
 * 
 * Security:
 * - No authentication required (public endpoint)
 * - Rate limited to prevent brute-force enumeration
 * - Donor name is masked for privacy
 * - Only shows receipts for completed payments
 */

import { createClient } from "@supabase/supabase-js"
import { checkRateLimit } from "@/lib/rate-limit"
import { headers } from "next/headers"
import Link from "next/link"

interface VerificationPageProps {
  params: Promise<{
    id: string
  }>
}

/**
 * Mask donor name for privacy
 * Example: "John Doe" → "J*** D**"
 */
function maskDonorName(name: string): string {
  const parts = name.trim().split(/\s+/)
  return parts
    .map(part => {
      if (part.length === 0) return ""
      if (part.length === 1) return part
      return part[0] + "*".repeat(Math.min(part.length - 1, 3))
    })
    .join(" ")
}

/**
 * Format amount with currency
 */
function formatAmount(amount: number, currency: string): string {
  // Use Indian grouping (lakhs/crores) for NPR & INR, international (thousands/millions) for others
  const locale = ["NPR", "INR"].includes(currency.toUpperCase()) ? "en-IN" : "en-US"
  return `${currency} ${amount.toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

/**
 * Format date
 */
function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

/* ─── Shared branded page wrapper ─── */
function PageShell({ children, variant = "default" }: { children: React.ReactNode; variant?: "default" | "error" | "warning" }) {
  const bgClass = variant === "error"
    ? "bg-gradient-to-b from-red-50/80 via-white to-red-50/30"
    : variant === "warning"
    ? "bg-gradient-to-b from-amber-50/80 via-white to-amber-50/30"
    : "bg-gradient-to-b from-[rgb(232,246,252)] via-white to-[rgb(232,246,252)]/30"

  return (
    <div className={`min-h-screen flex flex-col ${bgClass}`}>
      {/* Decorative blurs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        {variant === "error" ? (
          <>
            <div className="absolute -top-24 -right-24 w-80 h-80 bg-red-200/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-red-100/20 rounded-full blur-3xl" />
          </>
        ) : variant === "warning" ? (
          <>
            <div className="absolute -top-24 -right-24 w-80 h-80 bg-amber-200/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-amber-100/20 rounded-full blur-3xl" />
          </>
        ) : (
          <>
            <div className="absolute -top-24 -right-24 w-80 h-80 bg-[rgb(63,171,222)]/5 rounded-full blur-3xl" />
            <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-[rgb(11,95,138)]/5 rounded-full blur-3xl" />
          </>
        )}
      </div>

      {/* CSS animations */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes verified-pop {
          0% { transform: scale(0.6); opacity: 0; }
          50% { transform: scale(1.12); }
          70% { transform: scale(0.95); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes verified-ring {
          0% { box-shadow: 0 0 0 0 rgba(63, 171, 222, 0.4); }
          70% { box-shadow: 0 0 0 14px rgba(63, 171, 222, 0); }
          100% { box-shadow: 0 0 0 0 rgba(63, 171, 222, 0); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          15% { transform: translateX(-6px); }
          30% { transform: translateX(5px); }
          45% { transform: translateX(-4px); }
          60% { transform: translateX(3px); }
          75% { transform: translateX(-2px); }
        }
        .animate-verified-pop {
          animation: verified-pop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards,
                     verified-ring 2s ease-out 0.6s infinite;
        }
        @keyframes error-pop {
          0% { transform: scale(0.4) rotate(-10deg); opacity: 0; }
          40% { transform: scale(1.15) rotate(3deg); opacity: 1; }
          60% { transform: scale(0.92) rotate(-2deg); }
          80% { transform: scale(1.04) rotate(0deg); }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes error-ring {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.35); }
          70% { box-shadow: 0 0 0 18px rgba(239, 68, 68, 0); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
        @keyframes cross-draw {
          0% { stroke-dashoffset: 48; }
          100% { stroke-dashoffset: 0; }
        }
        .animate-error-pop {
          animation: error-pop 0.65s cubic-bezier(0.34, 1.56, 0.64, 1) forwards,
                     error-ring 2s ease-out 0.7s infinite;
        }
        .animate-cross-draw {
          stroke-dasharray: 24;
          stroke-dashoffset: 24;
          animation: cross-draw 0.5s ease-out 0.35s forwards;
        }
      `}} />

      <div className="relative flex-1 flex flex-col items-center justify-center px-4 py-12 sm:py-16">
        {children}
      </div>

      {/* Bottom footer */}
      <footer className="relative border-t border-gray-200 bg-[rgb(248,249,250)] py-6">
        <div className="max-w-2xl mx-auto px-4 text-center space-y-3">
          <p className="text-xs text-[rgb(108,117,125)]">
            &copy; {new Date().getFullYear()} Deessa Foundation Audit &amp; Compliance Team
          </p>
          <div className="flex items-center justify-center gap-5 text-xs">
            <Link href="/privacy" className="text-[rgb(63,171,222)] hover:underline">Privacy Policy</Link>
            <Link href="/terms" className="text-[rgb(63,171,222)] hover:underline">Terms of Service</Link>
            <Link href="/contact" className="text-[rgb(63,171,222)] hover:underline">Contact Us</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default async function VerificationPage({ params }: VerificationPageProps) {
  const { id: verificationId } = await params

  // Get client IP for rate limiting
  const headersList = await headers()
  const forwarded = headersList.get("x-forwarded-for")
  const realIp = headersList.get("x-real-ip")
  const clientIP = forwarded?.split(",")[0] || realIp || "unknown"

  // Apply rate limiting
  const rateLimitIdentifier = `receipt-verify:ip:${clientIP}`
  
  let rateLimit: { allowed: boolean; remaining: number; resetAt: Date | null }
  try {
    rateLimit = await checkRateLimit({
      identifier: rateLimitIdentifier,
      maxAttempts: 20,
      windowMinutes: 1,
    })
  } catch (error) {
    console.error("Rate limiting failed, allowing request:", error)
    // If rate limiting fails, allow the request (fail open)
    rateLimit = { allowed: true, remaining: 20, resetAt: null }
  }

  /* ────────────── RATE LIMITED STATE ────────────── */
  if (!rateLimit.allowed) {
    return (
      <PageShell variant="warning">
        {/* Animated shield icon */}
        <div className="mx-auto mb-6 flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg shadow-amber-500/25 ring-4 ring-amber-100 animate-error-pop">
          <svg className="w-9 h-9 sm:w-10 sm:h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold text-amber-700 mb-3 text-center">
          Too Many Attempts
        </h1>
        <p className="text-amber-600/70 text-center max-w-lg mb-10 leading-relaxed">
          We&apos;ve detected an unusual number of verification requests from your network.
        </p>

        {/* Rate Limit Details Card */}
        <div className="w-full max-w-lg">
          <div className="bg-white rounded-2xl shadow-xl shadow-amber-500/5 border border-amber-100 overflow-hidden">

            {/* Amber header bar */}
            <div className="bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-white/60 uppercase tracking-wider mb-1">Security Protection</p>
                <p className="text-lg font-bold text-white">Rate Limit Exceeded</p>
              </div>
              {/* Status badge */}
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 border border-white/20 text-white text-xs font-semibold">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Temporarily Blocked
              </span>
            </div>

            {/* Card body */}
            <div className="p-6 space-y-5">
              {/* Countdown info */}
              {rateLimit.resetAt && (
                <div className="flex items-center gap-4 bg-amber-50/60 border border-amber-100 rounded-xl p-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                    <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-0.5">Access Resumes At</p>
                    <p className="text-xl font-bold text-gray-800">{rateLimit.resetAt.toLocaleTimeString()}</p>
                  </div>
                </div>
              )}

              {/* Why this happens */}
              <div>
                <p className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-3">Why This Happens</p>
                <ul className="space-y-2.5">
                  <li className="flex items-start gap-3">
                    <span className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-amber-50 flex items-center justify-center">
                      <svg className="w-3 h-3 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
                      </svg>
                    </span>
                    <span className="text-sm text-gray-600">Protects our database from automated scanning attempts</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-amber-50 flex items-center justify-center">
                      <svg className="w-3 h-3 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
                      </svg>
                    </span>
                    <span className="text-sm text-gray-600">Ensures donor data privacy and receipt integrity</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-amber-50 flex items-center justify-center">
                      <svg className="w-3 h-3 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
                      </svg>
                    </span>
                    <span className="text-sm text-gray-600">Limit resets automatically — no action needed from you</span>
                  </li>
                </ul>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-1">
                <Link
                  href="/verify"
                  className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100 hover:border-amber-300 transition-all duration-200"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back to Portal
                </Link>
                <Link
                  href="/contact"
                  className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100 hover:border-amber-300 transition-all duration-200"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Contact Support
                </Link>
              </div>

              {/* Reassurance note */}
              <div className="flex gap-2.5">
                <svg className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-[11px] text-gray-400 leading-relaxed italic">
                  This is an automated security measure and does not indicate any problem with your receipt. If you need immediate assistance, please contact our support team.
                </p>
              </div>
            </div>
          </div>

          {/* Encrypted badge */}
          <div className="flex items-center justify-center gap-2 mt-8 text-xs text-gray-400">
            <svg className="w-4 h-4 text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span className="uppercase tracking-widest font-semibold">End-to-End Encrypted Verification Portal</span>
          </div>
        </div>
      </PageShell>
    )
  }

  // Query donation by verification_id
  // Use service role client since this is a public endpoint
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  console.log('[Verification] Looking up verification_id:', verificationId)
  
  const { data: donation, error } = await supabase
    .from("donations")
    .select("id, receipt_number, donor_name, amount, currency, created_at, is_monthly, payment_status")
    .eq("verification_id", verificationId)
    .eq("payment_status", "completed")
    .not("receipt_number", "is", null)
    .single()

  console.log('[Verification] Query result:', { donation, error })

  /* ────────────── NOT FOUND STATE ────────────── */
  if (error || !donation) {
    console.log('[Verification] Not found - error:', error?.message, 'donation:', donation)
    return (
      <PageShell variant="error">
        {/* Icon with pop + ring + cross-draw animations */}
        <div className="mx-auto mb-6 flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-red-400 to-red-600 shadow-lg shadow-red-500/25 ring-4 ring-red-100 animate-error-pop">
          <svg className="w-9 h-9 sm:w-10 sm:h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path className="animate-cross-draw" strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6" />
            <path className="animate-cross-draw" style={{ animationDelay: '0.5s' }} strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12" />
          </svg>
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold text-red-700 mb-3 text-center">
          Verification Failed
        </h1>
        <p className="text-red-400/80 text-center max-w-lg mb-10 leading-relaxed">
          We could not find a valid receipt matching the identifier you provided.
        </p>

        {/* Detailed Error Card */}
        <div className="w-full max-w-lg">
          <div className="bg-white rounded-2xl shadow-xl shadow-red-500/5 border border-red-100 overflow-hidden">

            {/* Red header bar with attempted ID */}
            <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-5 flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white/60 uppercase tracking-wider mb-1">Attempted Verification ID</p>
                <p className="text-sm sm:text-base font-mono text-white break-all">{verificationId}</p>
              </div>
              {/* Invalid badge */}
              <span className="ml-3 flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 border border-white/20 text-white text-xs font-semibold">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Not Found
              </span>
            </div>

            {/* Info details */}
            <div className="p-6 space-y-5">
              {/* Possible reasons */}
              <div>
                <p className="text-xs font-bold text-red-500 uppercase tracking-wider mb-3">Possible Reasons</p>
                <ul className="space-y-2.5">
                  <li className="flex items-start gap-3">
                    <span className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-red-50 flex items-center justify-center">
                      <svg className="w-3 h-3 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01" />
                      </svg>
                    </span>
                    <span className="text-sm text-gray-600">The verification ID was mistyped or copied incorrectly</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-red-50 flex items-center justify-center">
                      <svg className="w-3 h-3 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01" />
                      </svg>
                    </span>
                    <span className="text-sm text-gray-600">The payment associated with this receipt is still being processed</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-red-50 flex items-center justify-center">
                      <svg className="w-3 h-3 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01" />
                      </svg>
                    </span>
                    <span className="text-sm text-gray-600">The document may not have been issued by Deessa Foundation</span>
                  </li>
                </ul>
              </div>

              {/* What to do next */}
              <div className="bg-red-50/50 border border-red-100 rounded-xl p-4">
                <div className="flex gap-3">
                  <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-xs font-semibold text-red-600 mb-1">What should you do?</p>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      Carefully re-check the verification ID on your receipt — it is typically printed below the QR code or at the bottom of the document. If you believe this is an error, contact our support team with a copy of your receipt for manual verification.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-1">
                <Link
                  href="/verify"
                  className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 hover:border-red-300 transition-all duration-200"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Try Another ID
                </Link>
                <Link
                  href="/contact"
                  className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 hover:border-red-300 transition-all duration-200"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Contact Support
                </Link>
              </div>

              {/* Fraud warning */}
              <div className="flex gap-2.5">
                <svg className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-[11px] text-gray-400 leading-relaxed italic">
                  If you suspect a fraudulent receipt, please report it immediately to our compliance team at{" "}
                  <a href="mailto:deessa.social@gmail.com" className="text-red-400 hover:underline">deessa.social@gmail.com</a>
                </p>
              </div>
            </div>
          </div>

          {/* Encrypted badge */}
          <div className="flex items-center justify-center gap-2 mt-8 text-xs text-gray-400">
            <svg className="w-4 h-4 text-red-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span className="uppercase tracking-widest font-semibold">End-to-End Encrypted Verification Portal</span>
          </div>
        </div>
      </PageShell>
    )
  }

  /* ────────────── SUCCESS STATE ────────────── */
  const maskedName = maskDonorName(donation.donor_name)
  const formattedAmount = formatAmount(donation.amount, donation.currency)
  const formattedDate = formatDate(donation.created_at)
  const donationType = donation.is_monthly ? "Monthly Recurring" : "One-Time"

  return (
    <PageShell>
      {/* Hero Icon — animated pop + ring pulse */}
      <div className="mx-auto mb-6 flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-[rgb(63,171,222)] to-[rgb(11,95,138)] shadow-lg shadow-[rgb(63,171,222)]/30 ring-4 ring-[rgb(232,246,252)] animate-verified-pop">
        <svg className="w-9 h-9 sm:w-10 sm:h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      </div>

      {/* Title */}
      <h1 className="text-3xl sm:text-4xl font-bold text-[rgb(11,95,138)] mb-3 text-center">
        Verified Authenticity
      </h1>
      <p className="text-[rgb(108,117,125)] text-center max-w-lg mb-10 leading-relaxed">
        This receipt matches our official records and has been confirmed as a legitimate donation to the Deessa Foundation.
      </p>

      {/* ── Receipt Details Card ── */}
      <div className="w-full max-w-lg">
        <div className="bg-white rounded-2xl shadow-xl shadow-[rgb(63,171,222)]/8 border border-[rgb(63,171,222)]/10 overflow-hidden">
          
          {/* Ocean Blue header bar */}
          <div className="bg-gradient-to-r from-[rgb(63,171,222)] to-[rgb(11,95,138)] px-6 py-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-white/60 uppercase tracking-wider mb-1">Receipt Number</p>
              <p className="text-xl sm:text-2xl font-bold text-white tracking-wide">#{donation.receipt_number}</p>
            </div>
            {/* Valid badge */}
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-xs font-semibold">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Valid &amp; Recorded
            </span>
          </div>

          {/* Details grid */}
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-2 gap-x-6 gap-y-5">
              {/* Donor Name */}
              <div>
                <p className="text-xs font-bold text-[rgb(108,117,125)] uppercase tracking-wider mb-1">Donor Name</p>
                <p className="text-lg font-semibold text-[rgb(33,37,41)]">{maskedName}</p>
              </div>
              {/* Donation Date */}
              <div>
                <p className="text-xs font-bold text-[rgb(108,117,125)] uppercase tracking-wider mb-1">Donation Date</p>
                <p className="text-lg font-semibold text-[rgb(33,37,41)]">{formattedDate}</p>
              </div>
              {/* Amount */}
              <div>
                <p className="text-xs font-bold text-[rgb(108,117,125)] uppercase tracking-wider mb-1">Verified Amount</p>
                <p className="text-xl font-bold text-[rgb(33,37,41)]">{formattedAmount}</p>
              </div>
              {/* Donation Type */}
              <div>
                <p className="text-xs font-bold text-[rgb(108,117,125)] uppercase tracking-wider mb-1">Donation Type</p>
                <p className="text-lg font-semibold text-[rgb(33,37,41)]">{donationType}</p>
              </div>
            </div>

            {/* Audit Trail ID */}
            <div className="pt-1">
              <p className="text-xs font-bold text-[rgb(108,117,125)] uppercase tracking-wider mb-1">Audit Trail ID</p>
              <p className="text-xs font-mono text-[rgb(108,117,125)] break-all select-all">{verificationId}</p>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link
                href="/contact"
                className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-white font-semibold bg-[rgb(63,171,222)] hover:bg-[rgb(11,95,138)] shadow-lg shadow-[rgb(63,171,222)]/20 transition-all duration-200"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Contact Support
              </Link>
            </div>

            {/* Receipt info notice */}
            <div className="bg-[rgb(232,246,252)]/60 border border-[rgb(63,171,222)]/15 rounded-xl p-4">
              <div className="flex gap-3">
                <svg className="w-5 h-5 text-[rgb(63,171,222)] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <p className="text-xs text-[rgb(108,117,125)] leading-relaxed">
                  <span className="font-semibold text-[rgb(11,95,138)]">Need your original receipt?</span>{" "}
                  Please check the official email sent to your registered address at the time of donation. If you haven&apos;t received it or need a replacement, contact support with your Receipt Number and valid identification for re-verification.
                </p>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="flex gap-2.5">
              <svg className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-[11px] text-[rgb(108,117,125)] leading-relaxed italic">
                This verification result is generated directly from the Deessa Foundation&apos;s secure audit records. Any modification to the physical or digital receipt that does not match this data should be treated as potentially fraudulent.
              </p>
            </div>
          </div>
        </div>

        {/* Encrypted badge */}
        <div className="flex items-center justify-center gap-2 mt-8 text-xs text-[rgb(108,117,125)]">
          <svg className="w-4 h-4 text-[rgb(63,171,222)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span className="uppercase tracking-widest font-semibold">End-to-End Encrypted Verification Portal</span>
        </div>

        {/* Verify another — styled button */}
        <div className="text-center mt-6">
          <Link
            href="/verify"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold border-2 border-[rgb(63,171,222)]/30 text-[rgb(11,95,138)] hover:border-[rgb(63,171,222)] hover:bg-[rgb(232,246,252)] transition-all duration-200"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Verify Another Receipt
          </Link>
        </div>
      </div>
    </PageShell>
  )
}
