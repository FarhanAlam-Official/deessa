"use client"

export type Step2Data = {
  role: string
  attendanceMode: string
  workshops: string[]
}

const ROLES = [
  { value: "attendee", label: "Professional Delegate" },
  { value: "speaker", label: "Speaker" },
  { value: "panelist", label: "Panelist" },
  { value: "volunteer", label: "Volunteer" },
  { value: "sponsor", label: "Sponsor / Exhibitor" },
]

const WORKSHOPS = [
  "AI Ethics in Philanthropy",
  "Modern Grant-making Strategies",
  "Community Storytelling & Media",
  "Fundraising in the Digital Age",
  "Youth Leadership Development",
  "Sustainability & Impact Measurement",
]

interface Step2Props {
  data: Step2Data
  onChange: (data: Partial<Step2Data>) => void
  onNext: () => void
  onBack: () => void
}

export function Step2Participation({ data, onChange, onNext, onBack }: Step2Props) {
  const toggleWorkshop = (ws: string) => {
    const current = data.workshops
    const updated = current.includes(ws) ? current.filter((w) => w !== ws) : [...current, ws]
    onChange({ workshops: updated })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onNext()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      {/* Section heading */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Participation Details</h1>
        <p className="text-sm text-foreground-muted">
          Tell us about your role and how you'll be joining us.
        </p>
      </div>

      {/* Role */}
      <div className="flex flex-col gap-3">
        <label className="text-xs font-bold uppercase tracking-wider text-foreground">
          Your Role <span className="text-red-500">*</span>
        </label>
        <select
          required
          value={data.role}
          onChange={(e) => onChange({ role: e.target.value })}
          className="h-14 w-full appearance-none rounded-xl border border-border bg-background px-4 text-base text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
        >
          <option value="">Select your role…</option>
          {ROLES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </div>

      {/* Attendance Mode */}
      <div className="flex flex-col gap-3">
        <label className="text-xs font-bold uppercase tracking-wider text-foreground">
          Attendance Mode <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 gap-4">
          {[
            { value: "in-person", label: "In-Person", sub: "Chicago, IL — Oct 15–17", icon: "🏛️" },
            { value: "online", label: "Online", sub: "Live-streamed sessions", icon: "💻" },
          ].map((mode) => (
            <label
              key={mode.value}
              className={`flex cursor-pointer flex-col gap-2 rounded-xl border-2 p-4 transition-all ${
                data.attendanceMode === mode.value
                  ? "border-primary bg-primary/5"
                  : "border-border bg-background hover:border-primary/40"
              }`}
            >
              <input
                type="radio"
                name="attendanceMode"
                value={mode.value}
                required
                checked={data.attendanceMode === mode.value}
                onChange={(e) => onChange({ attendanceMode: e.target.value })}
                className="sr-only"
              />
              <span className="text-2xl">{mode.icon}</span>
              <span className="font-bold text-foreground">{mode.label}</span>
              <span className="text-xs text-foreground-muted">{mode.sub}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Workshops */}
      <div className="flex flex-col gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-foreground">
            Select Workshops{" "}
            <span className="font-normal normal-case text-foreground-muted">(choose up to 2)</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {WORKSHOPS.map((ws) => {
            const selected = data.workshops.includes(ws)
            const maxReached = data.workshops.length >= 2 && !selected
            return (
              <button
                key={ws}
                type="button"
                disabled={maxReached}
                onClick={() => toggleWorkshop(ws)}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                  selected
                    ? "border-primary bg-primary/10 text-primary"
                    : maxReached
                    ? "cursor-not-allowed border-border text-foreground-muted opacity-50"
                    : "border-border text-foreground-muted hover:border-primary hover:text-primary"
                }`}
              >
                {ws}
              </button>
            )
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between border-t border-border pt-6">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 rounded-xl border border-border px-6 py-3 text-sm font-bold text-foreground transition-colors hover:bg-muted"
        >
          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 16l-4-4m0 0l4-4m-4 4h18" />
          </svg>
          Back
        </button>
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
