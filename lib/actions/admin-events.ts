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

export async function getEvents(filters?: { type?: string; category?: string }) {
  const supabase = await createClient()

  let query = supabase.from("events").select("*").order("event_date", { ascending: false })

  if (filters?.type && filters.type !== "all") {
    query = query.eq("type", filters.type)
  }
  if (filters?.category && filters.category !== "all") {
    query = query.eq("category", filters.category)
  }

  const { data, error } = await query

  if (error) throw error
  return data
}

export async function getEvent(id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase.from("events").select("*").eq("id", id).single()

  if (error) throw error
  return data
}

export async function getEventRegistrations(eventId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("event_registrations")
    .select("*")
    .eq("event_id", eventId)
    .order("registered_at", { ascending: false })

  if (error) throw error
  return data
}

export async function createEvent(formData: FormData) {
  const admin = await getCurrentAdmin()
  if (!admin) return { error: "Unauthorized" }

  const supabase = await createClient()

  const title = formData.get("title") as string
  const description = formData.get("description") as string
  const image = formData.get("image") as string
  const eventDate = formData.get("eventDate") as string
  const eventTime = formData.get("eventTime") as string
  const location = formData.get("location") as string
  const category = formData.get("category") as string
  const type = formData.get("type") as string
  const maxCapacity = formData.get("maxCapacity") as string
  const isPublished = formData.get("isPublished") === "true"

  const slug = generateSlug(title)

  const { data, error } = await supabase
    .from("events")
    .insert({
      title,
      slug,
      description,
      image: image || null,
      event_date: eventDate,
      event_time: eventTime || null,
      location,
      category,
      type,
      max_capacity: maxCapacity ? Number.parseInt(maxCapacity) : null,
      is_published: isPublished,
      created_by: admin.id,
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  await supabase.from("activity_logs").insert({
    user_id: admin.id,
    action: "CREATE",
    entity_type: "event",
    entity_id: data.id,
    new_data: { title, category, type },
  })

  revalidatePath("/admin/events")
  revalidatePath("/events")
  redirect(`/admin/events/${data.id}`)
}

export async function updateEvent(id: string, formData: FormData) {
  const admin = await getCurrentAdmin()
  if (!admin) return { error: "Unauthorized" }

  const supabase = await createClient()

  const { data: oldData } = await supabase.from("events").select("*").eq("id", id).single()

  const title = formData.get("title") as string
  const description = formData.get("description") as string
  const image = formData.get("image") as string
  const eventDate = formData.get("eventDate") as string
  const eventTime = formData.get("eventTime") as string
  const location = formData.get("location") as string
  const category = formData.get("category") as string
  const type = formData.get("type") as string
  const maxCapacity = formData.get("maxCapacity") as string
  const isPublished = formData.get("isPublished") === "true"

  const { error } = await supabase
    .from("events")
    .update({
      title,
      description,
      image: image || null,
      event_date: eventDate,
      event_time: eventTime || null,
      location,
      category,
      type,
      max_capacity: maxCapacity ? Number.parseInt(maxCapacity) : null,
      is_published: isPublished,
    })
    .eq("id", id)

  if (error) {
    return { error: error.message }
  }

  await supabase.from("activity_logs").insert({
    user_id: admin.id,
    action: "UPDATE",
    entity_type: "event",
    entity_id: id,
    old_data: oldData,
    new_data: { title, category, type, is_published: isPublished },
  })

  revalidatePath("/admin/events")
  revalidatePath(`/admin/events/${id}`)
  revalidatePath("/events")
  return { success: true }
}

export async function deleteEvent(id: string) {
  const admin = await getCurrentAdmin()
  if (!admin) return { error: "Unauthorized" }

  const supabase = await createClient()

  const { data: event } = await supabase.from("events").select("*").eq("id", id).single()

  const { error } = await supabase.from("events").delete().eq("id", id)

  if (error) {
    return { error: error.message }
  }

  await supabase.from("activity_logs").insert({
    user_id: admin.id,
    action: "DELETE",
    entity_type: "event",
    entity_id: id,
    old_data: event,
  })

  revalidatePath("/admin/events")
  revalidatePath("/events")
  redirect("/admin/events")
}
