"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Download, Search, Trash2, Filter } from "lucide-react"
import { notifications } from "@/lib/notifications"
import { clearOldLogs, exportLogs } from "./actions"
import { useRouter } from "next/navigation"

interface Log {
  id: string
  provider: string
  event_id: string
  donation_id: string
  event_type: string | null
  raw_payload: any
  processed_at: string | null
  created_at: string
  donations: {
    id: string
    donor_name: string
    donor_email: string
    amount: number
    currency: string
  } | null
}

interface LogsClientProps {
  logs: Log[]
  stats: {
    total: number
    last24h: number
    last7d: number
  }
}

export function LogsClient({ logs: initialLogs, stats }: LogsClientProps) {
  const router = useRouter()
  const [logs, setLogs] = useState(initialLogs)
  const [searchTerm, setSearchTerm] = useState("")
  const [provider, setProvider] = useState("all")
  const [isClearing, setIsClearing] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  const handleSearch = () => {
    const params = new URLSearchParams()
    if (searchTerm) params.set("search", searchTerm)
    if (provider !== "all") params.set("provider", provider)
    router.push(`/admin/payments/logs?${params.toString()}`)
  }

  const handleClearOldLogs = async () => {
    if (!confirm("Are you sure you want to clear logs older than 90 days? This cannot be undone.")) {
      return
    }

    setIsClearing(true)
    try {
      const result = await clearOldLogs(90)
      if (result.success) {
        notifications.showSuccess({
          title: "Logs Cleared",
          description: `${result.deleted} old log entries removed`
        })
        router.refresh()
      } else {
        notifications.showError({
          title: "Clear Failed",
          description: result.message
        })
      }
    } catch (error) {
      notifications.showError({ description: "Failed to clear logs" })
    } finally {
      setIsClearing(false)
    }
  }

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const result = await exportLogs({ provider: provider !== "all" ? provider : undefined })
      if (result.success && result.data) {
        // Create CSV and download
        const csv = convertToCSV(result.data)
        const blob = new Blob([csv], { type: "text/csv" })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `payment-logs-${new Date().toISOString().split("T")[0]}.csv`
        a.click()
        window.URL.revokeObjectURL(url)
        notifications.showSuccess("Logs exported successfully")
      } else {
        notifications.showError({ description: "Failed to export logs" })
      }
    } catch (error) {
      notifications.showError({ description: "Failed to export logs" })
    } finally {
      setIsExporting(false)
    }
  }

  const convertToCSV = (data: any[]) => {
    if (data.length === 0) return ""
    
    const headers = ["Date", "Provider", "Event ID", "Donation ID", "Donor", "Amount", "Event Type"]
    const rows = data.map(log => [
      new Date(log.created_at).toLocaleString(),
      log.provider,
      log.event_id,
      log.donation_id,
      log.donations?.donor_name || "N/A",
      log.donations ? `${log.donations.amount} ${log.donations.currency}` : "N/A",
      log.event_type || "N/A"
    ])
    
    return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(",")).join("\n")
  }

  const getProviderBadge = (provider: string) => {
    const colors: Record<string, string> = {
      stripe: "bg-purple-500",
      khalti: "bg-purple-700",
      esewa: "bg-green-600",
      system: "bg-blue-500",
    }
    return (
      <Badge className={colors[provider] || "bg-gray-500"}>
        {provider.toUpperCase()}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Logs</CardDescription>
            <CardTitle className="text-3xl">{stats.total.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Last 24 Hours</CardDescription>
            <CardTitle className="text-3xl">{stats.last24h.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Last 7 Days</CardDescription>
            <CardTitle className="text-3xl">{stats.last7d.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Filters & Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by event ID, donation ID, or donor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <Select value={provider} onValueChange={setProvider}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Providers</SelectItem>
                <SelectItem value="stripe">Stripe</SelectItem>
                <SelectItem value="khalti">Khalti</SelectItem>
                <SelectItem value="esewa">eSewa</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleSearch}>
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleExport} disabled={isExporting} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              {isExporting ? "Exporting..." : "Export CSV"}
            </Button>
            <Button
              onClick={handleClearOldLogs}
              disabled={isClearing}
              variant="destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {isClearing ? "Clearing..." : "Clear Old Logs (90+ days)"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Logs ({logs.length})</CardTitle>
          <CardDescription>Showing most recent 100 entries</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {logs.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No logs found</p>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      {getProviderBadge(log.provider)}
                      <span className="text-sm font-mono text-muted-foreground">
                        {log.event_id}
                      </span>
                    </div>
                    {log.donations && (
                      <div className="text-sm">
                        <span className="font-medium">{log.donations.donor_name}</span>
                        <span className="text-muted-foreground"> • </span>
                        <span className="text-muted-foreground">
                          {log.donations.amount} {log.donations.currency}
                        </span>
                      </div>
                    )}
                    {log.event_type && (
                      <div className="text-xs text-muted-foreground">
                        Type: {log.event_type}
                      </div>
                    )}
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    {new Date(log.created_at).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
