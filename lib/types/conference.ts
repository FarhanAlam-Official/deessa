// ── Conference types ──────────────────────────────────────────────────────────
// Shared between client and server. No "use server" directive.

export type ConferenceRegistrationStatus =
  | "pending"          // Legacy alias — treated identically to pending_payment
  | "pending_payment"  // Form submitted, awaiting payment
  | "confirmed"        // Payment verified, seat secured
  | "cancelled"        // Cancelled by user or admin
  | "expired"          // Unpaid after 24 hours — cron sets this

export type ConferencePaymentStatus =
  | "unpaid"    // No payment initiated or all attempts failed/abandoned
  | "paid"      // Payment verified (webhook source of truth)
  | "failed"    // Payment gateway confirmed failure
  | "review"    // Amount/currency mismatch — requires admin review

export interface ConferenceRegistration {
  id: string
  created_at: string

  // Personal details
  full_name: string
  email: string
  phone: string | null
  organization: string | null

  // Participation
  role: string | null
  attendance_mode: string | null
  workshops: string[] | null

  // Additional info
  dietary_preference: string | null
  tshirt_size: string | null
  heard_via: string[] | null
  emergency_contact_name: string | null
  emergency_contact_phone: string | null

  // Consent
  consent_terms: boolean
  consent_newsletter: boolean

  // Registration status
  status: ConferenceRegistrationStatus
  admin_notes: string | null

  // Payment
  payment_status: ConferencePaymentStatus
  payment_amount: number | null
  payment_currency: string
  payment_provider: string | null
  payment_id: string | null
  provider_ref: string | null
  stripe_session_id: string | null
  khalti_pidx: string | null
  esewa_transaction_uuid: string | null

  // Lifecycle
  expires_at: string | null
  payment_override_by: string | null
}

/** Minimal shape returned by public verify-registration endpoint (PII) */
export interface ConferenceRegistrationPublic {
  id: string
  status: ConferenceRegistrationStatus
  payment_status: ConferencePaymentStatus
  payment_amount: number | null
  payment_currency: string
  expires_at: string | null
  attendance_mode: string | null
  full_name: string   // Shown on payment page — not sensitive in this context
}

/** Result type for startConferencePayment() */
export interface StartConferencePaymentResult {
  ok: boolean
  message: string
  redirectUrl?: string
  formData?: Record<string, string>
  requiresFormSubmit?: boolean
}
