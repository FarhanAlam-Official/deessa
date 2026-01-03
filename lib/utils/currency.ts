/**
 * Currency utilities for consistent formatting across the application
 */

export type SupportedCurrency = "USD" | "NPR" | "INR" | "EUR" | "GBP"

export interface CurrencyInfo {
  symbol: string
  code: string
  name: string
  locale: string
}

export const CURRENCY_INFO: Record<SupportedCurrency, CurrencyInfo> = {
  USD: {
    symbol: "$",
    code: "USD",
    name: "US Dollar",
    locale: "en-US",
  },
  NPR: {
    symbol: "₨",
    code: "NPR",
    name: "Nepali Rupee",
    locale: "ne-NP",
  },
  INR: {
    symbol: "₹",
    code: "INR",
    name: "Indian Rupee",
    locale: "en-IN",
  },
  EUR: {
    symbol: "€",
    code: "EUR",
    name: "Euro",
    locale: "de-DE",
  },
  GBP: {
    symbol: "£",
    code: "GBP",
    name: "British Pound",
    locale: "en-GB",
  },
}

/**
 * Get currency symbol for a given currency code
 */
export function getCurrencySymbol(currencyCode?: string | null): string {
  if (!currencyCode) return "₨" // Default to NPR
  const code = currencyCode.toUpperCase() as SupportedCurrency
  return CURRENCY_INFO[code]?.symbol || currencyCode
}

/**
 * Format amount with currency symbol
 * @param amount - The amount to format
 * @param currencyCode - Currency code (e.g., "USD", "NPR")
 * @param options - Formatting options
 */
export function formatCurrency(
  amount: number,
  currencyCode?: string | null,
  options: {
    showCode?: boolean // Show currency code after amount (e.g., "$250 USD")
    symbolPosition?: "before" | "after" // Position of symbol
    decimals?: number // Number of decimal places
  } = {}
): string {
  const {
    showCode = false,
    symbolPosition = "before",
    decimals = 2,
  } = options

  const code = (currencyCode || "NPR").toUpperCase() as SupportedCurrency
  const symbol = getCurrencySymbol(code)
  const formattedAmount = amount.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })

  let result = symbolPosition === "before" 
    ? `${symbol}${formattedAmount}`
    : `${formattedAmount}${symbol}`

  if (showCode) {
    result += ` ${code}`
  }

  return result
}

/**
 * Format currency with locale-aware formatting
 * @param amount - The amount to format
 * @param currencyCode - Currency code (e.g., "USD", "NPR")
 */
export function formatCurrencyLocale(
  amount: number,
  currencyCode?: string | null
): string {
  const code = (currencyCode || "NPR").toUpperCase() as SupportedCurrency
  const info = CURRENCY_INFO[code]
  
  if (!info) {
    // Fallback for unsupported currencies
    return formatCurrency(amount, currencyCode)
  }

  try {
    return new Intl.NumberFormat(info.locale, {
      style: "currency",
      currency: code,
    }).format(amount)
  } catch (error) {
    // Fallback if Intl formatting fails
    return formatCurrency(amount, currencyCode)
  }
}

/**
 * Parse currency string to number
 * Removes currency symbols and formatting
 */
export function parseCurrency(value: string): number {
  const cleaned = value.replace(/[^0-9.-]/g, "")
  return Number.parseFloat(cleaned) || 0
}

/**
 * Convert currency (mock conversion - in production, use real exchange rates)
 * @param amount - Amount to convert
 * @param fromCurrency - Source currency
 * @param toCurrency - Target currency
 */
export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): number {
  // Mock conversion rates (as of 2024 - these should be fetched from an API in production)
  const rates: Record<string, number> = {
    USD_NPR: 132.5,
    NPR_USD: 0.0075,
    USD_INR: 83.2,
    INR_USD: 0.012,
    NPR_INR: 0.63,
    INR_NPR: 1.59,
  }

  const from = fromCurrency.toUpperCase()
  const to = toCurrency.toUpperCase()

  if (from === to) return amount

  const key = `${from}_${to}`
  const rate = rates[key]

  if (!rate) {
    console.warn(`Conversion rate not found for ${key}, returning original amount`)
    return amount
  }

  return amount * rate
}

/**
 * Get display text for currency totals with optional conversion
 */
export function formatMultiCurrencyTotal(
  totals: Record<string, number>,
  options: {
    showConversion?: boolean // Show converted values
    baseCurrency?: string // Base currency for conversion
  } = {}
): string {
  const { showConversion = false, baseCurrency = "USD" } = options

  const entries = Object.entries(totals)
  if (entries.length === 0) return formatCurrency(0, baseCurrency)
  if (entries.length === 1) {
    return formatCurrency(entries[0][1], entries[0][0], { showCode: true })
  }

  // Multiple currencies
  const parts = entries.map(([currency, amount]) => {
    const formatted = formatCurrency(amount, currency, { showCode: true })
    if (showConversion && currency !== baseCurrency) {
      const converted = convertCurrency(amount, currency, baseCurrency)
      const convertedFormatted = formatCurrency(converted, baseCurrency)
      return `${formatted} (≈${convertedFormatted})`
    }
    return formatted
  })

  return parts.join(" + ")
}
