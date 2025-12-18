"use server"

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getPaymentMode } from "@/lib/payments/config"

export async function POST(request: Request) {
  const mode = getPaymentMode()
  const signature = request.headers.get("stripe-signature")

  let event: any

  try {
    const body = await request.text()

    if (mode === "mock") {
      // In mock mode we trust local test payloads and skip signature verification.
      event = JSON.parse(body)
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

      event = stripe.webhooks.constructEvent(body, signature, secret)
    }
  } catch (err) {
    console.error("Stripe webhook error:", err)
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }

  const supabase = await createClient()

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as {
          id: string
          client_reference_id?: string | null
          metadata?: Record<string, string>
          amount_total?: number
          currency?: string
        }

        const donationId = session.client_reference_id || session.metadata?.donation_id
        if (!donationId) {
          break
        }

        const { data: donation } = await supabase
          .from("donations")
          .select("*")
          .eq("id", donationId)
          .single()

        if (!donation) {
          break
        }

        if (donation.payment_status === "completed" || donation.payment_status === "failed") {
          // Idempotent: nothing to do
          break
        }

        // Optional: verify amount and currency match
        if (session.amount_total && donation.amount) {
          const expectedMinor = Math.round(Number(donation.amount) * 100)
          if (expectedMinor !== session.amount_total) {
            console.warn("Stripe amount mismatch for donation", donationId)
          }
        }

        await supabase
          .from("donations")
          .update({
            payment_status: "completed",
          })
          .eq("id", donationId)

        break
      }
      case "checkout.session.expired":
      case "payment_intent.payment_failed": {
        const data = event.data.object as { client_reference_id?: string | null; metadata?: Record<string, string> }
        const donationId = (data as any).client_reference_id || data.metadata?.donation_id
        if (!donationId) {
          break
        }

        const { data: donation } = await supabase
          .from("donations")
          .select("*")
          .eq("id", donationId)
          .single()

        if (!donation) break

        if (donation.payment_status === "completed" || donation.payment_status === "failed") {
          break
        }

        await supabase
          .from("donations")
          .update({
            payment_status: "failed",
          })
          .eq("id", donationId)

        break
      }
      default:
        // Other events are ignored but acknowledged
        break
    }
  } catch (err) {
    console.error("Error handling Stripe webhook event:", err)
    return NextResponse.json({ error: "Webhook handling error" }, { status: 500 })
  }

  return NextResponse.json({ received: true }, { status: 200 })
}


