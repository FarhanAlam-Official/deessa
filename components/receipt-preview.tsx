"use client"

import { useState, useEffect, useRef } from "react"
import { Download, Mail, Copy, CheckCircle, Loader2, FileText } from "lucide-react"
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

/**
 * Convert an absolute receipt URL to a relative path so that the fetch
 * always targets the current host. This is necessary because the URL is
 * stored in the database at generation time (on Vercel) and will contain
 * the production domain even when the page is served from localhost.
 *
 * e.g. "https://deessa-foundation.vercel.app/api/receipts/download?token=…"
 *   → "/api/receipts/download?token=…"
 */
function toRelativeUrl(url: string): string {
  try {
    const parsed = new URL(url)
    return `${parsed.pathname}${parsed.search}`
  } catch {
    // Already relative or malformed — use as-is
    return url
  }
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
  // Always use a relative URL so the fetch goes to the current host,
  // not the absolute Vercel domain stored in the database.
  const relativeReceiptUrl = toRelativeUrl(receiptUrl)
  const [isDownloading, setIsDownloading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [copied, setCopied] = useState(false)
  // Blob URL keeps the real token URL out of the DOM entirely.
  // Users inspecting the iframe src will only see a random blob: reference.
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [previewLoading, setPreviewLoading] = useState(true)
  const [previewError, setPreviewError] = useState(false)
  const blobRef = useRef<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setPreviewLoading(true)
    setPreviewError(false)

    fetch(relativeReceiptUrl)
      .then((r) => {
        if (!r.ok) throw new Error("fetch failed")
        return r.blob()
      })
      .then((blob) => {
        if (cancelled) return
        const url = URL.createObjectURL(blob)
        blobRef.current = url
        setBlobUrl(url)
        setPreviewLoading(false)
      })
      .catch(() => {
        if (!cancelled) {
          setPreviewError(true)
          setPreviewLoading(false)
        }
      })

    return () => {
      cancelled = true
      // Revoke previous blob URL to free memory
      if (blobRef.current) {
        URL.revokeObjectURL(blobRef.current)
        blobRef.current = null
      }
    }
  }, [receiptUrl])

  const handleDownload = async () => {
    try {
      setIsDownloading(true)
      const response = await fetch(relativeReceiptUrl)

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
      await navigator.clipboard.writeText(receiptUrl) // share the original absolute URL
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
      {/* Header */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-200 px-6 py-4">
        <div className="flex items-center gap-3 mb-1">
          <CheckCircle className="size-6 text-green-600" />
          <h2 className="text-2xl font-bold text-green-900">Receipt Generated</h2>
        </div>
        <p className="text-sm text-green-700 ml-9">
          {receiptNumber} · Sent to <strong>{donorEmail}</strong>
        </p>
      </div>

      {/* PDF Preview — blob URL hides the token from the DOM entirely */}
      <div className="w-full bg-gray-100 flex items-center justify-center" style={{ height: "70vh", minHeight: 480 }}>
        {previewLoading && (
          <div className="flex flex-col items-center gap-3 text-gray-500">
            <Loader2 className="size-8 animate-spin" />
            <span className="text-sm">Loading receipt…</span>
          </div>
        )}
        {previewError && !previewLoading && (
          <div className="flex flex-col items-center gap-3 text-gray-500">
            <FileText className="size-8" />
            <span className="text-sm">Preview unavailable — use Download PDF below</span>
          </div>
        )}
        {blobUrl && !previewLoading && (
          <iframe
            src={`${blobUrl}#toolbar=0&navpanes=0&scrollbar=0`}
            title={`Receipt ${receiptNumber}`}
            className="w-full h-full border-0"
            style={{ display: "block" }}
          />
        )}
      </div>

      {/* Action Buttons */}
      <div className="px-6 py-4 border-t border-border bg-surface">
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
      
      </div>
    </div>
          
)
}
