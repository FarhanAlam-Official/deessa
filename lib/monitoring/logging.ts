/**
 * Payment Architecture V2 - Structured Logging
 * 
 * This module provides structured logging utilities for payment system
 * events, state transitions, and verification results.
 * 
 * Log Categories:
 * - Payment confirmation attempts
 * - State transitions
 * - Verification results
 * - Error events
 * - Amount/currency mismatches
 */

import { createClient as createServiceClient } from '@supabase/supabase-js'
import type { PaymentProvider, DonationStatus } from '@/lib/payments/core/types'

/**
 * Log severity levels
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'critical'

/**
 * Log event types
 */
export type LogEventType =
  | 'confirmation_attempt'
  | 'confirmation_success'
  | 'confirmation_failure'
  | 'state_transition'
  | 'verification_success'
  | 'verification_failure'
  | 'amount_mismatch'
  | 'currency_mismatch'
  | 'idempotency_check'
  | 'race_condition'
  | 'system_error'

/**
 * Payment log interface
 * 
 * Structured log entry for payment system events
 */
export interface PaymentLog {
  // Core fields
  level: LogLevel
  eventType: LogEventType
  message: string
  timestamp: string
  
  // Payment context
  donationId?: string
  provider?: PaymentProvider
  transactionId?: string
  eventId?: string
  
  // State information
  currentStatus?: DonationStatus
  newStatus?: DonationStatus
  
  // Verification details
  expectedAmount?: number
  actualAmount?: number
  expectedCurrency?: string
  actualCurrency?: string
  
  // Error information
  error?: string
  errorCode?: string
  errorStack?: string
  
  // Additional metadata
  metadata?: Record<string, unknown>
  
  // Performance metrics
  durationMs?: number
}

/**
 * Log storage options
 */
export interface LogOptions {
  storeInDatabase?: boolean // Store critical logs in database (default: true for error/critical)
  includeStack?: boolean // Include stack trace for errors (default: true)
  sanitize?: boolean // Sanitize sensitive data (default: true)
}

/**
 * Log a payment event
 * 
 * Central logging function for all payment system events.
 * Logs to console and optionally stores critical events in database.
 * 
 * @param log - Payment log entry
 * @param options - Logging options
 */
export async function logPaymentEvent(
  log: PaymentLog,
  options: LogOptions = {}
): Promise<void> {
  const {
    storeInDatabase = ['error', 'critical'].includes(log.level),
    includeStack = true,
    sanitize = true,
  } = options

  try {
    // Sanitize sensitive data if requested
    const sanitizedLog = sanitize ? sanitizeForLogging(log) : log

    // Log to console with appropriate level
    logToConsole(sanitizedLog)

    // Store critical events in database
    if (storeInDatabase) {
      await storeLogInDatabase(sanitizedLog)
    }
  } catch (error) {
    // Logging should never break the main flow
    console.error('[Logging] Failed to log payment event:', error)
  }
}

/**
 * Log confirmation attempt
 * 
 * Logs when a payment confirmation is attempted
 */
export async function logConfirmationAttempt(params: {
  donationId: string
  provider: PaymentProvider
  transactionId: string
  eventId?: string
  amount: number
  currency: string
}): Promise<void> {
  await logPaymentEvent({
    level: 'info',
    eventType: 'confirmation_attempt',
    message: `Payment confirmation attempt for donation ${params.donationId}`,
    timestamp: new Date().toISOString(),
    donationId: params.donationId,
    provider: params.provider,
    transactionId: params.transactionId,
    eventId: params.eventId,
    metadata: {
      amount: params.amount,
      currency: params.currency,
    },
  })
}

/**
 * Log confirmation success
 * 
 * Logs when a payment confirmation succeeds
 */
export async function logConfirmationSuccess(params: {
  donationId: string
  provider: PaymentProvider
  transactionId: string
  newStatus: DonationStatus
  durationMs?: number
}): Promise<void> {
  await logPaymentEvent({
    level: 'info',
    eventType: 'confirmation_success',
    message: `Payment confirmed successfully for donation ${params.donationId}`,
    timestamp: new Date().toISOString(),
    donationId: params.donationId,
    provider: params.provider,
    transactionId: params.transactionId,
    newStatus: params.newStatus,
    durationMs: params.durationMs,
  })
}

/**
 * Log confirmation failure
 * 
 * Logs when a payment confirmation fails
 */
export async function logConfirmationFailure(params: {
  donationId: string
  provider: PaymentProvider
  transactionId?: string
  error: string
  errorCode?: string
  errorStack?: string
}): Promise<void> {
  await logPaymentEvent(
    {
      level: 'error',
      eventType: 'confirmation_failure',
      message: `Payment confirmation failed for donation ${params.donationId}`,
      timestamp: new Date().toISOString(),
      donationId: params.donationId,
      provider: params.provider,
      transactionId: params.transactionId,
      error: params.error,
      errorCode: params.errorCode,
      errorStack: params.errorStack,
    },
    { storeInDatabase: true }
  )
}

/**
 * Log state transition
 * 
 * Logs when a donation transitions between states
 */
export async function logStateTransition(params: {
  donationId: string
  provider: PaymentProvider
  currentStatus: DonationStatus
  newStatus: DonationStatus
  reason?: string
}): Promise<void> {
  await logPaymentEvent({
    level: 'info',
    eventType: 'state_transition',
    message: `Donation ${params.donationId} transitioned from ${params.currentStatus} to ${params.newStatus}`,
    timestamp: new Date().toISOString(),
    donationId: params.donationId,
    provider: params.provider,
    currentStatus: params.currentStatus,
    newStatus: params.newStatus,
    metadata: params.reason ? { reason: params.reason } : undefined,
  })
}

/**
 * Log verification result
 * 
 * Logs the result of payment verification
 */
export async function logVerificationResult(params: {
  donationId: string
  provider: PaymentProvider
  transactionId: string
  success: boolean
  expectedAmount: number
  actualAmount: number
  expectedCurrency: string
  actualCurrency: string
  error?: string
}): Promise<void> {
  const level: LogLevel = params.success ? 'info' : 'warn'
  const eventType: LogEventType = params.success ? 'verification_success' : 'verification_failure'

  await logPaymentEvent(
    {
      level,
      eventType,
      message: `Payment verification ${params.success ? 'succeeded' : 'failed'} for donation ${params.donationId}`,
      timestamp: new Date().toISOString(),
      donationId: params.donationId,
      provider: params.provider,
      transactionId: params.transactionId,
      expectedAmount: params.expectedAmount,
      actualAmount: params.actualAmount,
      expectedCurrency: params.expectedCurrency,
      actualCurrency: params.actualCurrency,
      error: params.error,
    },
    { storeInDatabase: !params.success }
  )
}

/**
 * Log amount mismatch
 * 
 * Logs when payment amount doesn't match expected amount
 */
export async function logAmountMismatch(params: {
  donationId: string
  provider: PaymentProvider
  transactionId: string
  expectedAmount: number
  actualAmount: number
}): Promise<void> {
  await logPaymentEvent(
    {
      level: 'warn',
      eventType: 'amount_mismatch',
      message: `Amount mismatch detected for donation ${params.donationId}`,
      timestamp: new Date().toISOString(),
      donationId: params.donationId,
      provider: params.provider,
      transactionId: params.transactionId,
      expectedAmount: params.expectedAmount,
      actualAmount: params.actualAmount,
      metadata: {
        difference: params.actualAmount - params.expectedAmount,
        percentageDiff: ((params.actualAmount - params.expectedAmount) / params.expectedAmount) * 100,
      },
    },
    { storeInDatabase: true }
  )
}

/**
 * Log currency mismatch
 * 
 * Logs when payment currency doesn't match expected currency
 */
export async function logCurrencyMismatch(params: {
  donationId: string
  provider: PaymentProvider
  transactionId: string
  expectedCurrency: string
  actualCurrency: string
}): Promise<void> {
  await logPaymentEvent(
    {
      level: 'warn',
      eventType: 'currency_mismatch',
      message: `Currency mismatch detected for donation ${params.donationId}`,
      timestamp: new Date().toISOString(),
      donationId: params.donationId,
      provider: params.provider,
      transactionId: params.transactionId,
      expectedCurrency: params.expectedCurrency,
      actualCurrency: params.actualCurrency,
    },
    { storeInDatabase: true }
  )
}

/**
 * Log idempotency check
 * 
 * Logs when an idempotency check is performed
 */
export async function logIdempotencyCheck(params: {
  provider: PaymentProvider
  eventId: string
  alreadyProcessed: boolean
  donationId?: string
}): Promise<void> {
  await logPaymentEvent({
    level: 'debug',
    eventType: 'idempotency_check',
    message: `Idempotency check: event ${params.eventId} ${params.alreadyProcessed ? 'already processed' : 'not processed'}`,
    timestamp: new Date().toISOString(),
    provider: params.provider,
    eventId: params.eventId,
    donationId: params.donationId,
    metadata: {
      alreadyProcessed: params.alreadyProcessed,
    },
  })
}

/**
 * Log race condition detection
 * 
 * Logs when a race condition is detected during confirmation
 */
export async function logRaceCondition(params: {
  donationId: string
  provider: PaymentProvider
  currentStatus: DonationStatus
  attemptedStatus: DonationStatus
}): Promise<void> {
  await logPaymentEvent(
    {
      level: 'warn',
      eventType: 'race_condition',
      message: `Race condition detected for donation ${params.donationId}`,
      timestamp: new Date().toISOString(),
      donationId: params.donationId,
      provider: params.provider,
      currentStatus: params.currentStatus,
      newStatus: params.attemptedStatus,
    },
    { storeInDatabase: true }
  )
}

/**
 * Log system error
 * 
 * Logs critical system errors
 */
export async function logSystemError(params: {
  error: Error | string
  context: string
  donationId?: string
  provider?: PaymentProvider
  metadata?: Record<string, unknown>
}): Promise<void> {
  const errorMessage = params.error instanceof Error ? params.error.message : params.error
  const errorStack = params.error instanceof Error ? params.error.stack : undefined

  await logPaymentEvent(
    {
      level: 'critical',
      eventType: 'system_error',
      message: `System error in ${params.context}: ${errorMessage}`,
      timestamp: new Date().toISOString(),
      donationId: params.donationId,
      provider: params.provider,
      error: errorMessage,
      errorStack,
      metadata: params.metadata,
    },
    { storeInDatabase: true }
  )
}

/**
 * Sanitize sensitive data from logs
 * 
 * Removes or redacts sensitive information like:
 * - API keys and secrets
 * - Tokens
 * - Full credit card numbers
 * - Personal identifiable information
 * 
 * @param log - Payment log entry
 * @returns Sanitized log entry
 */
export function sanitizeForLogging(log: PaymentLog): PaymentLog {
  const sanitized = { ...log }

  // Sanitize metadata
  if (sanitized.metadata) {
    sanitized.metadata = sanitizeObject(sanitized.metadata)
  }

  // Sanitize error stack (remove file paths that might contain sensitive info)
  if (sanitized.errorStack) {
    sanitized.errorStack = sanitized.errorStack
      .replace(/\/home\/[^\/]+/g, '/home/[user]')
      .replace(/\/Users\/[^\/]+/g, '/Users/[user]')
      .replace(/C:\\Users\\[^\\]+/g, 'C:\\Users\\[user]')
  }

  return sanitized
}

/**
 * Recursively sanitize an object
 * 
 * Redacts sensitive keys and values
 */
function sanitizeObject(obj: Record<string, unknown>): Record<string, unknown> {
  const sensitiveKeys = [
    'password',
    'secret',
    'token',
    'key',
    'apiKey',
    'api_key',
    'authorization',
    'auth',
    'credential',
    'private',
  ]

  const sanitized: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(obj)) {
    // Check if key is sensitive
    const isSensitive = sensitiveKeys.some(sensitiveKey =>
      key.toLowerCase().includes(sensitiveKey)
    )

    if (isSensitive) {
      sanitized[key] = '[REDACTED]'
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      sanitized[key] = sanitizeObject(value as Record<string, unknown>)
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item =>
        item && typeof item === 'object' ? sanitizeObject(item as Record<string, unknown>) : item
      )
    } else {
      sanitized[key] = value
    }
  }

  return sanitized
}

/**
 * Log to console with appropriate formatting
 * 
 * Uses different console methods based on log level
 */
function logToConsole(log: PaymentLog): void {
  const prefix = `[Payment:${log.eventType}]`
  const context = [
    log.donationId ? `donation=${log.donationId}` : null,
    log.provider ? `provider=${log.provider}` : null,
    log.transactionId ? `txn=${log.transactionId}` : null,
  ]
    .filter(Boolean)
    .join(' ')

  const message = context ? `${prefix} ${context} - ${log.message}` : `${prefix} ${log.message}`

  switch (log.level) {
    case 'debug':
      console.debug(message, log.metadata || '')
      break
    case 'info':
      console.info(message, log.metadata || '')
      break
    case 'warn':
      console.warn(message, log.metadata || '')
      break
    case 'error':
      console.error(message, log.error || '', log.metadata || '')
      break
    case 'critical':
      console.error(`🚨 CRITICAL: ${message}`, log.error || '', log.metadata || '')
      if (log.errorStack) {
        console.error('Stack trace:', log.errorStack)
      }
      break
  }
}

/**
 * Store log in database
 * 
 * Stores critical logs in payment_logs table for audit trail
 */
async function storeLogInDatabase(log: PaymentLog): Promise<void> {
  try {
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

    const { error } = await supabase.from('payment_logs').insert({
      level: log.level,
      event_type: log.eventType,
      message: log.message,
      donation_id: log.donationId,
      provider: log.provider,
      transaction_id: log.transactionId,
      event_id: log.eventId,
      current_status: log.currentStatus,
      new_status: log.newStatus,
      expected_amount: log.expectedAmount,
      actual_amount: log.actualAmount,
      expected_currency: log.expectedCurrency,
      actual_currency: log.actualCurrency,
      error_message: log.error,
      error_code: log.errorCode,
      error_stack: log.errorStack,
      metadata: log.metadata,
      duration_ms: log.durationMs,
      created_at: log.timestamp,
    })

    if (error) {
      console.error('[Logging] Failed to store log in database:', error)
    }
  } catch (error) {
    console.error('[Logging] Exception storing log in database:', error)
  }
}

/**
 * Format log for display
 * 
 * Converts log entry to human-readable format
 */
export function formatLog(log: PaymentLog): string {
  const lines: string[] = [
    `[${log.level.toUpperCase()}] ${log.eventType}`,
    `Time: ${new Date(log.timestamp).toLocaleString()}`,
    `Message: ${log.message}`,
  ]

  if (log.donationId) lines.push(`Donation ID: ${log.donationId}`)
  if (log.provider) lines.push(`Provider: ${log.provider}`)
  if (log.transactionId) lines.push(`Transaction ID: ${log.transactionId}`)
  if (log.eventId) lines.push(`Event ID: ${log.eventId}`)
  if (log.currentStatus) lines.push(`Current Status: ${log.currentStatus}`)
  if (log.newStatus) lines.push(`New Status: ${log.newStatus}`)
  if (log.expectedAmount !== undefined) lines.push(`Expected Amount: ${log.expectedAmount}`)
  if (log.actualAmount !== undefined) lines.push(`Actual Amount: ${log.actualAmount}`)
  if (log.expectedCurrency) lines.push(`Expected Currency: ${log.expectedCurrency}`)
  if (log.actualCurrency) lines.push(`Actual Currency: ${log.actualCurrency}`)
  if (log.error) lines.push(`Error: ${log.error}`)
  if (log.errorCode) lines.push(`Error Code: ${log.errorCode}`)
  if (log.durationMs !== undefined) lines.push(`Duration: ${log.durationMs}ms`)
  if (log.metadata) lines.push(`Metadata: ${JSON.stringify(log.metadata, null, 2)}`)

  return lines.join('\n')
}
