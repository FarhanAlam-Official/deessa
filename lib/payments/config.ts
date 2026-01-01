import { createClient } from "@/lib/supabase/server"

export type PaymentProvider = "stripe" | "khalti" | "esewa"
export type PaymentMode = "mock" | "live"

export interface PaymentSettings {
  enabledProviders: PaymentProvider[]
  primaryProvider: PaymentProvider
  defaultCurrency: "USD" | "NPR"
  allowRecurring: boolean
}

const DEFAULT_PAYMENT_SETTINGS: PaymentSettings = {
  enabledProviders: ["stripe", "khalti", "esewa"],
  primaryProvider: "stripe",
  defaultCurrency: "USD",
  allowRecurring: false,
}

export function getPaymentMode(): PaymentMode {
  const mode = process.env.PAYMENT_MODE === "live" ? "live" : "mock"
  return mode
}

export function isProviderEnvConfigured(provider: PaymentProvider): boolean {
  if (getPaymentMode() === "mock") {
    // In mock mode we intentionally do not require any real secrets
    return true
  }

  switch (provider) {
    case "stripe":
      // Stripe secret key is required, webhook secret is optional (webhooks won't work without it, but checkout will)
      return Boolean(process.env.STRIPE_SECRET_KEY)
    case "khalti":
      return Boolean(process.env.KHALTI_SECRET_KEY && process.env.KHALTI_BASE_URL)
    case "esewa":
      return Boolean(process.env.ESEWA_MERCHANT_ID && process.env.ESEWA_BASE_URL)
    default:
      return false
  }
}

/**
 * Read high-level payment settings from the database.
 * We intentionally store ONLY non-sensitive configuration here.
 *
 * Implementation detail:
 * - Uses the existing `site_settings` table with key = "payments"
 *   instead of introducing a new physical `payment_settings` table.
 */
export async function getPaymentSettings(): Promise<PaymentSettings> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "payments")
    .single()

  if (error || !data?.value) {
    return DEFAULT_PAYMENT_SETTINGS
  }

  const value = data.value as Partial<PaymentSettings>

  const merged: PaymentSettings = {
    enabledProviders: value.enabledProviders && value.enabledProviders.length ? value.enabledProviders : DEFAULT_PAYMENT_SETTINGS.enabledProviders,
    primaryProvider: (value.primaryProvider as PaymentProvider) || DEFAULT_PAYMENT_SETTINGS.primaryProvider,
    defaultCurrency: (value.defaultCurrency as "USD" | "NPR") || DEFAULT_PAYMENT_SETTINGS.defaultCurrency,
    allowRecurring: typeof value.allowRecurring === "boolean" ? value.allowRecurring : DEFAULT_PAYMENT_SETTINGS.allowRecurring,
  }

  // Ensure primary provider is in enabled list
  if (!merged.enabledProviders.includes(merged.primaryProvider)) {
    merged.enabledProviders = Array.from(new Set([...merged.enabledProviders, merged.primaryProvider]))
  }

  return merged
}

export function getSupportedProviders(settings: PaymentSettings): PaymentProvider[] {
  // In live mode, a provider is usable only if both env and settings allow it
  if (getPaymentMode() === "live") {
    return settings.enabledProviders.filter((p) => isProviderEnvConfigured(p))
  }

  // In mock mode, we allow all enabled providers regardless of env
  return settings.enabledProviders
}


