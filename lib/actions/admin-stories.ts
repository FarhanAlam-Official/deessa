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

export async function getStories(filters?: { category?: string; featured?: boolean }) {
  const supabase = await createClient()

  let query = supabase.from("stories").select("*").order("created_at", { ascending: false })

  if (filters?.category && filters.category !== "all") {
    query = query.eq("category", filters.category)
  }
  if (filters?.featured !== undefined) {
    query = query.eq("is_featured", filters.featured)
  }

  const { data, error } = await query

  if (error) throw error
  return data
}

export async function getStory(id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("stories")
    .select(`
      *,
      author:admin_users(full_name, email)
    `)
    .eq("id", id)
    .single()

  if (error) throw error
  return data
}

export async function createStory(formData: FormData) {
  const admin = await getCurrentAdmin()
  if (!admin) return { error: "Unauthorized" }

  const supabase = await createClient()

  const title = formData.get("title") as string
  const excerpt = formData.get("excerpt") as string
  const content = formData.get("content") as string
  const image = formData.get("image") as string
  const category = formData.get("category") as string
  const readTime = formData.get("readTime") as string
  const isFeatured = formData.get("isFeatured") === "true"
  const isPublished = formData.get("isPublished") === "true"

  const slug = generateSlug(title)

  const { data, error } = await supabase
    .from("stories")
    .insert({
      title,
      slug,
      excerpt,
      content: content || null,
      image: image || null,
      category,
      read_time: readTime || null,
      is_featured: isFeatured,
      is_published: isPublished,
      published_at: isPublished ? new Date().toISOString() : null,
      author_id: admin.id,
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  await supabase.from("activity_logs").insert({
    user_id: admin.id,
    action: "CREATE",
    entity_type: "story",
    entity_id: data.id,
    new_data: { title, category },
  })

  revalidatePath("/admin/stories")
  revalidatePath("/stories")
  redirect(`/admin/stories/${data.id}`)
}

export async function updateStory(id: string, formData: FormData) {
  const admin = await getCurrentAdmin()
  if (!admin) return { error: "Unauthorized" }

  const supabase = await createClient()

  const { data: oldData } = await supabase.from("stories").select("*").eq("id", id).single()

  const title = formData.get("title") as string
  const excerpt = formData.get("excerpt") as string
  const content = formData.get("content") as string
  const image = formData.get("image") as string
  const category = formData.get("category") as string
  const readTime = formData.get("readTime") as string
  const isFeatured = formData.get("isFeatured") === "true"
  const isPublished = formData.get("isPublished") === "true"

  const updateData: Record<string, unknown> = {
    title,
    excerpt,
    content: content || null,
    image: image || null,
    category,
    read_time: readTime || null,
    is_featured: isFeatured,
    is_published: isPublished,
  }

  // Set published_at when publishing for the first time
  if (isPublished && !oldData?.published_at) {
    updateData.published_at = new Date().toISOString()
  }

  const { error } = await supabase.from("stories").update(updateData).eq("id", id)

  if (error) {
    return { error: error.message }
  }

  await supabase.from("activity_logs").insert({
    user_id: admin.id,
    action: "UPDATE",
    entity_type: "story",
    entity_id: id,
    old_data: oldData,
    new_data: { title, category, is_published: isPublished },
  })

  revalidatePath("/admin/stories")
  revalidatePath(`/admin/stories/${id}`)
  revalidatePath("/stories")
  return { success: true }
}

export async function deleteStory(id: string) {
  const admin = await getCurrentAdmin()
  if (!admin) return { error: "Unauthorized" }

  const supabase = await createClient()

  const { data: story } = await supabase.from("stories").select("*").eq("id", id).single()

  const { error } = await supabase.from("stories").delete().eq("id", id)

  if (error) {
    return { error: error.message }
  }

  await supabase.from("activity_logs").insert({
    user_id: admin.id,
    action: "DELETE",
    entity_type: "story",
    entity_id: id,
    old_data: story,
  })

  revalidatePath("/admin/stories")
  revalidatePath("/stories")
  redirect("/admin/stories")
}
