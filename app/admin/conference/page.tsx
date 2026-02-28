import Link from "next/link"
import { getConferenceRegistrations } from "@/lib/actions/conference-registration"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Users, Globe, UserCheck, TrendingUp, Settings, CreditCard } from "lucide-react"

export const metadata = {
  title: "Conference Registrations | Admin",
}

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
}

const AVATAR_COLORS = [
  "bg-blue-100 text-blue-700",
  "bg-purple-100 text-purple-700",
  "bg-orange-100 text-orange-700",
  "bg-green-100 text-green-700",
  "bg-red-100 text-red-700",
  "bg-pink-100 text-pink-700",
]

function avatarColor(name: string) {
  let hash = 0
  for (const c of name) hash = (hash + c.charCodeAt(0)) % AVATAR_COLORS.length
  return AVATAR_COLORS[hash]
}

function StatusBadge({ status }: { status: string }) {
  if (status === "confirmed")
    return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Confirmed</Badge>
  if (status === "cancelled")
    return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Cancelled</Badge>
  if (status === "expired")
    return <Badge className="bg-slate-100 text-slate-500 hover:bg-slate-100">Expired</Badge>
  if (status === "pending_payment")
    return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Pending Payment</Badge>
  return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Pending</Badge>
}

function PaymentBadge({ status }: { status?: string | null }) {
  if (status === "paid")
    return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-[10px] px-2">✓ Paid</Badge>
  if (status === "failed")
    return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 text-[10px] px-2">✗ Failed</Badge>
  if (status === "review")
    return <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 text-[10px] px-2">⚠ Review</Badge>
  if (!status || status === "unpaid")
    return <Badge className="bg-slate-100 text-slate-400 hover:bg-slate-100 text-[10px] px-2">— Unpaid</Badge>
  return null
}

export default async function ConferenceAdminPage() {
  const registrations = await getConferenceRegistrations()

  const total = registrations.length
  const inPerson = registrations.filter((r) => r.attendance_mode === "in-person").length
  const online = registrations.filter((r) => r.attendance_mode === "online").length
  const confirmed = registrations.filter((r) => r.status === "confirmed").length
  const unpaidPending = registrations.filter(
    (r) => (r.status === "pending_payment" || r.status === "pending") && r.payment_status !== "paid"
  ).length
  const inPersonPct = total > 0 ? Math.round((inPerson / total) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Conference Registrations</h1>
          <p className="text-sm text-muted-foreground">
            DEESSA National Conference 2026 — Oct 15–17
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/conference/settings"
            className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-all"
          >
            <Settings className="size-4" />
            Settings
          </Link>
          <a
            href="/api/admin/conference/export"
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary/90 transition-all"
          >
            <TrendingUp className="size-4" />
            Export to CSV
          </a>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">Total Registrations</p>
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Users className="size-4" />
              </div>
            </div>
            <p className="mt-2 text-3xl font-bold text-foreground">{total}</p>
            <p className="mt-1 text-xs text-muted-foreground">All time registrations</p>
          </CardContent>
        </Card>

        {/* In-Person vs Online */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">In-Person / Online</p>
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Globe className="size-4" />
              </div>
            </div>
            <p className="mt-2 text-3xl font-bold text-foreground">
              {inPerson} / {online}
            </p>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${inPersonPct}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Confirmed */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">Confirmed</p>
              <div className="flex size-9 items-center justify-center rounded-lg bg-green-100 text-green-600">
                <UserCheck className="size-4" />
              </div>
            </div>
            <p className="mt-2 text-3xl font-bold text-foreground">{confirmed}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {total > 0 ? Math.round((confirmed / total) * 100) : 0}% confirmation rate
            </p>
          </CardContent>
        </Card>

        {/* Unpaid / Awaiting Payment */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">Awaiting Payment</p>
              <div className="flex size-9 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                <CreditCard className="size-4" />
              </div>
            </div>
            <p className="mt-2 text-3xl font-bold text-foreground">{unpaidPending}</p>
            <p className="mt-1 text-xs text-muted-foreground">Payment not yet received</p>
          </CardContent>
        </Card>
      </div>

      {/* Registrations Table */}
      <Card>
        <CardHeader className="border-b border-border px-6 py-4">
          <CardTitle className="text-base font-bold">All Registrations</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Registered</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {registrations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-16 text-center text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <Users className="size-10 text-muted-foreground/40" />
                        <p className="font-medium">No registrations yet</p>
                        <p className="text-sm">Registrations will appear here once submitted.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  registrations.map((reg) => (
                    <TableRow
                      key={reg.id}
                      className="relative hover:bg-primary/5 transition-colors cursor-pointer"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {/* Invisible full-row overlay link — accessible & valid HTML */}
                          <Link
                            href={`/admin/conference/${reg.id}`}
                            className="absolute inset-0 z-0"
                            aria-label={`View ${reg.full_name}'s registration`}
                          />
                          <div
                            className={`relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${avatarColor(reg.full_name)}`}
                          >
                            {getInitials(reg.full_name)}
                          </div>
                          <span className="relative z-10 font-medium text-foreground">{reg.full_name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{reg.email}</TableCell>
                      <TableCell className="text-sm capitalize">
                        {reg.role?.replace("-", " ") || "—"}
                      </TableCell>
                      <TableCell>
                        {reg.attendance_mode ? (
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              reg.attendance_mode === "in-person"
                                ? "bg-primary/10 text-primary"
                                : "bg-muted text-foreground-muted"
                            }`}
                          >
                            {reg.attendance_mode === "in-person" ? "In-Person" : "Online"}
                          </span>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={reg.status} />
                      </TableCell>
                      <TableCell>
                        <PaymentBadge status={reg.payment_status} />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(reg.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Footer */}
          {registrations.length > 0 && (
            <div className="flex items-center justify-between border-t border-border px-6 py-3 text-xs text-muted-foreground">
              <p>Showing {registrations.length} registrations</p>
              {unpaidPending > 0 && (
                <p className="text-amber-600 font-medium">{unpaidPending} awaiting payment</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
