import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { LogsClient } from "./logs-client"

export const metadata = {
  title: "Payment Logs | Admin",
  description: "View and manage payment event logs",
}

async function getPaymentLogs(supabase: Awaited<ReturnType<typeof createClient>>, filters?: {
  provider?: string
  dateFrom?: string
  dateTo?: string
  search?: string
}) {
  let query = supabase
    .from("payment_events")
    .select("*, donations(id, donor_name, donor_email, amount, currency)")
    .order("created_at", { ascending: false })
    .limit(100)

  // Apply filters
  if (filters?.provider && filters.provider !== "all") {
    query = query.eq("provider", filters.provider)
  }

  if (filters?.dateFrom) {
    query = query.gte("created_at", filters.dateFrom)
  }

  if (filters?.dateTo) {
    query = query.lte("created_at", filters.dateTo)
  }

  const { data: logs, error } = await query

  if (error) {
    console.error("Error fetching logs:", error)
    return []
  }

  // Apply search filter client-side if needed
  let filteredLogs = logs || []
  if (filters?.search) {
    const searchLower = filters.search.toLowerCase()
    filteredLogs = filteredLogs.filter((log: any) =>
      log.event_id?.toLowerCase().includes(searchLower) ||
      log.donation_id?.toLowerCase().includes(searchLower) ||
      log.donations?.donor_name?.toLowerCase().includes(searchLower) ||
      log.donations?.donor_email?.toLowerCase().includes(searchLower)
    )
  }

  return filteredLogs
}

async function getLogStats(supabase: Awaited<ReturnType<typeof createClient>>) {
  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const last7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const [total, last24hCount, last7dCount] = await Promise.all([
    supabase.from("payment_events").select("id", { count: "exact", head: true }),
    supabase.from("payment_events").select("id", { count: "exact", head: true }).gte("created_at", last24h),
    supabase.from("payment_events").select("id", { count: "exact", head: true }).gte("created_at", last7d),
  ])

  return {
    total: total.count || 0,
    last24h: last24hCount.count || 0,
    last7d: last7dCount.count || 0,
  }
}

export default async function PaymentLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ provider?: string; dateFrom?: string; dateTo?: string; search?: string }>
}) {
  const supabase = await createClient()

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/admin/login")
  }

  const params = await searchParams
  const logs = await getPaymentLogs(supabase, params)
  const stats = await getLogStats(supabase)

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Payment Logs</h1>
        <p className="text-muted-foreground">
          View and search payment event logs
        </p>
      </div>

      <LogsClient logs={logs} stats={stats} />
    </div>
  )
}
