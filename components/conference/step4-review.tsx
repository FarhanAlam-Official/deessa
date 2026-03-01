"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import type { Step1Data } from "./step1-personal-details"
import type { Step2Data } from "./step2-participation"
import type { Step3Data } from "./step3-additional-info"

type AllData = {
  step1: Step1Data
  step2: Step2Data
  step3: Step3Data
}

interface Step4Props {
  data: AllData
  onEdit: (step: number) => void
  onSubmit: (consent: { consentTerms: boolean; consentNewsletter: boolean }) => Promise<void>
  onBack: () => void
  isSubmitting: boolean
  error: string | null
}

function ReviewSection({
  title,
  onEdit,
  rows,
}: {
  title: string
  onEdit: () => void
  rows: { label: string; value: string | string[] | undefined }[]
}) {
  return (
    <div>
      <div className="flex items-center justify-between px-4 pt-5">
        <h2 className="text-xl font-bold text-foreground">{title}</h2>
        <button
          type="button"
          onClick={onEdit}
          className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Edit
        </button>
      </div>
      <div className="p-4 divide-y divide-border">
        {rows.map((row) => (
          <div key={row.label} className="flex items-start justify-between gap-6 py-2">
            <p className="text-sm text-foreground-muted">{row.label}</p>
            {Array.isArray(row.value) ? (
              <div className="flex flex-wrap justify-end gap-1">
                {row.value.map((v, index) => (
                  <span key={`${v}-${index}`} className="inline-block rounded bg-muted px-2 py-1 text-xs font-medium text-foreground">
                    {v}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-right text-sm font-semibold text-foreground">
                {row.value || "—"}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export function Step4Review({ data, onEdit, onSubmit, onBack, isSubmitting, error }: Step4Props) {
  const [consentTerms, setConsentTerms] = useState(false)
  const [consentNewsletter, setConsentNewsletter] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({ consentTerms, consentNewsletter })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Heading */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Review &amp; Submit</h1>
        <p className="text-sm text-foreground-muted">
          Please review your details carefully before final submission.
        </p>
      </div>

      {/* Review Card */}
      <div className="overflow-hidden rounded-2xl border border-border bg-background shadow-sm divide-y divide-border">
        <ReviewSection
          title="Personal Details"
          onEdit={() => onEdit(1)}
          rows={[
            { label: "Full Name", value: data.step1.fullName },
            { label: "Email Address", value: data.step1.email },
            { label: "Phone", value: data.step1.phone || "—" },
            { label: "Organization", value: data.step1.organization || "—" },
          ]}
        />
        <ReviewSection
          title="Participation"
          onEdit={() => onEdit(2)}
          rows={[
            { label: "Role", value: data.step2.role },
            { label: "Attendance Mode", value: data.step2.attendanceMode },
            { label: "Selected Workshops", value: data.step2.workshops },
          ]}
        />
        <ReviewSection
          title="Additional Information"
          onEdit={() => onEdit(3)}
          rows={[
            { label: "Dietary Preference", value: data.step3.dietaryPreference || "None" },
            { label: "T-Shirt Size", value: data.step3.tshirtSize || "—" },
            {
              label: "Emergency Contact",
              value:
                data.step3.emergencyContactName
                  ? `${data.step3.emergencyContactName}${data.step3.emergencyContactPhone ? ` (${data.step3.emergencyContactPhone})` : ""}`
                  : "—",
            },
          ]}
        />

        {/* Consent Section */}
        <div className="bg-primary/5 p-6">
          <h2 className="mb-4 text-base font-bold text-foreground">Consent &amp; Privacy</h2>
          <div className="space-y-4">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                required
                checked={consentTerms}
                onChange={(e) => setConsentTerms(e.target.checked)}
                className="mt-0.5 size-5 rounded border-border text-primary focus:ring-primary"
              />
              {/* TODO: Update the links to the actual terms and privacy policy of the conference */}              <span className="text-sm text-foreground-muted">
                I agree to the{" "}
                <a href="https://deessa.org/terms" target="_blank" rel="noopener noreferrer" className="font-semibold text-primary hover:underline">
                  Terms and Conditions
                </a>{" "}
                and the{" "}
                <a href="https://deessa.org/privacy" target="_blank" rel="noopener noreferrer" className="font-semibold text-primary hover:underline">
                  Data Privacy Policy
                </a>{" "}
                of the DEESSA Foundation Conference.
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={consentNewsletter}
                onChange={(e) => setConsentNewsletter(e.target.checked)}
                className="mt-0.5 size-5 rounded border-border text-primary focus:ring-primary"
              />
              <span className="text-sm text-foreground-muted">
                I consent to receiving future newsletters and updates about upcoming DEESSA Foundation
                events via email.
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

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
          disabled={isSubmitting}
          className="flex items-center gap-2 rounded-xl bg-primary px-8 py-3 text-base font-bold text-white shadow-lg shadow-primary/30 transition hover:-translate-y-0.5 active:translate-y-0 active:shadow-md disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="size-5 animate-spin" />
              Submitting…
            </>
          ) : (
            <>
              Complete Registration
              <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </>
          )}
        </button>
      </div>
    </form>
  )
}
