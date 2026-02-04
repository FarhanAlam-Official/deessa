"use server"

import crypto from "crypto"
import type { PaymentMode } from "./config"
import { validateAmount, logPaymentEvent } from "./security"
import { EsewaError } from "./errors"

export interface EsewaInitResult {
  redirectUrl: string
  referenceId: string
  formData: Record<string, string>
  transactionUuid: string
}

export interface EsewaDonationContext {
  id: string
  amount: number
  currency: string
}

/**
 * Generate HMAC-SHA256 signature for eSewa v2 API
 */
function generateSignature(message: string, secretKey: string): string {
  const hmac = crypto.createHmac("sha256", secretKey)
  hmac.update(message)
  return hmac.digest("base64")
}

/**
 * Prepare an eSewa payment using v2 API
 * 
 * eSewa v2 uses form POST with HMAC-SHA256 signature
 */
export async function startEsewaPayment(
  donation: EsewaDonationContext,
  mode: PaymentMode,
): Promise<EsewaInitResult> {
  // Validate inputs
  const amountValidation = validateAmount(donation.amount, "NPR")
  if (!amountValidation.valid) {
    throw new EsewaError(amountValidation.error || "Invalid amount")
  }

  const merchantId = process.env.ESEWA_MERCHANT_ID || "EPAYTEST"
  const secretKey = process.env.ESEWA_SECRET_KEY
  
  // Determine base URL
  const isSandbox = merchantId === "EPAYTEST" || process.env.ESEWA_BASE_URL?.includes("rc-epay")
  const baseUrl = process.env.ESEWA_BASE_URL || (isSandbox ? "https://rc-epay.esewa.com.np" : "https://epay.esewa.com.np")
  
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  const successUrl = process.env.ESEWA_SUCCESS_URL || `${siteUrl}/api/payments/esewa/success`
  const failureUrl = process.env.ESEWA_FAILURE_URL || `${siteUrl}/api/payments/esewa/failure`

  // Generate transaction UUID (unique identifier for the transaction)
  // Use a full donation id binding to avoid prefix collisions in callbacks
  const transactionUuid = `${Date.now()}-${donation.id}`
  const referenceId = `esewa_${donation.id}`

  if (mode === "mock") {
    const mockUrl = `${successUrl}?transaction_code=MOCK123&status=COMPLETE&total_amount=${donation.amount}&transaction_uuid=${transactionUuid}&product_code=${merchantId}&mock=1`
    
    logPaymentEvent("eSewa payment initiated (mock)", {
      donationId: donation.id,
      amount: donation.amount,
      transactionUuid,
    })

    return {
      redirectUrl: mockUrl,
      referenceId,
      formData: {},
      transactionUuid,
    }
  }

  // Validate merchant ID and secret key
  if (!merchantId || merchantId.trim().length === 0) {
    throw new EsewaError("ESEWA_MERCHANT_ID is not configured")
  }

  if (!secretKey || secretKey.trim().length === 0) {
    throw new EsewaError("ESEWA_SECRET_KEY is not configured")
  }

  // eSewa expects amount in NPR
  const amount = parseFloat(donation.amount.toFixed(2))
  
  // Validate amount
  if (amount <= 0) {
    throw new EsewaError("Amount must be greater than zero")
  }

  if (amount < 10) {
    throw new EsewaError("Minimum donation amount is Rs. 10")
  }

  // eSewa v2 API parameters:
  // amount: Amount of product
  // tax_amount: Tax amount (0 for donations)
  // total_amount: Total amount (amount + tax_amount + product_service_charge + product_delivery_charge)
  // transaction_uuid: Unique transaction identifier
  // product_code: Merchant code (EPAYTEST for sandbox)
  // product_service_charge: Service charge (0 for donations)
  // product_delivery_charge: Delivery charge (0 for donations)
  // success_url: Redirect URL on success
  // failure_url: Redirect URL on failure
  // signed_field_names: Fields used in signature generation
  // signature: HMAC-SHA256 signature

  const taxAmount = "0"
  const productServiceCharge = "0"
  const productDeliveryCharge = "0"
  const totalAmount = amount.toFixed(2)

  // Fields to sign (must be in this exact order)
  const signedFieldNames = "total_amount,transaction_uuid,product_code"
  
  // Generate signature message
  const message = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${merchantId}`
  const signature = generateSignature(message, secretKey)

  // Build form data
  const formData = {
    amount: amount.toFixed(2),
    tax_amount: taxAmount,
    total_amount: totalAmount,
    transaction_uuid: transactionUuid,
    product_code: merchantId,
    product_service_charge: productServiceCharge,
    product_delivery_charge: productDeliveryCharge,
    success_url: successUrl,
    failure_url: failureUrl,
    signed_field_names: signedFieldNames,
    signature: signature,
  }

  const redirectUrl = `${baseUrl}/api/epay/main/v2/form`

  logPaymentEvent("eSewa payment initiated (v2)", {
    donationId: donation.id,
    amount: donation.amount,
    transactionUuid,
    baseUrl,
    redirectUrl,
    merchantId: merchantId.substring(0, 4) + "***",
  })

  return {
    redirectUrl,
    referenceId,
    formData,
    transactionUuid,
  }
}
