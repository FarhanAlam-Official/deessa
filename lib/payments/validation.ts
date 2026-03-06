/**
 * Payment System Configuration Validation
 * 
 * This module provides startup validation for the payment system to ensure
 * all required configuration is present and valid before processing transactions.
 * 
 * Requirements: 20.1, 20.2, 20.3, 20.4
 */

import { createClient } from '@/lib/supabase/server'
import { getPaymentMode, type PaymentProvider } from './config'

export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
}

export interface ValidationError {
  code: string
  message: string
  severity: 'critical' | 'error'
}

export interface ValidationWarning {
  code: string
  message: string
}

/**
 * Validate all payment system configuration at startup
 * 
 * This function should be called during application initialization to ensure
 * the system is properly configured before accepting payment requests.
 * 
 * @throws Error if critical validation fails
 * @returns ValidationResult with any errors or warnings
 */
export async function validatePaymentConfiguration(): Promise<ValidationResult> {
  const errors: ValidationError[] = []
  const warnings: ValidationWarning[] = []

  // 1. Validate environment variables
  const envErrors = validateEnvironmentVariables()
  errors.push(...envErrors)

  // 2. Validate payment mode in production
  const modeErrors = validatePaymentMode()
  errors.push(...modeErrors)

  // 3. Validate database schema
  try {
    const schemaErrors = await validateDatabaseSchema()
    errors.push(...schemaErrors)
  } catch (error) {
    errors.push({
      code: 'DB_CONNECTION_FAILED',
      message: `Failed to connect to database: ${error instanceof Error ? error.message : 'Unknown error'}`,
      severity: 'critical'
    })
  }

  // 4. Validate provider credentials (non-blocking)
  try {
    const credentialWarnings = await validateProviderCredentials()
    warnings.push(...credentialWarnings)
  } catch (error) {
    warnings.push({
      code: 'PROVIDER_VALIDATION_FAILED',
      message: `Failed to validate provider credentials: ${error instanceof Error ? error.message : 'Unknown error'}`
    })
  }

  const result: ValidationResult = {
    valid: errors.length === 0,
    errors,
    warnings
  }

  // Log validation results
  if (errors.length > 0) {
    console.error('❌ Payment configuration validation failed:')
    errors.forEach(err => {
      console.error(`  [${err.severity.toUpperCase()}] ${err.code}: ${err.message}`)
    })
  }

  if (warnings.length > 0) {
    console.warn('⚠️  Payment configuration warnings:')
    warnings.forEach(warn => {
      console.warn(`  [WARNING] ${warn.code}: ${warn.message}`)
    })
  }

  if (errors.length === 0 && warnings.length === 0) {
    console.log('✅ Payment configuration validation passed')
  }

  return result
}

/**
 * Validate required environment variables
 * 
 * Requirements: 20.1
 */
function validateEnvironmentVariables(): ValidationError[] {
  const errors: ValidationError[] = []

  // Core required variables
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'NEXT_PUBLIC_SITE_URL'
  ]

  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      errors.push({
        code: 'MISSING_ENV_VAR',
        message: `Required environment variable ${varName} is not set`,
        severity: 'critical'
      })
    }
  }

  // Payment mode specific validation
  const paymentMode = process.env.PAYMENT_MODE
  if (!paymentMode) {
    errors.push({
      code: 'MISSING_PAYMENT_MODE',
      message: 'PAYMENT_MODE environment variable is not set. Must be "live" or "mock"',
      severity: 'critical'
    })
  } else if (paymentMode !== 'live' && paymentMode !== 'mock') {
    errors.push({
      code: 'INVALID_PAYMENT_MODE',
      message: `PAYMENT_MODE must be "live" or "mock", got "${paymentMode}"`,
      severity: 'critical'
    })
  }

  // Validate provider-specific variables in live mode
  if (paymentMode === 'live') {
    // Stripe
    if (process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_WEBHOOK_SECRET) {
      errors.push({
        code: 'MISSING_STRIPE_WEBHOOK_SECRET',
        message: 'STRIPE_WEBHOOK_SECRET is required when STRIPE_SECRET_KEY is set in live mode',
        severity: 'error'
      })
    }

    // Khalti
    if (process.env.KHALTI_SECRET_KEY && !process.env.KHALTI_BASE_URL) {
      errors.push({
        code: 'MISSING_KHALTI_BASE_URL',
        message: 'KHALTI_BASE_URL is required when KHALTI_SECRET_KEY is set',
        severity: 'error'
      })
    }

    // eSewa
    if (process.env.ESEWA_MERCHANT_ID && !process.env.ESEWA_SECRET_KEY) {
      errors.push({
        code: 'MISSING_ESEWA_SECRET_KEY',
        message: 'ESEWA_SECRET_KEY is required when ESEWA_MERCHANT_ID is set in live mode',
        severity: 'error'
      })
    }

    if (process.env.ESEWA_MERCHANT_ID && !process.env.ESEWA_BASE_URL) {
      errors.push({
        code: 'MISSING_ESEWA_BASE_URL',
        message: 'ESEWA_BASE_URL is required when ESEWA_MERCHANT_ID is set',
        severity: 'error'
      })
    }
  }

  // Receipt security
  if (!process.env.RECEIPT_TOKEN_SECRET) {
    errors.push({
      code: 'MISSING_RECEIPT_TOKEN_SECRET',
      message: 'RECEIPT_TOKEN_SECRET is required for secure receipt access. Generate with: openssl rand -base64 32',
      severity: 'error'
    })
  }

  // Email configuration (optional but recommended)
  if (!process.env.GOOGLE_EMAIL || !process.env.GOOGLE_APP_PASSWORD) {
    // This is a warning, not an error, as receipts can still be generated
    // The warning will be added in validateProviderCredentials
  }

  return errors
}

/**
 * Validate payment mode configuration in production
 * 
 * Requirements: 20.2
 */
function validatePaymentMode(): ValidationError[] {
  const errors: ValidationError[] = []

  const nodeEnv = process.env.NODE_ENV
  const paymentMode = process.env.PAYMENT_MODE

  // Critical: Never allow mock mode in production
  if (nodeEnv === 'production' && paymentMode !== 'live') {
    errors.push({
      code: 'MOCK_MODE_IN_PRODUCTION',
      message: 'PAYMENT_MODE must be "live" in production environment. Mock mode is not allowed in production to prevent security vulnerabilities.',
      severity: 'critical'
    })
  }

  return errors
}

/**
 * Validate database schema and required tables
 * 
 * Requirements: 20.3, 16.5
 */
async function validateDatabaseSchema(): Promise<ValidationError[]> {
  const errors: ValidationError[] = []

  try {
    const supabase = await createClient()

    // Check if payment_events table exists
    const { error: eventsError } = await supabase
      .from('payment_events')
      .select('id')
      .limit(1)

    if (eventsError) {
      errors.push({
        code: 'PAYMENT_EVENTS_TABLE_MISSING',
        message: 'payment_events table does not exist or is not accessible. This table is required for idempotency. Run migration scripts to create it.',
        severity: 'critical'
      })
    }

    // Check if donations table exists
    const { error: donationsError } = await supabase
      .from('donations')
      .select('id')
      .limit(1)

    if (donationsError) {
      errors.push({
        code: 'DONATIONS_TABLE_MISSING',
        message: 'donations table does not exist or is not accessible. Run migration scripts to create it.',
        severity: 'critical'
      })
    }

    // Check if receipts table exists (optional for V2)
    const { error: receiptsError } = await supabase
      .from('receipts')
      .select('id')
      .limit(1)

    if (receiptsError) {
      // This is not critical as receipts might be stored differently
      // But log it for awareness
      console.warn('⚠️  receipts table not found - receipt generation may not work as expected')
    }

    // Check if payment_jobs table exists (optional, for job queue)
    const { error: jobsError } = await supabase
      .from('payment_jobs')
      .select('id')
      .limit(1)

    if (jobsError) {
      // This is not critical for MVP (inline processing)
      console.info('ℹ️  payment_jobs table not found - using inline processing (MVP mode)')
    }

  } catch (error) {
    errors.push({
      code: 'DATABASE_VALIDATION_FAILED',
      message: `Failed to validate database schema: ${error instanceof Error ? error.message : 'Unknown error'}`,
      severity: 'critical'
    })
  }

  return errors
}

/**
 * Validate provider credentials and API connectivity
 * 
 * Requirements: 20.4
 * 
 * Note: This performs non-blocking validation and returns warnings instead of errors
 * to avoid blocking startup if provider APIs are temporarily unavailable.
 */
async function validateProviderCredentials(): Promise<ValidationWarning[]> {
  const warnings: ValidationWarning[] = []
  const paymentMode = getPaymentMode()

  // Skip provider validation in mock mode
  if (paymentMode === 'mock') {
    warnings.push({
      code: 'MOCK_MODE_ACTIVE',
      message: 'Payment system is running in MOCK mode. Provider credentials are not validated.'
    })
    return warnings
  }

  // Validate Stripe
  if (process.env.STRIPE_SECRET_KEY) {
    try {
      await validateStripeCredentials()
    } catch (error) {
      warnings.push({
        code: 'STRIPE_VALIDATION_FAILED',
        message: `Stripe API validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      })
    }
  }

  // Validate Khalti
  if (process.env.KHALTI_SECRET_KEY) {
    try {
      await validateKhaltiCredentials()
    } catch (error) {
      warnings.push({
        code: 'KHALTI_VALIDATION_FAILED',
        message: `Khalti API validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      })
    }
  }

  // Validate eSewa
  if (process.env.ESEWA_MERCHANT_ID) {
    try {
      await validateEsewaCredentials()
    } catch (error) {
      warnings.push({
        code: 'ESEWA_VALIDATION_FAILED',
        message: `eSewa configuration validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      })
    }
  }

  // Check email configuration
  if (!process.env.GOOGLE_EMAIL || !process.env.GOOGLE_APP_PASSWORD) {
    warnings.push({
      code: 'EMAIL_NOT_CONFIGURED',
      message: 'Email configuration (GOOGLE_EMAIL, GOOGLE_APP_PASSWORD) is not set. Receipt emails will not be sent.'
    })
  }

  return warnings
}

/**
 * Validate Stripe API credentials
 */
async function validateStripeCredentials(): Promise<void> {
  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
  
  try {
    // Simple API call to verify credentials
    await stripe.balance.retrieve()
  } catch (error: any) {
    if (error.type === 'StripeAuthenticationError') {
      throw new Error('Invalid Stripe API key')
    }
    throw error
  }
}

/**
 * Validate Khalti API credentials
 */
async function validateKhaltiCredentials(): Promise<void> {
  const baseUrl = process.env.KHALTI_BASE_URL
  const secretKey = process.env.KHALTI_SECRET_KEY

  if (!baseUrl || !secretKey) {
    throw new Error('Khalti credentials not configured')
  }

  // Note: Khalti doesn't have a simple "test credentials" endpoint
  // We just verify the configuration is present
  // Actual validation happens on first transaction
  if (!baseUrl.startsWith('http')) {
    throw new Error('KHALTI_BASE_URL must be a valid URL')
  }
}

/**
 * Validate eSewa configuration
 */
async function validateEsewaCredentials(): Promise<void> {
  const merchantId = process.env.ESEWA_MERCHANT_ID
  const secretKey = process.env.ESEWA_SECRET_KEY
  const baseUrl = process.env.ESEWA_BASE_URL

  if (!merchantId || !secretKey || !baseUrl) {
    throw new Error('eSewa credentials not fully configured')
  }

  // Validate base URL format
  if (!baseUrl.startsWith('http')) {
    throw new Error('ESEWA_BASE_URL must be a valid URL')
  }

  // Note: eSewa doesn't have a simple "test credentials" endpoint
  // We just verify the configuration is present
  // Actual validation happens on first transaction
}

/**
 * Validate configuration and throw if critical errors exist
 * 
 * This is a convenience function for use in startup scripts or middleware
 * that should fail fast if configuration is invalid.
 */
export async function validateOrThrow(): Promise<void> {
  const result = await validatePaymentConfiguration()
  
  if (!result.valid) {
    const criticalErrors = result.errors.filter(e => e.severity === 'critical')
    if (criticalErrors.length > 0) {
      throw new Error(
        `Payment configuration validation failed with ${criticalErrors.length} critical error(s):\n` +
        criticalErrors.map(e => `  - ${e.code}: ${e.message}`).join('\n')
      )
    }
  }
}
