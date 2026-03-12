"use client"

import { useState } from "react"
import { TransactionHeader } from "@/components/admin/donations/transaction-header"
import { TransactionOverview } from "@/components/admin/donations/transaction-overview"
import { DonorInformation } from "@/components/admin/donations/donor-information"
import { PaymentTechnical } from "@/components/admin/donations/payment-technical"
import { ReviewStatusCard } from "@/components/admin/donations/review-status-card"
import { ReviewNotesSection } from "@/components/admin/donations/review-notes-section"
import { ActivityTimeline } from "@/components/admin/donations/activity-timeline"
import { StatusChangeModal } from "@/components/admin/donations/status-change-modal"
import { ErrorBoundary } from "@/components/admin/donations/error-boundary"
import { buildActivityTimeline } from "@/lib/utils/activity-timeline"
import { getProviderDashboardUrl } from "@/lib/utils/provider-dashboard"
import { resendReceipt, exportTransactionPDF } from "@/lib/actions/admin-donation-actions"
import { notifications } from "@/lib/notifications"

interface TransactionDetailClientProps {
  data: {
    donation: any
    reviewNotes: any[]
    statusChanges: any[]
    paymentEvents: any[]
    paymentData: any
    reviewedByName: string | null
  }
  userRole: "SUPER_ADMIN" | "ADMIN" | "FINANCE" | "EDITOR"
}

export function TransactionDetailClient({ data, userRole }: TransactionDetailClientProps) {
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const { donation, reviewNotes, statusChanges, paymentEvents, paymentData, reviewedByName } = data

  // Build activity timeline with error handling
  let timelineEvents: any[] = []
  try {
    timelineEvents = buildActivityTimeline({
      donation,
      reviewNotes,
      statusChanges,
      paymentEvents,
    })
  } catch (error) {
    console.error("Failed to build activity timeline:", error)
    notifications.showError({
      title: "Timeline Error",
      description: "Failed to load activity timeline. Some events may not be displayed.",
    })
  }

  // Handle resend receipt with comprehensive error handling
  const handleResendReceipt = async () => {
    setIsLoading(true)
    try {
      const result = await resendReceipt({ donationId: donation.id })
      if (result.ok) {
        notifications.showSuccess({
          title: "Success",
          description: result.message,
        })
      } else {
        // Handle specific error cases
        if (result.message.includes("Rate limit") || result.message.includes("rate limit")) {
          notifications.showError({
            title: "Rate Limit Exceeded",
            description: "You can only resend receipts 3 times per hour. Please try again later.",
            duration: 5000,
          })
        } else if (result.message.includes("No receipt")) {
          notifications.showError({
            title: "No Receipt Found",
            description: "This donation doesn't have a receipt yet. Generate one first.",
          })
        } else if (result.message.includes("network") || result.message.includes("Network")) {
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
      console.error("Resend receipt error:", error)
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
          description: "Failed to resend receipt. Please try again.",
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Handle export PDF with error handling
  const handleExportPDF = async () => {
    setIsLoading(true)
    try {
      const result = await exportTransactionPDF({ donationId: donation.id })
      if (result.ok && result.pdfUrl) {
        // Create a download link and trigger it
        const link = document.createElement('a')
        link.href = result.pdfUrl
        link.download = result.fileName || `transaction-${donation.id}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        notifications.showSuccess({
          title: "Success",
          description: result.message,
        })
      } else {
        notifications.showError({
          title: "Export Failed",
          description: result.message || "Failed to generate export file.",
        })
      }
    } catch (error) {
      console.error("Export PDF error:", error)
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
          description: "Failed to export transaction. Please try again.",
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Handle view in provider dashboard
  const handleViewDashboard = () => {
    try {
      // Debug: Log what we have
      console.log('Dashboard link debug:', {
        provider: donation.provider,
        payment_intent_id: paymentData?.payment_intent_id,
        session_id: paymentData?.session_id,
        payment_id: donation.payment_id,
        paymentData: paymentData,
      })

      // Use all available payment references
      const donationData = {
        provider: donation.provider,
        payment_intent_id: paymentData?.payment_intent_id || null,
        session_id: paymentData?.session_id || null,
        payment_id: donation.payment_id || null, // Legacy fallback
      }
      const url = getProviderDashboardUrl(donation.provider, donationData)
      
      console.log('Generated URL:', url)
      
      if (url) {
        window.open(url, "_blank")
      } else {
        notifications.showError({
          title: "Not Available",
          description: "Provider dashboard link is not available for this transaction. The required provider reference may be missing.",
        })
      }
    } catch (error) {
      console.error("View dashboard error:", error)
      notifications.showError({
        title: "Error",
        description: "Failed to open provider dashboard.",
      })
    }
  }

  const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(userRole)

  return (
    <main className="space-y-6" role="main" aria-label="Transaction Detail Page">
      {/* Header */}
      <header>
        <ErrorBoundary>
          <TransactionHeader
            donationId={donation.id}
            paymentStatus={donation.payment_status}
            paymentProvider={donation.provider}
            userRole={userRole}
            hasReceipt={!!donation.receipt_number}
            onResendReceipt={handleResendReceipt}
            onChangeStatus={() => setIsStatusModalOpen(true)}
            onExportPDF={handleExportPDF}
            onViewDashboard={handleViewDashboard}
            isLoading={isLoading}
          />
        </ErrorBoundary>
      </header>

      {/* Transaction Overview Section */}
      <section aria-labelledby="transaction-overview-heading">
        <ErrorBoundary>
          <TransactionOverview donation={donation} reviewedByName={reviewedByName} />
        </ErrorBoundary>
      </section>

      {/* Donor and Payment Information Section */}
      <section aria-labelledby="donor-payment-info-heading" className="grid gap-6 md:grid-cols-2">
        <h2 id="donor-payment-info-heading" className="sr-only">Donor and Payment Information</h2>
        <ErrorBoundary>
          <DonorInformation
            donor={{
              name: donation.donor_name,
              email: donation.donor_email,
              phone: donation.donor_phone,
              message: donation.donor_message,
            }}
          />
        </ErrorBoundary>
        <ErrorBoundary>
          <PaymentTechnical
            payment={{
              payment_intent_id: paymentData?.payment_intent_id,
              session_id: paymentData?.session_id,
              subscription_id: paymentData?.subscription_id,
              customer_id: paymentData?.customer_id,
              payment_id: donation.payment_id,
              verification_id: donation.verification_id,
            }}
            provider={donation.provider}
          />
        </ErrorBoundary>
      </section>

      {/* Review Management Section - only for admins */}
      {isAdmin && (
        <section aria-labelledby="review-management-heading">
          <h2 id="review-management-heading" className="sr-only">Review Management</h2>
          <div className="space-y-6">
            <ErrorBoundary>
              <ReviewStatusCard
                donationId={donation.id}
                currentStatus={donation.review_status || "unreviewed"}
                userRole={userRole}
              />
            </ErrorBoundary>
            <ErrorBoundary>
              <ReviewNotesSection donationId={donation.id} notes={reviewNotes} userRole={userRole} />
            </ErrorBoundary>
          </div>
        </section>
      )}

      {/* Activity Timeline Section */}
      <section aria-labelledby="activity-timeline-heading">
        <ErrorBoundary>
          <ActivityTimeline events={timelineEvents} />
        </ErrorBoundary>
      </section>

      {/* Status Change Modal */}
      <StatusChangeModal
        donationId={donation.id}
        currentStatus={donation.payment_status}
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        onSuccess={() => {
          // Page will revalidate automatically
          window.location.reload()
        }}
      />
    </main>
  )
}
