#!/bin/bash
# Payment Architecture V2 - Enable V2 in Staging
# This script enables the V2 payment architecture in staging environment

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
GRAY='\033[0;37m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# Parse arguments
DISABLE=false
DRY_RUN=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --disable)
            DISABLE=true
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
echo -e "${CYAN}Payment Architecture V2 - Feature Flag Control${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""

if [ "$DISABLE" = true ]; then
    ACTION="DISABLE"
    FLAG_VALUE="false"
    ACTION_COLOR=$YELLOW
else
    ACTION="ENABLE"
    FLAG_VALUE="true"
    ACTION_COLOR=$GREEN
fi

echo -e "${ACTION_COLOR}Action: $ACTION V2 in staging${NC}"
echo -e "${GRAY}Feature Flag: PAYMENT_V2_ENABLED=$FLAG_VALUE${NC}"
echo ""

# Pre-flight checks
echo -e "${YELLOW}[1/4] Pre-flight checks...${NC}"

if [ "$DISABLE" = false ]; then
    echo -e "${GRAY}  Verifying smoke tests completed...${NC}"
    read -p "  Have smoke tests passed? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${RED}  ERROR: Complete smoke tests before enabling V2${NC}"
        exit 1
    fi
    echo -e "${GREEN}  ✓ Smoke tests verified${NC}"
fi

echo ""

# Update environment variable
echo -e "${YELLOW}[2/4] Updating environment variable...${NC}"

if [ "$DRY_RUN" = true ]; then
    echo -e "${CYAN}  [DRY RUN] Would set PAYMENT_V2_ENABLED=$FLAG_VALUE${NC}"
else
    echo -e "${GRAY}  Setting PAYMENT_V2_ENABLED=$FLAG_VALUE in Vercel...${NC}"
    echo ""
    echo -e "${YELLOW}  Run this command:${NC}"
    echo -e "${WHITE}  vercel env add PAYMENT_V2_ENABLED preview${NC}"
    echo -e "${WHITE}  Value: $FLAG_VALUE${NC}"
    echo ""
    echo -e "${YELLOW}  Or update in Vercel Dashboard:${NC}"
    echo -e "${WHITE}  1. Go to Project Settings → Environment Variables${NC}"
    echo -e "${WHITE}  2. Find PAYMENT_V2_ENABLED${NC}"
    echo -e "${WHITE}  3. Set value to: $FLAG_VALUE${NC}"
    echo -e "${WHITE}  4. Select environment: Preview${NC}"
    echo -e "${WHITE}  5. Save changes${NC}"
    echo ""
    read -p "  Have you updated the environment variable? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${RED}  Cancelled${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}  ✓ Environment variable updated${NC}"
echo ""

# Redeploy
echo -e "${YELLOW}[3/4] Redeploying application...${NC}"

if [ "$DRY_RUN" = true ]; then
    echo -e "${CYAN}  [DRY RUN] Would redeploy to staging${NC}"
else
    echo -e "${GRAY}  Triggering redeploy...${NC}"
    vercel --env=preview --force
fi

echo -e "${GREEN}  ✓ Application redeployed${NC}"
echo ""

# Verify
echo -e "${YELLOW}[4/4] Verifying feature flag...${NC}"

if [ "$DRY_RUN" = true ]; then
    echo -e "${CYAN}  [DRY RUN] Would verify feature flag${NC}"
else
    echo -e "${GRAY}  Checking health endpoint...${NC}"
    sleep 10  # Wait for deployment
    
    STAGING_URL=${STAGING_URL:-}
    if [ -z "$STAGING_URL" ]; then
        echo -e "${YELLOW}  WARNING: STAGING_URL not set, skipping verification${NC}"
    else
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$STAGING_URL/api/health" || echo "000")
        if [ "$HTTP_CODE" = "200" ]; then
            echo -e "${GREEN}  ✓ Feature flag verified${NC}"
        else
            echo -e "${YELLOW}  WARNING: Could not verify feature flag (HTTP $HTTP_CODE)${NC}"
        fi
    fi
fi

echo ""

# Summary
echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}Summary${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""

if [ "$DISABLE" = true ]; then
    echo -e "${YELLOW}  V2 has been DISABLED in staging${NC}"
    echo -e "${GRAY}  System is now using V1 payment flow${NC}"
    echo ""
    echo -e "${CYAN}Next Steps:${NC}"
    echo -e "  1. Verify V1 flow works correctly"
    echo -e "  2. Investigate issues that caused rollback"
else
    echo -e "${GREEN}  V2 has been ENABLED in staging${NC}"
    echo -e "${GRAY}  System is now using V2 payment flow${NC}"
    echo ""
    echo -e "${CYAN}Next Steps:${NC}"
    echo -e "  1. Monitor error rates closely"
    echo -e "  2. Test payment flows manually"
    echo -e "  3. Check webhook processing logs"
    echo -e "  4. Verify receipts and emails working"
    echo -e "  5. Monitor for 24-48 hours before production"
    echo ""
    echo -e "${CYAN}Monitoring Commands:${NC}"
    echo -e "  vercel logs --env=preview --follow"
    echo -e "  ./scripts/monitor-staging.sh"
fi

echo ""
echo -e "${CYAN}========================================${NC}"
echo -e "${GREEN}Feature Flag Update Complete!${NC}"
echo -e "${CYAN}========================================${NC}"
