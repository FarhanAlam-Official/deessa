/**
 * Payment Architecture V2 - Custom Error Classes
 * 
 * This file defines custom error classes for the payment system.
 * These errors provide structured error handling with error codes and messages.
 */

import { PaymentProvider, DonationStatus } from './types'

/**
 * Error codes for payment system errors
 */
export enum PaymentErrorCode {
  // Verification errors
  SIGNATURE_VERIFICATION_FAILED = 'SIGNATURE_VERIFICATION_FAILED',
  INVALID_WEBHOOK_PAYLOAD = 'INVALID_WEBHOOK_PAYLOAD',
  PROVIDER_API_ERROR = 'PROVIDER_API_ERROR',
  AMOUNT_MISMATCH = 'AMOUNT_MISMATCH',
  CURRENCY_MISMATCH = 'CURRENCY_MISMATCH',
  
  // State transition errors
  INVALID_STATE_TRANSITION = 'INVALID_STATE_TRANSITION',
  DONATION_NOT_FOUND = 'DONATION_NOT_FOUND',
  DONATION_ALREADY_CONFIRMED = 'DONATION_ALREADY_CONFIRMED',
  DONATION_ALREADY_FAILED = 'DONATION_ALREADY_FAILED',
  
  // Transaction errors
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
  RACE_CONDITION_DETECTED = 'RACE_CONDITION_DETECTED',
  IDEMPOTENCY_VIOLATION = 'IDEMPOTENCY_VIOLATION',
  
  // Configuration errors
  MISSING_CREDENTIALS = 'MISSING_CREDENTIALS',
  INVALID_CONFIGURATION = 'INVALID_CONFIGURATION',
  
  // Rate limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // Generic errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Base error class for all payment-related errors
 */
export class PaymentError extends Error {
  public readonly code: PaymentErrorCode
  public readonly statusCode: number
  public readonly metadata: Record<string, unknown>
  public readonly isRetryable: boolean

  constructor(
    message: string,
    code: PaymentErrorCode = PaymentErrorCode.UNKNOWN_ERROR,
    statusCode: number = 500,
    metadata: Record<string, unknown> = {},
    isRetryable: boolean = false
  ) {
    super(message)
    this.name = 'PaymentError'
    this.code = code
    this.statusCode = statusCode
    this.metadata = metadata
    this.isRetryable = isRetryable

    // Maintains proper stack trace for where error was thrown (V8 only)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }
  }

  /**
   * Convert error to JSON for logging and API responses
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      metadata: this.metadata,
      isRetryable: this.isRetryable,
    }
  }
}

/**
 * Error thrown when payment verification fails
 */
export class VerificationError extends PaymentError {
  public readonly provider: PaymentProvider

  constructor(
    message: string,
    provider: PaymentProvider,
    code: PaymentErrorCode = PaymentErrorCode.SIGNATURE_VERIFICATION_FAILED,
    metadata: Record<string, unknown> = {},
    isRetryable: boolean = false
  ) {
    super(message, code, 400, { ...metadata, provider }, isRetryable)
    this.name = 'VerificationError'
    this.provider = provider
  }

  /**
   * Create error for signature verification failure
   */
  static signatureVerificationFailed(
    provider: PaymentProvider,
    details?: string
  ): VerificationError {
    return new VerificationError(
      `Signature verification failed for ${provider}${details ? `: ${details}` : ''}`,
      provider,
      PaymentErrorCode.SIGNATURE_VERIFICATION_FAILED
    )
  }

  /**
   * Create error for invalid webhook payload
   */
  static invalidPayload(
    provider: PaymentProvider,
    reason: string
  ): VerificationError {
    return new VerificationError(
      `Invalid webhook payload from ${provider}: ${reason}`,
      provider,
      PaymentErrorCode.INVALID_WEBHOOK_PAYLOAD
    )
  }

  /**
   * Create error for amount mismatch
   */
  static amountMismatch(
    provider: PaymentProvider,
    expected: number,
    actual: number
  ): VerificationError {
    return new VerificationError(
      `Amount mismatch: expected ${expected}, got ${actual}`,
      provider,
      PaymentErrorCode.AMOUNT_MISMATCH,
      { expectedAmount: expected, actualAmount: actual }
    )
  }

  /**
   * Create error for currency mismatch
   */
  static currencyMismatch(
    provider: PaymentProvider,
    expected: string,
    actual: string
  ): VerificationError {
    return new VerificationError(
      `Currency mismatch: expected ${expected}, got ${actual}`,
      provider,
      PaymentErrorCode.CURRENCY_MISMATCH,
      { expectedCurrency: expected, actualCurrency: actual }
    )
  }

  /**
   * Create error for provider API failure
   */
  static providerAPIError(
    provider: PaymentProvider,
    message: string,
    isRetryable: boolean = true
  ): VerificationError {
    return new VerificationError(
      `Provider API error (${provider}): ${message}`,
      provider,
      PaymentErrorCode.PROVIDER_API_ERROR,
      {},
      isRetryable
    )
  }
}

/**
 * Error thrown when state transition is invalid
 */
export class StateTransitionError extends PaymentError {
  public readonly donationId: string
  public readonly currentStatus: DonationStatus
  public readonly attemptedStatus: DonationStatus

  constructor(
    message: string,
    donationId: string,
    currentStatus: DonationStatus,
    attemptedStatus: DonationStatus,
    metadata: Record<string, unknown> = {}
  ) {
    super(
      message,
      PaymentErrorCode.INVALID_STATE_TRANSITION,
      400,
      {
        ...metadata,
        donationId,
        currentStatus,
        attemptedStatus,
      },
      false
    )
    this.name = 'StateTransitionError'
    this.donationId = donationId
    this.currentStatus = currentStatus
    this.attemptedStatus = attemptedStatus
  }

  /**
   * Create error for invalid state transition
   */
  static invalidTransition(
    donationId: string,
    currentStatus: DonationStatus,
    attemptedStatus: DonationStatus
  ): StateTransitionError {
    return new StateTransitionError(
      `Invalid state transition from ${currentStatus} to ${attemptedStatus}`,
      donationId,
      currentStatus,
      attemptedStatus
    )
  }

  /**
   * Create error for donation not found
   */
  static donationNotFound(donationId: string): StateTransitionError {
    return new StateTransitionError(
      `Donation not found: ${donationId}`,
      donationId,
      'pending', // Default status for not found
      'pending'
    )
  }

  /**
   * Create error for already confirmed donation
   */
  static alreadyConfirmed(donationId: string): StateTransitionError {
    return new StateTransitionError(
      `Donation already confirmed: ${donationId}`,
      donationId,
      'confirmed',
      'confirmed'
    )
  }

  /**
   * Create error for already failed donation
   */
  static alreadyFailed(donationId: string): StateTransitionError {
    return new StateTransitionError(
      `Donation already failed: ${donationId}`,
      donationId,
      'failed',
      'failed'
    )
  }

  /**
   * Create error for race condition detection
   */
  static raceConditionDetected(
    donationId: string,
    currentStatus: DonationStatus
  ): PaymentError {
    return new PaymentError(
      `Race condition detected for donation ${donationId}`,
      PaymentErrorCode.RACE_CONDITION_DETECTED,
      500,
      { donationId, currentStatus, raceCondition: true },
      false
    )
  }
}

/**
 * Error thrown when transaction fails
 */
export class TransactionError extends PaymentError {
  public readonly donationId?: string

  constructor(
    message: string,
    donationId?: string,
    metadata: Record<string, unknown> = {},
    isRetryable: boolean = true
  ) {
    super(
      message,
      PaymentErrorCode.TRANSACTION_FAILED,
      500,
      { ...metadata, donationId },
      isRetryable
    )
    this.name = 'TransactionError'
    this.donationId = donationId
  }

  /**
   * Create error for database transaction failure
   */
  static transactionFailed(
    donationId: string,
    reason: string,
    isRetryable: boolean = true
  ): TransactionError {
    return new TransactionError(
      `Transaction failed for donation ${donationId}: ${reason}`,
      donationId,
      { reason },
      isRetryable
    )
  }
}

/**
 * Error thrown when rate limit is exceeded
 */
export class RateLimitError extends PaymentError {
  public readonly limit: number
  public readonly remaining: number
  public readonly reset: number

  constructor(
    limit: number,
    remaining: number,
    reset: number,
    metadata: Record<string, unknown> = {}
  ) {
    super(
      `Rate limit exceeded. Limit: ${limit}, Remaining: ${remaining}, Reset: ${new Date(reset).toISOString()}`,
      PaymentErrorCode.RATE_LIMIT_EXCEEDED,
      429,
      { ...metadata, limit, remaining, reset },
      true
    )
    this.name = 'RateLimitError'
    this.limit = limit
    this.remaining = remaining
    this.reset = reset
  }
}

/**
 * Error thrown when configuration is invalid or missing
 */
export class ConfigurationError extends PaymentError {
  constructor(
    message: string,
    code: PaymentErrorCode = PaymentErrorCode.INVALID_CONFIGURATION,
    metadata: Record<string, unknown> = {}
  ) {
    super(message, code, 500, metadata, false)
    this.name = 'ConfigurationError'
  }

  /**
   * Create error for missing credentials
   */
  static missingCredentials(
    provider: PaymentProvider,
    credentialName: string
  ): ConfigurationError {
    return new ConfigurationError(
      `Missing credentials for ${provider}: ${credentialName}`,
      PaymentErrorCode.MISSING_CREDENTIALS,
      { provider, credentialName }
    )
  }

  /**
   * Create error for invalid configuration
   */
  static invalidConfiguration(
    setting: string,
    reason: string
  ): ConfigurationError {
    return new ConfigurationError(
      `Invalid configuration for ${setting}: ${reason}`,
      PaymentErrorCode.INVALID_CONFIGURATION,
      { setting, reason }
    )
  }
}

/**
 * Helper function to determine if an error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof PaymentError) {
    return error.isRetryable
  }

  // Check for common retryable error patterns
  if (error instanceof Error) {
    const retryablePatterns = [
      'timeout',
      'ETIMEDOUT',
      'ECONNRESET',
      'ENOTFOUND',
      'ECONNREFUSED',
      'network',
      'rate limit',
    ]

    return retryablePatterns.some(pattern =>
      error.message.toLowerCase().includes(pattern.toLowerCase())
    )
  }

  return false
}

/**
 * Helper function to determine if an error is permanent
 */
export function isPermanentError(error: unknown): boolean {
  if (error instanceof PaymentError) {
    return !error.isRetryable
  }

  // Check for common permanent error patterns
  if (error instanceof Error) {
    const permanentPatterns = [
      'invalid signature',
      'invalid credentials',
      'not found',
      'unauthorized',
      'forbidden',
      'already confirmed',
      'already failed',
    ]

    return permanentPatterns.some(pattern =>
      error.message.toLowerCase().includes(pattern.toLowerCase())
    )
  }

  return false
}
