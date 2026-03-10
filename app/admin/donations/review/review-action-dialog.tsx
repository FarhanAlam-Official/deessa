"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2, XCircle, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { reviewDonation } from "@/lib/actions/admin-donation-review"
import { formatCurrency } from "@/lib/utils/currency"

interface Donation {
  id: string
  amount: number
  currency: string
  donor_name: string
  donor_email: string
  payment_status: string
  provider: string | null
}

interface ReviewActionDialogProps {
  donation: Donation
  actionType: "approve" | "reject"
  onClose: () => void
  onComplete: (donationId: string) => void
}

export function ReviewActionDialog({
  donation,
  actionType,
  onClose,
  onComplete,
}: ReviewActionDialogProps) {
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!notes.trim()) {
      toast.error("Please provide notes for this action")
      return
    }

    setIsSubmitting(true)

    try {
      const result = await reviewDonation({
        donationId: donation.id,
        decision: actionType,
        notes: notes.trim(),
      })

      if (result.success) {
        toast.success(result.message)
        onComplete(donation.id)
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  const isApprove = actionType === "approve"

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isApprove ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Approve Donation
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5 text-red-600" />
                Reject Donation
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isApprove
              ? "Approve this donation and trigger receipt generation"
              : "Reject this donation and notify the donor"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Donation Summary */}
          <div className="rounded-lg border p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm font-medium">Donor:</span>
              <span className="text-sm">{donation.donor_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Email:</span>
              <span className="text-sm">{donation.donor_email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Amount:</span>
              <span className="text-sm font-bold">
                {formatCurrency(donation.amount, donation.currency, { showCode: true })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Provider:</span>
              <span className="text-sm capitalize">{donation.provider || "Unknown"}</span>
            </div>
          </div>

          {/* Warning Alert */}
          <Alert variant={isApprove ? "default" : "destructive"}>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {isApprove ? (
                <>
                  <strong>Confirm Approval:</strong> This will mark the donation as confirmed and
                  generate a receipt. The donor will receive a receipt email.
                </>
              ) : (
                <>
                  <strong>Confirm Rejection:</strong> This will mark the donation as failed. The
                  donor will be notified via email with the reason you provide below.
                </>
              )}
            </AlertDescription>
          </Alert>

          {/* Notes Input */}
          <div className="space-y-2">
            <Label htmlFor="notes">
              {isApprove ? "Approval Notes" : "Rejection Reason"} <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="notes"
              placeholder={
                isApprove
                  ? "e.g., Amount verified manually with provider support"
                  : "e.g., Amount mismatch could not be resolved - please retry donation"
              }
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">
              {isApprove
                ? "Document why you're approving this donation for audit purposes"
                : "This message will be included in the email sent to the donor"}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !notes.trim()}
            variant={isApprove ? "default" : "destructive"}
            className={isApprove ? "bg-green-600 hover:bg-green-700" : ""}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                {isApprove ? (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Approve Donation
                  </>
                ) : (
                  <>
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject Donation
                  </>
                )}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
