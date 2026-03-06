/**
 * Jest Setup File
 * 
 * This file runs before all tests to set up the test environment.
 * It configures mocks, environment variables, and global test utilities.
 */

// Set test environment variables
process.env.NODE_ENV = 'test'
process.env.PAYMENT_MODE = 'mock'

// Mock Supabase environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'

// Mock payment provider credentials
process.env.STRIPE_SECRET_KEY = 'sk_test_mock'
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_mock'
process.env.KHALTI_SECRET_KEY = 'test_secret_key_mock'
process.env.KHALTI_BASE_URL = 'https://test.khalti.com/api/v2'
process.env.ESEWA_SECRET_KEY = 'test_esewa_secret'
process.env.ESEWA_MERCHANT_ID = 'EPAYTEST'
process.env.ESEWA_BASE_URL = 'https://rc-epay.esewa.com.np'

// Mock receipt token secret
process.env.RECEIPT_TOKEN_SECRET = 'test-receipt-token-secret-32-chars'

// Mock Redis for rate limiting (optional)
process.env.UPSTASH_REDIS_URL = 'https://test-redis.upstash.io'
process.env.UPSTASH_REDIS_TOKEN = 'test-redis-token'

// Extend Jest matchers (optional)
expect.extend({
  toBeValidUUID(received: string) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    const pass = uuidRegex.test(received)
    
    return {
      pass,
      message: () => pass
        ? `Expected ${received} not to be a valid UUID`
        : `Expected ${received} to be a valid UUID`,
    }
  },
  
  toBeValidReceiptNumber(received: string) {
    const receiptRegex = /^RCP-\d{4}-\d+$/
    const pass = receiptRegex.test(received)
    
    return {
      pass,
      message: () => pass
        ? `Expected ${received} not to be a valid receipt number`
        : `Expected ${received} to be a valid receipt number (format: RCP-YYYY-NNNN)`,
    }
  },
})

// Declare custom matchers for TypeScript
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidUUID(): R
      toBeValidReceiptNumber(): R
    }
  }
}

// Mock console methods to reduce noise in test output
global.console = {
  ...console,
  // Keep error and warn for debugging
  error: jest.fn(),
  warn: jest.fn(),
  // Suppress log, info, debug
  log: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
}

// Mock Date.now for deterministic tests
const MOCK_TIMESTAMP = 1704067200000 // 2024-01-01 00:00:00 UTC
Date.now = jest.fn(() => MOCK_TIMESTAMP)

// Export test utilities
export const mockTimestamp = MOCK_TIMESTAMP
export const mockDate = new Date(MOCK_TIMESTAMP)

// Helper to create mock Supabase client
export function createMockSupabaseClient() {
  return {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
      maybeSingle: jest.fn(),
    })),
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(),
        download: jest.fn(),
        getPublicUrl: jest.fn(),
      })),
    },
    rpc: jest.fn(),
  }
}

// Helper to create mock verification result
export function createMockVerificationResult(overrides = {}) {
  return {
    success: true,
    donationId: 'test-donation-id',
    transactionId: 'test-transaction-id',
    amount: 100,
    currency: 'USD',
    status: 'paid' as const,
    metadata: {},
    ...overrides,
  }
}

// Helper to create mock donation
export function createMockDonation(overrides = {}) {
  return {
    id: 'test-donation-id',
    amount: 100,
    currency: 'USD',
    payment_status: 'pending',
    donor_name: 'Test Donor',
    donor_email: 'test@example.com',
    created_at: mockDate.toISOString(),
    ...overrides,
  }
}

console.log('✓ Test environment configured')
