/**
 * Example: Integrating Payment Configuration Validation into Next.js App
 * 
 * This file demonstrates different ways to integrate the validation system
 * into your Next.js application.
 */

import { validatePaymentConfiguration, validateOrThrow } from './validation'

/**
 * Example 1: Validate on Server Startup (Recommended for Production)
 * 
 * Add this to your server initialization code or create a custom server.
 */
export async function validateOnStartup() {
  console.log('🔍 Validating payment configuration on startup...')
  
  try {
    await validateOrThrow()
    console.log('✅ Payment system ready')
  } catch (error) {
    console.error('❌ Payment system not ready:', error)
    
    // In production, you might want to exit the process
    if (process.env.NODE_ENV === 'production') {
      console.error('Exiting due to invalid configuration in production')
      process.exit(1)
    }
  }
}

/**
 * Example 2: Validate in API Route Middleware
 * 
 * Check configuration before processing payment requests.
 */
export async function validateBeforePayment() {
  const result = await validatePaymentConfiguration()
  
  if (!result.valid) {
    const criticalErrors = result.errors.filter(e => e.severity === 'critical')
    
    if (criticalErrors.length > 0) {
      throw new Error(
        'Payment system is not properly configured. ' +
        'Please contact support.'
      )
    }
  }
  
  return result
}

/**
 * Example 3: Periodic Health Check
 * 
 * Run validation periodically to detect configuration drift.
 */
export async function periodicHealthCheck() {
  setInterval(async () => {
    const result = await validatePaymentConfiguration()
    
    if (!result.valid) {
      console.error('⚠️  Payment configuration health check failed')
      // Send alert to monitoring system
    }
  }, 5 * 60 * 1000) // Every 5 minutes
}

/**
 * Example 4: Validation in Server Action
 * 
 * Validate before processing a donation.
 */
export async function validateBeforeDonation() {
  'use server'
  
  const result = await validatePaymentConfiguration()
  
  if (!result.valid) {
    return {
      success: false,
      error: 'Payment system is temporarily unavailable. Please try again later.'
    }
  }
  
  // Proceed with donation processing
  return { success: true }
}

/**
 * Example 5: Custom Validation for Specific Provider
 * 
 * Check if a specific provider is properly configured.
 */
export async function validateProvider(provider: 'stripe' | 'khalti' | 'esewa') {
  const result = await validatePaymentConfiguration()
  
  // Check if provider-specific errors exist
  const providerErrors = result.errors.filter(err => 
    err.code.toLowerCase().includes(provider)
  )
  
  if (providerErrors.length > 0) {
    return {
      available: false,
      errors: providerErrors.map(e => e.message)
    }
  }
  
  return { available: true }
}

/**
 * Example 6: Graceful Degradation
 * 
 * Disable features if configuration is incomplete.
 */
export async function getAvailablePaymentMethods() {
  const result = await validatePaymentConfiguration()
  
  const methods = {
    stripe: true,
    khalti: true,
    esewa: true
  }
  
  // Disable methods with configuration errors
  result.errors.forEach(error => {
    if (error.code.includes('STRIPE')) methods.stripe = false
    if (error.code.includes('KHALTI')) methods.khalti = false
    if (error.code.includes('ESEWA')) methods.esewa = false
  })
  
  return methods
}

/**
 * Example 7: Admin Dashboard Integration
 * 
 * Show configuration status in admin panel.
 */
export async function getConfigurationStatus() {
  const result = await validatePaymentConfiguration()
  
  return {
    status: result.valid ? 'healthy' : 'unhealthy',
    criticalErrors: result.errors.filter(e => e.severity === 'critical').length,
    errors: result.errors.length,
    warnings: result.warnings.length,
    details: {
      errors: result.errors,
      warnings: result.warnings
    }
  }
}

/**
 * Example 8: Pre-deployment Check
 * 
 * Use in CI/CD pipeline before deployment.
 */
export async function preDeploymentCheck() {
  console.log('Running pre-deployment validation...')
  
  const result = await validatePaymentConfiguration()
  
  if (!result.valid) {
    console.error('❌ Pre-deployment validation failed')
    console.error('Errors:', result.errors)
    process.exit(1)
  }
  
  if (result.warnings.length > 0) {
    console.warn('⚠️  Warnings detected:')
    result.warnings.forEach(w => console.warn(`  - ${w.message}`))
  }
  
  console.log('✅ Pre-deployment validation passed')
}

// Usage examples:

// In your app initialization:
// await validateOnStartup()

// In a payment API route:
// await validateBeforePayment()

// In a server action:
// const result = await validateBeforeDonation()

// In admin dashboard:
// const status = await getConfigurationStatus()
