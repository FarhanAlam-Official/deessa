"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { updateReviewStatus } from "@/lib/actions/admin-donation-actions"
import { notifications } from "@/lib/notifications"

interface ReviewStatusCardProps {
  donationId: string
  currentStatus: "unreviewed" | "verified" | "flagged" | "refunded"
  userRole: "ADMIN" | "SUPER_ADMIN" | "FINANCE" | "EDITOR"
}

export function ReviewStatusCard({
  donationId,
  currentStatus,
  userRole,
}: ReviewStatusCardProps) {
  const [status, setStatus] = useState(currentStatus)
  const [isLoading, setIsLoading] = useState(false)

  const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(userRole)

  const getStatusColor = (s: string) => {
    switch (s) {
      case "verified":
        return "bg-green-100 text-green-800 border-green-200"
      case "flagged":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "refunded":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    if (!isAdmin) return

    setIsLoading(true)
    try {
      const result = await updateReviewStatus({
        donationId,
        reviewStatus: newStatus as any,
      })

      if (result.ok) {
        setStatus(newStatus as any)
        notifications.showSuccess({
          title: "Success",
          description: result.message,
        })
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
      console.error("Update review status error:", error)
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
          description: "Failed to update review status. Please try again.",
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Review Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="text-sm font-medium text-muted-foreground mb-2">Current Status</div>
          <Badge variant="outline" className={getStatusColor(status)}>
            {status.toUpperCase()}
          </Badge>
        </div>

        {isAdmin && (
          <div>
            <div className="text-sm font-medium text-muted-foreground mb-2">Change Status</div>
            <Select value={status} onValueChange={handleStatusChange} disabled={isLoading}>
              <SelectTrigger className="touch-manipulation min-h-[44px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unreviewed" className="touch-manipulation min-h-[44px]">Unreviewed</SelectItem>
                <SelectItem value="verified" className="touch-manipulation min-h-[44px]">Verified</SelectItem>
                <SelectItem value="flagged" className="touch-manipulation min-h-[44px]">Flagged</SelectItem>
                <SelectItem value="refunded" className="touch-manipulation min-h-[44px]">Refunded</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
