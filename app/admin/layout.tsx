import type React from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AdminLayoutContent } from "@/components/admin/admin-layout-content"
import type { AdminUser } from "@/lib/types/admin"

export const metadata = {
  title: "Admin Panel | deessa Foundation",
  description: "Manage deessa Foundation website content",
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
    <AdminLayoutContent adminUser={adminUser as AdminUser}>
      {children}
    </AdminLayoutContent>
  )
}
