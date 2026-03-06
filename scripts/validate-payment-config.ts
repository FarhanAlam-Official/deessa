#!/usr/bin/env tsx
/**
 * Payment Configuration Validation Script
 * 
 * Run this script to validate your payment system configuration before deployment.
 * 
 * Usage:
 *   npm run validate-config
 *   or
 *   npx tsx scripts/validate-payment-config.ts
 * 
 * Exit codes:
 *   0 - All checks passed
 *   1 - Critical errors found (deployment should be blocked)
 *   2 - Warnings found (deployment can proceed with caution)
 */

import { validatePaymentConfiguration } from '../lib/payments/validation'

async function main() {
  console.log('🔍 Validating payment system configuration...\n')

  try {
    const result = await validatePaymentConfiguration()

    // Print summary
    console.log('\n' + '='.repeat(60))
    console.log('VALIDATION SUMMARY')
    console.log('='.repeat(60))

    if (result.valid) {
      console.log('✅ Status: PASSED')
    } else {
      console.log('❌ Status: FAILED')
    }

    console.log(`   Errors: ${result.errors.length}`)
    console.log(`   Warnings: ${result.warnings.length}`)
    console.log('='.repeat(60) + '\n')

    // Determine exit code
    if (result.errors.length > 0) {
      const criticalErrors = result.errors.filter(e => e.severity === 'critical')
      
      if (criticalErrors.length > 0) {
        console.error('❌ CRITICAL ERRORS FOUND - Deployment should be blocked\n')
        process.exit(1)
      } else {
        console.warn('⚠️  ERRORS FOUND - Review before deployment\n')
        process.exit(1)
      }
    }

    if (result.warnings.length > 0) {
      console.warn('⚠️  WARNINGS FOUND - Deployment can proceed with caution\n')
      process.exit(2)
    }

    console.log('✅ All checks passed - Ready for deployment\n')
    process.exit(0)

  } catch (error) {
    console.error('❌ Validation script failed:', error)
    process.exit(1)
  }
}

// Run if executed directly
if (require.main === module) {
  main()
}

export { main }
