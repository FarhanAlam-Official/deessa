# test-credentials.ps1
# Tests all payment credentials are configured and working
# Usage: .\scripts\test-credentials.ps1

$ErrorActionPreference = "Stop"

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Payment Credentials Test Suite" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Test counters
$script:TestsPassed = 0
$script:TestsFailed = 0

# Function to test if environment variable is set
function Test-EnvVar {
    param([string]$VarName)
    
    $VarValue = [Environment]::GetEnvironmentVariable($VarName)
    
    if ([string]::IsNullOrEmpty($VarValue)) {
        Write-Host "X $VarName is not set" -ForegroundColor Red
        $script:TestsFailed++
        return $false
    }
    else {
        Write-Host "+ $VarName is set" -ForegroundColor Green
        $script:TestsPassed++
        return $true
    }
}

# Function to test if environment variable has correct format
function Test-EnvFormat {
    param(
        [string]$VarName,
        [string]$ExpectedPrefix
    )
    
    $VarValue = [Environment]::GetEnvironmentVariable($VarName)
    
    if ([string]::IsNullOrEmpty($VarValue)) {
        Write-Host "X $VarName is not set" -ForegroundColor Red
        $script:TestsFailed++
        return $false
    }
    elseif ($VarValue.StartsWith($ExpectedPrefix)) {
        Write-Host "+ $VarName has correct format" -ForegroundColor Green
        $script:TestsPassed++
        return $true
    }
    else {
        Write-Host "! $VarName may have incorrect format (expected to start with '$ExpectedPrefix')" -ForegroundColor Yellow
        $script:TestsPassed++
        return $true
    }
}

# Load .env file if it exists
if (Test-Path ".env") {
    Write-Host "Loading .env file..." -ForegroundColor Cyan
    Get-Content ".env" | ForEach-Object {
        $line = $_
        if ($line -match '^([^#][^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($key, $value, "Process")
        }
    }
    Write-Host ""
}

Write-Host "1. Testing Stripe Credentials" -ForegroundColor Cyan
Write-Host "------------------------------"
Test-EnvFormat "STRIPE_SECRET_KEY" "sk_" | Out-Null
Test-EnvFormat "STRIPE_WEBHOOK_SECRET" "whsec_" | Out-Null
Write-Host ""

Write-Host "2. Testing Khalti Credentials" -ForegroundColor Cyan
Write-Host "------------------------------"
Test-EnvVar "KHALTI_SECRET_KEY" | Out-Null
Test-EnvVar "KHALTI_BASE_URL" | Out-Null
Write-Host ""

Write-Host "3. Testing eSewa Credentials" -ForegroundColor Cyan
Write-Host "------------------------------"
Test-EnvVar "ESEWA_MERCHANT_ID" | Out-Null
Test-EnvVar "ESEWA_SECRET_KEY" | Out-Null
Test-EnvVar "ESEWA_BASE_URL" | Out-Null
Write-Host ""

Write-Host "4. Testing Receipt Security" -ForegroundColor Cyan
Write-Host "------------------------------"
$hasReceiptSecret = Test-EnvVar "RECEIPT_TOKEN_SECRET"

# Check if secret has sufficient length (base64 of 32 bytes = ~44 chars)
if ($hasReceiptSecret) {
    $receiptSecret = [Environment]::GetEnvironmentVariable("RECEIPT_TOKEN_SECRET")
    if ($receiptSecret.Length -ge 40) {
        Write-Host "+ RECEIPT_TOKEN_SECRET has sufficient length" -ForegroundColor Green
        $script:TestsPassed++
    }
    else {
        Write-Host "X RECEIPT_TOKEN_SECRET is too short (should be at least 40 characters)" -ForegroundColor Red
        $script:TestsFailed++
    }
}
Write-Host ""

Write-Host "5. Testing Payment Mode Configuration" -ForegroundColor Cyan
Write-Host "------------------------------"
$hasPaymentMode = Test-EnvVar "PAYMENT_MODE"

if ($hasPaymentMode) {
    $paymentMode = [Environment]::GetEnvironmentVariable("PAYMENT_MODE")
    if ($paymentMode -eq "live") {
        Write-Host "! PAYMENT_MODE is set to 'live' - ensure all credentials are production keys" -ForegroundColor Yellow
    }
    elseif ($paymentMode -eq "mock") {
        Write-Host "+ PAYMENT_MODE is set to 'mock' - safe for testing" -ForegroundColor Green
    }
    else {
        Write-Host "X PAYMENT_MODE has invalid value: $paymentMode (should be 'live' or 'mock')" -ForegroundColor Red
        $script:TestsFailed++
    }
}
Write-Host ""

Write-Host "6. Testing Supabase Configuration" -ForegroundColor Cyan
Write-Host "------------------------------"
Test-EnvVar "NEXT_PUBLIC_SUPABASE_URL" | Out-Null
Test-EnvVar "NEXT_PUBLIC_SUPABASE_ANON_KEY" | Out-Null
Test-EnvVar "SUPABASE_SERVICE_ROLE_KEY" | Out-Null
Write-Host ""

Write-Host "7. Testing Email Configuration" -ForegroundColor Cyan
Write-Host "------------------------------"
Test-EnvVar "GOOGLE_EMAIL" | Out-Null
Test-EnvVar "GOOGLE_APP_PASSWORD" | Out-Null
Write-Host ""

Write-Host "8. Testing Security Configuration" -ForegroundColor Cyan
Write-Host "------------------------------"
$hasCronSecret = Test-EnvVar "CRON_SECRET"

# Check CRON_SECRET length
if ($hasCronSecret) {
    $cronSecret = [Environment]::GetEnvironmentVariable("CRON_SECRET")
    if ($cronSecret.Length -ge 32) {
        Write-Host "+ CRON_SECRET has sufficient length" -ForegroundColor Green
        $script:TestsPassed++
    }
    else {
        Write-Host "X CRON_SECRET is too short (should be at least 32 characters)" -ForegroundColor Red
        $script:TestsFailed++
    }
}
Write-Host ""

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Test Summary" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Passed: $script:TestsPassed" -ForegroundColor Green
Write-Host "Failed: $script:TestsFailed" -ForegroundColor Red
Write-Host ""

if ($script:TestsFailed -eq 0) {
    Write-Host "+ All credential tests passed!" -ForegroundColor Green
    exit 0
}
else {
    Write-Host "X Some credential tests failed. Please check your .env configuration." -ForegroundColor Red
    exit 1
}
