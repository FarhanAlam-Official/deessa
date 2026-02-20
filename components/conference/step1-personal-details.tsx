"use client"

import { User, Mail, Phone, Building2 } from "lucide-react"

export type Step1Data = {
  fullName: string
  email: string
  phone: string
  organization: string
}

interface Step1Props {
  data: Step1Data
  onChange: (data: Partial<Step1Data>) => void
  onNext: () => void
}

export function Step1PersonalDetails({ data, onChange, onNext }: Step1Props) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onNext()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      {/* Section heading */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Personal Details</h1>
        <p className="text-sm text-foreground-muted">
          Please provide your contact information for the conference badge.
        </p>
      </div>

      {/* Fields */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {/* Full Name */}
        <div className="md:col-span-2">
          <label className="flex flex-col gap-2">
            <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground">
              <User className="size-4 text-primary" />
              Full Name <span className="text-red-500">*</span>
            </span>
            <input
              type="text"
              required
              value={data.fullName}
              onChange={(e) => onChange({ fullName: e.target.value })}
              placeholder="e.g. Sarah Johnson"
              className="h-14 w-full rounded-xl border border-border bg-background px-4 text-base text-foreground placeholder:text-foreground-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </label>
        </div>

        {/* Email */}
        <div className="md:col-span-2">
          <label className="flex flex-col gap-2">
            <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground">
              <Mail className="size-4 text-primary" />
              Email Address <span className="text-red-500">*</span>
            </span>
            <input
              type="email"
              required
              value={data.email}
              onChange={(e) => onChange({ email: e.target.value })}
              placeholder="e.g. sarah@example.com"
              className="h-14 w-full rounded-xl border border-border bg-background px-4 text-base text-foreground placeholder:text-foreground-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </label>
        </div>

        {/* Phone */}
        <div>
          <label className="flex flex-col gap-2">
            <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground">
              <Phone className="size-4 text-primary" />
              Phone Number
            </span>
            <input
              type="tel"
              value={data.phone}
              onChange={(e) => onChange({ phone: e.target.value })}
              placeholder="+1 (555) 000-0000"
              className="h-14 w-full rounded-xl border border-border bg-background px-4 text-base text-foreground placeholder:text-foreground-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </label>
        </div>

        {/* Organization */}
        <div>
          <label className="flex flex-col gap-2">
            <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground">
              <Building2 className="size-4 text-primary" />
              Organization
            </span>
            <input
              type="text"
              value={data.organization}
              onChange={(e) => onChange({ organization: e.target.value })}
              placeholder="e.g. DEESSA Inc."
              className="h-14 w-full rounded-xl border border-border bg-background px-4 text-base text-foreground placeholder:text-foreground-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </label>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between border-t border-border pt-6">
        {/* invisible placeholder to keep Next aligned right on step 1 */}
        <span className="invisible px-6 py-3 text-sm font-bold">Back</span>
        <button
          type="submit"
          className="flex items-center gap-2 rounded-xl bg-primary px-8 py-3 text-base font-bold text-white shadow-lg shadow-primary/30 transition hover:-translate-y-0.5 active:translate-y-0 active:shadow-md"
        >
          Next Step
          <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </button>
      </div>
    </form>
  )
}
