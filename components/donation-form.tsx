"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Heart, Repeat, Loader2, CreditCard, Lock, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { startTransition } from "react"
import type { PaymentProvider } from "@/lib/payments/config"
import { startDonation } from "@/lib/actions/donation"
import { notifications } from "@/lib/notifications"

interface DonationTier {
  amount: number
  impact: string
  icon: string
}

interface DonationFormProps {
  tiers: DonationTier[]
  enabledProviders?: PaymentProvider[]
  primaryProvider?: PaymentProvider
  defaultCurrency?: "USD" | "NPR"
}

export function DonationForm({
  tiers,
  enabledProviders = ["stripe", "khalti", "esewa"],
  primaryProvider = "stripe",
  defaultCurrency = "USD",
}: DonationFormProps) {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(50)
  const [customAmount, setCustomAmount] = useState("")
  const [isMonthly, setIsMonthly] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [provider, setProvider] = useState<PaymentProvider>(() => {
    // Ensure the initial provider is in the enabled list
    return enabledProviders.includes(primaryProvider) ? primaryProvider : enabledProviders[0] || "stripe"
  })

  // Update provider if enabledProviders change
  useEffect(() => {
    if (!enabledProviders.includes(provider)) {
      setProvider(enabledProviders[0] || "stripe")
    }
  }, [enabledProviders, provider])

  const [donorInfo, setDonorInfo] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  })

  const presetAmounts = [25, 50, 100, 250, 500]

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount)
    setCustomAmount("")
  }

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomAmount(e.target.value)
    setSelectedAmount(null)
  }

  const handleDonorInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDonorInfo((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleProviderChange = (newProvider: PaymentProvider) => {
    if (enabledProviders.includes(newProvider)) {
      setProvider(newProvider)
    } else {
      notifications.showError({
        title: "Payment Method Unavailable",
        description: "This payment method is not currently available. Please select another option.",
      })
    }
  }

  // Parse and round to 2 decimal places to avoid floating-point precision issues
  const finalAmount = customAmount 
    ? Math.round(Number.parseFloat(customAmount) * 100) / 100
    : selectedAmount

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!finalAmount || finalAmount <= 0) {
      notifications.showError({
        title: "Invalid Amount",
        description: "Please select or enter a donation amount.",
      })
      return
    }

    if (!donorInfo.firstName || !donorInfo.lastName || !donorInfo.email) {
      notifications.showError({
        title: "Missing Information",
        description: "Please fill in all required fields.",
      })
      return
    }

    // Ensure provider is available
    if (!enabledProviders.includes(provider)) {
      notifications.showError({
        title: "Payment Method Unavailable",
        description: "The selected payment method is not available. Please choose another option.",
      })
      return
    }

    setIsLoading(true)

    const payload = {
      amount: finalAmount,
      donorName: `${donorInfo.firstName} ${donorInfo.lastName}`.trim(),
      donorEmail: donorInfo.email,
      donorPhone: donorInfo.phone || undefined,
      isMonthly,
      provider,
    } as const

    // Use a transition to avoid blocking UI updates
    startTransition(async () => {
      try {
        notifications.showInfo({
          title: "Processing",
          description: "Redirecting you to the secure payment page...",
          duration: 2000,
        })

        const result = await startDonation(payload)

        if (result.ok && result.redirectUrl) {
          // Check if form POST is required (for eSewa v2)
          if (result.requiresFormSubmit && result.formData) {
            // Create and submit a form for eSewa v2
            const form = document.createElement("form")
            form.method = "POST"
            form.action = result.redirectUrl
            
            // Add form fields
            Object.entries(result.formData).forEach(([key, value]) => {
              const input = document.createElement("input")
              input.type = "hidden"
              input.name = key
              input.value = value
              form.appendChild(input)
            })
            
            document.body.appendChild(form)
            form.submit()
            return
          }
          
          // Simple redirect for other providers
          setTimeout(() => {
            window.location.href = result.redirectUrl!
          }, 500)
          return
        }

        notifications.showError({
          title: "Payment Error",
          description: result.message || "Unable to start payment. Please try again.",
        })
      } catch (err) {
        console.error("Donation submit error:", err)
        notifications.showError({
          title: "Unexpected Error",
          description: "An unexpected error occurred. Please try again.",
        })
      } finally {
        setIsLoading(false)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="bg-gradient-to-br from-background via-background to-surface rounded-3xl border border-border/50 overflow-hidden shadow-2xl backdrop-blur-sm">
      <div className="p-8 md:p-12">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Heart className="size-8 text-primary fill-primary" />
          </div>
          <h2 className="text-3xl font-black text-foreground mb-2">Make a Difference</h2>
          <p className="text-foreground-muted">Your support transforms lives</p>
        </div>

        {/* Frequency Toggle */}
        <div className="flex justify-center mb-8">
          <div className="bg-muted/50 p-1.5 rounded-full inline-flex gap-1 shadow-inner">
            <button
              type="button"
              onClick={() => setIsMonthly(false)}
              className={cn(
                "px-6 py-3 rounded-full text-sm font-bold transition-all duration-200 flex items-center gap-2",
                !isMonthly 
                  ? "bg-primary text-white shadow-lg shadow-primary/30 scale-105" 
                  : "text-foreground-muted hover:text-foreground hover:bg-muted",
              )}
            >
              One-Time
            </button>
            <button
              type="button"
              onClick={() => setIsMonthly(true)}
              className={cn(
                "px-6 py-3 rounded-full text-sm font-bold transition-all duration-200 flex items-center gap-2",
                isMonthly 
                  ? "bg-primary text-white shadow-lg shadow-primary/30 scale-105" 
                  : "text-foreground-muted hover:text-foreground hover:bg-muted",
              )}
            >
              <Repeat className="size-4" />
              Monthly
            </button>
          </div>
        </div>

        {/* Payment Method */}
        <div className="mb-8">
          <label className="block text-sm font-bold text-foreground mb-4 text-center flex items-center justify-center gap-2">
            <Lock className="size-4 text-foreground-muted" />
            Secure Payment Method
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {enabledProviders.includes("stripe") && (
              <button
                type="button"
                onClick={() => handleProviderChange("stripe")}
                className={cn(
                  "px-4 py-3 rounded-xl border-2 text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2",
                  provider === "stripe"
                    ? "bg-primary text-white border-primary shadow-lg shadow-primary/30 scale-105"
                    : "bg-surface text-foreground border-border hover:border-primary/50 hover:bg-muted/50",
                )}
              >
                <CreditCard className="size-4" />
                Stripe (USD)
              </button>
            )}
            {enabledProviders.includes("khalti") && (
              <button
                type="button"
                onClick={() => handleProviderChange("khalti")}
                className={cn(
                  "px-4 py-3 rounded-xl border-2 text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2",
                  provider === "khalti"
                    ? "bg-primary text-white border-primary shadow-lg shadow-primary/30 scale-105"
                    : "bg-surface text-foreground border-border hover:border-primary/50 hover:bg-muted/50",
                )}
              >
                <CreditCard className="size-4" />
                Khalti (NPR)
              </button>
            )}
            {enabledProviders.includes("esewa") && (
              <button
                type="button"
                onClick={() => handleProviderChange("esewa")}
                className={cn(
                  "px-4 py-3 rounded-xl border-2 text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2",
                  provider === "esewa"
                    ? "bg-primary text-white border-primary shadow-lg shadow-primary/30 scale-105"
                    : "bg-surface text-foreground border-border hover:border-primary/50 hover:bg-muted/50",
                )}
              >
                <CreditCard className="size-4" />
                eSewa (NPR)
              </button>
            )}
          </div>
          {enabledProviders.length === 0 && (
            <p className="mt-4 text-center text-sm text-amber-600 font-medium">
              No payment methods are currently available. Please contact support.
            </p>
          )}
          <p className="mt-3 text-center text-xs text-foreground-muted">
            Currency:{" "}
            <span className="font-semibold text-foreground">
              {provider === "stripe" ? defaultCurrency || "USD" : "NPR"}
            </span>
          </p>
        </div>

        {/* Amount Selection */}
        <div className="mb-8">
          <label className="block text-sm font-bold text-foreground mb-4 text-center flex items-center justify-center gap-2">
            <Sparkles className="size-4 text-foreground-muted" />
            Select Amount
          </label>
          <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
            {presetAmounts.map((amount) => (
              <button
                type="button"
                key={amount}
                onClick={() => handleAmountSelect(amount)}
                className={cn(
                  "py-4 rounded-xl font-bold text-lg transition-all duration-200 border-2 relative overflow-hidden",
                  selectedAmount === amount
                    ? "bg-primary text-white border-primary shadow-lg shadow-primary/30 scale-105"
                    : "bg-surface text-foreground border-border hover:border-primary/50 hover:scale-[1.02]",
                )}
              >
                <span className="relative z-10">{provider === "stripe" ? "$" : "₨"}{amount}</span>
                {selectedAmount === amount && (
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent" />
                )}
              </button>
            ))}
            <div className="relative col-span-3 md:col-span-5 mt-3">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground-muted font-bold text-lg">
                {provider === "stripe" ? "$" : "₨"}
              </span>
              <input
                type="number"
                placeholder="Enter custom amount"
                value={customAmount}
                onChange={handleCustomAmountChange}
                min="1"
                step="0.01"
                className="w-full h-14 pl-10 pr-4 rounded-xl border-2 border-border bg-surface text-foreground font-bold text-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Impact Preview */}
        {finalAmount && finalAmount > 0 && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-5 mb-8 text-center shadow-sm">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Heart className="size-5 text-green-600 fill-green-600" />
              <p className="text-green-800 font-bold text-base">
                {isMonthly ? (
                  <>
                    Your monthly gift of{" "}
                    <span className="text-green-900 text-lg">
                      {provider === "stripe" ? "$" : "₨"}
                      {finalAmount.toFixed(2)}
                    </span>{" "}
                    will provide sustained support for our programs.
                  </>
                ) : (
                  <>
                    Your gift of{" "}
                    <span className="text-green-900 text-lg">
                      {provider === "stripe" ? "$" : "₨"}
                      {finalAmount.toFixed(2)}
                    </span>{" "}
                    will make a real difference!
                  </>
                )}
              </p>
            </div>
          </div>
        )}

        {/* Donor Info */}
        <div className="space-y-4 mb-8">
          <h3 className="text-lg font-bold text-foreground mb-4 text-center">Your Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-foreground-muted mb-2">First Name</label>
              <input
                type="text"
                name="firstName"
                placeholder="John"
                required
                value={donorInfo.firstName}
                onChange={handleDonorInfoChange}
                className="w-full h-12 px-4 rounded-xl border-2 border-border bg-surface text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground-muted mb-2">Last Name</label>
              <input
                type="text"
                name="lastName"
                placeholder="Doe"
                required
                value={donorInfo.lastName}
                onChange={handleDonorInfoChange}
                className="w-full h-12 px-4 rounded-xl border-2 border-border bg-surface text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-foreground-muted mb-2">Email Address</label>
            <input
              type="email"
              name="email"
              placeholder="john.doe@example.com"
              required
              value={donorInfo.email}
              onChange={handleDonorInfoChange}
              className="w-full h-12 px-4 rounded-xl border-2 border-border bg-surface text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-foreground-muted mb-2">Phone Number <span className="text-foreground-muted/70">(Optional)</span></label>
            <input
              type="tel"
              name="phone"
              placeholder="+1 (555) 123-4567"
              value={donorInfo.phone}
              onChange={handleDonorInfoChange}
              className="w-full h-12 px-4 rounded-xl border-2 border-border bg-surface text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          size="lg"
          className="w-full h-14 rounded-full text-lg font-bold shadow-xl shadow-primary/30 hover:shadow-2xl hover:shadow-primary/40 transition-all duration-200 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
          disabled={!finalAmount || finalAmount <= 0 || isLoading || enabledProviders.length === 0}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 size-5 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Heart className="mr-2 size-5 fill-current" />
              {isMonthly
                ? `Donate ${provider === "stripe" ? "$" : "₨"}${finalAmount?.toFixed(2) || 0}/month`
                : `Donate ${provider === "stripe" ? "$" : "₨"}${finalAmount?.toFixed(2) || 0} Now`}
            </>
          )}
        </Button>

        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-foreground-muted">
          <Lock className="size-3" />
          <p className="text-center">
            Your donation is secure and encrypted. By donating, you agree to our{" "}
            <a href="/terms" className="text-primary hover:underline font-medium">terms</a> and{" "}
            <a href="/privacy" className="text-primary hover:underline font-medium">privacy policy</a>.
          </p>
        </div>
      </div>
    </form>
  )
}
