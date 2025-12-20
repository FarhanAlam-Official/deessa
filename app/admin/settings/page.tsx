import { redirect } from "next/navigation"
import { getCurrentAdmin } from "@/lib/actions/admin-auth"
import { getSiteSettings } from "@/lib/actions/admin-settings"
import { SiteSettingsForm } from "@/components/admin/site-settings-form"
import { hasPermission, type AdminRole } from "@/lib/types/admin"

export default async function SiteSettingsPage() {
  const admin = await getCurrentAdmin()
  if (!admin) redirect("/admin/login")

  if (!hasPermission(admin.role as AdminRole, "settings")) {
    redirect("/admin")
  }

  const settings = await getSiteSettings()

  // Convert array to object for easier access
  const settingsObj: Record<string, Record<string, unknown>> = {}
  settings?.forEach((s) => {
    settingsObj[s.key] = s.value as Record<string, unknown>
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Site Settings</h1>
        <p className="text-muted-foreground">Configure global website settings</p>
      </div>
      <SiteSettingsForm settings={settingsObj} />
    </div>
  )
}
