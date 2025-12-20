import { redirect } from "next/navigation"
import { getCurrentAdmin } from "@/lib/actions/admin-auth"
import { getActivityHistory } from "@/lib/actions/admin-profile"
import { ProfileForm } from "@/components/admin/profile-form"
import { PasswordForm } from "@/components/admin/password-form"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { User, Lock, Clock, Shield } from "lucide-react"

export default async function ProfilePage() {
  const adminUser = await getCurrentAdmin()

  if (!adminUser) {
    redirect("/admin/login")
  }

  const activityLogs = await getActivityHistory(10)

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      LOGIN: "Logged in",
      LOGOUT: "Logged out",
      CREATE: "Created",
      UPDATE: "Updated",
      DELETE: "Deleted",
    }
    return labels[action] || action
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return "destructive"
      case "ADMIN":
        return "default"
      case "EDITOR":
        return "secondary"
      case "FINANCE":
        return "outline"
      default:
        return "secondary"
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Overview Card */}
        <Card className="lg:col-span-1">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
                {adminUser.avatar_url ? (
                  <img
                    src={adminUser.avatar_url || "/placeholder.svg"}
                    alt={adminUser.full_name}
                    className="h-20 w-20 rounded-full object-cover"
                  />
                ) : (
                  adminUser.full_name.charAt(0)
                )}
              </div>
              <h2 className="mt-4 text-xl font-semibold">{adminUser.full_name}</h2>
              <p className="text-sm text-muted-foreground">{adminUser.email}</p>
              <Badge variant={getRoleBadgeVariant(adminUser.role)} className="mt-2">
                {adminUser.role.replace("_", " ")}
              </Badge>
              <div className="mt-4 w-full space-y-2 text-sm">
                <div className="flex justify-between border-t pt-2">
                  <span className="text-muted-foreground">Member since</span>
                  <span>{new Date(adminUser.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant={adminUser.is_active ? "default" : "secondary"}>
                    {adminUser.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Settings Tabs */}
        <Card className="lg:col-span-2">
          <Tabs defaultValue="profile" className="w-full">
            <CardHeader>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="profile" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">Profile</span>
                </TabsTrigger>
                <TabsTrigger value="security" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  <span className="hidden sm:inline">Security</span>
                </TabsTrigger>
                <TabsTrigger value="activity" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span className="hidden sm:inline">Activity</span>
                </TabsTrigger>
              </TabsList>
            </CardHeader>
            <CardContent>
              <TabsContent value="profile" className="mt-0">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium">Profile Information</h3>
                    <p className="text-sm text-muted-foreground">Update your personal information</p>
                  </div>
                  <ProfileForm adminUser={adminUser} />
                </div>
              </TabsContent>

              <TabsContent value="security" className="mt-0">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium">Change Password</h3>
                    <p className="text-sm text-muted-foreground">Ensure your account stays secure</p>
                  </div>
                  <PasswordForm />
                </div>
              </TabsContent>

              <TabsContent value="activity" className="mt-0">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium">Recent Activity</h3>
                    <p className="text-sm text-muted-foreground">Your recent actions in the admin panel</p>
                  </div>
                  {activityLogs.length > 0 ? (
                    <div className="space-y-3">
                      {activityLogs.map((log: any) => (
                        <div key={log.id} className="flex items-start gap-3 rounded-lg border p-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                            <Shield className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="flex-1 space-y-1">
                            <p className="text-sm font-medium">
                              {getActionLabel(log.action)}{" "}
                              {log.entity_type !== "auth" && (
                                <span className="text-muted-foreground">{log.entity_type}</span>
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground">{formatDate(log.created_at)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No recent activity</p>
                  )}
                </div>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  )
}
