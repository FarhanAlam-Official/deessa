"use server"

import { NextResponse } from "next/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { checkRateLimit, getClientIP } from "@/lib/rate-limit"

/**
 * eSewa Status Endpoint (Read-Only)
 * 
 * This endpoint provides read-only status checks for eSewa payments.
 * It does NOT mutate payment state - that is handled exclusively by callbacks.
 * 
 * Requirements: 24.2, 24.3
 * 
 * Flow:
 * 1. Accept transaction_uuid parameter
 * 2. Query donation by esewa_transaction_uuid
 * 3. Return current status (no mutation)
 */
export async function GET(request: Request) {
  try {
    // 1. Apply distributed rate limiting (10 requests per minute per IP)
    const clientIP = getClientIP(request)
    const rateLimitIdentifier = clientIP 
      ? `esewa-status:ip:${clientIP}`
      : `esewa-status:ip:unknown`
    
    const rateLimit = await checkRateLimit({
      identifier: rateLimitIdentifier,
      maxAttempts: 10,
      windowMinutes: 1,
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
              : "60"
          }
        },
      )
    }

    // 2. Validate transaction_uuid parameter
    const { searchParams } = new URL(request.url)
    const transactionUuid = searchParams.get("transaction_uuid")

    if (!transactionUuid || typeof transactionUuid !== "string" || transactionUuid.trim().length === 0) {
      return NextResponse.json(
        { 
          error: "Missing or invalid transaction_uuid parameter",
          status: null
        },
        { status: 400 }
      )
    }

    // 3. Query donation by esewa_transaction_uuid (read-only)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      )
    }

    const supabase = createServiceClient(supabaseUrl, serviceRoleKey)

    let { data: donation, error: queryError } = await supabase
      .from("donations")
      .select("id, amount, currency, donor_name, donor_email, donor_phone, is_monthly, payment_status, provider_ref, esewa_transaction_uuid, created_at")
      .eq("esewa_transaction_uuid", transactionUuid)
      .maybeSingle()

    // Fallback: search by provider_ref (also stores the transaction_uuid)
    if (!donation) {
      const { data: byRef } = await supabase
        .from("donations")
        .select("id, amount, currency, donor_name, donor_email, donor_phone, is_monthly, payment_status, provider_ref, esewa_transaction_uuid, created_at")
        .eq("provider_ref", transactionUuid)
        .maybeSingle()
      if (byRef) {
        donation = byRef
        queryError = null
      }
    }

    if (queryError || !donation) {
      return NextResponse.json(
        { 
          success: false,
          error: "Donation not found",
          status: null
        },
        { status: 404 }
      )
    }

    // 4. Return current status (no mutation)
    return NextResponse.json({
      success: true,
      donation: {
        id: donation.id,
        amount: donation.amount,
        currency: donation.currency,
        donor_name: donation.donor_name,
        donor_email: donation.donor_email,
        donor_phone: donation.donor_phone,
        is_monthly: donation.is_monthly,
        payment_status: donation.payment_status,
        provider_ref: donation.provider_ref,
        esewa_transaction_uuid: donation.esewa_transaction_uuid,
        created_at: donation.created_at,
      },
      status: donation.payment_status,
    })

  } catch (error) {
    console.error("eSewa status check error:", error)
    return NextResponse.json(
      { 
        success: false,
        error: "Internal server error during status check",
        status: null
      },
      { status: 500 }
    )
  }
}
