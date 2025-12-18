"use server"

import { createClient } from "@/lib/supabase/server"

export type VolunteerFormData = {
  fullName: string
  email: string
  phone: string
  occupation?: string
  skills: string[]
  availability: string
  interests: string[]
  message?: string
}

export type ActionResult = {
  success: boolean
  message: string
  applicationId?: string
  error?: string
}

export async function submitVolunteerApplication(data: VolunteerFormData): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    const { data: application, error } = await supabase
      .from("volunteer_applications")
      .insert({
        full_name: data.fullName,
        email: data.email,
        phone: data.phone,
        occupation: data.occupation || null,
        skills: data.skills,
        availability: data.availability,
        interests: data.interests,
        message: data.message || null,
      })
      .select()
      .single()

    if (error) {
      console.error("Volunteer application error:", error)
      return { success: false, message: "Failed to submit your application. Please try again.", error: error.message }
    }

    return {
      success: true,
      message: "Thank you for your interest in volunteering! We will contact you soon.",
      applicationId: application.id,
    }
  } catch (err) {
    console.error("Volunteer application error:", err)
    return { success: false, message: "An unexpected error occurred. Please try again." }
  }
}
