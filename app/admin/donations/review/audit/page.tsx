import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { canViewFinance, type AdminRole } from "@/lib/types/admin"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CheckCircle2, XCircle, Clock } from "lucide-react"
import { formatCurrency } from "@/lib/utils/currency"

export const metadata = {
  title: "Review Audit Trail | Admin",
  description: "View audit trail of all donation review actions",
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

async function getReviewAuditTrail() {
  const supabase = await createClient()

  // Fetch payment events for review actions
  const { data: events, error } = await supabase
    .from("payment_events")
    .select(`
      *,
      donations (
        id,
        amount,
        currency,
        donor_name,
        donor_email,
        payment_status
      )
    `)
    .in("event_type", ["review_approved", "review_rejected"])
    .order("created_at", { ascending: false })
    .limit(100)

  if (error) {
    console.error("Error fetching audit trail:", error)
    return []
  }

  return events || []
}

export default async function ReviewAuditPage() {
  const hasAccess = await checkFinancePermission()
  if (!hasAccess) {
    redirect("/admin")
  }

  const auditEvents = await getReviewAuditTrail()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Review Audit Trail</h1>
        <p className="text-muted-foreground">
          Complete history of all donation review actions
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Review Actions</CardTitle>
          <CardDescription>
            Showing last 100 review actions
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Action</TableHead>
                <TableHead>Donor</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Admin</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead>Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditEvents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No review actions recorded yet.
                  </TableCell>
                </TableRow>
              ) : (
                auditEvents.map((event) => {
                  const donation = event.donations
                  const payload = event.raw_payload as any
                  const isApproved = event.event_type === "review_approved"

                  return (
                    <TableRow key={event.id}>
                      <TableCell>
                        <Badge
                          variant={isApproved ? "default" : "destructive"}
                          className={isApproved ? "bg-green-600" : ""}
                        >
                          {isApproved ? (
                            <>
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Approved
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3 w-3 mr-1" />
                              Rejected
                            </>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {donation ? (
                          <div>
                            <p className="font-medium">{donation.donor_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {donation.donor_email}
                            </p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {donation ? (
                          <span className="font-medium">
                            {formatCurrency(donation.amount, donation.currency, {
                              showCode: true,
                            })}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p className="text-muted-foreground text-xs">
                            {payload?.admin_email || "Unknown"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm max-w-xs truncate" title={payload?.notes}>
                          {payload?.notes || "No notes"}
                        </p>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          {new Date(event.created_at).toLocaleString()}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
