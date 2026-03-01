"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { CreditCard, Clock, CheckCircle, Loader2, AlertTriangle, ArrowRight, Mail } from "lucide-react"

// ── This page is shown immediately after a successful paid registration ────────
// It gives the user a clear "Pay Now" vs "Pay Later" choice before any redirect.
//
// URL: /conference/register/payment-options?rid=...&email=...&amount=...&currency=...

function PaymentOptionsContent() {
  const sp = useSearchParams()
  const rid     = sp.get("rid") ?? ""
  const email   = sp.get("email") ?? ""
  const amount  = sp.get("amount") ? Number(sp.get("amount")) : null
  const currency = sp.get("currency") ?? "NPR"
  const name    = sp.get("name") ? decodeURIComponent(sp.get("name")!) : ""
  const expiryHours = sp.get("expiryHours") ? Number(sp.get("expiryHours")) : 24

  const router = useRouter()
  const [emailSent, setEmailSent] = useState(false)
  const [sendingEmail, setSendingEmail] = useState(false)
  const [countdown, setCountdown] = useState<number | null>(null)

  useEffect(() => {
    if (!emailSent) return
    setCountdown(3)
    const interval = setInterval(() => {
      setCountdown(prev => (prev !== null && prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(interval)
  }, [emailSent])

  useEffect(() => {
    if (countdown === 0) router.push("/conference")
  }, [countdown, router])

  // Safety — if there's no rid just send to register
  if (!rid || !email) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <AlertTriangle className="mx-auto mb-4 size-12 text-amber-500" />
          <p className="font-bold">Missing registration info.</p>
          <Link href="/conference/register" className="mt-4 inline-flex rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white">
            Register Again
          </Link>
        </div>
      </div>
    )
  }

  const shortId = `DEESSA-2026-${rid.slice(0, 6).toUpperCase()}`
  const pendingPaymentUrl = `/conference/register/pending-payment?rid=${rid}&email=${encodeURIComponent(email)}`

  const handlePayLater = async () => {
    // The payment link email was already sent by registerForConference.
    // This button just provides reassurance and can re-trigger if needed.
    setSendingEmail(true)
    try {
      const res = await fetch("/api/conference/resend-payment-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationId: rid, email }),
      })
      if (res.ok) {
        setEmailSent(true)
      }
    } catch {
      // Non-critical — email was already sent on registration
    } finally {
      setSendingEmail(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="mx-auto w-full max-w-xl px-4 pb-16 pt-10 sm:px-6">
        {/* Brand */}
        <div className="mb-8 flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary font-bold text-white">D</div>
          <span className="font-bold">DEESSA Foundation</span>
        </div>

        {/* Success header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="size-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-extrabold text-foreground">
            Registration Received{name ? `, ${name.split(" ")[0]}!` : "!"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your spot is reserved for <span className="font-semibold text-foreground">{expiryHours} {expiryHours === 1 ? 'hour' : 'hours'}</span>.
            Complete payment to confirm your registration.
          </p>
        </div>

        {/* Registration summary card */}
        <div className="mb-6 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="h-1 w-full bg-gradient-to-r from-primary/60 via-primary to-primary/60" />
          <div className="grid grid-cols-2 gap-4 p-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Registration ID</p>
              <p className="font-mono text-sm font-semibold text-foreground">{shortId}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Email</p>
              <p className="text-sm font-semibold text-foreground truncate">{email}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Amount Due</p>
              <p className="text-sm font-bold text-primary">
                {amount !== null ? `${currency} ${amount.toLocaleString()}` : "—"}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Payment Window</p>
              <div className="flex items-center gap-1.5">
                <Clock className="size-3.5 text-amber-500" />
                <p className="text-sm font-semibold text-amber-600">{expiryHours}h remaining</p>
              </div>
            </div>
          </div>
        </div>

        {/* Choice cards */}
        <div className="flex flex-col gap-4">
          {/* Pay Now */}
          <Link
            href={pendingPaymentUrl}
            className="group flex items-center gap-5 overflow-hidden rounded-2xl border-2 border-primary bg-primary/5 p-6 transition-all hover:bg-primary/10 hover:shadow-lg hover:shadow-primary/10"
          >
            <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-primary shadow-md shadow-primary/30 transition-transform group-hover:scale-105">
              <CreditCard className="size-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-extrabold text-foreground">Pay Now</p>
              <p className="text-sm text-muted-foreground">
                Confirm your spot instantly. Choose from Stripe, Khalti, or eSewa.
              </p>
            </div>
            <ArrowRight className="size-5 shrink-0 text-primary transition-transform group-hover:translate-x-1" />
          </Link>

          {/* Pay Later */}
          <button
            onClick={handlePayLater}
            disabled={sendingEmail || emailSent}
            className="group flex items-center gap-5 rounded-2xl border-2 border-border bg-card p-6 text-left transition-all hover:border-primary/40 hover:shadow-md disabled:cursor-default disabled:opacity-80"
          >
            <div className={`flex size-14 shrink-0 items-center justify-center rounded-xl transition-all ${
              emailSent ? "bg-green-100" : "bg-muted group-hover:bg-primary/10"
            }`}>
              {sendingEmail ? (
                <Loader2 className="size-7 animate-spin text-primary" />
              ) : emailSent ? (
                <CheckCircle className="size-7 text-green-600" />
              ) : (
                <Mail className="size-7 text-muted-foreground group-hover:text-primary" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-extrabold text-foreground">
                {emailSent ? "Payment Link Sent ✓" : "Pay Later via Email"}
              </p>
              <p className="text-sm text-muted-foreground">
                {emailSent
                  ? `A payment link has been sent to ${email}. Use it within ${expiryHours}h.`
                  : `We'll send a payment link to ${email}. You have ${expiryHours} hours to complete it.`}
              </p>
              {emailSent && countdown !== null && countdown > 0 && (
                <p className="mt-1.5 text-xs font-medium text-green-600 animate-pulse">
                  Redirecting to conference page in {countdown}s…
                </p>
              )}
            </div>
            {!emailSent && (
              <ArrowRight className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
            )}
          </button>
        </div>

        {/* Fine print */}
        <p className="mt-6 text-center text-xs text-muted-foreground leading-relaxed">
          Your registration ID is <span className="font-mono font-semibold text-foreground">{shortId}</span>.
          Keep it safe — you&apos;ll need it along with your email to access your payment link.{" "}
          <Link href="/conference" className="text-primary hover:underline">
            Back to Conference →
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function PaymentOptionsPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    }>
      <PaymentOptionsContent />
    </Suspense>
  )
}
