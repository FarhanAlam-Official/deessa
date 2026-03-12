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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import { changePaymentStatus } from "@/lib/actions/admin-donation-actions"
import { notifications } from "@/lib/notifications"

interface StatusChangeModalProps {
  donationId: string
  currentStatus: string
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function StatusChangeModal({
  donationId,
  currentStatus,
  isOpen,
  onClose,
  onSuccess,
}: StatusChangeModalProps) {
  const [newStatus, setNewStatus] = useState<string>(currentStatus)
  const [reason, setReason] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)

  const handleSubmit = async () => {
    if (reason.trim().length < 10) {
      notifications.showError({
        title: "Validation Error",
        description: "Reason must be at least 10 characters",
      })
      return
    }

    if (newStatus === currentStatus) {
      notifications.showError({
        title: "Validation Error",
        description: "Please select a different status",
      })
      return
    }

    // Show confirmation if changing from completed
    if (currentStatus === "completed" && !showConfirmation) {
      setShowConfirmation(true)
      return
    }

    setIsSubmitting(true)
    try {
      const result = await changePaymentStatus({
        donationId,
        newStatus: newStatus as any,
        reason: reason.trim(),
      })

      if (result.ok) {
        notifications.showSuccess({
          title: "Success",
          description: result.message,
        })
        setReason("")
        setShowConfirmation(false)
        onSuccess()
        onClose()
      } else {
        // Handle specific error cases
        if (result.message.includes("network") || result.message.includes("Network")) {
          notifications.showError({
            title: "Network Error",
            description: "Unable to connect to the server. Please check your internet connection and try again.",
            duration: 5000,
          })
        } else {
          notifications.showError({
            title: "Error",
            description: result.message,
          })
        }
      }
    } catch (error) {
      console.error("Change status error:", error)
      // Check if it's a network error
      if (error instanceof TypeError && error.message.includes("fetch")) {
        notifications.showError({
          title: "Network Error",
          description: "Unable to connect to the server. Please check your internet connection and try again.",
          duration: 5000,
        })
      } else {
        notifications.showError({
          title: "Error",
          description: "Failed to change payment status. Please try again.",
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setReason("")
    setNewStatus(currentStatus)
    setShowConfirmation(false)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change Payment Status</DialogTitle>
          <DialogDescription>
            Update the payment status with a mandatory reason for audit purposes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <div className="text-sm font-medium mb-2">Current Status</div>
            <div className="text-sm text-muted-foreground capitalize">{currentStatus}</div>
          </div>

          <div>
            <div className="text-sm font-medium mb-2">New Status</div>
            <Select value={newStatus} onValueChange={setNewStatus} disabled={isSubmitting}>
              <SelectTrigger className="touch-manipulation min-h-[44px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending" className="touch-manipulation min-h-[44px]">Pending</SelectItem>
                <SelectItem value="completed" className="touch-manipulation min-h-[44px]">Completed</SelectItem>
                <SelectItem value="failed" className="touch-manipulation min-h-[44px]">Failed</SelectItem>
                <SelectItem value="review" className="touch-manipulation min-h-[44px]">Review</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <div className="text-sm font-medium mb-2">Reason (Required)</div>
            <Textarea
              placeholder="Enter reason for status change (minimum 10 characters)..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              className={`resize-none ${reason.length > 0 && reason.trim().length < 10 ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
              disabled={isSubmitting}
              aria-invalid={reason.length > 0 && reason.trim().length < 10}
              aria-describedby="reason-error reason-count"
            />
            <div className="flex justify-between items-center mt-1">
              <div id="reason-count" className={`text-sm ${reason.length > 0 && reason.trim().length < 10 ? 'text-red-600' : 'text-muted-foreground'}`}>
                {reason.length} / 10 characters minimum
              </div>
              {reason.length > 0 && reason.trim().length < 10 && (
                <div id="reason-error" className="text-sm text-red-600">
                  Too short
                </div>
              )}
            </div>
          </div>

          {currentStatus === "completed" && newStatus !== "completed" && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Warning: Changing status from completed may affect audit records and receipt
                validity. This action will be logged.
              </AlertDescription>
            </Alert>
          )}

          {showConfirmation && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Are you sure you want to change from completed status? This is a critical action
                that will be logged and may require additional review.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting} className="touch-manipulation min-h-[44px]">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || reason.trim().length < 10 || newStatus === currentStatus}
            className="touch-manipulation min-h-[44px]"
          >
            {isSubmitting ? "Updating..." : showConfirmation ? "Confirm Change" : "Update Status"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
