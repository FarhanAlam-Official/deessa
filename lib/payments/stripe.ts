"use server"

import type { PaymentMode } from "./config"
import type Stripe from "stripe"

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

export interface StripeSessionVerificationResult {
  success: boolean
  session?: Stripe.Checkout.Session | null
  error?: string
  statusCode?: number
}

// Lazily initialise Stripe only on the server when needed
let stripeClient: Stripe | null = null

async function getStripeClient(): Promise<Stripe> {
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

/**
 * Verify a Stripe checkout session
 */
export async function verifyStripeSession(
  sessionId: string,
  mode: PaymentMode,
): Promise<StripeSessionVerificationResult> {
  try {
    if (mode === "mock") {
      // In mock mode, validate the session ID format and return mock data
      if (!sessionId.startsWith("cs_test_mock_")) {
        return {
          success: false,
          error: "Invalid mock session ID format",
          statusCode: 400,
        }
      }

      // Extract donation ID from mock session ID
      const donationId = sessionId.replace("cs_test_mock_", "")
      
      return {
        success: true,
        session: {
          id: sessionId,
          object: "checkout.session",
          status: "complete",
          payment_status: "paid",
          client_reference_id: donationId,
          metadata: {
            donation_id: donationId,
          },
        } as Stripe.Checkout.Session,
      }
    }

    const stripe = await getStripeClient()
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["customer", "subscription"],
    })

    return {
      success: true,
      session,
    }
  } catch (error) {
    console.error("Error verifying Stripe session:", error)
    
    if (error instanceof Error) {
      // Handle Stripe-specific errors
      if (error.message.includes("No such checkout.session")) {
        return {
          success: false,
          error: "Session not found",
          statusCode: 404,
        }
      }
      
      return {
        success: false,
        error: error.message || "Failed to verify session",
        statusCode: 500,
      }
    }

    return {
      success: false,
      error: "Unknown error during session verification",
      statusCode: 500,
    }
  }
}

/**
 * Create a Stripe checkout session for one-time or recurring donations
 */
export async function startStripeCheckout(
  donation: StripeDonationContext,
  mode: PaymentMode,
): Promise<StripeCheckoutResult> {
  try {
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

    // Stripe expects amount in the smallest currency unit (cents)
    // Use toFixed to avoid floating-point precision errors
    const amountInMinorUnits = Math.round(Number(donation.amount.toFixed(2)) * 100)

    // For monthly donations, use subscription mode
    if (donation.isMonthly) {
      // Create a product and price for the recurring donation
      const product = await stripe.products.create({
        name: "Monthly Donation",
        description: `Monthly donation to deessa Foundation from ${donation.donorName}`,
      })

      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: amountInMinorUnits,
        currency: donation.currency.toLowerCase(),
        recurring: {
          interval: "month",
        },
      })

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [
          {
            price: price.id,
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
          is_monthly: "true",
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

    // One-time payment
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: donation.currency.toLowerCase(),
            product_data: {
              name: "One-time Donation",
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
        is_monthly: "false",
      },
    })

    if (!session.url) {
      throw new Error("Stripe Checkout session was created without a redirect URL")
    }

    return {
      redirectUrl: session.url,
      sessionId: session.id,
    }
  } catch (error) {
    console.error("Error creating Stripe checkout session:", error)
    
    if (error instanceof Error) {
      // Re-throw with more context
      throw new Error(`Failed to create Stripe checkout: ${error.message}`)
    }
    
    throw new Error("Unknown error while creating Stripe checkout session")
  }
}


