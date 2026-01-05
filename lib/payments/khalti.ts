"use server"

import type { PaymentMode } from "./config"
import { validateAmount, validateEmail, validateName, fetchWithTimeout, logPaymentEvent } from "./security"
import { KhaltiError } from "./errors"

export interface KhaltiInitResult {
  redirectUrl: string
  pidx: string
}

export interface KhaltiDonationContext {
  id: string
  amount: number
  currency: string
  donorName: string
  donorEmail: string
  donorPhone?: string
}

/**
 * Initiate a Khalti payment.
 *
 * NOTE: In mock mode this does not perform any network calls and simply
 * returns a simulated but structurally-aligned response.
 */
export async function startKhaltiPayment(
  donation: KhaltiDonationContext,
  mode: PaymentMode,
): Promise<KhaltiInitResult> {
  // Validate inputs
  const amountValidation = validateAmount(donation.amount, "NPR")
  if (!amountValidation.valid) {
    throw new KhaltiError(amountValidation.error || "Invalid amount")
  }

  const emailValidation = validateEmail(donation.donorEmail)
  if (!emailValidation.valid) {
    throw new KhaltiError(emailValidation.error || "Invalid email")
  }

  const nameValidation = validateName(donation.donorName)
  if (!nameValidation.valid) {
    throw new KhaltiError(nameValidation.error || "Invalid name")
  }

  const baseUrl = process.env.KHALTI_BASE_URL || "https://khalti.com/api/v2"
  const returnUrl =
    process.env.KHALTI_RETURN_URL ||
    `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/payments/khalti/return`

  if (mode === "mock") {
    const mockPidx = `khalti_mock_${donation.id}`
    const mockUrl = `${returnUrl}?pidx=${mockPidx}&mock=1`

    logPaymentEvent("Khalti payment initiated (mock)", {
      donationId: donation.id,
      amount: donation.amount,
      pidx: mockPidx,
    })

    return {
      redirectUrl: mockUrl,
      pidx: mockPidx,
    }
  }

  const secretKey = process.env.KHALTI_SECRET_KEY
  if (!secretKey) {
    throw new KhaltiError("KHALTI_SECRET_KEY is not configured")
  }

  // Validate secret key format (should not be empty or just whitespace)
  const trimmedKey = secretKey.trim()
  if (!trimmedKey || trimmedKey.length < 10) {
    throw new KhaltiError("KHALTI_SECRET_KEY appears to be invalid (too short or empty)")
  }

  // Check if using sandbox key with production URL (common mistake)
  const isSandboxKey = trimmedKey.includes("test") || baseUrl.includes("dev.khalti.com")
  const isProductionUrl = baseUrl.includes("khalti.com/api/v2") && !baseUrl.includes("dev")
  
  if (isSandboxKey && isProductionUrl) {
    logPaymentEvent("Khalti configuration warning", {
      warning: "Sandbox key detected with production URL. Use https://dev.khalti.com/api/v2 for sandbox testing.",
    }, "warn")
  }

  // Khalti expects amount in paisa (minor units)
  // Minimum amount is 1000 paisa (Rs. 10)
  // Use toFixed to avoid floating-point precision errors
  const amountInPaisa = Math.round(Number(donation.amount.toFixed(2)) * 100)
  if (amountInPaisa < 1000) {
    throw new KhaltiError("Amount must be at least Rs. 10 (1000 paisa)")
  }

  // Build customer info
  const customerInfo: {
    name: string
    email: string
    phone?: string
  } = {
    name: donation.donorName,
    email: donation.donorEmail,
  }

  if (donation.donorPhone) {
    customerInfo.phone = donation.donorPhone
  }

  // Build amount breakdown for transparency
  const amountBreakdown = [
    {
      label: "Donation Amount",
      amount: amountInPaisa,
    },
  ]

  // Build product details
  const productDetails = [
    {
      identity: donation.id,
      name: "Donation to Deesha Foundation",
      total_price: amountInPaisa,
      quantity: 1,
      unit_price: amountInPaisa,
    },
  ]

  // Build payload with all required and optional fields
  const payload = {
    return_url: returnUrl,
    website_url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
    amount: amountInPaisa,
    purchase_order_id: donation.id,
    purchase_order_name: donation.donorName || "Donation",
    customer_info: customerInfo,
    amount_breakdown: amountBreakdown,
    product_details: productDetails,
    merchant_extra: JSON.stringify({
      donation_id: donation.id,
      currency: donation.currency,
    }),
  }

  logPaymentEvent("Khalti payment initiation request", {
    donationId: donation.id,
    amount: donation.amount,
    amountInPaisa,
    baseUrl,
  })

  try {
    const res = await fetchWithTimeout(
      `${baseUrl}/epayment/initiate/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Key ${secretKey}`,
        },
        body: JSON.stringify(payload),
      },
      30000, // 30 second timeout
    )

    const responseText = await res.text()
    let data: { pidx?: string; payment_url?: string; error_key?: string; detail?: string; amount?: string[] }

    try {
      data = JSON.parse(responseText)
    } catch {
      throw new KhaltiError(`Invalid JSON response from Khalti: ${responseText.slice(0, 200)}`, res.status)
    }

    if (!res.ok) {
      const errorMessage = data.detail || data.amount?.[0] || `Khalti init failed with status ${res.status}`
      
      // Provide more helpful error messages for common issues
      let userFriendlyMessage = errorMessage
      if (res.status === 401) {
        if (errorMessage.toLowerCase().includes("token") || errorMessage.toLowerCase().includes("invalid")) {
          userFriendlyMessage = "Invalid Khalti API key. Please check your KHALTI_SECRET_KEY in environment variables. Ensure you're using the correct key for sandbox (dev.khalti.com) or production (khalti.com)."
        }
      }
      
      logPaymentEvent("Khalti payment initiation failed", {
        donationId: donation.id,
        status: res.status,
        error: errorMessage,
        errorKey: data.error_key,
        baseUrl,
        keyLength: trimmedKey.length,
        keyPrefix: trimmedKey.substring(0, 4) + "***",
        hint: res.status === 401 ? "Check if you're using the correct key for the environment (sandbox vs production)" : undefined,
      }, "error")

      throw new KhaltiError(userFriendlyMessage, res.status, data.error_key)
    }

    if (!data.payment_url || !data.pidx) {
      logPaymentEvent("Khalti payment initiation incomplete response", {
        donationId: donation.id,
        response: data,
      }, "error")

      throw new KhaltiError("Khalti init did not return payment_url or pidx", res.status)
    }

    logPaymentEvent("Khalti payment initiated successfully", {
      donationId: donation.id,
      pidx: data.pidx,
      amount: donation.amount,
    })

    return {
      redirectUrl: data.payment_url,
      pidx: data.pidx,
    }
  } catch (error) {
    if (error instanceof KhaltiError) {
      throw error
    }

    if (error instanceof Error) {
      logPaymentEvent("Khalti payment initiation error", {
        donationId: donation.id,
        error: error.message,
      }, "error")

      throw new KhaltiError(`Network error: ${error.message}`, undefined, "network_error")
    }

    throw new KhaltiError("Unknown error during Khalti payment initiation")
  }
}


