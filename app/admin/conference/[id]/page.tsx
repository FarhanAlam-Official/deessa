import { notFound } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  Mail,
  Globe,
  Calendar,
  Shirt,
  Users,
  ChevronRight,
  MapPin,
  Clock,
  StickyNote,
} from "lucide-react"
import { getConferenceRegistration } from "@/lib/actions/conference-registration"
import { getConferenceSettings } from "@/lib/actions/conference-settings"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ConferenceStatusActions } from "@/components/admin/conference-status-actions"
import { ConferenceQuickActions } from "@/components/admin/conference-quick-actions"
import { ConferenceNotes } from "@/components/admin/conference-notes"
import { DeleteRegistrationButton } from "@/components/admin/delete-registration-button"

export const metadata = { title: "Registrant Detail | Admin" }

interface Props {
  params: Promise<{ id: string }>
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  if (status === "confirmed")
    return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-sm px-3 py-1">✓ Confirmed</Badge>
  if (status === "cancelled")
    return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 text-sm px-3 py-1">✗ Cancelled</Badge>
  if (status === "expired")
    return <Badge className="bg-slate-100 text-slate-500 hover:bg-slate-100 text-sm px-3 py-1">⌛ Expired</Badge>
  if (status === "pending_payment")
    return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 text-sm px-3 py-1">⏳ Pending Payment</Badge>
  return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 text-sm px-3 py-1">⏳ Pending</Badge>
}

function PaymentBadge({ status }: { status?: string }) {
  if (status === "paid")
    return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 px-3 py-1">✓ Paid</Badge>
  if (status === "failed")
    return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 px-3 py-1">✗ Failed</Badge>
  if (status === "review")
    return <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 px-3 py-1">⚠ Under Review</Badge>
  return <Badge className="bg-slate-100 text-slate-500 hover:bg-slate-100 px-3 py-1">— Unpaid</Badge>
}

function DetailRow({ label, value }: { label: string; value: string | string[] | null | undefined }) {
  if (!value || (Array.isArray(value) && value.length === 0)) {
    return (
      <div className="flex items-start justify-between gap-4 border-b border-border py-3 last:border-0">
        <p className="text-sm text-muted-foreground min-w-[160px]">{label}</p>
        <p className="text-sm text-muted-foreground">—</p>
      </div>
    )
  }
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border py-3 last:border-0">
      <p className="text-sm text-muted-foreground min-w-[160px]">{label}</p>
      {Array.isArray(value) ? (
        <div className="flex flex-wrap justify-end gap-1">
          {value.map((v, idx) => (
            <span key={`${v}-${idx}`} className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              {v}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-right text-sm font-medium text-foreground capitalize">{value}</p>
      )}
    </div>
  )
}

function daysUntil(target: Date): number {
  const now = new Date()
  const diff = target.getTime() - now.getTime()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

function formatTs(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default async function ConferenceRegistrantDetailPage({ params }: Props) {
  const { id } = await params
  const reg = await getConferenceRegistration(id)
  if (!reg) notFound()

  const cfg = await getConferenceSettings()
  const conferenceDate = new Date(`${cfg.dateStart}T00:00:00+05:45`)

  const shortId = `DEESSA-2026-${reg.id.slice(0, 6).toUpperCase()}`
  const registeredAt = new Date(reg.created_at).toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  })
  const registeredTime = new Date(reg.created_at).toLocaleTimeString("en-US", {
    hour: "2-digit", minute: "2-digit",
  })
  const initials = reg.full_name
    .split(" ")
    .slice(0, 2)
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()

  const days = daysUntil(conferenceDate)


  // Timeline events
  const timeline: { icon: string; label: string; ts: string; color: string }[] = [
    { icon: "📝", label: "Registration submitted", ts: formatTs(reg.created_at), color: "text-primary" },
    { icon: "📧", label: "Registration received email sent to attendee", ts: reg.last_registration_email_sent_at ? formatTs(reg.last_registration_email_sent_at) : formatTs(reg.created_at), color: "text-primary" },
  ]

  // Payment initiated via a real gateway
  if (reg.payment_provider && reg.payment_id && reg.payment_id !== "manual:admin-override") {
    const provider = reg.payment_provider.charAt(0).toUpperCase() + reg.payment_provider.slice(1)
    timeline.push({ icon: "💳", label: `Payment initiated via ${provider}`, ts: reg.payment_initiated_at ? formatTs(reg.payment_initiated_at) : "—", color: "text-amber-600" })
  }

  // Awaiting payment — show expiry deadline as timestamp
  if (
    (reg.status === "pending_payment" || reg.status === "pending") &&
    reg.payment_status !== "paid" &&
    reg.expires_at
  ) {
    timeline.push({
      icon: "⌛",
      label: "Awaiting payment",
      ts: `Expires ${new Date(reg.expires_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}`,
      color: "text-amber-500",
    })
  }

  // Payment failed
  if (reg.payment_status === "failed") {
    timeline.push({ icon: "❌", label: "Payment attempt failed", ts: reg.payment_failed_at ? formatTs(reg.payment_failed_at) : "—", color: "text-red-600" })
  }

  // Payment under review (amount / currency mismatch)
  if (reg.payment_status === "review") {
    timeline.push({ icon: "⚠️", label: "Payment flagged for review — amount or currency mismatch", ts: reg.payment_review_at ? formatTs(reg.payment_review_at) : "—", color: "text-purple-600" })
  }

  // Manual payment override by admin
  if (reg.payment_id === "manual:admin-override") {
    const by = reg.payment_override_by ? ` by ${reg.payment_override_by}` : ""
    timeline.push({ icon: "💰", label: `Payment manually marked as paid${by}`, ts: reg.payment_paid_at ? formatTs(reg.payment_paid_at) : "—", color: "text-green-600" })
  }

  // Payment verified via gateway webhook
  if (reg.payment_status === "paid" && reg.payment_id && reg.payment_id !== "manual:admin-override") {
    const provider = reg.payment_provider
      ? reg.payment_provider.charAt(0).toUpperCase() + reg.payment_provider.slice(1)
      : "Gateway"
    timeline.push({ icon: "✅", label: `Payment verified via ${provider}`, ts: reg.payment_paid_at ? formatTs(reg.payment_paid_at) : "—", color: "text-green-600" })
  }

  // Confirmed — use timestamp column so this persists even if later cancelled/re-confirmed
  if (reg.confirmed_at || reg.status === "confirmed") {
    timeline.push({ icon: "✅", label: "Registration confirmed by admin", ts: reg.confirmed_at ? formatTs(reg.confirmed_at) : "—", color: "text-green-600" })
    timeline.push({ icon: "📩", label: "Confirmation email sent to attendee", ts: reg.last_confirmation_email_sent_at ? formatTs(reg.last_confirmation_email_sent_at) : "—", color: "text-green-600" })
  }

  // Cancelled — use timestamp column so this persists even if later re-confirmed
  if (reg.cancelled_at || reg.status === "cancelled") {
    timeline.push({ icon: "❌", label: "Registration cancelled by admin", ts: reg.cancelled_at ? formatTs(reg.cancelled_at) : "—", color: "text-red-600" })
    timeline.push({ icon: "📩", label: "Cancellation email sent to attendee", ts: reg.last_cancellation_email_sent_at ? formatTs(reg.last_cancellation_email_sent_at) : "—", color: "text-red-600" })
  }

  // Expired (unpaid after deadline)
  if (reg.status === "expired") {
    timeline.push({
      icon: "⌛",
      label: "Registration expired — payment not received in time",
      ts: reg.expires_at ? formatTs(reg.expires_at) : "—",
      color: "text-slate-500",
    })
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/admin/conference" className="hover:text-foreground transition-colors flex items-center gap-1">
          <ArrowLeft className="size-4" />
          Conference
        </Link>
        <ChevronRight className="size-4" />
        <span className="font-medium text-foreground">{shortId}</span>
      </div>

      {/* ── Header Card ── */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-lg font-bold text-primary">
                {initials}
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">{reg.full_name}</h1>
                <p className="text-sm text-muted-foreground">{reg.email}</p>
                <p className="mt-1 font-mono text-xs text-muted-foreground">{shortId}</p>
                {reg.admin_notes && (
                  <p className="mt-1 text-xs text-amber-600 italic line-clamp-1">
                    📌 {reg.admin_notes}
                  </p>
                )}
              </div>
            </div>
            <div className="flex flex-col items-start gap-2 sm:items-end">
              <StatusBadge status={reg.status} />
              <p className="text-xs text-muted-foreground">
                Registered {registeredAt} at {registeredTime}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* ── Left Column ── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Personal Details */}
          <Card>
            <CardHeader className="border-b border-border px-6 py-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <Mail className="size-4 text-muted-foreground" />
                Personal Details
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 py-2">
              <DetailRow label="Full Name" value={reg.full_name} />
              <DetailRow label="Email Address" value={reg.email} />
              <DetailRow label="Phone" value={reg.phone} />
              <DetailRow label="Organization" value={reg.organization} />
            </CardContent>
          </Card>

          {/* Participation */}
          <Card>
            <CardHeader className="border-b border-border px-6 py-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <Globe className="size-4 text-muted-foreground" />
                Participation Details
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 py-2">
              <DetailRow label="Role" value={reg.role} />
              <DetailRow label="Attendance Mode" value={reg.attendance_mode} />
              <DetailRow label="Selected Workshops" value={reg.workshops} />
            </CardContent>
          </Card>

          {/* Additional Info */}
          <Card>
            <CardHeader className="border-b border-border px-6 py-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <Shirt className="size-4 text-muted-foreground" />
                Additional Information
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 py-2">
              <DetailRow label="Dietary Preference" value={reg.dietary_preference} />
              <DetailRow label="T-Shirt Size" value={reg.tshirt_size} />
              <DetailRow label="Heard Via" value={reg.heard_via} />
              <DetailRow label="Emergency Contact" value={reg.emergency_contact_name} />
              <DetailRow label="Emergency Phone" value={reg.emergency_contact_phone} />
            </CardContent>
          </Card>

          {/* Consent */}
          <Card>
            <CardHeader className="border-b border-border px-6 py-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="size-4 text-muted-foreground" />
                Consent & Privacy
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 py-2">
              <DetailRow label="Terms & Conditions" value={reg.consent_terms ? "Agreed" : "Not agreed"} />
              <DetailRow label="Newsletter Consent" value={reg.consent_newsletter ? "Yes" : "No"} />
            </CardContent>
          </Card>

          {/* ── Phase 3: Activity Timeline ── */}
          <Card>
            <CardHeader className="border-b border-border px-6 py-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="size-4 text-muted-foreground" />
                Activity Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="relative flex flex-col gap-0">
                {timeline.map((event, i) => (
                  <div key={i} className="flex gap-4">
                    {/* Vertical line + dot */}
                    <div className="flex flex-col items-center">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-base">
                        {event.icon}
                      </div>
                      {i < timeline.length - 1 && (
                        <div className="w-px flex-1 bg-border my-1" />
                      )}
                    </div>
                    {/* Content */}
                    <div className="pb-5 pt-1">
                      <p className={`text-sm font-medium ${event.color}`}>{event.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{event.ts}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Right Column ── */}
        <div className="space-y-6">

          {/* Manage Registration */}
          <Card>
            <CardHeader className="border-b border-border px-6 py-4">
              <CardTitle className="text-base">Manage Registration</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="mb-4 rounded-xl bg-muted/50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Current Status</p>
                <StatusBadge status={reg.status} />
              </div>
              <ConferenceStatusActions
                registrationId={reg.id}
                currentStatus={reg.status}
                paymentStatus={reg.payment_status ?? "unpaid"}
                fullName={reg.full_name}
                email={reg.email}
              />

              {/* Danger Zone */}
              <div className="mt-6 border-t border-border pt-5">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Danger Zone</p>
                <DeleteRegistrationButton
                  registrationId={reg.id}
                  shortId={shortId}
                  fullName={reg.full_name}
                  email={reg.email}
                  status={reg.status}
                />
              </div>
            </CardContent>
          </Card>

          {/* ── Payment Info ── */}
          {(reg.payment_status || reg.payment_amount) && (
            <Card>
              <CardHeader className="border-b border-border px-6 py-4">
                <CardTitle className="text-base">Payment Information</CardTitle>
              </CardHeader>
              <CardContent className="px-6 py-2">
                <div className="flex items-start justify-between gap-4 border-b border-border py-3">
                  <p className="text-sm text-muted-foreground min-w-[160px]">Payment Status</p>
                  <PaymentBadge status={reg.payment_status} />
                </div>
                <DetailRow label="Amount" value={reg.payment_amount ? `${reg.payment_currency || "NPR"} ${(Number.isFinite(Number(reg.payment_amount)) ? Number(reg.payment_amount).toLocaleString() : reg.payment_amount)}` : null} />
                <DetailRow label="Provider" value={reg.payment_provider} />
                {reg.payment_id && (
                  <div className="flex flex-col gap-1 border-b border-border py-3">
                    <p className="text-sm text-muted-foreground">Payment ID</p>
                    <p
                      className="font-mono text-xs text-foreground break-all cursor-text select-all rounded-lg bg-muted/50 px-3 py-2 leading-relaxed"
                      title="Click to select all"
                    >
                      {reg.payment_id}
                    </p>
                  </div>
                )}
                {reg.expires_at && reg.payment_status !== "paid" && (
                  <DetailRow
                    label="Payment Expires"
                    value={new Date(reg.expires_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  />
                )}
                {reg.payment_override_by && (
                  <DetailRow label="Override By" value={reg.payment_override_by} />
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="border-b border-border px-6 py-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="size-4 text-muted-foreground" />
                Event Info
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {/* Conference details */}
              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-start gap-3 rounded-xl bg-primary/5 p-3">
                  <Calendar className="size-4 shrink-0 text-primary mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Dates</p>
                    <p className="text-sm font-medium text-foreground">{cfg.dateDisplay}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-xl bg-primary/5 p-3">
                  <MapPin className="size-4 shrink-0 text-primary mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Venue</p>
                    <p className="text-sm font-medium text-foreground">{cfg.venue}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-xl bg-amber-50 border border-amber-100 p-3">
                  <Clock className="size-4 shrink-0 text-amber-600 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-amber-700/70">Countdown</p>
                    <p className="text-sm font-bold text-amber-700">
                      {days > 0 ? `${days} days to go` : "Event has started!"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Quick Actions</p>
                <ConferenceQuickActions
                  registrationId={reg.id}
                  shortId={shortId}
                  email={reg.email}
                  fullName={reg.full_name}
                  status={reg.status}
                />
              </div>
            </CardContent>
          </Card>

          {/* ── Phase 2: Admin Notes ── */}
          <Card>
            <CardHeader className="border-b border-border px-6 py-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <StickyNote className="size-4 text-muted-foreground" />
                Admin Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ConferenceNotes
                registrationId={reg.id}
                initialNotes={reg.admin_notes ?? null}
              />
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  )
}
