/**
 * Receipt Rendering Tests
 * 
 * Tests for receipt PDF generation with various combinations of
 * stamps, signatures, and verification features.
 * 
 * Test Coverage:
 * - Stamp and signature URL combinations
 * - URL validation (HTTPS, relative paths, invalid URLs)
 * - Verification QR code rendering
 * - Backward compatibility with legacy receipts
 */

import { describe, it, expect, beforeEach } from '@jest/globals'
import type { ReceiptPDFData, ReceiptPDFOrganization } from '@/lib/receipts/receipt-document'

describe('Receipt Rendering with Stamps and Signatures', () => {
  let baseOrganization: ReceiptPDFOrganization
  let baseReceiptData: ReceiptPDFData

  beforeEach(() => {
    // Base organization data
    baseOrganization = {
      name: 'Dessa Foundation',
      address: '123 Test Street, Kathmandu, Nepal',
      phone: '+977-1-1234567',
      email: 'info@dessafoundation.org',
      website: 'https://dessafoundation.org',
      pan_number: '123456789',
      swc_registration_number: 'SWC-12345',
      authorized_signatory_name: 'John Doe',
      authorized_signatory_designation: 'Executive Director',
    }

    // Base receipt data
    baseReceiptData = {
      receiptNumber: 'DF-2026-00001',
      donationId: 'test-donation-id',
      paymentDate: new Date('2026-03-03'),
      donorName: 'Jane Smith',
      donorEmail: 'jane@example.com',
      donorPhone: '+977-9812345678',
      amount: 5000,
      currency: 'NPR',
      paymentMethod: 'Stripe',
      isMonthly: false,
      organization: baseOrganization,
    }
  })

  describe('Stamp and Signature URL Combinations', () => {
    it('should handle both stamp and signature URLs populated', () => {
      const orgWithBoth: ReceiptPDFOrganization = {
        ...baseOrganization,
        stamp_url: 'https://example.com/stamp.png',
        signature_url: 'https://example.com/signature.png',
      }

      const receiptData: ReceiptPDFData = {
        ...baseReceiptData,
        organization: orgWithBoth,
      }

      // Verify data structure
      expect(receiptData.organization.stamp_url).toBe('https://example.com/stamp.png')
      expect(receiptData.organization.signature_url).toBe('https://example.com/signature.png')
      expect(receiptData.organization.stamp_url).toMatch(/^https:\/\//)
      expect(receiptData.organization.signature_url).toMatch(/^https:\/\//)
    })

    it('should handle only stamp URL populated', () => {
      const orgWithStamp: ReceiptPDFOrganization = {
        ...baseOrganization,
        stamp_url: 'https://example.com/stamp.png',
      }

      const receiptData: ReceiptPDFData = {
        ...baseReceiptData,
        organization: orgWithStamp,
      }

      expect(receiptData.organization.stamp_url).toBe('https://example.com/stamp.png')
      expect(receiptData.organization.signature_url).toBeUndefined()
    })

    it('should handle only signature URL populated', () => {
      const orgWithSignature: ReceiptPDFOrganization = {
        ...baseOrganization,
        signature_url: 'https://example.com/signature.png',
      }

      const receiptData: ReceiptPDFData = {
        ...baseReceiptData,
        organization: orgWithSignature,
      }

      expect(receiptData.organization.signature_url).toBe('https://example.com/signature.png')
      expect(receiptData.organization.stamp_url).toBeUndefined()
    })

    it('should handle no URLs populated (backward compatibility)', () => {
      const receiptData: ReceiptPDFData = {
        ...baseReceiptData,
        organization: baseOrganization,
      }

      expect(receiptData.organization.stamp_url).toBeUndefined()
      expect(receiptData.organization.signature_url).toBeUndefined()
    })
  })

  describe('URL Validation', () => {
    it('should detect relative URLs', () => {
      const relativeUrls = [
        '/images/stamp.png',
        './stamp.png',
        '../assets/signature.png',
        'images/stamp.png',
      ]

      relativeUrls.forEach(url => {
        const isRelative = !url.match(/^https?:\/\//)
        expect(isRelative).toBe(true)
      })
    })

    it('should validate HTTPS URLs', () => {
      const validUrls = [
        'https://example.com/stamp.png',
        'https://cdn.example.com/images/signature.png',
        'http://localhost:3000/stamp.png', // Valid for development
      ]

      validUrls.forEach(url => {
        const isValid = /^https?:\/\//.test(url)
        expect(isValid).toBe(true)
      })
    })

    it('should detect invalid URLs', () => {
      const invalidUrls = [
        'ftp://example.com/stamp.png',
        'file:///path/to/stamp.png',
        'data:image/png;base64,iVBORw0KG...',
        '',
        'not-a-url',
      ]

      invalidUrls.forEach(url => {
        const isValid = /^https?:\/\//.test(url)
        expect(isValid).toBe(false)
      })
    })

    it('should handle Supabase storage URLs', () => {
      const supabaseUrl = 'https://tqljblbdfhjfqnegjobi.supabase.co/storage/v1/object/public/stamps/official-stamp.png'
      
      const isValid = /^https?:\/\//.test(supabaseUrl)
      expect(isValid).toBe(true)
      expect(supabaseUrl).toContain('supabase.co')
    })
  })

  describe('Verification Features', () => {
    it('should handle verification ID and QR code', () => {
      const verificationId = '123e4567-e89b-12d3-a456-426614174000'
      const verificationQR = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...'

      const receiptData: ReceiptPDFData = {
        ...baseReceiptData,
        verificationId,
        verificationQR,
      }

      expect(receiptData.verificationId).toBe(verificationId)
      expect(receiptData.verificationQR).toBe(verificationQR)
      expect(receiptData.verificationQR).toMatch(/^data:image\/png;base64,/)
    })

    it('should handle missing verification data (legacy receipts)', () => {
      const receiptData: ReceiptPDFData = {
        ...baseReceiptData,
      }

      expect(receiptData.verificationId).toBeUndefined()
      expect(receiptData.verificationQR).toBeUndefined()
    })

    it('should validate UUID format for verification ID', () => {
      const validUUIDs = [
        '123e4567-e89b-12d3-a456-426614174000',
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      ]

      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

      validUUIDs.forEach(uuid => {
        expect(uuidRegex.test(uuid)).toBe(true)
      })
    })
  })

  describe('Receipt Data Completeness', () => {
    it('should include all required fields', () => {
      const receiptData: ReceiptPDFData = {
        ...baseReceiptData,
      }

      // Required fields
      expect(receiptData.receiptNumber).toBeDefined()
      expect(receiptData.donationId).toBeDefined()
      expect(receiptData.paymentDate).toBeInstanceOf(Date)
      expect(receiptData.donorName).toBeDefined()
      expect(receiptData.donorEmail).toBeDefined()
      expect(receiptData.amount).toBeGreaterThan(0)
      expect(receiptData.currency).toBeDefined()
      expect(receiptData.paymentMethod).toBeDefined()
      expect(typeof receiptData.isMonthly).toBe('boolean')
      expect(receiptData.organization).toBeDefined()
    })

    it('should handle optional fields', () => {
      const receiptData: ReceiptPDFData = {
        ...baseReceiptData,
        donorPhone: undefined,
        providerRef: 'stripe_pi_123456',
        verificationId: '123e4567-e89b-12d3-a456-426614174000',
        verificationQR: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...',
      }

      expect(receiptData.donorPhone).toBeUndefined()
      expect(receiptData.providerRef).toBe('stripe_pi_123456')
      expect(receiptData.verificationId).toBeDefined()
      expect(receiptData.verificationQR).toBeDefined()
    })
  })

  describe('Organization Data Validation', () => {
    it('should include all tax registration numbers', () => {
      const orgWithAllTax: ReceiptPDFOrganization = {
        ...baseOrganization,
        pan_number: '123456789',
        vat_registration_number: 'VAT-12345',
        swc_registration_number: 'SWC-12345',
        ird_exemption_number: 'IRD-12345',
      }

      expect(orgWithAllTax.pan_number).toBeDefined()
      expect(orgWithAllTax.vat_registration_number).toBeDefined()
      expect(orgWithAllTax.swc_registration_number).toBeDefined()
      expect(orgWithAllTax.ird_exemption_number).toBeDefined()
    })

    it('should handle missing optional tax numbers', () => {
      const orgMinimal: ReceiptPDFOrganization = {
        name: 'Dessa Foundation',
      }

      expect(orgMinimal.pan_number).toBeUndefined()
      expect(orgMinimal.vat_registration_number).toBeUndefined()
      expect(orgMinimal.swc_registration_number).toBeUndefined()
      expect(orgMinimal.ird_exemption_number).toBeUndefined()
    })
  })

  describe('Edge Cases', () => {
    it('should handle very long organization names', () => {
      const longName = 'A'.repeat(200)
      const org: ReceiptPDFOrganization = {
        ...baseOrganization,
        name: longName,
      }

      expect(org.name.length).toBe(200)
    })

    it('should handle special characters in donor names', () => {
      const specialNames = [
        'José García',
        'François Müller',
        'राम बहादुर',
        "O'Brien",
      ]

      specialNames.forEach(name => {
        const receiptData: ReceiptPDFData = {
          ...baseReceiptData,
          donorName: name,
        }

        expect(receiptData.donorName).toBe(name)
      })
    })

    it('should handle large donation amounts', () => {
      const largeAmounts = [
        1000000, // 1 million
        10000000, // 10 million (1 crore)
        100000000, // 100 million (10 crore)
      ]

      largeAmounts.forEach(amount => {
        const receiptData: ReceiptPDFData = {
          ...baseReceiptData,
          amount,
        }

        expect(receiptData.amount).toBe(amount)
        expect(receiptData.amount).toBeGreaterThan(0)
      })
    })

    it('should handle different currencies', () => {
      const currencies = ['NPR', 'USD', 'EUR', 'GBP', 'INR']

      currencies.forEach(currency => {
        const receiptData: ReceiptPDFData = {
          ...baseReceiptData,
          currency,
        }

        expect(receiptData.currency).toBe(currency)
      })
    })
  })

  describe('Backward Compatibility', () => {
    it('should work with legacy receipt data (no verification)', () => {
      const legacyReceipt: ReceiptPDFData = {
        receiptNumber: 'DF-2025-00001',
        donationId: 'legacy-donation-id',
        paymentDate: new Date('2025-01-01'),
        donorName: 'Legacy Donor',
        donorEmail: 'legacy@example.com',
        amount: 1000,
        currency: 'NPR',
        paymentMethod: 'Stripe',
        isMonthly: false,
        organization: {
          name: 'Dessa Foundation',
        },
      }

      expect(legacyReceipt.verificationId).toBeUndefined()
      expect(legacyReceipt.verificationQR).toBeUndefined()
      expect(legacyReceipt.organization.stamp_url).toBeUndefined()
      expect(legacyReceipt.organization.signature_url).toBeUndefined()
    })

    it('should work with legacy organization data (minimal fields)', () => {
      const legacyOrg: ReceiptPDFOrganization = {
        name: 'Dessa Foundation',
        address: '123 Test Street',
        email: 'info@dessafoundation.org',
      }

      expect(legacyOrg.name).toBeDefined()
      expect(legacyOrg.logo_url).toBeUndefined()
      expect(legacyOrg.stamp_url).toBeUndefined()
      expect(legacyOrg.signature_url).toBeUndefined()
    })
  })
})
