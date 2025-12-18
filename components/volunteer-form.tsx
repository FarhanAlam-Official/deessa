"use client"

import type React from "react"

import { useState } from "react"
import { Loader2, CheckCircle, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { submitVolunteerApplication } from "@/lib/actions/volunteer"

interface VolunteerFormProps {
  isOpen: boolean
  onClose: () => void
  roleTitle?: string
}

const skillOptions = [
  "Teaching/Education",
  "Healthcare/Medical",
  "Construction/Building",
  "IT/Technology",
  "Marketing/Communications",
  "Finance/Accounting",
  "Legal",
  "Photography/Videography",
  "Languages/Translation",
  "Project Management",
]

const interestOptions = [
  "Education Programs",
  "Healthcare Initiatives",
  "Women Empowerment",
  "Disaster Relief",
  "Community Development",
  "Environmental Projects",
]

export function VolunteerForm({ isOpen, onClose, roleTitle }: VolunteerFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    occupation: "",
    skills: [] as string[],
    availability: "",
    interests: [] as string[],
    message: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    setError(null)
  }

  const handleCheckboxChange = (field: "skills" | "interests", value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].includes(value) ? prev[field].filter((item) => item !== value) : [...prev[field], value],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.skills.length === 0) {
      setError("Please select at least one skill.")
      return
    }

    if (formData.interests.length === 0) {
      setError("Please select at least one area of interest.")
      return
    }

    setIsLoading(true)
    setError(null)

    const result = await submitVolunteerApplication({
      fullName: formData.fullName,
      email: formData.email,
      phone: formData.phone,
      occupation: formData.occupation || undefined,
      skills: formData.skills,
      availability: formData.availability,
      interests: formData.interests,
      message: formData.message || undefined,
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
    setFormData({
      fullName: "",
      email: "",
      phone: "",
      occupation: "",
      skills: [],
      availability: "",
      interests: [],
      message: "",
    })
    setError(null)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative bg-background rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-background border-b border-border p-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-lg font-bold text-foreground">Volunteer Application</h2>
            {roleTitle && <p className="text-sm text-foreground-muted">Applying for: {roleTitle}</p>}
          </div>
          <button
            onClick={handleClose}
            className="size-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="p-6">
          {isSubmitted ? (
            <div className="text-center py-8">
              <div className="size-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="size-8 text-green-500" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Application Submitted!</h3>
              <p className="text-foreground-muted mb-6">
                Thank you for your interest in volunteering with us. We&apos;ll review your application and contact you
                at {formData.email} within 5-7 business days.
              </p>
              <Button onClick={handleClose} className="rounded-full">
                Close
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm">{error}</div>
              )}

              {/* Personal Info */}
              <div className="space-y-4">
                <h3 className="font-bold text-foreground">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Full Name *</label>
                    <input
                      type="text"
                      name="fullName"
                      required
                      value={formData.fullName}
                      onChange={handleChange}
                      className="w-full h-11 px-4 rounded-xl border border-border bg-surface text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Email *</label>
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full h-11 px-4 rounded-xl border border-border bg-surface text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Phone *</label>
                    <input
                      type="tel"
                      name="phone"
                      required
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full h-11 px-4 rounded-xl border border-border bg-surface text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Occupation</label>
                    <input
                      type="text"
                      name="occupation"
                      value={formData.occupation}
                      onChange={handleChange}
                      className="w-full h-11 px-4 rounded-xl border border-border bg-surface text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
              </div>

              {/* Skills */}
              <div>
                <h3 className="font-bold text-foreground mb-3">Skills & Expertise *</h3>
                <div className="grid grid-cols-2 gap-2">
                  {skillOptions.map((skill) => (
                    <label key={skill} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.skills.includes(skill)}
                        onChange={() => handleCheckboxChange("skills", skill)}
                        className="size-4 rounded border-border text-primary focus:ring-primary"
                      />
                      <span className="text-sm text-foreground-muted">{skill}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Availability */}
              <div>
                <label className="block text-sm font-bold text-foreground mb-2">Availability *</label>
                <select
                  name="availability"
                  required
                  value={formData.availability}
                  onChange={handleChange}
                  className="w-full h-11 px-4 rounded-xl border border-border bg-surface text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Select your availability</option>
                  <option value="weekdays">Weekdays only</option>
                  <option value="weekends">Weekends only</option>
                  <option value="flexible">Flexible</option>
                  <option value="fulltime">Full-time (2+ weeks)</option>
                  <option value="remote">Remote only</option>
                </select>
              </div>

              {/* Interests */}
              <div>
                <h3 className="font-bold text-foreground mb-3">Areas of Interest *</h3>
                <div className="grid grid-cols-2 gap-2">
                  {interestOptions.map((interest) => (
                    <label key={interest} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.interests.includes(interest)}
                        onChange={() => handleCheckboxChange("interests", interest)}
                        className="size-4 rounded border-border text-primary focus:ring-primary"
                      />
                      <span className="text-sm text-foreground-muted">{interest}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-bold text-foreground mb-2">Why do you want to volunteer?</label>
                <textarea
                  name="message"
                  rows={4}
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Tell us about your motivation and what you hope to contribute..."
                  className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                />
              </div>

              <Button type="submit" className="w-full rounded-full h-11" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Application"
                )}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
