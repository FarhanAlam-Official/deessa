"use client"

import type React from "react"

import { useState } from "react"
import { X, Loader2, CheckCircle, Calendar, MapPin, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { registerForEvent } from "@/lib/actions/event-registration"

interface EventRegistrationModalProps {
  isOpen: boolean
  onClose: () => void
  event: {
    id: string
    title: string
    date: string
    time: string
    location: string
  }
}

export function EventRegistrationModal({ isOpen, onClose, event }: EventRegistrationModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    guests: "1",
    requirements: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const result = await registerForEvent({
      eventId: event.id,
      eventTitle: event.title,
      attendeeName: formData.name,
      attendeeEmail: formData.email,
      attendeePhone: formData.phone || undefined,
      numberOfGuests: Number.parseInt(formData.guests),
      specialRequirements: formData.requirements || undefined,
    })

    setIsLoading(false)

    if (result.success) {
      setIsSubmitted(true)
    } else {
      setError(result.message)
    }
  }

  const handleClose = () => {
    setIsSubmitted(false)
    setFormData({ name: "", email: "", phone: "", guests: "1", requirements: "" })
    setError(null)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative bg-background rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-background border-b border-border p-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">Register for Event</h2>
          <button
            onClick={handleClose}
            className="size-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="p-6">
          {/* Event Info */}
          <div className="bg-surface rounded-xl p-4 mb-6">
            <h3 className="font-bold text-foreground mb-3">{event.title}</h3>
            <div className="space-y-2 text-sm text-foreground-muted">
              <div className="flex items-center gap-2">
                <Calendar className="size-4 text-primary" />
                <span>{event.date}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="size-4 text-primary" />
                <span>{event.time}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="size-4 text-primary" />
                <span>{event.location}</span>
              </div>
            </div>
          </div>

          {isSubmitted ? (
            <div className="text-center py-8">
              <div className="size-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="size-8 text-green-500" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Registration Successful!</h3>
              <p className="text-foreground-muted mb-6">
                You&apos;re registered for {event.title}. We&apos;ve sent a confirmation to {formData.email}.
              </p>
              <Button onClick={handleClose} className="rounded-full">
                Close
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm">{error}</div>
              )}

              <div>
                <label htmlFor="name" className="block text-sm font-bold text-foreground mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full h-11 px-4 rounded-xl border border-border bg-surface text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-bold text-foreground mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full h-11 px-4 rounded-xl border border-border bg-surface text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-bold text-foreground mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full h-11 px-4 rounded-xl border border-border bg-surface text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label htmlFor="guests" className="block text-sm font-bold text-foreground mb-2">
                  Number of Guests
                </label>
                <select
                  id="guests"
                  name="guests"
                  value={formData.guests}
                  onChange={handleChange}
                  className="w-full h-11 px-4 rounded-xl border border-border bg-surface text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {[1, 2, 3, 4, 5].map((num) => (
                    <option key={num} value={num}>
                      {num} {num === 1 ? "person" : "people"}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="requirements" className="block text-sm font-bold text-foreground mb-2">
                  Special Requirements
                </label>
                <textarea
                  id="requirements"
                  name="requirements"
                  rows={3}
                  value={formData.requirements}
                  onChange={handleChange}
                  placeholder="Dietary restrictions, accessibility needs, etc."
                  className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                />
              </div>

              <Button type="submit" className="w-full rounded-full h-11" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Registering...
                  </>
                ) : (
                  "Complete Registration"
                )}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
