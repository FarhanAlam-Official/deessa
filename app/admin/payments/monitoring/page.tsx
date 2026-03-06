import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { PostPaymentMonitoringClient } from "./monitoring-client"

export const metadata = {
  title: "Post-Payment Monitoring | Admin",
  description: "Monitor receipt generation and email sending success rates",
}

async function getMonitoringStats(supabase: ReturnType<typeof createClient>) {
  // Get confirmed donations for different time periods
  const now = new Date()
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  // Receipt failures by time period
  const [failures24h, failures7d, failures30d] = await Promise.all([
    supabase
      .from("receipt_failures")
      .select("donation_id", { count: "exact", head: true })
      .gte("created_at", last24h.toISOString())
      .is("resolved_at", null),
    supabase
      .from("receipt_failures")
      .select("donation_id", { count: "exact", head: true })
      .gte("created_at", last7d.toISOString())
      .is("resolved_at", null),
    supabase
      .from("receipt_failures")
      .select("donation_id", { count: "exact", head: true })
      .gte("created_at", last30d.toISOString())
      .is("resolved_at", null),
  ])

  // Email failures by time period
  const [emailFailures24h, emailFailures7d, emailFailures30d] = await Promise.all([
    supabase
      .from("email_failures")
      .select("donation_id", { count: "exact", head: true })
      .gte("created_at", last24h.toISOString())
      .is("resolved_at", null),
    supabase
      .from("email_failures")
      .select("donation_id", { count: "exact", head: true })
      .gte("created_at", last7d.toISOString())
      .is("resolved_at", null),
    supabase
      .from("email_failures")
      .select("donation_id", { count: "exact", head: true })
      .gte("created_at", last30d.toISOString())
      .is("resolved_at", null),
  ])

  // Total confirmed donations by time period
  const [donations24h, donations7d, donations30d] = await Promise.all([
    supabase
      .from("donations")
      .select("id", { count: "exact", head: true })
      .eq("payment_status", "completed")
      .gte("created_at", last24h.toISOString()),
    supabase
      .from("donations")
      .select("id", { count: "exact", head: true })
      .eq("payment_status", "completed")
      .gte("created_at", last7d.toISOString()),
    supabase
      .from("donations")
      .select("id", { count: "exact", head: true })
      .eq("payment_status", "completed")
      .gte("created_at", last30d.toISOString()),
  ])

  // Recent failures (last 10)
  const { data: recentReceiptFailures } = await supabase
    .from("receipt_failures")
    .select(
      `
      *,
      donations (
        id,
        donor_name,
        amount,
        currency
      )
    `
    )
    .is("resolved_at", null)
    .order("last_attempt_at", { ascending: false })
    .limit(10)

  const { data: recentEmailFailures } = await supabase
    .from("email_failures")
    .select(
      `
      *,
      donations (
        id,
        donor_name,
        amount,
        currency
      )
    `
    )
    .is("resolved_at", null)
    .order("last_attempt_at", { ascending: false })
    .limit(10)

  return {
    receipt: {
      failures24h: failures24h.count || 0,
      failures7d: failures7d.count || 0,
      failures30d: failures30d.count || 0,
      total24h: donations24h.count || 0,
      total7d: donations7d.count || 0,
      total30d: donations30d.count || 0,
      recentFailures: recentReceiptFailures || [],
    },
    email: {
      failures24h: emailFailures24h.count || 0,
      failures7d: emailFailures7d.count || 0,
      failures30d: emailFailures30d.count || 0,
      total24h: donations24h.count || 0,
      total7d: donations7d.count || 0,
      total30d: donations30d.count || 0,
      recentFailures: recentEmailFailures || [],
    },
  }
}

export default async function PostPaymentMonitoringPage() {
  const supabase = await createClient()

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/admin/login")
  }

  const stats = await getMonitoringStats(supabase)

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Post-Payment Monitoring</h1>
        <p className="text-muted-foreground">
          Monitor receipt generation and email sending success rates
        </p>
      </div>

      <PostPaymentMonitoringClient stats={stats} />
    </div>
  )
}
