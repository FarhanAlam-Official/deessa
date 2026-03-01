"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Clock, CreditCard, AlertTriangle, CheckCircle, Loader2, Mail } from "lucide-react"

type PaymentProvider = "stripe" | "khalti" | "esewa"

const PROVIDERS: { id: PaymentProvider; label: string; logo: string; desc: string }[] = [
  { id: "stripe",  label: "Card / International", logo: "💳", desc: "Visa, Mastercard, AMEX" },
  { id: "khalti",  label: "Khalti",               logo: "🟣", desc: "Nepal digital wallet"  },
  { id: "esewa",   label: "eSewa",                logo: "🟢", desc: "Nepal digital wallet"  },
]

type Stage = "email-entry" | "loading" | "payment" | "already-paid" | "expired" | "not-found" | "error"

interface RegInfo {
  id: string
  fullName: string
  paymentAmount: number | null
  paymentCurrency: string
  expiresAt: string | null
  attendanceMode: string | null
  paymentStatus: string
  status: string
}

function formatCountdown(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now()
  if (diff <= 0) return "Expired"
  const h = Math.floor(diff / 3_600_000)
  const m = Math.floor((diff % 3_600_000) / 60_000)
  const s = Math.floor((diff % 60_000) / 1_000)
  return h > 0 ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`
}

function CompletePaymentContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const rid = searchParams.get("rid") ?? ""

  const [stage, setStage] = useState<Stage>(rid ? "email-entry" : "error")
  const [email, setEmail] = useState("")
  const [emailError, setEmailError] = useState("")
  const [reg, setReg] = useState<RegInfo | null>(null)
  const [selectedProvider, setSelectedProvider] = useState<PaymentProvider>("stripe")
  const [paying, setPaying] = useState(false)
  const [payError, setPayError] = useState<string | null>(null)
  const [countdown, setCountdown] = useState("")

  // Countdown
  useEffect(() => {
    if (!reg?.expiresAt) return
    setCountdown(formatCountdown(reg.expiresAt))
    const iv = setInterval(() => setCountdown(formatCountdown(reg.expiresAt!)), 1000)
    return () => clearInterval(iv)
  }, [reg?.expiresAt])

  const verifyEmail = async () => {
    if (!email.trim() || !email.includes("@")) {
      setEmailError("Please enter a valid email address.")
      return
    }
    setEmailError("")
    setStage("loading")

    try {
      const res = await fetch("/api/conference/verify-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rid, email: email.trim() }),
      })
      const data = await res.json()

      if (!data.ok) {
        setStage("not-found")
        return
      }

      if (data.expired) {
        setStage("expired")
        return
      }

      if (data.paymentStatus === "paid" || data.status === "confirmed") {
        router.replace(`/conference/register/payment-success?rid=${rid}&paid=1`)
        return
      }

      setReg({
        id: data.id,
        fullName: data.fullName,
        paymentAmount: data.paymentAmount,
        paymentCurrency: data.paymentCurrency,
        expiresAt: data.expiresAt,
        attendanceMode: data.attendanceMode,
        paymentStatus: data.paymentStatus,
        status: data.status,
      })
      setStage("payment")
    } catch {
      setStage("error")
    }
  }

  const handlePay = async () => {
    if (!reg) return
    setPaying(true)
    setPayError(null)

    try {
      const res = await fetch("/api/conference/start-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationId: reg.id, email: email.trim(), provider: selectedProvider }),
      })
      const data = await res.json()

      if (!data.ok) {
        setPayError(data.error || "Failed to start payment.")
        setPaying(false)
        return
      }

      if (data.requiresFormSubmit && data.formData) {
        const form = document.createElement("form")
        form.method = "POST"
        form.action = data.redirectUrl
        Object.entries(data.formData as Record<string, string>).forEach(([k, v]) => {
          const input = document.createElement("input")
          input.type = "hidden"; input.name = k; input.value = v
          form.appendChild(input)
        })
        document.body.appendChild(form)
        form.submit()
        return
      }

      if (data.redirectUrl) window.location.href = data.redirectUrl
    } catch {
      setPayError("An unexpected error occurred. Please try again.")
      setPaying(false)
    }
  }

  const shortId = rid ? `DEESSA-2026-${rid.slice(0, 6).toUpperCase()}` : ""

  // ── Stage: Email Entry ─────────────────────────────────────────────────────
  if (stage === "email-entry") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-10 shadow-xl">
          <div className="mb-6 flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary font-bold text-white">D</div>
            <span className="font-bold">DEESSA Foundation</span>
          </div>
          <div className="mb-5 flex size-14 items-center justify-center rounded-full bg-primary/10">
            <Mail className="size-7 text-primary" />
          </div>
          <h1 className="mb-1 text-xl font-extrabold text-foreground">Complete Your Payment</h1>
          <p className="mb-6 text-sm text-foreground-muted">
            Enter the email address you used when registering to continue.
          </p>
          {rid && (
            <div className="mb-5 rounded-xl bg-muted/60 px-4 py-3 text-sm">
              <span className="text-xs font-bold uppercase tracking-widest text-foreground-muted">Registration ID</span>
              <p className="font-mono font-bold text-foreground">{shortId}</p>
            </div>
          )}
          <div className="mb-4">
            <label className="mb-1.5 block text-sm font-semibold text-foreground" htmlFor="email-input">
              Email Address
            </label>
            <input
              id="email-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && verifyEmail()}
              placeholder="you@example.com"
              className="w-full rounded-xl border border-border px-4 py-3 text-sm outline-none ring-0 transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            {emailError && <p className="mt-1.5 text-xs text-red-500">{emailError}</p>}
          </div>
          <button
            onClick={verifyEmail}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 text-sm font-bold text-white transition hover:opacity-90"
          >
            Continue to Payment →
          </button>
          <p className="mt-4 text-center text-xs text-foreground-muted">
            <Link href="/conference/register" className="text-primary hover:underline">Register a new spot</Link>
          </p>
        </div>
      </div>
    )
  }

  if (stage === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-10 animate-spin text-primary" />
      </div>
    )
  }

  if (stage === "not-found") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-10 text-center shadow-xl">
          <AlertTriangle className="mx-auto mb-4 size-12 text-red-500" />
          <h1 className="mb-2 text-xl font-bold">Registration Not Found</h1>
          <p className="mb-6 text-sm text-foreground-muted">The registration ID and email combination doesn't match our records. Please double-check both and try again.</p>
          <button onClick={() => setStage("email-entry")} className="rounded-xl bg-primary px-8 py-3 text-sm font-bold text-white transition hover:opacity-90">
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (stage === "expired") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-10 text-center shadow-xl">
          <Clock className="mx-auto mb-4 size-12 text-amber-500" />
          <h1 className="mb-2 text-xl font-bold">Registration Expired</h1>
          <p className="mb-6 text-sm text-foreground-muted">This registration has passed its payment deadline. Please register again to secure a new spot.</p>
          <Link href="/conference/register" className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-8 text-sm font-bold text-white transition hover:opacity-90">
            Register Again →
          </Link>
        </div>
      </div>
    )
  }

  if (stage === "error") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-10 text-center shadow-xl">
          <AlertTriangle className="mx-auto mb-4 size-12 text-red-500" />
          <h1 className="mb-2 text-xl font-bold">Something Went Wrong</h1>
          <p className="mb-6 text-sm text-foreground-muted">An unexpected error occurred. Please try again or contact support.</p>
          <Link href="/conference" className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-8 text-sm font-bold text-white transition hover:opacity-90">
            Go to Conference
          </Link>
        </div>
      </div>
    )
  }

  // ── Stage: Payment ─────────────────────────────────────────────────────────
  const isExpired = reg?.expiresAt && countdown === "Expired"
  const amount = reg?.paymentAmount
  const currency = reg?.paymentCurrency || "NPR"

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="mx-auto w-full max-w-2xl px-4 pb-16 pt-8 sm:px-6">
        {/* Header */}
        <div className="mb-6 flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary font-bold text-white">D</div>
          <span className="font-bold">DEESSA Foundation</span>
        </div>

        {/* Expiry banner */}
        {reg?.expiresAt && (
          <div className={`mb-6 flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium ${isExpired ? "border-red-200 bg-red-50 text-red-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}>
            <Clock className="size-4 shrink-0" />
            {isExpired ? <span>Expired. <Link href="/conference/register" className="underline">Register again →</Link></span> : <span>Expires in <strong>{countdown}</strong></span>}
          </div>
        )}

        {/* Registration summary */}
        <div className="mb-6 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="h-1 bg-gradient-to-r from-primary/60 via-primary to-primary/60" />
          <div className="p-6 sm:p-8">
            <h1 className="mb-1 text-xl font-extrabold">Complete Your Payment</h1>
            <p className="mb-6 text-sm text-foreground-muted">DEESSA National Conference 2026</p>
            <div className="grid grid-cols-2 gap-4 rounded-xl bg-muted/50 p-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-foreground-muted">Registration ID</p>
                <p className="font-mono text-sm font-semibold">{shortId}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-foreground-muted">Attendee</p>
                <p className="text-sm font-semibold truncate">{reg?.fullName}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-foreground-muted">Mode</p>
                <p className="text-sm font-semibold capitalize">{reg?.attendanceMode || "—"}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-foreground-muted">Amount Due</p>
                <p className="text-sm font-bold text-primary">{amount !== null ? `${currency} ${amount?.toLocaleString()}` : "—"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Payment providers */}
        {!isExpired && (
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="p-6 sm:p-8">
              <h2 className="mb-1 text-base font-bold">Choose Payment Method</h2>
              <p className="mb-5 text-sm text-foreground-muted">Payments are processed securely.</p>
              <div className="flex flex-col gap-3 mb-6">
                {PROVIDERS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedProvider(p.id)}
                    className={`flex items-center gap-4 rounded-xl border-2 px-5 py-4 text-left transition-all ${selectedProvider === p.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}
                  >
                    <span className="text-2xl">{p.logo}</span>
                    <div className="flex-1"><p className="font-bold">{p.label}</p><p className="text-xs text-foreground-muted">{p.desc}</p></div>
                    <div className={`size-5 rounded-full border-2 flex items-center justify-center shrink-0 ${selectedProvider === p.id ? "border-primary bg-primary" : "border-border"}`}>
                      {selectedProvider === p.id && <div className="size-2 rounded-full bg-white" />}
                    </div>
                  </button>
                ))}
              </div>
              {payError && <div className="mb-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"><AlertTriangle className="mt-0.5 size-4 shrink-0" />{payError}</div>}
              <button
                onClick={handlePay}
                disabled={paying}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 text-base font-bold text-white transition hover:opacity-90 disabled:opacity-60"
              >
                {paying ? <><Loader2 className="size-5 animate-spin" /> Processing…</> : <><CreditCard className="size-5" /> Pay {amount !== null ? `${currency} ${amount?.toLocaleString()}` : ""} Now</>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function CompletePaymentPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    }>
      <CompletePaymentContent />
    </Suspense>
  )
}
