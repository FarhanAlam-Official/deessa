"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  DollarSign,
  AlertTriangle,
  ChevronDown,
  ChevronUp
} from "lucide-react"
import { toast } from "sonner"
import { formatCurrency } from "@/lib/utils/currency"
import { ReviewActionDialog } from "./review-action-dialog"

interface PaymentEvent {
  id: string
  provider: string
  event_id: string
  event_type: string | null
  raw_payload: any
  created_at: string
}

interface Donation {
  id: string
  amount: number
  currency: string
  donor_name: string
  donor_email: string
  donor_phone: string | null
  payment_status: string
  provider: string | null
  provider_ref: string | null
  created_at: string
  confirmed_at: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  review_notes: string | null
  payment_events: PaymentEvent[]
}

interface ReviewDashboardClientProps {
  donations: Donation[]
}

export function ReviewDashboardClient({ donations: initialDonations }: ReviewDashboardClientProps) {
  const [donations, setDonations] = useState(initialDonations)
  const [selectedDonation, setSelectedDonation] = useState<Donation | null>(null)
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null)
  const [expandedPayloads, setExpandedPayloads] = useState<Set<string>>(new Set())

  const handleActionComplete = (donationId: string) => {
    // Remove the donation from the list after successful action
    setDonations((prev) => prev.filter((d) => d.id !== donationId))
    setSelectedDonation(null)
    setActionType(null)
  }

  const togglePayloadExpansion = (donationId: string) => {
    setExpandedPayloads((prev) => {
      const next = new Set(prev)
      if (next.has(donationId)) {
        next.delete(donationId)
      } else {
        next.add(donationId)
      }
      return next
    })
  }

  const getAmountMismatchDetails = (donation: Donation) => {
    // Try to extract amount from raw payload
    const latestEvent = donation.payment_events?.[0]
    if (!latestEvent?.raw_payload) return null

    const payload = latestEvent.raw_payload
    let providerAmount: number | null = null
    let providerCurrency: string | null = null

    // Extract based on provider
    if (donation.provider === "stripe") {
      providerAmount = payload.amount_total ? payload.amount_total / 100 : null
      providerCurrency = payload.currency?.toUpperCase()
    } else if (donation.provider === "khalti") {
      providerAmount = payload.total_amount ? payload.total_amount / 100 : null
      providerCurrency = "NPR"
    } else if (donation.provider === "esewa") {
      providerAmount = payload.total_amount ? parseFloat(payload.total_amount) : null
      providerCurrency = "NPR"
    }

    if (providerAmount === null) return null

    const expectedAmount = donation.amount
    const mismatch = Math.abs(expectedAmount - providerAmount) > 0.01

    return {
      expected: expectedAmount,
      actual: providerAmount,
      currency: providerCurrency || donation.currency,
      mismatch,
    }
  }

  const getAgeInHours = (createdAt: string) => {
    const created = new Date(createdAt)
    const now = new Date()
    const diffMs = now.getTime() - created.getTime()
    return Math.floor(diffMs / (1000 * 60 * 60))
  }

  if (donations.length === 0) {
    return (
      <Alert>
        <CheckCircle2 className="h-4 w-4" />
        <AlertDescription>
          No donations require review. All payments have been processed successfully!
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">
            {donations.length} donation{donations.length !== 1 ? "s" : ""} requiring review
          </p>
        </div>

        {donations.map((donation) => {
          const amountDetails = getAmountMismatchDetails(donation)
          const ageHours = getAgeInHours(donation.created_at)
          const isOld = ageHours > 24
          const isExpanded = expandedPayloads.has(donation.id)
          const latestEvent = donation.payment_events?.[0]

          return (
            <Card key={donation.id} className={isOld ? "border-orange-500" : ""}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {donation.donor_name}
                      {isOld && (
                        <Badge variant="destructive" className="text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          {ageHours}h old
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      {donation.donor_email}
                      {donation.donor_phone && ` • ${donation.donor_phone}`}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    REVIEW
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Amount Information */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium mb-1">Expected Amount:</p>
                    <p className="text-lg font-bold">
                      {formatCurrency(donation.amount, donation.currency, { showCode: true })}
                    </p>
                  </div>
                  {amountDetails && (
                    <div>
                      <p className="text-sm font-medium mb-1">Provider Amount:</p>
                      <p className={`text-lg font-bold ${amountDetails.mismatch ? "text-red-600" : "text-green-600"}`}>
                        {formatCurrency(amountDetails.actual, amountDetails.currency, { showCode: true })}
                      </p>
                    </div>
                  )}
                </div>

                {/* Amount Mismatch Warning */}
                {amountDetails?.mismatch && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Amount Mismatch Detected:</strong> Expected{" "}
                      {formatCurrency(amountDetails.expected, amountDetails.currency)} but provider reported{" "}
                      {formatCurrency(amountDetails.actual, amountDetails.currency)}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Payment Details */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium">Provider:</p>
                    <p className="text-muted-foreground capitalize">{donation.provider || "Unknown"}</p>
                  </div>
                  <div>
                    <p className="font-medium">Provider Reference:</p>
                    <p className="text-muted-foreground text-xs break-all">
                      {donation.provider_ref || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">Created:</p>
                    <p className="text-muted-foreground">
                      {new Date(donation.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">Age:</p>
                    <p className="text-muted-foreground">
                      {ageHours < 1 ? "< 1 hour" : `${ageHours} hours`}
                    </p>
                  </div>
                </div>

                {/* Audit Trail */}
                {(donation.reviewed_by || donation.reviewed_at || donation.review_notes) && (
                  <div className="border rounded-lg p-3 bg-muted/50">
                    <p className="text-sm font-medium mb-2">Previous Review Attempt</p>
                    <div className="text-xs text-muted-foreground space-y-1">
                      {donation.reviewed_at && (
                        <p><strong>Reviewed At:</strong> {new Date(donation.reviewed_at).toLocaleString()}</p>
                      )}
                      {donation.reviewed_by && (
                        <p><strong>Reviewed By:</strong> {donation.reviewed_by}</p>
                      )}
                      {donation.review_notes && (
                        <p><strong>Notes:</strong> {donation.review_notes}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Raw Provider Payload */}
                {latestEvent && (
                  <div className="border rounded-lg p-3">
                    <button
                      onClick={() => togglePayloadExpansion(donation.id)}
                      className="flex items-center justify-between w-full text-sm font-medium mb-2"
                    >
                      <span>Raw Provider Payload ({latestEvent.provider})</span>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>
                    
                    {isExpanded && (
                      <div className="space-y-2">
                        <div className="text-xs text-muted-foreground">
                          <p><strong>Event ID:</strong> {latestEvent.event_id}</p>
                          <p><strong>Event Type:</strong> {latestEvent.event_type || "N/A"}</p>
                          <p><strong>Received:</strong> {new Date(latestEvent.created_at).toLocaleString()}</p>
                        </div>
                        <pre className="text-xs bg-muted p-3 rounded overflow-x-auto max-h-64 overflow-y-auto">
                          {JSON.stringify(latestEvent.raw_payload, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>

              <CardFooter className="flex gap-2">
                <Button
                  onClick={() => {
                    setSelectedDonation(donation)
                    setActionType("approve")
                  }}
                  variant="default"
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Approve
                </Button>
                <Button
                  onClick={() => {
                    setSelectedDonation(donation)
                    setActionType("reject")
                  }}
                  variant="destructive"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject
                </Button>
              </CardFooter>
            </Card>
          )
        })}
      </div>

      {/* Action Dialog */}
      {selectedDonation && actionType && (
        <ReviewActionDialog
          donation={selectedDonation}
          actionType={actionType}
          onClose={() => {
            setSelectedDonation(null)
            setActionType(null)
          }}
          onComplete={handleActionComplete}
        />
      )}
    </>
  )
}
