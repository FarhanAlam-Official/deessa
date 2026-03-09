# Payment Architecture V2 - Staging Monitoring Script
# This script monitors key metrics in staging environment

param(
    [string]$StagingUrl = $env:STAGING_URL,
    [int]$IntervalSeconds = 300,  # 5 minutes
    [switch]$Once = $false
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Payment Architecture V2 - Staging Monitor" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if (-not $StagingUrl) {
    Write-Host "ERROR: Staging URL not provided" -ForegroundColor Red
    Write-Host "Usage: .\monitor-staging.ps1 -StagingUrl https://your-staging.vercel.app" -ForegroundColor Yellow
    exit 1
}

Write-Host "Monitoring: $StagingUrl" -ForegroundColor Green
Write-Host "Interval: $IntervalSeconds seconds" -ForegroundColor Gray
if ($Once) {
    Write-Host "Mode: Single check" -ForegroundColor Gray
} else {
    Write-Host "Mode: Continuous (Ctrl+C to stop)" -ForegroundColor Gray
}
Write-Host ""

function Get-Metrics {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    
    Write-Host "[$timestamp] Checking metrics..." -ForegroundColor Yellow
    Write-Host ""
    
    # Health check
    Write-Host "  Health Check:" -ForegroundColor Cyan
    try {
        $health = Invoke-RestMethod -Uri "$StagingUrl/api/health" -Method Get -TimeoutSec 10
        if ($health.status -eq "healthy") {
            Write-Host "    ✓ Status: Healthy" -ForegroundColor Green
            Write-Host "    ✓ Database: $($health.checks.database.status)" -ForegroundColor Green
            Write-Host "    ✓ Payment Config: $($health.checks.paymentConfig.status)" -ForegroundColor Green
            
            if ($health.features.paymentV2Enabled) {
                Write-Host "    ℹ V2 Enabled: $($health.features.paymentV2Enabled)" -ForegroundColor Cyan
            }
        } else {
            Write-Host "    ✗ Status: $($health.status)" -ForegroundColor Red
        }
    } catch {
        Write-Host "    ✗ Health check failed: $($_.Exception.Message)" -ForegroundColor Red
    }
    Write-Host ""
    
    # Database metrics (requires manual query)
    Write-Host "  Database Metrics:" -ForegroundColor Cyan
    Write-Host "    Run these queries in Supabase SQL Editor:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "    -- Recent donations (last hour)" -ForegroundColor Gray
    Write-Host "    SELECT payment_status, COUNT(*) " -ForegroundColor Gray
    Write-Host "    FROM donations " -ForegroundColor Gray
    Write-Host "    WHERE created_at > NOW() - INTERVAL '1 hour' " -ForegroundColor Gray
    Write-Host "    GROUP BY payment_status;" -ForegroundColor Gray
    Write-Host ""
    Write-Host "    -- Stuck donations" -ForegroundColor Gray
    Write-Host "    SELECT COUNT(*) FROM donations " -ForegroundColor Gray
    Write-Host "    WHERE payment_status = 'PENDING' " -ForegroundColor Gray
    Write-Host "    AND created_at < NOW() - INTERVAL '1 hour';" -ForegroundColor Gray
    Write-Host ""
    Write-Host "    -- Recent failures" -ForegroundColor Gray
    Write-Host "    SELECT COUNT(*) FROM receipt_failures " -ForegroundColor Gray
    Write-Host "    WHERE created_at > NOW() - INTERVAL '1 hour';" -ForegroundColor Gray
    Write-Host ""
    Write-Host "    SELECT COUNT(*) FROM email_failures " -ForegroundColor Gray
    Write-Host "    WHERE created_at > NOW() - INTERVAL '1 hour';" -ForegroundColor Gray
    Write-Host ""
    
    # Response time check
    Write-Host "  Response Time:" -ForegroundColor Cyan
    $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
    try {
        $null = Invoke-WebRequest -Uri "$StagingUrl/api/health" -Method Get -UseBasicParsing -TimeoutSec 10
        $stopwatch.Stop()
        $responseTime = $stopwatch.ElapsedMilliseconds
        
        if ($responseTime -lt 1000) {
            Write-Host "    ✓ Response time: $responseTime ms" -ForegroundColor Green
        } elseif ($responseTime -lt 2000) {
            Write-Host "    ⚠ Response time: $responseTime ms (acceptable)" -ForegroundColor Yellow
        } else {
            Write-Host "    ✗ Response time: $responseTime ms (slow)" -ForegroundColor Red
        }
    } catch {
        Write-Host "    ✗ Request failed: $($_.Exception.Message)" -ForegroundColor Red
    }
    Write-Host ""
    
    # Recent logs
    Write-Host "  Recent Logs:" -ForegroundColor Cyan
    Write-Host "    View logs with: vercel logs --env=preview --follow" -ForegroundColor Gray
    Write-Host ""
    
    Write-Host "========================================" -ForegroundColor Gray
    Write-Host ""
}

# Main monitoring loop
do {
    Get-Metrics
    
    if (-not $Once) {
        Write-Host "Next check in $IntervalSeconds seconds..." -ForegroundColor Gray
        Write-Host "Press Ctrl+C to stop" -ForegroundColor Gray
        Write-Host ""
        Start-Sleep -Seconds $IntervalSeconds
    }
} while (-not $Once)

Write-Host "Monitoring stopped" -ForegroundColor Yellow
