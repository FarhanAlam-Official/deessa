"use client"

import type React from "react"

import { useState } from "react"
import { Send, CheckCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { submitContactForm } from "@/lib/actions/contact"

export function ContactForm() {
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.id]: e.target.value }))
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const result = await submitContactForm({
      name: `${formData.firstName} ${formData.lastName}`.trim(),
      email: formData.email,
      phone: formData.phone || undefined,
      subject: formData.subject,
      message: formData.message,
    })

    setIsLoading(false)

    if (result.success) {
      setIsSubmitted(true)
    } else {
      setError(result.message)
    }
  }

  if (isSubmitted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
        <CheckCircle className="size-12 text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-green-800 mb-2">Message Sent!</h3>
        <p className="text-green-700">Thank you for reaching out. We&apos;ll get back to you within 24 hours.</p>
        <Button
          onClick={() => {
            setIsSubmitted(false)
            setFormData({ firstName: "", lastName: "", email: "", phone: "", subject: "", message: "" })
          }}
          variant="outline"
          className="mt-4 rounded-full"
        >
          Send Another Message
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">{error}</div>}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="firstName" className="block text-sm font-bold text-foreground mb-2">
            First Name
          </label>
          <input
            type="text"
            id="firstName"
            required
            value={formData.firstName}
            onChange={handleChange}
            className="w-full h-12 px-4 rounded-xl border border-border bg-surface text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div>
          <label htmlFor="lastName" className="block text-sm font-bold text-foreground mb-2">
            Last Name
          </label>
          <input
            type="text"
            id="lastName"
            required
            value={formData.lastName}
            onChange={handleChange}
            className="w-full h-12 px-4 rounded-xl border border-border bg-surface text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-bold text-foreground mb-2">
          Email Address
        </label>
        <input
          type="email"
          id="email"
          required
          value={formData.email}
          onChange={handleChange}
          className="w-full h-12 px-4 rounded-xl border border-border bg-surface text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>
      <div>
        <label htmlFor="phone" className="block text-sm font-bold text-foreground mb-2">
          Phone Number <span className="text-foreground-muted font-normal">(Optional)</span>
        </label>
        <input
          type="tel"
          id="phone"
          value={formData.phone}
          onChange={handleChange}
          className="w-full h-12 px-4 rounded-xl border border-border bg-surface text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>
      <div>
        <label htmlFor="subject" className="block text-sm font-bold text-foreground mb-2">
          Subject
        </label>
        <select
          id="subject"
          required
          value={formData.subject}
          onChange={handleChange}
          className="w-full h-12 px-4 rounded-xl border border-border bg-surface text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="">Select a topic</option>
          <option value="General Inquiry">General Inquiry</option>
          <option value="Donation Questions">Donation Questions</option>
          <option value="Volunteering">Volunteering</option>
          <option value="Partnership Opportunities">Partnership Opportunities</option>
          <option value="Media & Press">Media & Press</option>
          <option value="Other">Other</option>
        </select>
      </div>
      <div>
        <label htmlFor="message" className="block text-sm font-bold text-foreground mb-2">
          Message
        </label>
        <textarea
          id="message"
          rows={5}
          required
          value={formData.message}
          onChange={handleChange}
          className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
          placeholder="How can we help you?"
        />
      </div>
      <Button type="submit" size="lg" className="w-full rounded-full h-12" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" />
            Sending...
          </>
        ) : (
          <>
            <Send className="mr-2 size-4" />
            Send Message
          </>
        )}
      </Button>
    </form>
  )
}
