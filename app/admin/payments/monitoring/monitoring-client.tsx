"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertTriangle, CheckCircle2, Mail, Receipt, TrendingDown, TrendingUp } from "lucide-react"
import Link from "next/link"

interface MonitoringStats {
  receipt: {
    failures24h: number
    failures7d: number
    failures30d: number
    total24h: number
    total7d: number
    total30d: number
    recentFailures: any[]
  }
  email: {
    failures24h: number
    failures7d: number
    failures30d: number
    total24h: number
    total7d: number
    total30d: number
    recentFailures: any[]
  }
}

interface PostPaymentMonitoringClientProps {
  stats: MonitoringStats
}

export function PostPaymentMonitoringClient({ stats }: PostPaymentMonitoringClientProps) {
  const calculateSuccessRate = (failures: number, total: number) => {
    if (total === 0) return 100
    return ((total - failures) / total) * 100
  }

  const receiptSuccessRate24h = calculateSuccessRate(stats.receipt.failures24h, stats.receipt.total24h)
  const receiptSuccessRate7d = calculateSuccessRate(stats.receipt.failures7d, stats.receipt.total7d)
  const receiptSuccessRate30d = calculateSuccessRate(stats.receipt.failures30d, stats.receipt.total30d)

  const emailSuccessRate24h = calculateSuccessRate(stats.email.failures24h, stats.email.total24h)
  const emailSuccessRate7d = calculateSuccessRate(stats.email.failures7d, stats.email.total7d)
  const emailSuccessRate30d = calculateSuccessRate(stats.email.failures30d, stats.email.total30d)

  const isAlertThreshold = (rate: number) => rate < 95

  return (
    <div className="space-y-6">
      {/* Alerts */}
      {(isAlertThreshold(receiptSuccessRate24h) || isAlertThreshold(emailSuccessRate24h)) && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>High Failure Rate Detected</AlertTitle>
          <AlertDescription>
            {isAlertThreshold(receiptSuccessRate24h) && (
              <p>Receipt generation success rate is below 95% in the last 24 hours.</p>
            )}
            {isAlertThreshold(emailSuccessRate24h) && (
              <p>Email sending success rate is below 95% in the last 24 hours.</p>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Success Rate Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Receipt Generation */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Receipt Generation
              </CardTitle>
              {receiptSuccessRate24h >= 95 ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-destructive" />
              )}
            </div>
            <CardDescription>Success rates across different time periods</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Last 24 hours</span>
                <Badge variant={receiptSuccessRate24h >= 95 ? "default" : "destructive"}>
                  {receiptSuccessRate24h.toFixed(1)}%
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                {stats.receipt.failures24h} failures out of {stats.receipt.total24h} donations
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Last 7 days</span>
                <Badge variant={receiptSuccessRate7d >= 95 ? "default" : "destructive"}>
                  {receiptSuccessRate7d.toFixed(1)}%
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                {stats.receipt.failures7d} failures out of {stats.receipt.total7d} donations
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Last 30 days</span>
                <Badge variant={receiptSuccessRate30d >= 95 ? "default" : "destructive"}>
                  {receiptSuccessRate30d.toFixed(1)}%
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                {stats.receipt.failures30d} failures out of {stats.receipt.total30d} donations
              </div>
            </div>

            {stats.receipt.failures24h > 0 && (
              <Button asChild variant="outline" className="w-full mt-4">
                <Link href="/admin/receipts/failed">
                  View Failed Receipts ({stats.receipt.failures24h})
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Email Sending */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Sending
              </CardTitle>
              {emailSuccessRate24h >= 95 ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-destructive" />
              )}
            </div>
            <CardDescription>Success rates across different time periods</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Last 24 hours</span>
                <Badge variant={emailSuccessRate24h >= 95 ? "default" : "destructive"}>
                  {emailSuccessRate24h.toFixed(1)}%
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                {stats.email.failures24h} failures out of {stats.email.total24h} donations
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Last 7 days</span>
                <Badge variant={emailSuccessRate7d >= 95 ? "default" : "destructive"}>
                  {emailSuccessRate7d.toFixed(1)}%
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                {stats.email.failures7d} failures out of {stats.email.total7d} donations
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Last 30 days</span>
                <Badge variant={emailSuccessRate30d >= 95 ? "default" : "destructive"}>
                  {emailSuccessRate30d.toFixed(1)}%
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                {stats.email.failures30d} failures out of {stats.email.total30d} donations
              </div>
            </div>

            {stats.email.failures24h > 0 && (
              <Button asChild variant="outline" className="w-full mt-4">
                <Link href="/admin/receipts/emails/failed">
                  View Failed Emails ({stats.email.failures24h})
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Failures */}
      {(stats.receipt.recentFailures.length > 0 || stats.email.recentFailures.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Failures</CardTitle>
            <CardDescription>Most recent unresolved failures requiring attention</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats.receipt.recentFailures.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Receipt className="h-4 w-4" />
                  Receipt Failures
                </h3>
                <div className="space-y-2">
                  {stats.receipt.recentFailures.slice(0, 5).map((failure: any) => (
                    <div
                      key={failure.id}
                      className="flex items-center justify-between p-2 bg-muted rounded text-sm"
                    >
                      <div>
                        <p className="font-medium">
                          {failure.donations?.donor_name || "Unknown"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {failure.error_type} • {failure.attempt_count} attempts
                        </p>
                      </div>
                      <Button asChild size="sm" variant="outline">
                        <Link href="/admin/receipts/failed">Fix</Link>
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {stats.email.recentFailures.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Failures
                </h3>
                <div className="space-y-2">
                  {stats.email.recentFailures.slice(0, 5).map((failure: any) => (
                    <div
                      key={failure.id}
                      className="flex items-center justify-between p-2 bg-muted rounded text-sm"
                    >
                      <div>
                        <p className="font-medium">
                          {failure.donations?.donor_name || "Unknown"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {failure.error_type} • {failure.attempt_count} attempts
                        </p>
                      </div>
                      <Button asChild size="sm" variant="outline">
                        <Link href="/admin/receipts/emails/failed">Fix</Link>
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Recommendations</CardTitle>
          <CardDescription>Actions to improve reliability</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {receiptSuccessRate24h < 95 && (
            <Alert>
              <TrendingDown className="h-4 w-4" />
              <AlertDescription>
                Receipt generation failure rate is high. Check storage connectivity and RPC function availability.
              </AlertDescription>
            </Alert>
          )}
          {emailSuccessRate24h < 95 && (
            <Alert>
              <TrendingDown className="h-4 w-4" />
              <AlertDescription>
                Email sending failure rate is high. Check SMTP configuration and network connectivity.
              </AlertDescription>
            </Alert>
          )}
          {stats.receipt.failures7d > 10 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                More than 10 receipt failures in the last 7 days. Consider implementing automated retry with a job queue.
                See Phase 4 Scaling Guide in tasks.md.
              </AlertDescription>
            </Alert>
          )}
          {receiptSuccessRate24h >= 95 && emailSuccessRate24h >= 95 && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                All systems operating normally. Success rates are above 95% threshold.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
