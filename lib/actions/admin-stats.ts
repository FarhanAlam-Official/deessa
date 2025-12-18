"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { getCurrentAdmin } from "./admin-auth"

export async function getImpactStats() {
  const supabase = await createClient()
  const { data, error } = await supabase.from("impact_stats").select("*").order("sort_order", { ascending: true })

  if (error) throw error
  return data
}

export async function getImpactStat(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase.from("impact_stats").select("*").eq("id", id).single()

  if (error) throw error
  return data
}

export async function createImpactStat(formData: FormData) {
  const admin = await getCurrentAdmin()
  if (!admin) return { error: "Unauthorized" }

  const supabase = await createClient()

  const label = formData.get("label") as string
  const value = formData.get("value") as string
  const icon = formData.get("icon") as string
  const color = formData.get("color") as string
  const progress = Number.parseInt(formData.get("progress") as string) || null
  const category = formData.get("category") as string
  const isPublished = formData.get("isPublished") === "true"

  // Get max sort order
  const { data: maxOrder } = await supabase
    .from("impact_stats")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .single()

  const sortOrder = (maxOrder?.sort_order || 0) + 1

  const { data, error } = await supabase
    .from("impact_stats")
    .insert({
      label,
      value,
      icon: icon || null,
      color: color || null,
      progress,
      category,
      is_published: isPublished,
      sort_order: sortOrder,
    })
    .select()
    .single()

  if (error) return { error: error.message }

  await supabase.from("activity_logs").insert({
    user_id: admin.id,
    action: "CREATE",
    entity_type: "impact_stat",
    entity_id: data.id,
    new_data: { label, value },
  })

  revalidatePath("/admin/stats")
  revalidatePath("/")
  revalidatePath("/impact")
  return { success: true, data }
}

export async function updateImpactStat(id: string, formData: FormData) {
  const admin = await getCurrentAdmin()
  if (!admin) return { error: "Unauthorized" }

  const supabase = await createClient()

  const label = formData.get("label") as string
  const value = formData.get("value") as string
  const icon = formData.get("icon") as string
  const color = formData.get("color") as string
  const progress = Number.parseInt(formData.get("progress") as string) || null
  const category = formData.get("category") as string
  const isPublished = formData.get("isPublished") === "true"

  const { error } = await supabase
    .from("impact_stats")
    .update({
      label,
      value,
      icon: icon || null,
      color: color || null,
      progress,
      category,
      is_published: isPublished,
    })
    .eq("id", id)

  if (error) return { error: error.message }

  await supabase.from("activity_logs").insert({
    user_id: admin.id,
    action: "UPDATE",
    entity_type: "impact_stat",
    entity_id: id,
  })

  revalidatePath("/admin/stats")
  revalidatePath("/")
  revalidatePath("/impact")
  return { success: true }
}

export async function deleteImpactStat(id: string) {
  const admin = await getCurrentAdmin()
  if (!admin) return { error: "Unauthorized" }

  const supabase = await createClient()
  const { error } = await supabase.from("impact_stats").delete().eq("id", id)

  if (error) return { error: error.message }

  await supabase.from("activity_logs").insert({
    user_id: admin.id,
    action: "DELETE",
    entity_type: "impact_stat",
    entity_id: id,
  })

  revalidatePath("/admin/stats")
  revalidatePath("/")
  revalidatePath("/impact")
  return { success: true }
}
