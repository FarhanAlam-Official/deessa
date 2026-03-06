/**
 * Payment Architecture V2 - Core Type Definitions
 * 
 * This file defines the shared types and interfaces used across the payment system.
 * These types provide a common language for payment processing, provider abstraction,
 * and state management.
 */

/**
 * Donation lifecycle states following the state machine specification
 */
export type DonationStatus = 
  | 'initiated'   // Donation record created, payment not yet started
  | 'pending'     // Payment initiated with provider, awaiting confirmation
  | 'confirmed'   // Payment verified and confirmed
  | 'review'      // Payment requires manual review (amount mismatch, etc.)
  | 'failed'      // Payment verification failed
  | 'refunded'    // Payment was refunded (admin action)

/**
 * Supported payment providers
 */
export type PaymentProvider = 'stripe' | 'khalti' | 'esewa'

/**
 * Payment processing mode
 */
export type PaymentMode = 'live' | 'mock'

/**
 * Provider-specific payment status (normalized from provider responses)
 */
export type ProviderPaymentStatus = 'paid' | 'pending' | 'failed'

/**
 * Result of payment verification from a provider adapter
 * 
 * This is the normalized output from provider-specific verification logic.
 * All provider adapters must return this structure.
 */
export interface VerificationResult {
  /** Whether verification succeeded */
  success: boolean
  
  /** The donation ID extracted from provider payload */
  donationId: string
  
  /** Provider-specific transaction identifier */
  transactionId: string
  
  /** Verified payment amount (in major currency units, e.g., dollars) */
  amount: number
  
  /** Verified payment currency code (e.g., 'USD', 'NPR') */
  currency: string
  
  /** Normalized payment status from provider */
  status: ProviderPaymentStatus
  
  /** Additional provider-specific metadata */
  metadata: Record<string, unknown>
  
  /** Error message if verification failed */
  error?: string
}

/**
 * Metadata extracted from provider payment events
 * 
 * Used for audit logging and debugging
 */
export interface PaymentMetadata {
  /** Payment provider */
  provider: PaymentProvider
  
  /** Provider-specific transaction identifier */
  transactionId: string
  
  /** Provider-specific event identifier (for idempotency) */
  eventId?: string
  
  /** Timestamp of the payment event */
  timestamp: Date
  
  /** Raw provider payload (for debugging and audit) */
  rawPayload: unknown
}

/**
 * Normalized payment data structure
 * 
 * This is the common format that all provider-specific payloads are converted to.
 * It provides a consistent interface for payment processing regardless of provider.
 */
export interface NormalizedPayment {
  /** The donation ID this payment is for */
  donationId: string
  
  /** Payment amount in major currency units */
  amount: number
  
  /** Payment currency code */
  currency: string
  
  /** Normalized payment status */
  status: ProviderPaymentStatus
  
  /** Provider-specific transaction identifier */
  transactionId: string
  
  /** Provider-specific event identifier (for webhook deduplication) */
  eventId?: string
  
  /** Additional metadata from the provider */
  metadata: Record<string, unknown>
}

/**
 * Input for PaymentService.confirmDonation()
 */
export interface ConfirmDonationInput {
  /** The donation ID to confirm */
  donationId: string
  
  /** The payment provider */
  provider: PaymentProvider
  
  /** Verification result from provider adapter */
  verificationResult: VerificationResult
  
  /** Event ID for idempotency (webhook event ID) */
  eventId?: string
}

/**
 * Result of PaymentService.confirmDonation()
 */
export interface ConfirmDonationResult {
  /** Whether the confirmation operation succeeded */
  success: boolean
  
  /** Final donation status after confirmation */
  status: 'confirmed' | 'review' | 'failed' | 'already_processed'
  
  /** Updated donation object (if available) */
  donation?: {
    id: string
    payment_status: DonationStatus
    amount: number
    currency: string
    provider?: PaymentProvider
    provider_ref?: string
    confirmed_at?: Date
  }
  
  /** Error message if confirmation failed */
  error?: string
  
  /** Additional context about the result */
  metadata?: {
    /** Reason for REVIEW status */
    reviewReason?: 'amount_mismatch' | 'currency_mismatch' | 'verification_uncertain'
    
    /** Expected vs actual values for mismatches */
    mismatchDetails?: {
      expectedAmount?: number
      actualAmount?: number
      expectedCurrency?: string
      actualCurrency?: string
    }
  }
}

/**
 * Job types for async post-payment processing
 */
export type PaymentJobType = 'receipt_generation' | 'email_send'

/**
 * Job status for async workers
 */
export type PaymentJobStatus = 'pending' | 'processing' | 'completed' | 'failed'

/**
 * Payment job record structure
 */
export interface PaymentJob {
  id: string
  donation_id: string
  job_type: PaymentJobType
  status: PaymentJobStatus
  attempts: number
  max_attempts: number
  payload?: Record<string, unknown>
  error?: string
  created_at: Date
  started_at?: Date
  completed_at?: Date
  next_retry_at?: Date
}
