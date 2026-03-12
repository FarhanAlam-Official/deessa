"use client"

import { ArrowLeft, Mail, FileDown, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

interface TransactionHeaderProps {
  donationId: string
  paymentStatus: string
  paymentProvider: string
  userRole: "ADMIN" | "SUPER_ADMIN" | "FINANCE" | "EDITOR"
  hasReceipt: boolean
  onResendReceipt?: () => void
  onChangeStatus?: () => void
  onExportPDF?: () => void
  onViewDashboard?: () => void
  isLoading?: boolean
}

export function TransactionHeader({
  donationId,
  paymentStatus,
  paymentProvider,
  userRole,
  hasReceipt,
  onResendReceipt,
  onChangeStatus,
  onExportPDF,
  onViewDashboard,
  isLoading = false,
}: TransactionHeaderProps) {
  // Check if user has admin permissions
  const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(userRole)
  const hasFinanceAccess = ["ADMIN", "SUPER_ADMIN", "FINANCE"].includes(userRole)

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200"
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "failed":
        return "bg-red-100 text-red-800 border-red-200"
      case "review":
        return "bg-orange-100 text-orange-800 border-orange-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  // Get provider badge color
  const getProviderColor = (provider: string) => {
    switch (provider.toLowerCase()) {
      case "stripe":
        return "bg-purple-100 text-purple-800 border-purple-200"
      case "khalti":
        return "bg-purple-100 text-purple-800 border-purple-200"
      case "esewa":
        return "bg-green-100 text-green-800 border-green-200"
      case "fonepay":
        return "bg-blue-100 text-blue-800 border-blue-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  return (
    <div className="space-y-4">
      {/* Back button and title */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/donations">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back to Donations</span>
              <span className="sm:hidden">Back</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Title and badges */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Transaction Details</h1>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className={getStatusColor(paymentStatus)}>
              {paymentStatus.toUpperCase()}
            </Badge>
            <Badge variant="outline" className={getProviderColor(paymentProvider)}>
              {paymentProvider.toUpperCase()}
            </Badge>
          </div>
        </div>

        {/* Action buttons - responsive layout */}
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          {/* Re-send Receipt - only if receipt exists and user is admin */}
          {isAdmin && hasReceipt && onResendReceipt && (
            <Button
              variant="outline"
              size="sm"
              onClick={onResendReceipt}
              disabled={isLoading}
              className="gap-2 w-full sm:w-auto touch-manipulation min-h-[44px]"
            >
              <Mail className="h-4 w-4" />
              <span className="hidden md:inline">Re-send Receipt</span>
              <span className="md:hidden">Resend</span>
            </Button>
          )}

          {/* Change Status - only for admin */}
          {isAdmin && onChangeStatus && (
            <Button
              variant="outline"
              size="sm"
              onClick={onChangeStatus}
              disabled={isLoading}
              className="gap-2 w-full sm:w-auto touch-manipulation min-h-[44px]"
            >
              <span className="hidden md:inline">Change Status</span>
              <span className="md:hidden">Status</span>
            </Button>
          )}

          {/* Export PDF - for all with finance access */}
          {hasFinanceAccess && onExportPDF && (
            <Button
              variant="outline"
              size="sm"
              onClick={onExportPDF}
              disabled={isLoading}
              className="gap-2 w-full sm:w-auto touch-manipulation min-h-[44px]"
            >
              <FileDown className="h-4 w-4" />
              <span className="hidden md:inline">Export</span>
              <span className="md:hidden">Export</span>
            </Button>
          )}

          {/* View in Provider Dashboard */}
          {hasFinanceAccess && onViewDashboard && (
            <Button
              variant="default"
              size="sm"
              onClick={onViewDashboard}
              disabled={isLoading}
              className="gap-2 w-full sm:w-auto touch-manipulation min-h-[44px]"
            >
              <ExternalLink className="h-4 w-4" />
              <span className="hidden md:inline">View in Dashboard</span>
              <span className="md:hidden">Dashboard</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
