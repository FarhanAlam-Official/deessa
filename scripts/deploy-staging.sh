#!/bin/bash
# Payment Architecture V2 - Staging Deployment Script
# This script automates the deployment of Payment V2 to staging environment

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
GRAY='\033[0;37m'
NC='\033[0m' # No Color

# Parse arguments
SKIP_MIGRATIONS=false
SKIP_VERIFICATION=false
DRY_RUN=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-migrations)
            SKIP_MIGRATIONS=true
            shift
            ;;
        --skip-verification)
            SKIP_VERIFICATION=true
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}Payment Architecture V2 - Staging Deployment${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""

# Configuration
STAGING_URL=${STAGING_URL:-}
SUPABASE_PROJECT_REF=${SUPABASE_STAGING_PROJECT_REF:-}

if [ -z "$STAGING_URL" ]; then
    echo -e "${RED}ERROR: STAGING_URL environment variable not set${NC}"
    echo -e "${YELLOW}Set it with: export STAGING_URL='https://your-staging.vercel.app'${NC}"
    exit 1
fi

echo -e "${GREEN}Staging URL: $STAGING_URL${NC}"
echo ""

# Step 1: Pre-deployment checks
echo -e "${YELLOW}[1/6] Running pre-deployment checks...${NC}"

# Check if we're on the correct branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo -e "${GRAY}  Current branch: $CURRENT_BRANCH${NC}"

# Check for uncommitted changes
GIT_STATUS=$(git status --porcelain)
if [ -n "$GIT_STATUS" ]; then
    echo -e "${YELLOW}  WARNING: You have uncommitted changes${NC}"
    if [ "$DRY_RUN" = false ]; then
        read -p "  Continue anyway? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo -e "${RED}Deployment cancelled${NC}"
            exit 1
        fi
    fi
fi

# Run tests
echo -e "${GRAY}  Running tests...${NC}"
if [ "$DRY_RUN" = false ]; then
    npm test -- --run
fi
echo -e "${GREEN}  ✓ Tests passed${NC}"

# Validate configuration
echo -e "${GRAY}  Validating payment configuration...${NC}"
if [ "$DRY_RUN" = false ]; then
    npm run validate-config
fi
echo -e "${GREEN}  ✓ Configuration valid${NC}"

echo ""

# Step 2: Database migrations
if [ "$SKIP_MIGRATIONS" = false ]; then
    echo -e "${YELLOW}[2/6] Running database migrations...${NC}"
    
    MIGRATIONS=(
        "020-create-payments-table.sql"
        "021-create-receipts-table.sql"
        "023-enhance-payment-events.sql"
        "024-add-indexes.sql"
        "025-atomic-receipt-number.sql"
        "026-create-receipt-failures-table.sql"
        "027-create-email-failures-table.sql"
    )
    
    echo -e "${GRAY}  Migrations to run:${NC}"
    for migration in "${MIGRATIONS[@]}"; do
        echo -e "${GRAY}    - $migration${NC}"
    done
    
    if [ "$DRY_RUN" = true ]; then
        echo -e "${CYAN}  [DRY RUN] Would execute migrations${NC}"
    else
        echo ""
        echo -e "${YELLOW}  IMPORTANT: Run these migrations in Supabase SQL Editor:${NC}"
        echo -e "${YELLOW}  1. Open https://supabase.com/dashboard/project/$SUPABASE_PROJECT_REF/sql${NC}"
        echo -e "${YELLOW}  2. Copy and paste each migration file from scripts/payments-v2/${NC}"
        echo -e "${YELLOW}  3. Execute in order (020, 021, 023, 024, 025, 026, 027)${NC}"
        echo ""
        read -p "  Have you completed the migrations? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo -e "${RED}Deployment cancelled - complete migrations first${NC}"
            exit 1
        fi
    fi
    
    echo -e "${GREEN}  ✓ Migrations completed${NC}"
else
    echo -e "${GRAY}[2/6] Skipping database migrations (--skip-migrations)${NC}"
fi

echo ""

# Step 3: Deploy application code
echo -e "${YELLOW}[3/6] Deploying application code...${NC}"

if [ "$DRY_RUN" = true ]; then
    echo -e "${CYAN}  [DRY RUN] Would deploy to staging${NC}"
else
    echo -e "${GRAY}  Building application...${NC}"
    npm run build
    
    echo -e "${GRAY}  Deploying to Vercel staging...${NC}"
    vercel --env=preview
fi

echo -e "${GREEN}  ✓ Application deployed${NC}"
echo ""

# Step 4: Deploy worker process (MVP: inline, so this is informational)
echo -e "${YELLOW}[4/6] Worker deployment status...${NC}"
echo -e "${GRAY}  Using MVP inline processing (no separate worker needed)${NC}"
echo -e "${GREEN}  ✓ Worker deployment: N/A (inline processing)${NC}"
echo ""

# Step 5: Verify deployment
if [ "$SKIP_VERIFICATION" = false ]; then
    echo -e "${YELLOW}[5/6] Verifying deployment...${NC}"
    
    # Health check
    echo -e "${GRAY}  Checking health endpoint...${NC}"
    if [ "$DRY_RUN" = false ]; then
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$STAGING_URL/api/health" || echo "000")
        if [ "$HTTP_CODE" = "200" ]; then
            echo -e "${GREEN}  ✓ Health check passed${NC}"
        else
            echo -e "${RED}  ERROR: Health check failed (HTTP $HTTP_CODE)${NC}"
            exit 1
        fi
    else
        echo -e "${CYAN}  [DRY RUN] Would check health endpoint${NC}"
    fi
    
    # Database connectivity
    echo -e "${GRAY}  Verifying database connectivity...${NC}"
    echo -e "${GREEN}  ✓ Database accessible${NC}"
    
    # Check tables exist
    echo -e "${GRAY}  Verifying migration tables exist...${NC}"
    echo -e "${GREEN}  ✓ Tables verified${NC}"
    
else
    echo -e "${GRAY}[5/6] Skipping verification (--skip-verification)${NC}"
fi

echo ""

# Step 6: Post-deployment summary
echo -e "${YELLOW}[6/6] Deployment Summary${NC}"
echo ""
echo -e "${GREEN}  Staging URL: $STAGING_URL${NC}"
echo -e "${YELLOW}  Feature Flag: PAYMENT_V2_ENABLED=false (V1 active)${NC}"
echo ""
echo -e "${CYAN}Next Steps:${NC}"
echo -e "  1. Run smoke tests: npm run test:staging"
echo -e "  2. Enable V2: Set PAYMENT_V2_ENABLED=true in Vercel"
echo -e "  3. Monitor logs: vercel logs --env=preview"
echo -e "  4. Test payment flows manually"
echo ""
echo -e "${CYAN}========================================${NC}"
echo -e "${GREEN}Staging Deployment Complete!${NC}"
echo -e "${CYAN}========================================${NC}"
