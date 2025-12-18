"use server"

import { getCurrentAdmin } from "@/lib/actions/admin-auth"
import { updateSiteSetting, getSiteSetting } from "@/lib/actions/admin-settings"
import type { PaymentSettings, PaymentProvider } from "@/lib/payments/config"

type UpdateInput = {
  enabledProviders: PaymentProvider[]
  primaryProvider: PaymentProvider
  defaultCurrency: "USD" | "NPR"
  allowRecurring: boolean
}

export async function getPaymentSettingsRaw() {
  const existing = await getSiteSetting("payments")
  return existing?.value as Partial<PaymentSettings> | undefined
}

export async function updatePaymentSettings(input: UpdateInput) {
  const admin = await getCurrentAdmin()
  if (!admin) {
    return { error: "Unauthorized" }
  }

  if (admin.role !== "SUPER_ADMIN" && admin.role !== "ADMIN") {
    return { error: "Only admins can update payment settings" }
  }

  const uniqueProviders = Array.from(new Set(input.enabledProviders))

  if (!uniqueProviders.includes(input.primaryProvider)) {
    return { error: "Primary provider must be one of the enabled providers" }
  }

  const value: PaymentSettings = {
    enabledProviders: uniqueProviders,
    primaryProvider: input.primaryProvider,
    defaultCurrency: input.defaultCurrency,
    allowRecurring: input.allowRecurring,
  }

  const result = await updateSiteSetting("payments", value as unknown as Record<string, unknown>)

  if ((result as any)?.error) {
    return { error: (result as any).error as string }
  }

  return { success: true }
}


