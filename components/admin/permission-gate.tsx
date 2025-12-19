import type React from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { type AdminRole, hasPermission, canViewFinance, canManageUsers } from "@/lib/types/admin"

interface PermissionGateProps {
  permission?: string
  requireFinance?: boolean
  requireUserManagement?: boolean
  children: React.ReactNode
}

export async function PermissionGate({
  permission,
  requireFinance,
  requireUserManagement,
  children,
}: PermissionGateProps) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/admin/login")
  }

  const { data: adminUser } = await supabase.from("admin_users").select("role").eq("user_id", user.id).single()

  if (!adminUser) {
    redirect("/admin/login")
  }

  const role = adminUser.role as AdminRole

  // Check permission
  if (permission && !hasPermission(role, permission)) {
    redirect("/admin?error=unauthorized")
  }

  if (requireFinance && !canViewFinance(role)) {
    redirect("/admin?error=unauthorized")
  }

  if (requireUserManagement && !canManageUsers(role)) {
    redirect("/admin?error=unauthorized")
  }

  return <>{children}</>
}

// Helper function for use in page components
export async function checkPermission(permission: string): Promise<boolean> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return false

  const { data: adminUser } = await supabase.from("admin_users").select("role").eq("user_id", user.id).single()

  if (!adminUser) return false

  return hasPermission(adminUser.role as AdminRole, permission)
}

export async function checkFinanceAccess(): Promise<boolean> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return false

  const { data: adminUser } = await supabase.from("admin_users").select("role").eq("user_id", user.id).single()

  if (!adminUser) return false

  return canViewFinance(adminUser.role as AdminRole)
}

export async function checkUserManagementAccess(): Promise<boolean> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return false

  const { data: adminUser } = await supabase.from("admin_users").select("role").eq("user_id", user.id).single()

  if (!adminUser) return false

  return canManageUsers(adminUser.role as AdminRole)
}
