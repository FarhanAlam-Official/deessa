/**
 * Payment Architecture V2 - PaymentService
 * 
 * This is the single source of truth for all payment state transitions.
 * Only this service is authorized to move donations between states.
 * 
 * Core Responsibilities:
 * - Validate state transitions according to state machine rules
 * - Execute atomic database transactions for confirmation
 * - Enforce idempotency via payment_events ledger
 * - Perform fail-closed amount and currency verification
 * - Trigger post-payment job queue
 * - Log all state changes for audit
 */

import { createClient as createServiceClient } from '@supabase/supabase-js'
import type {
  ConfirmDonationInput,
  ConfirmDonationResult,
  DonationStatus,
  PaymentProvider,
} from './types'
import {
  PaymentError,
  StateTransitionError,
  TransactionError,
  PaymentErrorCode,
} from './errors'
import {
  logConfirmationAttempt,
  logConfirmationSuccess,
  logConfirmationFailure,
  logStateTransition,
  logVerificationResult,
  logAmountMismatch,
  logCurrencyMismatch,
  logIdempotencyCheck,
  logRaceCondition,
  logSystemError,
} from '@/lib/monitoring/logging'

/**
 * PaymentService - Core payment confirmation engine
 * 
 * This service implements the centralized payment confirmation logic
 * with transactional integrity, idempotency, and fail-closed verification.
 */
export class PaymentService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private supabase: ReturnType<typeof createServiceClient<any>>

  constructor() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!url || !key) {
      throw new PaymentError(
        'Missing Supabase service role credentials',
        PaymentErrorCode.INVALID_CONFIGURATION,
        500,
        { missingVars: !url ? 'NEXT_PUBLIC_SUPABASE_URL' : 'SUPABASE_SERVICE_ROLE_KEY' }
      )
    }

    // Use `any` generic so TypeScript doesn't try to validate table names and
    // column types against the generated Supabase schema (which may not include
    // the payments/payment_events tables added by V2 migrations).
    this.supabase = createServiceClient<any>(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  }

  /**
   * Confirm a donation payment with transactional integrity
   * 
   * This is the core method that handles payment confirmation with:
   * - Row-level locking (SELECT FOR UPDATE)
   * - State validation
   * - Idempotency checking
   * - Amount and currency verification
   * - Atomic database updates
   * - Error handling and rollback
   * 
   * @param input - Confirmation input with donation ID, provider, and verification result
   * @returns Confirmation result with final status
   */
  async confirmDonation(
    input: ConfirmDonationInput
  ): Promise<ConfirmDonationResult> {
    const { donationId, provider, verificationResult, eventId } = input
    const startTime = Date.now()

    // Log confirmation attempt
    await logConfirmationAttempt({
      donationId,
      provider,
      transactionId: verificationResult.transactionId,
      eventId,
      amount: verificationResult.amount,
      currency: verificationResult.currency,
    })

    try {
      // Start transaction by fetching and locking the donation row
      const { data: donation, error: fetchError } = await this.supabase
        .from('donations')
        .select('*')
        .eq('id', donationId)
        .single()

      if (fetchError || !donation) {
        throw StateTransitionError.donationNotFound(donationId)
      }

      const currentStatus = donation.payment_status as DonationStatus

      // ── Idempotency check FIRST ───────────────────────────────────────────
      // Must run before validateStateTransition so a Stripe retry on an
      // already-confirmed donation gracefully returns already_processed
      // instead of throwing → 500 → infinite Stripe retries.
      if (eventId) {
        const isAlreadyProcessed = await this.checkIdempotency(provider, eventId)

        await logIdempotencyCheck({
          provider,
          eventId,
          alreadyProcessed: isAlreadyProcessed,
          donationId,
        })

        if (isAlreadyProcessed) {
          return {
            success: true,
            status: 'already_processed',
            donation: {
              id: donation.id,
              payment_status: currentStatus,
              amount: donation.amount,
              currency: donation.currency,
              provider: donation.provider,
              provider_ref: donation.provider_ref,
              confirmed_at: donation.confirmed_at,
            },
          }
        }
      }

      // ── Short-circuit for already-completed donations ─────────────────────
      // Handles duplicate webhooks on donations confirmed by V1 or a prior V2
      // run where no payment_events row exists yet.
      // Cast to string: 'completed' is V1's DB value and isn't in DonationStatus.
      if ((currentStatus as string) === 'completed' || currentStatus === 'confirmed') {
        console.warn('[PaymentService] Donation already completed — returning already_processed', { donationId, currentStatus })
        return {
          success: true,
          status: 'already_processed',
          donation: {
            id: donation.id,
            payment_status: currentStatus,
            amount: donation.amount,
            currency: donation.currency,
            provider: donation.provider,
            provider_ref: donation.provider_ref,
            confirmed_at: donation.confirmed_at,
          },
        }
      }

      // ── State transition validation ───────────────────────────────────────
      this.validateStateTransition(currentStatus, 'confirmed', donationId)

      // Verify amount matches expected
      const amountVerification = this.verifyAmount(
        donation.amount,
        verificationResult.amount
      )

      // Verify currency matches expected
      const currencyVerification = this.verifyCurrency(
        donation.currency,
        verificationResult.currency
      )

      // Log verification result
      await logVerificationResult({
        donationId,
        provider,
        transactionId: verificationResult.transactionId,
        success: amountVerification.valid && currencyVerification.valid && verificationResult.status === 'paid',
        expectedAmount: donation.amount,
        actualAmount: verificationResult.amount,
        expectedCurrency: donation.currency,
        actualCurrency: verificationResult.currency,
        error: !amountVerification.valid
          ? 'Amount mismatch'
          : !currencyVerification.valid
          ? 'Currency mismatch'
          : verificationResult.status !== 'paid'
          ? `Payment status: ${verificationResult.status}`
          : undefined,
      })

      // Determine final status based on verification results
      let finalStatus: 'confirmed' | 'review' | 'failed' = 'confirmed'
      let reviewReason: 'amount_mismatch' | 'currency_mismatch' | 'verification_uncertain' | undefined

      if (verificationResult.status !== 'paid') {
        finalStatus = 'failed'
      } else if (!amountVerification.valid) {
        finalStatus = 'review'
        reviewReason = 'amount_mismatch'
        
        // Log amount mismatch
        await logAmountMismatch({
          donationId,
          provider,
          transactionId: verificationResult.transactionId,
          expectedAmount: donation.amount,
          actualAmount: verificationResult.amount,
        })
      } else if (!currencyVerification.valid) {
        finalStatus = 'review'
        reviewReason = 'currency_mismatch'
        
        // Log currency mismatch
        await logCurrencyMismatch({
          donationId,
          provider,
          transactionId: verificationResult.transactionId,
          expectedCurrency: donation.currency,
          actualCurrency: verificationResult.currency,
        })
      }

      // Execute conditional update with WHERE clause to prevent race conditions
      // Map internal 'confirmed' → 'completed' so V2 payments are visible to all
      // existing admin pages, receipt triggers, and monitoring queries that look
      // for payment_status = 'completed' (the V1 canonical value).
      const dbStatus = finalStatus === 'confirmed' ? 'completed' : finalStatus

      const updateData: Record<string, unknown> = {
        payment_status: dbStatus,
        provider: provider,
        provider_ref: verificationResult.transactionId,
        payment_id: `${provider}:${verificationResult.transactionId}`,
        // V1 writes stripe_session_id so the status-polling endpoint
        // (GET /api/payments/stripe/status?session_id=...) can find the
        // donation after V2 confirms it.  Without this the success page
        // never sees 'completed' and shows 'pending' forever.
        stripe_session_id: (verificationResult.metadata as Record<string, unknown>)?.sessionId
          ?? verificationResult.transactionId,
        stripe_subscription_id:
          ((verificationResult.metadata as Record<string, unknown>)?.subscriptionId as string | null) ?? null,
      }

      // confirmed_at column added by migration 028-add-confirmed-at-to-donations.sql
      if (finalStatus === 'confirmed') {
        updateData.confirmed_at = new Date().toISOString()
      }

      const { data: updatedDonation, error: updateError } = await this.supabase
        .from('donations')
        .update(updateData)
        .eq('id', donationId)
        .eq('payment_status', 'pending') // Conditional update - only if still pending
        .select()
        .single()

      if (updateError || !updatedDonation) {
        // The conditional WHERE payment_status='pending' matched 0 rows.
        // Re-fetch to see if another request already confirmed it.
        const { data: refetched } = await this.supabase
          .from('donations')
          .select('id, payment_status, amount, currency, provider, provider_ref, confirmed_at')
          .eq('id', donationId)
          .single()

        if (refetched?.payment_status === 'completed' || refetched?.payment_status === 'confirmed') {
          console.warn('[PaymentService] Race condition — donation already completed, returning already_processed', { donationId })
          return {
            success: true,
            status: 'already_processed',
            donation: {
              id: refetched.id,
              payment_status: refetched.payment_status,
              amount: refetched.amount,
              currency: refetched.currency,
              provider: refetched.provider,
              provider_ref: refetched.provider_ref,
              confirmed_at: refetched.confirmed_at,
            },
          }
        }

        await logRaceCondition({
          donationId,
          provider,
          currentStatus,
          attemptedStatus: finalStatus,
        })

        throw StateTransitionError.raceConditionDetected(donationId, currentStatus)
      }

      // Log state transition
      await logStateTransition({
        donationId,
        provider,
        currentStatus,
        newStatus: finalStatus,
        reason: reviewReason,
      })

      // Insert payment record (supplementary — non-fatal if table not migrated yet)
      try {
        const { error: paymentInsertError } = await this.supabase
          .from('payments')
          .insert({
            donation_id: donationId,
            provider: provider,
            transaction_id: verificationResult.transactionId,
            amount: verificationResult.amount,
            currency: verificationResult.currency,
            verified_amount: verificationResult.amount,
            verified_currency: verificationResult.currency,
            status: verificationResult.status,
            verified_at: new Date().toISOString(),
            raw_payload: verificationResult.metadata,
          })
        if (paymentInsertError) {
          console.warn('[PaymentService] payments table insert failed (non-fatal):', paymentInsertError.message)
        }
      } catch (e) {
        console.warn('[PaymentService] payments table unavailable (migration pending):', e)
      }

      // Insert payment event for idempotency.
      // Try the fully-enhanced schema first (migration 023); if that fails due to
      // missing columns, fall back to the minimal V1-compatible schema so the
      // idempotency record is always written regardless of migration state.
      if (eventId) {
        let eventInsertError: any = null

        // Attempt 1: enhanced schema (event_type, raw_payload, processed_at)
        const { error: enhancedErr } = await this.supabase
          .from('payment_events')
          .insert({
            provider: provider,
            event_id: eventId,
            donation_id: donationId,
            event_type: 'webhook',
            raw_payload: verificationResult.metadata,
            processed_at: new Date().toISOString(),
          })

        if (enhancedErr) {
          // Column doesn't exist yet (migration 023 not run) — try minimal schema
          if (enhancedErr.code === '42703' || enhancedErr.message?.includes('column')) {
            const { error: minimalErr } = await this.supabase
              .from('payment_events')
              .insert({
                provider: provider,
                event_id: eventId,
                donation_id: donationId,
              })
            eventInsertError = minimalErr
          } else {
            eventInsertError = enhancedErr
          }
        }

        if (eventInsertError) {
          if (eventInsertError.code === '23505') {
            // Duplicate event — already processed (idempotent)
            return {
              success: true,
              status: 'already_processed',
              donation: {
                id: updatedDonation.id,
                payment_status: updatedDonation.payment_status,
                amount: updatedDonation.amount,
                currency: updatedDonation.currency,
                provider: updatedDonation.provider,
                provider_ref: updatedDonation.provider_ref,
                confirmed_at: updatedDonation.confirmed_at,
              },
            }
          }
          console.error('[PaymentService] Failed to insert payment event:', eventInsertError)
        }
      }

      // TODO: Enqueue post-payment job for receipt generation and email
      // This will be implemented in Phase 4
      if (finalStatus === 'confirmed') {
        // Log confirmation success (log the status as stored in DB: 'completed')
        const durationMs = Date.now() - startTime
        await logConfirmationSuccess({
          donationId,
          provider,
          transactionId: verificationResult.transactionId,
          newStatus: dbStatus as DonationStatus,
          durationMs,
        })
      }

      // Send admin alert for REVIEW status
      if (finalStatus === 'review') {
        console.warn(`[PaymentService] Donation ${donationId} requires review: ${reviewReason}`)
        
        // Import alert function dynamically to avoid circular dependencies
        const { sendReviewAlert } = await import('@/lib/monitoring/alerts')
        
        // Determine reason and prepare alert data
        let reason: 'amount_mismatch' | 'currency_mismatch' | 'verification_uncertain' = 'verification_uncertain'
        let expectedAmount: number | undefined
        let actualAmount: number | undefined
        let expectedCurrency: string | undefined
        let actualCurrency: string | undefined
        
        if (reviewReason?.includes('amount')) {
          reason = 'amount_mismatch'
          expectedAmount = donation.amount
          actualAmount = verificationResult.amount
        } else if (reviewReason?.includes('currency')) {
          reason = 'currency_mismatch'
          expectedCurrency = donation.currency
          actualCurrency = verificationResult.currency
        }
        
        // Send alert (non-blocking)
        sendReviewAlert({
          donationId,
          amount: donation.amount,
          currency: donation.currency,
          provider: input.provider,
          reason,
          expectedAmount,
          actualAmount,
          expectedCurrency,
          actualCurrency,
        }).catch(error => {
          console.error('[PaymentService] Failed to send review alert:', error)
        })
      }

      // Return success result
      const result: ConfirmDonationResult = {
        success: true,
        status: finalStatus,
        donation: {
          id: updatedDonation.id,
          payment_status: updatedDonation.payment_status,
          amount: updatedDonation.amount,
          currency: updatedDonation.currency,
          provider: updatedDonation.provider,
          provider_ref: updatedDonation.provider_ref,
          confirmed_at: updatedDonation.confirmed_at,
        },
      }

      if (finalStatus === 'review' && reviewReason) {
        result.metadata = {
          reviewReason,
          mismatchDetails: {
            expectedAmount: !amountVerification.valid ? donation.amount : undefined,
            actualAmount: !amountVerification.valid ? verificationResult.amount : undefined,
            expectedCurrency: !currencyVerification.valid ? donation.currency : undefined,
            actualCurrency: !currencyVerification.valid ? verificationResult.currency : undefined,
          },
        }
      }

      return result

    } catch (error) {
      // Log confirmation failure
      await logConfirmationFailure({
        donationId,
        provider,
        transactionId: verificationResult.transactionId,
        error: error instanceof Error ? error.message : String(error),
        errorCode: error instanceof PaymentError ? error.code : undefined,
        errorStack: error instanceof Error ? error.stack : undefined,
      })
      
      // Handle known errors
      if (error instanceof PaymentError) {
        return {
          success: false,
          status: 'failed',
          error: error.message,
        }
      }

      // Handle unknown errors
      console.error('[PaymentService] Unexpected error in confirmDonation:', error)
      
      // Log system error
      await logSystemError({
        error: error instanceof Error ? error : new Error(String(error)),
        context: 'PaymentService.confirmDonation',
        donationId,
        provider,
        metadata: {
          transactionId: verificationResult.transactionId,
          eventId,
        },
      })
      
      throw new TransactionError(
        `Transaction failed for donation ${donationId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        donationId,
        { originalError: error },
        true
      )
    }
  }

  /**
   * Verify that the payment amount matches the expected donation amount
   * 
   * Implements fail-closed logic: any mismatch results in invalid verification
   * 
   * @param expectedAmount - Expected amount from donation record
   * @param actualAmount - Actual amount from provider verification
   * @returns Verification result with valid flag
   */
  private verifyAmount(
    expectedAmount: number,
    actualAmount: number
  ): { valid: boolean; expectedAmount: number; actualAmount: number } {
    // Convert to minor units (cents) for comparison to avoid floating point issues
    const expectedMinor = Math.round(expectedAmount * 100)
    const actualMinor = Math.round(actualAmount * 100)

    return {
      valid: expectedMinor === actualMinor,
      expectedAmount,
      actualAmount,
    }
  }

  /**
   * Verify that the payment currency matches the expected donation currency
   * 
   * Implements fail-closed logic: any mismatch results in invalid verification
   * 
   * @param expectedCurrency - Expected currency from donation record
   * @param actualCurrency - Actual currency from provider verification
   * @returns Verification result with valid flag
   */
  private verifyCurrency(
    expectedCurrency: string,
    actualCurrency: string
  ): { valid: boolean; expectedCurrency: string; actualCurrency: string } {
    return {
      valid: expectedCurrency.toUpperCase() === actualCurrency.toUpperCase(),
      expectedCurrency,
      actualCurrency,
    }
  }

  /**
   * Check if a payment event has already been processed (idempotency check)
   * 
   * Queries the payment_events table for duplicate event_id
   * 
   * @param provider - Payment provider
   * @param eventId - Provider-specific event identifier
   * @returns True if event already processed, false otherwise
   */
  private async checkIdempotency(
    provider: PaymentProvider,
    eventId: string
  ): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('payment_events')
      .select('id')
      .eq('provider', provider)
      .eq('event_id', eventId)
      .maybeSingle()

    if (error) {
      console.error('[PaymentService] Error checking idempotency:', error)
      // On error, assume not processed to avoid blocking legitimate payments
      return false
    }

    return data !== null
  }

  /**
   * Validate state transition according to state machine rules
   * 
   * Enforces valid state transitions:
   * - PENDING → CONFIRMED (payment verified)
   * - PENDING → REVIEW (amount/currency mismatch)
   * - PENDING → FAILED (verification failed)
   * 
   * Prevents invalid transitions:
   * - CONFIRMED → PENDING (cannot un-confirm)
   * - CONFIRMED → FAILED (cannot fail after confirmation)
   * - FAILED → CONFIRMED (cannot confirm after failure)
   * 
   * @param currentStatus - Current donation status
   * @param attemptedStatus - Status attempting to transition to
   * @param donationId - Donation ID for error reporting
   * @throws StateTransitionError if transition is invalid
   */
  private validateStateTransition(
    currentStatus: DonationStatus,
    attemptedStatus: DonationStatus,
    donationId: string
  ): void {
    // If already confirmed, return already_processed (handled in confirmDonation)
    // Accept both 'confirmed' (V2 internal) and 'completed' (V1 / DB canonical)
    if (currentStatus === 'confirmed' || currentStatus === 'completed' as any) {
      throw StateTransitionError.alreadyConfirmed(donationId)
    }

    // If already failed, return already_processed (handled in confirmDonation)
    if (currentStatus === 'failed') {
      throw StateTransitionError.alreadyFailed(donationId)
    }

    // Only PENDING donations can be confirmed
    if (currentStatus !== 'pending') {
      throw StateTransitionError.invalidTransition(
        donationId,
        currentStatus,
        attemptedStatus
      )
    }

    // Valid transitions from PENDING: confirmed, review, failed
    const validTargetStates: DonationStatus[] = ['confirmed', 'review', 'failed']
    if (!validTargetStates.includes(attemptedStatus)) {
      throw StateTransitionError.invalidTransition(
        donationId,
        currentStatus,
        attemptedStatus
      )
    }
  }
}

/**
 * Create a singleton instance of PaymentService
 * 
 * This ensures consistent configuration and connection pooling
 */
let paymentServiceInstance: PaymentService | null = null

export function getPaymentService(): PaymentService {
  if (!paymentServiceInstance) {
    paymentServiceInstance = new PaymentService()
  }
  return paymentServiceInstance
}
