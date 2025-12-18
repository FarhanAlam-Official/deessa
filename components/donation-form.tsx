"use client"

import type React from "react"

import { useState } from "react"
import { Heart, Repeat, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { startTransition } from "react"
import type { PaymentProvider } from "@/lib/payments/config"
import { startDonation } from "@/lib/actions/donation"

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
  const [error, setError] = useState<string | null>(null)
  const [provider, setProvider] = useState<PaymentProvider>(primaryProvider)

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
    setError(null)
  }

  const finalAmount = customAmount ? Number.parseFloat(customAmount) : selectedAmount

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!finalAmount || finalAmount <= 0) {
      setError("Please select or enter a donation amount.")
      return
    }

    if (!donorInfo.firstName || !donorInfo.lastName || !donorInfo.email) {
      setError("Please fill in all required fields.")
      return
    }

    setError(null)
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
        const result = await startDonation(payload)

        if (result.ok && result.redirectUrl) {
          window.location.href = result.redirectUrl
          return
        }

        setError(result.message || "Unable to start payment. Please try again.")
      } catch (err) {
        console.error("Donation submit error:", err)
        setError("An unexpected error occurred. Please try again.")
      } finally {
        setIsLoading(false)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="bg-background rounded-3xl border border-border overflow-hidden shadow-xl">
      <div className="p-8 md:p-10">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm mb-6">{error}</div>
        )}

        {/* Frequency Toggle */}
        <div className="flex justify-center mb-8">
          <div className="bg-muted p-1 rounded-full inline-flex">
            <button
              type="button"
              onClick={() => setIsMonthly(false)}
              className={cn(
                "px-6 py-2.5 rounded-full text-sm font-bold transition-all",
                !isMonthly ? "bg-primary text-white shadow-lg" : "text-foreground-muted hover:text-foreground",
              )}
            >
              One-Time
            </button>
            <button
              type="button"
              onClick={() => setIsMonthly(true)}
              className={cn(
                "px-6 py-2.5 rounded-full text-sm font-bold transition-all flex items-center gap-2",
                isMonthly ? "bg-primary text-white shadow-lg" : "text-foreground-muted hover:text-foreground",
              )}
            >
              <Repeat className="size-4" />
              Monthly
            </button>
          </div>
        </div>

        {/* Payment Method */}
        <div className="mb-6">
          <label className="block text-sm font-bold text-foreground mb-3 text-center">Payment Method</label>
          <div className="flex flex-wrap justify-center gap-3">
            {enabledProviders.includes("stripe") && (
              <button
                type="button"
                onClick={() => setProvider("stripe")}
                className={cn(
                  "px-4 py-2 rounded-full border text-sm font-semibold transition-all",
                  provider === "stripe"
                    ? "bg-primary text-white border-primary shadow-sm"
                    : "bg-surface text-foreground border-border hover:border-primary/50",
                )}
              >
                Stripe (Card, USD)
              </button>
            )}
            {enabledProviders.includes("khalti") && (
              <button
                type="button"
                onClick={() => setProvider("khalti")}
                className={cn(
                  "px-4 py-2 rounded-full border text-sm font-semibold transition-all",
                  provider === "khalti"
                    ? "bg-primary text-white border-primary shadow-sm"
                    : "bg-surface text-foreground border-border hover:border-primary/50",
                )}
              >
                Khalti (NPR)
              </button>
            )}
            {enabledProviders.includes("esewa") && (
              <button
                type="button"
                onClick={() => setProvider("esewa")}
                className={cn(
                  "px-4 py-2 rounded-full border text-sm font-semibold transition-all",
                  provider === "esewa"
                    ? "bg-primary text-white border-primary shadow-sm"
                    : "bg-surface text-foreground border-border hover:border-primary/50",
                )}
              >
                eSewa (NPR)
              </button>
            )}
          </div>
          <p className="mt-2 text-center text-xs text-foreground-muted">
            Currency:{" "}
            <span className="font-semibold">
              {provider === "stripe" ? defaultCurrency || "USD" : "NPR"}
            </span>
          </p>
        </div>

        {/* Amount Selection */}
        <div className="mb-8">
          <label className="block text-sm font-bold text-foreground mb-4 text-center">Select Amount</label>
          <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
            {presetAmounts.map((amount) => (
              <button
                type="button"
                key={amount}
                onClick={() => handleAmountSelect(amount)}
                className={cn(
                  "py-4 rounded-xl font-bold text-lg transition-all border-2",
                  selectedAmount === amount
                    ? "bg-primary text-white border-primary shadow-lg shadow-primary/25"
                    : "bg-surface text-foreground border-border hover:border-primary/50",
                )}
              >
                ${amount}
              </button>
            ))}
            <div className="relative col-span-3 md:col-span-5 mt-2">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground-muted font-bold">
                {provider === "stripe" ? "$" : "₨"}
              </span>
              <input
                type="number"
                placeholder="Custom amount"
                value={customAmount}
                onChange={handleCustomAmountChange}
                min="1"
                className="w-full h-14 pl-8 pr-4 rounded-xl border-2 border-border bg-surface text-foreground font-bold text-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
        </div>

        {/* Impact Preview */}
        {finalAmount && finalAmount > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-8 text-center">
            <p className="text-green-800 font-medium">
              {isMonthly ? (
                <>
                  Your monthly gift of{" "}
                  <strong>
                    {provider === "stripe" ? "$" : "₨"}
                    {finalAmount}
                  </strong>{" "}
                  will provide sustained support for our programs.
                </>
              ) : (
                <>
                  Your gift of{" "}
                  <strong>
                    {provider === "stripe" ? "$" : "₨"}
                    {finalAmount}
                  </strong>{" "}
                  will make a real difference!
                </>
              )}
            </p>
          </div>
        )}

        {/* Donor Info */}
        <div className="space-y-4 mb-8">
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              name="firstName"
              placeholder="First Name *"
              required
              value={donorInfo.firstName}
              onChange={handleDonorInfoChange}
              className="h-12 px-4 rounded-xl border border-border bg-surface text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <input
              type="text"
              name="lastName"
              placeholder="Last Name *"
              required
              value={donorInfo.lastName}
              onChange={handleDonorInfoChange}
              className="h-12 px-4 rounded-xl border border-border bg-surface text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <input
            type="email"
            name="email"
            placeholder="Email Address *"
            required
            value={donorInfo.email}
            onChange={handleDonorInfoChange}
            className="w-full h-12 px-4 rounded-xl border border-border bg-surface text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <input
            type="tel"
            name="phone"
            placeholder="Phone Number (Optional)"
            value={donorInfo.phone}
            onChange={handleDonorInfoChange}
            className="w-full h-12 px-4 rounded-xl border border-border bg-surface text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          size="lg"
          className="w-full h-14 rounded-full text-lg font-bold shadow-xl shadow-primary/25"
          disabled={!finalAmount || finalAmount <= 0 || isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 size-5 animate-spin" />
              Redirecting to secure payment...
            </>
          ) : (
            <>
              <Heart className="mr-2 size-5 fill-current" />
              {isMonthly
                ? `Donate ${provider === "stripe" ? "$" : "₨"}${finalAmount || 0}/month`
                : `Donate ${provider === "stripe" ? "$" : "₨"}${finalAmount || 0}`}
            </>
          )}
        </Button>

        <p className="text-xs text-center text-foreground-muted mt-4">
          By donating, you agree to our terms and privacy policy. Your donation is secure and encrypted.
        </p>
      </div>
    </form>
  )
}
