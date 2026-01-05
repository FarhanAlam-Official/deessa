# Payment Status Update Fix

## Problem

After successful Stripe payments, donation status remained "pending" instead of updating to "completed".

## Root Cause

In development/local environments, Stripe webhooks cannot reach the local server to update the donation status automatically. The webhook endpoint at `/api/webhooks/stripe` only works when deployed with a public URL that Stripe can access.

## Solution

Added a fallback mechanism in the Stripe verification endpoint (`/api/payments/stripe/verify/route.ts`) that:

1. **Checks the Stripe session status** when verifying the payment
2. **Updates the donation status** to "completed" if:
   - The payment session shows as paid/complete
   - The donation is still in "pending" status
   - This happens during verification (success page load)

This ensures donations are marked as completed even in development where webhooks don't work.

## How It Works

### Production Flow (with webhooks)

```bash
1. User completes payment on Stripe
2. Stripe sends webhook → /api/webhooks/stripe
3. Webhook updates donation status to "completed"
4. User redirected to success page
5. Success page verifies and shows "completed" status
```

### Development Flow (without webhooks) - FIXED

```bash
1. User completes payment on Stripe
2. Webhook cannot reach local server (expected)
3. User redirected to success page
4. Success page calls /api/payments/stripe/verify
5. Verify endpoint checks Stripe session
6. ✅ NEW: Verify endpoint updates status to "completed"
7. Success page shows "completed" status
```

## Files Modified

### `/app/api/payments/stripe/verify/route.ts`

Added:

- Service role client creation function (bypasses RLS)
- Payment completion check logic
- Automatic status update during verification
- Proper error handling

**Key Changes:**

```typescript
// Check if payment was completed
const isPaymentComplete = 
  session?.payment_status === "paid" || 
  session?.status === "complete" ||
  (mode === "mock" && session?.status === "complete")

if (isPaymentComplete) {
  // Update donation status using service role (bypasses RLS)
  const serviceSupabase = createServiceRoleClient()
  await serviceSupabase
    .from("donations")
    .update({
      payment_status: "completed",
      payment_id: `stripe:${session?.id}`,
    })
    .eq("id", donationId)
}
```

## Testing

### Test in Development

1. Start the dev server: `pnpm run dev`
2. Go to `/donate`
3. Select Stripe payment
4. Enter test amount (e.g., $50)
5. Complete payment (use Stripe test cards)
6. You should be redirected to success page
7. ✅ Status should now show "completed" immediately
8. Check admin dashboard `/admin/donations`
9. ✅ Donation should show as "completed"

### Test Cards (Stripe)

- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Authentication: `4000 0025 0000 3155`

Use any future expiry date, any CVC, any postal code.

## Environment Variables Required

```env
# Required for Stripe payments
STRIPE_SECRET_KEY=sk_test_...

# Required for webhook verification (production only)
STRIPE_WEBHOOK_SECRET=whsec_...

# Required for status updates
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
NEXT_PUBLIC_SUPABASE_URL=https://....supabase.co
```

## Webhook Setup (Production)

When deploying to production, set up Stripe webhooks:

1. Go to Stripe Dashboard → Webhooks
2. Add endpoint: `https://yourdomain.com/api/webhooks/stripe`
3. Select events:
   - `checkout.session.completed`
   - `checkout.session.expired`
   - `payment_intent.payment_failed`
   - `customer.subscription.created`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy webhook signing secret
5. Add to `.env`: `STRIPE_WEBHOOK_SECRET=whsec_...`

## Other Payment Providers

### Khalti ✅

Already handles status updates correctly in `/api/payments/khalti/verify/route.ts`

### eSewa ✅

Already handles status updates correctly in `/api/payments/esewa/success/route.ts`

## Troubleshooting

### Status still showing as "pending"?

1. **Check console logs:**

   ```bash
   # Look for errors in the terminal where dev server is running
   # Should see: "Failed to update donation status: ..." if there's an issue
   ```

2. **Check Supabase service role key:**

   ```bash
   # In .env file, ensure this is set:
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
   ```

3. **Check RLS policies:**

   ```sql
   -- In Supabase SQL Editor, verify insert policy exists:
   SELECT * FROM pg_policies WHERE tablename = 'donations';
   ```

4. **Manual status update:**

   ```sql
   -- Update specific donation to completed:
   UPDATE donations 
   SET payment_status = 'completed',
       payment_id = 'stripe:cs_test_...'
   WHERE id = 'your-donation-id';
   ```

### How to verify webhook is working (production)?

1. Go to Stripe Dashboard → Webhooks
2. Click on your webhook endpoint
3. Check "Recent deliveries" tab
4. Should see successful (200) responses for events

### Mock mode not working?

Check your `.env` file:

```env
PAYMENT_MODE=mock  # or 'live'
```

## Related Files

- `/app/api/payments/stripe/verify/route.ts` - **MODIFIED** - Added status update
- `/app/api/webhooks/stripe/route.ts` - Webhook handler (production)
- `/lib/payments/stripe.ts` - Stripe integration logic
- `/app/(public)/donate/success/success-content.tsx` - Success page display
- `/lib/payments/config.ts` - Payment mode configuration

## Benefits

1. ✅ Works in development without ngrok/tunneling
2. ✅ Doesn't require webhook setup for local testing
3. ✅ Backwards compatible with production webhooks
4. ✅ Prevents "stuck" pending donations
5. ✅ Provides immediate feedback to users

## Notes

- Webhooks are still the primary method in production (more reliable)
- Verification endpoint acts as a fallback for local dev
- Uses service role client to bypass RLS policies
- Only updates status if payment is truly completed
- Idempotent (safe to call multiple times)
