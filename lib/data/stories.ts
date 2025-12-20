import { createClient } from "@/lib/supabase/server"
import { createClient as createStaticClient } from "@/lib/supabase/static"

export async function getPublishedStories() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("stories")
    .select("*")
    .eq("is_published", true)
    .order("published_at", { ascending: false })

  if (error) {
    console.error("Error fetching stories:", error)
    return []
  }
  return data || []
}

export function getPublishedStoriesStatic() {
  const supabase = createStaticClient()
  return supabase
    .from("stories")
    .select("slug")
    .eq("is_published", true)
    .then(({ data, error }) => {
      if (error) {
        console.error("Error fetching stories:", error)
        return []
      }
      return data || []
    })
}

export async function getFeaturedStory() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("stories")
    .select("*")
    .eq("is_published", true)
    .eq("is_featured", true)
    .order("published_at", { ascending: false })
    .limit(1)
    .single()

  if (error) {
    // Fallback to most recent if no featured
    const { data: fallback } = await supabase
      .from("stories")
      .select("*")
      .eq("is_published", true)
      .order("published_at", { ascending: false })
      .limit(1)
      .single()
    return fallback
  }
  return data
}

export async function getStoryBySlug(slug: string) {
  const supabase = await createClient()
  const { data, error } = await supabase.from("stories").select("*").eq("slug", slug).eq("is_published", true).single()

  if (error) return null
  return data
}
