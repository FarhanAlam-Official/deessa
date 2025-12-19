import { redirect } from "next/navigation"
import { getCurrentAdmin } from "@/lib/actions/admin-auth"
import { AdminUserForm } from "@/components/admin/admin-user-form"

export default async function NewAdminUserPage() {
  const currentAdmin = await getCurrentAdmin()

  if (!currentAdmin || currentAdmin.role !== "SUPER_ADMIN") {
    redirect("/admin")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Create Admin User</h1>
        <p className="text-muted-foreground">Add a new admin user to the system</p>
      </div>

      <AdminUserForm />
    </div>
  )
}
