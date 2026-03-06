# Credential Rotation Checklist

Quick reference checklist for quarterly credential rotation.

**Last Rotation Date:** _____________  
**Next Rotation Due:** _____________  
**Rotated By:** _____________

## Pre-Rotation

- [ ] Schedule maintenance window
- [ ] Notify team members
- [ ] Backup current .env files (securely)
- [ ] Verify admin access to all provider dashboards
- [ ] Review rollback procedures

## Stripe Webhook Secret

- [ ] Log in to Stripe Dashboard
- [ ] Navigate to Developers → Webhooks
- [ ] Click "Roll secret" on webhook endpoint
- [ ] Copy new webhook secret (starts with `whsec_`)
- [ ] Update `STRIPE_WEBHOOK_SECRET` in staging
- [ ] Deploy to staging
- [ ] Test webhook with Stripe CLI or test payment
- [ ] Verify signature verification succeeds
- [ ] Update `STRIPE_WEBHOOK_SECRET` in production
- [ ] Deploy to production
- [ ] Test production webhook
- [ ] Document old secret for 24hr rollback window

## Khalti Secret Key

- [ ] Log in to Khalti Merchant Dashboard
- [ ] Navigate to Settings → API Keys
- [ ] Click "Regenerate Secret Key"
- [ ] Copy new secret key
- [ ] Update `KHALTI_SECRET_KEY` in staging
- [ ] Deploy to staging
- [ ] Test Khalti payment flow
- [ ] Verify API authentication succeeds
- [ ] Update `KHALTI_SECRET_KEY` in production
- [ ] Deploy to production
- [ ] Test production payment
- [ ] Note: Old key invalidated immediately

## eSewa Secret Key

- [ ] Log in to eSewa Merchant Dashboard
- [ ] Navigate to Settings → API Configuration
- [ ] Click "Regenerate Secret Key"
- [ ] Copy new secret key
- [ ] Update `ESEWA_SECRET_KEY` in staging
- [ ] Deploy to staging
- [ ] Test eSewa payment flow
- [ ] Verify HMAC signature verification succeeds
- [ ] Test failure callback security
- [ ] Update `ESEWA_SECRET_KEY` in production
- [ ] Deploy to production
- [ ] Test production payment
- [ ] Document old secret for rollback window

## Receipt Token Secret

- [ ] Generate new secret: `openssl rand -base64 32`
- [ ] Update `RECEIPT_TOKEN_SECRET` in staging
- [ ] Deploy to staging
- [ ] Test receipt token generation
- [ ] Test receipt download with token
- [ ] Verify invalid tokens are rejected
- [ ] Update `RECEIPT_TOKEN_SECRET` in production
- [ ] Deploy to production
- [ ] Test production receipt downloads
- [ ] Verify old tokens are invalidated

## Verification

- [ ] All webhook signatures verified successfully
- [ ] All API authentications successful
- [ ] Receipt downloads require authentication
- [ ] Invalid tokens/signatures rejected
- [ ] No mock bypasses active in production
- [ ] Rate limiting functional

## Post-Rotation

- [ ] Run end-to-end tests for all providers
- [ ] Monitor logs for authentication errors
- [ ] Verify no stuck donations
- [ ] Update rotation documentation
- [ ] Schedule next rotation (90 days)
- [ ] Securely destroy old credentials

## Emergency Contacts

- **Stripe Support:** https://support.stripe.com/
- **Khalti Support:** support@khalti.com
- **eSewa Support:** https://esewa.com.np/support
- **Internal DevOps:** _____________

## Notes

_Use this space to document any issues or observations during rotation:_

---

**Rotation Completed:** ☐ Yes ☐ No  
**Issues Encountered:** ☐ Yes ☐ No  
**Rollback Required:** ☐ Yes ☐ No

---

For detailed procedures, see: [CREDENTIAL_ROTATION_GUIDE.md](./CREDENTIAL_ROTATION_GUIDE.md)
