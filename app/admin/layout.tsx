import type React from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminHeader } from "@/components/admin/admin-header"
import type { AdminUser } from "@/lib/types/admin"

export const metadata = {
  title: "Admin Panel | Deesha Foundation",
  description: "Manage Deesha Foundation website content",
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Login page doesn't need the admin layout
  if (!user) {
    return <>{children}</>
  }

  const { data: adminUser } = await supabase.from("admin_users").select("*").eq("user_id", user.id).single()

  if (!adminUser) {
    redirect("/admin/login")
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <AdminSidebar adminUser={adminUser as AdminUser} />
      <div className="lg:pl-64">
        <AdminHeader adminUser={adminUser as AdminUser} />
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  )
}
