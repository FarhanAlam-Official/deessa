"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Calendar,
  Loader2,
  Search,
  X,
  DollarSign,
  HandHeart,
  TrendingUp,
  AlertCircle,
  Clock,
  ChevronDown,
  Filter,
  RotateCcw,
  Download,
} from "lucide-react"
import { formatCurrency } from "@/lib/utils/currency"
import { notifications } from "@/lib/notifications"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Donation = Record<string, any>

interface DonationStats {
  totals: Record<string, number>
  totalDonors: number
  monthlyDonors: number
  pendingCount: number
  failedCount: number
}

interface DonationsDashboardProps {
  initialDonations: Donation[]
  initialTotal: number
  initialStats: DonationStats
  pageSize?: number
}

// ─── Filter state ──────────────────────────────────────────────────────
interface Filters {
  status: string
  type: string
  currency: string
  search: string
}

const DEFAULT_FILTERS: Filters = {
  status: "all",
  type: "all",
  currency: "all",
  search: "",
}

// ─── Status badge config ──────────────────────────────────────────────
const statusConfig: Record<string, { className: string; icon: React.ReactNode }> = {
  completed: {
    className: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800",
    icon: <DollarSign className="h-3 w-3" />,
  },
  pending: {
    className: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800",
    icon: <Clock className="h-3 w-3" />,
  },
  failed: {
    className: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800",
    icon: <AlertCircle className="h-3 w-3" />,
  },
}

function buildQueryString(filters: Filters, page: number, limit: number) {
  const params = new URLSearchParams()
  params.set("page", String(page))
  params.set("limit", String(limit))
  if (filters.status !== "all") params.set("status", filters.status)
  if (filters.type !== "all") params.set("type", filters.type)
  if (filters.currency !== "all") params.set("currency", filters.currency)
  if (filters.search.trim()) params.set("search", filters.search.trim())
  return params.toString()
}

// ─── Stat Card ────────────────────────────────────────────────────────
function StatCard({
  title,
  value,
  subtitle,
  icon,
  color,
}: {
  title: string
  value: React.ReactNode
  subtitle?: string
  icon: React.ReactNode
  color: string
}) {
  return (
    <Card className="relative overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow">
      <div className={`absolute inset-0 ${color} opacity-[0.04]`} />
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {title}
            </p>
            <div className="text-2xl font-bold tracking-tight">{value}</div>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <div className={`h-10 w-10 rounded-xl ${color} flex items-center justify-center`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ═══════════════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════════════

export function DonationsDashboard({
  initialDonations,
  initialTotal,
  initialStats,
  pageSize = 25,
}: DonationsDashboardProps) {
  const [donations, setDonations] = useState<Donation[]>(initialDonations)
  const [total, setTotal] = useState(initialTotal)
  const [stats, setStats] = useState<DonationStats>(initialStats)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(false)
  const [filtersLoading, setFiltersLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const hasMore = donations.length < total
  const hasActiveFilters =
    filters.status !== "all" ||
    filters.type !== "all" ||
    filters.currency !== "all" ||
    filters.search.trim() !== ""

  // ─── Fetch with filters (resets list) ─────────────────────────────
  const fetchFiltered = useCallback(
    async (newFilters: Filters) => {
      setFiltersLoading(true)
      try {
        const qs = buildQueryString(newFilters, 0, pageSize)
        const res = await fetch(`/api/admin/donations?${qs}`)
        if (!res.ok) throw new Error("Failed to fetch")
        const data = await res.json()
        setDonations(data.donations)
        setTotal(data.total)
        setStats(data.stats)
        setPage(0)
      } catch (err) {
        console.error("Filter fetch error:", err)
      } finally {
        setFiltersLoading(false)
      }
    },
    [pageSize]
  )

  // ─── Load more (appends) ──────────────────────────────────────────
  const loadMore = useCallback(async () => {
    setLoading(true)
    try {
      const nextPage = page + 1
      const qs = buildQueryString(filters, nextPage, pageSize)
      const res = await fetch(`/api/admin/donations?${qs}`)
      if (!res.ok) throw new Error("Failed to fetch")
      const data = await res.json()
      setDonations((prev) => [...prev, ...data.donations])
      setTotal(data.total)
      setStats(data.stats)
      setPage(nextPage)
    } catch (err) {
      console.error("Load more error:", err)
    } finally {
      setLoading(false)
    }
  }, [page, filters, pageSize])

  // ─── Filter handlers ──────────────────────────────────────────────
  function updateFilter(key: keyof Filters, value: string) {
    const next = { ...filters, [key]: value }
    setFilters(next)
    if (key !== "search") {
      fetchFiltered(next)
    }
  }

  // Debounced search
  function handleSearchChange(value: string) {
    setFilters((f) => ({ ...f, search: value }))
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => {
      fetchFiltered({ ...filters, search: value })
    }, 400)
  }

  function clearFilters() {
    setFilters(DEFAULT_FILTERS)
    fetchFiltered(DEFAULT_FILTERS)
  }

  // ─── Export handler ──────────────────────────────────────────────
  async function handleExport() {
    setExporting(true)
    try {
      const params = new URLSearchParams()
      if (filters.status !== "all") params.set("status", filters.status)
      if (filters.type !== "all") params.set("type", filters.type)
      if (filters.currency !== "all") params.set("currency", filters.currency)
      if (filters.search.trim()) params.set("search", filters.search.trim())

      const res = await fetch(`/api/admin/donations/export?${params.toString()}`)
      if (!res.ok) throw new Error("Export failed")

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `donations-export-${new Date().toISOString().split("T")[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      notifications.showSuccess({
        title: "Export Complete",
        description: `${total} donation record${total === 1 ? "" : "s"} exported${hasActiveFilters ? " (filtered)" : ""}.`,
      })
    } catch (err) {
      console.error("Export error:", err)
      notifications.showError({
        title: "Export Failed",
        description: "Could not export donations. Please try again.",
      })
    } finally {
      setExporting(false)
    }
  }

  // Cleanup
  useEffect(() => {
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current)
    }
  }, [])

  // ─── Render helpers ─────────────────────────────────────────────────
  const totalAmount = Object.entries(stats.totals)

  return (
    <div className="space-y-6">
      {/* ── Stat Cards ──────────────────────────────────────────────── */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Received"
          value={
            totalAmount.length > 0 ? (
              <div className="space-y-0.5">
                {totalAmount.map(([cur, amt]) => (
                  <div key={cur}>
                    {formatCurrency(amt, cur, { showCode: true })}
                  </div>
                ))}
              </div>
            ) : (
              "₨0.00"
            )
          }
          subtitle={`${stats.totalDonors} completed transaction${stats.totalDonors === 1 ? "" : "s"}`}
          icon={<DollarSign className="h-5 w-5 text-white" />}
          color="bg-emerald-500"
        />
        <StatCard
          title="Monthly Donors"
          value={stats.monthlyDonors}
          subtitle="Active recurring"
          icon={<TrendingUp className="h-5 w-5 text-white" />}
          color="bg-blue-500"
        />
        <StatCard
          title="Pending"
          value={stats.pendingCount}
          subtitle="Awaiting confirmation"
          icon={<Clock className="h-5 w-5 text-white" />}
          color="bg-amber-500"
        />
        <StatCard
          title="Failed"
          value={stats.failedCount}
          subtitle="Unsuccessful attempts"
          icon={<AlertCircle className="h-5 w-5 text-white" />}
          color="bg-red-500"
        />
      </div>

      {/* ── Filters + Table Card ────────────────────────────────────── */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-lg">Donation Records</CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                {filtersLoading ? (
                  "Updating…"
                ) : (
                  <>
                    Showing <span className="font-semibold text-foreground">{donations.length}</span> of{" "}
                    <span className="font-semibold text-foreground">{total}</span> records
                    {hasActiveFilters && " (filtered)"}
                  </>
                )}
              </p>
            </div>
            <div className="flex items-center gap-2 self-start">
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-muted-foreground hover:text-foreground gap-1.5"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Clear filters
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                disabled={exporting}
                className="gap-1.5"
              >
                {exporting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5" />
                )}
                Export
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {/* ── Filter Row ────────────────────────────────────────── */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center mb-5">
            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email…"
                value={filters.search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9 h-9"
              />
              {filters.search && (
                <button
                  onClick={() => handleSearchChange("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="h-4 w-4 text-muted-foreground hidden sm:block" />

              {/* Status filter */}
              <Select value={filters.status} onValueChange={(v) => updateFilter("status", v)}>
                <SelectTrigger className="w-[130px] h-9">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>

              {/* Type filter */}
              <Select value={filters.type} onValueChange={(v) => updateFilter("type", v)}>
                <SelectTrigger className="w-[130px] h-9">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="one-time">One-time</SelectItem>
                </SelectContent>
              </Select>

              {/* Currency filter */}
              <Select value={filters.currency} onValueChange={(v) => updateFilter("currency", v)}>
                <SelectTrigger className="w-[120px] h-9">
                  <SelectValue placeholder="Currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Currencies</SelectItem>
                  <SelectItem value="NPR">NPR</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                  <SelectItem value="INR">INR</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* ── Table ─────────────────────────────────────────────── */}
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="font-semibold">Donor</TableHead>
                  <TableHead className="font-semibold">Amount</TableHead>
                  <TableHead className="font-semibold">Method</TableHead>
                  <TableHead className="font-semibold">Type</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtersLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-16">
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Loading donations…</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : donations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-16">
                      <div className="flex flex-col items-center gap-2">
                        <HandHeart className="h-10 w-10 text-muted-foreground/40" />
                        <p className="font-medium text-muted-foreground">No donations found</p>
                        {hasActiveFilters && (
                          <p className="text-sm text-muted-foreground">
                            Try adjusting your filters
                          </p>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  donations.map((donation, idx) => {
                    const sc = statusConfig[donation.payment_status] || statusConfig.pending
                    return (
                      <TableRow
                        key={donation.id}
                        className={
                          idx % 2 === 0
                            ? "bg-transparent hover:bg-muted/30"
                            : "bg-muted/10 hover:bg-muted/30"
                        }
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                              {(donation.donor_name || "?")
                                .split(" ")
                                .map((w: string) => w[0])
                                .join("")
                                .slice(0, 2)
                                .toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate">{donation.donor_name}</p>
                              <p className="text-xs text-muted-foreground truncate">
                                {donation.donor_email}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold text-sm tabular-nums">
                            {formatCurrency(donation.amount, donation.currency, { showCode: true })}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <span className="capitalize">
                              {donation.provider || donation.payment_method || "—"}
                            </span>
                            {donation.provider && donation.payment_method && donation.payment_method !== donation.provider && (
                              <span className="block text-xs text-muted-foreground capitalize">
                                {donation.payment_method}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={donation.is_monthly ? "default" : "secondary"}
                            className={
                              donation.is_monthly
                                ? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800"
                                : ""
                            }
                          >
                            {donation.is_monthly ? "Monthly" : "One-time"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`gap-1 ${sc.className}`}
                          >
                            {sc.icon}
                            <span className="capitalize">{donation.payment_status}</span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Calendar className="h-3.5 w-3.5" />
                            {new Date(donation.created_at).toLocaleDateString("en-GB", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* ── Load More ─────────────────────────────────────────── */}
          {hasMore && !filtersLoading && (
            <div className="flex flex-col items-center gap-2 pt-6">
              <Button
                variant="outline"
                onClick={loadMore}
                disabled={loading}
                className="min-w-[220px] gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading…
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    Load More ({total - donations.length} remaining)
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground">
                Page {page + 1} • {pageSize} per page
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
