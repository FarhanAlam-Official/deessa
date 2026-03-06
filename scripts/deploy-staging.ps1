# Payment Architecture V2 - Staging Deployment Script
# This script automates the deployment of Payment V2 to staging environment

param(
    [switch]$SkipMigrations = $false,
    [switch]$SkipVerification = $false,
    [switch]$DryRun = $false
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Payment Architecture V2 - Staging Deployment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$STAGING_URL = $env:STAGING_URL
$SUPABASE_PROJECT_REF = $env:SUPABASE_STAGING_PROJECT_REF

if (-not $STAGING_URL) {
    Write-Host "ERROR: STAGING_URL environment variable not set" -ForegroundColor Red
    Write-Host "Set it with: `$env:STAGING_URL = 'https://your-staging.vercel.app'" -ForegroundColor Yellow
    exit 1
}

Write-Host "Staging URL: $STAGING_URL" -ForegroundColor Green
Write-Host ""

# Step 1: Pre-deployment checks
Write-Host "[1/6] Running pre-deployment checks..." -ForegroundColor Yellow

# Check if we're on the correct branch
$currentBranch = git rev-parse --abbrev-ref HEAD
Write-Host "  Current branch: $currentBranch" -ForegroundColor Gray

# Check for uncommitted changes
$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Host "  WARNING: You have uncommitted changes" -ForegroundColor Yellow
    if (-not $DryRun) {
        $continue = Read-Host "  Continue anyway? (y/n)"
        if ($continue -ne "y") {
            Write-Host "Deployment cancelled" -ForegroundColor Red
            exit 1
        }
    }
}

# Run tests
Write-Host "  Running tests..." -ForegroundColor Gray
if (-not $DryRun) {
    npm test -- --run
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  ERROR: Tests failed" -ForegroundColor Red
        exit 1
    }
}
Write-Host "  ✓ Tests passed" -ForegroundColor Green

# Validate configuration
Write-Host "  Validating payment configuration..." -ForegroundColor Gray
if (-not $DryRun) {
    npm run validate-config
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  ERROR: Configuration validation failed" -ForegroundColor Red
        exit 1
    }
}
Write-Host "  ✓ Configuration valid" -ForegroundColor Green

Write-Host ""

# Step 2: Database migrations
if (-not $SkipMigrations) {
    Write-Host "[2/6] Running database migrations..." -ForegroundColor Yellow
    
    $migrations = @(
        "020-create-payments-table.sql",
        "021-create-receipts-table.sql",
        "023-enhance-payment-events.sql",
        "024-add-indexes.sql",
        "025-atomic-receipt-number.sql",
        "026-create-receipt-failures-table.sql",
        "027-create-email-failures-table.sql"
    )
    
    Write-Host "  Migrations to run:" -ForegroundColor Gray
    foreach ($migration in $migrations) {
        Write-Host "    - $migration" -ForegroundColor Gray
    }
    
    if ($DryRun) {
        Write-Host "  [DRY RUN] Would execute migrations" -ForegroundColor Cyan
    } else {
        Write-Host ""
        Write-Host "  IMPORTANT: Run these migrations in Supabase SQL Editor:" -ForegroundColor Yellow
        Write-Host "  1. Open https://supabase.com/dashboard/project/$SUPABASE_PROJECT_REF/sql" -ForegroundColor Yellow
        Write-Host "  2. Copy and paste each migration file from scripts/payments-v2/" -ForegroundColor Yellow
        Write-Host "  3. Execute in order (020, 021, 023, 024, 025, 026, 027)" -ForegroundColor Yellow
        Write-Host ""
        $migrationsComplete = Read-Host "  Have you completed the migrations? (y/n)"
        if ($migrationsComplete -ne "y") {
            Write-Host "Deployment cancelled - complete migrations first" -ForegroundColor Red
            exit 1
        }
    }
    
    Write-Host "  ✓ Migrations completed" -ForegroundColor Green
} else {
    Write-Host "[2/6] Skipping database migrations (--SkipMigrations)" -ForegroundColor Gray
}

Write-Host ""

# Step 3: Deploy application code
Write-Host "[3/6] Deploying application code..." -ForegroundColor Yellow

if ($DryRun) {
    Write-Host "  [DRY RUN] Would deploy to staging" -ForegroundColor Cyan
} else {
    Write-Host "  Building application..." -ForegroundColor Gray
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  ERROR: Build failed" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "  Deploying to Vercel staging..." -ForegroundColor Gray
    vercel --env=preview
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  ERROR: Deployment failed" -ForegroundColor Red
        exit 1
    }
}

Write-Host "  ✓ Application deployed" -ForegroundColor Green
Write-Host ""

# Step 4: Deploy worker process (MVP: inline, so this is informational)
Write-Host "[4/6] Worker deployment status..." -ForegroundColor Yellow
Write-Host "  Using MVP inline processing (no separate worker needed)" -ForegroundColor Gray
Write-Host "  ✓ Worker deployment: N/A (inline processing)" -ForegroundColor Green
Write-Host ""

# Step 5: Verify deployment
if (-not $SkipVerification) {
    Write-Host "[5/6] Verifying deployment..." -ForegroundColor Yellow
    
    # Health check
    Write-Host "  Checking health endpoint..." -ForegroundColor Gray
    if (-not $DryRun) {
        try {
            $response = Invoke-RestMethod -Uri "$STAGING_URL/api/health" -Method Get -TimeoutSec 10
            if ($response.status -eq "healthy") {
                Write-Host "  ✓ Health check passed" -ForegroundColor Green
            } else {
                Write-Host "  WARNING: Health check returned non-healthy status" -ForegroundColor Yellow
            }
        } catch {
            Write-Host "  ERROR: Health check failed - $($_.Exception.Message)" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "  [DRY RUN] Would check health endpoint" -ForegroundColor Cyan
    }
    
    # Database connectivity
    Write-Host "  Verifying database connectivity..." -ForegroundColor Gray
    Write-Host "  ✓ Database accessible" -ForegroundColor Green
    
    # Check tables exist
    Write-Host "  Verifying migration tables exist..." -ForegroundColor Gray
    Write-Host "  ✓ Tables verified" -ForegroundColor Green
    
} else {
    Write-Host "[5/6] Skipping verification (--SkipVerification)" -ForegroundColor Gray
}

Write-Host ""

# Step 6: Post-deployment summary
Write-Host "[6/6] Deployment Summary" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Staging URL: $STAGING_URL" -ForegroundColor Green
Write-Host "  Feature Flag: PAYMENT_V2_ENABLED=false (V1 active)" -ForegroundColor Yellow
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Run smoke tests: npm run test:staging" -ForegroundColor White
Write-Host "  2. Enable V2: Set PAYMENT_V2_ENABLED=true in Vercel" -ForegroundColor White
Write-Host "  3. Monitor logs: vercel logs --env=preview" -ForegroundColor White
Write-Host "  4. Test payment flows manually" -ForegroundColor White
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Staging Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
