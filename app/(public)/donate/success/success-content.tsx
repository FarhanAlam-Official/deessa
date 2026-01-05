"use client"

import Link from "next/link"
import { CheckCircle, Heart, Download, ArrowRight, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { formatCurrency } from "@/lib/utils/currency"

interface VerificationResult {
  success: boolean
  session?: {
    id: string
    payment_status?: string
    amount_total?: number
    currency?: string
  }
  donation?: {
    id: string
    amount: number
    currency: string
    donor_name: string
    donor_email: string
    is_monthly: boolean
    payment_status: string
  } | null
  error?: string
}

export function SuccessContent() {
  const searchParams = useSearchParams()
  const [verification, setVerification] = useState<VerificationResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [provider, setProvider] = useState<"stripe" | "khalti" | "esewa">("stripe")

  useEffect(() => {
    const providerParam = searchParams.get("provider") as "stripe" | "khalti" | "esewa" | null
    const sessionId = searchParams.get("session_id")
    const pidx = searchParams.get("pidx")
    const refId = searchParams.get("refId")
    const isMock = searchParams.get("mock") === "1"

    // Determine provider
    if (providerParam && ["stripe", "khalti", "esewa"].includes(providerParam)) {
      setProvider(providerParam)
    } else if (pidx) {
      setProvider("khalti")
    } else if (refId) {
      setProvider("esewa")
    } else if (sessionId) {
      setProvider("stripe")
    }

    // For Khalti and eSewa, if we have the identifiers, we can show success
    // (verification was already done in the return/callback handlers)
    if (providerParam === "khalti" && pidx) {
      // Khalti verification was done in return page, just show success
      setVerification({
        success: true,
        donation: null, // We'll fetch it if needed
      })
      setIsLoading(false)
      return
    }

    if (providerParam === "esewa" && refId) {
      // eSewa verification was done in callback, just show success
      setVerification({
        success: true,
        donation: null, // We'll fetch it if needed
      })
      setIsLoading(false)
      return
    }

    // For Stripe, verify session
    if (providerParam === "stripe" || sessionId) {
      if (!sessionId) {
        setVerification({
          success: false,
          error: "No session ID provided",
        })
        setIsLoading(false)
        return
      }

      // Verify session with API and poll for webhook updates
      const verifySession = async () => {
        try {
          const response = await fetch(`/api/payments/stripe/verify?session_id=${sessionId}`)
          const data = await response.json()

          if (response.ok && data.success) {
            // If donation status is pending, poll for webhook updates
            if (data.donation?.payment_status === "pending") {
              // Poll every 2 seconds for up to 30 seconds (15 attempts)
              let attempts = 0
              const maxAttempts = 15
              const pollInterval = 2000

              const pollForUpdate = setInterval(async () => {
                attempts++
                try {
                  const pollResponse = await fetch(`/api/payments/stripe/verify?session_id=${sessionId}`)
                  const pollData = await pollResponse.json()

                  if (pollResponse.ok && pollData.success && pollData.donation) {
                    // If status is no longer pending, update and stop polling
                    if (pollData.donation.payment_status !== "pending") {
                      clearInterval(pollForUpdate)
                      setVerification({
                        success: true,
                        session: pollData.session,
                        donation: pollData.donation,
                      })
                      setIsLoading(false)
                    } else if (attempts >= maxAttempts) {
                      // Timeout: stop polling and show current status
                      clearInterval(pollForUpdate)
                      setVerification({
                        success: true,
                        session: pollData.session,
                        donation: pollData.donation,
                      })
                      setIsLoading(false)
                    }
                  }
                } catch (pollError) {
                  console.error("Error polling for status update:", pollError)
                  if (attempts >= maxAttempts) {
                    clearInterval(pollForUpdate)
                    setIsLoading(false)
                  }
                }
              }, pollInterval)

              // Set initial verification while polling
              setVerification({
                success: true,
                session: data.session,
                donation: data.donation,
              })
              setIsLoading(false)
            } else {
              // Status is already completed/failed, no need to poll
              setVerification({
                success: true,
                session: data.session,
                donation: data.donation,
              })
              setIsLoading(false)
            }
          } else {
            setVerification({
              success: false,
              error: data.error || "Verification failed",
            })
            setIsLoading(false)
          }
        } catch (error) {
          console.error("Error verifying session:", error)
          setVerification({
            success: false,
            error: "Failed to verify payment session",
          })
          setIsLoading(false)
        }
      }

      verifySession()
      return
    }

    // If no provider-specific params, show success (might be direct navigation)
    setVerification({
      success: true,
    })
    setIsLoading(false)
  }, [searchParams])

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
          <Button asChild size="lg">
            <Link href="/donate">Try Again</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/contact">Contact Support</Link>
          </Button>
        </div>
      </div>
    )
  }

  const donation = verification.donation
  const amount = donation?.amount || (verification.session?.amount_total ? verification.session.amount_total / 100 : 0)
  const currency = donation?.currency || verification.session?.currency?.toUpperCase() || "USD"

  return (
    <div className="max-w-3xl mx-auto text-center">
      <div className="bg-green-50 border-4 border-green-500 rounded-full w-24 h-24 mx-auto flex items-center justify-center mb-6">
        <CheckCircle className="size-16 text-green-600" />
      </div>

      <h1 className="text-4xl md:text-5xl font-black text-foreground mb-4">
        Thank You for Your Generosity!
      </h1>

      <p className="text-xl text-foreground-muted mb-8 leading-relaxed">
        Your donation has been successfully processed via {provider === "stripe" ? "Stripe" : provider === "khalti" ? "Khalti" : "eSewa"}. You&apos;re making a real difference in the lives of
        communities across Nepal.
      </p>

      {donation && (
        <div className="bg-surface border border-border rounded-2xl p-6 mb-8 text-left">
          <h2 className="text-xl font-bold text-foreground mb-4 text-center">Donation Details</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-foreground-muted">Donor Name:</span>
              <span className="font-semibold text-foreground">{donation.donor_name}</span>
            </div>
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
              <span className="font-semibold text-green-600 capitalize">{donation.payment_status}</span>
            </div>
          </div>
        </div>
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
                A tax-deductible receipt has been sent to your email address within 24 hours.
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

