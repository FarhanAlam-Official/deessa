#!/bin/bash
# generate-secrets.sh
# Generates all required secrets for new environment
# Usage: ./scripts/generate-secrets.sh

set -e

echo "=================================="
echo "Secret Generation Utility"
echo "=================================="
echo ""

# Check if openssl is available
if ! command -v openssl &> /dev/null; then
    echo "Error: openssl is not installed"
    echo "Please install openssl to generate secrets"
    exit 1
fi

echo "Generating secrets..."
echo ""

# Generate Receipt Token Secret
RECEIPT_TOKEN_SECRET=$(openssl rand -base64 32)
echo "RECEIPT_TOKEN_SECRET (JWT signing for receipt downloads):"
echo "$RECEIPT_TOKEN_SECRET"
echo ""

# Generate CRON Secret
CRON_SECRET=$(openssl rand -hex 32)
echo "CRON_SECRET (Authentication for cron endpoints):"
echo "$CRON_SECRET"
echo ""

# Generate Receipt Resend API Key
RECEIPT_API_KEY=$(openssl rand -hex 32)
echo "RECEIPT_RESEND_API_KEY (API key for programmatic receipt resend):"
echo "$RECEIPT_API_KEY"
echo ""

echo "=================================="
echo "Next Steps"
echo "=================================="
echo ""
echo "1. Add these secrets to your .env file:"
echo ""
echo "   RECEIPT_TOKEN_SECRET=$RECEIPT_TOKEN_SECRET"
echo "   CRON_SECRET=$CRON_SECRET"
echo "   RECEIPT_RESEND_API_KEY=$RECEIPT_API_KEY"
echo ""
echo "2. For production, add to Vercel:"
echo ""
echo "   vercel env add RECEIPT_TOKEN_SECRET production"
echo "   vercel env add CRON_SECRET production"
echo "   vercel env add RECEIPT_RESEND_API_KEY production"
echo ""
echo "3. Rotate provider credentials manually:"
echo ""
echo "   - Stripe: https://dashboard.stripe.com/webhooks"
echo "   - Khalti: https://khalti.com/ (Settings → API Keys)"
echo "   - eSewa: https://esewa.com.np/ (Settings → API Configuration)"
echo ""
echo "4. Test all credentials:"
echo ""
echo "   ./scripts/test-credentials.sh"
echo ""
echo "=================================="
echo "Security Reminders"
echo "=================================="
echo ""
echo "✓ Never commit these secrets to git"
echo "✓ Store securely in environment variables"
echo "✓ Use different secrets for staging and production"
echo "✓ Rotate secrets quarterly"
echo "✓ Limit access to secrets (need-to-know basis)"
echo ""
