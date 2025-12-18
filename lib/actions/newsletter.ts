"use server"

import { createClient } from "@/lib/supabase/server"

export type ActionResult = {
  success: boolean
  message: string
  error?: string
}

export async function subscribeToNewsletter(email: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    const { error } = await supabase.from("newsletter_subscriptions").insert({
      email: email,
    })

    if (error) {
      if (error.code === "23505") {
        return { success: false, message: "This email is already subscribed to our newsletter." }
      }
      console.error("Newsletter subscription error:", error)
      return { success: false, message: "Failed to subscribe. Please try again.", error: error.message }
    }

    return { success: true, message: "Thank you for subscribing to our newsletter!" }
  } catch (err) {
    console.error("Newsletter subscription error:", err)
    return { success: false, message: "An unexpected error occurred. Please try again." }
  }
}
