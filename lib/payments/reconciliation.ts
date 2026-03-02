/**
 * Payment Architecture V2 - Reconciliation System
 * 
 * This module handles reconciliation of stuck/pending donations by:
 * - Querying donations that have been pending for > 1 hour
 * - Looking up transaction status with payment providers
 * - Confirming or failing donations based on provider response
 * - Sending admin alerts for each reconciliation action
 * 
 * Reconciliation is designed to run as a scheduled job (hourly) to catch:
 * - Missed webhooks
 * - Browser-closed scenarios (Khalti, eSewa)
 * - Network failures during webhook delivery
 */

import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getPaymentService } from './core/PaymentService'
import { createStripeAdapter } from './adapters/StripeAdapter'
import { createKhaltiAdapter } from './adapters/KhaltiAdapter'
import { createEsewaAdapter } from './adapters/EsewaAdapter'
import type { PaymentProvider, VerificationResult } from './core/types'
import { sendStuckDonationAlert } from '@/lib/monitoring/alerts'

/**
 * Reconciliation result for a single donation
 */
interface ReconciliationResult {
  donationId: string
  provider: PaymentProvider
  previousStatus: string
  newStatus: string
  action: 'confirmed' | 'failed' | 'no_change' | 'error'
  error?: string
  transactionId?: string
}

/**
 * Summary of reconciliation run
 */
interface ReconciliationSummary {
  totalChecked: number
  confirmed: number
  failed: number
  noChange: number
  errors: number
  results: ReconciliationResult[]
  durationMs: number
}

/**
 * Reconcile pending donations that are stuck
 * 
 * Queries donations that have been in PENDING status for more than 1 hour
 * and attempts to verify their status with the payment provider.
 * 
 * @param options - Reconciliation options
 * @returns Summary of reconciliation results
 */
export async function reconcilePendingDonations(options?: {
  maxAge?: number // Maximum age in milliseconds (default: 1 hour)
  limit?: number // Maximum number of donations to process (default: 100)
  dryRun?: boolean // If true, only log what would be done without making changes
}): Promise<ReconciliationSummary> {
  const startTime = Date.now()
  const maxAge = options?.maxAge || 60 * 60 * 1000 // 1 hour
  const limit = options?.limit || 100
  const dryRun = options?.dryRun || false

  console.log('[Reconciliation] Starting reconciliation run', {
    maxAge: `${maxAge / 1000 / 60} minutes`,
    limit,
    dryRun,
  })

  // Initialize Supabase client
  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  )

  // Calculate cutoff time
  const cutoffTime = new Date(Date.now() - maxAge).toISOString()

  // Query pending donations older than cutoff
  const { data: pendingDonations, error: queryError } = await supabase
    .from('donations')
    .select('*')
    .eq('payment_status', 'pending')
    .lt('created_at', cutoffTime)
    .order('created_at', { ascending: true })
    .limit(limit)

  if (queryError) {
    console.error('[Reconciliation] Failed to query pending donations:', queryError)
    throw new Error(`Failed to query pending donations: ${queryError.message}`)
  }

  if (!pendingDonations || pendingDonations.length === 0) {
    console.log('[Reconciliation] No stuck donations found')
    return {
      totalChecked: 0,
      confirmed: 0,
      failed: 0,
      noChange: 0,
      errors: 0,
      results: [],
      durationMs: Date.now() - startTime,
    }
  }

  console.log(`[Reconciliation] Found ${pendingDonations.length} stuck donations to reconcile`)

  // Process each donation
  const results: ReconciliationResult[] = []
  let confirmed = 0
  let failed = 0
  let noChange = 0
  let errors = 0

  for (const donation of pendingDonations) {
    try {
      const result = await reconcileDonation(donation, dryRun)
      results.push(result)

      // Update counters
      switch (result.action) {
        case 'confirmed':
          confirmed++
          break
        case 'failed':
          failed++
          break
        case 'no_change':
          noChange++
          break
        case 'error':
          errors++
          break
      }

      // Send admin alert for each reconciliation action
      if (!dryRun && (result.action === 'confirmed' || result.action === 'failed')) {
        await sendStuckDonationAlert({
          donationId: result.donationId,
          provider: result.provider,
          previousStatus: result.previousStatus,
          newStatus: result.newStatus,
          action: result.action,
          transactionId: result.transactionId,
        }).catch(error => {
          console.error('[Reconciliation] Failed to send alert:', error)
        })
      }
    } catch (error) {
      console.error(`[Reconciliation] Error reconciling donation ${donation.id}:`, error)
      results.push({
        donationId: donation.id,
        provider: donation.provider as PaymentProvider,
        previousStatus: donation.payment_status,
        newStatus: donation.payment_status,
        action: 'error',
        error: error instanceof Error ? error.message : String(error),
      })
      errors++
    }
  }

  const durationMs = Date.now() - startTime

  console.log('[Reconciliation] Reconciliation run completed', {
    totalChecked: pendingDonations.length,
    confirmed,
    failed,
    noChange,
    errors,
    durationMs: `${durationMs}ms`,
  })

  return {
    totalChecked: pendingDonations.length,
    confirmed,
    failed,
    noChange,
    errors,
    results,
    durationMs,
  }
}

/**
 * Reconcile a single donation
 * 
 * Looks up the transaction status with the payment provider and
 * confirms or fails the donation based on the result.
 * 
 * @param donation - Donation record to reconcile
 * @param dryRun - If true, only log what would be done
 * @returns Reconciliation result
 */
async function reconcileDonation(
  donation: any,
  dryRun: boolean
): Promise<ReconciliationResult> {
  const provider = donation.provider as PaymentProvider
  const donationId = donation.id
  const previousStatus = donation.payment_status

  console.log(`[Reconciliation] Reconciling donation ${donationId} (provider: ${provider})`)

  // Get provider-specific reference
  const providerRef = getProviderReference(donation, provider)
  if (!providerRef) {
    console.warn(`[Reconciliation] No provider reference found for donation ${donationId}`)
    return {
      donationId,
      provider,
      previousStatus,
      newStatus: previousStatus,
      action: 'no_change',
      error: 'No provider reference found',
    }
  }

  // Lookup transaction status with provider
  let verificationResult: VerificationResult
  try {
    verificationResult = await lookupTransactionStatus(provider, providerRef, donationId)
  } catch (error) {
    console.error(`[Reconciliation] Failed to lookup transaction for donation ${donationId}:`, error)
    return {
      donationId,
      provider,
      previousStatus,
      newStatus: previousStatus,
      action: 'error',
      error: error instanceof Error ? error.message : String(error),
    }
  }

  // Determine action based on verification result
  if (verificationResult.status === 'paid' && verificationResult.success) {
    // Payment is confirmed - update donation
    if (dryRun) {
      console.log(`[Reconciliation] [DRY RUN] Would confirm donation ${donationId}`)
      return {
        donationId,
        provider,
        previousStatus,
        newStatus: 'confirmed',
        action: 'confirmed',
        transactionId: verificationResult.transactionId,
      }
    }

    // Call PaymentService to confirm the donation
    const paymentService = getPaymentService()
    const confirmResult = await paymentService.confirmDonation({
      donationId,
      provider,
      verificationResult,
      eventId: `reconciliation:${donationId}:${Date.now()}`,
    })

    console.log(`[Reconciliation] Confirmed donation ${donationId}`, confirmResult)

    return {
      donationId,
      provider,
      previousStatus,
      newStatus: confirmResult.status,
      action: 'confirmed',
      transactionId: verificationResult.transactionId,
    }
  } else if (verificationResult.status === 'failed' || !verificationResult.success) {
    // Payment failed or expired - mark as failed
    if (dryRun) {
      console.log(`[Reconciliation] [DRY RUN] Would fail donation ${donationId}`)
      return {
        donationId,
        provider,
        previousStatus,
        newStatus: 'failed',
        action: 'failed',
        transactionId: verificationResult.transactionId,
      }
    }

    // Call PaymentService to fail the donation
    const paymentService = getPaymentService()
    const confirmResult = await paymentService.confirmDonation({
      donationId,
      provider,
      verificationResult,
      eventId: `reconciliation:${donationId}:${Date.now()}`,
    })

    console.log(`[Reconciliation] Failed donation ${donationId}`, confirmResult)

    return {
      donationId,
      provider,
      previousStatus,
      newStatus: confirmResult.status,
      action: 'failed',
      transactionId: verificationResult.transactionId,
    }
  } else {
    // Payment still pending - no action needed
    console.log(`[Reconciliation] Donation ${donationId} still pending, no action taken`)
    return {
      donationId,
      provider,
      previousStatus,
      newStatus: previousStatus,
      action: 'no_change',
      transactionId: verificationResult.transactionId,
    }
  }
}

/**
 * Get provider-specific reference from donation record
 * 
 * @param donation - Donation record
 * @param provider - Payment provider
 * @returns Provider reference or null
 */
function getProviderReference(donation: any, provider: PaymentProvider): string | null {
  switch (provider) {
    case 'stripe':
      return donation.stripe_session_id || donation.provider_ref || null
    
    case 'khalti':
      return donation.khalti_pidx || donation.provider_ref || null
    
    case 'esewa':
      return donation.esewa_transaction_uuid || donation.provider_ref || null
    
    default:
      return donation.provider_ref || null
  }
}

/**
 * Lookup transaction status with payment provider
 * 
 * This function will be implemented in task 22.2 by adding
 * lookupTransaction() methods to each adapter.
 * 
 * @param provider - Payment provider
 * @param providerRef - Provider-specific reference
 * @param donationId - Donation ID
 * @returns Verification result
 */
async function lookupTransactionStatus(
  provider: PaymentProvider,
  providerRef: string,
  donationId: string
): Promise<VerificationResult> {
  switch (provider) {
    case 'stripe': {
      const adapter = createStripeAdapter()
      return await adapter.lookupTransaction(providerRef, donationId)
    }
    
    case 'khalti': {
      const adapter = createKhaltiAdapter()
      return await adapter.lookupTransaction(providerRef, donationId)
    }
    
    case 'esewa': {
      const adapter = createEsewaAdapter()
      return await adapter.lookupTransaction(providerRef, donationId)
    }
    
    default:
      throw new Error(`Unsupported provider: ${provider}`)
  }
}
