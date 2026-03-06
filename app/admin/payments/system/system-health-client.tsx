"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  AlertCircle,
  CheckCircle2,
  Database,
  RefreshCw,
  Server,
  Settings,
  XCircle,
  Clock,
  Activity,
} from "lucide-react"
import { notifications } from "@/lib/notifications"
import { triggerReconciliation, checkProviderStatus } from "./actions"

interface SystemHealth {
  database: {
    status: string
    latency: number
    tablesExist: {
      payment_events: boolean
      receipt_failures: boolean
      email_failures: boolean
    }
  }
  reconciliation: {
    timestamp: string
    donationsChecked: number
    donationsReconciled: number
    status: string
  }
  alerts: {
    stuckDonations: number
    reviewDonations: number
  }
  environment: {
    stripeKey: boolean
    stripeWebhook: boolean
    khaltiKey: boolean
    esewaKey: boolean
    esewaMerchant: boolean
    supabaseUrl: boolean
    supabaseKey: boolean
    paymentMode: string
  }
  timestamp: string
}

interface SystemHealthClientProps {
  initialHealth: SystemHealth
}

export function SystemHealthClient({ initialHealth }: SystemHealthClientProps) {
  const [health, setHealth] = useState(initialHealth)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isReconciling, setIsReconciling] = useState(false)
  const [providerStatus, setProviderStatus] = useState<any>(null)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      // Reload the page to get fresh data
      window.location.reload()
    } catch (error) {
      notifications.showError({ description: "Failed to refresh" })
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleReconciliation = async () => {
    setIsReconciling(true)
    try {
      const result = await triggerReconciliation()
      if (result.success) {
        notifications.showSuccess({
          title: "Reconciliation Complete",
          description: `${result.reconciled} donations processed`
        })
        handleRefresh()
      } else {
        notifications.showError({
          title: "Reconciliation Failed",
          description: result.message
        })
      }
    } catch (error) {
      notifications.showError({ description: "Failed to trigger reconciliation" })
    } finally {
      setIsReconciling(false)
    }
  }

  const handleCheckProviders = async () => {
    try {
      const result = await checkProviderStatus()
      setProviderStatus(result)
      notifications.showSuccess("Provider status checked")
    } catch (error) {
      notifications.showError({ description: "Failed to check provider status" })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "healthy":
        return <Badge className="bg-green-500">Healthy</Badge>
      case "slow":
        return <Badge variant="secondary">Slow</Badge>
      case "error":
        return <Badge variant="destructive">Error</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const getStatusIcon = (isHealthy: boolean) => {
    return isHealthy ? (
      <CheckCircle2 className="h-5 w-5 text-green-500" />
    ) : (
      <XCircle className="h-5 w-5 text-destructive" />
    )
  }

  const overallHealthy =
    health.database.status === "healthy" &&
    health.alerts.stuckDonations === 0 &&
    Object.values(health.database.tablesExist).every((exists) => exists)

  return (
    <div className="space-y-6">
      {/* Overall Status */}
      <Card className={overallHealthy ? "border-green-500" : "border-yellow-500"}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-6 w-6" />
              <CardTitle>Overall System Status</CardTitle>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleRefresh} disabled={isRefreshing} size="sm" variant="outline">
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </div>
          <CardDescription>
            Last updated: {new Date(health.timestamp).toLocaleString()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {overallHealthy ? (
            <Alert className="border-green-500">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <AlertTitle>All Systems Operational</AlertTitle>
              <AlertDescription>
                All components are functioning normally
              </AlertDescription>
            </Alert>
          ) : (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Attention Required</AlertTitle>
              <AlertDescription>
                Some components need attention. Review details below.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Database Health */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            <CardTitle>Database Health</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Connection Status</span>
            {getStatusBadge(health.database.status)}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Query Latency</span>
            <span className="text-sm text-muted-foreground">{health.database.latency}ms</span>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">Required Tables</p>
            <div className="space-y-1">
              {Object.entries(health.database.tablesExist).map(([table, exists]) => (
                <div key={table} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{table}</span>
                  {getStatusIcon(exists)}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Environment Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            <CardTitle>Environment Configuration</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Payment Mode</span>
            <Badge variant={health.environment.paymentMode === "live" ? "default" : "secondary"}>
              {health.environment.paymentMode.toUpperCase()}
            </Badge>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">Provider Credentials</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Stripe Key</span>
                {getStatusIcon(health.environment.stripeKey)}
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Stripe Webhook</span>
                {getStatusIcon(health.environment.stripeWebhook)}
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Khalti Key</span>
                {getStatusIcon(health.environment.khaltiKey)}
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">eSewa Key</span>
                {getStatusIcon(health.environment.esewaKey)}
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">eSewa Merchant</span>
                {getStatusIcon(health.environment.esewaMerchant)}
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Supabase</span>
                {getStatusIcon(health.environment.supabaseUrl && health.environment.supabaseKey)}
              </div>
            </div>
          </div>
          <Button onClick={handleCheckProviders} variant="outline" size="sm" className="w-full">
            <Server className="h-4 w-4 mr-2" />
            Test Provider Connectivity
          </Button>
          {providerStatus && (
            <div className="space-y-2 mt-4">
              <p className="text-sm font-medium">Provider Status</p>
              <div className="space-y-1">
                {Object.entries(providerStatus).map(([provider, status]: [string, any]) => (
                  <div key={provider} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground capitalize">{provider}</span>
                    {getStatusIcon(status.healthy)}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reconciliation */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            <CardTitle>Reconciliation</CardTitle>
          </div>
          <CardDescription>Automatic stuck donation recovery</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Last Run</span>
            <span className="text-sm text-muted-foreground">
              {new Date(health.reconciliation.timestamp).toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Donations Checked</span>
            <span className="text-sm text-muted-foreground">
              {health.reconciliation.donationsChecked}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Donations Reconciled</span>
            <span className="text-sm text-muted-foreground">
              {health.reconciliation.donationsReconciled}
            </span>
          </div>
          <Button
            onClick={handleReconciliation}
            disabled={isReconciling}
            variant="outline"
            className="w-full"
          >
            {isReconciling ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Running Reconciliation...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Run Manual Reconciliation
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Active Alerts */}
      {(health.alerts.stuckDonations > 0 || health.alerts.reviewDonations > 0) && (
        <Card className="border-yellow-500">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              <CardTitle>Active Alerts</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {health.alerts.stuckDonations > 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {health.alerts.stuckDonations} donation(s) stuck in PENDING status for over 1 hour
                </AlertDescription>
              </Alert>
            )}
            {health.alerts.reviewDonations > 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {health.alerts.reviewDonations} donation(s) require manual review
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
