import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { MetricsClient } from "./metrics-client"

export const metadata = {
  title: "Payment Metrics | Admin",
  description: "View payment performance metrics and trends",
}

async function getMetricsData(supabase: ReturnType<typeof createClient>) {
  const now = new Date()
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const date = new Date(now)
    date.setDate(date.getDate() - (29 - i))
    return date.toISOString().split("T")[0]
  })

  // Get daily donation counts for the last 30 days
  const dailyDonations = await Promise.all(
    last30Days.map(async (date) => {
      const nextDate = new Date(date)
      nextDate.setDate(nextDate.getDate() + 1)
      
      const { count } = await supabase
        .from("donations")
        .select("id", { count: "exact", head: true })
        .eq("payment_status", "confirmed")
        .gte("confirmed_at", date)
        .lt("confirmed_at", nextDate.toISOString().split("T")[0])

      return { date, count: count || 0 }
    })
  )

  // Get provider breakdown
  const providers = ["stripe", "khalti", "esewa"]
  const providerStats = await Promise.all(
    providers.map(async (provider) => {
      const { count } = await supabase
        .from("donations")
        .select("id", { count: "exact", head: true })
        .eq("payment_status", "confirmed")
        .eq("provider", provider)

      const { data: amountData } = await supabase
        .from("donations")
        .select("amount")
        .eq("payment_status", "confirmed")
        .eq("provider", provider)

      const totalAmount = amountData?.reduce((sum, d) => sum + Number(d.amount), 0) || 0

      return {
        provider,
        count: count || 0,
        amount: totalAmount,
      }
    })
  )

  // Get failure rates
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
  const [receiptFailures, emailFailures, totalDonations] = await Promise.all([
    supabase
      .from("receipt_failures")
      .select("id", { count: "exact", head: true })
      .gte("created_at", last24h)
      .is("resolved_at", null),
    supabase
      .from("email_failures")
      .select("id", { count: "exact", head: true })
      .gte("created_at", last24h)
      .is("resolved_at", null),
    supabase
      .from("donations")
      .select("id", { count: "exact", head: true })
      .eq("payment_status", "confirmed")
      .gte("confirmed_at", last24h),
  ])

  const receiptSuccessRate = totalDonations.count
    ? ((totalDonations.count - (receiptFailures.count || 0)) / totalDonations.count) * 100
    : 100

  const emailSuccessRate = totalDonations.count
    ? ((totalDonations.count - (emailFailures.count || 0)) / totalDonations.count) * 100
    : 100

  // Get status breakdown
  const statuses = ["pending", "confirmed", "review", "failed"]
  const statusBreakdown = await Promise.all(
    statuses.map(async (status) => {
      const { count } = await supabase
        .from("donations")
        .select("id", { count: "exact", head: true })
        .eq("payment_status", status)

      return { status, count: count || 0 }
    })
  )

  return {
    dailyDonations,
    providerStats,
    successRates: {
      receipt: receiptSuccessRate,
      email: emailSuccessRate,
    },
    statusBreakdown,
  }
}

export default async function MetricsPage() {
  const supabase = await createClient()

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/admin/login")
  }

  const metrics = await getMetricsData(supabase)

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Payment Metrics</h1>
        <p className="text-muted-foreground">
          Analyze payment performance and trends
        </p>
      </div>

      <MetricsClient metrics={metrics} />
    </div>
  )
}
