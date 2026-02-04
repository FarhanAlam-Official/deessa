"use client"

import { useState } from "react"
import { Download, Mail, Copy, CheckCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { notifications } from "@/lib/notifications"

interface ReceiptPreviewProps {
  receiptNumber: string
  receiptUrl: string
  donorName: string
  donorEmail: string
  donorPhone?: string
  amount: number
  currency: string
  paymentDate: Date
  isMonthly: boolean
  organizationName: string
  vatNumber?: string
  panNumber?: string
  swcNumber?: string
}

export function ReceiptPreview({
  receiptNumber,
  receiptUrl,
  donorName,
  donorEmail,
  donorPhone,
  amount,
  currency,
  paymentDate,
  isMonthly,
  organizationName,
  vatNumber,
  panNumber,
  swcNumber,
}: ReceiptPreviewProps) {
  const [isDownloading, setIsDownloading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [copied, setCopied] = useState(false)

  const currencySymbol = currency === "USD" ? "$" : "₨"
  const formattedDate = paymentDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const handleDownload = async () => {
    try {
      setIsDownloading(true)
      const response = await fetch(`/api/receipts/download?id=${receiptNumber}`)

      if (!response.ok) {
        throw new Error("Download failed")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${receiptNumber}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      notifications.showSuccess({
        title: "Receipt Downloaded",
        description: "Your receipt has been downloaded successfully.",
      })
    } catch (error) {
      console.error("Download error:", error)
      notifications.showError({
        title: "Download Failed",
        description: "Failed to download receipt. Please try again.",
      })
    } finally {
      setIsDownloading(false)
    }
  }

  const handleResendEmail = async () => {
    try {
      setIsSending(true)
      const response = await fetch("/api/receipts/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiptNumber }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to resend email")
      }

      notifications.showSuccess({
        title: "Email Sent",
        description: `Receipt has been resent to ${donorEmail}`,
      })
    } catch (error) {
      console.error("Resend error:", error)
      notifications.showError({
        title: "Send Failed",
        description: "Failed to resend receipt email. Please try again.",
      })
    } finally {
      setIsSending(false)
    }
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(receiptUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      notifications.showSuccess({
        title: "Link Copied",
        description: "Receipt link copied to clipboard",
      })
    } catch (error) {
      console.error("Copy error:", error)
      notifications.showError({
        title: "Copy Failed",
        description: "Failed to copy link",
      })
    }
  }

  return (
    <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-lg">
      {/* Receipt Header */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-200 px-6 py-4">
        <div className="flex items-center gap-3 mb-2">
          <CheckCircle className="size-6 text-green-600" />
          <h2 className="text-2xl font-bold text-green-900">Receipt Generated</h2>
        </div>
        <p className="text-sm text-green-700">Your tax-deductible receipt is ready</p>
      </div>

      {/* Receipt Content */}
      <div className="p-6 md:p-8">
        {/* Receipt Number & Date */}
        <div className="grid grid-cols-2 gap-4 mb-6 pb-6 border-b border-border">
          <div>
            <p className="text-xs font-semibold text-foreground-muted uppercase mb-1">Receipt Number</p>
            <p className="text-lg font-bold text-foreground">{receiptNumber}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-foreground-muted uppercase mb-1">Date</p>
            <p className="text-lg font-bold text-foreground">{formattedDate}</p>
          </div>
        </div>

        {/* Organization Info */}
        <div className="mb-6 pb-6 border-b border-border">
          <p className="text-xs font-semibold text-foreground-muted uppercase mb-2">Organization</p>
          <p className="text-sm font-semibold text-foreground mb-1">{organizationName}</p>
          {vatNumber && (
            <p className="text-xs text-foreground-muted">VAT Registration: {vatNumber}</p>
          )}
          {panNumber && (
            <p className="text-xs text-foreground-muted">PAN: {panNumber}</p>
          )}
          {swcNumber && (
            <p className="text-xs text-foreground-muted">SWC Registration: {swcNumber}</p>
          )}
        </div>

        {/* Donor Information */}
        <div className="mb-6 pb-6 border-b border-border">
          <p className="text-xs font-semibold text-foreground-muted uppercase mb-3">Donor Information</p>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-foreground-muted">Name:</span>
              <span className="text-sm font-semibold text-foreground">{donorName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-foreground-muted">Email:</span>
              <span className="text-sm font-semibold text-foreground">{donorEmail}</span>
            </div>
            {donorPhone && (
              <div className="flex justify-between">
                <span className="text-sm text-foreground-muted">Phone:</span>
                <span className="text-sm font-semibold text-foreground">{donorPhone}</span>
              </div>
            )}
          </div>
        </div>

        {/* Donation Details */}
        <div className="mb-6 pb-6 border-b border-border">
          <p className="text-xs font-semibold text-foreground-muted uppercase mb-3">Donation Details</p>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-foreground-muted">Type:</span>
              <span className="text-sm font-semibold text-foreground">
                {isMonthly ? "Monthly Recurring" : "One-Time"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-foreground-muted">Currency:</span>
              <span className="text-sm font-semibold text-foreground">{currency}</span>
            </div>
          </div>
        </div>

        {/* Amount */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 mb-6">
          <p className="text-xs font-semibold text-green-700 uppercase mb-2">Amount Donated</p>
          <p className="text-4xl font-black text-green-600">
            {currencySymbol}{amount.toFixed(2)}
          </p>
        </div>

        {/* Tax Statement */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded">
          <p className="text-xs font-semibold text-blue-900 mb-1">TAX DEDUCTIBILITY</p>
          <p className="text-xs text-blue-800 leading-relaxed">
            {organizationName} is a registered nonprofit organization. Your donation is tax-deductible to the extent permitted by law. Please keep this receipt for your tax records.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Button
            onClick={handleDownload}
            disabled={isDownloading}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {isDownloading ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Downloading...
              </>
            ) : (
              <>
                <Download className="mr-2 size-4" />
                Download PDF
              </>
            )}
          </Button>

          <Button
            onClick={handleResendEmail}
            disabled={isSending}
            variant="outline"
          >
            {isSending ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Mail className="mr-2 size-4" />
                Resend Email
              </>
            )}
          </Button>

          <Button
            onClick={handleCopyLink}
            variant="outline"
            className={cn(copied && "bg-green-50 border-green-200")}
          >
            {copied ? (
              <>
                <CheckCircle className="mr-2 size-4 text-green-600" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="mr-2 size-4" />
                Copy Link
              </>
            )}
          </Button>
        </div>

        {/* Info Text */}
        <p className="text-xs text-foreground-muted text-center mt-4">
          Your receipt has been sent to <strong>{donorEmail}</strong>. You can download it anytime using the button above.
        </p>
      </div>
    </div>
  )
}
