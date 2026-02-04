"use server"

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { getPaymentMode } from "@/lib/payments/config"
import { generateReceiptForDonation } from "@/lib/actions/donation-receipt"
import type Stripe from "stripe"

// Create a service role client for webhooks (bypasses RLS)
function createServiceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase service role credentials for webhook")
  }

  return createServiceClient(supabaseUrl, serviceRoleKey)
}

export async function POST(request: Request) {
  const mode = getPaymentMode()
  const signature = request.headers.get("stripe-signature")

  let event: Stripe.Event

  try {
    const body = await request.text()

    if (mode === "mock") {
      // In mock mode we trust local test payloads and skip signature verification.
      event = JSON.parse(body) as Stripe.Event
    } else {
      const secret = process.env.STRIPE_WEBHOOK_SECRET
      if (!secret) {
        console.error("STRIPE_WEBHOOK_SECRET is not configured")
        return NextResponse.json({ error: "Webhook not configured" }, { status: 500 })
      }
      if (!signature) {
        return NextResponse.json({ error: "Missing Stripe-Signature header" }, { status: 400 })
      }

      const Stripe = (await import("stripe")).default
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
        apiVersion: "2024-06-20",
      })

      try {
        event = stripe.webhooks.constructEvent(body, signature, secret)
      } catch (err) {
        console.error("Stripe webhook signature verification failed:", err)
        return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
      }
    }
  } catch (err) {
    console.error("Stripe webhook parsing error:", err)
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }

  // Use service role client for webhooks to bypass RLS
  const supabase = createServiceRoleClient()

  try {
    // Idempotency / replay protection: store Stripe event.id once
    const recordEventOnce = async (donationId: string | null | undefined) => {
      try {
        const { error } = await supabase
          .from("payment_events")
          .insert({
            provider: "stripe",
            event_id: event.id,
            donation_id: donationId ?? null,
          })
        if (error) {
          // Postgres unique violation via Supabase can present as an error string; treat as already-processed.
          if ((error as any).code === "23505" || String((error as any).message || "").toLowerCase().includes("duplicate")) {
            return { alreadyProcessed: true }
          }
          // If the ledger doesn't exist yet, do not block processing (migration not applied).
          if (String((error as any).message || "").toLowerCase().includes("payment_events")) {
            return { alreadyProcessed: false }
          }
          return { alreadyProcessed: false }
        }
        return { alreadyProcessed: false }
      } catch {
        return { alreadyProcessed: false }
      }
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session

        const donationId = session.client_reference_id || session.metadata?.donation_id
        if (!donationId) {
          console.warn("checkout.session.completed: No donation ID found in session", session.id)
          break
        }

        // Idempotency / replay protection
        const recorded = await recordEventOnce(donationId)
        if (recorded.alreadyProcessed) break

        // Strict lookup: donation must match id
        const { data: donation, error: fetchError } = await supabase
          .from("donations")
          .select("*")
          .eq("id", donationId)
          .single()

        if (!donation) {
          console.error("checkout.session.completed: Donation not found", {
            donationId,
            sessionId: session.id,
            error: fetchError,
          })
          break
        }

        // Idempotency check: don't update if already completed or failed
        if (donation.payment_status === "completed" || donation.payment_status === "failed") {
          break
        }

        // Only mark complete if Stripe says the checkout is paid
        if (session.payment_status !== "paid") {
          console.warn("checkout.session.completed: Session not paid; keeping pending", {
            donationId,
            sessionId: session.id,
            payment_status: session.payment_status,
          })
          break
        }

        // Fail-closed amount/currency check for one-time payments
        if (session.mode === "payment") {
          const donationCurrency = String(donation.currency || "").toLowerCase()
          const sessionCurrency = String(session.currency || "").toLowerCase()
          const expectedMinor = donation.amount ? Math.round(Number(donation.amount) * 100) : null
          const actualMinor = session.amount_total ?? null
          if (!expectedMinor || actualMinor === null || donationCurrency !== sessionCurrency || expectedMinor !== actualMinor) {
            console.error("checkout.session.completed: Amount/currency mismatch; marking review", {
              donationId,
              sessionId: session.id,
              donationCurrency,
              sessionCurrency,
              expectedMinor,
              actualMinor,
            })
            await supabase
              .from("donations")
              .update({
                payment_status: "review",
                stripe_session_id: session.id,
                provider: "stripe",
                provider_ref: session.id,
              })
              .eq("id", donationId)
            break
          }
        }

        // Update payment status
        const { error: updateError, data: updatedDonations } = await supabase
          .from("donations")
          .update({
            payment_status: "completed",
            payment_id: session.subscription
              ? `stripe:subscription:${session.subscription}`
              : `stripe:${session.id}`,
            provider: "stripe",
            provider_ref: session.id,
            stripe_session_id: session.id,
            stripe_subscription_id:
              session.subscription && typeof session.subscription === "string"
                ? session.subscription
                : null,
          })
          .eq("id", donationId)
          .select()

        const updatedDonation = updatedDonations?.[0]

        if (updateError) {
          console.error("checkout.session.completed: Failed to update donation", {
            donationId,
            sessionId: session.id,
            error: updateError,
          })
          // Return error so Stripe can retry
          return NextResponse.json(
            { error: "Failed to update donation status" },
            { status: 500 }
          )
        }

        // Generate receipt automatically after payment completion
        if (updatedDonation) {
          try {
            await generateReceiptForDonation({ donationId: updatedDonation.id })
            console.log(`Receipt generated for donation ${updatedDonation.id}`)
          } catch (receiptError) {
            // Don't fail the webhook if receipt generation fails - it can be retried later
            console.error("Failed to generate receipt for donation:", receiptError)
          }
        }

        break
      }

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session

        const donationId = session.client_reference_id || session.metadata?.donation_id
        if (!donationId) {
          break
        }

        const recorded = await recordEventOnce(donationId)
        if (recorded.alreadyProcessed) break

        const { data: donation } = await supabase
          .from("donations")
          .select("*")
          .eq("id", donationId)
          .single()

        if (!donation) break

        // Only update if still pending
        if (donation.payment_status === "pending") {
          await supabase
            .from("donations")
            .update({
              payment_status: "failed",
            })
            .eq("id", donationId)
        }

        break
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent

        // Try to find donation via metadata
        const donationId = paymentIntent.metadata?.donation_id
        if (!donationId) {
          break
        }

        const recorded = await recordEventOnce(donationId)
        if (recorded.alreadyProcessed) break

        const { data: donation } = await supabase
          .from("donations")
          .select("*")
          .eq("id", donationId)
          .single()

        if (!donation) break

        // Only update if still pending
        if (donation.payment_status === "pending") {
          await supabase
            .from("donations")
            .update({
              payment_status: "failed",
            })
            .eq("id", donationId)
        }

        break
      }

      // Subscription events for monthly donations
      case "customer.subscription.created": {
        const subscription = event.data.object as Stripe.Subscription

        // Find donation via subscription metadata or customer metadata
        const donationId = subscription.metadata?.donation_id
        if (!donationId) {
          console.warn("customer.subscription.created: No donation ID in subscription metadata", subscription.id)
          break
        }

        const recorded = await recordEventOnce(donationId)
        if (recorded.alreadyProcessed) break

        const { data: donation } = await supabase
          .from("donations")
          .select("*")
          .eq("id", donationId)
          .single()

        if (donation) {
          await supabase
            .from("donations")
            .update({
              payment_id: `stripe:subscription:${subscription.id}`,
              provider: "stripe",
              provider_ref: subscription.id,
              stripe_subscription_id: subscription.id,
            })
            .eq("id", donationId)
        }

        break
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice

        // For subscription invoices, find the donation
        if (invoice.subscription && typeof invoice.subscription === "string") {
          const recorded = await recordEventOnce(null)
          if (recorded.alreadyProcessed) break

          // Try to find donation by subscription ID in payment_id
          const { data: donations } = await supabase
            .from("donations")
            .select("*")
            .like("payment_id", `%subscription:${invoice.subscription}%`)

          if (donations && donations.length > 0) {
            // Update the most recent matching donation
            const donation = donations[0]
            if (donation.payment_status !== "completed") {
              const { data: updatedDonations } = await supabase
                .from("donations")
                .update({
                  payment_status: "completed",
                  provider: "stripe",
                  provider_ref: invoice.subscription,
                  stripe_subscription_id: invoice.subscription,
                })
                .eq("id", donation.id)
                .select()

              const updatedDonation = updatedDonations?.[0]
              
              // Generate receipt for subscription payment
              if (updatedDonation) {
                try {
                  await generateReceiptForDonation({ donationId: updatedDonation.id })
                  console.log(`Receipt generated for subscription donation ${updatedDonation.id}`)
                } catch (receiptError) {
                  console.error("Failed to generate receipt for subscription donation:", receiptError)
                }
              }
            }
          }
        }

        break
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice

        // For subscription invoices, mark donation as failed
        if (invoice.subscription && typeof invoice.subscription === "string") {
          const recorded = await recordEventOnce(null)
          if (recorded.alreadyProcessed) break

          const { data: donations } = await supabase
            .from("donations")
            .select("*")
            .like("payment_id", `%subscription:${invoice.subscription}%`)

          if (donations && donations.length > 0) {
            const donation = donations[0]
            if (donation.payment_status === "pending") {
              await supabase
                .from("donations")
                .update({
                  payment_status: "failed",
                  provider: "stripe",
                  provider_ref: invoice.subscription,
                  stripe_subscription_id: invoice.subscription,
                })
                .eq("id", donation.id)
            }
          }
        }

        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription

        // Optionally handle subscription cancellation
        const donationId = subscription.metadata?.donation_id
        if (donationId) {
          // Note: We don't change payment_status here as the subscription may have been active
        }

        break
      }

      default:
        // Other events are acknowledged but not processed
        console.log("Unhandled Stripe webhook event type:", event.type)
        break
    }
  } catch (err) {
    console.error("Error handling Stripe webhook event:", err)
    return NextResponse.json({ error: "Webhook handling error" }, { status: 500 })
  }

  return NextResponse.json({ received: true }, { status: 200 })
}


