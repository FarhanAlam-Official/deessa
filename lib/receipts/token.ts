/**
 * Receipt Token Generation and Verification
 * Provides secure, time-limited access tokens for receipt downloads
 */

import { SignJWT, jwtVerify } from "jose"

interface ReceiptTokenPayload {
  donationId: string
  receiptNumber: string
  exp?: number
}

interface VerifiedReceiptToken {
  donationId: string
  receiptNumber: string
}

/**
 * Get the secret key for JWT signing
 */
function getSecretKey(): Uint8Array {
  const secret = process.env.RECEIPT_TOKEN_SECRET
  if (!secret) {
    throw new Error("RECEIPT_TOKEN_SECRET environment variable is not set")
  }
  return new TextEncoder().encode(secret)
}

/**
 * Generate a signed JWT token for receipt access
 * 
 * @param donationId - The donation ID
 * @param receiptNumber - The receipt number
 * @param expiryDays - Token expiry in days (default: 30)
 * @returns Signed JWT token
 */
export async function generateReceiptToken(
  donationId: string,
  receiptNumber: string,
  expiryDays: number = 30,
): Promise<string> {
  const secret = getSecretKey()
  
  const token = await new SignJWT({
    donationId,
    receiptNumber,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${expiryDays}d`)
    .setSubject(donationId)
    .sign(secret)
  
  return token
}

/**
 * Verify and decode a receipt token
 * 
 * @param token - The JWT token to verify
 * @returns Decoded token payload
 * @throws Error if token is invalid or expired
 */
export async function verifyReceiptToken(
  token: string,
): Promise<VerifiedReceiptToken> {
  const secret = getSecretKey()
  
  try {
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ["HS256"],
    })
    
    if (!payload.donationId || !payload.receiptNumber) {
      throw new Error("Invalid token payload: missing required fields")
    }
    
    return {
      donationId: payload.donationId as string,
      receiptNumber: payload.receiptNumber as string,
    }
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("expired")) {
        throw new Error("Receipt token has expired")
      }
      throw new Error(`Invalid receipt token: ${error.message}`)
    }
    throw new Error("Invalid receipt token")
  }
}

/**
 * Generate a receipt download URL with embedded token
 * 
 * @param donationId - The donation ID
 * @param receiptNumber - The receipt number
 * @param baseUrl - The base URL of the site
 * @returns Full download URL with token
 */
export async function generateReceiptDownloadUrl(
  donationId: string,
  receiptNumber: string,
  baseUrl?: string,
): Promise<string> {
  const token = await generateReceiptToken(donationId, receiptNumber)
  
  // Use provided baseUrl, or fall back to environment variables
  // NEXT_PUBLIC_APP_URL is preferred as it's specifically for API/backend URLs
  // NEXT_PUBLIC_SITE_URL is the fallback for frontend URLs
  const siteUrl = baseUrl || 
                  process.env.NEXT_PUBLIC_APP_URL || 
                  process.env.NEXT_PUBLIC_SITE_URL || 
                  "http://localhost:3000"
  
  return `${siteUrl}/api/receipts/download?token=${token}`
}
