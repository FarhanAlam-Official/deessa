"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { StepProgressBar } from "./step-progress-bar"
import { Step1PersonalDetails, type Step1Data } from "./step1-personal-details"
import { Step2Participation, type Step2Data } from "./step2-participation"
import { Step3AdditionalInfo, type Step3Data } from "./step3-additional-info"
import { Step4Review } from "./step4-review"
import { registerForConference } from "@/lib/actions/conference-registration"

const STEP_LABELS = [
  "Personal Details",
  "Participation Details",
  "Additional Info",
  "Review & Submit",
]

const defaultStep1: Step1Data = {
  fullName: "",
  email: "",
  phone: "",
  organization: "",
}

const defaultStep2: Step2Data = {
  role: "",
  attendanceMode: "",
  workshops: [],
}

const defaultStep3: Step3Data = {
  dietaryPreference: "",
  tshirtSize: "",
  heardVia: [],
  emergencyContactName: "",
  emergencyContactPhone: "",
}

export function ConferenceRegistrationForm() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [step1, setStep1] = useState<Step1Data>(defaultStep1)
  const [step2, setStep2] = useState<Step2Data>(defaultStep2)
  const [step3, setStep3] = useState<Step3Data>(defaultStep3)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const handleNext = () => setCurrentStep((s) => Math.min(s + 1, 4))
  const handleBack = () => setCurrentStep((s) => Math.max(s - 1, 1))
  const handleEdit = (step: number) => setCurrentStep(step)

  const handleSubmit = async (consent: { consentTerms: boolean; consentNewsletter: boolean }) => {
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const result = await registerForConference({
        ...step1,
        ...step2,
        ...step3,
        ...consent,
      })

      if (result.success && result.registrationId) {
        if (result.paymentRequired) {
          const params = new URLSearchParams({
            rid: result.registrationId,
            email: step1.email,
            name: step1.fullName,
            amount: String(result.paymentAmount ?? ""),
            currency: result.paymentCurrency ?? "NPR",
            expiryHours: String(result.expiryHours ?? 24),
          })
          router.push(`/conference/register/payment-options?${params.toString()}`)
        } else {
          router.push(
            `/conference/register/success?id=${result.registrationId}&name=${encodeURIComponent(step1.fullName)}&email=${encodeURIComponent(step1.email)}`
          )
        }
      } else {
        setSubmitError(result.message || "Registration failed. Please try again.")
      }
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "An unexpected error occurred. Please try again."
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <div className="mx-auto w-full max-w-3xl px-4 pb-6 pt-8 sm:px-6">
        {/* Logo row */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-white font-bold text-lg">
              D
            </div>
            <span className="text-lg font-bold tracking-tight text-foreground">DEESSA Foundation</span>
          </div>
          <a
            href="/conference"
            className="flex items-center gap-1 text-sm font-semibold text-foreground-muted transition-colors hover:text-primary"
          >
            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 16l-4-4m0 0l4-4m-4 4h18" />
            </svg>
            Back to Conference
          </a>
        </div>

        {/* Progress */}
        <StepProgressBar
          step={currentStep}
          total={4}
          label={STEP_LABELS[currentStep - 1]}
        />
      </div>

      {/* Form Card */}
      <div className="mx-auto w-full max-w-3xl flex-1 px-4 pb-16 sm:px-6">
        <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          {/* Decorative blob */}
          <div className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-primary/5 blur-3xl" />

          <div className="relative z-10 p-8 sm:p-10">
            {currentStep === 1 && (
              <Step1PersonalDetails
                data={step1}
                onChange={(d) => setStep1((p) => ({ ...p, ...d }))}
                onNext={handleNext}
              />
            )}
            {currentStep === 2 && (
              <Step2Participation
                data={step2}
                onChange={(d) => setStep2((p) => ({ ...p, ...d }))}
                onNext={handleNext}
                onBack={handleBack}
              />
            )}
            {currentStep === 3 && (
              <Step3AdditionalInfo
                data={step3}
                onChange={(d) => setStep3((p) => ({ ...p, ...d }))}
                onNext={handleNext}
                onBack={handleBack}
              />
            )}
            {currentStep === 4 && (
              <Step4Review
                data={{ step1, step2, step3 }}
                onEdit={handleEdit}
                onSubmit={handleSubmit}
                onBack={handleBack}
                isSubmitting={isSubmitting}
                error={submitError}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
