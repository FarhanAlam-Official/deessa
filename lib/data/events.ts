import { createClient } from "@/lib/supabase/server"

export async function getUpcomingEvents() {
  const supabase = await createClient()
  const today = new Date().toISOString().split("T")[0]

  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("is_published", true)
    .gte("event_date", today)
    .order("event_date", { ascending: true })

  if (error) {
    console.error("Error fetching upcoming events:", error)
    return []
  }
  return data || []
}

export async function getPastEvents() {
  const supabase = await createClient()
  const today = new Date().toISOString().split("T")[0]

  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("is_published", true)
    .lt("event_date", today)
    .order("event_date", { ascending: false })
    .limit(6)

  if (error) {
    console.error("Error fetching past events:", error)
    return []
  }
  return data || []
}

export async function getEventById(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase.from("events").select("*").eq("id", id).eq("is_published", true).single()

  if (error) return null
  return data
}
