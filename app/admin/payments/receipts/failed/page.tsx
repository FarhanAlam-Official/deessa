import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { FailedReceiptsClient } from "./failed-receipts-client"

export const metadata = {
  title: "Failed Receipts | Admin",
  description: "Manage failed receipt generation attempts",
}

export default async function FailedReceiptsPage() {
  const supabase = await createClient()

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/admin/login")
  }

  // Fetch unresolved receipt failures with donation details
  const { data: failures, error } = await supabase
    .from("receipt_failures")
    .select(
      `
      *,
      donations (
        id,
        amount,
        currency,
        donor_name,
        donor_email,
        created_at,
        payment_status
      )
    `
    )
    .is("resolved_at", null)
    .order("last_attempt_at", { ascending: false })

  if (error) {
    console.error("Error fetching receipt failures:", error)
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Failed Receipts</h1>
        <p className="text-muted-foreground">
          Manage receipt generation failures and retry manually
        </p>
      </div>

      <FailedReceiptsClient failures={failures || []} />
    </div>
  )
}
