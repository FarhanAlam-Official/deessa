/**
 * Backfill Payment Intent IDs from Stripe API
 * 
 * This script fetches payment intent IDs for existing payments that only have session IDs.
 * Run this BEFORE the database migration to ensure all data is complete.
 * 
 * Usage:
 *   npx tsx scripts/backfill-stripe-payment-intents.ts
 * 
 * Environment variables required:
 *   - STRIPE_SECRET_KEY
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 */

import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables from .env.local or .env
config({ path: resolve(process.cwd(), '.env.local') })
config({ path: resolve(process.cwd(), '.env') })

// Initialize Stripe
const stripeKey = process.env.STRIPE_SECRET_KEY
if (!stripeKey) {
  console.error('❌ STRIPE_SECRET_KEY environment variable is required')
  process.exit(1)
}

const stripe = new Stripe(stripeKey, {
  apiVersion: '2024-06-20',
})

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

interface PaymentRecord {
  id: string
  transaction_id: string
  raw_payload: any
}

async function backfillPaymentIntents() {
  console.log('🚀 Starting payment intent backfill...\n')
  
  // Fetch all Stripe payments
  const { data: payments, error } = await supabase
    .from('payments')
    .select('id, transaction_id, raw_payload')
    .eq('provider', 'stripe')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('❌ Error fetching payments:', error)
    process.exit(1)
  }
  
  if (!payments || payments.length === 0) {
    console.log('✅ No Stripe payments found. Nothing to backfill.')
    return
  }
  
  console.log(`📊 Found ${payments.length} Stripe payments to process\n`)
  
  let successCount = 0
  let errorCount = 0
  let skippedCount = 0
  let apiCallCount = 0
  
  for (const payment of payments as PaymentRecord[]) {
    try {
      // Check if we already have payment_intent in raw_payload
      const existingPaymentIntent = payment.raw_payload?.paymentIntentId || payment.raw_payload?.payment_intent
      
      if (existingPaymentIntent) {
        console.log(`⏭️  Payment ${payment.id}: Already has payment_intent in payload`)
        skippedCount++
        continue
      }
      
      // Determine if this is a session or subscription
      const transactionId = payment.transaction_id
      
      if (transactionId.startsWith('cs_')) {
        // Checkout session - fetch from Stripe
        console.log(`🔍 Payment ${payment.id}: Fetching session ${transactionId}...`)
        apiCallCount++
        
        const session = await stripe.checkout.sessions.retrieve(transactionId, {
          expand: ['payment_intent', 'customer']
        })
        
        const paymentIntentId = typeof session.payment_intent === 'string'
          ? session.payment_intent
          : session.payment_intent?.id
        
        const customerId = typeof session.customer === 'string'
          ? session.customer
          : session.customer?.id
        
        if (paymentIntentId) {
          // Update raw_payload with the payment intent
          const updatedPayload = {
            ...payment.raw_payload,
            paymentIntentId: paymentIntentId,
            customerId: customerId || payment.raw_payload?.customerId,
            sessionId: transactionId,
            backfilledAt: new Date().toISOString(),
          }
          
          const { error: updateError } = await supabase
            .from('payments')
            .update({
              raw_payload: updatedPayload,
            })
            .eq('id', payment.id)
          
          if (updateError) {
            console.error(`❌ Payment ${payment.id}: Update failed:`, updateError.message)
            errorCount++
          } else {
            console.log(`✅ Payment ${payment.id}: Updated with intent ${paymentIntentId}`)
            successCount++
          }
        } else {
          console.warn(`⚠️  Payment ${payment.id}: No payment intent found for session`)
          skippedCount++
        }
        
        // Rate limiting: wait 100ms between requests
        await new Promise(resolve => setTimeout(resolve, 100))
        
      } else if (transactionId.startsWith('sub_')) {
        // Subscription - fetch latest invoice
        console.log(`🔍 Payment ${payment.id}: Fetching subscription ${transactionId}...`)
        apiCallCount++
        
        const subscription = await stripe.subscriptions.retrieve(transactionId, {
          expand: ['latest_invoice']
        })
        
        const invoice = subscription.latest_invoice
        const paymentIntentId = typeof invoice === 'object' && invoice !== null
          ? (typeof invoice.payment_intent === 'string' 
              ? invoice.payment_intent 
              : invoice.payment_intent?.id)
          : null
        
        const customerId = typeof subscription.customer === 'string'
          ? subscription.customer
          : subscription.customer?.id
        
        if (paymentIntentId) {
          // Update raw_payload with the payment intent
          const updatedPayload = {
            ...payment.raw_payload,
            paymentIntentId: paymentIntentId,
            customerId: customerId || payment.raw_payload?.customerId,
            subscriptionId: transactionId,
            backfilledAt: new Date().toISOString(),
          }
          
          const { error: updateError } = await supabase
            .from('payments')
            .update({
              raw_payload: updatedPayload,
            })
            .eq('id', payment.id)
          
          if (updateError) {
            console.error(`❌ Payment ${payment.id}: Update failed:`, updateError.message)
            errorCount++
          } else {
            console.log(`✅ Payment ${payment.id}: Updated with intent ${paymentIntentId}`)
            successCount++
          }
        } else {
          console.warn(`⚠️  Payment ${payment.id}: No payment intent found for subscription`)
          skippedCount++
        }
        
        // Rate limiting: wait 100ms between requests
        await new Promise(resolve => setTimeout(resolve, 100))
        
      } else {
        console.log(`⏭️  Payment ${payment.id}: Unknown transaction type ${transactionId}`)
        skippedCount++
      }
      
    } catch (error: any) {
      if (error.code === 'resource_missing') {
        console.warn(`⚠️  Payment ${payment.id}: Resource not found in Stripe (may be deleted)`)
        skippedCount++
      } else {
        console.error(`❌ Payment ${payment.id}: Error:`, error.message)
        errorCount++
      }
    }
  }
  
  console.log('\n' + '='.repeat(60))
  console.log('📊 Backfill Summary:')
  console.log('='.repeat(60))
  console.log(`✅ Success: ${successCount}`)
  console.log(`❌ Errors: ${errorCount}`)
  console.log(`⏭️  Skipped: ${skippedCount}`)
  console.log(`📞 Stripe API calls: ${apiCallCount}`)
  console.log(`📦 Total processed: ${payments.length}`)
  console.log('='.repeat(60))
  
  if (errorCount > 0) {
    console.log('\n⚠️  Some payments failed to update. Review errors above.')
    process.exit(1)
  } else {
    console.log('\n✅ Backfill complete! You can now run the database migration.')
    process.exit(0)
  }
}

// Run the backfill
backfillPaymentIntents()
  .catch((error) => {
    console.error('\n❌ Backfill script failed:', error)
    process.exit(1)
  })
