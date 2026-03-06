/**
 * Payment Architecture V2 - eSewa Provider Adapter
 * 
 * This adapter handles eSewa-specific payment verification and normalization.
 * eSewa is a popular payment gateway in Nepal supporting digital wallet payments.
 * 
 * Key Features:
 * - HMAC-SHA256 signature verification for callbacks
 * - Server-side transaction status lookup via eSewa API
 * - Amount validation (NPR currency)
 * - Mock mode support for development (signature verification bypassed)
 * - Comprehensive error handling with typed errors
 * 
 * Security:
 * - HMAC signature verification mandatory in live mode (no bypass)
 * - Server-side transaction validation
 * - Fail-closed on verification uncertainty
 */

import crypto from 'crypto'
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
 * eSewa-specific configuration
 */
interface EsewaConfig {
  secretKey: string
  merchantId: string
  baseUrl: string
}

/**
 * eSewa transaction status enum
 * Based on eSewa v2 API documentation
 */
type EsewaStatus = 'COMPLETE' | 'PENDING' | 'FAILED' | 'CANCELED' | 'EXPIRED'

/**
 * eSewa callback payload structure
 * Sent as base64-encoded JSON in the 'data' query parameter
 */
interface EsewaCallbackPayload {
  transaction_code: string
  status: EsewaStatus
  total_amount: number
  transaction_uuid: string
  product_code: string
  signed_field_names?: string
  signature?: string
}

/**
 * eSewa transaction status API response structure
 */
interface EsewaStatusResponse {
  transaction_code: string
  status: EsewaStatus
  total_amount: number
  transaction_uuid: string
  product_code: string
  signed_field_names: string
  signature: string
}

/**
 * eSewa Provider Adapter
 * 
 * Handles verification and normalization of eSewa payment transactions.
 * Uses HMAC signature verification and server-side transaction lookup.
 */
export class EsewaAdapter extends BaseProviderAdapter {
  readonly provider: PaymentProvider = 'esewa'
  private config: EsewaConfig

  constructor(config?: Partial<EsewaConfig>) {
    super()

    // Load configuration from environment or provided config
    const secretKey = config?.secretKey || process.env.ESEWA_SECRET_KEY
    const merchantId = config?.merchantId || process.env.ESEWA_MERCHANT_ID || 'EPAYTEST'
    const baseUrl = config?.baseUrl || process.env.ESEWA_BASE_URL || 'https://rc-epay.esewa.com.np'

    if (!secretKey) {
      throw ConfigurationError.missingCredentials('esewa', 'ESEWA_SECRET_KEY')
    }

    if (!merchantId) {
      throw ConfigurationError.missingCredentials('esewa', 'ESEWA_MERCHANT_ID')
    }

    this.config = {
      secretKey,
      merchantId,
      baseUrl,
    }
  }

  /**
   * Verify eSewa payment transaction
   * 
   * Performs HMAC signature verification and server-side transaction lookup.
   * In mock mode, bypasses signature verification (development only).
   * 
   * @param payload - eSewa callback payload (base64-encoded or parsed)
   * @param context - Verification context with query params and mode
   * @returns VerificationResult with normalized payment data
   * @throws VerificationError if verification fails
   */
  async verify(
    payload: unknown,
    context?: VerificationContext
  ): Promise<VerificationResult> {
    try {
      const mode = context?.mode || this.getPaymentMode()

      // Parse the callback payload
      const callbackData = this.parseCallbackPayload(payload, context)

      // Validate required fields
      this.validateCallbackData(callbackData)

      // In mock mode, skip signature verification (development only)
      if (mode === 'mock') {
        console.warn('EsewaAdapter: Running in mock mode - signature verification bypassed')
        return this.createMockVerificationResult(callbackData)
      }

      // Live mode: Verify HMAC signature
      this.verifySignature(callbackData)

      // Perform server-side transaction status lookup
      const statusResponse = await this.lookupTransactionInternal(
        callbackData.transaction_uuid,
        callbackData.total_amount
      )

      // Verify and normalize the response
      return this.verifyStatusResponse(statusResponse, callbackData)
    } catch (error) {
      if (error instanceof VerificationError || error instanceof ConfigurationError) {
        throw error
      }

      // Wrap unexpected errors
      throw VerificationError.providerAPIError(
        'esewa',
        error instanceof Error ? error.message : 'Unknown error',
        false
      )
    }
  }

  /**
   * Lookup transaction status for reconciliation
   * 
   * Public method for reconciliation system to check transaction status.
   * Performs server-side transaction status lookup via eSewa API.
   * 
   * @param transactionUuid - eSewa transaction UUID
   * @param donationId - Donation ID for error reporting
   * @returns VerificationResult with current transaction status
   * @throws VerificationError if lookup fails
   */
  async lookupTransaction(
    transactionUuid: string,
    donationId: string
  ): Promise<VerificationResult> {
    try {
      // Perform server-side transaction status lookup (total_amount unknown for reconciliation)
      const statusResponse = await this.lookupTransactionInternal(transactionUuid)

      // Map eSewa status to common status
      const status = this.mapEsewaStatus(statusResponse.status)

      // Extract amount (already in NPR)
      const amount = parseFloat(statusResponse.total_amount.toString())

      // Build metadata
      const metadata: Record<string, unknown> = {
        transactionCode: statusResponse.transaction_code,
        transactionUuid: statusResponse.transaction_uuid,
        esewaStatus: statusResponse.status,
        productCode: statusResponse.product_code,
        lookupType: 'reconciliation',
      }

      // Determine success based on status
      const success = statusResponse.status === 'COMPLETE'

      return {
        success,
        donationId,
        transactionId: statusResponse.transaction_uuid,
        amount,
        currency: 'NPR',
        status,
        metadata,
        error: success ? undefined : this.getStatusErrorMessage(statusResponse.status),
      }
    } catch (error) {
      if (error instanceof VerificationError) {
        throw error
      }

      throw VerificationError.providerAPIError(
        'esewa',
        `Failed to lookup transaction: ${error instanceof Error ? error.message : 'Unknown error'}`,
        true
      )
    }
  }

  /**
   * Parse eSewa callback payload
   * 
   * eSewa sends data as base64-encoded JSON in the 'data' query parameter.
   * Also supports direct payload for testing.
   * 
   * @param payload - Raw payload or parsed object
   * @param context - Verification context with query params
   * @returns Parsed callback data
   * @throws VerificationError if parsing fails
   */
  private parseCallbackPayload(
    payload: unknown,
    context?: VerificationContext
  ): EsewaCallbackPayload {
    // If payload is already parsed, use it
    if (payload && typeof payload === 'object' && 'transaction_uuid' in payload) {
      return payload as EsewaCallbackPayload
    }

    // Try to extract from query parameters
    const encodedData = context?.query?.data
    if (!encodedData) {
      throw VerificationError.invalidPayload(
        'esewa',
        'Missing data parameter in callback'
      )
    }

    // Decode base64 and parse JSON
    try {
      const dataString = Array.isArray(encodedData) ? encodedData[0] : encodedData
      const decodedData = Buffer.from(dataString, 'base64').toString('utf-8')
      return JSON.parse(decodedData) as EsewaCallbackPayload
    } catch (error) {
      throw VerificationError.invalidPayload(
        'esewa',
        'Failed to decode callback data: ' + (error instanceof Error ? error.message : 'Unknown error')
      )
    }
  }

  /**
   * Validate required fields in callback data
   * 
   * @param data - Parsed callback data
   * @throws VerificationError if required fields are missing
   */
  private validateCallbackData(data: EsewaCallbackPayload): void {
    const requiredFields = ['transaction_uuid', 'status', 'total_amount']
    const missingFields = requiredFields.filter(field => !data[field as keyof EsewaCallbackPayload])

    if (missingFields.length > 0) {
      throw VerificationError.invalidPayload(
        'esewa',
        `Missing required fields: ${missingFields.join(', ')}`
      )
    }
  }

  /**
   * Verify HMAC-SHA256 signature
   * 
   * Generates expected signature and compares with provided signature.
   * Uses timing-safe comparison to prevent timing attacks.
   * 
   * @param data - Callback data with signature
   * @throws VerificationError if signature verification fails
   */
  private verifySignature(data: EsewaCallbackPayload): void {
    const { signed_field_names, signature } = data

    if (!signature || !signed_field_names) {
      throw VerificationError.signatureVerificationFailed(
        'esewa',
        'Missing signature or signed_field_names'
      )
    }

    // Parse signed field names
    const fields = signed_field_names.split(',').map(s => s.trim()).filter(Boolean)
    
    // Validate required fields are included
    const requiredFields = ['total_amount', 'transaction_uuid', 'product_code']
    const missingRequired = requiredFields.filter(field => !fields.includes(field))
    
    if (missingRequired.length > 0) {
      throw VerificationError.signatureVerificationFailed(
        'esewa',
        `Signed fields missing required fields: ${missingRequired.join(', ')}`
      )
    }

    // Generate signature message
    const message = fields
      .map(field => `${field}=${data[field as keyof EsewaCallbackPayload]}`)
      .join(',')

    // Generate expected signature
    const expectedSignature = this.generateSignature(message)

    // Timing-safe comparison
    try {
      const isValid = crypto.timingSafeEqual(
        Buffer.from(expectedSignature),
        Buffer.from(signature)
      )

      if (!isValid) {
        throw VerificationError.signatureVerificationFailed(
          'esewa',
          'Signature mismatch'
        )
      }
    } catch (error) {
      if (error instanceof VerificationError) {
        throw error
      }
      
      // Buffer length mismatch or other crypto error
      throw VerificationError.signatureVerificationFailed(
        'esewa',
        'Signature comparison failed: ' + (error instanceof Error ? error.message : 'Unknown error')
      )
    }
  }

  /**
   * Generate HMAC-SHA256 signature
   * 
   * @param message - Message to sign
   * @returns Base64-encoded signature
   */
  private generateSignature(message: string): string {
    const hmac = crypto.createHmac('sha256', this.config.secretKey)
    hmac.update(message)
    return hmac.digest('base64')
  }

  /**
   * Perform server-side transaction status lookup via eSewa API
   * 
   * @param transactionUuid - eSewa transaction UUID
   * @returns eSewa status response
   * @throws VerificationError if API call fails
   */
  private async lookupTransactionInternal(
    transactionUuid: string,
    totalAmount?: number
  ): Promise<EsewaStatusResponse> {
    // eSewa V2 status check requires GET with query parameters (POST returns 405)
    const params = new URLSearchParams({
      product_code: this.config.merchantId,
      transaction_uuid: transactionUuid,
      ...(totalAmount !== undefined ? { total_amount: String(totalAmount) } : {}),
    })
    const url = `${this.config.baseUrl}/api/epay/transaction/status/?${params.toString()}`

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(30000), // 30 second timeout
      })

      const responseText = await response.text()
      let data: EsewaStatusResponse

      try {
        data = JSON.parse(responseText)
      } catch {
        throw VerificationError.providerAPIError(
          'esewa',
          'Invalid JSON response from eSewa API',
          true
        )
      }

      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 401) {
          throw ConfigurationError.missingCredentials(
            'esewa',
            'ESEWA_SECRET_KEY or ESEWA_MERCHANT_ID (authentication failed)'
          )
        }

        if (response.status === 404) {
          throw VerificationError.invalidPayload(
            'esewa',
            'Transaction not found in eSewa system'
          )
        }

        throw VerificationError.providerAPIError(
          'esewa',
          `eSewa API error: ${response.status}`,
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
        'esewa',
        `Failed to connect to eSewa API: ${error instanceof Error ? error.message : 'Unknown error'}`,
        true
      )
    }
  }

  /**
   * Verify eSewa status response and create verification result
   * 
   * @param statusResponse - Response from eSewa status API
   * @param originalCallback - Original callback data
   * @returns VerificationResult
   */
  private verifyStatusResponse(
    statusResponse: EsewaStatusResponse,
    originalCallback: EsewaCallbackPayload
  ): VerificationResult {
    // Extract donation ID from transaction_uuid
    const donationId = this.extractDonationId(originalCallback.transaction_uuid)
    if (!donationId) {
      throw VerificationError.invalidPayload(
        'esewa',
        'Cannot extract donation ID from transaction_uuid'
      )
    }

    // Verify transaction_uuid matches
    if (statusResponse.transaction_uuid !== originalCallback.transaction_uuid) {
      throw VerificationError.invalidPayload(
        'esewa',
        'Transaction UUID mismatch between callback and status response'
      )
    }

    // Map eSewa status to common status
    const status = this.mapEsewaStatus(statusResponse.status)

    // Extract amount (already in NPR)
    const amount = parseFloat(statusResponse.total_amount.toString())

    // Build metadata
    const metadata: Record<string, unknown> = {
      transactionCode: statusResponse.transaction_code,
      transactionUuid: statusResponse.transaction_uuid,
      esewaStatus: statusResponse.status,
      productCode: statusResponse.product_code,
    }

    // Determine success based on status
    const success = statusResponse.status === 'COMPLETE'

    return {
      success,
      donationId,
      transactionId: statusResponse.transaction_uuid,
      amount,
      currency: 'NPR',
      status,
      metadata,
      error: success ? undefined : this.getStatusErrorMessage(statusResponse.status),
    }
  }

  /**
   * Create mock verification result for development
   * 
   * @param callbackData - Original callback data
   * @returns Mock verification result
   */
  private createMockVerificationResult(
    callbackData: EsewaCallbackPayload
  ): VerificationResult {
    const donationId = this.extractDonationId(callbackData.transaction_uuid)
    
    if (!donationId) {
      throw VerificationError.invalidPayload(
        'esewa',
        'Cannot extract donation ID from transaction_uuid in mock mode'
      )
    }

    const amount = parseFloat(callbackData.total_amount.toString())
    const status = this.mapEsewaStatus(callbackData.status)

    return {
      success: callbackData.status === 'COMPLETE',
      donationId,
      transactionId: callbackData.transaction_uuid,
      amount,
      currency: 'NPR',
      status,
      metadata: {
        transactionCode: callbackData.transaction_code,
        transactionUuid: callbackData.transaction_uuid,
        esewaStatus: callbackData.status,
        mock: true,
      },
      error: callbackData.status === 'COMPLETE' ? undefined : this.getStatusErrorMessage(callbackData.status),
    }
  }

  /**
   * Extract metadata from eSewa payload
   * 
   * @param payload - eSewa callback or status response
   * @returns PaymentMetadata with extracted information
   */
  extractMetadata(payload: unknown): PaymentMetadata {
    const payloadObj = payload as Record<string, unknown>

    const transactionUuid = this.extractString(payloadObj, 'transaction_uuid', '')
    const transactionCode = this.extractString(payloadObj, 'transaction_code', transactionUuid)

    return {
      provider: 'esewa',
      transactionId: transactionUuid,
      eventId: transactionCode || transactionUuid, // Use transaction_code as event ID for idempotency
      timestamp: new Date(),
      rawPayload: payload,
    }
  }

  /**
   * Normalize eSewa payload to common format
   * 
   * @param payload - eSewa callback or status response
   * @returns NormalizedPayment with standardized structure
   */
  normalizePayload(payload: unknown): NormalizedPayment {
    const payloadObj = payload as Record<string, unknown>

    const transactionUuid = this.extractString(payloadObj, 'transaction_uuid', '')
    const donationId = this.extractDonationId(transactionUuid)

    if (!donationId || !transactionUuid) {
      throw VerificationError.invalidPayload(
        'esewa',
        'Missing required fields for normalization'
      )
    }

    // Extract amount (already in NPR)
    const totalAmount = this.extractNumber(payloadObj, 'total_amount', 0)
    const amount = parseFloat(totalAmount.toString())

    // Extract and map status
    const esewaStatus = this.extractString(payloadObj, 'status', 'PENDING') as EsewaStatus
    const status = this.mapEsewaStatus(esewaStatus)

    // Extract transaction code
    const transactionCode = this.extractString(payloadObj, 'transaction_code', transactionUuid)

    return {
      donationId,
      amount,
      currency: 'NPR',
      status,
      transactionId: transactionUuid,
      eventId: transactionCode || transactionUuid,
      metadata: {
        transactionCode,
        transactionUuid,
        esewaStatus,
        productCode: this.extractString(payloadObj, 'product_code', ''),
      },
    }
  }

  /**
   * Extract donation ID from transaction_uuid
   * 
   * eSewa transaction_uuid format: {timestamp}-{donation_id}
   * 
   * @param transactionUuid - eSewa transaction UUID
   * @returns donation ID or null
   */
  private extractDonationId(transactionUuid: string): string | null {
    if (!transactionUuid || typeof transactionUuid !== 'string') {
      return null
    }

    // Format: {timestamp}-{donation_id}
    const parts = transactionUuid.split('-')
    
    if (parts.length < 2) {
      return null
    }

    // The donation ID is everything after the first hyphen
    const donationId = parts.slice(1).join('-')
    
    return donationId.trim().length > 0 ? donationId : null
  }

  /**
   * Map eSewa status to common status enum
   * 
   * @param esewaStatus - eSewa transaction status
   * @returns Common provider payment status
   */
  private mapEsewaStatus(esewaStatus: EsewaStatus): ProviderPaymentStatus {
    switch (esewaStatus) {
      case 'COMPLETE':
        return 'paid'
      
      case 'PENDING':
        return 'pending'
      
      case 'FAILED':
      case 'CANCELED':
      case 'EXPIRED':
        return 'failed'
      
      default:
        // Unknown status - treat as pending for safety
        return 'pending'
    }
  }

  /**
   * Get error message for non-complete status
   * 
   * @param status - eSewa status
   * @returns Error message
   */
  private getStatusErrorMessage(status: EsewaStatus): string {
    switch (status) {
      case 'PENDING':
        return 'Payment is still pending'
      
      case 'FAILED':
        return 'Payment failed'
      
      case 'CANCELED':
        return 'Payment was canceled by user'
      
      case 'EXPIRED':
        return 'Payment expired'
      
      default:
        return `Payment status: ${status}`
    }
  }

  /**
   * Get payment mode from environment
   */
  private getPaymentMode(): 'live' | 'mock' {
    const mode = process.env.PAYMENT_MODE
    
    // Guardrail: never allow mock mode in production
    if (process.env.NODE_ENV === 'production' && mode !== 'live') {
      throw new Error(
        'PAYMENT_MODE must be "live" in production. Refusing to run with mock mode.'
      )
    }

    return mode === 'live' ? 'live' : 'mock'
  }
}

/**
 * Factory function to create EsewaAdapter instance
 * 
 * @param config - Optional eSewa configuration
 * @returns EsewaAdapter instance
 */
export function createEsewaAdapter(config?: Partial<EsewaConfig>): EsewaAdapter {
  return new EsewaAdapter(config)
}
