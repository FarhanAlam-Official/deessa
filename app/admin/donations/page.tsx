import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { ExternalLink, ShieldCheck, FileText } from "lucide-react"
import { canViewFinance, type AdminRole } from "@/lib/types/admin"
import Link from "next/link"
import { DonationsDashboard } from "../../../components/admin/donations/donations-table-client"

const PAGE_SIZE = 25

async function checkFinancePermission() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return false

  const { data: adminUser } = await supabase.from("admin_users").select("role").eq("user_id", user.id).single()

  if (!adminUser) return false

  return canViewFinance(adminUser.role as AdminRole)
}

async function getDonations() {
  const supabase = await createClient()
  const { data, count } = await supabase
    .from("donations")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(0, PAGE_SIZE - 1)
  return { donations: data || [], total: count || 0 }
}

async function getDonationStats() {
  const supabase = await createClient()

  const { data: donations } = await supabase.from("donations").select("amount, is_monthly, payment_status, currency")

  const totals = donations?.reduce((acc, d) => {
    if (d.payment_status === "completed") {
      const currency = d.currency || "NPR"
      acc[currency] = (acc[currency] || 0) + (d.amount || 0)
    }
    return acc
  }, {} as Record<string, number>) || {}

  const monthlyDonors = donations?.filter((d) => d.is_monthly && d.payment_status === "completed").length || 0
  const totalDonors = donations?.filter((d) => d.payment_status === "completed").length || 0
  const pendingCount = donations?.filter((d) => d.payment_status === "pending").length || 0
  const failedCount = donations?.filter((d) => d.payment_status === "failed").length || 0

  return { totals, monthlyDonors, totalDonors, pendingCount, failedCount }
}

export default async function DonationsPage() {
  const hasAccess = await checkFinancePermission()
  if (!hasAccess) {
    redirect("/admin")
  }

  const [{ donations, total }, stats] = await Promise.all([getDonations(), getDonationStats()])

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Donations</h1>
              <p className="text-sm text-muted-foreground">
                Track and manage all donation records
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/verify" className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              Verify Receipt
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/admin/donations/review" className="flex items-center gap-2">
              Review Donations
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </div>

      {/* ── Dashboard (stats + filters + table) ─────────────────────── */}
      <DonationsDashboard
        initialDonations={donations}
        initialTotal={total}
        initialStats={stats}
        pageSize={PAGE_SIZE}
      />
    </div>
  )
}
