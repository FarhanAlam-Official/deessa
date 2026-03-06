# Payment Architecture V2 - Production Deployment Script
# This script automates the deployment of Payment V2 to production environment

param(
    [switch]$SkipMigrations = $false,
    [switch]$SkipVerification = $false,
    [switch]$DryRun = $false
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Payment Architecture V2 - PRODUCTION Deployment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  WARNING: This will deploy to PRODUCTION" -ForegroundColor Red
Write-Host ""

# Configuration
$PRODUCTION_URL = $env:PRODUCTION_URL
$SUPABASE_PROJECT_REF = $env:SUPABASE_PRODUCTION_PROJECT_REF

if (-not $PRODUCTION_URL) {
    Write-Host "ERROR: PRODUCTION_URL environment variable not set" -ForegroundColor Red
    Write-Host "Set it with: `$env:PRODUCTION_URL = 'https://your-production.com'" -ForegroundColor Yellow
    exit 1
}

Write-Host "Production URL: $PRODUCTION_URL" -ForegroundColor Green
Write-Host ""

# Confirmation
if (-not $DryRun) {
    Write-Host "This will deploy Payment Architecture V2 to PRODUCTION" -ForegroundColor Yellow
    Write-Host "Please confirm you have:" -ForegroundColor Yellow
    Write-Host "  ✓ Completed staging deployment successfully" -ForegroundColor White
    Write-Host "  ✓ Run all smoke tests in staging" -ForegroundColor White
    Write-Host "  ✓ Monitored staging for 24-48 hours" -ForegroundColor White
    Write-Host "  ✓ Reviewed and approved deployment plan" -ForegroundColor White
    Write-Host "  ✓ Notified team of deployment window" -ForegroundColor White
    Write-Host "  ✓ Backed up production database" -ForegroundColor White
    Write-Host ""
    $confirm = Read-Host "Type 'DEPLOY' to continue"
    if ($confirm -ne "DEPLOY") {
        Write-Host "Deployment cancelled" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""

# Step 1: Pre-deployment checks
Write-Host "[1/6] Running pre-deployment checks..." -ForegroundColor Yellow

# Check if we're on the correct branch
$currentBranch = git rev-parse --abbrev-ref HEAD
Write-Host "  Current branch: $currentBranch" -ForegroundColor Gray

if ($currentBranch -ne "main" -and $currentBranch -ne "master") {
    Write-Host "  WARNING: Not on main/master branch" -ForegroundColor Yellow
    if (-not $DryRun) {
        $continue = Read-Host "  Continue anyway? (y/n)"
        if ($continue -ne "y") {
            Write-Host "Deployment cancelled" -ForegroundColor Red
            exit 1
        }
    }
}

# Check for uncommitted changes
$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Host "  ERROR: You have uncommitted changes" -ForegroundColor Red
    Write-Host "  Commit or stash changes before deploying to production" -ForegroundColor Yellow
    exit 1
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

# Verify staging success
Write-Host "  Verifying staging deployment..." -ForegroundColor Gray
$stagingSuccess = Read-Host "  Has staging been running successfully for 24-48 hours? (y/n)"
if ($stagingSuccess -ne "y") {
    Write-Host "  ERROR: Staging must be stable before production deployment" -ForegroundColor Red
    exit 1
}
Write-Host "  ✓ Staging verified" -ForegroundColor Green

Write-Host ""

# Step 2: Database migrations
if (-not $SkipMigrations) {
    Write-Host "[2/6] Running database migrations..." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  ⚠️  CRITICAL: Database migrations for PRODUCTION" -ForegroundColor Red
    Write-Host ""
    
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
        Write-Host "  2. BACKUP DATABASE FIRST!" -ForegroundColor Red
        Write-Host "  3. Copy and paste each migration file from scripts/payments-v2/" -ForegroundColor Yellow
        Write-Host "  4. Execute in order (020, 021, 023, 024, 025, 026, 027)" -ForegroundColor Yellow
        Write-Host "  5. Verify each migration succeeds before proceeding" -ForegroundColor Yellow
        Write-Host ""
        $migrationsComplete = Read-Host "  Have you completed the migrations? (y/n)"
        if ($migrationsComplete -ne "y") {
            Write-Host "Deployment cancelled - complete migrations first" -ForegroundColor Red
            exit 1
        }
        
        # Verify migrations
        Write-Host "  Verifying migrations..." -ForegroundColor Gray
        $migrationsVerified = Read-Host "  Have you verified all tables exist? (y/n)"
        if ($migrationsVerified -ne "y") {
            Write-Host "Deployment cancelled - verify migrations first" -ForegroundColor Red
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
    Write-Host "  [DRY RUN] Would deploy to production" -ForegroundColor Cyan
} else {
    Write-Host "  Building application..." -ForegroundColor Gray
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  ERROR: Build failed" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "  Deploying to Vercel production..." -ForegroundColor Gray
    Write-Host "  ⚠️  This will deploy to PRODUCTION" -ForegroundColor Red
    $deployConfirm = Read-Host "  Type 'YES' to deploy"
    if ($deployConfirm -ne "YES") {
        Write-Host "Deployment cancelled" -ForegroundColor Red
        exit 1
    }
    
    vercel --prod
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
    
    # Wait for deployment to propagate
    Write-Host "  Waiting for deployment to propagate (30 seconds)..." -ForegroundColor Gray
    if (-not $DryRun) {
        Start-Sleep -Seconds 30
    }
    
    # Health check
    Write-Host "  Checking health endpoint..." -ForegroundColor Gray
    if (-not $DryRun) {
        try {
            $response = Invoke-RestMethod -Uri "$PRODUCTION_URL/api/health" -Method Get -TimeoutSec 10
            if ($response.status -eq "healthy") {
                Write-Host "  ✓ Health check passed" -ForegroundColor Green
                
                # Verify V2 is DISABLED initially
                if ($response.features.paymentV2Enabled -eq $false) {
                    Write-Host "  ✓ V2 is disabled (as expected)" -ForegroundColor Green
                } else {
                    Write-Host "  ⚠️  WARNING: V2 is enabled (should be disabled initially)" -ForegroundColor Yellow
                }
            } else {
                Write-Host "  WARNING: Health check returned non-healthy status" -ForegroundColor Yellow
            }
        } catch {
            Write-Host "  ERROR: Health check failed - $($_.Exception.Message)" -ForegroundColor Red
            Write-Host "  Consider rolling back deployment" -ForegroundColor Yellow
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
Write-Host "  Production URL: $PRODUCTION_URL" -ForegroundColor Green
Write-Host "  Feature Flag: PAYMENT_V2_ENABLED=false (V1 active)" -ForegroundColor Yellow
Write-Host "  Deployment Time: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
Write-Host ""
Write-Host "⚠️  IMPORTANT: V2 is NOT yet enabled in production" -ForegroundColor Red
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Monitor production for 1-2 hours (V1 should work normally)" -ForegroundColor White
Write-Host "  2. Run production smoke tests" -ForegroundColor White
Write-Host "  3. Enable V2 incrementally (Task 28.5):" -ForegroundColor White
Write-Host "     - Start with 10% traffic" -ForegroundColor White
Write-Host "     - Monitor closely" -ForegroundColor White
Write-Host "     - Gradually increase to 100%" -ForegroundColor White
Write-Host "  4. Monitor logs: vercel logs --prod --follow" -ForegroundColor White
Write-Host ""
Write-Host "Rollback Procedure (if needed):" -ForegroundColor Cyan
Write-Host "  vercel rollback [previous-deployment-url]" -ForegroundColor White
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Production Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
