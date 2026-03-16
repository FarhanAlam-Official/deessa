import { NextResponse } from "next/server";

/**
 * Webhook Diagnostic Endpoint
 * 
 * This endpoint helps administrators verify that all required environment
 * variables are configured correctly for Stripe webhook processing.
 * 
 * Usage:
 *   GET /api/webhooks/stripe/test
 * 
 * Returns:
 *   JSON object with configuration status for each required variable
 * 
 * Security:
 *   - Does not expose actual secret values
 *   - Only returns boolean flags indicating presence
 *   - Safe to use in production for diagnostics
 */
export async function GET() {
  const diagnostics = {
    stripeSecretKey: !!process.env.STRIPE_SECRET_KEY,
    webhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
    supabaseServiceRole: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    paymentMode: process.env.PAYMENT_MODE || "not_set",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "unknown",
  };

  // Check if all critical variables are present
  const allConfigured =
    diagnostics.stripeSecretKey &&
    diagnostics.webhookSecret &&
    diagnostics.supabaseServiceRole &&
    diagnostics.supabaseUrl;

  return NextResponse.json(
    {
      status: allConfigured ? "ok" : "missing_configuration",
      diagnostics,
      message: allConfigured
        ? "All required environment variables are configured"
        : "Some required environment variables are missing. Check the diagnostics object for details.",
    },
    { status: allConfigured ? 200 : 500 }
  );
}
