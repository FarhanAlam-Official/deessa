import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { canViewFinance, type AdminRole } from "@/lib/types/admin"
import { ReviewDashboardClient } from "@/components/admin/donations/review-dashboard-client"
import { Button } from "@/components/ui/button"
import { FileText } from "lucide-react"
import Link from "next/link"

export const metadata = {
  title: "Review Donations | Admin",
  description: "Review and approve donations requiring manual verification",
}

async function checkFinancePermission() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return false

  const { data: adminUser } = await supabase
    .from("admin_users")
    .select("role")
    .eq("user_id", user.id)
    .single()

  if (!adminUser) return false

  return canViewFinance(adminUser.role as AdminRole)
}

async function getReviewDonations() {
  const supabase = await createClient()
  
  try {
    // Fetch donations in REVIEW status
    const { data: donations, error } = await supabase
      .from("donations")
      .select("*")
      .eq("payment_status", "review")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching review donations:", error)
      return []
    }

    // Fetch payment events for these donations separately
    if (donations && donations.length > 0) {
      const donationIds = donations.map(d => d.id)
      const { data: events } = await supabase
        .from("payment_events")
        .select("*")
        .in("donation_id", donationIds)
        .order("created_at", { ascending: false })

      // Attach events to donations
      const donationsWithEvents = donations.map(donation => ({
        ...donation,
        payment_events: events?.filter(e => e.donation_id === donation.id) || []
      }))

      return donationsWithEvents
    }

    return donations || []
  } catch (error) {
    console.error("Error in getReviewDonations:", error)
    return []
  }
}

export default async function ReviewDonationsPage() {
  const hasAccess = await checkFinancePermission()
  if (!hasAccess) {
    redirect("/admin")
  }

  const donations = await getReviewDonations()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Review Donations</h1>
          <p className="text-muted-foreground">
            Review and approve donations that require manual verification
          </p>
        </div>
        <Link href="/admin/donations/review/audit">
          <Button variant="outline">
            <FileText className="mr-2 h-4 w-4" />
            View Audit Trail
          </Button>
        </Link>
      </div>

      <ReviewDashboardClient donations={donations} />
    </div>
  )
}
