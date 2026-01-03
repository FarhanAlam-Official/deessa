"use server"

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { getPaymentMode } from "@/lib/payments/config"
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
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session

        const donationId = session.client_reference_id || session.metadata?.donation_id
        if (!donationId) {
          console.warn("checkout.session.completed: No donation ID found in session", session.id)
          break
        }

        // Try to find donation by ID first
        let { data: donation, error: fetchError } = await supabase
          .from("donations")
          .select("*")
          .eq("id", donationId)
          .single()

        // If not found by ID, try alternative lookups
        if (fetchError || !donation) {
          // Try finding by payment_id (in case payment_id was set during checkout creation)
          const paymentIdPattern = `stripe:${session.id}`
          const { data: donationsByPaymentId } = await supabase
            .from("donations")
            .select("*")
            .like("payment_id", paymentIdPattern)
            .limit(1)

          if (donationsByPaymentId && donationsByPaymentId.length > 0) {
            donation = donationsByPaymentId[0]
            fetchError = null
          } else {
            // Try finding by email and amount as last resort (for recent donations)
            const { data: donationsByEmail } = await supabase
              .from("donations")
              .select("*")
              .eq("donor_email", session.metadata?.donor_email || session.customer_email || "")
              .eq("payment_status", "pending")
              .order("created_at", { ascending: false })
              .limit(5)

            if (donationsByEmail && donationsByEmail.length > 0) {
              // Try to match by amount if available
              const sessionAmount = session.amount_total ? session.amount_total / 100 : null
              const matchingDonation = sessionAmount
                ? donationsByEmail.find(d => Math.abs(Number(d.amount) - sessionAmount) < 0.01)
                : donationsByEmail[0]

              if (matchingDonation) {
                donation = matchingDonation
                fetchError = null
              }
            }

            if (!donation) {
              console.error("checkout.session.completed: Donation not found", {
                donationId,
                sessionId: session.id,
              })
              break
            }
          }
        }

        if (!donation) {
          console.error("checkout.session.completed: Donation not found after all attempts", donationId)
          break
        }

        // Idempotency check: don't update if already completed or failed
        if (donation.payment_status === "completed" || donation.payment_status === "failed") {
          break
        }

        // Verify amount and currency match (for one-time payments)
        if (session.mode === "payment" && session.amount_total && donation.amount) {
          const expectedMinor = Math.round(Number(donation.amount) * 100)
          if (expectedMinor !== session.amount_total) {
            console.warn(
              "checkout.session.completed: Amount mismatch for donation",
              donationId,
              `Expected: ${expectedMinor}, Got: ${session.amount_total}`
            )
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

        break
      }

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session

        const donationId = session.client_reference_id || session.metadata?.donation_id
        if (!donationId) {
          break
        }

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
            })
            .eq("id", donationId)
        }

        break
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice

        // For subscription invoices, find the donation
        if (invoice.subscription && typeof invoice.subscription === "string") {
          // Try to find donation by subscription ID in payment_id
          const { data: donations } = await supabase
            .from("donations")
            .select("*")
            .like("payment_id", `%subscription:${invoice.subscription}%`)

          if (donations && donations.length > 0) {
            // Update the most recent matching donation
            const donation = donations[0]
            if (donation.payment_status !== "completed") {
              await supabase
                .from("donations")
                .update({
                  payment_status: "completed",
                })
                .eq("id", donation.id)
            }
          }
        }

        break
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice

        // For subscription invoices, mark donation as failed
        if (invoice.subscription && typeof invoice.subscription === "string") {
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


