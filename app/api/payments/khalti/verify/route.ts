"use server"

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getPaymentMode } from "@/lib/payments/config"

export async function POST(request: Request) {
  const mode = getPaymentMode()

  try {
    const body = await request.json()
    const pidx = body.pidx as string | undefined

    if (!pidx) {
      return NextResponse.json({ error: "Missing pidx" }, { status: 400 })
    }

    const supabase = await createClient()

    // Find donation by stored payment reference (we stored `khalti:pidx`)
    const { data: donation } = await supabase
      .from("donations")
      .select("*")
      .eq("payment_id", `khalti:${pidx}`)
      .single()

    if (!donation) {
      return NextResponse.json({ error: "Donation not found" }, { status: 404 })
    }

    if (donation.payment_status === "completed" || donation.payment_status === "failed") {
      return NextResponse.json({ ok: true, status: donation.payment_status }, { status: 200 })
    }

    if (mode === "mock") {
      await supabase
        .from("donations")
        .update({ payment_status: "completed" })
        .eq("id", donation.id)

      return NextResponse.json({ ok: true, status: "completed", mock: true }, { status: 200 })
    }

    const secretKey = process.env.KHALTI_SECRET_KEY
    const baseUrl = process.env.KHALTI_BASE_URL || "https://khalti.com/api/v2"

    if (!secretKey) {
      console.error("KHALTI_SECRET_KEY is not configured")
      return NextResponse.json({ error: "Khalti not configured" }, { status: 500 })
    }

    const res = await fetch(`${baseUrl}/epayment/lookup/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Key ${secretKey}`,
      },
      body: JSON.stringify({ pidx }),
    })

    if (!res.ok) {
      console.error("Khalti verify failed with status", res.status)
      return NextResponse.json({ error: "Khalti verify failed" }, { status: 502 })
    }

    const data = (await res.json()) as {
      status: string
      total_amount?: number
      purchase_order_id?: string
    }

    if (data.status === "Completed") {
      // Optional: amount verification
      if (typeof data.total_amount === "number" && donation.amount) {
        const expected = Math.round(Number(donation.amount) * 100)
        if (expected !== data.total_amount) {
          console.warn("Khalti amount mismatch for donation", donation.id)
        }
      }

      await supabase
        .from("donations")
        .update({ payment_status: "completed" })
        .eq("id", donation.id)

      return NextResponse.json({ ok: true, status: "completed" }, { status: 200 })
    }

    // Any other status we treat as failed
    await supabase
      .from("donations")
      .update({ payment_status: "failed" })
      .eq("id", donation.id)

    return NextResponse.json({ ok: true, status: "failed" }, { status: 200 })
  } catch (err) {
    console.error("Khalti verify handler error:", err)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}


