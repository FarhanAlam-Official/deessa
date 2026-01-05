/**
 * Security utilities for payment processing
 * Provides input validation, amount validation, idempotency, and secure logging
 */

export interface ValidationResult {
  valid: boolean
  error?: string
}

/**
 * Validates donation amount
 * - Minimum: Rs. 10 (1000 paisa) for Khalti/eSewa, $1 for Stripe
 * - Maximum: Rs. 1,000,000 (100,000,000 paisa) or $10,000
 */
export function validateAmount(amount: number, currency: "USD" | "NPR"): ValidationResult {
  if (!amount || amount <= 0) {
    return { valid: false, error: "Amount must be greater than zero" }
  }

  if (currency === "NPR") {
    // Minimum: Rs. 10 (1000 paisa)
    if (amount < 10) {
      return { valid: false, error: "Minimum donation amount is Rs. 10" }
    }
    // Maximum: Rs. 1,000,000
    if (amount > 1000000) {
      return { valid: false, error: "Maximum donation amount is Rs. 1,000,000" }
    }
  } else {
    // Minimum: $1
    if (amount < 1) {
      return { valid: false, error: "Minimum donation amount is $1" }
    }
    // Maximum: $10,000
    if (amount > 10000) {
      return { valid: false, error: "Maximum donation amount is $10,000" }
    }
  }

  return { valid: true }
}

/**
 * Validates email address format
 */
export function validateEmail(email: string): ValidationResult {
  if (!email || email.trim().length === 0) {
    return { valid: false, error: "Email is required" }
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { valid: false, error: "Invalid email format" }
  }

  if (email.length > 255) {
    return { valid: false, error: "Email address is too long" }
  }

  return { valid: true }
}

/**
 * Validates phone number (basic validation)
 */
export function validatePhone(phone: string | undefined): ValidationResult {
  if (!phone || phone.trim().length === 0) {
    return { valid: true } // Phone is optional
  }

  // Remove common formatting characters
  const cleaned = phone.replace(/[\s\-\(\)\+]/g, "")

  // Check if it's all digits and reasonable length
  if (!/^\d+$/.test(cleaned)) {
    return { valid: false, error: "Phone number must contain only digits" }
  }

  if (cleaned.length < 7 || cleaned.length > 15) {
    return { valid: false, error: "Phone number must be between 7 and 15 digits" }
  }

  return { valid: true }
}

/**
 * Validates name (donor name)
 */
export function validateName(name: string): ValidationResult {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: "Name is required" }
  }

  if (name.trim().length < 2) {
    return { valid: false, error: "Name must be at least 2 characters" }
  }

  if (name.length > 255) {
    return { valid: false, error: "Name is too long" }
  }

  // Basic sanitization - remove potentially dangerous characters
  const sanitized = name.replace(/[<>\"']/g, "")
  if (sanitized !== name) {
    return { valid: false, error: "Name contains invalid characters" }
  }

  return { valid: true }
}

/**
 * Sanitizes string input to prevent XSS
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/[<>\"']/g, "")
    .trim()
    .slice(0, 1000) // Limit length
}

/**
 * Generates an idempotency key for a transaction
 */
export function generateIdempotencyKey(provider: string, transactionId: string): string {
  return `${provider}:${transactionId}:${Date.now()}`
}

/**
 * Masks sensitive data in logs
 */
export function maskSensitiveData(data: string | undefined | null): string {
  if (!data) return "[empty]"
  if (data.length <= 4) return "****"
  return `${data.slice(0, 2)}${"*".repeat(data.length - 4)}${data.slice(-2)}`
}

/**
 * Secure logging - logs payment events without sensitive data
 */
export function logPaymentEvent(
  event: string,
  data: Record<string, unknown>,
  level: "info" | "warn" | "error" = "info",
): void {
  const sanitizedData: Record<string, unknown> = {}

  // Mask sensitive fields
  const sensitiveFields = ["secret", "key", "password", "token", "authorization", "card", "cvv", "pin"]

  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase()
    if (sensitiveFields.some((field) => lowerKey.includes(field))) {
      sanitizedData[key] = maskSensitiveData(String(value))
    } else if (typeof value === "string" && value.length > 100) {
      sanitizedData[key] = `${value.slice(0, 50)}... [truncated]`
    } else {
      sanitizedData[key] = value
    }
  }

  const logMessage = `[Payment ${level.toUpperCase()}] ${event}: ${JSON.stringify(sanitizedData)}`

  if (level === "error") {
    console.error(logMessage)
  } else if (level === "warn") {
    console.warn(logMessage)
  } else {
    console.log(logMessage)
  }
}

/**
 * Validates that two amounts match (with tolerance for rounding)
 */
export function verifyAmountMatch(
  expected: number,
  actual: number,
  currency: "USD" | "NPR",
  tolerance: number = 0.01,
): ValidationResult {
  const difference = Math.abs(expected - actual)

  if (currency === "NPR") {
    // For NPR, tolerance is in paisa (1 paisa = 0.01 NPR)
    const toleranceInPaisa = tolerance * 100
    if (difference > toleranceInPaisa) {
      return {
        valid: false,
        error: `Amount mismatch: expected ${expected}, got ${actual} (difference: ${difference})`,
      }
    }
  } else {
    // For USD, tolerance is in cents
    const toleranceInCents = tolerance * 100
    if (difference > toleranceInCents) {
      return {
        valid: false,
        error: `Amount mismatch: expected ${expected}, got ${actual} (difference: ${difference})`,
      }
    }
  }

  return { valid: true }
}

/**
 * Validates UUID format
 */
export function validateUUID(uuid: string): ValidationResult {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(uuid)) {
    return { valid: false, error: "Invalid UUID format" }
  }
  return { valid: true }
}

/**
 * Creates a timeout promise that rejects after specified milliseconds
 */
export function createTimeoutPromise<T>(ms: number, errorMessage: string): Promise<T> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(errorMessage)), ms)
  })
}

/**
 * Wraps a fetch call with timeout
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number = 30000,
): Promise<Response> {
  const timeoutPromise = createTimeoutPromise<Response>(
    timeoutMs,
    `Request to ${url} timed out after ${timeoutMs}ms`,
  )

  const fetchPromise = fetch(url, options)

  return Promise.race([fetchPromise, timeoutPromise])
}

