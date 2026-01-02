"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Section } from "@/components/ui/section"

interface VerificationResult {
  ok: boolean
  status?: "completed" | "failed" | "pending"
  khaltiStatus?: string
  error?: string
  message?: string
}

export default function KhaltiReturnPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [verification, setVerification] = useState<VerificationResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const pidx = searchParams.get("pidx")
    const status = searchParams.get("status")
    const purchaseOrderId = searchParams.get("purchase_order_id")
    const isMock = searchParams.get("mock") === "1"

    if (!pidx) {
      setVerification({
        ok: false,
        error: "Missing payment identifier (pidx)",
      })
      setIsLoading(false)
      return
    }

    // If it's a mock payment, handle it directly
    if (isMock) {
      setVerification({
        ok: true,
        status: "completed",
        message: "Mock payment successful",
      })
      setIsLoading(false)
      // Redirect to success page after a short delay
      setTimeout(() => {
        router.push("/donate/success?provider=khalti&mock=1")
      }, 2000)
      return
    }

    // Verify payment with backend
    const verifyPayment = async () => {
      try {
        const response = await fetch("/api/payments/khalti/verify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ 
            pidx,
            purchase_order_id: purchaseOrderId, // Send purchase_order_id from URL
          }),
        })

        // Parse response - handle potential parsing errors
        let data
        try {
          const text = await response.text()
          data = text ? JSON.parse(text) : {}
        } catch (parseError) {
          console.error("Failed to parse Khalti response:", parseError)
          data = {}
        }

        if (response.ok && data.ok) {
          setVerification({
            ok: true,
            status: data.status,
            khaltiStatus: data.khaltiStatus,
            message: data.message,
          })

          // Redirect based on status
          if (data.status === "completed") {
            setTimeout(() => {
              router.push("/donate/success?provider=khalti&pidx=" + encodeURIComponent(pidx))
            }, 2000)
          } else if (data.status === "failed") {
            setTimeout(() => {
              router.push("/donate/cancel?provider=khalti&reason=" + encodeURIComponent(data.khaltiStatus || "failed"))
            }, 2000)
          }
          // If pending, stay on this page and show message
        } else {
          console.error("Khalti verification failed:", response.status, data?.error || data?.message)

          setVerification({
            ok: false,
            error: data.error || data.message || `Verification failed (HTTP ${response.status})`,
          })
        }
      } catch (error) {
        console.error("Error verifying payment:", error)
        setVerification({
          ok: false,
          error: "Failed to verify payment. Please contact support if your payment was successful.",
        })
      } finally {
        setIsLoading(false)
      }
    }

    verifyPayment()
  }, [searchParams, router])

  if (isLoading) {
    return (
      <Section className="py-16 md:py-24">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-blue-50 border-4 border-blue-500 rounded-full w-24 h-24 mx-auto flex items-center justify-center mb-6">
            <Loader2 className="size-16 text-blue-600 animate-spin" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-foreground mb-4">
            Verifying Your Payment...
          </h1>
          <p className="text-xl text-foreground-muted mb-8 leading-relaxed">
            Please wait while we confirm your payment with Khalti.
          </p>
        </div>
      </Section>
    )
  }

  if (!verification?.ok) {
    return (
      <Section className="py-16 md:py-24">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-orange-50 border-4 border-orange-500 rounded-full w-24 h-24 mx-auto flex items-center justify-center mb-6">
            <AlertCircle className="size-16 text-orange-600" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-foreground mb-4">
            Payment Verification Failed
          </h1>
          <p className="text-xl text-foreground-muted mb-8 leading-relaxed">
            {verification?.error || "We couldn't verify your payment. Please contact support if you have any questions."}
          </p>
          <div className="space-y-3">
            <Button asChild size="lg">
              <Link href="/contact">Contact Support</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/donate">Try Again</Link>
            </Button>
          </div>
        </div>
      </Section>
    )
  }

  // Handle pending status
  if (verification.status === "pending") {
    return (
      <Section className="py-16 md:py-24">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-yellow-50 border-4 border-yellow-500 rounded-full w-24 h-24 mx-auto flex items-center justify-center mb-6">
            <Loader2 className="size-16 text-yellow-600 animate-spin" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-foreground mb-4">
            Payment Pending
          </h1>
          <p className="text-xl text-foreground-muted mb-8 leading-relaxed">
            Your payment is being processed. This may take a few minutes. You will receive a confirmation email once the payment is completed.
          </p>
          <div className="bg-surface border border-border rounded-2xl p-6 mb-8">
            <p className="text-foreground-muted mb-4">
              Khalti Status: <span className="font-semibold text-foreground">{verification.khaltiStatus}</span>
            </p>
            <p className="text-sm text-foreground-muted">
              If your payment status doesn't update within 24 hours, please contact our support team.
            </p>
          </div>
          <div className="space-y-3">
            <Button asChild size="lg">
              <Link href="/">Return to Homepage</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/contact">Contact Support</Link>
            </Button>
          </div>
        </div>
      </Section>
    )
  }

  // Success or failed - will redirect, but show message briefly
  if (verification.status === "completed") {
    return (
      <Section className="py-16 md:py-24">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-green-50 border-4 border-green-500 rounded-full w-24 h-24 mx-auto flex items-center justify-center mb-6">
            <CheckCircle className="size-16 text-green-600" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-foreground mb-4">
            Payment Successful!
          </h1>
          <p className="text-xl text-foreground-muted mb-8 leading-relaxed">
            Redirecting you to the confirmation page...
          </p>
        </div>
      </Section>
    )
  }

  // Failed
  return (
    <Section className="py-16 md:py-24">
      <div className="max-w-2xl mx-auto text-center">
        <div className="bg-red-50 border-4 border-red-500 rounded-full w-24 h-24 mx-auto flex items-center justify-center mb-6">
          <XCircle className="size-16 text-red-600" />
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-foreground mb-4">
          Payment Failed
        </h1>
        <p className="text-xl text-foreground-muted mb-8 leading-relaxed">
          {verification.khaltiStatus === "User canceled"
            ? "Your payment was canceled. No charges were made."
            : "Your payment could not be processed. Please try again or use a different payment method."}
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
    </Section>
  )
}

