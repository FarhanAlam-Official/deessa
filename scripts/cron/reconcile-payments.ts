#!/usr/bin/env tsx
/**
 * Payment Reconciliation Cron Job
 * 
 * This script reconciles stuck/pending donations by checking their status
 * with payment providers and updating the database accordingly.
 * 
 * Usage:
 *   tsx scripts/cron/reconcile-payments.ts [options]
 * 
 * Options:
 *   --max-age <minutes>    Maximum age of pending donations to check (default: 60)
 *   --limit <number>       Maximum number of donations to process (default: 100)
 *   --dry-run              Run without making changes (default: false)
 *   --help                 Show help message
 * 
 * Environment Variables:
 *   NEXT_PUBLIC_SUPABASE_URL      - Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY     - Supabase service role key
 *   PAYMENT_MODE                  - Payment mode (live or mock)
 *   STRIPE_SECRET_KEY             - Stripe secret key
 *   KHALTI_SECRET_KEY             - Khalti secret key
 *   ESEWA_SECRET_KEY              - eSewa secret key
 * 
 * Scheduling:
 *   This script should be run hourly via cron or a task scheduler.
 *   
 *   Example cron entry (runs every hour):
 *   0 * * * * cd /path/to/project && tsx scripts/cron/reconcile-payments.ts >> /var/log/reconciliation.log 2>&1
 * 
 *   For Vercel Cron (vercel.json):
 *   {
 *     "crons": [{
 *       "path": "/api/cron/reconcile-payments",
 *       "schedule": "0 * * * *"
 *     }]
 *   }
 */

import { reconcilePendingDonations } from '../../lib/payments/reconciliation'

/**
 * Parse command line arguments
 */
function parseArgs(): {
  maxAge?: number
  limit?: number
  dryRun?: boolean
  help?: boolean
} {
  const args = process.argv.slice(2)
  const options: {
    maxAge?: number
    limit?: number
    dryRun?: boolean
    help?: boolean
  } = {}

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]

    switch (arg) {
      case '--max-age':
        options.maxAge = parseInt(args[++i], 10) * 60 * 1000 // Convert minutes to ms
        break
      
      case '--limit':
        options.limit = parseInt(args[++i], 10)
        break
      
      case '--dry-run':
        options.dryRun = true
        break
      
      case '--help':
      case '-h':
        options.help = true
        break
      
      default:
        console.error(`Unknown option: ${arg}`)
        process.exit(1)
    }
  }

  return options
}

/**
 * Show help message
 */
function showHelp(): void {
  console.log(`
Payment Reconciliation Cron Job

Usage:
  tsx scripts/cron/reconcile-payments.ts [options]

Options:
  --max-age <minutes>    Maximum age of pending donations to check (default: 60)
  --limit <number>       Maximum number of donations to process (default: 100)
  --dry-run              Run without making changes (default: false)
  --help, -h             Show this help message

Environment Variables:
  NEXT_PUBLIC_SUPABASE_URL      - Supabase project URL
  SUPABASE_SERVICE_ROLE_KEY     - Supabase service role key
  PAYMENT_MODE                  - Payment mode (live or mock)
  STRIPE_SECRET_KEY             - Stripe secret key
  KHALTI_SECRET_KEY             - Khalti secret key
  ESEWA_SECRET_KEY              - eSewa secret key

Examples:
  # Run with default settings (60 minutes, 100 limit)
  tsx scripts/cron/reconcile-payments.ts

  # Check donations older than 2 hours
  tsx scripts/cron/reconcile-payments.ts --max-age 120

  # Dry run to see what would be done
  tsx scripts/cron/reconcile-payments.ts --dry-run

  # Process only 50 donations
  tsx scripts/cron/reconcile-payments.ts --limit 50

Scheduling:
  This script should be run hourly via cron or a task scheduler.
  
  Example cron entry (runs every hour):
  0 * * * * cd /path/to/project && tsx scripts/cron/reconcile-payments.ts >> /var/log/reconciliation.log 2>&1
`)
}

/**
 * Validate environment variables
 */
function validateEnvironment(): void {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
  ]

  const missing = required.filter(key => !process.env[key])

  if (missing.length > 0) {
    console.error('Error: Missing required environment variables:')
    missing.forEach(key => console.error(`  - ${key}`))
    process.exit(1)
  }

  // Warn about missing provider credentials
  const providers = [
    { name: 'Stripe', key: 'STRIPE_SECRET_KEY' },
    { name: 'Khalti', key: 'KHALTI_SECRET_KEY' },
    { name: 'eSewa', key: 'ESEWA_SECRET_KEY' },
  ]

  const missingProviders = providers.filter(p => !process.env[p.key])
  
  if (missingProviders.length > 0) {
    console.warn('Warning: Missing provider credentials (reconciliation will fail for these providers):')
    missingProviders.forEach(p => console.warn(`  - ${p.name}: ${p.key}`))
  }
}

/**
 * Main function
 */
async function main(): Promise<void> {
  const startTime = Date.now()

  // Parse arguments
  const options = parseArgs()

  // Show help if requested
  if (options.help) {
    showHelp()
    process.exit(0)
  }

  // Validate environment
  validateEnvironment()

  // Log start
  console.log('='.repeat(80))
  console.log('Payment Reconciliation Cron Job')
  console.log('='.repeat(80))
  console.log(`Started at: ${new Date().toISOString()}`)
  console.log(`Max age: ${(options.maxAge || 60 * 60 * 1000) / 1000 / 60} minutes`)
  console.log(`Limit: ${options.limit || 100} donations`)
  console.log(`Dry run: ${options.dryRun ? 'YES' : 'NO'}`)
  console.log(`Payment mode: ${process.env.PAYMENT_MODE || 'mock'}`)
  console.log('='.repeat(80))
  console.log()

  try {
    // Run reconciliation
    const summary = await reconcilePendingDonations({
      maxAge: options.maxAge,
      limit: options.limit,
      dryRun: options.dryRun,
    })

    // Log summary
    console.log()
    console.log('='.repeat(80))
    console.log('Reconciliation Summary')
    console.log('='.repeat(80))
    console.log(`Total checked: ${summary.totalChecked}`)
    console.log(`Confirmed: ${summary.confirmed}`)
    console.log(`Failed: ${summary.failed}`)
    console.log(`No change: ${summary.noChange}`)
    console.log(`Errors: ${summary.errors}`)
    console.log(`Duration: ${summary.durationMs}ms`)
    console.log('='.repeat(80))

    // Log individual results if any actions were taken
    if (summary.confirmed > 0 || summary.failed > 0 || summary.errors > 0) {
      console.log()
      console.log('Detailed Results:')
      console.log('-'.repeat(80))
      
      summary.results.forEach(result => {
        if (result.action !== 'no_change') {
          console.log(`[${result.action.toUpperCase()}] ${result.donationId}`)
          console.log(`  Provider: ${result.provider}`)
          console.log(`  Status: ${result.previousStatus} → ${result.newStatus}`)
          if (result.transactionId) {
            console.log(`  Transaction: ${result.transactionId}`)
          }
          if (result.error) {
            console.log(`  Error: ${result.error}`)
          }
          console.log()
        }
      })
    }

    // Exit with appropriate code
    if (summary.errors > 0) {
      console.error('Reconciliation completed with errors')
      process.exit(1)
    } else {
      console.log('Reconciliation completed successfully')
      process.exit(0)
    }
  } catch (error) {
    console.error()
    console.error('='.repeat(80))
    console.error('FATAL ERROR')
    console.error('='.repeat(80))
    console.error(error)
    console.error('='.repeat(80))
    process.exit(1)
  }
}

// Run main function
main().catch(error => {
  console.error('Unhandled error:', error)
  process.exit(1)
})
