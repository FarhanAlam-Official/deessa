import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { SystemHealthClient } from "./system-health-client"

export const metadata = {
  title: "System Health | Admin",
  description: "Monitor system health and provider status",
}

async function getSystemHealth(supabase: ReturnType<typeof createClient>) {
  // Check database connectivity
  const dbStart = Date.now()
  const { error: dbError } = await supabase.from("donations").select("id").limit(1)
  const dbLatency = Date.now() - dbStart
  const dbStatus = dbError ? "error" : dbLatency < 1000 ? "healthy" : "slow"

  // Check payment_events table exists
  const { error: eventsError } = await supabase
    .from("payment_events")
    .select("id")
    .limit(1)

  // Check receipt_failures table exists
  const { error: receiptFailuresError } = await supabase
    .from("receipt_failures")
    .select("id")
    .limit(1)

  // Check email_failures table exists
  const { error: emailFailuresError } = await supabase
    .from("email_failures")
    .select("id")
    .limit(1)

  // Get last reconciliation run (if implemented)
  // For now, we'll show placeholder data
  const lastReconciliation = {
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45 min ago
    donationsChecked: 0,
    donationsReconciled: 0,
    status: "success",
  }

  // Get stuck donations count
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const { count: stuckDonations } = await supabase
    .from("donations")
    .select("id", { count: "exact", head: true })
    .eq("payment_status", "pending")
    .lt("created_at", oneHourAgo)

  // Get review donations count
  const { count: reviewDonations } = await supabase
    .from("donations")
    .select("id", { count: "exact", head: true })
    .eq("payment_status", "review")

  // Environment checks
  const envChecks = {
    stripeKey: !!process.env.STRIPE_SECRET_KEY,
    stripeWebhook: !!process.env.STRIPE_WEBHOOK_SECRET,
    khaltiKey: !!process.env.KHALTI_SECRET_KEY,
    esewaKey: !!process.env.ESEWA_SECRET_KEY,
    esewaMerchant: !!process.env.ESEWA_MERCHANT_ID,
    supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    paymentMode: process.env.PAYMENT_MODE || "mock",
  }

  return {
    database: {
      status: dbStatus,
      latency: dbLatency,
      tablesExist: {
        payment_events: !eventsError,
        receipt_failures: !receiptFailuresError,
        email_failures: !emailFailuresError,
      },
    },
    reconciliation: lastReconciliation,
    alerts: {
      stuckDonations: stuckDonations || 0,
      reviewDonations: reviewDonations || 0,
    },
    environment: envChecks,
    timestamp: new Date().toISOString(),
  }
}

export default async function SystemHealthPage() {
  const supabase = await createClient()

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/admin/login")
  }

  const health = await getSystemHealth(supabase)

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">System Health</h1>
        <p className="text-muted-foreground">
          Monitor system status and provider connectivity
        </p>
      </div>

      <SystemHealthClient initialHealth={health} />
    </div>
  )
}
