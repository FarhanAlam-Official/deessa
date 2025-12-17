import { createClient } from "@/lib/supabase/server"

export async function getPublishedProjects() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("is_published", true)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching projects:", error)
    return []
  }
  return data || []
}

export async function getProjectsByCategory(category: string) {
  const supabase = await createClient()

  let query = supabase.from("projects").select("*").eq("is_published", true)

  if (category && category !== "all") {
    query = query.eq("category", category)
  }

  const { data, error } = await query.order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching projects by category:", error)
    return []
  }
  return data || []
}

export async function getProjectBySlug(slug: string) {
  const supabase = await createClient()
  const { data, error } = await supabase.from("projects").select("*").eq("slug", slug).eq("is_published", true).single()

  if (error) return null
  return data
}

export async function getFeaturedProjects(limit = 3) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) {
    console.error("Error fetching featured projects:", error)
    return []
  }
  return data || []
}
