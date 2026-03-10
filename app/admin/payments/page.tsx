import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, Mail, Receipt, TrendingUp, Activity, ExternalLink, CheckCircle2, XCircle, Clock } from "lucide-react"
import Link from "next/link"

export const metadata = {
  title: "Payments | Admin",
  description: "Payment operations and monitoring",
}

async function getQuickStats(supabase: ReturnType<typeof createClient>) {
  const now = new Date()
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000)

  // Get unresolved failures
  const [receiptFailures, emailFailures] = await Promise.all([
    supabase
      .from("receipt_failures")
      .select("id", { count: "exact", head: true })
      .is("resolved_at", null),
    supabase
      .from("email_failures")
      .select("id", { count: "exact", head: true })
      .is("resolved_at", null),
  ])

  // Get recent confirmed donations
  const { count: recentDonations } = await supabase
    .from("donations")
    .select("id", { count: "exact", head: true })
    .eq("payment_status", "completed")
    .gte("created_at", last24h.toISOString())

  return {
    receiptFailures: receiptFailures.count || 0,
    emailFailures: emailFailures.count || 0,
    recentDonations: recentDonations || 0,
  }
}

export default async function PaymentsPage() {
  const supabase = await createClient()

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/admin/login")
  }

  const stats = await getQuickStats(supabase)
  const hasFailures = stats.receiptFailures > 0 || stats.emailFailures > 0

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Payment Operations
        </h1>
        <p className="text-muted-foreground text-lg">
          Monitor and manage post-payment operations
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Donations</CardTitle>
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats.recentDonations}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Last 24 hours
            </p>
          </CardContent>
        </Card>

        <Card className={`border-l-4 hover:shadow-lg transition-all duration-300 ${
          stats.receiptFailures > 0 ? 'border-l-red-500' : 'border-l-green-500'
        }`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receipt Failures</CardTitle>
            <div className={`p-2 rounded-lg ${
              stats.receiptFailures > 0 ? 'bg-red-100' : 'bg-green-100'
            }`}>
              {stats.receiptFailures > 0 ? (
                <XCircle className="h-5 w-5 text-red-600" />
              ) : (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${
              stats.receiptFailures > 0 ? 'text-red-600' : 'text-green-600'
            }`}>
              {stats.receiptFailures}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.receiptFailures > 0 ? 'Unresolved' : 'All clear'}
            </p>
          </CardContent>
        </Card>

        <Card className={`border-l-4 hover:shadow-lg transition-all duration-300 ${
          stats.emailFailures > 0 ? 'border-l-red-500' : 'border-l-green-500'
        }`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Email Failures</CardTitle>
            <div className={`p-2 rounded-lg ${
              stats.emailFailures > 0 ? 'bg-red-100' : 'bg-green-100'
            }`}>
              {stats.emailFailures > 0 ? (
                <XCircle className="h-5 w-5 text-red-600" />
              ) : (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${
              stats.emailFailures > 0 ? 'text-red-600' : 'text-green-600'
            }`}>
              {stats.emailFailures}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.emailFailures > 0 ? 'Unresolved' : 'All clear'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alert if there are failures */}
      {hasFailures && (
        <Card className="mb-8 border-2 border-red-500 bg-red-50/50 shadow-lg animate-in fade-in slide-in-from-top-2 duration-500">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <CardTitle className="text-red-900">Action Required</CardTitle>
                <CardDescription className="text-red-700">
                  There are {stats.receiptFailures + stats.emailFailures} unresolved failures that need attention
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            {stats.receiptFailures > 0 && (
              <Button asChild variant="destructive" size="lg" className="shadow-md hover:shadow-lg transition-all">
                <Link href="/admin/payments/receipts/failed" className="flex items-center gap-2">
                  <Receipt className="h-4 w-4" />
                  Fix {stats.receiptFailures} Receipt Failure{stats.receiptFailures !== 1 ? "s" : ""}
                </Link>
              </Button>
            )}
            {stats.emailFailures > 0 && (
              <Button asChild variant="destructive" size="lg" className="shadow-md hover:shadow-lg transition-all">
                <Link href="/admin/payments/emails/failed" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Fix {stats.emailFailures} Email Failure{stats.emailFailures !== 1 ? "s" : ""}
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Main Navigation Cards */}
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-4">Operations Dashboard</h2>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <Card className="group hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer border-2 hover:border-primary/50 bg-gradient-to-br from-white to-blue-50/30">
          <Link href="/admin/payments/system">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 rounded-xl group-hover:bg-blue-200 transition-colors">
                    <Activity className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-lg">System Health</CardTitle>
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <CardDescription className="mt-2">
                Monitor system status and connectivity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Check database health, provider status, and run manual reconciliation
              </p>
            </CardContent>
          </Link>
        </Card>

        <Card className="group hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer border-2 hover:border-primary/50 bg-gradient-to-br from-white to-orange-50/30">
          <Link href="/admin/payments/alerts">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl transition-colors ${
                    hasFailures 
                      ? 'bg-red-100 group-hover:bg-red-200' 
                      : 'bg-green-100 group-hover:bg-green-200'
                  }`}>
                    <AlertCircle className={`h-6 w-6 ${
                      hasFailures ? 'text-red-600' : 'text-green-600'
                    }`} />
                  </div>
                  <CardTitle className="text-lg">Alerts & Notifications</CardTitle>
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <CardDescription className="mt-2">
                {hasFailures ? (
                  <span className="text-red-600 font-semibold flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {stats.receiptFailures + stats.emailFailures} active alerts
                  </span>
                ) : (
                  <span className="text-green-600 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    No active alerts
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                View system alerts, stuck donations, and failure notifications
              </p>
            </CardContent>
          </Link>
        </Card>

        <Card className="group hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer border-2 hover:border-primary/50 bg-gradient-to-br from-white to-purple-50/30">
          <Link href="/admin/payments/logs">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-100 rounded-xl group-hover:bg-purple-200 transition-colors">
                    <Activity className="h-6 w-6 text-purple-600" />
                  </div>
                  <CardTitle className="text-lg">Payment Logs</CardTitle>
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <CardDescription className="mt-2">
                Search and export logs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                View payment event logs, search history, and export data
              </p>
            </CardContent>
          </Link>
        </Card>

        <Card className="group hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer border-2 hover:border-primary/50 bg-gradient-to-br from-white to-green-50/30">
          <Link href="/admin/payments/metrics">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-100 rounded-xl group-hover:bg-green-200 transition-colors">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                  <CardTitle className="text-lg">Performance Metrics</CardTitle>
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <CardDescription className="mt-2">
                View trends and analytics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Analyze payment trends, provider performance, and success rates
              </p>
            </CardContent>
          </Link>
        </Card>

        <Card className="group hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer border-2 hover:border-primary/50 bg-gradient-to-br from-white to-indigo-50/30">
          <Link href="/admin/payments/monitoring">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-indigo-100 rounded-xl group-hover:bg-indigo-200 transition-colors">
                    <TrendingUp className="h-6 w-6 text-indigo-600" />
                  </div>
                  <CardTitle className="text-lg">Success Rate Monitoring</CardTitle>
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <CardDescription className="mt-2">
                Track operational success
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Monitor receipt generation and email sending success rates
              </p>
            </CardContent>
          </Link>
        </Card>

        <Card className={`group hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer border-2 hover:border-primary/50 ${
          stats.receiptFailures > 0 
            ? 'bg-gradient-to-br from-red-50 to-white border-red-200' 
            : 'bg-gradient-to-br from-white to-gray-50/30'
        }`}>
          <Link href="/admin/payments/receipts/failed">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl transition-colors ${
                    stats.receiptFailures > 0 
                      ? 'bg-red-100 group-hover:bg-red-200' 
                      : 'bg-gray-100 group-hover:bg-gray-200'
                  }`}>
                    <Receipt className={`h-6 w-6 ${
                      stats.receiptFailures > 0 ? 'text-red-600' : 'text-gray-600'
                    }`} />
                  </div>
                  <CardTitle className="text-lg">Failed Receipts</CardTitle>
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <CardDescription className="mt-2">
                {stats.receiptFailures > 0 ? (
                  <span className="text-red-600 font-semibold flex items-center gap-1">
                    <XCircle className="h-3 w-3" />
                    {stats.receiptFailures} unresolved failure{stats.receiptFailures !== 1 ? "s" : ""}
                  </span>
                ) : (
                  <span className="text-green-600 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    No failures
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                View and retry failed receipt generation attempts
              </p>
            </CardContent>
          </Link>
        </Card>

        <Card className={`group hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer border-2 hover:border-primary/50 ${
          stats.emailFailures > 0 
            ? 'bg-gradient-to-br from-red-50 to-white border-red-200' 
            : 'bg-gradient-to-br from-white to-gray-50/30'
        }`}>
          <Link href="/admin/payments/emails/failed">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl transition-colors ${
                    stats.emailFailures > 0 
                      ? 'bg-red-100 group-hover:bg-red-200' 
                      : 'bg-gray-100 group-hover:bg-gray-200'
                  }`}>
                    <Mail className={`h-6 w-6 ${
                      stats.emailFailures > 0 ? 'text-red-600' : 'text-gray-600'
                    }`} />
                  </div>
                  <CardTitle className="text-lg">Failed Emails</CardTitle>
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <CardDescription className="mt-2">
                {stats.emailFailures > 0 ? (
                  <span className="text-red-600 font-semibold flex items-center gap-1">
                    <XCircle className="h-3 w-3" />
                    {stats.emailFailures} unresolved failure{stats.emailFailures !== 1 ? "s" : ""}
                  </span>
                ) : (
                  <span className="text-green-600 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    No failures
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                View and resend failed receipt emails
              </p>
            </CardContent>
          </Link>
        </Card>
      </div>

      {/* Info Section */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Activity className="h-5 w-5 text-primary" />
            </div>
            <CardTitle>About Payment Operations</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p className="text-muted-foreground">
            This section provides tools for monitoring and managing post-payment operations including
            receipt generation and email delivery.
          </p>
          <div className="space-y-2">
            <p className="font-medium text-foreground">Key Features:</p>
            <ul className="list-disc list-inside space-y-1 ml-2 text-muted-foreground">
              <li>Real-time monitoring of success rates</li>
              <li>Manual retry for failed operations</li>
              <li>Detailed error tracking and diagnostics</li>
              <li>Resolution audit trail</li>
            </ul>
          </div>
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-900">
              <strong>Note:</strong> This system uses inline processing for MVP deployment. 
              For high-volume operations, consider scaling to a job queue system. 
              See Phase 4 Scaling Guide in the technical documentation.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
