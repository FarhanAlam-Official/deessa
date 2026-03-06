# Stripe Payment Intent Enhancement - Quick Reference

## What Changed?

### For Donors
- New optional message field on donation form
- Can share why they're donating or leave a special message

### For Admin Team
- Direct links to Stripe dashboard (no more searching!)
- See all Stripe payment references in one place
- View donor messages in transaction details

---

## Quick Commands

### Run Migrations
```bash
# Production
psql -d production_db -f scripts/031-enhance-payments-stripe-references.sql
psql -d production_db -f scripts/032-add-provider-and-message-to-donations.sql

# Staging
psql -d staging_db -f scripts/031-enhance-payments-stripe-references.sql
psql -d staging_db -f scripts/032-add-provider-and-message-to-donations.sql
```

### Check Migration Status
```sql
-- Check if columns exist
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'payments' 
  AND column_name IN ('payment_intent_id', 'session_id');

-- Check data population
SELECT COUNT(*), COUNT(payment_intent_id) 
FROM payments WHERE provider = 'stripe';
```

### Verify New Donation
```sql
-- Get latest donation with all details
SELECT 
  d.id,
  d.donor_name,
  d.donor_message,
  d.provider,
  p.payment_intent_id,
  p.session_id
FROM donations d
LEFT JOIN payments p ON d.id = p.donation_id
ORDER BY d.created_at DESC
LIMIT 1;
```

---

## New Database Fields

### Payments Table
| Field | Type | Purpose |
|-------|------|---------|
| `payment_intent_id` | TEXT | Primary reference for refunds/disputes |
| `session_id` | TEXT | Checkout flow tracking |
| `subscription_id` | TEXT | Recurring payment management |
| `customer_id` | TEXT | Customer management |
| `invoice_id` | TEXT | Subscription billing |

### Donations Table
| Field | Type | Purpose |
|-------|------|---------|
| `provider` | TEXT | Payment provider (stripe, khalti, esewa) |
| `donor_message` | TEXT | Optional message from donor |

---

## Admin Panel Changes

### Transaction Detail Page

**New Fields Displayed:**
- Payment Intent ID (with copy button)
- Checkout Session ID (with copy button)
- Subscription ID (if applicable)
- Customer ID (with copy button)
- Donor Message (if provided)

**Dashboard Link:**
- Now goes directly to payment intent in Stripe
- Falls back to payments list if no payment intent ID

---

## Troubleshooting

### Dashboard Link Not Working
```sql
-- Check if payment_intent_id exists
SELECT payment_intent_id, session_id 
FROM payments 
WHERE donation_id = 'YOUR_DONATION_ID';
```
- If `payment_intent_id` is NULL, link will go to payments list
- If both are NULL, link won't work

### Donor Message Not Showing
```sql
-- Check if message was saved
SELECT donor_message 
FROM donations 
WHERE id = 'YOUR_DONATION_ID';
```
- If NULL, donor didn't enter a message
- Check form is sending `donorMessage` field

### Webhook Failures
```bash
# Check server logs
tail -f /var/log/app.log | grep stripe

# Check Stripe dashboard
# Go to Developers > Webhooks > View logs
```

---

## Useful Queries

### Find Donations Without Payment Intent
```sql
SELECT 
  d.id,
  d.created_at,
  p.session_id
FROM donations d
JOIN payments p ON d.id = p.donation_id
WHERE p.provider = 'stripe'
  AND p.payment_intent_id IS NULL
ORDER BY d.created_at DESC;
```

### Get Donor Messages
```sql
SELECT 
  donor_name,
  donor_email,
  donor_message,
  amount,
  created_at
FROM donations
WHERE donor_message IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;
```

### Check Recent Stripe Payments
```sql
SELECT 
  d.donor_name,
  d.amount,
  p.payment_intent_id,
  p.session_id,
  p.created_at
FROM payments p
JOIN donations d ON p.donation_id = d.id
WHERE p.provider = 'stripe'
  AND p.created_at > NOW() - INTERVAL '24 hours'
ORDER BY p.created_at DESC;
```

---

## Stripe Dashboard URLs

### Test Mode
- Payment Intent: `https://dashboard.stripe.com/test/payments/pi_xxx`
- Payments List: `https://dashboard.stripe.com/test/payments`

### Live Mode
- Payment Intent: `https://dashboard.stripe.com/payments/pi_xxx`
- Payments List: `https://dashboard.stripe.com/payments`

---

## Support Contacts

### Technical Issues
- Check server logs first
- Review Stripe webhook logs
- Contact DevOps team

### Database Issues
- Check migration status
- Verify column existence
- Contact Database team

### User Reports
- Check admin panel for transaction details
- Verify in Stripe dashboard
- Check donor message if provided

---

## Quick Links

- [Full Deployment Guide](./DEPLOYMENT_GUIDE_STRIPE_ENHANCEMENT.md)
- [Implementation Summary](./IMPLEMENTATION_SUMMARY.md)
- [Verification Checklist](./VERIFICATION_CHECKLIST.md)
- [Stripe Documentation](https://stripe.com/docs/api/payment_intents)

---

## Emergency Rollback

```bash
# Code rollback
git revert HEAD
git push origin main

# Database rollback (if absolutely necessary)
psql -d your_db -c "
ALTER TABLE payments DROP COLUMN IF EXISTS payment_intent_id;
ALTER TABLE donations DROP COLUMN IF EXISTS donor_message;
"
```

---

**Last Updated:** 2026-03-05
**Version:** 1.0
