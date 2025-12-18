"use server"

import { createClient } from "@/lib/supabase/server"
import { getPaymentMode, getPaymentSettings, getSupportedProviders, type PaymentProvider } from "@/lib/payments/config"
import { startStripeCheckout } from "@/lib/payments/stripe"
import { startKhaltiPayment } from "@/lib/payments/khalti"
import { startEsewaPayment } from "@/lib/payments/esewa"

export type DonationFormData = {
  amount: number
  donorName: string
  donorEmail: string
  donorPhone?: string
  isMonthly: boolean
}

export type StartDonationInput = DonationFormData & {
  provider: PaymentProvider
}

export type StartDonationResult = {
  ok: boolean
  message: string
  redirectUrl?: string
  donationId?: string
}

export async function startDonation(input: StartDonationInput): Promise<StartDonationResult> {
  try {
    if (!input.amount || input.amount <= 0) {
      return { ok: false, message: "Invalid donation amount" }
    }
    if (!input.donorEmail || !input.donorName) {
      return { ok: false, message: "Donor name and email are required" }
    }

    const settings = await getPaymentSettings()
    const availableProviders = getSupportedProviders(settings)

    if (!availableProviders.includes(input.provider)) {
      return { ok: false, message: "Selected payment method is currently unavailable" }
    }

    const mode = getPaymentMode()

    // Determine currency: Stripe uses USD by default, local gateways use NPR
    const currency = input.provider === "stripe" ? settings.defaultCurrency || "USD" : ("NPR" as const)

    const supabase = await createClient()

    const { data: donation, error } = await supabase
      .from("donations")
      .insert({
        amount: input.amount,
        currency,
        donor_name: input.donorName,
        donor_email: input.donorEmail,
        donor_phone: input.donorPhone || null,
        is_monthly: input.isMonthly,
        payment_status: "pending",
      })
      .select()
      .single()

    if (error || !donation) {
      console.error("Donation creation error:", error)
      return { ok: false, message: "Failed to start your donation. Please try again." }
    }

    let redirectUrl: string | undefined
    let transactionId: string | undefined

    if (input.provider === "stripe") {
      const result = await startStripeCheckout(
        {
          id: donation.id,
          amount: Number(donation.amount),
          currency,
          donorName: input.donorName,
          donorEmail: input.donorEmail,
          isMonthly: input.isMonthly,
        },
        mode,
      )
      redirectUrl = result.redirectUrl
      transactionId = result.sessionId
    } else if (input.provider === "khalti") {
      const result = await startKhaltiPayment(
        {
          id: donation.id,
          amount: Number(donation.amount),
          currency,
          donorName: input.donorName,
          donorEmail: input.donorEmail,
        },
        mode,
      )
      redirectUrl = result.redirectUrl
      transactionId = result.pidx
    } else if (input.provider === "esewa") {
      const result = await startEsewaPayment(
        {
          id: donation.id,
          amount: Number(donation.amount),
          currency,
        },
        mode,
      )
      redirectUrl = result.redirectUrl
      transactionId = result.referenceId
    }

    if (!redirectUrl) {
      console.error("No redirect URL generated for donation", donation.id)
      return { ok: false, message: "Payment could not be initiated. Please try another method." }
    }

    // Persist provider transaction reference for webhook/callback reconciliation.
    // We prefix with the provider so admins can easily see which gateway was used.
    const { error: updateError } = await supabase
      .from("donations")
      .update({
        payment_id: transactionId ? `${input.provider}:${transactionId}` : null,
      })
      .eq("id", donation.id)

    if (updateError) {
      console.error("Failed to update donation with transaction id", updateError)
    }

    return {
      ok: true,
      message: "Redirecting you to the secure payment page...",
      redirectUrl,
      donationId: donation.id,
    }
  } catch (err) {
    console.error("startDonation error:", err)
    return {
      ok: false,
      message: "An unexpected error occurred while starting your donation. Please try again.",
    }
  }
}

/**
 * Backwards-compatible wrapper. This no longer marks donations as successful
 * and instead always goes through the secure payment initiation flow.
 */
export async function submitDonation(data: DonationFormData) {
  return startDonation({
    ...data,
    provider: "stripe",
  })
}

