"use server"

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const url = new URL(request.url)

  const pid = url.searchParams.get("oid") || url.searchParams.get("pid")

  if (!pid) {
    return NextResponse.json({ error: "Missing pid" }, { status: 400 })
  }

  const donationId = pid.startsWith("esewa_") ? pid.replace("esewa_", "") : pid

  const supabase = await createClient()

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

  await supabase
    .from("donations")
    .update({ payment_status: "failed" })
    .eq("id", donation.id)

  return NextResponse.json({ ok: true, status: "failed" }, { status: 200 })
}


