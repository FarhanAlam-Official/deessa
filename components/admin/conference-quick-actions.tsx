"use client"

import { useState } from "react"
import { Copy, Check, RefreshCw, Loader2, Mail, Send, X, Bell, MapPin, Info } from "lucide-react"
import { notifications } from "@/lib/notifications"
import {
  resendConferenceRegistrationEmail,
  resendConferenceConfirmationEmail,
  sendCustomConferenceEmail,
  sendTemplateConferenceEmail,
} from "@/lib/actions/conference-registration"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface ConferenceQuickActionsProps {
  registrationId: string
  shortId: string
  email: string
  fullName: string
  status: string
}

type TemplateType = "general" | "reminder" | "directions"

const TEMPLATES: { type: TemplateType; label: string; description: string; icon: React.ReactNode }[] = [
  {
    type: "general",
    label: "General Info",
    description: "Conference dates, venue & registration ID",
    icon: <Info className="size-4 shrink-0 text-muted-foreground" />,
  },
  {
    type: "reminder",
    label: "Send Reminder",
    description: "Upcoming event reminder with travel tips",
    icon: <Bell className="size-4 shrink-0 text-muted-foreground" />,
  },
  {
    type: "directions",
    label: "Send Directions",
    description: "Venue address, maps & how to get there",
    icon: <MapPin className="size-4 shrink-0 text-muted-foreground" />,
  },
]

export function ConferenceQuickActions({
  registrationId,
  shortId,
  email,
  fullName,
  status,
}: ConferenceQuickActionsProps) {
  const [copied, setCopied] = useState(false)
  const [resending, setResending] = useState<"registration" | "confirmation" | null>(null)
  const [sendingTemplate, setSendingTemplate] = useState<TemplateType | null>(null)
  const [showCompose, setShowCompose] = useState(false)
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [sending, setSending] = useState(false)

  // ── Copy ID ──────────────────────────────────────────────────────────────────
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shortId)
      setCopied(true)
      notifications.showSuccess({ title: "Copied!", description: `${shortId} copied to clipboard.` })
      setTimeout(() => setCopied(false), 2000)
    } catch {
      notifications.showError({ title: "Copy failed", description: "Could not access clipboard." })
    }
  }

  // ── Re-send emails ────────────────────────────────────────────────────────────
  const handleResendRegistration = async () => {
    setResending("registration")
    try {
      const result = await resendConferenceRegistrationEmail(registrationId)
      if (result.success) {
        notifications.showSuccess({ title: "Email re-sent ✓", description: `Registration email sent to ${email}.` })
      } else {
        notifications.showError({ title: "Failed to send", description: result.error || "Something went wrong." })
      }
    } catch (err: any) {
      notifications.showError({ title: "Failed to send", description: err?.message || String(err) || "Something went wrong." })
    } finally {
      setResending(null)
    }
  }

  const handleResendConfirmation = async () => {
    setResending("confirmation")
    try {
      const result = await resendConferenceConfirmationEmail(registrationId)
      if (result.success) {
        notifications.showSuccess({ title: "Email re-sent ✓", description: `Confirmation email sent to ${email}.` })
      } else {
        notifications.showError({ title: "Failed to send", description: result.error || "Something went wrong." })
      }
    } catch (err: any) {
      notifications.showError({ title: "Failed to send", description: err?.message || String(err) || "Something went wrong." })
    } finally {
      setResending(null)
    }
  }

  // ── Template send ─────────────────────────────────────────────────────────────
  const handleSendTemplate = async (type: TemplateType) => {
    setSendingTemplate(type)
    try {
      const result = await sendTemplateConferenceEmail(registrationId, type)
      const template = TEMPLATES.find((t) => t.type === type)!
      if (result.success) {
        notifications.showSuccess({
          title: `${template.label} sent ✓`,
          description: `Email sent to ${email}.`,
        })
      } else {
        notifications.showError({ title: "Failed to send", description: result.error || "Something went wrong." })
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      notifications.showError({ title: "Failed to send", description: message || "Something went wrong." })
    } finally {
      setSendingTemplate(null)
    }
  }
  // ── Custom email ──────────────────────────────────────────────────────────────
  const handleSendCustom = async () => {
    if (!subject.trim() || !body.trim()) {
      notifications.showError({ title: "Missing fields", description: "Subject and message body are required." })
      return
    }
    setSending(true)
    try {
      const result = await sendCustomConferenceEmail(registrationId, subject, body)
      if (result.success) {
        notifications.showSuccess({ title: "Email sent ✓", description: `Custom email sent to ${email}.` })
        setShowCompose(false)
        setSubject("")
        setBody("")
      } else {
        notifications.showError({ title: "Failed to send", description: result.error || "Something went wrong." })
      }
    } catch (err: any) {
      notifications.showError({ title: "Failed to send", description: err?.message || String(err) || "Something went wrong." })
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      {/* ── Quick Actions ── */}
      <div className="flex flex-col gap-2">
        {/* Copy Registration ID */}
        <button
          onClick={handleCopy}
          className="flex w-full items-center gap-3 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          {copied
            ? <Check className="size-4 shrink-0 text-green-600" />
            : <Copy className="size-4 shrink-0 text-muted-foreground" />}
          <span className="flex-1 text-left">{copied ? "Copied!" : "Copy Registration ID"}</span>
          <span className="font-mono text-xs text-muted-foreground">{shortId}</span>
        </button>

        {/* Re-send Registration Email — pending only */}
        {status === "pending" && (
          <button
            onClick={handleResendRegistration}
            disabled={resending === "registration"}
            className="flex w-full items-center gap-3 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-60"
          >
            {resending === "registration"
              ? <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />
              : <RefreshCw className="size-4 shrink-0 text-muted-foreground" />}
            Re-send Registration Email
          </button>
        )}

        {/* Re-send Confirmation Email — confirmed only */}
        {status === "confirmed" && (
          <button
            onClick={handleResendConfirmation}
            disabled={resending === "confirmation"}
            className="flex w-full items-center gap-3 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-60"
          >
            {resending === "confirmation"
              ? <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />
              : <RefreshCw className="size-4 shrink-0 text-muted-foreground" />}
            Re-send Confirmation Email
          </button>
        )}

        {/* Compose Custom Email */}
        <button
          onClick={() => setShowCompose(true)}
          className="flex w-full items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 px-4 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
        >
          <Mail className="size-4 shrink-0" />
          Compose Custom Email
        </button>
      </div>

      {/* ── Email Templates ── */}
      <div className="mt-4 border-t border-border pt-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Email Templates
        </p>
        <div className="flex flex-col gap-2">
          {TEMPLATES.map(({ type, label, description, icon }) => (
            <button
              key={type}
              onClick={() => handleSendTemplate(type)}
              disabled={sendingTemplate !== null}
              className="flex w-full items-start gap-3 rounded-xl border border-border px-4 py-3 text-left transition-colors hover:bg-muted disabled:opacity-60"
            >
              <span className="mt-0.5">
                {sendingTemplate === type
                  ? <Loader2 className="size-4 animate-spin text-muted-foreground" />
                  : icon}
              </span>
              <span className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-foreground">{label}</span>
                <span className="text-xs text-muted-foreground">{description}</span>
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Compose Dialog ── */}
      <Dialog open={showCompose} onOpenChange={setShowCompose}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Mail className="size-4 text-primary" />
              </div>
              Compose Email
            </DialogTitle>
            <DialogDescription>
              Sending to <strong className="text-foreground">{fullName}</strong>{" "}
              &lt;{email}&gt;
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Important update regarding the conference"
                className="w-full rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="compose-subject" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Message
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={7}
                placeholder={`Dear ${fullName},\n\n`}
                className="w-full resize-none rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
              <p className="text-xs text-muted-foreground">
                Your message will be wrapped in the DEESSA branded email template.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowCompose(false)} disabled={sending}>
              <X className="mr-2 size-4" />
              Cancel
            </Button>
            <Button onClick={handleSendCustom} disabled={sending || !subject.trim() || !body.trim()}>
              {sending
                ? <Loader2 className="mr-2 size-4 animate-spin" />
                : <Send className="mr-2 size-4" />}
              Send Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
