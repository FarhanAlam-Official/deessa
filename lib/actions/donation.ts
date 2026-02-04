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
  formData?: Record<string, string> // For eSewa v2 form POST
  requiresFormSubmit?: boolean // Indicates if form POST is needed
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

    // If the selected provider is not available, try to use the primary provider or first available
    if (!availableProviders.includes(input.provider)) {
      if (availableProviders.length === 0) {
        return { ok: false, message: "No payment methods are currently available. Please contact support." }
      }
      // Use the first available provider as fallback
      const fallbackProvider = availableProviders[0]
      console.warn(`Provider ${input.provider} not available, using ${fallbackProvider} instead`)
      input.provider = fallbackProvider
    }

    const mode = getPaymentMode()

    // Determine currency: Stripe uses USD by default, local gateways use NPR
    const currency = input.provider === "stripe" ? settings.defaultCurrency || "USD" : ("NPR" as const)

    const supabase = await createClient()

    // Ensure amount has exactly 2 decimal places to prevent floating-point precision issues
    const preciseAmount = Number(input.amount.toFixed(2))

    const { data: donation, error } = await supabase
      .from("donations")
      .insert({
        amount: preciseAmount,
        currency,
        donor_name: input.donorName,
        donor_email: input.donorEmail,
        donor_phone: input.donorPhone || null,
        is_monthly: input.isMonthly,
        payment_status: "pending",
        provider: input.provider,
      })
      .select()
      .single()

    if (error || !donation) {
      console.error("Donation creation error:", error)
      return { ok: false, message: "Failed to start your donation. Please try again." }
    }

    let redirectUrl: string | undefined
    let transactionId: string | undefined
    let providerRef: string | undefined
    let providerUpdate: Record<string, unknown> = {}

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
      providerRef = result.sessionId
      providerUpdate = {
        provider_ref: result.sessionId,
        stripe_session_id: result.sessionId,
      }
    } else if (input.provider === "khalti") {
      const result = await startKhaltiPayment(
        {
          id: donation.id,
          amount: Number(donation.amount),
          currency,
          donorName: input.donorName,
          donorEmail: input.donorEmail,
          donorPhone: input.donorPhone,
        },
        mode,
      )
      redirectUrl = result.redirectUrl
      transactionId = result.pidx
      providerRef = result.pidx
      providerUpdate = {
        provider_ref: result.pidx,
        khalti_pidx: result.pidx,
      }
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
      providerRef = result.transactionUuid
      providerUpdate = {
        provider_ref: result.transactionUuid,
        esewa_transaction_uuid: result.transactionUuid,
      }
      
      // Persist provider references before returning (eSewa returns early)
      const paymentId = transactionId ? `${input.provider}:${transactionId}` : null
      await supabase
        .from("donations")
        .update({
          payment_id: paymentId,
          ...providerUpdate,
        })
        .eq("id", donation.id)

      // eSewa v2 requires form POST
      return {
        ok: true,
        message: "Redirecting you to the secure payment page...",
        redirectUrl: result.redirectUrl,
        formData: result.formData,
        requiresFormSubmit: Object.keys(result.formData).length > 0,
        donationId: donation.id,
      }
    }

    if (!redirectUrl) {
      console.error("No redirect URL generated for donation", donation.id)
      return { ok: false, message: "Payment could not be initiated. Please try another method." }
    }

    // Persist provider transaction reference for webhook/callback reconciliation.
    // We prefix with the provider so admins can easily see which gateway was used.
    const paymentId = transactionId ? `${input.provider}:${transactionId}` : null
    
    const { error: updateError } = await supabase
      .from("donations")
      .update({
        payment_id: paymentId,
        provider_ref: providerRef ?? null,
        ...providerUpdate,
      })
      .eq("id", donation.id)

    if (updateError) {
      console.error("Failed to update donation payment_id:", updateError.message)
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

