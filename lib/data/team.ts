import { createClient } from "@/lib/supabase/server"

export async function getPublishedTeamMembers() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("team_members")
    .select("*")
    .eq("is_published", true)
    .order("sort_order", { ascending: true })

  if (error) {
    console.error("Error fetching team members:", error)
    return []
  }
  return data || []
}
