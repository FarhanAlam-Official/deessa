# Receipt System - Webhook Integration Guide

## Overview

This guide shows how to integrate receipt generation with your payment webhook handlers for Stripe, Khalti, and eSewa.

## General Pattern

After payment is confirmed by the webhook, call:

```typescript
import { generateReceiptForDonation } from "@/lib/actions/donation-receipt"

// After payment confirmation
const receiptResult = await generateReceiptForDonation({
  donationId: donation.id
})

if (receiptResult.success) {
  console.log(`Receipt generated: ${receiptResult.receiptNumber}`)
} else {
  console.error(`Receipt generation failed: ${receiptResult.message}`)
}
```

## Stripe Integration

### Webhook Handler Location
`app/api/webhooks/stripe/route.ts` (or similar)

### Integration Code

```typescript
import { generateReceiptForDonation } from "@/lib/actions/donation-receipt"
import Stripe from "stripe"

export async function POST(request: Request) {
  const body = await request.text()
  const sig = request.headers.get("stripe-signature")!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!,
    )
  } catch (err) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 })
  }

  // Handle checkout.session.completed
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session

    // Get donation ID from client_reference_id
    const donationId = session.client_reference_id

    if (donationId && session.payment_status === "paid") {
      // Update donation status
      await supabase
        .from("donations")
        .update({ payment_status: "completed" })
        .eq("id", donationId)

      // Generate receipt
      const receiptResult = await generateReceiptForDonation({
        donationId,
      })

      if (!receiptResult.success) {
        console.error(`Receipt generation failed for ${donationId}:`, receiptResult.message)
        // Don't fail the webhook - receipt can be generated later
      }
    }
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 })
}
```

## Khalti Integration

### Webhook Handler Location
`app/api/webhooks/khalti/route.ts` (or similar)

### Integration Code

```typescript
import { generateReceiptForDonation } from "@/lib/actions/donation-receipt"

export async function POST(request: Request) {
  const body = await request.json()

  // Verify webhook signature
  const signature = request.headers.get("x-khalti-signature")
  if (!verifyKhaltiSignature(body, signature)) {
    return new Response("Invalid signature", { status: 401 })
  }

  // Handle payment success
  if (body.event_type === "payment.success") {
    const pidx = body.data.pidx

    // Find donation by khalti_pidx
    const { data: donation } = await supabase
      .from("donations")
      .select("id")
      .eq("khalti_pidx", pidx)
      .single()

    if (donation) {
      // Update donation status
      await supabase
        .from("donations")
        .update({ payment_status: "completed" })
        .eq("id", donation.id)

      // Generate receipt
      const receiptResult = await generateReceiptForDonation({
        donationId: donation.id,
      })

      if (!receiptResult.success) {
        console.error(`Receipt generation failed for ${donation.id}:`, receiptResult.message)
      }
    }
  }

  return new Response(JSON.stringify({ success: true }), { status: 200 })
}
```

## eSewa Integration

### Webhook Handler Location
`app/api/webhooks/esewa/route.ts` (or similar)

### Integration Code

```typescript
import { generateReceiptForDonation } from "@/lib/actions/donation-receipt"

export async function POST(request: Request) {
  const body = await request.json()

  // Verify webhook signature
  const signature = request.headers.get("x-esewa-signature")
  if (!verifyEsewaSignature(body, signature)) {
    return new Response("Invalid signature", { status: 401 })
  }

  // Handle payment success
  if (body.status === "COMPLETE") {
    const transactionUuid = body.transaction_uuid

    // Find donation by esewa_transaction_uuid
    const { data: donation } = await supabase
      .from("donations")
      .select("id")
      .eq("esewa_transaction_uuid", transactionUuid)
      .single()

    if (donation) {
      // Update donation status
      await supabase
        .from("donations")
        .update({ payment_status: "completed" })
        .eq("id", donation.id)

      // Generate receipt
      const receiptResult = await generateReceiptForDonation({
        donationId: donation.id,
      })

      if (!receiptResult.success) {
        console.error(`Receipt generation failed for ${donation.id}:`, receiptResult.message)
      }
    }
  }

  return new Response(JSON.stringify({ success: true }), { status: 200 })
}
```

## Error Handling

### Graceful Degradation

Receipt generation failures should not fail the webhook:

```typescript
try {
  const receiptResult = await generateReceiptForDonation({
    donationId,
  })

  if (!receiptResult.success) {
    // Log error but don't fail webhook
    console.error("Receipt generation failed:", receiptResult.message)
    // Could send alert to admin
  }
} catch (error) {
  // Log error but don't fail webhook
  console.error("Receipt generation error:", error)
  // Could send alert to admin
}
```

### Retry Logic

If receipt generation fails, it can be retried:

```typescript
// Manual retry (can be called from admin)
const retryResult = await generateReceiptForDonation({
  donationId: "failed-donation-id"
})
```

## Testing Webhooks

### Local Testing with Stripe CLI

```bash
# Start Stripe CLI
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Trigger test event
stripe trigger payment_intent.succeeded
```

### Testing Receipt Generation

```typescript
// Test in your webhook handler
const testResult = await generateReceiptForDonation({
  donationId: "test-donation-id"
})

console.log("Receipt generation test:", testResult)
```

## Monitoring

### Check Receipt Generation Status

```typescript
// In admin dashboard or monitoring script
const { data: donations } = await supabase
  .from("donations")
  .select("id, receipt_number, receipt_generated_at, payment_status")
  .eq("payment_status", "completed")
  .is("receipt_number", null)

console.log("Donations without receipts:", donations)
```

### View Audit Log

```typescript
// Check receipt actions
const { data: logs } = await supabase
  .from("receipt_audit_log")
  .select("*")
  .order("created_at", { ascending: false })
  .limit(100)

console.log("Recent receipt actions:", logs)
```

## Troubleshooting

### Receipt Not Generated

1. Check donation payment_status is "completed"
2. Verify organization details are configured
3. Check Supabase Storage bucket exists
4. Review server logs for errors

```typescript
// Debug: Check donation status
const { data: donation } = await supabase
  .from("donations")
  .select("*")
  .eq("id", donationId)
  .single()

console.log("Donation status:", donation.payment_status)
console.log("Receipt number:", donation.receipt_number)
```

### Email Not Sent

1. Verify email service is configured
2. Check EMAIL_FROM environment variable
3. Verify donor email is valid
4. Check email service API key

```typescript
// Debug: Check email configuration
console.log("Email service:", process.env.EMAIL_SERVICE)
console.log("Email from:", process.env.EMAIL_FROM)
```

## Best Practices

✅ **Always verify webhook signatures**
- Prevents unauthorized webhook calls
- Ensures data integrity

✅ **Don't fail webhooks on receipt errors**
- Receipts can be generated later
- Payment confirmation is more important

✅ **Log all receipt actions**
- Helps with debugging
- Provides audit trail

✅ **Handle edge cases**
- Duplicate webhook calls
- Missing donation records
- Invalid email addresses

✅ **Monitor receipt generation**
- Check for failed receipts
- Alert on errors
- Track success rate

## Example: Complete Webhook Handler

```typescript
import { generateReceiptForDonation } from "@/lib/actions/donation-receipt"
import { createClient } from "@/lib/supabase/server"

export async function handlePaymentSuccess(
  donationId: string,
  paymentStatus: string,
) {
  const supabase = await createClient()

  try {
    // 1. Update donation status
    const { error: updateError } = await supabase
      .from("donations")
      .update({ payment_status: "completed" })
      .eq("id", donationId)

    if (updateError) {
      console.error("Failed to update donation:", updateError)
      return { success: false, error: "Failed to update donation" }
    }

    // 2. Generate receipt
    const receiptResult = await generateReceiptForDonation({
      donationId,
    })

    if (!receiptResult.success) {
      console.warn("Receipt generation failed:", receiptResult.message)
      // Don't fail - receipt can be generated later
    }

    // 3. Log success
    console.log(`Payment processed for donation ${donationId}`)

    return {
      success: true,
      receiptNumber: receiptResult.receiptNumber,
    }
  } catch (error) {
    console.error("Payment processing error:", error)
    return { success: false, error: "Payment processing failed" }
  }
}
```

## Next Steps

1. Add receipt generation to your webhook handlers
2. Test with test payments
3. Monitor receipt generation
4. Set up alerts for failures
5. Gather donor feedback

## Support

For issues:
1. Check server logs
2. Review database records
3. Check email service logs
4. See `docs/RECEIPT_SYSTEM.md` for detailed documentation
