import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AlertsClient } from "./alerts-client"

export const metadata = {
  title: "Alerts & Notifications | Admin",
  description: "View and manage system alerts",
}

async function getAlerts(supabase: ReturnType<typeof createClient>) {
  // Get recent payment events that indicate issues
  const { data: recentEvents } = await supabase
    .from("payment_events")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100)

  // Get stuck donations
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const { data: stuckDonations } = await supabase
    .from("donations")
    .select("*, payment_events(*)")
    .eq("payment_status", "pending")
    .lt("created_at", oneHourAgo)

  // Get review donations
  const { data: reviewDonations } = await supabase
    .from("donations")
    .select("*")
    .eq("payment_status", "review")
    .order("created_at", { ascending: false })

  // Get recent failures
  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const [receiptFailures, emailFailures] = await Promise.all([
    supabase
      .from("receipt_failures")
      .select("*, donations(*)")
      .gte("created_at", last24h)
      .is("resolved_at", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("email_failures")
      .select("*, donations(*)")
      .gte("created_at", last24h)
      .is("resolved_at", null)
      .order("created_at", { ascending: false }),
  ])

  // Transform into alert format
  const alerts = []

  // Stuck donations alerts
  if (stuckDonations && stuckDonations.length > 0) {
    alerts.push({
      id: `stuck-${Date.now()}`,
      type: "stuck_donations",
      severity: "warning",
      title: `${stuckDonations.length} Stuck Donation(s)`,
      message: `${stuckDonations.length} donation(s) have been pending for over 1 hour`,
      count: stuckDonations.length,
      timestamp: stuckDonations[0].created_at,
      acknowledged: false,
    })
  }

  // Review donations alerts
  if (reviewDonations && reviewDonations.length > 0) {
    alerts.push({
      id: `review-${Date.now()}`,
      type: "review_required",
      severity: "info",
      title: `${reviewDonations.length} Donation(s) Need Review`,
      message: `${reviewDonations.length} donation(s) require manual review`,
      count: reviewDonations.length,
      timestamp: reviewDonations[0].created_at,
      acknowledged: false,
    })
  }

  // Receipt failures alerts
  if (receiptFailures.data && receiptFailures.data.length > 0) {
    alerts.push({
      id: `receipt-${Date.now()}`,
      type: "receipt_failures",
      severity: "error",
      title: `${receiptFailures.data.length} Receipt Failure(s)`,
      message: `${receiptFailures.data.length} receipt(s) failed to generate in the last 24 hours`,
      count: receiptFailures.data.length,
      timestamp: receiptFailures.data[0].created_at,
      acknowledged: false,
    })
  }

  // Email failures alerts
  if (emailFailures.data && emailFailures.data.length > 0) {
    alerts.push({
      id: `email-${Date.now()}`,
      type: "email_failures",
      severity: "error",
      title: `${emailFailures.data.length} Email Failure(s)`,
      message: `${emailFailures.data.length} email(s) failed to send in the last 24 hours`,
      count: emailFailures.data.length,
      timestamp: emailFailures.data[0].created_at,
      acknowledged: false,
    })
  }

  return {
    alerts,
    stuckDonations: stuckDonations || [],
    reviewDonations: reviewDonations || [],
    receiptFailures: receiptFailures.data || [],
    emailFailures: emailFailures.data || [],
  }
}

export default async function AlertsPage() {
  const supabase = await createClient()

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/admin/login")
  }

  const data = await getAlerts(supabase)

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Alerts <span className="font-normal">&</span> Notifications</h1>
        <p className="text-muted-foreground">
          Monitor and manage system alerts
        </p>
      </div>

      <AlertsClient data={data} />
    </div>
  )
}
