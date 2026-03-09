"use client"

import Link from "next/link"
import {
  CheckCircle,
  Heart,
  Download,
  ArrowRight,
  Loader2,
  AlertCircle,
  Copy,
  Check,
  Mail,
  Clock,
  RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useEffect, useState, useRef, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { formatCurrency } from "@/lib/utils/currency"
import { ReceiptPreview } from "@/components/receipt-preview"
import {
  getReceiptForDisplay,
  getOrganizationDetailsForReceipt,
  ensureReceiptSent,
} from "@/lib/actions/donation-receipt"

interface DonationData {
  id: string
  amount: number
  currency: string
  donor_name: string
  donor_email: string
  donor_phone?: string | null
  is_monthly: boolean
  payment_status: string
  created_at?: string
  provider?: string
  // Reference IDs for support contact
  provider_ref?: string | null
  payment_id?: string | null
  stripe_session_id?: string | null
  khalti_pidx?: string | null
  esewa_transaction_uuid?: string | null
}

interface VerificationResult {
  success: boolean
  donation?: DonationData | null
  error?: string
}

// ── Copyable reference chip ───────────────────────────────────────────────────
function CopyChip({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [value])

  const display = value.length > 24 ? `${value.slice(0, 10)}…${value.slice(-8)}` : value

  return (
    <div className="flex items-center justify-between gap-3 bg-background rounded-xl border border-border px-4 py-2.5 group">
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-foreground-muted mb-0.5">{label}</p>
        <p className="text-xs font-mono text-foreground truncate" title={value}>{display}</p>
      </div>
      <button
        onClick={handleCopy}
        aria-label={`Copy ${label}`}
        className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg bg-muted hover:bg-primary/10 hover:text-primary transition-all duration-150"
      >
        {copied ? (
          <Check className="size-3.5 text-green-600" />
        ) : (
          <Copy className="size-3.5 text-foreground-muted group-hover:text-primary" />
        )}
      </button>
    </div>
  )
}

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status, isPolling }: { status: string; isPolling: boolean }) {
  if (isPolling) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold">
        <RefreshCw className="size-3 animate-spin" />
        Confirming…
      </span>
    )
  }
  if (status === "completed") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 border border-green-200 text-green-700 text-xs font-semibold">
        <CheckCircle className="size-3" />
        Confirmed
      </span>
    )
  }
  if (status === "pending") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold">
        <Clock className="size-3" />
        Pending
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted border border-border text-foreground-muted text-xs font-semibold capitalize">
      {status}
    </span>
  )
}

// ── Provider display label ────────────────────────────────────────────────────
function providerLabel(provider?: string) {
  if (provider === "khalti") return "Khalti"
  if (provider === "esewa") return "eSewa"
  return "Stripe"
}

// ── Support reference string ──────────────────────────────────────────────────
function getSupportRef(donation: DonationData): string | null {
  return (
    donation.provider_ref ||
    donation.payment_id ||
    donation.stripe_session_id ||
    donation.khalti_pidx ||
    donation.esewa_transaction_uuid ||
    donation.id ||
    null
  )
}

// ── Format date ───────────────────────────────────────────────────────────────
function formatDate(iso?: string): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

// ─────────────────────────────────────────────────────────────────────────────
export function SuccessContent() {
  const searchParams = useSearchParams()
  const [verification, setVerification] = useState<VerificationResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isPolling, setIsPolling] = useState(false)
  const [provider, setProvider] = useState<"stripe" | "khalti" | "esewa">("stripe")
  const [receipt, setReceipt] = useState<any>(null)
  const [isFetchingReceipt, setIsFetchingReceipt] = useState(false)
  const [receiptTimedOut, setReceiptTimedOut] = useState(false)
  const [ensureEmailSent, setEnsureEmailSent] = useState(false)
  const [ensureEmailStatus, setEnsureEmailStatus] = useState<"idle" | "sending" | "sent" | "error">("idle")
  const [organizationDetails, setOrganizationDetails] = useState<{
    name: string
    vatNumber: string
    panNumber: string
    swcNumber: string
  } | null>(null)

  const receiptFetchStarted = useRef(false)

  useEffect(() => {
    const providerParam = searchParams.get("provider") as "stripe" | "khalti" | "esewa" | null
    const sessionId = searchParams.get("session_id")
    const pidx = searchParams.get("pidx")
    const transactionCode = searchParams.get("transaction_code")
    const refId = searchParams.get("refId")

    if (providerParam && ["stripe", "khalti", "esewa"].includes(providerParam)) {
      setProvider(providerParam)
    } else if (pidx) {
      setProvider("khalti")
    } else if (transactionCode || refId) {
      setProvider("esewa")
    } else if (sessionId) {
      setProvider("stripe")
    }

    // ── Khalti ──────────────────────────────────────────────────────────────
    if (providerParam === "khalti" && pidx) {
      fetch(`/api/payments/khalti/status?pidx=${encodeURIComponent(pidx)}`)
        .then(async (response) => {
          const data = await response.json()
          if (response.ok && data.success && data.donation) {
            setVerification({
              success: true,
              donation: {
                id: data.donation.id,
                amount: data.donation.amount,
                currency: data.donation.currency,
                donor_name: data.donation.donor_name,
                donor_email: data.donation.donor_email,
                donor_phone: data.donation.donor_phone ?? undefined,
                is_monthly: data.donation.is_monthly,
                payment_status: data.donation.payment_status,
                created_at: data.donation.created_at,
                provider: "khalti",
                provider_ref: data.donation.provider_ref,
                khalti_pidx: data.donation.khalti_pidx,
              },
            })
          } else {
            setVerification({ success: false, error: data.error || "Donation not found" })
          }
          setIsLoading(false)
        })
        .catch((error) => {
          console.error("Error fetching Khalti status:", error)
          setVerification({ success: false, error: "Failed to fetch payment status" })
          setIsLoading(false)
        })
      return
    }

    // ── eSewa ────────────────────────────────────────────────────────────────
    const esewaUuid = searchParams.get("esewa_uuid")
    const esewaRef = esewaUuid || transactionCode || refId
    if ((providerParam === "esewa" || esewaRef) && esewaRef) {
      fetch(`/api/payments/esewa/status?transaction_uuid=${encodeURIComponent(esewaRef)}`)
        .then(async (response) => {
          const data = await response.json()
          if (response.ok && data.success && data.donation) {
            setVerification({
              success: true,
              donation: {
                id: data.donation.id,
                amount: data.donation.amount,
                currency: data.donation.currency,
                donor_name: data.donation.donor_name,
                donor_email: data.donation.donor_email,
                donor_phone: data.donation.donor_phone ?? undefined,
                is_monthly: data.donation.is_monthly,
                payment_status: data.donation.payment_status,
                created_at: data.donation.created_at,
                provider: "esewa",
                provider_ref: data.donation.provider_ref,
                esewa_transaction_uuid: data.donation.esewa_transaction_uuid,
              },
            })
          } else {
            setVerification({ success: false, error: data.error || "Donation not found" })
          }
          setIsLoading(false)
        })
        .catch((error) => {
          console.error("Error fetching eSewa status:", error)
          setVerification({ success: false, error: "Failed to fetch payment status" })
          setIsLoading(false)
        })
      return
    }

    // ── Stripe ───────────────────────────────────────────────────────────────
    if (providerParam === "stripe" || sessionId) {
      if (!sessionId) {
        setVerification({ success: false, error: "No session ID provided" })
        setIsLoading(false)
        return
      }

      const checkStatus = async () => {
        try {
          const response = await fetch(`/api/payments/stripe/status?session_id=${sessionId}`)
          const data = await response.json()

          if (response.ok && data.success) {
            const mapDonation = (d: any): DonationData => ({
              id: d.id,
              amount: d.amount,
              currency: d.currency,
              donor_name: d.donor_name,
              donor_email: d.donor_email,
              donor_phone: d.donor_phone ?? undefined,
              is_monthly: d.is_monthly,
              payment_status: d.payment_status,
              created_at: d.created_at,
              provider: d.provider || "stripe",
              provider_ref: d.provider_ref,
              payment_id: d.payment_id,
              stripe_session_id: d.stripe_session_id,
            })

            if (data.donation?.payment_status === "pending") {
              setVerification({ success: true, donation: mapDonation(data.donation) })
              setIsLoading(false)
              setIsPolling(true)

              let attempts = 0
              const maxAttempts = 15

              const pollForUpdate = setInterval(async () => {
                attempts++
                try {
                  const pollResponse = await fetch(`/api/payments/stripe/status?session_id=${sessionId}`)
                  const pollData = await pollResponse.json()

                  if (pollResponse.ok && pollData.success && pollData.donation) {
                    setVerification((prev) => ({
                      success: true,
                      donation: {
                        ...prev?.donation,
                        ...mapDonation(pollData.donation),
                        donor_name: pollData.donation.donor_name || prev?.donation?.donor_name || "",
                        donor_email: pollData.donation.donor_email || prev?.donation?.donor_email || "",
                        donor_phone: pollData.donation.donor_phone ?? prev?.donation?.donor_phone,
                      } as DonationData,
                    }))

                    if (pollData.donation.payment_status !== "pending") {
                      clearInterval(pollForUpdate)
                      setIsPolling(false)
                    } else if (attempts >= maxAttempts) {
                      clearInterval(pollForUpdate)
                      setIsPolling(false)
                      // Self-healing fallback — call verify directly
                      try {
                        const verifyResponse = await fetch(`/api/payments/stripe/verify?session_id=${sessionId}`)
                        const verifyData = await verifyResponse.json()
                        if (verifyResponse.ok && verifyData.success && verifyData.donation) {
                          setVerification((prev) => ({
                            success: true,
                            donation: {
                              ...prev?.donation,
                              ...mapDonation(verifyData.donation),
                              donor_name: verifyData.donation.donor_name || prev?.donation?.donor_name || "",
                              donor_email: verifyData.donation.donor_email || prev?.donation?.donor_email || "",
                              donor_phone: verifyData.donation.donor_phone ?? prev?.donation?.donor_phone,
                            } as DonationData,
                          }))
                        }
                      } catch (verifyError) {
                        console.error("Error triggering Stripe verify fallback:", verifyError)
                      }
                    }
                  } else if (attempts >= maxAttempts) {
                    clearInterval(pollForUpdate)
                    setIsPolling(false)
                  }
                } catch (pollError) {
                  console.error("Error polling for status update:", pollError)
                  if (attempts >= maxAttempts) {
                    clearInterval(pollForUpdate)
                    setIsPolling(false)
                  }
                }
              }, 2000)
            } else {
              setVerification({ success: true, donation: mapDonation(data.donation) })
              setIsLoading(false)
            }
          } else {
            setVerification({ success: false, error: data.error || "Status check failed" })
            setIsLoading(false)
          }
        } catch (error) {
          console.error("Error checking status:", error)
          setVerification({ success: false, error: "Failed to check payment status" })
          setIsLoading(false)
        }
      }

      checkStatus()
      return
    }

    setVerification({ success: true })
    setIsLoading(false)
  }, [searchParams])

  const donationId = verification?.donation?.id
  const paymentStatus = verification?.donation?.payment_status

  // When receipt poll times out, trigger email fallback once
  useEffect(() => {
    if (!receiptTimedOut || !donationId || ensureEmailSent) return
    setEnsureEmailSent(true)
    setEnsureEmailStatus("sending")
    ensureReceiptSent(donationId)
      .then((result) => {
        if (result.receiptNumber) {
          setReceipt((prev: typeof receipt) =>
            prev ?? { receipt_number: result.receiptNumber, receipt_url: result.receiptUrl }
          )
        }
        setEnsureEmailStatus(result.success ? "sent" : "error")
      })
      .catch(() => setEnsureEmailStatus("error"))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [receiptTimedOut, donationId])

  // Fetch receipt once when payment is confirmed
  useEffect(() => {
    if (!donationId || paymentStatus !== "completed") return
    if (receiptFetchStarted.current) return
    receiptFetchStarted.current = true

    let cancelled = false
    let pollTimer: ReturnType<typeof setInterval> | null = null

    const run = async () => {
      try {
        const orgDetails = await getOrganizationDetailsForReceipt()
        if (!cancelled) setOrganizationDetails(orgDetails)
      } catch (e) {
        console.error("Org details fetch error:", e)
      }

      setIsFetchingReceipt(true)
      try {
        const initial = await getReceiptForDisplay(donationId)
        if (initial?.receipt_number) {
          if (!cancelled) { setReceipt(initial); setIsFetchingReceipt(false) }
          return
        }
      } catch (e) {
        console.error("Initial receipt fetch error:", e)
      }

      let attempts = 0
      pollTimer = setInterval(async () => {
        if (cancelled) { clearInterval(pollTimer!); return }
        attempts++
        try {
          const data = await getReceiptForDisplay(donationId)
          if (data?.receipt_number) {
            clearInterval(pollTimer!)
            if (!cancelled) { setReceipt(data); setIsFetchingReceipt(false) }
          } else if (attempts >= 15) {
            clearInterval(pollTimer!)
            if (!cancelled) { setIsFetchingReceipt(false); setReceiptTimedOut(true) }
          }
        } catch (e) {
          console.error("Receipt poll error:", e)
          if (attempts >= 15) {
            clearInterval(pollTimer!)
            if (!cancelled) { setIsFetchingReceipt(false); setReceiptTimedOut(true) }
          }
        }
      }, 2000)
    }

    run()
    return () => {
      cancelled = true
      if (pollTimer) clearInterval(pollTimer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [donationId, paymentStatus])

  // ─── Loading ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <div className="w-20 h-20 rounded-full bg-primary/10 border-4 border-primary/20 flex items-center justify-center mx-auto mb-6 animate-pulse">
          <Loader2 className="size-10 text-primary animate-spin" />
        </div>
        <h1 className="text-3xl font-black text-foreground mb-3">Verifying Your Donation…</h1>
        <p className="text-foreground-muted">Please wait while we confirm your payment with {providerLabel(provider)}.</p>
      </div>
    )
  }

  // ─── Error ──────────────────────────────────────────────────────────────────
  if (!verification?.success) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <div className="w-20 h-20 rounded-full bg-orange-50 border-4 border-orange-200 flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="size-10 text-orange-500" />
        </div>
        <h1 className="text-3xl font-black text-foreground mb-3">Payment Verification Failed</h1>
        <p className="text-foreground-muted mb-8">
          {verification?.error || "We couldn't verify your payment. If you were charged, please contact our support team."}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild size="lg"><Link href="/donate">Try Again</Link></Button>
          <Button asChild variant="outline" size="lg"><Link href="/contact">Contact Support</Link></Button>
        </div>
      </div>
    )
  }

  const donation = verification.donation
  const amount = donation?.amount || 0
  const currency = donation?.currency || "USD"
  const isConfirmed = donation?.payment_status === "completed"
  const supportRef = donation ? getSupportRef(donation) : null

  return (
    <div className="max-w-2xl mx-auto py-10 space-y-6">

      {/* ── Hero confirmation card ──────────────────────────────────────────── */}
      <div className={`relative rounded-3xl overflow-hidden border-2 p-8 text-center
        ${isConfirmed
          ? "bg-gradient-to-b from-green-50 to-background border-green-200"
          : "bg-gradient-to-b from-amber-50 to-background border-amber-200"
        }`}>
        {/* Decorative background blob */}
        <div className={`absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full blur-3xl opacity-30
          ${isConfirmed ? "bg-green-400" : "bg-amber-400"}`} />

        <div className="relative">
          <div className={`w-20 h-20 rounded-full border-4 flex items-center justify-center mx-auto mb-5
            ${isConfirmed ? "bg-green-100 border-green-300" : "bg-amber-100 border-amber-300"}`}>
            {isConfirmed
              ? <CheckCircle className="size-10 text-green-600" />
              : <Clock className="size-10 text-amber-500" />
            }
          </div>

          <div className="mb-3">
            <StatusBadge status={donation?.payment_status || "pending"} isPolling={isPolling} />
          </div>

          <h1 className="text-3xl md:text-4xl font-black text-foreground mb-3 leading-tight">
            {isConfirmed ? "Thank You for Your Generosity!" : "Payment Being Processed"}
          </h1>
          <p className="text-foreground-muted text-base leading-relaxed max-w-md mx-auto">
            {isConfirmed
              ? `Your donation via ${providerLabel(provider)} has been confirmed. You're making a real difference in Nepal.`
              : `Your payment is being confirmed with ${providerLabel(provider)}. This usually takes a few seconds.`
            }
          </p>
        </div>
      </div>

      {/* ── Donation details card ───────────────────────────────────────────── */}
      {donation && (
        <div className="bg-surface border border-border rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border bg-muted/40">
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">Donation Summary</h2>
          </div>
          <div className="px-6 py-5 space-y-3.5">

            {/* Amount — prominent */}
            <div className="flex items-center justify-between">
              <span className="text-foreground-muted text-sm">Amount</span>
              <span className="text-2xl font-black text-foreground">
                {formatCurrency(amount, currency, { showCode: true })}
              </span>
            </div>

            {donation.is_monthly && (
              <div className="flex items-center justify-between">
                <span className="text-foreground-muted text-sm">Frequency</span>
                <span className="text-sm font-semibold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
                  Monthly Recurring
                </span>
              </div>
            )}

            {donation.donor_name && (
              <div className="flex items-center justify-between">
                <span className="text-foreground-muted text-sm">Donor</span>
                <span className="text-sm font-semibold text-foreground">{donation.donor_name}</span>
              </div>
            )}

            {donation.donor_email && (
              <div className="flex items-center justify-between">
                <span className="text-foreground-muted text-sm">Email</span>
                <span className="text-sm text-foreground">{donation.donor_email}</span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-foreground-muted text-sm">Payment via</span>
              <span className="text-sm font-semibold text-foreground">{providerLabel(provider)}</span>
            </div>

            {donation.created_at && (
              <div className="flex items-center justify-between">
                <span className="text-foreground-muted text-sm">Date & Time</span>
                <span className="text-sm text-foreground">{formatDate(donation.created_at)}</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-1 border-t border-border">
              <span className="text-foreground-muted text-sm">Status</span>
              <StatusBadge status={donation.payment_status} isPolling={isPolling} />
            </div>

          </div>
        </div>
      )}

      {/* ── Reference IDs card — for support contact ════════════════════════════ */}
      {donation && (
        <div className="bg-surface border border-border rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border bg-muted/40 flex items-center justify-between">
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">Reference Details</h2>
            <span className="text-[11px] text-foreground-muted">Keep these for your records</span>
          </div>
          <div className="px-6 py-5 space-y-2.5">

            {/* Always show internal donation ID */}
            <CopyChip label="Donation ID" value={donation.id} />

            {/* Provider-specific reference */}
            {donation.provider_ref && (
              <CopyChip
                label={`${providerLabel(provider)} Reference`}
                value={donation.provider_ref}
              />
            )}
            {!donation.provider_ref && donation.payment_id && (
              <CopyChip
                label="Payment ID"
                value={donation.payment_id}
              />
            )}
            {!donation.provider_ref && !donation.payment_id && donation.stripe_session_id && (
              <CopyChip
                label="Session ID"
                value={donation.stripe_session_id}
              />
            )}
            {donation.khalti_pidx && (
              <CopyChip label="Khalti PIDX" value={donation.khalti_pidx} />
            )}
            {donation.esewa_transaction_uuid && (
              <CopyChip label="eSewa Transaction" value={donation.esewa_transaction_uuid} />
            )}

            {/* Support prompt */}
            <div className="mt-3 pt-3 border-t border-border">
              <p className="text-xs text-foreground-muted leading-relaxed">
                If you need to contact our support team about this donation, please share your{" "}
                <span className="font-semibold text-foreground">Donation ID</span> — it helps us locate your record instantly.
              </p>
              <Link
                href={`/contact?ref=${supportRef || donation.id}&subject=Donation+Support`}
                className="inline-flex items-center gap-1.5 mt-2 text-xs font-semibold text-primary hover:underline"
              >
                <Mail className="size-3.5" />
                Contact support about this donation →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── Receipt section ─────────────────────────────────────────────────── */}
      {donation?.payment_status === "completed" && (
        <>
          {isFetchingReceipt && !receipt && (
            <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-2xl">
              <Loader2 className="size-4 text-blue-600 animate-spin flex-shrink-0" />
              <p className="text-sm text-blue-800">Generating your tax receipt — this takes a few seconds…</p>
            </div>
          )}

          {receiptTimedOut && !receipt && (
            <div className="p-5 bg-amber-50 border border-amber-200 rounded-2xl space-y-2">
              <div className="flex items-start gap-3">
                <AlertCircle className="size-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-800 mb-1">Receipt is taking a little longer than usual</p>
                  <p className="text-sm text-amber-700">
                    Your payment is confirmed. We're sending your receipt to{" "}
                    <span className="font-medium">{donation.donor_email}</span>.
                  </p>
                </div>
              </div>
              {ensureEmailStatus === "sending" && (
                <div className="flex items-center gap-2 text-amber-700 text-sm pl-7">
                  <Loader2 className="size-3.5 animate-spin" />
                  Sending receipt email…
                </div>
              )}
              {ensureEmailStatus === "sent" && (
                <p className="text-sm text-green-700 font-medium pl-7">✓ Receipt email sent. Check your inbox.</p>
              )}
              {ensureEmailStatus === "error" && (
                <p className="text-sm text-red-700 pl-7">
                  Couldn't send automatically — contact{" "}
                  <Link href="/contact" className="font-semibold underline">support</Link>{" "}
                  if you don't receive your receipt within an hour.
                </p>
              )}
            </div>
          )}

          {receipt && organizationDetails && (
            <ReceiptPreview
              receiptNumber={receipt.receipt_number}
              receiptUrl={receipt.receipt_url}
              donorName={donation.donor_name}
              donorEmail={donation.donor_email}
              donorPhone={donation.donor_phone ?? undefined}
              amount={donation.amount}
              currency={donation.currency}
              paymentDate={new Date(donation.created_at ?? receipt.receipt_generated_at ?? new Date())}
              isMonthly={donation.is_monthly}
              organizationName={organizationDetails.name}
              vatNumber={organizationDetails.vatNumber}
              panNumber={organizationDetails.panNumber}
              swcNumber={organizationDetails.swcNumber}
            />
          )}
        </>
      )}

      {/* ── What happens next ───────────────────────────────────────────────── */}
      {isConfirmed && (
        <div className="bg-surface border border-border rounded-2xl p-6">
          <h2 className="text-base font-bold text-foreground mb-4">What Happens Next?</h2>
          <div className="space-y-4">
            {[
              {
                n: "1",
                title: "Receipt Sent",
                body: "A tax-deductible receipt will be sent to your email address.",
              },
              {
                n: "2",
                title: "Funds Allocated",
                body: "Your donation will be allocated to our programs within 48 hours.",
              },
              {
                n: "3",
                title: "Impact Updates",
                body: "You'll receive regular updates about how your donation is creating change.",
              },
            ].map(({ n, title, body }) => (
              <div key={n} className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-primary font-bold text-sm">{n}</span>
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-sm mb-0.5">{title}</h3>
                  <p className="text-foreground-muted text-sm">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Spread the word ─────────────────────────────────────────────────── */}
      {isConfirmed && (
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-6 text-center">
          <Heart className="size-10 text-primary mx-auto mb-3" />
          <h3 className="text-base font-bold text-foreground mb-2">Want to Do More?</h3>
          <p className="text-foreground-muted text-sm mb-4">
            Share our mission with friends and family, or explore volunteer opportunities.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild variant="outline" size="sm">
              <Link href="/get-involved">
                <ArrowRight className="mr-2 size-4" />
                Get Involved
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/stories">
                <Download className="mr-2 size-4" />
                Read Impact Stories
              </Link>
            </Button>
          </div>
        </div>
      )}

      {/* ── Nav ─────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <Button asChild size="lg" className="flex-1 sm:flex-none">
          <Link href="/">Return to Homepage</Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="flex-1 sm:flex-none">
          <Link href="/donate">Make Another Donation</Link>
        </Button>
      </div>

      <p className="text-center text-sm text-foreground-muted">
        Questions about your donation?{" "}
        <Link href="/contact" className="text-primary hover:underline font-medium">
          Contact our team
        </Link>
      </p>
    </div>
  )
}
