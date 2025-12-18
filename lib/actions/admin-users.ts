"use server"

import { createClient } from "@/lib/supabase/server"
import { getCurrentAdmin } from "./admin-auth"
import { revalidatePath } from "next/cache"

export async function updateAdminUser(userId: string, data: { role?: string; is_active?: boolean }) {
  const currentAdmin = await getCurrentAdmin()

  if (!currentAdmin || currentAdmin.role !== "SUPER_ADMIN") {
    return { error: "Unauthorized" }
  }

  // Cannot edit yourself
  if (userId === currentAdmin.id) {
    return { error: "Cannot edit your own account" }
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from("admin_users")
    .update({
      role: data.role,
      is_active: data.is_active,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/admin/users")
  return { success: true }
}

export async function deleteAdminUser(userId: string) {
  const currentAdmin = await getCurrentAdmin()

  if (!currentAdmin || currentAdmin.role !== "SUPER_ADMIN") {
    return { error: "Unauthorized" }
  }

  // Cannot delete yourself
  if (userId === currentAdmin.id) {
    return { error: "Cannot delete your own account" }
  }

  const supabase = await createClient()

  // Get the user's auth ID first
  const { data: adminUser } = await supabase.from("admin_users").select("user_id").eq("id", userId).single()

  if (!adminUser) {
    return { error: "User not found" }
  }

  // Delete from admin_users table
  const { error } = await supabase.from("admin_users").delete().eq("id", userId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/admin/users")
  return { success: true }
}

export async function createAdminUser(data: {
  email: string
  password: string
  full_name: string
  role: string
}) {
  const currentAdmin = await getCurrentAdmin()

  if (!currentAdmin || currentAdmin.role !== "SUPER_ADMIN") {
    return { error: "Unauthorized" }
  }

  const supabase = await createClient()

  // Create auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: data.email,
    password: data.password,
    email_confirm: true,
  })

  if (authError) {
    // Fallback: use signUp if admin API is not available
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    })

    if (signUpError) {
      return { error: signUpError.message }
    }

    if (!signUpData.user) {
      return { error: "Failed to create user" }
    }

    // Create admin user record
    const { error: insertError } = await supabase.from("admin_users").insert({
      user_id: signUpData.user.id,
      email: data.email,
      full_name: data.full_name,
      role: data.role,
      is_active: true,
    })

    if (insertError) {
      return { error: insertError.message }
    }

    revalidatePath("/admin/users")
    return { success: true, needsConfirmation: true }
  }

  if (!authData.user) {
    return { error: "Failed to create user" }
  }

  // Create admin user record
  const { error: insertError } = await supabase.from("admin_users").insert({
    user_id: authData.user.id,
    email: data.email,
    full_name: data.full_name,
    role: data.role,
    is_active: true,
  })

  if (insertError) {
    return { error: insertError.message }
  }

  revalidatePath("/admin/users")
  return { success: true }
}
