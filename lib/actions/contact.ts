"use server"

import { createClient } from "@/lib/supabase/server"
import { sendContactEmails } from "@/lib/email/contact-mailer"

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

    // 1. Save to database (primary — must succeed)
    const { error } = await supabase.from("contact_submissions").insert({
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      subject: data.subject,
      message: data.message,
    })

    if (error) {
      console.error("Contact form DB error:", error)
      return {
        success: false,
        message: "Failed to submit your message. Please try again.",
        error: error.message,
      }
    }

    // 2. Send emails (secondary — non-blocking, failure is logged but doesn't affect UX)
    sendContactEmails({
      name: data.name,
      email: data.email,
      phone: data.phone,
      subject: data.subject,
      message: data.message,
    }).catch((err) => {
      console.error("Contact email send error (non-fatal):", err)
    })

    return {
      success: true,
      message: "Thank you for your message! We will get back to you within 24 hours.",
    }
  } catch (err) {
    console.error("Contact form unexpected error:", err)
    return {
      success: false,
      message: "An unexpected error occurred. Please try again.",
    }
  }
}
