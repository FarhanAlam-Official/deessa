"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { getCurrentAdmin } from "./admin-auth"

export async function updateVolunteerStatus(id: string, status: string) {
  const admin = await getCurrentAdmin()
  if (!admin) return { error: "Unauthorized" }

  const supabase = await createClient()

  const { error } = await supabase.from("volunteer_applications").update({ status }).eq("id", id)

  if (error) {
    return { error: error.message }
  }

  await supabase.from("activity_logs").insert({
    user_id: admin.id,
    action: status.toUpperCase(),
    entity_type: "volunteer_application",
    entity_id: id,
  })

  revalidatePath("/admin/volunteers")
  return { success: true }
}
