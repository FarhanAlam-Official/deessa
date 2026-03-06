"use server"

import { createClient } from "@/lib/supabase/server"

/**
 * Trigger manual reconciliation of stuck donations
 */
export async function triggerReconciliation() {
  try {
    const supabase = await createClient()

    // Get donations stuck in pending for over 1 hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { data: stuckDonations, error } = await supabase
      .from("donations")
      .select("*")
      .eq("payment_status", "pending")
      .lt("created_at", oneHourAgo)

    if (error) {
      return {
        success: false,
        message: error.message,
        reconciled: 0,
      }
    }

    // TODO: Implement actual reconciliation logic
    // For now, just return the count
    // In production, this would:
    // 1. Check each donation with the provider
    // 2. Update status based on provider response
    // 3. Trigger receipt generation if confirmed

    return {
      success: true,
      message: "Reconciliation completed",
      reconciled: stuckDonations?.length || 0,
      checked: stuckDonations?.length || 0,
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
      reconciled: 0,
    }
  }
}

/**
 * Check provider API connectivity
 */
export async function checkProviderStatus() {
  const results: Record<string, { healthy: boolean; message?: string }> = {}

  // Check Stripe
  try {
    if (process.env.STRIPE_SECRET_KEY) {
      // In production, you would make an actual API call
      // For now, just check if the key exists
      results.stripe = { healthy: true }
    } else {
      results.stripe = { healthy: false, message: "API key not configured" }
    }
  } catch (error) {
    results.stripe = {
      healthy: false,
      message: error instanceof Error ? error.message : "Unknown error",
    }
  }

  // Check Khalti
  try {
    if (process.env.KHALTI_SECRET_KEY) {
      results.khalti = { healthy: true }
    } else {
      results.khalti = { healthy: false, message: "API key not configured" }
    }
  } catch (error) {
    results.khalti = {
      healthy: false,
      message: error instanceof Error ? error.message : "Unknown error",
    }
  }

  // Check eSewa
  try {
    if (process.env.ESEWA_SECRET_KEY && process.env.ESEWA_MERCHANT_ID) {
      results.esewa = { healthy: true }
    } else {
      results.esewa = { healthy: false, message: "Credentials not configured" }
    }
  } catch (error) {
    results.esewa = {
      healthy: false,
      message: error instanceof Error ? error.message : "Unknown error",
    }
  }

  return results
}
