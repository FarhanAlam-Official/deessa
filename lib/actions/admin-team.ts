"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { getCurrentAdmin } from "./admin-auth"

export async function getTeamMembers() {
  const supabase = await createClient()

  const { data, error } = await supabase.from("team_members").select("*").order("sort_order", { ascending: true })

  if (error) throw error
  return data
}

export async function getTeamMember(id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase.from("team_members").select("*").eq("id", id).single()

  if (error) throw error
  return data
}

export async function createTeamMember(formData: FormData) {
  const admin = await getCurrentAdmin()
  if (!admin) return { error: "Unauthorized" }

  const supabase = await createClient()

  const name = formData.get("name") as string
  const role = formData.get("role") as string
  const bio = formData.get("bio") as string
  const image = formData.get("image") as string
  const email = formData.get("email") as string
  const phone = formData.get("phone") as string
  const isPublished = formData.get("isPublished") === "true"

  // Get max sort order
  const { data: maxOrder } = await supabase
    .from("team_members")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .single()

  const sortOrder = (maxOrder?.sort_order || 0) + 1

  const { data, error } = await supabase
    .from("team_members")
    .insert({
      name,
      role,
      bio: bio || null,
      image: image || null,
      email: email || null,
      phone: phone || null,
      is_published: isPublished,
      sort_order: sortOrder,
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  await supabase.from("activity_logs").insert({
    user_id: admin.id,
    action: "CREATE",
    entity_type: "team_member",
    entity_id: data.id,
    new_data: { name, role },
  })

  revalidatePath("/admin/team")
  revalidatePath("/about")
  return { success: true, data }
}

export async function updateTeamMember(id: string, formData: FormData) {
  const admin = await getCurrentAdmin()
  if (!admin) return { error: "Unauthorized" }

  const supabase = await createClient()

  const name = formData.get("name") as string
  const role = formData.get("role") as string
  const bio = formData.get("bio") as string
  const image = formData.get("image") as string
  const email = formData.get("email") as string
  const phone = formData.get("phone") as string
  const isPublished = formData.get("isPublished") === "true"

  const { error } = await supabase
    .from("team_members")
    .update({
      name,
      role,
      bio: bio || null,
      image: image || null,
      email: email || null,
      phone: phone || null,
      is_published: isPublished,
    })
    .eq("id", id)

  if (error) {
    return { error: error.message }
  }

  await supabase.from("activity_logs").insert({
    user_id: admin.id,
    action: "UPDATE",
    entity_type: "team_member",
    entity_id: id,
  })

  revalidatePath("/admin/team")
  revalidatePath("/about")
  return { success: true }
}

export async function deleteTeamMember(id: string) {
  const admin = await getCurrentAdmin()
  if (!admin) return { error: "Unauthorized" }

  const supabase = await createClient()

  const { error } = await supabase.from("team_members").delete().eq("id", id)

  if (error) {
    return { error: error.message }
  }

  await supabase.from("activity_logs").insert({
    user_id: admin.id,
    action: "DELETE",
    entity_type: "team_member",
    entity_id: id,
  })

  revalidatePath("/admin/team")
  revalidatePath("/about")
  return { success: true }
}

export async function reorderTeamMembers(orderedIds: string[]) {
  const admin = await getCurrentAdmin()
  if (!admin) return { error: "Unauthorized" }

  const supabase = await createClient()

  // Update sort_order for each member
  const updates = orderedIds.map((id, index) =>
    supabase.from("team_members").update({ sort_order: index }).eq("id", id),
  )

  await Promise.all(updates)

  revalidatePath("/admin/team")
  revalidatePath("/about")
  return { success: true }
}
