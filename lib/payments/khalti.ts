"use server"

import type { PaymentMode } from "./config"

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
  const baseUrl = process.env.KHALTI_BASE_URL || "https://khalti.com/api/v2"
  const returnUrl =
    process.env.KHALTI_RETURN_URL ||
    `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/payments/khalti/return`

  if (mode === "mock") {
    const mockPidx = `khalti_mock_${donation.id}`
    const mockUrl = `${returnUrl}?pidx=${mockPidx}&mock=1`

    return {
      redirectUrl: mockUrl,
      pidx: mockPidx,
    }
  }

  const secretKey = process.env.KHALTI_SECRET_KEY
  if (!secretKey) {
    throw new Error("KHALTI_SECRET_KEY is not configured")
  }

  // Khalti expects amount in paisa (minor units)
  const amountInPaisa = Math.round(donation.amount * 100)

  const payload = {
    return_url: returnUrl,
    website_url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
    amount: amountInPaisa,
    purchase_order_id: donation.id,
    purchase_order_name: donation.donorName || "Donation",
  }

  const res = await fetch(`${baseUrl}/epayment/initiate/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Key ${secretKey}`,
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    throw new Error(`Khalti init failed with status ${res.status}`)
  }

  const data = (await res.json()) as { pidx: string; payment_url: string }

  if (!data.payment_url || !data.pidx) {
    throw new Error("Khalti init did not return payment_url or pidx")
  }

  return {
    redirectUrl: data.payment_url,
    pidx: data.pidx,
  }
}


