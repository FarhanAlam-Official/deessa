"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { getCurrentAdmin } from "./admin-auth"

export async function getSiteSettings() {
  const supabase = await createClient()
  const { data, error } = await supabase.from("site_settings").select("*").order("key", { ascending: true })

  if (error) throw error
  return data
}

export async function getSiteSetting(key: string) {
  const supabase = await createClient()
  const { data, error } = await supabase.from("site_settings").select("*").eq("key", key).single()

  if (error && error.code !== "PGRST116") throw error
  return data
}

export async function updateSiteSetting(key: string, value: Record<string, unknown>) {
  const admin = await getCurrentAdmin()
  if (!admin) return { error: "Unauthorized" }
  if (admin.role !== "SUPER_ADMIN" && admin.role !== "ADMIN") {
    return { error: "Only admins can update site settings" }
  }

  const supabase = await createClient()

  // Check if setting exists
  const { data: existing } = await supabase.from("site_settings").select("id").eq("key", key).single()

  let error
  if (existing) {
    const result = await supabase.from("site_settings").update({ value, updated_by: admin.id }).eq("key", key)
    error = result.error
  } else {
    const result = await supabase.from("site_settings").insert({ key, value, updated_by: admin.id })
    error = result.error
  }

  if (error) return { error: error.message }

  await supabase.from("activity_logs").insert({
    user_id: admin.id,
    action: "UPDATE",
    entity_type: "site_setting",
    new_data: { key, value },
  })

  revalidatePath("/admin/settings")
  revalidatePath("/")
  return { success: true }
}

export async function deleteSiteSetting(key: string) {
  const admin = await getCurrentAdmin()
  if (!admin) return { error: "Unauthorized" }
  if (admin.role !== "SUPER_ADMIN") {
    return { error: "Only super admins can delete site settings" }
  }

  const supabase = await createClient()
  const { error } = await supabase.from("site_settings").delete().eq("key", key)

  if (error) return { error: error.message }

  await supabase.from("activity_logs").insert({
    user_id: admin.id,
    action: "DELETE",
    entity_type: "site_setting",
    new_data: { key },
  })

  revalidatePath("/admin/settings")
  return { success: true }
}

// Helper to get all settings as a key-value object
export async function getAllSettingsAsObject() {
  const settings = await getSiteSettings()
  const obj: Record<string, unknown> = {}
  settings?.forEach((s) => {
    obj[s.key] = s.value
  })
  return obj
}
