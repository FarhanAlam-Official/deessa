/**
 * PaymentService Usage Example
 * 
 * This file demonstrates how to use the PaymentService for payment confirmation.
 * This is NOT a test file - it's documentation showing the API usage.
 */

import { getPaymentService } from './PaymentService'
import type { ConfirmDonationInput, VerificationResult } from './types'

/**
 * Example: Confirming a successful Stripe payment
 */
async function exampleStripeConfirmation() {
  const paymentService = getPaymentService()

  // Verification result from StripeAdapter
  const verificationResult: VerificationResult = {
    success: true,
    donationId: '123e4567-e89b-12d3-a456-426614174000',
    transactionId: 'pi_1234567890',
    amount: 100.00,
    currency: 'USD',
    status: 'paid',
    metadata: {
      sessionId: 'cs_test_1234567890',
      customerId: 'cus_1234567890',
    },
  }

  const input: ConfirmDonationInput = {
    donationId: '123e4567-e89b-12d3-a456-426614174000',
    provider: 'stripe',
    verificationResult,
    eventId: 'evt_1234567890',
  }

  const result = await paymentService.confirmDonation(input)

  if (result.success) {
    console.log(`Payment confirmed with status: ${result.status}`)
    if (result.donation) {
      console.log(`Donation ID: ${result.donation.id}`)
      console.log(`Amount: ${result.donation.amount} ${result.donation.currency}`)
    }
  } else {
    console.error(`Payment confirmation failed: ${result.error}`)
  }

  return result
}

/**
 * Example: Handling amount mismatch (REVIEW status)
 */
async function exampleAmountMismatch() {
  const paymentService = getPaymentService()

  // Verification result with mismatched amount
  const verificationResult: VerificationResult = {
    success: true,
    donationId: '123e4567-e89b-12d3-a456-426614174000',
    transactionId: 'pidx_1234567890',
    amount: 95.00, // Expected: 100.00, Actual: 95.00
    currency: 'NPR',
    status: 'paid',
    metadata: {
      pidx: 'pidx_1234567890',
    },
  }

  const input: ConfirmDonationInput = {
    donationId: '123e4567-e89b-12d3-a456-426614174000',
    provider: 'khalti',
    verificationResult,
    eventId: 'khalti_evt_1234567890',
  }

  const result = await paymentService.confirmDonation(input)

  if (result.status === 'review') {
    console.log('Payment requires manual review')
    console.log(`Reason: ${result.metadata?.reviewReason}`)
    console.log('Mismatch details:', result.metadata?.mismatchDetails)
  }

  return result
}

/**
 * Example: Handling idempotent webhook replay
 */
async function exampleIdempotentReplay() {
  const paymentService = getPaymentService()

  const verificationResult: VerificationResult = {
    success: true,
    donationId: '123e4567-e89b-12d3-a456-426614174000',
    transactionId: 'txn_1234567890',
    amount: 100.00,
    currency: 'NPR',
    status: 'paid',
    metadata: {},
  }

  const input: ConfirmDonationInput = {
    donationId: '123e4567-e89b-12d3-a456-426614174000',
    provider: 'esewa',
    verificationResult,
    eventId: 'esewa_evt_1234567890', // Same event ID as before
  }

  // First call - processes payment
  const firstResult = await paymentService.confirmDonation(input)
  console.log(`First call status: ${firstResult.status}`)

  // Second call with same event ID - returns already_processed
  const secondResult = await paymentService.confirmDonation(input)
  console.log(`Second call status: ${secondResult.status}`) // Should be 'already_processed'

  return { firstResult, secondResult }
}

/**
 * Example: Handling failed payment
 */
async function exampleFailedPayment() {
  const paymentService = getPaymentService()

  const verificationResult: VerificationResult = {
    success: true,
    donationId: '123e4567-e89b-12d3-a456-426614174000',
    transactionId: 'pi_failed_1234567890',
    amount: 100.00,
    currency: 'USD',
    status: 'failed', // Payment failed at provider
    metadata: {
      failureReason: 'insufficient_funds',
    },
  }

  const input: ConfirmDonationInput = {
    donationId: '123e4567-e89b-12d3-a456-426614174000',
    provider: 'stripe',
    verificationResult,
    eventId: 'evt_failed_1234567890',
  }

  const result = await paymentService.confirmDonation(input)

  if (result.status === 'failed') {
    console.log('Payment failed')
    console.log('Donation marked as failed in database')
  }

  return result
}

// Export examples for documentation
export {
  exampleStripeConfirmation,
  exampleAmountMismatch,
  exampleIdempotentReplay,
  exampleFailedPayment,
}
