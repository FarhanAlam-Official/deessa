"use server"

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getPaymentMode } from "@/lib/payments/config"

export async function GET(request: Request) {
  const mode = getPaymentMode()
  const url = new URL(request.url)

  const refId = url.searchParams.get("refId") || url.searchParams.get("rid")
  const pid = url.searchParams.get("oid") || url.searchParams.get("pid")
  const amt = url.searchParams.get("amt")

  if (!refId || !pid || !amt) {
    return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
  }

  const supabase = await createClient()

  // Our referenceId is of the form `esewa_<donationId>`
  const donationId = pid.startsWith("esewa_") ? pid.replace("esewa_", "") : pid

  const { data: donation } = await supabase
    .from("donations")
    .select("*")
    .eq("id", donationId)
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
      .update({ payment_status: "completed", payment_id: `esewa:${refId}` })
      .eq("id", donation.id)

    return NextResponse.json({ ok: true, status: "completed", mock: true }, { status: 200 })
  }

  const merchantId = process.env.ESEWA_MERCHANT_ID || "EPAYTEST"
  const baseUrl = process.env.ESEWA_BASE_URL || "https://esewa.com.np"

  const params = new URLSearchParams({
    amt,
    scd: merchantId,
    pid,
    rid: refId,
  })

  // eSewa returns plain text / HTML where SUCCESS indicates a valid transaction
  const res = await fetch(`${baseUrl}/epay/transrec?${params.toString()}`)

  if (!res.ok) {
    console.error("eSewa verify failed with status", res.status)
    return NextResponse.json({ error: "eSewa verify failed" }, { status: 502 })
  }

  const text = await res.text()

  if (text.toLowerCase().includes("success")) {
    await supabase
      .from("donations")
      .update({ payment_status: "completed", payment_id: `esewa:${refId}` })
      .eq("id", donation.id)

    return NextResponse.json({ ok: true, status: "completed" }, { status: 200 })
  }

  await supabase
    .from("donations")
    .update({ payment_status: "failed" })
    .eq("id", donation.id)

  return NextResponse.json({ ok: true, status: "failed" }, { status: 200 })
}


