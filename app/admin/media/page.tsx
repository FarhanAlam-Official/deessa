import { redirect } from "next/navigation"
import { getCurrentAdmin } from "@/lib/actions/admin-auth"
import { hasPermission, type AdminRole } from "@/lib/types/admin"
import { MediaLibraryClient } from "@/components/admin/media-library-client"

export default async function MediaLibraryPage() {
  const admin = await getCurrentAdmin()
  if (!admin) redirect("/admin/login")

  if (!hasPermission(admin.role as AdminRole, "settings")) {
    redirect("/admin")
  }

  return (
    <div className="space-y-6">
      <MediaLibraryClient />
    </div>
  )
}
