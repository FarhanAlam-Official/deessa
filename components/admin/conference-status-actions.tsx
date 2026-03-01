"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle, XCircle, Loader2, AlertTriangle, CreditCard, Mail, Clock, ShieldCheck } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { notifications } from "@/lib/notifications"
import {
  confirmConferenceRegistration,
  cancelConferenceRegistration,
  markConferencePaymentManual,
  resendConferencePaymentLink,
  extendConferenceRegistrationExpiry,
} from "@/lib/actions/conference-registration"

interface StatusActionsProps {
  registrationId: string
  currentStatus: string
  paymentStatus?: string
  fullName: string
  email: string
}

type LoadingKey = "confirm" | "cancel" | "markPaid" | "resendLink" | "extendExpiry" | null
type InlineMessage = { type: "success" | "error"; text: string } | null

export function ConferenceStatusActions({
  registrationId,
  currentStatus,
  paymentStatus = "unpaid",
  fullName,
  email,
}: StatusActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<LoadingKey>(null)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [showMarkPaidModal, setShowMarkPaidModal] = useState(false)
  const [inlineMessage, setInlineMessage] = useState<InlineMessage>(null)

  const isPaid = paymentStatus === "paid"
  const isConfirmed = currentStatus === "confirmed"
  const isCancelled = currentStatus === "cancelled"
  const isExpired = currentStatus === "expired"
  const isPendingPayment = currentStatus === "pending_payment" || currentStatus === "pending"

  const showFeedback = (type: "success" | "error", text: string, title: string) => {
    setInlineMessage({ type, text })
    if (type === "success") notifications.showSuccess({ title, description: text })
    else notifications.showError({ title, description: text })
  }

  // ── Confirm Registration ────────────────────────────────────────────────────
  const handleConfirm = async () => {
    setLoading("confirm")
    setInlineMessage(null)
    try {
      const result = await confirmConferenceRegistration(registrationId, { force: !isPaid })
      if (result.success) {
        showFeedback("success", `Confirmed. Confirmation email sent to ${email}.`, "Registration Confirmed ✓")
        router.refresh()
      } else {
        showFeedback("error", result.error || "Failed to confirm. Please try again.", "Confirm Failed")
      }
    } catch (err) {
      showFeedback("error", err instanceof Error ? err.message : "An unexpected error occurred.", "Confirm Failed")
    } finally {
      setLoading(null)
    }
  }

  // ── Cancel Registration ─────────────────────────────────────────────────────
  const handleCancelConfirmed = async () => {
    setShowCancelModal(false)
    setLoading("cancel")
    setInlineMessage(null)
    try {
      const result = await cancelConferenceRegistration(registrationId)
      if (result.success) {
        showFeedback("success", `Cancelled. Cancellation email sent to ${email}.`, "Registration Cancelled")
        router.refresh()
      } else {
        showFeedback("error", result.error || "Failed to cancel.", "Cancel Failed")
      }
    } catch (err) {
      showFeedback("error", err instanceof Error ? err.message : "An unexpected error occurred.", "Cancel Failed")
    } finally {
      setLoading(null)
    }
  }

  // ── Mark as Paid (Admin Override) ───────────────────────────────────────────
  const handleMarkPaid = async () => {
    setShowMarkPaidModal(false)
    setLoading("markPaid")
    setInlineMessage(null)
    try {
      const result = await markConferencePaymentManual(registrationId)
      if (result.success) {
        showFeedback("success", `Marked as paid and confirmed. Confirmation email sent to ${email}.`, "Marked as Paid ✓")
        router.refresh()
      } else {
        showFeedback("error", result.error || "Failed to mark as paid.", "Override Failed")
      }
    } catch (err) {
      showFeedback("error", err instanceof Error ? err.message : "An unexpected error occurred.", "Override Failed")
    } finally {
      setLoading(null)
    }
  }

  // ── Resend Payment Link ─────────────────────────────────────────────────────
  const handleResendLink = async () => {
    setLoading("resendLink")
    setInlineMessage(null)
    try {
      const result = await resendConferencePaymentLink(registrationId)
      if (result.success) {
        showFeedback("success", `Payment link re-sent to ${email}.`, "Link Sent ✓")
      } else {
        showFeedback("error", result.error || "Failed to resend payment link.", "Send Failed")
      }
    } catch (err) {
      showFeedback("error", err instanceof Error ? err.message : "An unexpected error occurred.", "Send Failed")
    } finally {
      setLoading(null)
    }
  }

  // ── Extend Expiry ───────────────────────────────────────────────────────────
  const handleExtendExpiry = async () => {
    setLoading("extendExpiry")
    setInlineMessage(null)
    try {
      const result = await extendConferenceRegistrationExpiry(registrationId, 24)
      if (result.success) {
        showFeedback("success", `Expiry extended by 24 hours.`, "Expiry Extended ✓")
        router.refresh()
      } else {
        showFeedback("error", result.error || "Failed to extend expiry.", "Extend Failed")
      }
    } catch (err) {
      showFeedback("error", err instanceof Error ? err.message : "An unexpected error occurred.", "Extend Failed")
    } finally {
      setLoading(null)
    }
  }

  return (
    <>
      {/* ── Inline feedback banner ── */}
      {inlineMessage && (
        <div className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm font-medium mb-4 ${
          inlineMessage.type === "success" ? "border-green-200 bg-green-50 text-green-700" : "border-red-200 bg-red-50 text-red-700"
        }`}>
          {inlineMessage.type === "success" ? <CheckCircle className="mt-0.5 size-5 shrink-0" /> : <XCircle className="mt-0.5 size-5 shrink-0" />}
          <span>{inlineMessage.text}</span>
        </div>
      )}

      {/* ── Primary Actions ── */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          onClick={handleConfirm}
          disabled={!!loading || isConfirmed}
          title={!isPaid && !isConfirmed ? "Payment not received — will force-confirm" : undefined}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-green-600 px-6 py-3 text-sm font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading === "confirm" ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle className="size-4" />}
          {isConfirmed ? "Already Confirmed" : !isPaid ? "Force Confirm" : "Confirm Registration"}
        </button>

        <button
          onClick={() => setShowCancelModal(true)}
          disabled={!!loading || isCancelled}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-6 py-3 text-sm font-bold text-red-600 transition hover:-translate-y-0.5 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading === "cancel" ? <Loader2 className="size-4 animate-spin" /> : <XCircle className="size-4" />}
          {isCancelled ? "Already Cancelled" : "Cancel Registration"}
        </button>
      </div>

      {/* ── Payment Admin Actions ── */}
      {!isConfirmed && !isCancelled && (
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          {/* Mark as Paid Override */}
          {!isPaid && (
            <button
              onClick={() => setShowMarkPaidModal(true)}
              disabled={!!loading}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs font-bold text-amber-700 transition hover:bg-amber-100 disabled:opacity-60"
            >
              {loading === "markPaid" ? <Loader2 className="size-3.5 animate-spin" /> : <ShieldCheck className="size-3.5" />}
              Mark as Paid
            </button>
          )}

          {/* Resend Payment Link */}
          {!isPaid && !isExpired && (
            <button
              onClick={handleResendLink}
              disabled={!!loading}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-xs font-bold text-blue-700 transition hover:bg-blue-100 disabled:opacity-60"
            >
              {loading === "resendLink" ? <Loader2 className="size-3.5 animate-spin" /> : <Mail className="size-3.5" />}
              Resend Payment Link
            </button>
          )}

          {/* Extend Expiry */}
          {(isPendingPayment || isExpired) && !isPaid && (
            <button
              onClick={handleExtendExpiry}
              disabled={!!loading}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-purple-200 bg-purple-50 px-4 py-2.5 text-xs font-bold text-purple-700 transition hover:bg-purple-100 disabled:opacity-60"
            >
              {loading === "extendExpiry" ? <Loader2 className="size-3.5 animate-spin" /> : <Clock className="size-3.5" />}
              Extend Expiry +24h
            </button>
          )}
        </div>
      )}

      {/* ── Action hint ── */}
      {!isConfirmed && !isCancelled && !inlineMessage && (
        <p className="mt-3 text-xs text-muted-foreground text-center leading-relaxed">
          {!isPaid ? (
            <><span className="font-medium text-amber-600">⚠ Payment not received.</span> Use "Mark as Paid" to confirm without requiring payment, or "Force Confirm" to confirm anyway.</>
          ) : (
            <>"Confirm Registration" sends <span className="font-medium text-foreground">{email}</span> a confirmation email.</>  
          )}
        </p>
      )}

      {/* ── Cancel Confirmation Modal ── */}
      <Dialog open={showCancelModal} onOpenChange={setShowCancelModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="size-5 text-red-600" />
              </div>
              Cancel Registration
            </DialogTitle>
            <DialogDescription className="pt-1 text-sm leading-relaxed">
              You are about to cancel <strong className="text-foreground">{fullName}</strong>&apos;s registration.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700 leading-relaxed">
            A <strong>cancellation email</strong> will be sent to{" "}
            <span className="font-semibold">{email}</span>.
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowCancelModal(false)}>Keep Registration</Button>
            <Button variant="destructive" onClick={handleCancelConfirmed} disabled={loading === "cancel"}>
              {loading === "cancel" && <Loader2 className="mr-2 size-4 animate-spin" />}
              Yes, Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Mark as Paid Confirmation Modal ── */}
      <Dialog open={showMarkPaidModal} onOpenChange={setShowMarkPaidModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-amber-100">
                <ShieldCheck className="size-5 text-amber-600" />
              </div>
              Manual Payment Override
            </DialogTitle>
            <DialogDescription className="pt-1 text-sm leading-relaxed">
              Manually mark <strong className="text-foreground">{fullName}</strong>&apos;s registration as paid and confirmed.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-800 leading-relaxed">
            ⚠ This will <strong>bypass the payment gateway</strong>. Use only when you've confirmed payment was received through another channel (e.g. bank transfer, cheque). This action is logged.
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowMarkPaidModal(false)}>Cancel</Button>
            <Button onClick={handleMarkPaid} disabled={loading === "markPaid"
            } className="bg-amber-600 hover:bg-amber-700 text-white">
              {loading === "markPaid" && <Loader2 className="mr-2 size-4 animate-spin" />}
              Yes, Mark as Paid
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}


