import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { FailedEmailsClient } from "./failed-emails-client"

export const metadata = {
  title: "Failed Emails | Admin",
  description: "Manage failed email send attempts",
}

export default async function FailedEmailsPage() {
  const supabase = await createClient()

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/admin/login")
  }

  // Fetch unresolved email failures with donation details
  const { data: failures, error } = await supabase
    .from("email_failures")
    .select(
      `
      *,
      donations (
        id,
        amount,
        currency,
        donor_name,
        donor_email,
        confirmed_at,
        payment_status,
        receipt_number
      )
    `
    )
    .is("resolved_at", null)
    .order("last_attempt_at", { ascending: false })

  if (error) {
    console.error("Error fetching email failures:", error)
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Failed Emails</h1>
        <p className="text-muted-foreground">
          Manage email send failures and resend manually
        </p>
      </div>

      <FailedEmailsClient failures={failures || []} />
    </div>
  )
}
