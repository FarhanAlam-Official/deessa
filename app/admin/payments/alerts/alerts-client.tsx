"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react"
import Link from "next/link"

interface AlertData {
  alerts: Array<{
    id: string
    type: string
    severity: string
    title: string
    message: string
    count: number
    timestamp: string
    acknowledged: boolean
  }>
  stuckDonations: any[]
  reviewDonations: any[]
  receiptFailures: any[]
  emailFailures: any[]
}

interface AlertsClientProps {
  data: AlertData
}

export function AlertsClient({ data }: AlertsClientProps) {
  const [alerts, setAlerts] = useState(data.alerts)

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "error":
        return <XCircle className="h-5 w-5 text-destructive" />
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case "info":
        return <Info className="h-5 w-5 text-blue-500" />
      default:
        return <AlertCircle className="h-5 w-5" />
    }
  }

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "error":
        return <Badge variant="destructive">Error</Badge>
      case "warning":
        return <Badge className="bg-yellow-500">Warning</Badge>
      case "info":
        return <Badge variant="secondary">Info</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const getActionLink = (type: string) => {
    switch (type) {
      case "stuck_donations":
        return "/admin/payments/system"
      case "review_required":
        return "/admin/donations/review"
      case "receipt_failures":
        return "/admin/payments/receipts/failed"
      case "email_failures":
        return "/admin/payments/emails/failed"
      default:
        return "/admin/payments"
    }
  }

  if (alerts.length === 0) {
    return (
      <Alert className="border-green-500">
        <CheckCircle2 className="h-4 w-4 text-green-500" />
        <AlertTitle>No Active Alerts</AlertTitle>
        <AlertDescription>
          All systems are operating normally. No alerts require attention.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Alert Summary</CardTitle>
          <CardDescription>
            {alerts.length} active alert{alerts.length !== 1 ? "s" : ""} requiring attention
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-destructive">
                {alerts.filter((a) => a.severity === "error").length}
              </div>
              <div className="text-sm text-muted-foreground">Errors</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-500">
                {alerts.filter((a) => a.severity === "warning").length}
              </div>
              <div className="text-sm text-muted-foreground">Warnings</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500">
                {alerts.filter((a) => a.severity === "info").length}
              </div>
              <div className="text-sm text-muted-foreground">Info</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Alerts */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Active Alerts</h2>
        {alerts.map((alert) => (
          <Card key={alert.id} className="border-l-4" style={{
            borderLeftColor: alert.severity === "error" ? "hsl(var(--destructive))" :
                            alert.severity === "warning" ? "#eab308" : "#3b82f6"
          }}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  {getSeverityIcon(alert.severity)}
                  <div>
                    <CardTitle className="text-lg">{alert.title}</CardTitle>
                    <CardDescription className="mt-1">{alert.message}</CardDescription>
                  </div>
                </div>
                {getSeverityBadge(alert.severity)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  {new Date(alert.timestamp).toLocaleString()}
                </div>
                <Button asChild size="sm">
                  <Link href={getActionLink(alert.type)}>
                    View Details
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common actions to resolve alerts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {data.stuckDonations.length > 0 && (
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/admin/payments/system">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Run Manual Reconciliation ({data.stuckDonations.length} stuck)
              </Link>
            </Button>
          )}
          {data.reviewDonations.length > 0 && (
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/admin/donations/review">
                <Info className="h-4 w-4 mr-2" />
                Review Donations ({data.reviewDonations.length} pending)
              </Link>
            </Button>
          )}
          {data.receiptFailures.length > 0 && (
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/admin/payments/receipts/failed">
                <XCircle className="h-4 w-4 mr-2" />
                Retry Failed Receipts ({data.receiptFailures.length})
              </Link>
            </Button>
          )}
          {data.emailFailures.length > 0 && (
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/admin/payments/emails/failed">
                <XCircle className="h-4 w-4 mr-2" />
                Resend Failed Emails ({data.emailFailures.length})
              </Link>
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
