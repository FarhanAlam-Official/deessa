"use server"

import { createClient } from "@/lib/supabase/server"

export type ContactFormData = {
  name: string
  email: string
  phone?: string
  subject: string
  message: string
}

export type ActionResult = {
  success: boolean
  message: string
  error?: string
}

export async function submitContactForm(data: ContactFormData): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    const { error } = await supabase.from("contact_submissions").insert({
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      subject: data.subject,
      message: data.message,
    })

    if (error) {
      console.error("Contact form error:", error)
      return { success: false, message: "Failed to submit your message. Please try again.", error: error.message }
    }

    return { success: true, message: "Thank you for your message! We will get back to you soon." }
  } catch (err) {
    console.error("Contact form error:", err)
    return { success: false, message: "An unexpected error occurred. Please try again." }
  }
}
