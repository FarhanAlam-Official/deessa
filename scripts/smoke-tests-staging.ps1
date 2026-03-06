# Payment Architecture V2 - Staging Smoke Tests
# This script runs automated smoke tests against staging environment

param(
    [string]$StagingUrl = $env:STAGING_URL,
    [switch]$SkipStripe = $false,
    [switch]$SkipKhalti = $false,
    [switch]$SkipEsewa = $false,
    [switch]$Verbose = $false
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Payment Architecture V2 - Smoke Tests" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if (-not $StagingUrl) {
    Write-Host "ERROR: Staging URL not provided" -ForegroundColor Red
    Write-Host "Usage: .\smoke-tests-staging.ps1 -StagingUrl https://your-staging.vercel.app" -ForegroundColor Yellow
    exit 1
}

Write-Host "Testing against: $StagingUrl" -ForegroundColor Green
Write-Host ""

$testResults = @{
    passed = 0
    failed = 0
    skipped = 0
    tests = @()
}

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Url,
        [string]$Method = "GET",
        [hashtable]$Headers = @{},
        [object]$Body = $null,
        [int]$ExpectedStatus = 200
    )
    
    Write-Host "  Testing: $Name" -ForegroundColor Gray
    
    try {
        $params = @{
            Uri = $Url
            Method = $Method
            Headers = $Headers
            TimeoutSec = 30
        }
        
        if ($Body) {
            $params.Body = ($Body | ConvertTo-Json)
            $params.ContentType = "application/json"
        }
        
        $response = Invoke-WebRequest @params -UseBasicParsing
        
        if ($response.StatusCode -eq $ExpectedStatus) {
            Write-Host "    ✓ PASS" -ForegroundColor Green
            if ($Verbose) {
                Write-Host "    Response: $($response.Content)" -ForegroundColor Gray
            }
            return $true
        } else {
            Write-Host "    ✗ FAIL - Expected $ExpectedStatus, got $($response.StatusCode)" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "    ✗ FAIL - $($_.Exception.Message)" -ForegroundColor Red
        if ($Verbose) {
            Write-Host "    Details: $($_.Exception)" -ForegroundColor Gray
        }
        return $false
    }
}

# Test 1: Health Check
Write-Host "[1/7] Health Check" -ForegroundColor Yellow
$result = Test-Endpoint -Name "API Health" -Url "$StagingUrl/api/health"
if ($result) {
    $testResults.passed++
} else {
    $testResults.failed++
}
$testResults.tests += @{ name = "Health Check"; passed = $result }
Write-Host ""

# Test 2: Homepage Load
Write-Host "[2/7] Homepage Load" -ForegroundColor Yellow
$result = Test-Endpoint -Name "Homepage" -Url "$StagingUrl/"
if ($result) {
    $testResults.passed++
} else {
    $testResults.failed++
}
$testResults.tests += @{ name = "Homepage Load"; passed = $result }
Write-Host ""

# Test 3: Donation Form Access
Write-Host "[3/7] Donation Form Access" -ForegroundColor Yellow
$result = Test-Endpoint -Name "Donation Form" -Url "$StagingUrl/donate"
if ($result) {
    $testResults.passed++
} else {
    $testResults.failed++
}
$testResults.tests += @{ name = "Donation Form"; passed = $result }
Write-Host ""

# Test 4: Stripe Payment Flow
if (-not $SkipStripe) {
    Write-Host "[4/7] Stripe Payment Flow" -ForegroundColor Yellow
    Write-Host "  Manual test required:" -ForegroundColor Yellow
    Write-Host "    1. Go to $StagingUrl/donate" -ForegroundColor White
    Write-Host "    2. Enter test donation details" -ForegroundColor White
    Write-Host "    3. Select Stripe as payment method" -ForegroundColor White
    Write-Host "    4. Use test card: 4242 4242 4242 4242" -ForegroundColor White
    Write-Host "    5. Complete payment" -ForegroundColor White
    Write-Host "    6. Verify success page shows" -ForegroundColor White
    Write-Host "    7. Check email for receipt" -ForegroundColor White
    Write-Host ""
    $stripeResult = Read-Host "  Did Stripe payment test pass? (y/n)"
    if ($stripeResult -eq "y") {
        Write-Host "    ✓ PASS" -ForegroundColor Green
        $testResults.passed++
        $testResults.tests += @{ name = "Stripe Payment"; passed = $true }
    } else {
        Write-Host "    ✗ FAIL" -ForegroundColor Red
        $testResults.failed++
        $testResults.tests += @{ name = "Stripe Payment"; passed = $false }
    }
} else {
    Write-Host "[4/7] Stripe Payment Flow - SKIPPED" -ForegroundColor Gray
    $testResults.skipped++
    $testResults.tests += @{ name = "Stripe Payment"; passed = $null }
}
Write-Host ""

# Test 5: Khalti Payment Flow
if (-not $SkipKhalti) {
    Write-Host "[5/7] Khalti Payment Flow" -ForegroundColor Yellow
    Write-Host "  Manual test required:" -ForegroundColor Yellow
    Write-Host "    1. Go to $StagingUrl/donate" -ForegroundColor White
    Write-Host "    2. Enter test donation details" -ForegroundColor White
    Write-Host "    3. Select Khalti as payment method" -ForegroundColor White
    Write-Host "    4. Use test credentials from Khalti dashboard" -ForegroundColor White
    Write-Host "    5. Complete payment" -ForegroundColor White
    Write-Host "    6. Verify success page shows" -ForegroundColor White
    Write-Host "    7. Check email for receipt" -ForegroundColor White
    Write-Host ""
    $khaltiResult = Read-Host "  Did Khalti payment test pass? (y/n)"
    if ($khaltiResult -eq "y") {
        Write-Host "    ✓ PASS" -ForegroundColor Green
        $testResults.passed++
        $testResults.tests += @{ name = "Khalti Payment"; passed = $true }
    } else {
        Write-Host "    ✗ FAIL" -ForegroundColor Red
        $testResults.failed++
        $testResults.tests += @{ name = "Khalti Payment"; passed = $false }
    }
} else {
    Write-Host "[5/7] Khalti Payment Flow - SKIPPED" -ForegroundColor Gray
    $testResults.skipped++
    $testResults.tests += @{ name = "Khalti Payment"; passed = $null }
}
Write-Host ""

# Test 6: eSewa Payment Flow
if (-not $SkipEsewa) {
    Write-Host "[6/7] eSewa Payment Flow" -ForegroundColor Yellow
    Write-Host "  Manual test required:" -ForegroundColor Yellow
    Write-Host "    1. Go to $StagingUrl/donate" -ForegroundColor White
    Write-Host "    2. Enter test donation details" -ForegroundColor White
    Write-Host "    3. Select eSewa as payment method" -ForegroundColor White
    Write-Host "    4. Use test credentials from eSewa dashboard" -ForegroundColor White
    Write-Host "    5. Complete payment" -ForegroundColor White
    Write-Host "    6. Verify success page shows" -ForegroundColor White
    Write-Host "    7. Check email for receipt" -ForegroundColor White
    Write-Host ""
    $esewaResult = Read-Host "  Did eSewa payment test pass? (y/n)"
    if ($esewaResult -eq "y") {
        Write-Host "    ✓ PASS" -ForegroundColor Green
        $testResults.passed++
        $testResults.tests += @{ name = "eSewa Payment"; passed = $true }
    } else {
        Write-Host "    ✗ FAIL" -ForegroundColor Red
        $testResults.failed++
        $testResults.tests += @{ name = "eSewa Payment"; passed = $false }
    }
} else {
    Write-Host "[6/7] eSewa Payment Flow - SKIPPED" -ForegroundColor Gray
    $testResults.skipped++
    $testResults.tests += @{ name = "eSewa Payment"; passed = $null }
}
Write-Host ""

# Test 7: Database Verification
Write-Host "[7/7] Database Verification" -ForegroundColor Yellow
Write-Host "  Manual verification required:" -ForegroundColor Yellow
Write-Host "    1. Open Supabase SQL Editor" -ForegroundColor White
Write-Host "    2. Run: SELECT COUNT(*) FROM donations WHERE payment_status = 'CONFIRMED';" -ForegroundColor White
Write-Host "    3. Run: SELECT COUNT(*) FROM receipts;" -ForegroundColor White
Write-Host "    4. Run: SELECT COUNT(*) FROM payment_events;" -ForegroundColor White
Write-Host "    5. Verify counts match expected test donations" -ForegroundColor White
Write-Host ""
$dbResult = Read-Host "  Did database verification pass? (y/n)"
if ($dbResult -eq "y") {
    Write-Host "    ✓ PASS" -ForegroundColor Green
    $testResults.passed++
    $testResults.tests += @{ name = "Database Verification"; passed = $true }
} else {
    Write-Host "    ✗ FAIL" -ForegroundColor Red
    $testResults.failed++
    $testResults.tests += @{ name = "Database Verification"; passed = $false }
}
Write-Host ""

# Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Test Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Total Tests: $($testResults.passed + $testResults.failed + $testResults.skipped)" -ForegroundColor White
Write-Host "  Passed: $($testResults.passed)" -ForegroundColor Green
Write-Host "  Failed: $($testResults.failed)" -ForegroundColor Red
Write-Host "  Skipped: $($testResults.skipped)" -ForegroundColor Gray
Write-Host ""

# Detailed results
Write-Host "Detailed Results:" -ForegroundColor White
foreach ($test in $testResults.tests) {
    $status = if ($test.passed -eq $true) { "✓ PASS" } elseif ($test.passed -eq $false) { "✗ FAIL" } else { "⊘ SKIP" }
    $color = if ($test.passed -eq $true) { "Green" } elseif ($test.passed -eq $false) { "Red" } else { "Gray" }
    Write-Host "  $status - $($test.name)" -ForegroundColor $color
}
Write-Host ""

# Exit code
if ($testResults.failed -gt 0) {
    Write-Host "❌ Some tests failed. Review failures before proceeding." -ForegroundColor Red
    exit 1
} else {
    Write-Host "✅ All tests passed! Ready to enable V2." -ForegroundColor Green
    exit 0
}
