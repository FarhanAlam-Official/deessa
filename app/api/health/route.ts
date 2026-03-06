/**
 * Health Check Endpoint
 * 
 * Provides system health status including database connectivity,
 * payment configuration, and provider availability.
 * 
 * Requirements: Monitoring
 */

import { NextRequest, NextResponse } from 'next/server'
import { validatePaymentConfiguration } from '@/lib/payments/validation'
import { createClient } from '@/lib/supabase/server'
import { getPaymentMode } from '@/lib/payments/config'

export const dynamic = 'force-dynamic'

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  checks: {
    database: HealthCheck
    paymentConfig: HealthCheck
    providers: HealthCheck
  }
  details?: {
    errors?: string[]
    warnings?: string[]
  }
}

interface HealthCheck {
  status: 'pass' | 'warn' | 'fail'
  message: string
  responseTime?: number
}

/**
 * GET /api/health
 * 
 * Returns the current health status of the payment system
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now()
  
  const health: HealthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    checks: {
      database: await checkDatabase(),
      paymentConfig: await checkPaymentConfiguration(),
      providers: await checkProviders()
    }
  }

  // Determine overall status
  const checks = Object.values(health.checks)
  const hasFailed = checks.some(check => check.status === 'fail')
  const hasWarnings = checks.some(check => check.status === 'warn')

  if (hasFailed) {
    health.status = 'unhealthy'
  } else if (hasWarnings) {
    health.status = 'degraded'
  }

  // Add response time
  const responseTime = Date.now() - startTime

  // Return appropriate status code
  const statusCode = health.status === 'unhealthy' ? 503 : 200

  return NextResponse.json(
    {
      ...health,
      responseTime: `${responseTime}ms`
    },
    { 
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    }
  )
}

/**
 * Check database connectivity
 */
async function checkDatabase(): Promise<HealthCheck> {
  const startTime = Date.now()
  
  try {
    const supabase = await createClient()
    
    // Simple query to test connectivity
    const { error } = await supabase
      .from('donations')
      .select('id')
      .limit(1)

    const responseTime = Date.now() - startTime

    if (error) {
      return {
        status: 'fail',
        message: `Database query failed: ${error.message}`,
        responseTime
      }
    }

    return {
      status: 'pass',
      message: 'Database connection successful',
      responseTime
    }
  } catch (error) {
    const responseTime = Date.now() - startTime
    return {
      status: 'fail',
      message: `Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      responseTime
    }
  }
}

/**
 * Check payment configuration validity
 */
async function checkPaymentConfiguration(): Promise<HealthCheck> {
  const startTime = Date.now()
  
  try {
    const validation = await validatePaymentConfiguration()
    const responseTime = Date.now() - startTime

    if (!validation.valid) {
      const criticalErrors = validation.errors.filter(e => e.severity === 'critical')
      
      if (criticalErrors.length > 0) {
        return {
          status: 'fail',
          message: `Payment configuration has ${criticalErrors.length} critical error(s)`,
          responseTime
        }
      }

      return {
        status: 'warn',
        message: `Payment configuration has ${validation.errors.length} error(s)`,
        responseTime
      }
    }

    if (validation.warnings.length > 0) {
      return {
        status: 'warn',
        message: `Payment configuration has ${validation.warnings.length} warning(s)`,
        responseTime
      }
    }

    return {
      status: 'pass',
      message: 'Payment configuration valid',
      responseTime
    }
  } catch (error) {
    const responseTime = Date.now() - startTime
    return {
      status: 'fail',
      message: `Configuration validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      responseTime
    }
  }
}

/**
 * Check provider availability
 */
async function checkProviders(): Promise<HealthCheck> {
  const startTime = Date.now()
  const paymentMode = getPaymentMode()

  try {
    // In mock mode, providers are always "available"
    if (paymentMode === 'mock') {
      return {
        status: 'pass',
        message: 'Running in mock mode - provider checks skipped',
        responseTime: Date.now() - startTime
      }
    }

    const providerStatuses: string[] = []
    let hasFailures = false
    let hasWarnings = false

    // Check Stripe
    if (process.env.STRIPE_SECRET_KEY) {
      try {
        await checkStripeAvailability()
        providerStatuses.push('Stripe: available')
      } catch (error) {
        providerStatuses.push(`Stripe: unavailable (${error instanceof Error ? error.message : 'unknown'})`)
        hasWarnings = true
      }
    }

    // Check Khalti
    if (process.env.KHALTI_SECRET_KEY) {
      try {
        await checkKhaltiAvailability()
        providerStatuses.push('Khalti: available')
      } catch (error) {
        providerStatuses.push(`Khalti: unavailable (${error instanceof Error ? error.message : 'unknown'})`)
        hasWarnings = true
      }
    }

    // Check eSewa
    if (process.env.ESEWA_MERCHANT_ID) {
      try {
        await checkEsewaAvailability()
        providerStatuses.push('eSewa: configured')
      } catch (error) {
        providerStatuses.push(`eSewa: configuration issue (${error instanceof Error ? error.message : 'unknown'})`)
        hasWarnings = true
      }
    }

    const responseTime = Date.now() - startTime

    if (providerStatuses.length === 0) {
      return {
        status: 'warn',
        message: 'No payment providers configured',
        responseTime
      }
    }

    if (hasFailures) {
      return {
        status: 'fail',
        message: providerStatuses.join('; '),
        responseTime
      }
    }

    if (hasWarnings) {
      return {
        status: 'warn',
        message: providerStatuses.join('; '),
        responseTime
      }
    }

    return {
      status: 'pass',
      message: providerStatuses.join('; '),
      responseTime
    }
  } catch (error) {
    const responseTime = Date.now() - startTime
    return {
      status: 'fail',
      message: `Provider check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      responseTime
    }
  }
}

/**
 * Check Stripe API availability
 */
async function checkStripeAvailability(): Promise<void> {
  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
  
  try {
    // Quick API call with timeout
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), 5000)
    )
    
    await Promise.race([
      stripe.balance.retrieve(),
      timeoutPromise
    ])
  } catch (error: any) {
    if (error.type === 'StripeAuthenticationError') {
      throw new Error('Authentication failed')
    }
    if (error.message === 'Timeout') {
      throw new Error('API timeout')
    }
    throw new Error('API error')
  }
}

/**
 * Check Khalti API availability
 */
async function checkKhaltiAvailability(): Promise<void> {
  const baseUrl = process.env.KHALTI_BASE_URL
  
  if (!baseUrl) {
    throw new Error('Base URL not configured')
  }

  // Simple URL validation
  if (!baseUrl.startsWith('http')) {
    throw new Error('Invalid base URL')
  }

  // Note: We don't make actual API calls in health check to avoid rate limiting
  // Just verify configuration is present
}

/**
 * Check eSewa configuration
 */
async function checkEsewaAvailability(): Promise<void> {
  const merchantId = process.env.ESEWA_MERCHANT_ID
  const secretKey = process.env.ESEWA_SECRET_KEY
  const baseUrl = process.env.ESEWA_BASE_URL

  if (!merchantId || !secretKey || !baseUrl) {
    throw new Error('Incomplete configuration')
  }

  if (!baseUrl.startsWith('http')) {
    throw new Error('Invalid base URL')
  }

  // Note: We don't make actual API calls in health check
  // Just verify configuration is present
}
