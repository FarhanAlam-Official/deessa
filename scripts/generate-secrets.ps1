# generate-secrets.ps1
# Generates all required secrets for new environment
# Usage: .\scripts\generate-secrets.ps1

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Secret Generation Utility" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Function to generate random base64 string
function New-Base64Secret {
    param([int]$Bytes = 32)
    $randomBytes = New-Object byte[] $Bytes
    $rng = [System.Security.Cryptography.RNGCryptoServiceProvider]::Create()
    $rng.GetBytes($randomBytes)
    return [Convert]::ToBase64String($randomBytes)
}

# Function to generate random hex string
function New-HexSecret {
    param([int]$Bytes = 32)
    $randomBytes = New-Object byte[] $Bytes
    $rng = [System.Security.Cryptography.RNGCryptoServiceProvider]::Create()
    $rng.GetBytes($randomBytes)
    return ($randomBytes | ForEach-Object { $_.ToString("x2") }) -join ''
}

Write-Host "Generating secrets..." -ForegroundColor Yellow
Write-Host ""

# Generate Receipt Token Secret
$receiptTokenSecret = New-Base64Secret -Bytes 32
Write-Host "RECEIPT_TOKEN_SECRET (JWT signing for receipt downloads):" -ForegroundColor Green
Write-Host $receiptTokenSecret
Write-Host ""

# Generate CRON Secret
$cronSecret = New-HexSecret -Bytes 32
Write-Host "CRON_SECRET (Authentication for cron endpoints):" -ForegroundColor Green
Write-Host $cronSecret
Write-Host ""

# Generate Receipt Resend API Key
$receiptApiKey = New-HexSecret -Bytes 32
Write-Host "RECEIPT_RESEND_API_KEY (API key for programmatic receipt resend):" -ForegroundColor Green
Write-Host $receiptApiKey
Write-Host ""

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Next Steps" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Add these secrets to your .env file:" -ForegroundColor Yellow
Write-Host ""
Write-Host "   RECEIPT_TOKEN_SECRET=$receiptTokenSecret"
Write-Host "   CRON_SECRET=$cronSecret"
Write-Host "   RECEIPT_RESEND_API_KEY=$receiptApiKey"
Write-Host ""
Write-Host "2. For production, add to Vercel:" -ForegroundColor Yellow
Write-Host ""
Write-Host "   vercel env add RECEIPT_TOKEN_SECRET production"
Write-Host "   vercel env add CRON_SECRET production"
Write-Host "   vercel env add RECEIPT_RESEND_API_KEY production"
Write-Host ""
Write-Host "3. Rotate provider credentials manually:" -ForegroundColor Yellow
Write-Host ""
Write-Host "   - Stripe: https://dashboard.stripe.com/webhooks"
Write-Host "   - Khalti: https://khalti.com/ (Settings -> API Keys)"
Write-Host "   - eSewa: https://esewa.com.np/ (Settings -> API Configuration)"
Write-Host ""
Write-Host "4. Test all credentials:" -ForegroundColor Yellow
Write-Host ""
Write-Host "   .\scripts\test-credentials.ps1"
Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Security Reminders" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "- Never commit these secrets to git" -ForegroundColor Green
Write-Host "- Store securely in environment variables" -ForegroundColor Green
Write-Host "- Use different secrets for staging and production" -ForegroundColor Green
Write-Host "- Rotate secrets quarterly" -ForegroundColor Green
Write-Host "- Limit access to secrets (need-to-know basis)" -ForegroundColor Green
Write-Host ""
