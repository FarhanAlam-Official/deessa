"use server"

import { createClient } from "@/lib/supabase/server"

export type EventRegistrationData = {
  eventId: string
  eventTitle: string
  attendeeName: string
  attendeeEmail: string
  attendeePhone?: string
  numberOfGuests: number
  specialRequirements?: string
}

export type ActionResult = {
  success: boolean
  message: string
  registrationId?: string
  error?: string
}

export async function registerForEvent(data: EventRegistrationData): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    const { data: registration, error } = await supabase
      .from("event_registrations")
      .insert({
        event_id: data.eventId,
        event_title: data.eventTitle,
        attendee_name: data.attendeeName,
        attendee_email: data.attendeeEmail,
        attendee_phone: data.attendeePhone || null,
        number_of_guests: data.numberOfGuests,
        special_requirements: data.specialRequirements || null,
      })
      .select()
      .single()

    if (error) {
      console.error("Event registration error:", error)
      return { success: false, message: "Failed to register. Please try again.", error: error.message }
    }

    return {
      success: true,
      message: `You have successfully registered for ${data.eventTitle}!`,
      registrationId: registration.id,
    }
  } catch (err) {
    console.error("Event registration error:", err)
    return { success: false, message: "An unexpected error occurred. Please try again." }
  }
}
