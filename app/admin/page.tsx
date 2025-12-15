import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  FolderKanban,
  Calendar,
  FileText,
  Users,
  HandHeart,
  Heart,
  TrendingUp,
  MessageSquare,
  Building,
  BarChart3,
  Newspaper,
  Settings,
  UserCog,
} from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"
import {
  type AdminRole,
  hasPermission,
  canViewFinance,
  canManageUsers,
  getRoleDisplayName,
  getRoleDescription,
} from "@/lib/types/admin"

async function getAdminUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: adminUser } = await supabase.from("admin_users").select("*").eq("user_id", user.id).single()

  return adminUser
}

async function getDashboardStats(role: AdminRole) {
  const supabase = await createClient()

  const stats: Record<string, number | string> = {}

  // Content stats - for SUPER_ADMIN, ADMIN, EDITOR
  if (hasPermission(role, "projects")) {
    const { count } = await supabase.from("projects").select("*", { count: "exact", head: true })
    stats.projects = count || 0
  }

  if (hasPermission(role, "events")) {
    const { count } = await supabase.from("events").select("*", { count: "exact", head: true })
    stats.events = count || 0
  }

  if (hasPermission(role, "stories")) {
    const { count } = await supabase.from("stories").select("*", { count: "exact", head: true })
    stats.stories = count || 0
  }

  if (hasPermission(role, "team")) {
    const { count } = await supabase.from("team_members").select("*", { count: "exact", head: true })
    stats.team = count || 0
  }

  if (hasPermission(role, "partners")) {
    const { count } = await supabase.from("partners").select("*", { count: "exact", head: true })
    stats.partners = count || 0
  }

  // Finance stats - for SUPER_ADMIN, ADMIN, FINANCE
  if (canViewFinance(role)) {
    const { count: donationsCount } = await supabase.from("donations").select("*", { count: "exact", head: true })
    const { data: donationsTotal } = await supabase.from("donations").select("amount").eq("payment_status", "completed")
    stats.donations = donationsCount || 0
    stats.totalDonations = donationsTotal?.reduce((sum, d) => sum + (d.amount || 0), 0) || 0
  }

  // Engagement stats - for SUPER_ADMIN, ADMIN
  if (hasPermission(role, "volunteers")) {
    const { count } = await supabase
      .from("volunteer_applications")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending")
    stats.pendingVolunteers = count || 0
  }

  if (hasPermission(role, "contacts")) {
    const { count } = await supabase.from("contact_submissions").select("*", { count: "exact", head: true })
    stats.contacts = count || 0
  }

  if (hasPermission(role, "newsletters")) {
    const { count } = await supabase
      .from("newsletter_subscriptions")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true)
    stats.subscribers = count || 0
  }

  // User management - for SUPER_ADMIN, ADMIN
  if (canManageUsers(role)) {
    const { count } = await supabase.from("admin_users").select("*", { count: "exact", head: true })
    stats.adminUsers = count || 0
  }

  return stats
}

async function getRecentActivity(role: AdminRole, userId: string) {
  const supabase = await createClient()

  // For EDITOR and FINANCE, only show their own activity
  const query = supabase
    .from("activity_logs")
    .select(`
      *,
      user:admin_users(full_name, email)
    `)
    .order("created_at", { ascending: false })
    .limit(10)

  if (role === "EDITOR" || role === "FINANCE") {
    query.eq("user_id", userId)
  }

  const { data } = await query
  return data || []
}

export default async function AdminDashboard() {
  const adminUser = await getAdminUser()

  if (!adminUser) {
    redirect("/admin/login")
  }

  const role = adminUser.role as AdminRole
  const stats = await getDashboardStats(role)
  const recentActivity = await getRecentActivity(role, adminUser.id)

  // Build stat cards based on role permissions
  const statCards = []

  if (hasPermission(role, "projects")) {
    statCards.push({
      title: "Total Projects",
      value: stats.projects,
      icon: FolderKanban,
      href: "/admin/projects",
      color: "text-blue-600",
    })
  }

  if (hasPermission(role, "events")) {
    statCards.push({
      title: "Events",
      value: stats.events,
      icon: Calendar,
      href: "/admin/events",
      color: "text-green-600",
    })
  }

  if (hasPermission(role, "stories")) {
    statCards.push({
      title: "Stories",
      value: stats.stories,
      icon: FileText,
      href: "/admin/stories",
      color: "text-purple-600",
    })
  }

  if (hasPermission(role, "team")) {
    statCards.push({
      title: "Team Members",
      value: stats.team,
      icon: Users,
      href: "/admin/team",
      color: "text-orange-600",
    })
  }

  if (hasPermission(role, "partners")) {
    statCards.push({
      title: "Partners",
      value: stats.partners,
      icon: Building,
      href: "/admin/partners",
      color: "text-cyan-600",
    })
  }

  if (canViewFinance(role)) {
    statCards.push({
      title: "Total Donations",
      value: `₹${((stats.totalDonations as number) || 0).toLocaleString()}`,
      icon: HandHeart,
      href: "/admin/donations",
      color: "text-pink-600",
    })
  }

  if (hasPermission(role, "volunteers")) {
    statCards.push({
      title: "Pending Volunteers",
      value: stats.pendingVolunteers,
      icon: Heart,
      href: "/admin/volunteers",
      color: "text-red-600",
    })
  }

  if (hasPermission(role, "contacts")) {
    statCards.push({
      title: "Contact Messages",
      value: stats.contacts,
      icon: MessageSquare,
      href: "/admin/contacts",
      color: "text-amber-600",
    })
  }

  if (hasPermission(role, "newsletters")) {
    statCards.push({
      title: "Subscribers",
      value: stats.subscribers,
      icon: Newspaper,
      href: "/admin/newsletter",
      color: "text-indigo-600",
    })
  }

  if (canManageUsers(role)) {
    statCards.push({
      title: "Admin Users",
      value: stats.adminUsers,
      icon: UserCog,
      href: "/admin/users",
      color: "text-slate-600",
    })
  }

  // Build quick actions based on role
  const quickActions = []

  if (hasPermission(role, "projects")) {
    quickActions.push({
      href: "/admin/projects/new",
      icon: FolderKanban,
      title: "Add New Project",
      description: "Create a new program or initiative",
    })
  }

  if (hasPermission(role, "events")) {
    quickActions.push({
      href: "/admin/events/new",
      icon: Calendar,
      title: "Create Event",
      description: "Schedule a new event",
    })
  }

  if (hasPermission(role, "stories")) {
    quickActions.push({
      href: "/admin/stories/new",
      icon: FileText,
      title: "Write Story",
      description: "Publish news or impact story",
    })
  }

  if (hasPermission(role, "contacts")) {
    quickActions.push({
      href: "/admin/contacts",
      icon: MessageSquare,
      title: "View Messages",
      description: `${stats.contacts || 0} contact submissions`,
    })
  }

  if (canViewFinance(role)) {
    quickActions.push({
      href: "/admin/donations",
      icon: HandHeart,
      title: "View Donations",
      description: `${stats.donations || 0} total donations`,
    })
  }

  if (hasPermission(role, "stats")) {
    quickActions.push({
      href: "/admin/stats",
      icon: BarChart3,
      title: "Update Stats",
      description: "Manage impact statistics",
    })
  }

  if (hasPermission(role, "settings")) {
    quickActions.push({
      href: "/admin/settings",
      icon: Settings,
      title: "Site Settings",
      description: "Configure website settings",
    })
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Welcome back, {adminUser.full_name.split(" ")[0]}!</h1>
          <p className="text-muted-foreground">Here&apos;s an overview of your foundation.</p>
        </div>
        <Badge variant="outline" className="w-fit">
          {getRoleDisplayName(role)}
        </Badge>
      </div>

      {/* Role Info Card - Only show for non-super-admin */}
      {role !== "SUPER_ADMIN" && (
        <Card className="bg-muted/50 border-dashed">
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{getRoleDisplayName(role)}:</span>{" "}
              {getRoleDescription(role)}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {statCards.map((stat) => (
          <Link key={stat.title} href={stat.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks for your role</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            {quickActions.slice(0, 5).map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted transition-colors"
              >
                <action.icon className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{action.title}</p>
                  <p className="text-sm text-muted-foreground">{action.description}</p>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              {role === "EDITOR" || role === "FINANCE" ? "Your recent actions" : "Latest actions by admin users"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No recent activity</p>
            ) : (
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                      <TrendingUp className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        <span className="font-medium">{activity.user?.full_name || "System"}</span>{" "}
                        <span className="text-muted-foreground">
                          {activity.action.toLowerCase()} {activity.entity_type.replace(/_/g, " ")}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground">{new Date(activity.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
