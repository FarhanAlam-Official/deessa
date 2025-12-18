"use server"

import type { PaymentMode } from "./config"

export interface EsewaInitResult {
  redirectUrl: string
  referenceId: string
}

export interface EsewaDonationContext {
  id: string
  amount: number
  currency: string
}

/**
 * Prepare an eSewa payment.
 *
 * For many integrations this is a form-based redirect; here we simplify it
 * into a redirect URL generator while keeping the core fields ready.
 */
export async function startEsewaPayment(
  donation: EsewaDonationContext,
  mode: PaymentMode,
): Promise<EsewaInitResult> {
  const baseUrl = process.env.ESEWA_BASE_URL || "https://esewa.com.np"
  const successUrl =
    process.env.ESEWA_SUCCESS_URL ||
    `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/payments/esewa/success`
  const failureUrl =
    process.env.ESEWA_FAILURE_URL ||
    `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/payments/esewa/failure`

  const merchantId = process.env.ESEWA_MERCHANT_ID || "EPAYTEST"

  const referenceId = `esewa_${donation.id}`

  if (mode === "mock") {
    const mockUrl = `${successUrl}?refId=${referenceId}&mock=1`
    return {
      redirectUrl: mockUrl,
      referenceId,
    }
  }

  // eSewa expects amount in NPR; conversion is assumed to be handled before
  const amount = donation.amount.toFixed(2)

  // For production, many setups use an HTML form POST.
  // We emulate a GET-based redirect URL for simplicity; this can be swapped
  // to a form POST in the UI layer without changing backend semantics.
  const params = new URLSearchParams({
    amt: amount,
    psc: "0",
    pdc: "0",
    txAmt: "0",
    tAmt: amount,
    pid: referenceId,
    scd: merchantId,
    su: successUrl,
    fu: failureUrl,
  })

  const redirectUrl = `${baseUrl}/epay/main?${params.toString()}`

  return {
    redirectUrl,
    referenceId,
  }
}


