# Credential Rotation Guide

## Overview

This guide provides step-by-step instructions for rotating all payment system credentials. Credential rotation is a critical security practice that should be performed:

- **Immediately** before production deployment
- **Quarterly** as part of routine security maintenance
- **Immediately** if credentials are suspected to be compromised
- **After** any team member with credential access leaves the organization

## Pre-Rotation Checklist

Before starting credential rotation:

- [ ] Schedule a maintenance window (recommended: low-traffic period)
- [ ] Notify team members of the rotation schedule
- [ ] Ensure you have admin access to all provider dashboards
- [ ] Have access to all deployment environments (staging, production)
- [ ] Backup current `.env` files (store securely, not in git)
- [ ] Prepare rollback plan in case of issues

## Rotation Procedures

### 1. Stripe Webhook Secret Rotation

**Purpose:** Ensures only authorized Stripe webhooks can trigger payment confirmations.

**Steps:**

1. **Generate New Webhook Secret in Stripe Dashboard**
   - Log in to [Stripe Dashboard](https://dashboard.stripe.com/)
   - Navigate to **Developers** → **Webhooks**
   - Locate your webhook endpoint (e.g., `https://yourdomain.com/api/webhooks/stripe`)
   - Click on the webhook endpoint
   - Click **Roll secret** button
   - Copy the new webhook signing secret (starts with `whsec_`)

2. **Update Environment Variables**
   
   **Staging Environment:**
   ```bash
   # Update .env or deployment platform
   STRIPE_WEBHOOK_SECRET=whsec_new_secret_here
   ```
   
   **Production Environment:**
   ```bash
   # Update via Vercel/deployment platform
   vercel env add STRIPE_WEBHOOK_SECRET production
   # Paste the new secret when prompted
   ```

3. **Deploy Changes**
   ```bash
   # Staging
   vercel --prod --scope=your-team
   
   # Production (after staging validation)
   vercel --prod
   ```

4. **Test Webhook Signature Verification**
   
   **Option A: Use Stripe CLI**
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   stripe trigger checkout.session.completed
   ```
   
   **Option B: Test with Real Payment**
   - Make a small test donation ($1)
   - Verify webhook is received and processed
   - Check logs for signature verification success
   - Verify donation status updates to CONFIRMED

5. **Verify in Logs**
   ```bash
   # Check application logs for successful webhook processing
   # Look for: "Stripe webhook signature verified successfully"
   ```

6. **Rollback Plan**
   - If verification fails, revert to old secret immediately
   - Stripe keeps old secret active for 24 hours after rolling
   - Update environment variable back to old value
   - Redeploy

**Validation Checklist:**
- [ ] New secret deployed to all environments
- [ ] Test webhook received and verified
- [ ] Test donation completes successfully
- [ ] No signature verification errors in logs
- [ ] Old secret documented for emergency rollback (24hr window)

---

### 2. Khalti Secret Key Rotation

**Purpose:** Secures server-side API authentication with Khalti payment gateway.

**Steps:**

1. **Generate New Secret Key in Khalti Dashboard**
   - Log in to [Khalti Merchant Dashboard](https://khalti.com/)
   - Navigate to **Settings** → **API Keys**
   - Click **Regenerate Secret Key**
   - Copy the new secret key
   - **Important:** Old key is immediately invalidated

2. **Update Environment Variables**
   
   **Staging Environment:**
   ```bash
   KHALTI_SECRET_KEY=your_new_khalti_secret_key
   ```
   
   **Production Environment:**
   ```bash
   vercel env add KHALTI_SECRET_KEY production
   ```

3. **Deploy Changes**
   ```bash
   # Deploy to staging first
   vercel --prod --scope=your-team
   
   # After validation, deploy to production
   vercel --prod
   ```

4. **Test API Authentication**
   
   **Option A: Test Verification Endpoint**
   ```bash
   # Make a test payment and verify
   curl -X POST https://yourdomain.com/api/payments/khalti/verify \
     -H "Content-Type: application/json" \
     -d '{"pidx": "test_pidx_from_khalti", "donationId": "test_donation_id"}'
   ```
   
   **Option B: End-to-End Test**
   - Initiate a test donation with Khalti
   - Complete payment in Khalti sandbox
   - Verify payment confirmation succeeds
   - Check logs for successful API authentication

5. **Verify in Logs**
   ```bash
   # Check for successful Khalti API calls
   # Look for: "Khalti transaction verified successfully"
   ```

6. **Rollback Plan**
   - **Critical:** Khalti invalidates old key immediately
   - If issues occur, contact Khalti support to restore old key
   - Or generate another new key and redeploy quickly
   - Keep Khalti support contact info handy during rotation

**Validation Checklist:**
- [ ] New secret deployed to all environments
- [ ] Test payment initiated successfully
- [ ] Khalti API lookup succeeds
- [ ] Payment verification completes
- [ ] No authentication errors in logs

---

### 3. eSewa Secret Key Rotation

**Purpose:** Secures HMAC signature verification for eSewa payment callbacks.

**Steps:**

1. **Generate New Secret Key in eSewa Dashboard**
   - Log in to [eSewa Merchant Dashboard](https://esewa.com.np/)
   - Navigate to **Settings** → **API Configuration**
   - Click **Regenerate Secret Key**
   - Copy the new secret key
   - Note: Old key may remain valid for 24 hours (verify with eSewa)

2. **Update Environment Variables**
   
   **Staging Environment:**
   ```bash
   ESEWA_SECRET_KEY=your_new_esewa_secret_key
   ```
   
   **Production Environment:**
   ```bash
   vercel env add ESEWA_SECRET_KEY production
   ```

3. **Deploy Changes**
   ```bash
   # Deploy to staging
   vercel --prod --scope=your-team
   
   # Deploy to production after validation
   vercel --prod
   ```

4. **Test HMAC Signature Verification**
   
   **Option A: Test Success Callback**
   ```bash
   # Simulate eSewa callback (requires valid signature)
   # Use eSewa sandbox environment
   ```
   
   **Option B: End-to-End Test**
   - Initiate test donation with eSewa
   - Complete payment in eSewa sandbox
   - Verify success callback is received
   - Verify HMAC signature verification succeeds
   - Verify donation status updates to CONFIRMED

5. **Verify in Logs**
   ```bash
   # Check for successful HMAC verification
   # Look for: "eSewa HMAC signature verified successfully"
   ```

6. **Test Failure Callback Security**
   - Verify failure callback also requires valid signature
   - Attempt callback without signature (should be rejected)
   - Verify no unauthorized status updates possible

7. **Rollback Plan**
   - If verification fails, revert to old secret
   - Check with eSewa if old key is still valid
   - Update environment variable back to old value
   - Redeploy immediately

**Validation Checklist:**
- [ ] New secret deployed to all environments
- [ ] Test payment success callback verified
- [ ] Test payment failure callback verified
- [ ] HMAC signature verification succeeds
- [ ] Invalid signatures are rejected
- [ ] No signature verification errors in logs

---

### 4. Receipt Token Secret Generation

**Purpose:** Secures JWT tokens used for authenticated receipt downloads.

**Steps:**

1. **Generate Random Secret**
   
   **Using OpenSSL (Recommended):**
   ```bash
   openssl rand -base64 32
   ```
   
   **Using Node.js:**
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```
   
   **Using PowerShell (Windows):**
   ```powershell
   [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
   ```
   
   **Example Output:**
   ```
   Kx7jP9mN2vL5wQ8rT4yU6iO1pA3sD0fG7hJ9kM2nB5vC8xZ1qW4eR6tY3uI0oP==
   ```

2. **Add to Environment Variables**
   
   **Staging Environment:**
   ```bash
   RECEIPT_TOKEN_SECRET=Kx7jP9mN2vL5wQ8rT4yU6iO1pA3sD0fG7hJ9kM2nB5vC8xZ1qW4eR6tY3uI0oP==
   ```
   
   **Production Environment:**
   ```bash
   vercel env add RECEIPT_TOKEN_SECRET production
   # Paste the generated secret when prompted
   ```

3. **Update .env.example**
   ```bash
   # Verify .env.example has placeholder (don't put real secret here)
   RECEIPT_TOKEN_SECRET=your-strong-random-secret-here
   ```

4. **Deploy Changes**
   ```bash
   vercel --prod
   ```

5. **Test Token Generation and Verification**
   
   **Test Token Generation:**
   ```typescript
   // In your application or test script
   import { generateReceiptToken } from '@/lib/receipts/token'
   
   const token = await generateReceiptToken({
     donationId: 'test-donation-id',
     receiptNumber: 'RCP-2026-00001'
   })
   
   console.log('Generated token:', token)
   ```
   
   **Test Token Verification:**
   ```bash
   # Make a test donation
   # Generate receipt
   # Attempt to download receipt with token
   curl https://yourdomain.com/api/receipts/download?token=<generated_token>
   ```
   
   **Test Invalid Token Rejection:**
   ```bash
   # Attempt download with invalid token (should fail)
   curl https://yourdomain.com/api/receipts/download?token=invalid_token
   # Expected: 401 Unauthorized
   ```

6. **Verify in Logs**
   ```bash
   # Check for successful token generation and verification
   # Look for: "Receipt token generated successfully"
   # Look for: "Receipt token verified successfully"
   ```

**Validation Checklist:**
- [ ] Secret generated with sufficient entropy (32 bytes)
- [ ] Secret added to all environments
- [ ] Token generation succeeds
- [ ] Token verification succeeds
- [ ] Invalid tokens are rejected
- [ ] Receipt downloads work with valid tokens
- [ ] Receipt downloads fail without tokens

---

### 5. Verify .env in .gitignore

**Purpose:** Ensures sensitive credentials are never committed to version control.

**Steps:**

1. **Check .gitignore Configuration**
   ```bash
   # Verify .env files are ignored
   cat .gitignore | grep -E "^\.env"
   ```
   
   **Expected Output:**
   ```
   .env*
   ```
   
   **If Missing, Add:**
   ```bash
   echo ".env*" >> .gitignore
   ```

2. **Audit Git History for Exposed Secrets**
   
   **Check if .env files were ever committed:**
   ```bash
   git log --all --full-history -- .env
   git log --all --full-history -- .env.local
   git log --all --full-history -- .env.production
   ```
   
   **Search for potential secrets in history:**
   ```bash
   # Search for Stripe keys
   git log -p --all -S "sk_live_" -S "sk_test_"
   
   # Search for webhook secrets
   git log -p --all -S "whsec_"
   
   # Search for other API keys
   git log -p --all -S "SECRET_KEY" -S "API_KEY"
   ```

3. **If Secrets Found in History**
   
   **Option A: Use BFG Repo-Cleaner (Recommended)**
   ```bash
   # Install BFG
   # Download from: https://rtyley.github.io/bfg-repo-cleaner/
   
   # Create file with secrets to remove
   echo "sk_live_your_old_key" > secrets.txt
   echo "whsec_your_old_secret" >> secrets.txt
   
   # Clean repository
   bfg --replace-text secrets.txt
   
   # Force push (WARNING: Rewrites history)
   git push --force
   ```
   
   **Option B: Use git-filter-repo**
   ```bash
   # Install git-filter-repo
   pip install git-filter-repo
   
   # Remove sensitive files from history
   git filter-repo --path .env --invert-paths
   
   # Force push
   git push --force
   ```
   
   **Option C: If Secrets Exposed, Rotate Immediately**
   - Assume all exposed secrets are compromised
   - Rotate ALL credentials immediately
   - Monitor for unauthorized access
   - Consider security audit

4. **Verify Current Status**
   ```bash
   # Verify .env is not tracked
   git status --ignored | grep .env
   
   # Verify .env is not in staging area
   git ls-files | grep .env
   ```

5. **Document Credential Rotation Procedure**
   - This guide serves as the documentation
   - Keep updated with any process changes
   - Store in `docs/operations/` directory
   - Reference in main README.md

**Validation Checklist:**
- [ ] .gitignore includes `.env*` pattern
- [ ] No .env files in git history
- [ ] No secrets found in git history
- [ ] Current .env files are not tracked
- [ ] Credential rotation guide documented
- [ ] Team trained on credential security

---

## Post-Rotation Verification

After completing all credential rotations:

### 1. End-to-End Payment Testing

Test complete payment flow for each provider:

**Stripe:**
```bash
# Make test donation
# Complete payment
# Verify webhook received
# Verify donation confirmed
# Verify receipt generated
# Verify email sent
```

**Khalti:**
```bash
# Make test donation
# Complete payment in Khalti
# Verify verification endpoint works
# Verify donation confirmed
# Verify receipt generated
```

**eSewa:**
```bash
# Make test donation
# Complete payment in eSewa
# Verify success callback received
# Verify HMAC verified
# Verify donation confirmed
# Verify receipt generated
```

### 2. Security Verification

- [ ] All webhook signatures verified successfully
- [ ] All API authentications successful
- [ ] Receipt downloads require authentication
- [ ] Invalid tokens/signatures rejected
- [ ] No mock bypasses active in production
- [ ] Rate limiting functional

### 3. Monitoring Setup

- [ ] Configure alerts for authentication failures
- [ ] Monitor webhook signature verification failures
- [ ] Track API authentication errors
- [ ] Set up dashboard for credential health

### 4. Documentation Updates

- [ ] Update deployment documentation
- [ ] Update team runbooks
- [ ] Document rotation completion date
- [ ] Schedule next rotation (90 days recommended)

---

## Emergency Rollback Procedures

If issues occur during rotation:

### Immediate Actions

1. **Identify Failing Component**
   - Check application logs
   - Check provider dashboard logs
   - Identify which credential is causing issues

2. **Revert to Old Credential**
   ```bash
   # Update environment variable to old value
   vercel env add CREDENTIAL_NAME production
   # Enter old value
   
   # Redeploy immediately
   vercel --prod
   ```

3. **Verify Rollback Success**
   - Test payment flow
   - Check logs for errors
   - Verify normal operation restored

4. **Investigate Root Cause**
   - Review rotation steps
   - Check for typos in credentials
   - Verify provider dashboard configuration
   - Contact provider support if needed

### Provider-Specific Rollback Notes

**Stripe:**
- Old webhook secret remains valid for 24 hours
- Can safely rollback within this window

**Khalti:**
- Old key invalidated immediately
- May need to contact support for emergency restoration
- Or generate new key and rotate again

**eSewa:**
- Check with eSewa for old key validity period
- May have grace period for rollback

---

## Credential Storage Best Practices

### DO:
- ✅ Store credentials in environment variables
- ✅ Use deployment platform secret management (Vercel, AWS Secrets Manager, etc.)
- ✅ Rotate credentials quarterly
- ✅ Use different credentials for staging and production
- ✅ Limit access to credentials (need-to-know basis)
- ✅ Audit credential access logs
- ✅ Document rotation procedures

### DON'T:
- ❌ Commit credentials to git
- ❌ Share credentials via email or chat
- ❌ Use production credentials in development
- ❌ Hardcode credentials in source code
- ❌ Store credentials in plain text files
- ❌ Reuse credentials across environments
- ❌ Share credentials with third parties

---

## Rotation Schedule

### Recommended Frequency

| Credential Type | Rotation Frequency | Trigger Events |
|----------------|-------------------|----------------|
| Stripe Webhook Secret | Quarterly | Team member departure, suspected compromise |
| Khalti Secret Key | Quarterly | Team member departure, suspected compromise |
| eSewa Secret Key | Quarterly | Team member departure, suspected compromise |
| Receipt Token Secret | Quarterly | Team member departure, suspected compromise |
| CRON_SECRET | Quarterly | Team member departure |
| SUPABASE_SERVICE_ROLE_KEY | Annually | Team member departure, suspected compromise |

### Next Rotation Due

Document completion of this rotation:

- **Rotation Completed:** [DATE]
- **Rotated By:** [NAME]
- **Next Rotation Due:** [DATE + 90 days]
- **Credentials Rotated:**
  - [ ] Stripe Webhook Secret
  - [ ] Khalti Secret Key
  - [ ] eSewa Secret Key
  - [ ] Receipt Token Secret

---

## Support Contacts

Keep these contacts handy during rotation:

- **Stripe Support:** https://support.stripe.com/
- **Khalti Support:** support@khalti.com
- **eSewa Support:** https://esewa.com.np/support
- **Internal DevOps Team:** [YOUR TEAM CONTACT]

---

## Appendix: Automation Scripts

### Script: Test All Credentials

```bash
#!/bin/bash
# test-credentials.sh
# Tests all payment credentials are working

echo "Testing Stripe webhook secret..."
stripe listen --forward-to localhost:3000/api/webhooks/stripe &
STRIPE_PID=$!
sleep 5
stripe trigger checkout.session.completed
kill $STRIPE_PID

echo "Testing Khalti secret key..."
curl -X POST http://localhost:3000/api/payments/khalti/verify \
  -H "Content-Type: application/json" \
  -d '{"pidx": "test", "donationId": "test"}'

echo "Testing eSewa secret key..."
# Add eSewa test here

echo "Testing receipt token secret..."
curl http://localhost:3000/api/receipts/download?token=test

echo "All tests complete!"
```

### Script: Generate All Secrets

```bash
#!/bin/bash
# generate-secrets.sh
# Generates all required secrets for new environment

echo "Generating Receipt Token Secret..."
echo "RECEIPT_TOKEN_SECRET=$(openssl rand -base64 32)"

echo "Generating CRON Secret..."
echo "CRON_SECRET=$(openssl rand -hex 32)"

echo "Generating Receipt Resend API Key..."
echo "RECEIPT_RESEND_API_KEY=$(openssl rand -hex 32)"

echo ""
echo "Add these to your .env file"
echo "Then rotate provider credentials manually via dashboards"
```

---

## Changelog

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2026-03-03 | 1.0 | Initial credential rotation guide | Payment V2 Implementation |

