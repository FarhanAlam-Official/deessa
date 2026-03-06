"use client"

import Link from "next/link"
import { CheckCircle, Heart, Download, ArrowRight, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useEffect, useState, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { formatCurrency } from "@/lib/utils/currency"
import { ReceiptPreview } from "@/components/receipt-preview"
import {
  getReceiptForDisplay,
  getOrganizationDetailsForReceipt,
  getDonationByPaymentRef,
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
}

interface VerificationResult {
  success: boolean
  donation?: DonationData | null
  error?: string
}

export function SuccessContent() {
  const searchParams = useSearchParams()
  const [verification, setVerification] = useState<VerificationResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [provider, setProvider] = useState<"stripe" | "khalti" | "esewa">("stripe")
  const [receipt, setReceipt] = useState<any>(null)
  const [isFetchingReceipt, setIsFetchingReceipt] = useState(false)
  const [receiptTimedOut, setReceiptTimedOut] = useState(false)
  const [ensureEmailSent, setEnsureEmailSent] = useState(false)
  const [ensureEmailStatus, setEnsureEmailStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [organizationDetails, setOrganizationDetails] = useState<{
    name: string
    vatNumber: string
    panNumber: string
    swcNumber: string
  } | null>(null)

  // Guard: ensures receipt-fetch only runs once per confirmed donation,
  // even if verification state updates multiple times (e.g. during status polling).
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
      // Use read-only status endpoint (no mutation)
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
    // Prefer the full UUID (esewa_uuid param) over the short transaction_code for status lookup
    const esewaUuid = searchParams.get("esewa_uuid")
    const esewaRef = esewaUuid || transactionCode || refId
    if ((providerParam === "esewa" || esewaRef) && esewaRef) {
      // Use read-only status endpoint (no mutation)
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
            if (data.donation?.payment_status === "pending") {
              // Set initial state, then poll for the DB update
              setVerification({ success: true, donation: data.donation })
              setIsLoading(false)

              let attempts = 0
              const maxAttempts = 15

              const pollForUpdate = setInterval(async () => {
                attempts++
                try {
                  const pollResponse = await fetch(`/api/payments/stripe/status?session_id=${sessionId}`)
                  const pollData = await pollResponse.json()

                  if (pollResponse.ok && pollData.success && pollData.donation) {
                    // Merge: always preserve donor PII whichever poll first delivers it
                    setVerification((prev) => ({
                      success: true,
                      donation: {
                        ...prev?.donation,
                        ...pollData.donation,
                        donor_name: pollData.donation.donor_name || prev?.donation?.donor_name || "",
                        donor_email: pollData.donation.donor_email || prev?.donation?.donor_email || "",
                        donor_phone: pollData.donation.donor_phone ?? prev?.donation?.donor_phone,
                      } as DonationData,
                    }))

                    if (pollData.donation.payment_status !== "pending") {
                      clearInterval(pollForUpdate)
                    } else if (attempts >= maxAttempts) {
                      clearInterval(pollForUpdate)
                    }
                  } else if (attempts >= maxAttempts) {
                    clearInterval(pollForUpdate)
                  }
                } catch (pollError) {
                  console.error("Error polling for status update:", pollError)
                  if (attempts >= maxAttempts) clearInterval(pollForUpdate)
                }
              }, 2000)
            } else {
              // Already completed/failed
              setVerification({ success: true, donation: data.donation })
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

  // Stable scalar deps — NOT the full donation object — so these effects don't
  // re-fire on every poll update that creates a new object reference.
  const donationId = verification?.donation?.id
  const paymentStatus = verification?.donation?.payment_status

  // When poll times out, trigger email fallback once
  useEffect(() => {
    if (!receiptTimedOut || !donationId || ensureEmailSent) return
    setEnsureEmailSent(true)
    setEnsureEmailStatus('sending')

    ensureReceiptSent(donationId)
      .then((result) => {
        // If receipt was found and returned, surface it on the page
        if (result.receiptNumber) {
          setReceipt((prev: typeof receipt) => prev ?? {
            receipt_number: result.receiptNumber,
            receipt_url: result.receiptUrl,
          })
        }
        setEnsureEmailStatus(result.success ? 'sent' : 'error')
      })
      .catch(() => setEnsureEmailStatus('error'))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [receiptTimedOut, donationId])

  // Fetch receipt once when payment is confirmed.
  useEffect(() => {
    if (!donationId || paymentStatus !== "completed") return
    // Guard: only run once even if donationId/paymentStatus re-evaluate to same values
    if (receiptFetchStarted.current) return
    receiptFetchStarted.current = true

    let cancelled = false
    let pollTimer: ReturnType<typeof setInterval> | null = null

    const run = async () => {
      // Org details (non-blocking)
      try {
        const orgDetails = await getOrganizationDetailsForReceipt()
        if (!cancelled) setOrganizationDetails(orgDetails)
      } catch (e) {
        console.error("Org details fetch error:", e)
      }

      // Immediate receipt check
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

      // Not ready yet — poll every 2s for up to 30s
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
            if (!cancelled) {
              setIsFetchingReceipt(false)
              setReceiptTimedOut(true)
            }
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

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto text-center">
        <div className="bg-blue-50 border-4 border-blue-500 rounded-full w-24 h-24 mx-auto flex items-center justify-center mb-6">
          <Loader2 className="size-16 text-blue-600 animate-spin" />
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-foreground mb-4">
          Verifying Your Donation...
        </h1>
        <p className="text-xl text-foreground-muted mb-8 leading-relaxed">
          Please wait while we confirm your payment.
        </p>
      </div>
    )
  }

  if (!verification?.success) {
    return (
      <div className="max-w-3xl mx-auto text-center">
        <div className="bg-orange-50 border-4 border-orange-500 rounded-full w-24 h-24 mx-auto flex items-center justify-center mb-6">
          <AlertCircle className="size-16 text-orange-600" />
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-foreground mb-4">
          Unable to Verify Payment
        </h1>
        <p className="text-xl text-foreground-muted mb-8 leading-relaxed">
          {verification?.error || "We couldn't verify your payment session. Please contact support if you have any questions."}
        </p>
        <div className="space-y-3">
          <Button asChild size="lg"><Link href="/donate">Try Again</Link></Button>
          <Button asChild variant="outline" size="lg"><Link href="/contact">Contact Support</Link></Button>
        </div>
      </div>
    )
  }

  const donation = verification.donation
  const amount = donation?.amount || 0
  const currency = donation?.currency || "USD"

  return (
    <div className="max-w-3xl mx-auto text-center">
      <div className="bg-green-50 border-4 border-green-500 rounded-full w-24 h-24 mx-auto flex items-center justify-center mb-6">
        <CheckCircle className="size-16 text-green-600" />
      </div>

      <h1 className="text-4xl md:text-5xl font-black text-foreground mb-4">
        Thank You for Your Generosity!
      </h1>

      <p className="text-xl text-foreground-muted mb-8 leading-relaxed">
        Your donation has been successfully processed via{" "}
        {provider === "stripe" ? "Stripe" : provider === "khalti" ? "Khalti" : "eSewa"}.
        You&apos;re making a real difference in the lives of communities across Nepal.
      </p>

      {donation && (
        <>
          <div className="bg-surface border border-border rounded-2xl p-6 mb-8 text-left">
            <h2 className="text-xl font-bold text-foreground mb-4 text-center">Donation Details</h2>
            <div className="space-y-3">
              {donation.donor_name && (
                <div className="flex justify-between">
                  <span className="text-foreground-muted">Donor Name:</span>
                  <span className="font-semibold text-foreground">{donation.donor_name}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-foreground-muted">Amount:</span>
                <span className="font-semibold text-foreground">
                  {formatCurrency(amount, currency, { showCode: true })}
                </span>
              </div>
              {donation.is_monthly && (
                <div className="flex justify-between">
                  <span className="text-foreground-muted">Type:</span>
                  <span className="font-semibold text-primary">Monthly Recurring</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-foreground-muted">Status:</span>
                <span className={`font-semibold capitalize ${donation.payment_status === "completed" ? "text-green-600" : "text-amber-500"}`}>
                  {donation.payment_status === "completed" ? "Confirmed" : donation.payment_status}
                </span>
              </div>
            </div>
          </div>

          {donation.payment_status === "completed" && isFetchingReceipt && !receipt && (
            <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-3">
                <Loader2 className="size-5 text-blue-600 animate-spin" />
                <p className="text-sm text-blue-800">Generating your receipt — this takes a few seconds...</p>
              </div>
            </div>
          )}

          {donation.payment_status === "completed" && receiptTimedOut && !receipt && (
            <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-lg text-left">
              <div className="flex items-start gap-3">
                <AlertCircle className="size-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-800 mb-1">Receipt is taking longer than expected</p>
                  <p className="text-sm text-amber-700 mb-2">
                    Your payment was confirmed. We&apos;re sending your receipt to{" "}
                    <span className="font-medium">{donation.donor_email}</span>.
                  </p>
                  {ensureEmailStatus === 'sending' && (
                    <div className="flex items-center gap-2 text-amber-700 text-sm">
                      <Loader2 className="size-3.5 animate-spin" />
                      Sending receipt email...
                    </div>
                  )}
                  {ensureEmailStatus === 'sent' && (
                    <p className="text-sm text-green-700 font-medium">✓ Receipt email sent. Please check your inbox.</p>
                  )}
                  {ensureEmailStatus === 'error' && (
                    <p className="text-sm text-red-700">Could not send automatically — please contact support if you don&apos;t receive your receipt within an hour.</p>
                  )}
                </div>
              </div>
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

      <div className="bg-surface border border-border rounded-2xl p-8 mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-4">What Happens Next?</h2>
        <div className="space-y-4 text-left">
          <div className="flex gap-4">
            <div className="bg-primary/10 rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0">
              <span className="text-primary font-bold">1</span>
            </div>
            <div>
              <h3 className="font-bold text-foreground mb-1">Receipt Sent</h3>
              <p className="text-foreground-muted text-sm">
                A tax-deductible receipt has been sent to your email address.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="bg-primary/10 rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0">
              <span className="text-primary font-bold">2</span>
            </div>
            <div>
              <h3 className="font-bold text-foreground mb-1">Funds Allocated</h3>
              <p className="text-foreground-muted text-sm">
                Your donation will be allocated to our programs within 48 hours.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="bg-primary/10 rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0">
              <span className="text-primary font-bold">3</span>
            </div>
            <div>
              <h3 className="font-bold text-foreground mb-1">Impact Updates</h3>
              <p className="text-foreground-muted text-sm">
                You&apos;ll receive regular updates about how your donation is creating change.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-8">
        <Heart className="size-12 text-blue-600 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-foreground mb-2">Want to Do More?</h3>
        <p className="text-foreground-muted mb-4">
          Share our mission with friends and family, or explore volunteer opportunities.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild variant="outline">
            <Link href="/get-involved">
              <ArrowRight className="mr-2 size-4" />
              Get Involved
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/stories">
              <Download className="mr-2 size-4" />
              Read Impact Stories
            </Link>
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        <Button asChild size="lg" className="w-full sm:w-auto">
          <Link href="/">Return to Homepage</Link>
        </Button>
      </div>

      <p className="text-sm text-foreground-muted mt-8">
        Questions about your donation?{" "}
        <Link href="/contact" className="text-primary hover:underline font-medium">
          Contact our team
        </Link>
      </p>
    </div>
  )
}
