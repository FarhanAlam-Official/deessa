/**
 * Payment Architecture V2 - Provider Adapter Interface
 * 
 * This file defines the ProviderAdapter interface that all payment provider
 * implementations must follow. The adapter pattern isolates provider-specific
 * logic and provides a consistent interface for payment verification.
 * 
 * Key Principles:
 * - Adapters perform ONLY verification and normalization
 * - Adapters MUST NOT mutate database state
 * - Adapters MUST return normalized data structures
 * - All provider-specific logic is encapsulated in the adapter
 */

import {
  VerificationResult,
  PaymentMetadata,
  NormalizedPayment,
  PaymentProvider,
} from '../core/types'

/**
 * Provider Adapter Interface
 * 
 * All payment provider implementations must implement this interface.
 * The adapter is responsible for:
 * 1. Verifying payment authenticity (signature, server-side lookup)
 * 2. Extracting metadata from provider payloads
 * 3. Normalizing provider-specific data to common format
 * 
 * IMPORTANT: Adapters must be stateless and side-effect free.
 * They should NOT:
 * - Update database records
 * - Send emails or notifications
 * - Enqueue jobs
 * - Make state transitions
 * 
 * All state changes are handled by PaymentService.
 */
export interface ProviderAdapter {
  /**
   * The provider this adapter handles
   */
  readonly provider: PaymentProvider

  /**
   * Verify payment authenticity from webhook/callback
   * 
   * This method performs all necessary verification steps:
   * - Signature verification (Stripe, eSewa)
   * - Server-side transaction lookup (Khalti, eSewa)
   * - Amount and currency validation
   * - Status checking
   * 
   * @param payload - Raw provider payload (webhook event, callback data)
   * @param context - Additional context (headers, query params, etc.)
   * @returns VerificationResult with normalized payment data
   * @throws VerificationError if verification fails
   * 
   * @example
   * ```typescript
   * const result = await adapter.verify(stripeEvent, {
   *   signature: req.headers['stripe-signature']
   * })
   * ```
   */
  verify(
    payload: unknown,
    context?: VerificationContext
  ): Promise<VerificationResult>

  /**
   * Extract metadata from provider payload
   * 
   * This method extracts provider-specific metadata for audit logging
   * and debugging. It should include:
   * - Transaction ID
   * - Event ID (for idempotency)
   * - Timestamp
   * - Raw payload (for debugging)
   * 
   * @param payload - Raw provider payload
   * @returns PaymentMetadata with extracted information
   * 
   * @example
   * ```typescript
   * const metadata = adapter.extractMetadata(stripeEvent)
   * // { provider: 'stripe', transactionId: 'pi_123', eventId: 'evt_123', ... }
   * ```
   */
  extractMetadata(payload: unknown): PaymentMetadata

  /**
   * Normalize provider-specific payload to common format
   * 
   * This method converts provider-specific data structures to the
   * common NormalizedPayment format used throughout the system.
   * 
   * Normalization includes:
   * - Converting amount to major currency units (e.g., paisa to NPR)
   * - Mapping provider status to common status enum
   * - Extracting donation ID from provider reference
   * - Standardizing field names
   * 
   * @param payload - Raw provider payload
   * @returns NormalizedPayment with standardized structure
   * 
   * @example
   * ```typescript
   * const normalized = adapter.normalizePayload(stripeSession)
   * // { donationId: '123', amount: 100, currency: 'USD', status: 'paid', ... }
   * ```
   */
  normalizePayload(payload: unknown): NormalizedPayment
}

/**
 * Context provided to verify() method
 * 
 * Contains additional information needed for verification that isn't
 * in the payload itself (e.g., HTTP headers, query parameters)
 */
export interface VerificationContext {
  /**
   * HTTP headers from the request
   * Used for signature verification (Stripe-Signature, etc.)
   */
  headers?: Record<string, string | string[] | undefined>

  /**
   * Query parameters from the request
   * Used for eSewa callbacks
   */
  query?: Record<string, string | string[] | undefined>

  /**
   * Request body as raw string
   * Used for signature verification
   */
  rawBody?: string

  /**
   * Payment mode (live or mock)
   * Used to determine verification strictness
   */
  mode?: 'live' | 'mock'

  /**
   * Additional context data
   */
  [key: string]: unknown
}

/**
 * Base class for provider adapters
 * 
 * Provides common functionality and helper methods for concrete adapters.
 * Concrete adapters should extend this class and implement the required methods.
 */
export abstract class BaseProviderAdapter implements ProviderAdapter {
  abstract readonly provider: PaymentProvider

  abstract verify(
    payload: unknown,
    context?: VerificationContext
  ): Promise<VerificationResult>

  abstract extractMetadata(payload: unknown): PaymentMetadata

  abstract normalizePayload(payload: unknown): NormalizedPayment

  /**
   * Helper: Validate required fields in payload
   * 
   * @throws VerificationError if required fields are missing
   */
  protected validateRequiredFields(
    payload: Record<string, unknown>,
    requiredFields: string[]
  ): void {
    const missingFields = requiredFields.filter(
      field => payload[field] === undefined || payload[field] === null
    )

    if (missingFields.length > 0) {
      throw new Error(
        `Missing required fields: ${missingFields.join(', ')}`
      )
    }
  }

  /**
   * Helper: Convert amount from minor units to major units
   * 
   * @param amountMinor - Amount in minor units (cents, paisa)
   * @param divisor - Divisor to convert to major units (default: 100)
   * @returns Amount in major units
   * 
   * @example
   * ```typescript
   * convertToMajorUnits(10000, 100) // Returns 100.00
   * ```
   */
  protected convertToMajorUnits(
    amountMinor: number,
    divisor: number = 100
  ): number {
    return Math.round((amountMinor / divisor) * 100) / 100
  }

  /**
   * Helper: Convert amount from major units to minor units
   * 
   * @param amountMajor - Amount in major units (dollars, rupees)
   * @param multiplier - Multiplier to convert to minor units (default: 100)
   * @returns Amount in minor units
   * 
   * @example
   * ```typescript
   * convertToMinorUnits(100.00, 100) // Returns 10000
   * ```
   */
  protected convertToMinorUnits(
    amountMajor: number,
    multiplier: number = 100
  ): number {
    return Math.round(amountMajor * multiplier)
  }

  /**
   * Helper: Safely extract string from unknown payload
   */
  protected extractString(
    payload: Record<string, unknown>,
    key: string,
    defaultValue: string = ''
  ): string {
    const value = payload[key]
    return typeof value === 'string' ? value : defaultValue
  }

  /**
   * Helper: Safely extract number from unknown payload
   */
  protected extractNumber(
    payload: Record<string, unknown>,
    key: string,
    defaultValue: number = 0
  ): number {
    const value = payload[key]
    return typeof value === 'number' ? value : defaultValue
  }

  /**
   * Helper: Create success verification result
   */
  protected createSuccessResult(
    donationId: string,
    transactionId: string,
    amount: number,
    currency: string,
    metadata: Record<string, unknown> = {}
  ): VerificationResult {
    return {
      success: true,
      donationId,
      transactionId,
      amount,
      currency,
      status: 'paid',
      metadata,
    }
  }

  /**
   * Helper: Create failure verification result
   */
  protected createFailureResult(
    error: string,
    metadata: Record<string, unknown> = {}
  ): VerificationResult {
    return {
      success: false,
      donationId: '',
      transactionId: '',
      amount: 0,
      currency: '',
      status: 'failed',
      metadata,
      error,
    }
  }
}

/**
 * Type guard to check if an object implements ProviderAdapter
 */
export function isProviderAdapter(obj: unknown): obj is ProviderAdapter {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'provider' in obj &&
    'verify' in obj &&
    'extractMetadata' in obj &&
    'normalizePayload' in obj &&
    typeof (obj as ProviderAdapter).verify === 'function' &&
    typeof (obj as ProviderAdapter).extractMetadata === 'function' &&
    typeof (obj as ProviderAdapter).normalizePayload === 'function'
  )
}

/**
 * Provider adapter registry
 * 
 * Allows registration and retrieval of provider adapters.
 * This enables dynamic provider selection at runtime.
 */
export class ProviderAdapterRegistry {
  private adapters: Map<PaymentProvider, ProviderAdapter> = new Map()

  /**
   * Register a provider adapter
   */
  register(adapter: ProviderAdapter): void {
    this.adapters.set(adapter.provider, adapter)
  }

  /**
   * Get adapter for a provider
   * 
   * @throws Error if adapter not found
   */
  get(provider: PaymentProvider): ProviderAdapter {
    const adapter = this.adapters.get(provider)
    if (!adapter) {
      throw new Error(`No adapter registered for provider: ${provider}`)
    }
    return adapter
  }

  /**
   * Check if adapter is registered for a provider
   */
  has(provider: PaymentProvider): boolean {
    return this.adapters.has(provider)
  }

  /**
   * Get all registered providers
   */
  getProviders(): PaymentProvider[] {
    return Array.from(this.adapters.keys())
  }
}

/**
 * Global adapter registry instance
 */
export const adapterRegistry = new ProviderAdapterRegistry()
