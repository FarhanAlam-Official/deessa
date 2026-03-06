/**
 * Provider Dashboard URL Generator
 * Generates URLs to payment provider dashboards for quick access to transaction details
 */

export type PaymentProvider = "stripe" | "khalti" | "esewa" | "fonepay"

export interface DonationProviderData {
  provider: string
  payment_intent_id?: string | null  // Primary reference for Stripe
  session_id?: string | null         // Fallback reference
  payment_id?: string | null         // Legacy support
}

/**
 * Get the dashboard URL for a payment provider
 * Returns null if the provider is not supported or required data is missing
 * 
 * Priority order for Stripe: payment_intent_id > session_id > payment_id (legacy)
 */
export function getProviderDashboardUrl(
  provider: string,
  donation: DonationProviderData
): string | null {
  const isTestMode = process.env.NEXT_PUBLIC_PAYMENT_MODE === "test"
  
  console.log('getProviderDashboardUrl debug:', {
    provider,
    providerLower: provider.toLowerCase(),
    isTestMode,
    envVar: process.env.NEXT_PUBLIC_PAYMENT_MODE,
    donation,
  })

  switch (provider.toLowerCase()) {
    case "stripe": {
      // Priority: payment_intent_id > session_id > payment_id (legacy)
      const stripeId = donation.payment_intent_id || donation.session_id || donation.payment_id
      
      console.log('Stripe case:', { stripeId })
      
      if (!stripeId) return null

      // Clean the ID (remove provider prefix like "stripe:" if present)
      // Only remove prefix if it contains a colon (e.g., "stripe:pi_xxx" -> "pi_xxx")
      const cleanId = stripeId.includes(':') 
        ? stripeId.split(':')[1] 
        : stripeId
      
      console.log('After cleaning:', { cleanId, startsWithPi: cleanId.startsWith("pi_") })
      
      // Payment Intent ID - direct link (preferred)
      if (cleanId.startsWith("pi_")) {
        const baseUrl = isTestMode
          ? "https://dashboard.stripe.com/test/payments"
          : "https://dashboard.stripe.com/payments"
        const finalUrl = `${baseUrl}/${cleanId}`
        console.log('Generated URL:', finalUrl)
        return finalUrl
      }
      
      // Session ID - link to payments list (fallback)
      if (cleanId.startsWith("cs_")) {
        const baseUrl = isTestMode
          ? "https://dashboard.stripe.com/test/payments"
          : "https://dashboard.stripe.com/payments"
        console.log('Session fallback URL:', baseUrl)
        return baseUrl // Can't link directly to session
      }
      
      console.log('No match for ID type')
      return null
    }

    case "khalti": {
      // Use any available ID
      const khaltiId = donation.payment_id || donation.session_id
      if (!khaltiId) return null
      
      // Clean the ID (remove provider prefix like "khalti:" if present)
      const cleanId = khaltiId.includes(':') 
        ? khaltiId.split(':')[1] 
        : khaltiId
      return `https://admin.khalti.com/transactions/${cleanId}`
    }

    case "esewa": {
      // Use any available ID
      const esewaId = donation.payment_id || donation.session_id
      if (!esewaId) return null
      
      // Clean the ID (remove provider prefix like "esewa:" if present)
      const cleanId = esewaId.includes(':') 
        ? esewaId.split(':')[1] 
        : esewaId
      return `https://merchant.esewa.com.np/transactions/${cleanId}`
    }

    case "fonepay": {
      // Fonepay doesn't have a public merchant dashboard URL pattern
      return null
    }

    default:
      return null
  }
}

/**
 * Get a user-friendly label for the provider dashboard button
 */
export function getProviderDashboardLabel(provider: string): string {
  switch (provider.toLowerCase()) {
    case "stripe":
      return "View in Stripe Dashboard"
    case "khalti":
      return "View in Khalti Dashboard"
    case "esewa":
      return "View in eSewa Portal"
    case "fonepay":
      return "View in Fonepay Portal"
    default:
      return "View in Provider Dashboard"
  }
}

/**
 * Check if the provider dashboard URL is available
 */
export function hasProviderDashboard(provider: string, donation: DonationProviderData): boolean {
  return getProviderDashboardUrl(provider, donation) !== null
}

/**
 * Get test mode indicator
 */
export function isTestMode(): boolean {
  return process.env.PAYMENT_MODE === "test"
}
