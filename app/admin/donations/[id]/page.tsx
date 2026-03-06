import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { TransactionDetailClient } from "../../../../components/admin/donations/transaction-detail-client"

async function checkFinancePermission() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: adminUser } = await supabase
    .from("admin_users")
    .select("role")
    .eq("user_id", user.id)
    .single()

  if (!adminUser) return null

  // Check if user has finance permission
  const hasFinanceAccess = ["SUPER_ADMIN", "ADMIN", "FINANCE"].includes(adminUser.role)
  if (!hasFinanceAccess) return null

  return adminUser.role as "SUPER_ADMIN" | "ADMIN" | "FINANCE" | "EDITOR"
}

async function getTransactionData(donationId: string) {
  const supabase = await createClient()

  // Fetch only the columns we need for the donation
  const { data: donation, error: donationError } = await supabase
    .from("donations")
    .select(
      `
      id,
      amount,
      currency,
      payment_status,
      provider,
      receipt_number,
      receipt_sent_at,
      created_at,
      confirmed_at,
      reviewed_at,
      reviewed_by,
      review_status,
      donor_name,
      donor_email,
      donor_phone,
      donor_message,
      payment_id,
      verification_id,
      is_monthly
    `
    )
    .eq("id", donationId)
    .single()

  if (donationError) {
    console.error("Error fetching donation:", donationError)
    return null
  }

  if (!donation) {
    console.error("Donation not found:", donationId)
    return null
  }

  // Fetch related data in parallel (with error handling for missing tables)
  const [reviewNotesResult, statusChangesResult, paymentEventsResult, paymentsResult] = await Promise.all([
    // Review notes with admin user info (may not exist yet)
    supabase
      .from("review_notes")
      .select(
        `
        id,
        note_text,
        created_at,
        admin_users!inner (
          full_name,
          email
        )
      `
      )
      .eq("donation_id", donationId)
      .order("created_at", { ascending: false })
      .then((res) => {
        if (res.error) console.warn("Review notes fetch error:", res.error)
        return res
      }),

    // Status change log with admin user info (may not exist yet)
    supabase
      .from("status_change_log")
      .select(
        `
        id,
        old_status,
        new_status,
        reason,
        created_at,
        admin_users!inner (
          full_name
        )
      `
      )
      .eq("donation_id", donationId)
      .order("created_at", { ascending: false })
      .then((res) => {
        if (res.error) console.warn("Status change log fetch error:", res.error)
        return res
      }),

    // Payment events - select all columns to avoid schema issues
    supabase
      .from("payment_events")
      .select("*")
      .eq("donation_id", donationId)
      .order("created_at", { ascending: false })
      .then((res) => {
        if (res.error) console.warn("Payment events fetch error:", res.error)
        return res
      }),

    // Payments table - fetch all Stripe references
    supabase
      .from("payments")
      .select(`
        transaction_id,
        payment_intent_id,
        session_id,
        subscription_id,
        customer_id,
        provider
      `)
      .eq("donation_id", donationId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()
      .then((res) => {
        if (res.error) console.warn("Payments fetch error:", res.error)
        return res
      }),
  ])

  // Get reviewed by admin name if exists
  let reviewedByName = null
  if (donation.reviewed_by) {
    const { data: reviewedBy } = await supabase
      .from("admin_users")
      .select("full_name")
      .eq("id", donation.reviewed_by)
      .single()
    reviewedByName = reviewedBy?.full_name || null
  }

  return {
    donation,
    reviewNotes: reviewNotesResult.data || [],
    statusChanges: statusChangesResult.data || [],
    paymentEvents: paymentEventsResult.data || [],
    paymentData: paymentsResult.data || null,
    reviewedByName,
  }
}

export default async function TransactionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  // Await params in Next.js 15+
  const { id } = await params

  const userRole = await checkFinancePermission()

  if (!userRole) {
    redirect("/admin")
  }

  const data = await getTransactionData(id)

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Transaction Not Found</h2>
          <p className="text-muted-foreground">
            The transaction you're looking for doesn't exist or you don't have permission to view
            it.
          </p>
        </div>
      </div>
    )
  }

  return <TransactionDetailClient data={data} userRole={userRole} />
}
