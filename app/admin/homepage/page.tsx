import { redirect } from "next/navigation"
import { getCurrentAdmin } from "@/lib/actions/admin-auth"
import { hasPermission, type AdminRole } from "@/lib/types/admin"
import { getSiteSettings } from "@/lib/actions/admin-settings"
import { HomepageManagerClient } from "@/components/admin/homepage-manager-client"

export default async function HomepageManagerPage() {
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
      <HomepageManagerClient settings={settingsObj} />
    </div>
  )
}
