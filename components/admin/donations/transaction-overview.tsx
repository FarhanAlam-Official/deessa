"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatRelativeTime, formatAbsoluteTime } from "@/lib/utils/date-formatting"

interface TransactionOverviewProps {
  donation: {
    id: string
    amount: number
    currency: string
    payment_status: string
    provider: string
    receipt_number?: string | null
    created_at: string
    confirmed_at?: string | null
    receipt_sent_at?: string | null
    reviewed_at?: string | null
    reviewed_by?: string | null
  }
  reviewedByName?: string | null
}

export function TransactionOverview({ donation, reviewedByName }: TransactionOverviewProps) {
  const formatTimestamp = (date: string | null | undefined) => {
    if (!date) return "—"
    const relative = formatRelativeTime(date)
    const absolute = formatAbsoluteTime(date)
    return (
      <span title={absolute || undefined} className="cursor-help">
        {relative || absolute || "—"}
      </span>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transaction Overview</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Mobile: Single column with prominent amount at top */}
        {/* Desktop: Two-column grid layout */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Left Column */}
          <div className="space-y-4">
            {/* Amount - Prominent on all screen sizes */}
            <div className="md:order-4">
              <div className="text-sm font-medium text-muted-foreground">Amount</div>
              <div className="text-3xl md:text-3xl font-bold mt-1">
                {donation.currency} {donation.amount.toFixed(2)}
              </div>
            </div>

            <div>
              <div className="text-sm font-medium text-muted-foreground">Transaction ID</div>
              <div className="font-mono text-sm break-all">{donation.id}</div>
            </div>

            <div>
              <div className="text-sm font-medium text-muted-foreground">Receipt Number</div>
              <div className="font-mono text-sm break-all">{donation.receipt_number || "—"}</div>
            </div>

            <div>
              <div className="text-sm font-medium text-muted-foreground">Type</div>
              <div className="text-sm">Donation</div>
            </div>

            <div>
              <div className="text-sm font-medium text-muted-foreground">Payment Status</div>
              <div className="mt-1">
                <Badge
                  variant="outline"
                  className={
                    donation.payment_status === "completed"
                      ? "bg-green-100 text-green-800 border-green-200"
                      : donation.payment_status === "pending"
                        ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                        : donation.payment_status === "failed"
                          ? "bg-red-100 text-red-800 border-red-200"
                          : "bg-orange-100 text-orange-800 border-orange-200"
                  }
                >
                  {donation.payment_status.toUpperCase()}
                </Badge>
              </div>
            </div>

            <div>
              <div className="text-sm font-medium text-muted-foreground">Payment Method</div>
              <div className="text-sm capitalize">{donation.provider || "—"}</div>
            </div>

            <div>
              <div className="text-sm font-medium text-muted-foreground">Payment Provider</div>
              <div className="text-sm capitalize">{donation.provider}</div>
            </div>
          </div>

          {/* Right Column - Timestamps stacked vertically */}
          <div className="space-y-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground">Created At</div>
              <div className="text-sm break-words">{formatTimestamp(donation.created_at)}</div>
            </div>

            <div>
              <div className="text-sm font-medium text-muted-foreground">Confirmed At</div>
              <div className="text-sm break-words">{formatTimestamp(donation.confirmed_at)}</div>
            </div>

            <div>
              <div className="text-sm font-medium text-muted-foreground">Receipt Sent At</div>
              <div className="text-sm break-words">{formatTimestamp(donation.receipt_sent_at)}</div>
            </div>

            <div>
              <div className="text-sm font-medium text-muted-foreground">Reviewed At</div>
              <div className="text-sm break-words">{formatTimestamp(donation.reviewed_at)}</div>
            </div>

            <div>
              <div className="text-sm font-medium text-muted-foreground">Reviewed By</div>
              <div className="text-sm break-words">{reviewedByName || "—"}</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
