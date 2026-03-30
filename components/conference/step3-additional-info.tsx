"use client"

const DIETARY_OPTIONS = [
  { value: "none", label: "No Preferences" },
  { value: "vegetarian", label: "Vegetarian" },
  { value: "vegan", label: "Vegan" },
  { value: "gluten-free", label: "Gluten-Free" },
  { value: "other", label: "Other (please specify in notes)" },
]

const TSHIRT_SIZES = ["S", "M", "L", "XL", "XXL"]

const HEARD_VIA_OPTIONS = [
  { value: "social", label: "Social Media" },
  { value: "newsletter", label: "Newsletter" },
  { value: "friend", label: "Friend / Colleague" },
  { value: "website", label: "Website" },
  { value: "other", label: "Other" },
]

export type Step3Data = {
  dietaryPreference: string
  tshirtSize: string
  heardVia: string[]
  emergencyContactName: string
  emergencyContactPhone: string
}

interface Step3Props {
  data: Step3Data
  onChange: (data: Partial<Step3Data>) => void
  onNext: () => void
  onBack: () => void
}

export function Step3AdditionalInfo({ data, onChange, onNext, onBack }: Step3Props) {
  const toggleHeardVia = (val: string) => {
    const current = data.heardVia
    const updated = current.includes(val) ? current.filter((v) => v !== val) : [...current, val]
    onChange({ heardVia: updated })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onNext()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      {/* Heading */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Additional Info <span className="font-normal">&</span> Accessibility
        </h1>
        <p className="text-sm text-foreground-muted">
          Almost there! Just a few more details to make your experience perfect.
        </p>
      </div>

      {/* Dietary Preferences */}
      <div className="flex flex-col gap-3">
        <label htmlFor="dietary-preference-select" className="text-xs font-bold uppercase tracking-wider text-foreground">
          Dietary Preferences
        </label>
        <select
          id="dietary-preference-select"
          value={data.dietaryPreference}
          onChange={(e) => onChange({ dietaryPreference: e.target.value })}
          className="h-14 w-full max-w-[540px] appearance-none rounded-xl border border-border bg-background px-4 text-base text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
        >
          <option value="">Select preference…</option>
          {DIETARY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {/* T-Shirt Size */}
      <div className="flex flex-col gap-3">
        <p className="text-xs font-bold uppercase tracking-wider text-foreground">
          T-Shirt Size{" "}
          <span className="font-normal normal-case text-foreground-muted">(For Volunteers)</span>
        </p>
        <div className="flex h-12 max-w-[540px] items-center rounded-xl border border-border bg-muted p-1">
          {TSHIRT_SIZES.map((size) => (
            <label
              key={size}
              className={`flex h-full flex-1 cursor-pointer items-center justify-center rounded-lg text-sm font-semibold transition-all ${
                data.tshirtSize === size
                  ? "bg-background text-primary shadow-sm"
                  : "text-foreground-muted hover:text-foreground"
              }`}
            >
              {size}
              <input
                type="radio"
                name="tshirtSize"
                value={size}
                checked={data.tshirtSize === size}
                onChange={(e) => onChange({ tshirtSize: e.target.value })}
                className="sr-only"
              />
            </label>
          ))}
        </div>
      </div>

      {/* How did you hear */}
      <div className="flex flex-col gap-3">
        <p className="text-xs font-bold uppercase tracking-wider text-foreground">
          How did you hear about us?
        </p>
        <div className="flex flex-wrap gap-3">
          {HEARD_VIA_OPTIONS.map((opt) => {
            const selected = data.heardVia.includes(opt.value)
            return (
              <button
                key={opt.value}
                type="button"
                aria-pressed={selected}
                onClick={() => toggleHeardVia(opt.value)}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                  selected
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-foreground-muted hover:border-primary hover:text-primary"
                }`}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Emergency Contact */}
      <div className="flex flex-col gap-3">
        <p className="text-xs font-bold uppercase tracking-wider text-foreground">
          Emergency Contact
        </p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-foreground" htmlFor="emergencyContactName">Contact Name</label>
            <input
              id="emergencyContactName"
              type="text"
              value={data.emergencyContactName}
              onChange={(e) => onChange({ emergencyContactName: e.target.value })}
              placeholder="Full Name"
              className="h-12 w-full rounded-xl border border-border bg-background px-4 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-foreground" htmlFor="emergencyContactPhone">Phone Number</label>
            <input
              id="emergencyContactPhone"
              type="tel"
              value={data.emergencyContactPhone}
              onChange={(e) => onChange({ emergencyContactPhone: e.target.value })}
              placeholder="+1 (555) 000-0000"
              className="h-12 w-full rounded-xl border border-border bg-background px-4 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Info note */}
      <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
        <svg className="size-5 shrink-0 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-sm font-medium text-primary">
          This information helps us make the conference better for everyone. All data is stored securely.
        </p>
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
