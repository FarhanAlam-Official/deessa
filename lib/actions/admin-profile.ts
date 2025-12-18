"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { getCurrentAdmin } from "./admin-auth"

export async function updateProfile(formData: FormData) {
  const fullName = formData.get("fullName") as string
  const avatarUrl = formData.get("avatarUrl") as string

  if (!fullName) {
    return { error: "Name is required" }
  }

  const supabase = await createClient()
  const currentAdmin = await getCurrentAdmin()

  if (!currentAdmin) {
    return { error: "Not authenticated" }
  }

  const { error } = await supabase
    .from("admin_users")
    .update({
      full_name: fullName,
      avatar_url: avatarUrl || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", currentAdmin.id)

  if (error) {
    return { error: error.message }
  }

  // Log activity
  await supabase.from("activity_logs").insert({
    user_id: currentAdmin.id,
    action: "UPDATE",
    entity_type: "profile",
    entity_id: currentAdmin.id,
  })

  revalidatePath("/admin/profile")
  revalidatePath("/admin")
  return { success: true }
}

export async function changePassword(formData: FormData) {
  const currentPassword = formData.get("currentPassword") as string
  const newPassword = formData.get("newPassword") as string
  const confirmPassword = formData.get("confirmPassword") as string

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { error: "All fields are required" }
  }

  if (newPassword !== confirmPassword) {
    return { error: "New passwords do not match" }
  }

  if (newPassword.length < 8) {
    return { error: "Password must be at least 8 characters" }
  }

  const supabase = await createClient()
  const currentAdmin = await getCurrentAdmin()

  if (!currentAdmin) {
    return { error: "Not authenticated" }
  }

  // Verify current password by attempting sign in
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: currentAdmin.email,
    password: currentPassword,
  })

  if (signInError) {
    return { error: "Current password is incorrect" }
  }

  // Update password
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  })

  if (error) {
    return { error: error.message }
  }

  // Log activity
  await supabase.from("activity_logs").insert({
    user_id: currentAdmin.id,
    action: "UPDATE",
    entity_type: "password",
    entity_id: currentAdmin.id,
  })

  return { success: true }
}

export async function getActivityHistory(limit = 20) {
  const supabase = await createClient()
  const currentAdmin = await getCurrentAdmin()

  if (!currentAdmin) {
    return []
  }

  const { data } = await supabase
    .from("activity_logs")
    .select("*")
    .eq("user_id", currentAdmin.id)
    .order("created_at", { ascending: false })
    .limit(limit)

  return data || []
}
