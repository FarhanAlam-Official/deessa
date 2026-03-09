"use client"

import { useSearchParams } from "next/navigation"
import { ContactForm } from "@/components/contact-form"

/**
 * Thin client wrapper that reads ?ref= and ?subject= from the URL
 * and pre-fills the ContactForm. Used on the /contact page so the
 * donation success page can deep-link with context pre-populated.
 *
 * ?subject=Donation+Support  → selects "Donation Support" in the dropdown
 * ?ref=<donationId>          → pre-fills message with the reference ID
 */
export function ContactFormPrefilled() {
  const searchParams = useSearchParams()

  const ref = searchParams.get("ref")
  const rawSubject = searchParams.get("subject")

  // Map URL subject param to a ContactForm dropdown value
  const subjectMap: Record<string, string> = {
    "Donation+Support": "Donation Support",
    "Donation Support": "Donation Support",
    "Donation Questions": "Donation Questions",
    "General Inquiry": "General Inquiry",
    "Volunteering": "Volunteering",
    "Partnership Opportunities": "Partnership Opportunities",
    "Media & Press": "Media & Press",
    "Other": "Other",
  }

  const initialSubject = rawSubject ? (subjectMap[rawSubject] ?? rawSubject) : ""

  const initialMessage = ref
    ? `Hi,\n\nI need help with my donation.\n\nDonation Reference ID: ${ref}\n\nPlease describe your issue here…`
    : ""

  return (
    <ContactForm
      initialSubject={initialSubject}
      initialMessage={initialMessage}
    />
  )
}
