# Payment Architecture V2 - Enable V2 in Staging
# This script enables the V2 payment architecture in staging environment

param(
    [switch]$Disable = $false,
    [switch]$DryRun = $false
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Payment Architecture V2 - Feature Flag Control" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$action = if ($Disable) { "DISABLE" } else { "ENABLE" }
$flagValue = if ($Disable) { "false" } else { "true" }

Write-Host "Action: $action V2 in staging" -ForegroundColor $(if ($Disable) { "Yellow" } else { "Green" })
Write-Host "Feature Flag: PAYMENT_V2_ENABLED=$flagValue" -ForegroundColor Gray
Write-Host ""

# Pre-flight checks
Write-Host "[1/4] Pre-flight checks..." -ForegroundColor Yellow

if (-not $Disable) {
    Write-Host "  Verifying smoke tests completed..." -ForegroundColor Gray
    $smokeTestsComplete = Read-Host "  Have smoke tests passed? (y/n)"
    if ($smokeTestsComplete -ne "y") {
        Write-Host "  ERROR: Complete smoke tests before enabling V2" -ForegroundColor Red
        exit 1
    }
    Write-Host "  ✓ Smoke tests verified" -ForegroundColor Green
}

Write-Host ""

# Update environment variable
Write-Host "[2/4] Updating environment variable..." -ForegroundColor Yellow

if ($DryRun) {
    Write-Host "  [DRY RUN] Would set PAYMENT_V2_ENABLED=$flagValue" -ForegroundColor Cyan
} else {
    Write-Host "  Setting PAYMENT_V2_ENABLED=$flagValue in Vercel..." -ForegroundColor Gray
    Write-Host ""
    Write-Host "  Run this command:" -ForegroundColor Yellow
    Write-Host "  vercel env add PAYMENT_V2_ENABLED preview" -ForegroundColor White
    Write-Host "  Value: $flagValue" -ForegroundColor White
    Write-Host ""
    Write-Host "  Or update in Vercel Dashboard:" -ForegroundColor Yellow
    Write-Host "  1. Go to Project Settings → Environment Variables" -ForegroundColor White
    Write-Host "  2. Find PAYMENT_V2_ENABLED" -ForegroundColor White
    Write-Host "  3. Set value to: $flagValue" -ForegroundColor White
    Write-Host "  4. Select environment: Preview" -ForegroundColor White
    Write-Host "  5. Save changes" -ForegroundColor White
    Write-Host ""
    $envUpdated = Read-Host "  Have you updated the environment variable? (y/n)"
    if ($envUpdated -ne "y") {
        Write-Host "  Cancelled" -ForegroundColor Red
        exit 1
    }
}

Write-Host "  ✓ Environment variable updated" -ForegroundColor Green
Write-Host ""

# Redeploy
Write-Host "[3/4] Redeploying application..." -ForegroundColor Yellow

if ($DryRun) {
    Write-Host "  [DRY RUN] Would redeploy to staging" -ForegroundColor Cyan
} else {
    Write-Host "  Triggering redeploy..." -ForegroundColor Gray
    vercel --env=preview --force
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  ERROR: Deployment failed" -ForegroundColor Red
        exit 1
    }
}

Write-Host "  ✓ Application redeployed" -ForegroundColor Green
Write-Host ""

# Verify
Write-Host "[4/4] Verifying feature flag..." -ForegroundColor Yellow

if ($DryRun) {
    Write-Host "  [DRY RUN] Would verify feature flag" -ForegroundColor Cyan
} else {
    Write-Host "  Checking health endpoint..." -ForegroundColor Gray
    Start-Sleep -Seconds 10  # Wait for deployment
    
    $stagingUrl = $env:STAGING_URL
    if (-not $stagingUrl) {
        Write-Host "  WARNING: STAGING_URL not set, skipping verification" -ForegroundColor Yellow
    } else {
        try {
            $response = Invoke-RestMethod -Uri "$stagingUrl/api/health" -Method Get
            $v2Enabled = $response.features.paymentV2Enabled
            
            if ($v2Enabled -eq $flagValue) {
                Write-Host "  ✓ Feature flag verified: PAYMENT_V2_ENABLED=$v2Enabled" -ForegroundColor Green
            } else {
                Write-Host "  WARNING: Feature flag mismatch" -ForegroundColor Yellow
                Write-Host "    Expected: $flagValue" -ForegroundColor Gray
                Write-Host "    Actual: $v2Enabled" -ForegroundColor Gray
            }
        } catch {
            Write-Host "  WARNING: Could not verify feature flag - $($_.Exception.Message)" -ForegroundColor Yellow
        }
    }
}

Write-Host ""

# Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if ($Disable) {
    Write-Host "  V2 has been DISABLED in staging" -ForegroundColor Yellow
    Write-Host "  System is now using V1 payment flow" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Cyan
    Write-Host "  1. Verify V1 flow works correctly" -ForegroundColor White
    Write-Host "  2. Investigate issues that caused rollback" -ForegroundColor White
} else {
    Write-Host "  V2 has been ENABLED in staging" -ForegroundColor Green
    Write-Host "  System is now using V2 payment flow" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Cyan
    Write-Host "  1. Monitor error rates closely" -ForegroundColor White
    Write-Host "  2. Test payment flows manually" -ForegroundColor White
    Write-Host "  3. Check webhook processing logs" -ForegroundColor White
    Write-Host "  4. Verify receipts and emails working" -ForegroundColor White
    Write-Host "  5. Monitor for 24-48 hours before production" -ForegroundColor White
    Write-Host ""
    Write-Host "Monitoring Commands:" -ForegroundColor Cyan
    Write-Host "  vercel logs --env=preview --follow" -ForegroundColor White
    Write-Host "  .\scripts\monitor-staging.ps1" -ForegroundColor White
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Feature Flag Update Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
