"use server"

import type { PaymentMode } from "./config"

export interface StripeCheckoutResult {
  redirectUrl: string
  sessionId: string
}

export interface StripeDonationContext {
  id: string
  amount: number
  currency: string
  donorName: string
  donorEmail: string
  isMonthly: boolean
}

// Lazily initialise Stripe only on the server when needed
let stripeClient: import("stripe") | null = null

async function getStripeClient() {
  if (stripeClient) return stripeClient

  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured")
  }

  const Stripe = (await import("stripe")).default
  stripeClient = new Stripe(secretKey, {
    apiVersion: "2024-06-20",
  })

  return stripeClient
}

export async function startStripeCheckout(
  donation: StripeDonationContext,
  mode: PaymentMode,
): Promise<StripeCheckoutResult> {
  const successUrl =
    process.env.STRIPE_SUCCESS_URL ||
    `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/donate/success`
  const cancelUrl =
    process.env.STRIPE_CANCEL_URL ||
    `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/donate/cancel`

  if (mode === "mock") {
    // Simulated, but structurally similar to a real Checkout session
    const mockSessionId = `cs_test_mock_${donation.id}`
    const mockUrl = `${successUrl}?session_id=${mockSessionId}&mock=1`

    return {
      redirectUrl: mockUrl,
      sessionId: mockSessionId,
    }
  }

  const stripe = await getStripeClient()

  // Stripe expects amount in the smallest currency unit
  const amountInMinorUnits = Math.round(donation.amount * 100)

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: donation.currency.toLowerCase(),
          product_data: {
            name: donation.isMonthly ? "Monthly Donation" : "One-time Donation",
            description: `Donation to deessa Foundation from ${donation.donorName}`,
          },
          unit_amount: amountInMinorUnits,
        },
        quantity: 1,
      },
    ],
    success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${cancelUrl}?session_id={CHECKOUT_SESSION_ID}`,
    customer_email: donation.donorEmail,
    client_reference_id: donation.id,
    metadata: {
      donation_id: donation.id,
      donor_name: donation.donorName,
      donor_email: donation.donorEmail,
      is_monthly: donation.isMonthly ? "true" : "false",
    },
  })

  if (!session.url) {
    throw new Error("Stripe Checkout session was created without a redirect URL")
  }

  return {
    redirectUrl: session.url,
    sessionId: session.id,
  }
}


