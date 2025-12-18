"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { getCurrentAdmin } from "./admin-auth"

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

export async function getProjects(filters?: { category?: string; status?: string; published?: boolean }) {
  const supabase = await createClient()

  let query = supabase.from("projects").select("*").order("created_at", { ascending: false })

  if (filters?.category && filters.category !== "all") {
    query = query.eq("category", filters.category)
  }
  if (filters?.status && filters.status !== "all") {
    query = query.eq("status", filters.status)
  }
  if (filters?.published !== undefined) {
    query = query.eq("is_published", filters.published)
  }

  const { data, error } = await query

  if (error) throw error
  return data
}

export async function getProject(id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("projects")
    .select(`
      *,
      metrics:project_metrics(*),
      timeline:project_timeline(*)
    `)
    .eq("id", id)
    .single()

  if (error) throw error
  return data
}

export async function createProject(formData: FormData) {
  const admin = await getCurrentAdmin()
  if (!admin) return { error: "Unauthorized" }

  const supabase = await createClient()

  const title = formData.get("title") as string
  const description = formData.get("description") as string
  const longDescription = formData.get("longDescription") as string
  const image = formData.get("image") as string
  const category = formData.get("category") as string
  const location = formData.get("location") as string
  const status = formData.get("status") as string
  const goal = formData.get("goal") as string
  const isPublished = formData.get("isPublished") === "true"

  const slug = generateSlug(title)

  // Check for duplicate slug
  const { data: existing } = await supabase.from("projects").select("id").eq("slug", slug).single()

  if (existing) {
    return { error: "A project with this title already exists" }
  }

  const { data, error } = await supabase
    .from("projects")
    .insert({
      title,
      slug,
      description,
      long_description: longDescription || null,
      image: image || null,
      category,
      location,
      status,
      goal: goal ? Number.parseFloat(goal) : null,
      is_published: isPublished,
      created_by: admin.id,
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  // Log activity
  await supabase.from("activity_logs").insert({
    user_id: admin.id,
    action: "CREATE",
    entity_type: "project",
    entity_id: data.id,
    new_data: { title, category, status },
  })

  revalidatePath("/admin/projects")
  revalidatePath("/programs")
  redirect(`/admin/projects/${data.id}`)
}

export async function updateProject(id: string, formData: FormData) {
  const admin = await getCurrentAdmin()
  if (!admin) return { error: "Unauthorized" }

  const supabase = await createClient()

  // Get old data for audit
  const { data: oldData } = await supabase.from("projects").select("*").eq("id", id).single()

  const title = formData.get("title") as string
  const description = formData.get("description") as string
  const longDescription = formData.get("longDescription") as string
  const image = formData.get("image") as string
  const category = formData.get("category") as string
  const location = formData.get("location") as string
  const status = formData.get("status") as string
  const goal = formData.get("goal") as string
  const raised = formData.get("raised") as string
  const isPublished = formData.get("isPublished") === "true"

  const { error } = await supabase
    .from("projects")
    .update({
      title,
      description,
      long_description: longDescription || null,
      image: image || null,
      category,
      location,
      status,
      goal: goal ? Number.parseFloat(goal) : null,
      raised: raised ? Number.parseFloat(raised) : 0,
      is_published: isPublished,
    })
    .eq("id", id)

  if (error) {
    return { error: error.message }
  }

  // Log activity
  await supabase.from("activity_logs").insert({
    user_id: admin.id,
    action: "UPDATE",
    entity_type: "project",
    entity_id: id,
    old_data: oldData,
    new_data: { title, category, status, is_published: isPublished },
  })

  revalidatePath("/admin/projects")
  revalidatePath(`/admin/projects/${id}`)
  revalidatePath("/programs")
  return { success: true }
}

export async function deleteProject(id: string) {
  const admin = await getCurrentAdmin()
  if (!admin) return { error: "Unauthorized" }

  const supabase = await createClient()

  // Get data for audit
  const { data: project } = await supabase.from("projects").select("*").eq("id", id).single()

  const { error } = await supabase.from("projects").delete().eq("id", id)

  if (error) {
    return { error: error.message }
  }

  // Log activity
  await supabase.from("activity_logs").insert({
    user_id: admin.id,
    action: "DELETE",
    entity_type: "project",
    entity_id: id,
    old_data: project,
  })

  revalidatePath("/admin/projects")
  revalidatePath("/programs")
  redirect("/admin/projects")
}

export async function toggleProjectPublished(id: string, published: boolean) {
  const admin = await getCurrentAdmin()
  if (!admin) return { error: "Unauthorized" }

  const supabase = await createClient()

  const { error } = await supabase.from("projects").update({ is_published: published }).eq("id", id)

  if (error) {
    return { error: error.message }
  }

  await supabase.from("activity_logs").insert({
    user_id: admin.id,
    action: published ? "PUBLISH" : "UNPUBLISH",
    entity_type: "project",
    entity_id: id,
  })

  revalidatePath("/admin/projects")
  revalidatePath("/programs")
  return { success: true }
}
