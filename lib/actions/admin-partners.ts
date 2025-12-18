"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { getCurrentAdmin } from "./admin-auth"

export async function getPartners() {
  const supabase = await createClient()
  const { data, error } = await supabase.from("partners").select("*").order("sort_order", { ascending: true })

  if (error) throw error
  return data
}

export async function getPartner(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase.from("partners").select("*").eq("id", id).single()

  if (error) throw error
  return data
}

export async function createPartner(formData: FormData) {
  const admin = await getCurrentAdmin()
  if (!admin) return { error: "Unauthorized" }

  const supabase = await createClient()

  const name = formData.get("name") as string
  const type = formData.get("type") as string
  const logo = formData.get("logo") as string
  const website = formData.get("website") as string
  const description = formData.get("description") as string
  const isPublished = formData.get("isPublished") === "true"

  // Get max sort order
  const { data: maxOrder } = await supabase
    .from("partners")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .single()

  const sortOrder = (maxOrder?.sort_order || 0) + 1

  const { data, error } = await supabase
    .from("partners")
    .insert({
      name,
      type,
      logo: logo || null,
      website: website || null,
      description: description || null,
      is_published: isPublished,
      sort_order: sortOrder,
    })
    .select()
    .single()

  if (error) return { error: error.message }

  await supabase.from("activity_logs").insert({
    user_id: admin.id,
    action: "CREATE",
    entity_type: "partner",
    entity_id: data.id,
    new_data: { name, type },
  })

  revalidatePath("/admin/partners")
  revalidatePath("/")
  return { success: true, data }
}

export async function updatePartner(id: string, formData: FormData) {
  const admin = await getCurrentAdmin()
  if (!admin) return { error: "Unauthorized" }

  const supabase = await createClient()

  const name = formData.get("name") as string
  const type = formData.get("type") as string
  const logo = formData.get("logo") as string
  const website = formData.get("website") as string
  const description = formData.get("description") as string
  const isPublished = formData.get("isPublished") === "true"

  const { error } = await supabase
    .from("partners")
    .update({
      name,
      type,
      logo: logo || null,
      website: website || null,
      description: description || null,
      is_published: isPublished,
    })
    .eq("id", id)

  if (error) return { error: error.message }

  await supabase.from("activity_logs").insert({
    user_id: admin.id,
    action: "UPDATE",
    entity_type: "partner",
    entity_id: id,
  })

  revalidatePath("/admin/partners")
  revalidatePath("/")
  return { success: true }
}

export async function deletePartner(id: string) {
  const admin = await getCurrentAdmin()
  if (!admin) return { error: "Unauthorized" }

  const supabase = await createClient()
  const { error } = await supabase.from("partners").delete().eq("id", id)

  if (error) return { error: error.message }

  await supabase.from("activity_logs").insert({
    user_id: admin.id,
    action: "DELETE",
    entity_type: "partner",
    entity_id: id,
  })

  revalidatePath("/admin/partners")
  revalidatePath("/")
  return { success: true }
}
