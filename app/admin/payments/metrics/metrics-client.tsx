"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Download, TrendingUp, TrendingDown } from "lucide-react"
import { notifications } from "@/lib/notifications"

interface MetricsData {
  dailyDonations: Array<{ date: string; count: number }>
  providerStats: Array<{ provider: string; count: number; amount: number }>
  successRates: {
    receipt: number
    email: number
  }
  statusBreakdown: Array<{ status: string; count: number }>
}

interface MetricsClientProps {
  metrics: MetricsData
}

export function MetricsClient({ metrics }: MetricsClientProps) {
  const handleExport = () => {
    try {
      // Create CSV data
      const csv = [
        ["Metric", "Value"],
        ["Receipt Success Rate", `${metrics.successRates.receipt.toFixed(2)}%`],
        ["Email Success Rate", `${metrics.successRates.email.toFixed(2)}%`],
        ...metrics.providerStats.map(p => [
          `${p.provider.toUpperCase()} Donations`,
          `${p.count} (${p.amount.toFixed(2)})`
        ]),
        ...metrics.statusBreakdown.map(s => [
          `${s.status.toUpperCase()} Status`,
          s.count.toString()
        ]),
      ].map(row => row.join(",")).join("\n")

      const blob = new Blob([csv], { type: "text/csv" })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `payment-metrics-${new Date().toISOString().split("T")[0]}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
      
      notifications.showSuccess("Metrics exported successfully")
    } catch (error) {
      notifications.showError({ description: "Failed to export metrics" })
    }
  }

  const maxDonations = Math.max(...metrics.dailyDonations.map(d => d.count), 1)
  const totalDonations = metrics.providerStats.reduce((sum, p) => sum + p.count, 0)
  const totalAmount = metrics.providerStats.reduce((sum, p) => sum + p.amount, 0)

  const getProviderColor = (provider: string) => {
    const colors: Record<string, string> = {
      stripe: "bg-purple-500",
      khalti: "bg-purple-700",
      esewa: "bg-green-600",
    }
    return colors[provider] || "bg-gray-500"
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-500",
      confirmed: "bg-green-500",
      review: "bg-blue-500",
      failed: "bg-red-500",
    }
    return colors[status] || "bg-gray-500"
  }

  return (
    <div className="space-y-6">
      {/* Export Button */}
      <div className="flex justify-end">
        <Button onClick={handleExport} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Success Rates */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Receipt Generation</CardTitle>
            <CardDescription>Success rate (last 24 hours)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-4xl font-bold">
                {metrics.successRates.receipt.toFixed(1)}%
              </div>
              {metrics.successRates.receipt >= 95 ? (
                <TrendingUp className="h-8 w-8 text-green-500" />
              ) : (
                <TrendingDown className="h-8 w-8 text-destructive" />
              )}
            </div>
            <div className="mt-4 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all"
                style={{ width: `${metrics.successRates.receipt}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Email Delivery</CardTitle>
            <CardDescription>Success rate (last 24 hours)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-4xl font-bold">
                {metrics.successRates.email.toFixed(1)}%
              </div>
              {metrics.successRates.email >= 95 ? (
                <TrendingUp className="h-8 w-8 text-green-500" />
              ) : (
                <TrendingDown className="h-8 w-8 text-destructive" />
              )}
            </div>
            <div className="mt-4 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all"
                style={{ width: `${metrics.successRates.email}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Provider Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Provider Performance</CardTitle>
          <CardDescription>Total donations by payment provider</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {metrics.providerStats.map((provider) => (
            <div key={provider.provider} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className={getProviderColor(provider.provider)}>
                    {provider.provider.toUpperCase()}
                  </Badge>
                  <span className="text-sm font-medium">
                    {provider.count} donations
                  </span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {provider.amount.toLocaleString()} NPR
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full ${getProviderColor(provider.provider)} transition-all`}
                  style={{ width: `${(provider.count / totalDonations) * 100}%` }}
                />
              </div>
            </div>
          ))}
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between text-sm font-medium">
              <span>Total</span>
              <span>{totalAmount.toLocaleString()} NPR</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Donation Status</CardTitle>
          <CardDescription>Current status distribution</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {metrics.statusBreakdown.map((status) => (
              <div key={status.status} className="text-center">
                <div className={`text-3xl font-bold ${getStatusColor(status.status).replace("bg-", "text-")}`}>
                  {status.count}
                </div>
                <div className="text-sm text-muted-foreground capitalize mt-1">
                  {status.status}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Daily Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Donations (Last 30 Days)</CardTitle>
          <CardDescription>Confirmed donations per day</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-end justify-between gap-1">
            {metrics.dailyDonations.map((day, index) => (
              <div
                key={day.date}
                className="flex-1 bg-primary hover:bg-primary/80 transition-colors rounded-t cursor-pointer relative group"
                style={{ height: `${(day.count / maxDonations) * 100}%`, minHeight: day.count > 0 ? "4px" : "0" }}
                title={`${day.date}: ${day.count} donations`}
              >
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  {new Date(day.date).toLocaleDateString()}: {day.count}
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>{metrics.dailyDonations[0]?.date}</span>
            <span>{metrics.dailyDonations[metrics.dailyDonations.length - 1]?.date}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
