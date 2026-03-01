"use client"

import { useState } from "react"
import { Save, Loader2, Calendar, Mail, Info, Bell, Navigation, Plus, Trash2, GripVertical, Star, CreditCard } from "lucide-react"
import { notifications } from "@/lib/notifications"
import { updateConferenceSettings } from "@/lib/actions/conference-settings"
import type { ConferenceSettings, AgendaItem } from "@/lib/conference-settings-defaults"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface ConferenceSettingsFormProps {
  settings: ConferenceSettings
}

const TEMPLATE_TABS = [
  { key: "general" as const, label: "General Info", icon: Info },
  { key: "reminder" as const, label: "Reminder", icon: Bell },
  { key: "directions" as const, label: "Directions", icon: Navigation },
]

const TOKENS = [
  { token: "{{name}}", desc: "Attendee full name" },
  { token: "{{registrationId}}", desc: "Registration ID" },
  { token: "{{attendanceMode}}", desc: "In-Person or Online" },
  { token: "{{venue}}", desc: "Conference venue" },
  { token: "{{venueAddress}}", desc: "Full venue address" },
  { token: "{{dateDisplay}}", desc: "Human-readable dates" },
  { token: "{{contactEmail}}", desc: "Contact email address" },
  { token: "{{mapsUrl}}", desc: "Google Maps link" },
]

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-foreground">{label}</label>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {children}
    </div>
  )
}

const inputCls =
  "w-full rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"

export function ConferenceSettingsForm({ settings }: ConferenceSettingsFormProps) {
  // ── Event Details state ───────────────────────────────────────────────────
  const [details, setDetails] = useState({
    name: settings.name,
    dateDisplay: settings.dateDisplay,
    dateStart: settings.dateStart,
    dateEnd: settings.dateEnd,
    venue: settings.venue,
    venueAddress: settings.venueAddress,
    mapsUrl: settings.mapsUrl,
    contactEmail: settings.contactEmail,
    registrationDeadline: settings.registrationDeadline,
  })
  const [savingDetails, setSavingDetails] = useState(false)

  // ── Payment state ─────────────────────────────────────────────────────────
  const [payment, setPayment] = useState<{
    registrationFeeEnabled: boolean
    registrationFee: number
    registrationFeeCurrency: "NPR" | "USD" | "EUR" | "GBP" | "INR"
    registrationFeeByMode: Record<string, number | null>
    registrationExpiryHours: number
  }>({
    registrationFeeEnabled: settings.registrationFeeEnabled ?? false,
    registrationFee: settings.registrationFee ?? 0,
    registrationFeeCurrency: (settings.registrationFeeCurrency ?? "NPR") as
      | "NPR"
      | "USD"
      | "EUR"
      | "GBP"
      | "INR",
    registrationFeeByMode: (settings.registrationFeeByMode ?? {}) as Record<string, number | null>,
    registrationExpiryHours: settings.registrationExpiryHours ?? 24,
  })
  const [savingPayment, setSavingPayment] = useState(false)

  // ── Agenda state ──────────────────────────────────────────────────────────
  const [agenda, setAgenda] = useState<AgendaItem[]>(settings.agenda)
  const [savingAgenda, setSavingAgenda] = useState(false)

  // ── Template state ────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<"general" | "reminder" | "directions">("general")
  const [templates, setTemplates] = useState(settings.emailTemplates)
  const [savingTemplate, setSavingTemplate] = useState(false)

  // ── Payment handler ───────────────────────────────────────────────────────
  const handleSavePayment = async () => {
    setSavingPayment(true)
    // Strip null overrides — only include keys that have a positive number value
    const cleanByMode: Record<string, number> = {}
    const byMode = payment.registrationFeeByMode ?? {}
    if (typeof byMode.inPerson === "number" && byMode.inPerson >= 0) cleanByMode.inPerson = byMode.inPerson
    if (typeof byMode.online === "number" && byMode.online >= 0) cleanByMode.online = byMode.online

    const settingsToSave = {
      registrationFeeEnabled: payment.registrationFeeEnabled,
      registrationFee: Number.isFinite(payment.registrationFee) ? payment.registrationFee : 0,
      registrationFeeCurrency: payment.registrationFeeCurrency as
        | "NPR"
        | "USD"
        | "EUR"
        | "GBP"
        | "INR",
      registrationFeeByMode: cleanByMode,
      registrationExpiryHours: Number.isFinite(payment.registrationExpiryHours) ? payment.registrationExpiryHours : 24,
    }

    const result = await updateConferenceSettings(settingsToSave)
    setSavingPayment(false)
    result.success
      ? notifications.showSuccess({ title: "Payment settings saved ✓", description: "Fee configuration updated." })
      : notifications.showError({ title: "Save failed", description: result.error || "Please try again." })
  }

  // ── Event Details handlers ────────────────────────────────────────────────
  const handleSaveDetails = async () => {
    setSavingDetails(true)
    const result = await updateConferenceSettings(details)
    setSavingDetails(false)
    result.success
      ? notifications.showSuccess({ title: "Settings saved ✓", description: "Conference details have been updated." })
      : notifications.showError({ title: "Save failed", description: result.error || "Please try again." })
  }

  // ── Agenda handlers ───────────────────────────────────────────────────────
  const updateAgendaItem = (idx: number, field: keyof AgendaItem, value: string | boolean) => {
    setAgenda((prev) => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item))
  }

  const addAgendaItem = () => {
    setAgenda((prev) => [
      ...prev,
      {
        id: `agenda-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        time: "",
        title: "New Session",
        desc: "",
        active: false,
      },
    ])
  }

  const removeAgendaItem = (idx: number) => {
    setAgenda((prev) => prev.filter((_, i) => i !== idx))
  }

  const moveAgendaItem = (idx: number, dir: -1 | 1) => {
    const next = [...agenda]
    const swap = idx + dir
    if (swap < 0 || swap >= next.length) return
    ;[next[idx], next[swap]] = [next[swap], next[idx]]
    setAgenda(next)
  }

  const handleSaveAgenda = async () => {
    setSavingAgenda(true)
    const result = await updateConferenceSettings({ agenda })
    setSavingAgenda(false)
    result.success
      ? notifications.showSuccess({ title: "Agenda saved ✓", description: "Schedule has been updated." })
      : notifications.showError({ title: "Save failed", description: result.error || "Please try again." })
  }

  // ── Template handlers ─────────────────────────────────────────────────────
  const handleSaveTemplate = async () => {
    setSavingTemplate(true)
    const result = await updateConferenceSettings({ emailTemplates: templates })
    setSavingTemplate(false)
    result.success
      ? notifications.showSuccess({ title: "Template saved ✓", description: `${activeTab} email template updated.` })
      : notifications.showError({ title: "Save failed", description: result.error || "Please try again." })
  }

  const updateTemplate = (
    type: "general" | "reminder" | "directions",
    field: "subject" | "body",
    value: string,
  ) => {
    setTemplates((t) => ({ ...t, [type]: { ...t[type], [field]: value } }))
  }

  return (
    <div className="space-y-8">
      {/* ── Event Details ── */}
      <Card>
        <CardHeader className="border-b border-border px-6 py-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="size-4 text-muted-foreground" />
            Event Details
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field label="Conference Name" hint="Shown in emails and admin pages">
              <input
                type="text"
                className={inputCls}
                value={details.name}
                onChange={(e) => setDetails((d) => ({ ...d, name: e.target.value }))}
                placeholder="e.g. DEESSA National Conference 2026"
              />
            </Field>

            <Field label='Date (Display)' hint='Human-readable, e.g. "Oct 15–17, 2026"'>
              <input
                type="text"
                className={inputCls}
                value={details.dateDisplay}
                onChange={(e) => setDetails((d) => ({ ...d, dateDisplay: e.target.value }))}
                placeholder="Oct 15–17, 2026"
              />
            </Field>

            <Field label="Start Date" hint="ISO format, used for countdown & calendar links">
              <input
                type="date"
                className={inputCls}
                value={details.dateStart}
                onChange={(e) => setDetails((d) => ({ ...d, dateStart: e.target.value }))}
              />
            </Field>

            <Field label="End Date" hint="Used for calendar links">
              <input
                type="date"
                className={inputCls}
                value={details.dateEnd}
                onChange={(e) => setDetails((d) => ({ ...d, dateEnd: e.target.value }))}
              />
            </Field>

            <Field label="Venue" hint="Short venue name shown in cards and emails">
              <input
                type="text"
                className={inputCls}
                value={details.venue}
                onChange={(e) => setDetails((d) => ({ ...d, venue: e.target.value }))}
                placeholder="Hyatt Regency, Kathmandu, Nepal"
              />
            </Field>

            <Field label="Full Venue Address" hint="Used in directions email and detail page">
              <input
                type="text"
                className={inputCls}
                value={details.venueAddress}
                onChange={(e) => setDetails((d) => ({ ...d, venueAddress: e.target.value }))}
                placeholder="Taragaon, Bouddha, Kathmandu, Nepal"
              />
            </Field>

            <Field label="Google Maps URL" hint="Shown as 'Open in Google Maps' link on the conference page">
              <input
                type="url"
                className={inputCls}
                value={details.mapsUrl}
                onChange={(e) => setDetails((d) => ({ ...d, mapsUrl: e.target.value }))}
                placeholder="https://maps.app.goo.gl/..."
              />
            </Field>

            <Field label="Contact Email" hint="Shown in email footers and template links">
              <input
                type="email"
                className={inputCls}
                value={details.contactEmail}
                onChange={(e) => setDetails((d) => ({ ...d, contactEmail: e.target.value }))}
                placeholder="conference@deessa.org.np"
              />
            </Field>

            <Field
              label="Registration Deadline"
              hint='Plain text, e.g. "October 1st, 2026" — shown in cancellation emails and the conference page'
            >
              <input
                type="text"
                className={inputCls}
                value={details.registrationDeadline}
                onChange={(e) => setDetails((d) => ({ ...d, registrationDeadline: e.target.value }))}
                placeholder="October 1st, 2026"
              />
            </Field>
          </div>

          <div className="mt-6 flex justify-end">
            <Button onClick={handleSaveDetails} disabled={savingDetails} className="gap-2">
              {savingDetails ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              {savingDetails ? "Saving…" : "Save Event Details"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Payment Configuration ── */}
      <Card>
        <CardHeader className="border-b border-border px-6 py-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <CreditCard className="size-4 text-muted-foreground" />
            Payment Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <p className="mb-5 text-xs text-muted-foreground">
            When enabled, registrants must complete payment before their spot is confirmed.
            Unpaid registrations expire automatically after the window below.
          </p>

          {/* Enable/Disable toggle */}
          <div className="mb-5 flex items-center justify-between rounded-xl border border-border bg-muted/30 px-5 py-4">
            <div>
              <p className="text-sm font-semibold text-foreground">Require Registration Fee</p>
              <p className="text-xs text-muted-foreground">
                {payment.registrationFeeEnabled
                  ? "Registrations require payment to be confirmed."
                  : "Conference is free — no payment required."}
              </p>
            </div>
            <button
              onClick={() => setPayment((p) => ({ ...p, registrationFeeEnabled: !p.registrationFeeEnabled }))}
              onKeyDown={(e) => {
                if (e.key === " " || e.key === "Enter") {
                  setPayment((p) => ({ ...p, registrationFeeEnabled: !p.registrationFeeEnabled }))
                  if (e.key === " ") e.preventDefault()
                }
              }}
              tabIndex={0}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus:outline-none ${
                payment.registrationFeeEnabled ? "bg-primary" : "bg-muted-foreground/30"
              }`}
              role="switch"
              aria-checked={payment.registrationFeeEnabled}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                  payment.registrationFeeEnabled ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* ── Currency selector (always visible, short row) ── */}
          <div className="mb-5">
            <label className="mb-1.5 block text-sm font-semibold text-foreground">Currency</label>
            <p className="mb-2 text-xs text-muted-foreground">All fees are charged in this currency.</p>
            <select
              value={payment.registrationFeeCurrency}
              onChange={(e) =>
                setPayment((p) => ({
                  ...p,
                  registrationFeeCurrency: e.target.value as
                    | "NPR"
                    | "USD"
                    | "EUR"
                    | "GBP"
                    | "INR",
                }))
              }
              className="w-44 rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-sm text-foreground focus:border-primary focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            >
              <option value="NPR">NPR — Nepali Rupee</option>
              <option value="USD">USD — US Dollar</option>
              <option value="EUR">EUR — Euro</option>
              <option value="GBP">GBP — British Pound</option>
              <option value="INR">INR — Indian Rupee</option>
            </select>
          </div>

          <div
            className={`grid grid-cols-1 gap-5 sm:grid-cols-2 transition-opacity ${
              payment.registrationFeeEnabled ? "opacity-100" : "pointer-events-none opacity-40"
            }`}
          >
            {/* ── Default fee — dedicated full-width style input with prefix ── */}
            <Field label="Default Registration Fee" hint="Charged when no per-mode override is set">
              <div className="relative flex items-center">
                <span className="absolute left-0 flex h-full w-14 items-center justify-center rounded-l-xl border border-r-0 border-border bg-muted text-xs font-bold text-muted-foreground select-none">
                  {payment.registrationFeeCurrency}
                </span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  className="w-full rounded-xl border border-border bg-muted/30 pl-16 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  value={payment.registrationFee > 0 ? payment.registrationFee : ""}
                  onChange={(e) => {
                    const raw = e.target.value
                    const n = raw === "" ? 0 : Number(raw)
                    setPayment((p) => ({ ...p, registrationFee: Number.isFinite(n) && n >= 0 ? n : p.registrationFee }))
                  }}
                  placeholder="e.g. 2500"
                />
              </div>
            </Field>

            <Field
              label="Payment Window (hours)"
              hint="Unpaid registrations expire after this many hours (default: 24)"
            >
              <input
                type="number"
                min="1"
                max="168"
                step="1"
                className={inputCls}
                value={payment.registrationExpiryHours}
                onChange={(e) => setPayment((p) => ({ ...p, registrationExpiryHours: Number(e.target.value) }))}
                placeholder="24"
              />
            </Field>

            <Field
              label="In-Person Fee Override"
              hint="Leave blank to use the default fee above"
            >
              <div className="relative flex items-center">
                <span className="absolute left-0 flex h-full w-14 items-center justify-center rounded-l-xl border border-r-0 border-border bg-muted text-xs font-bold text-muted-foreground select-none">
                  {payment.registrationFeeCurrency}
                </span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  className="w-full rounded-xl border border-border bg-muted/30 pl-16 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  value={payment.registrationFeeByMode?.inPerson != null ? payment.registrationFeeByMode.inPerson : ""}
                  onChange={(e) =>
                    setPayment((p) => ({
                      ...p,
                      registrationFeeByMode: {
                        ...p.registrationFeeByMode,
                        inPerson: e.target.value === "" ? null : Number(e.target.value),
                      },
                    }))
                  }
                  placeholder={`Default (${payment.registrationFee || "not set"})`}
                />
              </div>
            </Field>

            <Field
              label="Online Fee Override"
              hint="Leave blank to use the default fee above"
            >
              <div className="relative flex items-center">
                <span className="absolute left-0 flex h-full w-14 items-center justify-center rounded-l-xl border border-r-0 border-border bg-muted text-xs font-bold text-muted-foreground select-none">
                  {payment.registrationFeeCurrency}
                </span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  className="w-full rounded-xl border border-border bg-muted/30 pl-16 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  value={payment.registrationFeeByMode?.online != null ? payment.registrationFeeByMode.online : ""}
                  onChange={(e) =>
                    setPayment((p) => ({
                      ...p,
                      registrationFeeByMode: {
                        ...p.registrationFeeByMode,
                        online: e.target.value === "" ? null : Number(e.target.value),
                      },
                    }))
                  }
                  placeholder={`Default (${payment.registrationFee || "not set"})`}
                />
              </div>
            </Field>
          </div>

          <div className="mt-6 flex justify-end">
            <Button onClick={handleSavePayment} disabled={savingPayment} className="gap-2">
              {savingPayment ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              {savingPayment ? "Saving…" : "Save Payment Settings"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Agenda / Timeline ── */}
      <Card>
        <CardHeader className="border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <GripVertical className="size-4 text-muted-foreground" />
              Agenda / Timeline
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={addAgendaItem}
              className="gap-2"
            >
              <Plus className="size-3.5" />
              Add Item
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <p className="mb-4 text-xs text-muted-foreground">
            This is the schedule displayed in the &quot;Snapshot Agenda&quot; on the public conference page. Use the arrows to reorder items. Mark one item as <strong>highlighted</strong> to display it with a primary colour accent.
          </p>

          {agenda.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
              <GripVertical className="mb-2 size-8 opacity-30" />
              No agenda items yet. Click &quot;Add Item&quot; to get started.
            </div>
          )}

          <div className="flex flex-col gap-3">
            {agenda.map((item, idx) => (
              <div
                key={item.id}
                className={`rounded-xl border p-4 transition-colors ${
                  item.active ? "border-primary/30 bg-primary/5" : "border-border bg-muted/20"
                }`}
              >
                <div className="flex items-center gap-2 mb-3">
                  {/* Move buttons */}
                  <div className="flex flex-col gap-0.5">
                    <button
                      onClick={() => moveAgendaItem(idx, -1)}
                      disabled={idx === 0}
                      className="flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-muted disabled:opacity-30 text-xs"
                      title="Move up"
                    >
                      ▲
                    </button>
                    <button
                      onClick={() => moveAgendaItem(idx, 1)}
                      disabled={idx === agenda.length - 1}
                      className="flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-muted disabled:opacity-30 text-xs"
                      title="Move down"
                    >
                      ▼
                    </button>
                  </div>

                  {/* Item number */}
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                    {idx + 1}
                  </div>

                  <div className="flex flex-1 items-center gap-2 min-w-0">
                    {/* Time */}
                    <input
                      type="text"
                      value={item.time}
                      onChange={(e) => updateAgendaItem(idx, "time", e.target.value)}
                      placeholder="09:00 AM"
                      className="w-28 shrink-0 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-mono text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
                    />
                    {/* Title */}
                    <input
                      type="text"
                      value={item.title}
                      onChange={(e) => updateAgendaItem(idx, "title", e.target.value)}
                      placeholder="Session title"
                      className="flex-1 min-w-0 rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
                    />
                  </div>

                  {/* Highlight toggle */}
                  <button
                    onClick={() => updateAgendaItem(idx, "active", !item.active)}
                    title={item.active ? "Remove highlight" : "Set as highlighted item"}
                    className={`flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
                      item.active
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <Star className={`size-4 ${item.active ? "fill-primary" : ""}`} />
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => removeAgendaItem(idx)}
                    title="Remove item"
                    className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>

                {/* Description */}
                <div className="ml-[3.75rem]">
                  <input
                    type="text"
                    value={item.desc}
                    onChange={(e) => updateAgendaItem(idx, "desc", e.target.value)}
                    placeholder="Short description of this session…"
                    className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={addAgendaItem}
              className="gap-2"
            >
              <Plus className="size-3.5" />
              Add Another Item
            </Button>
            <Button onClick={handleSaveAgenda} disabled={savingAgenda} className="gap-2">
              {savingAgenda ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              {savingAgenda ? "Saving…" : "Save Agenda"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Email Templates ── */}
      <Card>
        <CardHeader className="border-b border-border px-6 py-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Mail className="size-4 text-muted-foreground" />
            Email Templates
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {/* Tabs */}
          <div className="flex gap-1 rounded-xl bg-muted p-1 mb-6">
            {TEMPLATE_TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                  activeTab === key
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="size-3.5" />
                {label}
              </button>
            ))}
          </div>

          {/* Template editor */}
          <div className="flex flex-col gap-4">
            <Field label="Subject">
              <input
                type="text"
                className={inputCls}
                value={templates[activeTab].subject}
                onChange={(e) => updateTemplate(activeTab, "subject", e.target.value)}
              />
            </Field>

            <Field label="Message Body" hint="Sent as plain text wrapped in the DEESSA branded template">
              <textarea
                rows={12}
                className={`${inputCls} resize-y font-mono text-xs leading-relaxed`}
                value={templates[activeTab].body}
                onChange={(e) => updateTemplate(activeTab, "body", e.target.value)}
              />
            </Field>
          </div>

          {/* Token reference */}
          <div className="mt-5 rounded-xl border border-border bg-muted/30 p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Available Placeholder Tokens
            </p>
            <div className="flex flex-wrap gap-2">
              {TOKENS.map(({ token, desc }) => (
                <div key={token} className="flex items-center gap-1.5 rounded-lg bg-background border border-border px-2.5 py-1.5">
                  <code className="text-xs font-mono text-primary">{token}</code>
                  <span className="text-xs text-muted-foreground">{desc}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Button onClick={handleSaveTemplate} disabled={savingTemplate} className="gap-2">
              {savingTemplate ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              {savingTemplate ? "Saving…" : `Save ${TEMPLATE_TABS.find((t) => t.key === activeTab)?.label} Template`}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
