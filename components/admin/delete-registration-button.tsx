"use client"

import { useState } from "react"
import { Trash2, AlertTriangle, X, Loader2, CheckCircle2 } from "lucide-react"
import { deleteConferenceRegistration } from "@/lib/actions/conference-registration"
import { notifications } from "@/lib/notifications"

interface Props {
  registrationId: string
  shortId: string
  fullName: string
  email: string
  status: string
}

export function DeleteRegistrationButton({ registrationId, shortId, fullName, email, status }: Props) {
  const [open, setOpen]       = useState(false)
  const [confirm, setConfirm] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  const isCancelled = status === "cancelled"
  const canDelete   = isCancelled && confirm === shortId

  function handleOpen() {
    if (!isCancelled) return
    setConfirm("")
    setError(null)
    setOpen(true)
  }

  function handleClose() {
    if (loading) return
    setOpen(false)
    setConfirm("")
    setError(null)
  }

  async function handleDelete() {
    if (!canDelete || loading) return
    setLoading(true)
    setError(null)

    try {
      const result = await deleteConferenceRegistration(registrationId, email)

      if (result.success) {
        setOpen(false)
        notifications.showSuccess({
          title: "Registration deleted",
          description: `${fullName}'s registration (${shortId}) has been permanently removed.`,
          duration: 5000,
        })
        // Hard redirect — avoids router.push leaving isPending stuck
        setTimeout(() => {
          window.location.href = "/admin/conference"
        }, 600)
      } else {
        setError(result.error ?? "Failed to delete registration.")
        setLoading(false)
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.")
      setLoading(false)
    }
  }

  return (
    <>
      {/* ── Trigger button ──────────────────────────────────────── */}
      <button
        onClick={handleOpen}
        disabled={!isCancelled}
        title={
          isCancelled
            ? "Permanently delete this registration"
            : "Registration must be cancelled before it can be deleted"
        }
        className={`flex w-full items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all ${
          isCancelled
            ? "border-red-200 bg-red-50 text-red-600 hover:border-red-300 hover:bg-red-100 cursor-pointer"
            : "border-border bg-muted/30 text-muted-foreground/40 cursor-not-allowed"
        }`}
      >
        <Trash2 className="size-4 shrink-0" />
        <span className="flex-1 text-left">Delete Registration</span>
        {!isCancelled && (
          <span className="rounded-full bg-muted/60 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
            Cancelled only
          </span>
        )}
      </button>

      {/* ── Confirmation modal ──────────────────────────────────── */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal */}
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b border-border p-6">
              <div className="flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-red-100">
                  <AlertTriangle className="size-5 text-red-600" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-foreground">Delete Registration</h2>
                  <p className="text-xs text-muted-foreground">This action cannot be undone</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                disabled={loading}
                className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Body */}
            <div className="space-y-5 p-6">
              {/* Warning block */}
              <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                <p className="text-sm font-semibold text-red-700 mb-1">
                  ⚠ Permanent deletion — no recovery possible
                </p>
                <p className="text-xs text-red-600 leading-relaxed">
                  All data for{" "}
                  <span className="font-bold">{fullName}</span>{" "}
                  (<span className="font-mono">{shortId}</span>) will be permanently removed —
                  including registration details, payment records, and admin notes.
                </p>
              </div>

              {/* Confirmation input */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-foreground">
                  Type{" "}
                  <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-primary">
                    {shortId}
                  </code>{" "}
                  to confirm
                </label>
                <input
                  type="text"
                  value={confirm}
                  autoFocus
                  disabled={loading}
                  onChange={(e) => { setConfirm(e.target.value); setError(null) }}
                  onKeyDown={(e) => { if (e.key === "Enter" && canDelete) handleDelete() }}
                  placeholder={shortId}
                  className="w-full rounded-xl border border-border bg-muted/30 px-4 py-2.5 font-mono text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-200 transition-all disabled:opacity-60"
                />
              </div>

              {error && (
                <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 border-t border-border p-6">
              <button
                onClick={handleClose}
                disabled={loading}
                className="rounded-xl border border-border px-5 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={!canDelete || loading}
                className="flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Deleting…
                  </>
                ) : (
                  <>
                    <Trash2 className="size-4" />
                    Permanently Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
