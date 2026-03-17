/**
 * Payment Architecture V2 - Khalti Provider Adapter
 * 
 * This adapter handles Khalti-specific payment verification and normalization.
 * Khalti is a popular payment gateway in Nepal supporting digital wallet payments.
 * 
 * Key Features:
 * - Server-side transaction lookup via Khalti API
 * - Amount conversion from paisa (minor units) to NPR (major units)
 * - Comprehensive status mapping (Completed, Pending, Refunded, Expired, etc.)
 * - Mock mode support for development
 * - Webhook signature verification (when Khalti webhook is implemented)
 */

import {
  BaseProviderAdapter,
  VerificationContext,
} from './ProviderAdapter'
import {
  VerificationResult,
  PaymentMetadata,
  NormalizedPayment,
  PaymentProvider,
  ProviderPaymentStatus,
} from '../core/types'
import {
  VerificationError,
  ConfigurationError,
} from '../core/errors'

/**
 * Khalti-specific configuration
 */
interface KhaltiConfig {
  secretKey: string
  baseUrl: string
}

/**
 * Khalti transaction status enum
 * Based on Khalti API documentation
 */
type KhaltiStatus =
  | 'Completed'
  | 'Pending'
  | 'Initiated'
  | 'Refunded'
  | 'Expired'
  | 'User canceled'
  | 'Partially Refunded'

/**
 * Khalti lookup API response structure
 */
interface KhaltiLookupResponse {
  pidx: string
  total_amount: number
  status: KhaltiStatus
  transaction_id: string | null
  fee: number
  refunded: boolean
  detail?: string
  error_key?: string
}

/**
 * Khalti webhook payload structure (for future webhook implementation)
 */
interface KhaltiWebhookPayload {
  pidx: string
  total_amount: number
  status: KhaltiStatus
  transaction_id: string | null
  purchase_order_id: string
  purchase_order_name: string
  fee: number
  refunded: boolean
}

/**
 * Khalti Provider Adapter
 * 
 * Handles verification and normalization of Khalti payment transactions.
 * Uses server-side transaction lookup for verification.
 */
export class KhaltiAdapter extends BaseProviderAdapter {
  readonly provider: PaymentProvider = 'khalti'
  private config: KhaltiConfig

  constructor(config?: Partial<KhaltiConfig>) {
    super()

    // Load configuration from environment or provided config
    const secretKey = config?.secretKey || process.env.KHALTI_SECRET_KEY
    const baseUrl = config?.baseUrl || process.env.KHALTI_BASE_URL || 'https://khalti.com/api/v2'

    if (!secretKey) {
      throw ConfigurationError.missingCredentials('khalti', 'KHALTI_SECRET_KEY')
    }

    this.config = {
      secretKey,
      baseUrl,
    }
  }

  /**
   * Verify Khalti payment transaction
   * 
   * Performs server-side transaction lookup via Khalti API.
   * In mock mode, bypasses API call and returns success.
   * 
   * @param payload - Khalti webhook payload or verification request with pidx
   * @param context - Verification context with mode
   * @returns VerificationResult with normalized payment data
   * @throws VerificationError if verification fails
   */
  async verify(
    payload: unknown,
    context?: VerificationContext
  ): Promise<VerificationResult> {
    try {
      // Extract pidx from payload
      const pidx = this.extractPidx(payload)
      if (!pidx) {
        throw VerificationError.invalidPayload(
          'khalti',
          'Missing pidx (payment identifier)'
        )
      }

      // Perform server-side transaction lookup
      const lookupResponse = await this.lookupTransactionInternal(pidx)

      // Verify and normalize the response
      return this.verifyLookupResponse(lookupResponse, payload)
    } catch (error) {
      if (error instanceof VerificationError) {
        throw error
      }

      // Wrap unexpected errors
      throw VerificationError.providerAPIError(
        'khalti',
        error instanceof Error ? error.message : 'Unknown error',
        false
      )
    }
  }

  /**
   * Lookup transaction status for reconciliation
   * 
   * Public method for reconciliation system to check transaction status.
   * Performs server-side transaction lookup via Khalti API.
   * 
   * @param pidx - Khalti payment identifier
   * @param donationId - Donation ID for error reporting
   * @returns VerificationResult with current transaction status
   * @throws VerificationError if lookup fails
   */
  async lookupTransaction(
    pidx: string,
    donationId: string
  ): Promise<VerificationResult> {
    try {
      // Perform server-side transaction lookup
      const lookupResponse = await this.lookupTransactionInternal(pidx)

      // Map Khalti status to common status
      const status = this.mapKhaltiStatus(lookupResponse.status)

      // Convert amount from paisa to NPR
      const amount = this.convertToMajorUnits(lookupResponse.total_amount, 100)

      // Build metadata
      const metadata: Record<string, unknown> = {
        pidx: lookupResponse.pidx,
        transactionId: lookupResponse.transaction_id,
        khaltiStatus: lookupResponse.status,
        fee: lookupResponse.fee,
        refunded: lookupResponse.refunded,
        lookupType: 'reconciliation',
      }

      // Determine success based on status
      const success = lookupResponse.status === 'Completed'

      return {
        success,
        donationId,
        transactionId: lookupResponse.pidx,
        amount,
        currency: 'NPR',
        status,
        metadata,
        error: success ? undefined : this.getStatusErrorMessage(lookupResponse.status),
      }
    } catch (error) {
      if (error instanceof VerificationError) {
        throw error
      }

      throw VerificationError.providerAPIError(
        'khalti',
        `Failed to lookup transaction: ${error instanceof Error ? error.message : 'Unknown error'}`,
        true
      )
    }
  }

  /**
   * Perform server-side transaction lookup via Khalti API
   * 
   * @param pidx - Khalti payment identifier
   * @returns Khalti lookup response
   * @throws VerificationError if API call fails
   */
  private async lookupTransactionInternal(pidx: string): Promise<KhaltiLookupResponse> {
    const url = `${this.config.baseUrl}/epayment/lookup/`

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Key ${this.config.secretKey}`,
        },
        body: JSON.stringify({ pidx }),
        signal: AbortSignal.timeout(30000), // 30 second timeout
      })

      const responseText = await response.text()
      let data: KhaltiLookupResponse

      try {
        data = JSON.parse(responseText)
      } catch {
        throw VerificationError.providerAPIError(
          'khalti',
          'Invalid JSON response from Khalti API',
          true
        )
      }

      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 401) {
          throw ConfigurationError.missingCredentials(
            'khalti',
            'KHALTI_SECRET_KEY (authentication failed)'
          )
        }

        if (response.status === 404 || data.error_key === 'validation_error') {
          throw VerificationError.invalidPayload(
            'khalti',
            data.detail || 'Transaction not found in Khalti system'
          )
        }

        throw VerificationError.providerAPIError(
          'khalti',
          data.detail || `Khalti API error: ${response.status}`,
          true
        )
      }

      return data
    } catch (error) {
      if (error instanceof VerificationError || error instanceof ConfigurationError) {
        throw error
      }

      // Network or timeout errors
      throw VerificationError.providerAPIError(
        'khalti',
        `Failed to connect to Khalti API: ${error instanceof Error ? error.message : 'Unknown error'}`,
        true
      )
    }
  }

  /**
   * Verify Khalti lookup response and create verification result
   * 
   * @param lookupResponse - Response from Khalti lookup API
   * @param originalPayload - Original payload for metadata
   * @returns VerificationResult
   */
  private verifyLookupResponse(
    lookupResponse: KhaltiLookupResponse,
    originalPayload: unknown
  ): VerificationResult {
    // Extract donation ID from purchase_order_id
    const donationId = this.extractDonationId(originalPayload)
    if (!donationId) {
      throw VerificationError.invalidPayload(
        'khalti',
        'Missing donation ID (purchase_order_id)'
      )
    }

    // Map Khalti status to common status
    const status = this.mapKhaltiStatus(lookupResponse.status)

    // Convert amount from paisa to NPR
    const amount = this.convertToMajorUnits(lookupResponse.total_amount, 100)

    // Build metadata
    const metadata: Record<string, unknown> = {
      pidx: lookupResponse.pidx,
      transactionId: lookupResponse.transaction_id,
      khaltiStatus: lookupResponse.status,
      fee: lookupResponse.fee,
      refunded: lookupResponse.refunded,
    }

    // Determine success based on status
    const success = lookupResponse.status === 'Completed'

    return {
      success,
      donationId,
      transactionId: lookupResponse.pidx,
      amount,
      currency: 'NPR',
      status,
      metadata,
      error: success ? undefined : this.getStatusErrorMessage(lookupResponse.status),
    }
  }


  /**
   * Extract metadata from Khalti payload
   * 
   * @param payload - Khalti webhook or verification payload
   * @returns PaymentMetadata with extracted information
   */
  extractMetadata(payload: unknown): PaymentMetadata {
    const payloadObj = payload as Record<string, unknown>

    const pidx = this.extractPidx(payload)
    const transactionId = this.extractString(payloadObj, 'transaction_id', pidx || '')

    return {
      provider: 'khalti',
      transactionId: transactionId || pidx || '',
      eventId: pidx ?? undefined, // Use pidx as event ID for idempotency
      timestamp: new Date(),
      rawPayload: payload,
    }
  }

  /**
   * Normalize Khalti payload to common format
   * 
   * @param payload - Khalti webhook or lookup response
   * @returns NormalizedPayment with standardized structure
   */
  normalizePayload(payload: unknown): NormalizedPayment {
    const payloadObj = payload as Record<string, unknown>

    const pidx = this.extractPidx(payload)
    const donationId = this.extractDonationId(payload)

    if (!pidx || !donationId) {
      throw VerificationError.invalidPayload(
        'khalti',
        'Missing required fields for normalization'
      )
    }

    // Extract amount (in paisa) and convert to NPR
    const totalAmountPaisa = this.extractNumber(payloadObj, 'total_amount', 0)
    const amount = this.convertToMajorUnits(totalAmountPaisa, 100)

    // Extract and map status
    const khaltiStatus = this.extractString(payloadObj, 'status', 'Pending') as KhaltiStatus
    const status = this.mapKhaltiStatus(khaltiStatus)

    // Extract transaction ID
    const transactionId = this.extractString(payloadObj, 'transaction_id', pidx)

    return {
      donationId,
      amount,
      currency: 'NPR',
      status,
      transactionId: pidx,
      eventId: pidx,
      metadata: {
        pidx,
        khaltiTransactionId: transactionId,
        khaltiStatus,
        fee: this.extractNumber(payloadObj, 'fee', 0),
        refunded: payloadObj.refunded === true,
      },
    }
  }

  /**
   * Extract pidx from payload
   * 
   * @param payload - Khalti payload
   * @returns pidx or null
   */
  private extractPidx(payload: unknown): string | null {
    if (!payload || typeof payload !== 'object') {
      return null
    }

    const payloadObj = payload as Record<string, unknown>
    const pidx = payloadObj.pidx

    return typeof pidx === 'string' && pidx.trim().length > 0 ? pidx : null
  }

  /**
   * Extract donation ID from payload
   * 
   * Khalti uses purchase_order_id to store the donation ID
   * 
   * @param payload - Khalti payload
   * @returns donation ID or null
   */
  private extractDonationId(payload: unknown): string | null {
    if (!payload || typeof payload !== 'object') {
      return null
    }

    const payloadObj = payload as Record<string, unknown>
    
    // Try purchase_order_id first (standard Khalti field)
    const purchaseOrderId = payloadObj.purchase_order_id
    if (typeof purchaseOrderId === 'string' && purchaseOrderId.trim().length > 0) {
      return purchaseOrderId
    }

    // Fallback to donation_id if provided directly
    const donationId = payloadObj.donation_id || payloadObj.donationId
    if (typeof donationId === 'string' && donationId.trim().length > 0) {
      return donationId
    }

    return null
  }

  /**
   * Map Khalti status to common status enum
   * 
   * @param khaltiStatus - Khalti transaction status
   * @returns Common provider payment status
   */
  private mapKhaltiStatus(khaltiStatus: KhaltiStatus): ProviderPaymentStatus {
    switch (khaltiStatus) {
      case 'Completed':
        return 'paid'
      
      case 'Pending':
      case 'Initiated':
        return 'pending'
      
      case 'Refunded':
      case 'Partially Refunded':
      case 'Expired':
      case 'User canceled':
        return 'failed'
      
      default:
        // Unknown status - treat as pending for safety
        return 'pending'
    }
  }

  /**
   * Get error message for non-completed status
   * 
   * @param status - Khalti status
   * @returns Error message
   */
  private getStatusErrorMessage(status: KhaltiStatus): string {
    switch (status) {
      case 'Pending':
      case 'Initiated':
        return 'Payment is still pending'
      
      case 'Refunded':
      case 'Partially Refunded':
        return 'Payment was refunded'
      
      case 'Expired':
        return 'Payment expired'
      
      case 'User canceled':
        return 'Payment was canceled by user'
      
      default:
        return `Payment status: ${status}`
    }
  }

}

/**
 * Factory function to create KhaltiAdapter instance
 * 
 * @param config - Optional Khalti configuration
 * @returns KhaltiAdapter instance
 */
export function createKhaltiAdapter(config?: Partial<KhaltiConfig>): KhaltiAdapter {
  return new KhaltiAdapter(config)
}
