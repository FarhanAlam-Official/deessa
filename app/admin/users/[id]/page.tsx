import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getCurrentAdmin } from "@/lib/actions/admin-auth"
import { AdminUserEditForm } from "@/components/admin/admin-user-edit-form"

async function getAdminUser(id: string) {
  const supabase = await createClient()
  const { data } = await supabase.from("admin_users").select("*").eq("id", id).single()
  return data
}

export default async function EditAdminUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const currentAdmin = await getCurrentAdmin()

  if (!currentAdmin || currentAdmin.role !== "SUPER_ADMIN") {
    redirect("/admin")
  }

  const user = await getAdminUser(id)

  if (!user) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Edit Admin User</h1>
        <p className="text-muted-foreground">Update user role and permissions</p>
      </div>

      <AdminUserEditForm user={user} currentAdminId={currentAdmin.id} />
    </div>
  )
}
