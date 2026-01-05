# Stripe Payment Integration Setup Guide

This guide will help you set up Stripe payment integration for the Deesha Foundation donation page.

## Overview

Your project already has Stripe payment integration built in! This guide will help you configure it properly.

## 🎯 What's Already Implemented

✅ Stripe checkout flow in the donation form  
✅ Webhook handling for payment verification  
✅ One-time and recurring donations support  
✅ Multi-currency support (USD/NPR)  
✅ Success and cancel pages  
✅ Mock mode for testing without API keys  

## 📋 Prerequisites

- A Stripe account (sign up at [stripe.com](https://stripe.com))
- Node.js and npm/pnpm installed
- Access to your Supabase database

## 🚀 Quick Start

### Step 1: Create a Stripe Account

1. Go to [https://stripe.com](https://stripe.com)
2. Sign up for a free account
3. Complete the account verification (for production use)

### Step 2: Get Your Stripe API Keys

1. Log in to your [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Developers** → **API keys**
3. You'll see two keys:
   - **Publishable key** (starts with `pk_test_` or `pk_live_`)
   - **Secret key** (starts with `sk_test_` or `sk_live_`)

### Step 3: Configure Environment Variables

1. Create a `.env.local` file in your project root (if it doesn't exist)
2. Add the following variables:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_secret_key_here

# Stripe Webhook Secret (we'll get this in Step 5)
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Payment Mode
PAYMENT_MODE=mock  # Change to "live" when ready for production

# Site URL (important for redirects)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Step 4: Test in Mock Mode

The system is set to `PAYMENT_MODE=mock` by default, which lets you test the flow without real Stripe API keys:

1. Run your development server:
   ```bash
   pnpm run dev
   ```

2. Navigate to `http://localhost:3000/donate`

3. Fill out the donation form and submit

4. You'll be redirected to a success page (no actual charge is made)

### Step 5: Set Up Stripe Webhooks (For Production)

Webhooks allow Stripe to notify your application when payment events occur.

#### Local Development (Using Stripe CLI)

1. Install the Stripe CLI:
   - Windows: Download from [https://github.com/stripe/stripe-cli/releases](https://github.com/stripe/stripe-cli/releases)
   - Mac: `brew install stripe/stripe-cli/stripe`
   - Linux: See [Stripe CLI docs](https://stripe.com/docs/stripe-cli)

2. Log in to Stripe CLI:
   ```bash
   stripe login
   ```

3. Forward webhooks to your local server:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

4. Copy the webhook signing secret (starts with `whsec_`) and add it to `.env.local`:
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_signing_secret
   ```

#### Production Deployment

1. Deploy your application to production

2. In your [Stripe Dashboard](https://dashboard.stripe.com):
   - Go to **Developers** → **Webhooks**
   - Click **Add endpoint**
   - Enter your webhook URL: `https://yourdomain.com/api/webhooks/stripe`
   - Select events to listen to:
     - `checkout.session.completed`
     - `checkout.session.expired`
     - `payment_intent.payment_failed`

3. Copy the **Signing secret** and add it to your production environment variables

### Step 6: Enable Live Mode

When you're ready to accept real payments:

1. Complete your Stripe account activation (verify business details, add bank account, etc.)

2. Update your environment variables to use **live** keys:
   ```bash
   STRIPE_SECRET_KEY=sk_live_your_live_secret_key
   STRIPE_WEBHOOK_SECRET=whsec_your_live_webhook_secret
   PAYMENT_MODE=live
   NEXT_PUBLIC_SITE_URL=https://yourdomain.com
   ```

3. Update webhook endpoints to point to your production domain

4. Test with a real card (Stripe provides test cards even in live mode for testing)

## 🧪 Testing

### Test Card Numbers (Test Mode)

Use these test cards in test mode:

| Card Number         | Description          |
|---------------------|----------------------|
| 4242 4242 4242 4242 | Success              |
| 4000 0000 0000 0002 | Card declined        |
| 4000 0000 0000 9995 | Insufficient funds   |

- Use any future expiry date (e.g., 12/34)
- Use any 3-digit CVC
- Use any ZIP code

### Testing the Flow

1. Go to `/donate`
2. Select an amount or enter a custom amount
3. Fill in donor information
4. Select "Stripe (Card, USD)" as payment method
5. Click "Donate"
6. Complete the Stripe checkout (use test card in test mode)
7. You'll be redirected to `/donate/success`

## 📊 Monitoring Payments

### In Your Stripe Dashboard

1. Go to **Payments** to see all transactions
2. Check **Customers** for donor information
3. View **Events** for webhook activity
4. Check **Logs** for API request details

### In Your Database

Payment records are stored in the `donations` table in Supabase:

```sql
SELECT * FROM donations ORDER BY created_at DESC;
```

Payment statuses:
- `pending` - Payment initiated but not completed
- `completed` - Payment successful (updated via webhook)
- `failed` - Payment failed

## 🔒 Security Best Practices

1. **Never commit `.env.local`** to version control
2. **Use environment-specific keys** (test keys for development, live keys for production)
3. **Verify webhook signatures** (already implemented in the webhook handler)
4. **Use HTTPS in production** for webhook endpoints
5. **Keep your secret keys secure** - never expose them in client-side code

## 🎨 Customization

### Changing Payment Success/Cancel URLs

Edit the URLs in [lib/payments/stripe.ts](lib/payments/stripe.ts):

```typescript
const successUrl = process.env.STRIPE_SUCCESS_URL || 
  `${process.env.NEXT_PUBLIC_SITE_URL}/donate/success`
const cancelUrl = process.env.STRIPE_CANCEL_URL || 
  `${process.env.NEXT_PUBLIC_SITE_URL}/donate/cancel`
```

### Customizing the Checkout Page

Stripe Checkout is hosted by Stripe, but you can customize:
- Logo (in Stripe Dashboard → Branding)
- Colors (in Stripe Dashboard → Branding)
- Payment methods accepted

### Customizing Donation Amounts

Edit [app/(public)/donate/page.tsx](app/(public)/donate/page.tsx):

```typescript
const donationTiers = [
  { amount: 25, impact: "School supplies for 5 children", icon: "📚" },
  { amount: 50, impact: "Medical checkup for a family", icon: "🏥" },
  // Add more tiers...
]
```

## 🐛 Troubleshooting

### "No redirect URL generated for donation"

- Check that `STRIPE_SECRET_KEY` is set correctly
- Ensure you're using the correct key for your mode (test vs live)
- Check console logs for specific Stripe API errors

### Webhook not receiving events

- Verify webhook URL is correct and accessible
- Check that `STRIPE_WEBHOOK_SECRET` matches your endpoint
- Verify your webhook endpoint is listening to the correct events
- Check Stripe Dashboard → Webhooks → Recent events for delivery status

### "STRIPE_SECRET_KEY is not configured"

- Ensure `.env.local` exists in your project root
- Check that the variable name is exactly `STRIPE_SECRET_KEY`
- Restart your dev server after adding environment variables

### Payment successful but status not updating

- Check webhook is configured and receiving events
- Verify `STRIPE_WEBHOOK_SECRET` is correct
- Check webhook handler logs in your server console
- Check Stripe Dashboard → Webhooks → Recent events for errors

## 📚 Additional Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Checkout Guide](https://stripe.com/docs/payments/checkout)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Stripe Testing Guide](https://stripe.com/docs/testing)

## 🆘 Need Help?

If you encounter issues:

1. Check the [Stripe Logs](https://dashboard.stripe.com/logs) in your dashboard
2. Review server console logs for errors
3. Consult the [Stripe API Reference](https://stripe.com/docs/api)
4. Contact Stripe Support (they're very responsive!)

## ✅ Launch Checklist

Before going live with real payments:

- [ ] Stripe account fully activated
- [ ] Live API keys configured in production environment
- [ ] Webhooks configured with production URL
- [ ] SSL/HTTPS enabled on production domain
- [ ] Test transactions completed successfully
- [ ] Success and cancel pages tested
- [ ] Database correctly recording donations
- [ ] Email receipts being sent (if configured)
- [ ] Stripe branding customized
- [ ] Terms and privacy policy updated
- [ ] Payment flow tested end-to-end

---

**Ready to accept donations!** 🎉
