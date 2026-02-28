"use client"

import { useEffect, useState, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Clock, CreditCard, AlertTriangle, CheckCircle, Loader2 } from "lucide-react"

type PaymentProvider = "stripe" | "khalti" | "esewa"

interface RegistrationInfo {
  id: string
  fullName: string
  paymentAmount: number | null
  paymentCurrency: string
  expiresAt: string | null
  attendanceMode: string | null
  status: string
  paymentStatus: string
}

const PROVIDERS: { id: PaymentProvider; label: string; logo: string; desc: string }[] = [
  { id: "stripe",  label: "Card / International", logo: "💳", desc: "Visa, Mastercard, AMEX" },
  { id: "khalti",  label: "Khalti",               logo: "🟣", desc: "Nepal digital wallet"  },
  { id: "esewa",   label: "eSewa",                logo: "🟢", desc: "Nepal digital wallet"  },
]

function formatCountdown(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now()
  if (diff <= 0) return "Expired"
  const h = Math.floor(diff / 3_600_000)
  const m = Math.floor((diff % 3_600_000) / 60_000)
  const s = Math.floor((diff % 60_000) / 1_000)
  return h > 0 ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`
}

export default function PendingPaymentPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const rid = searchParams.get("rid") ?? ""
  const email = searchParams.get("email") ?? ""

  const [reg, setReg] = useState<RegistrationInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedProvider, setSelectedProvider] = useState<PaymentProvider>("stripe")
  const [paying, setPaying] = useState(false)
  const [payError, setPayError] = useState<string | null>(null)
  const [countdown, setCountdown] = useState("")

  // Countdown timer
  useEffect(() => {
    if (!reg?.expiresAt) return
    setCountdown(formatCountdown(reg.expiresAt))
    const interval = setInterval(() => setCountdown(formatCountdown(reg.expiresAt!)), 1000)
    return () => clearInterval(interval)
  }, [reg?.expiresAt])

  // Load registration info
  useEffect(() => {
    if (!rid || !email) {
      setError("Missing registration details. Please check your link.")
      setLoading(false)
      return
    }

    fetch(`/api/conference/verify-registration?rid=${encodeURIComponent(rid)}&email=${encodeURIComponent(email)}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.ok) {
          setError(data.error || "Registration not found.")
          return
        }
        if (data.expired) {
          setError("This registration has expired. Please register again.")
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
          status: data.status,
          paymentStatus: data.paymentStatus,
        })
      })
      .catch(() => setError("Failed to load registration. Please try again."))
      .finally(() => setLoading(false))
  }, [rid, email])

  const handlePay = async () => {
    if (!reg) return
    setPaying(true)
    setPayError(null)

    try {
      const res = await fetch("/api/conference/start-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationId: reg.id, email, provider: selectedProvider }),
      })
      const data = await res.json()

      if (!data.ok) {
        setPayError(data.error || "Failed to start payment. Please try again.")
        setPaying(false)
        return
      }

      // eSewa requires a form POST
      if (data.requiresFormSubmit && data.formData) {
        const form = document.createElement("form")
        form.method = "POST"
        form.action = data.redirectUrl
        Object.entries(data.formData as Record<string, string>).forEach(([k, v]) => {
          const input = document.createElement("input")
          input.type = "hidden"
          input.name = k
          input.value = v
          form.appendChild(input)
        })
        document.body.appendChild(form)
        form.submit()
        return
      }

      if (data.redirectUrl) {
        window.location.href = data.redirectUrl
      }
    } catch {
      setPayError("An unexpected error occurred. Please try again.")
      setPaying(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="size-10 animate-spin text-primary" />
          <p className="text-sm text-foreground-muted">Loading your registration…</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-10 text-center shadow-lg">
          <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="size-8 text-red-500" />
          </div>
          <h1 className="mb-3 text-xl font-bold text-foreground">Registration Issue</h1>
          <p className="mb-6 text-sm text-foreground-muted">{error}</p>
          <Link
            href="/conference/register"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-8 text-sm font-bold text-white transition hover:opacity-90"
          >
            Register Again
          </Link>
        </div>
      </div>
    )
  }

  if (!reg) return null

  const shortId = `DEESSA-2026-${reg.id.slice(0, 6).toUpperCase()}`
  const amount = reg.paymentAmount
  const currency = reg.paymentCurrency || "NPR"
  const isExpired = reg.expiresAt && countdown === "Expired"

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <div className="mx-auto w-full max-w-2xl px-4 pb-4 pt-8 sm:px-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary font-bold text-lg text-white">D</div>
            <span className="text-lg font-bold tracking-tight">DEESSA Foundation</span>
          </div>
          <Link href="/conference" className="text-sm font-semibold text-foreground-muted hover:text-primary transition-colors">
            ← Conference
          </Link>
        </div>
      </div>

      <div className="mx-auto w-full max-w-2xl flex-1 px-4 pb-16 sm:px-6">
        {/* Expiry Banner */}
        {reg.expiresAt && (
          <div className={`mb-6 flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium ${isExpired ? "border-red-200 bg-red-50 text-red-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}>
            <Clock className="size-4 shrink-0" />
            {isExpired ? (
              <span>This registration has expired. <Link href="/conference/register" className="underline">Register again →</Link></span>
            ) : (
              <span>Complete payment within <strong>{countdown}</strong> to secure your spot.</span>
            )}
          </div>
        )}

        {/* Registration Summary */}
        <div className="mb-6 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="h-1 w-full bg-gradient-to-r from-primary/60 via-primary to-primary/60" />
          <div className="p-6 sm:p-8">
            <h1 className="mb-1 text-xl font-extrabold text-foreground">Complete Your Registration</h1>
            <p className="mb-6 text-sm text-foreground-muted">DEESSA National Conference 2026</p>

            <div className="grid grid-cols-2 gap-4 rounded-xl bg-muted/50 p-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-foreground-muted">Registration ID</p>
                <p className="font-mono text-sm font-semibold text-foreground">{shortId}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-foreground-muted">Attendee</p>
                <p className="text-sm font-semibold text-foreground truncate">{reg.fullName}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-foreground-muted">Mode</p>
                <p className="text-sm font-semibold text-foreground capitalize">{reg.attendanceMode || "—"}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-foreground-muted">Amount Due</p>
                <p className="text-sm font-bold text-primary">
                  {amount !== null ? `${currency} ${amount.toLocaleString()}` : "—"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Providers */}
        {!isExpired && (
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="p-6 sm:p-8">
              <h2 className="mb-1 text-base font-bold text-foreground">Choose Payment Method</h2>
              <p className="mb-5 text-sm text-foreground-muted">All payments are processed securely.</p>

              <div className="flex flex-col gap-3 mb-6">
                {PROVIDERS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedProvider(p.id)}
                    className={`flex items-center gap-4 rounded-xl border-2 px-5 py-4 text-left transition-all ${
                      selectedProvider === p.id
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border bg-background hover:border-primary/40"
                    }`}
                  >
                    <span className="text-2xl">{p.logo}</span>
                    <div className="flex-1">
                      <p className="font-bold text-foreground">{p.label}</p>
                      <p className="text-xs text-foreground-muted">{p.desc}</p>
                    </div>
                    <div className={`size-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${selectedProvider === p.id ? "border-primary bg-primary" : "border-border"}`}>
                      {selectedProvider === p.id && <div className="size-2 rounded-full bg-white" />}
                    </div>
                  </button>
                ))}
              </div>

              {payError && (
                <div className="mb-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                  {payError}
                </div>
              )}

              <button
                onClick={handlePay}
                disabled={paying}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 text-base font-bold text-white shadow-lg transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {paying ? (
                  <><Loader2 className="size-5 animate-spin" /> Processing…</>
                ) : (
                  <><CreditCard className="size-5" /> Pay {amount !== null ? `${currency} ${amount.toLocaleString()}` : ""} Now</>
                )}
              </button>

              <p className="mt-4 text-center text-xs text-foreground-muted">
                A payment link has also been sent to your email. You can pay later using that link.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
