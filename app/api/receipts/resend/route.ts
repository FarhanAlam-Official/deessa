/**
 * Receipt Resend API
 * Handles resending receipt emails
 * 
 * Security:
 * - Requires authentication (admin session or valid API key)
 * - Verifies email matches donation record
 * - Rate limited to prevent abuse
 */

import { createClient as createServiceClient } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"
import { resendReceiptEmail } from "@/lib/receipts/service"
import { checkRateLimit, getClientIP } from "@/lib/rate-limit"
import { NextRequest, NextResponse } from "next/server"

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("Missing Supabase service role env vars")
  return createServiceClient(url, key)
}

/**
 * Verify authentication via session or API key
 */
async function verifyAuthentication(request: NextRequest): Promise<{
  authenticated: boolean
  isAdmin: boolean
  userId?: string
  error?: string
}> {
  // Check for API key authentication
  const apiKey = request.headers.get("x-api-key")
  if (apiKey && apiKey === process.env.RECEIPT_RESEND_API_KEY) {
    return { authenticated: true, isAdmin: true }
  }
  
  // Check for session authentication
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return { 
      authenticated: false, 
      isAdmin: false,
      error: "Authentication required"
    }
  }
  
  // Check if user is admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()
  
  const isAdmin = profile?.role === "admin"
  
  return {
    authenticated: true,
    isAdmin,
    userId: user.id
  }
}

export async function POST(request: NextRequest) {
  try {
    // 1. Verify authentication
    const auth = await verifyAuthentication(request)
    
    if (!auth.authenticated) {
      return NextResponse.json(
        { error: auth.error || "Authentication required" },
        { status: 401 },
      )
    }
    
    // 2. Apply rate limiting
    const clientIP = getClientIP(request)
    const rateLimitIdentifier = auth.userId 
      ? `receipt-resend:user:${auth.userId}`
      : `receipt-resend:ip:${clientIP || "unknown"}`
    
    const rateLimit = await checkRateLimit({
      identifier: rateLimitIdentifier,
      maxAttempts: auth.isAdmin ? 100 : 10, // Higher limit for admins
      windowMinutes: 60, // 1 hour window
    })
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { 
          error: "Rate limit exceeded. Please try again later.",
          retryAfter: rateLimit.resetAt?.toISOString()
        },
        { 
          status: 429,
          headers: {
            "Retry-After": rateLimit.resetAt 
              ? Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 1000).toString()
              : "3600"
          }
        },
      )
    }
    
    // 3. Parse and validate request body
    const body = await request.json()
    const { receiptNumber, email } = body

    if (!receiptNumber) {
      return NextResponse.json(
        { error: "Receipt number is required" },
        { status: 400 },
      )
    }

    const supabase = getServiceSupabase()

    // 4. Get donation by receipt number
    const { data: donation, error } = await supabase
      .from("donations")
      .select("id, donor_email")
      .eq("receipt_number", receiptNumber)
      .single()

    if (error || !donation) {
      return NextResponse.json(
        { error: "Receipt not found" },
        { status: 404 },
      )
    }
    
    // 5. Verify email matches donation (unless admin)
    if (!auth.isAdmin && email) {
      if (email.toLowerCase() !== donation.donor_email.toLowerCase()) {
        return NextResponse.json(
          { error: "Email does not match donation record" },
          { status: 403 },
        )
      }
    }

    // 6. Resend email
    const result = await resendReceiptEmail(donation.id)

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      remaining: rateLimit.remaining - 1,
    })
  } catch (error) {
    console.error("Receipt resend error:", error)
    return NextResponse.json(
      { error: "Failed to resend receipt email" },
      { status: 500 },
    )
  }
}
