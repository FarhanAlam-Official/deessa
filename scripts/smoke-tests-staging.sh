#!/bin/bash
# Payment Architecture V2 - Staging Smoke Tests
# This script runs automated smoke tests against staging environment

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
STAGING_URL=${1:-$STAGING_URL}
SKIP_STRIPE=false
SKIP_KHALTI=false
SKIP_ESEWA=false
VERBOSE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-stripe)
            SKIP_STRIPE=true
            shift
            ;;
        --skip-khalti)
            SKIP_KHALTI=true
            shift
            ;;
        --skip-esewa)
            SKIP_ESEWA=true
            shift
            ;;
        --verbose)
            VERBOSE=true
            shift
            ;;
        *)
            STAGING_URL=$1
            shift
            ;;
    esac
done

echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}Payment Architecture V2 - Smoke Tests${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""

if [ -z "$STAGING_URL" ]; then
    echo -e "${RED}ERROR: Staging URL not provided${NC}"
    echo -e "${YELLOW}Usage: ./smoke-tests-staging.sh https://your-staging.vercel.app${NC}"
    exit 1
fi

echo -e "${GREEN}Testing against: $STAGING_URL${NC}"
echo ""

# Test counters
PASSED=0
FAILED=0
SKIPPED=0

# Test function
test_endpoint() {
    local name=$1
    local url=$2
    local expected_status=${3:-200}
    
    echo -e "${GRAY}  Testing: $name${NC}"
    
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$url" || echo "000")
    
    if [ "$HTTP_CODE" = "$expected_status" ]; then
        echo -e "${GREEN}    ✓ PASS${NC}"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}    ✗ FAIL - Expected $expected_status, got $HTTP_CODE${NC}"
        ((FAILED++))
        return 1
    fi
}

# Test 1: Health Check
echo -e "${YELLOW}[1/7] Health Check${NC}"
test_endpoint "API Health" "$STAGING_URL/api/health"
echo ""

# Test 2: Homepage Load
echo -e "${YELLOW}[2/7] Homepage Load${NC}"
test_endpoint "Homepage" "$STAGING_URL/"
echo ""

# Test 3: Donation Form Access
echo -e "${YELLOW}[3/7] Donation Form Access${NC}"
test_endpoint "Donation Form" "$STAGING_URL/donate"
echo ""

# Test 4: Stripe Payment Flow
if [ "$SKIP_STRIPE" = false ]; then
    echo -e "${YELLOW}[4/7] Stripe Payment Flow${NC}"
    echo -e "${YELLOW}  Manual test required:${NC}"
    echo -e "${WHITE}    1. Go to $STAGING_URL/donate${NC}"
    echo -e "${WHITE}    2. Enter test donation details${NC}"
    echo -e "${WHITE}    3. Select Stripe as payment method${NC}"
    echo -e "${WHITE}    4. Use test card: 4242 4242 4242 4242${NC}"
    echo -e "${WHITE}    5. Complete payment${NC}"
    echo -e "${WHITE}    6. Verify success page shows${NC}"
    echo -e "${WHITE}    7. Check email for receipt${NC}"
    echo ""
    read -p "  Did Stripe payment test pass? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${GREEN}    ✓ PASS${NC}"
        ((PASSED++))
    else
        echo -e "${RED}    ✗ FAIL${NC}"
        ((FAILED++))
    fi
else
    echo -e "${GRAY}[4/7] Stripe Payment Flow - SKIPPED${NC}"
    ((SKIPPED++))
fi
echo ""

# Test 5: Khalti Payment Flow
if [ "$SKIP_KHALTI" = false ]; then
    echo -e "${YELLOW}[5/7] Khalti Payment Flow${NC}"
    echo -e "${YELLOW}  Manual test required:${NC}"
    echo -e "${WHITE}    1. Go to $STAGING_URL/donate${NC}"
    echo -e "${WHITE}    2. Enter test donation details${NC}"
    echo -e "${WHITE}    3. Select Khalti as payment method${NC}"
    echo -e "${WHITE}    4. Use test credentials from Khalti dashboard${NC}"
    echo -e "${WHITE}    5. Complete payment${NC}"
    echo -e "${WHITE}    6. Verify success page shows${NC}"
    echo -e "${WHITE}    7. Check email for receipt${NC}"
    echo ""
    read -p "  Did Khalti payment test pass? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${GREEN}    ✓ PASS${NC}"
        ((PASSED++))
    else
        echo -e "${RED}    ✗ FAIL${NC}"
        ((FAILED++))
    fi
else
    echo -e "${GRAY}[5/7] Khalti Payment Flow - SKIPPED${NC}"
    ((SKIPPED++))
fi
echo ""

# Test 6: eSewa Payment Flow
if [ "$SKIP_ESEWA" = false ]; then
    echo -e "${YELLOW}[6/7] eSewa Payment Flow${NC}"
    echo -e "${YELLOW}  Manual test required:${NC}"
    echo -e "${WHITE}    1. Go to $STAGING_URL/donate${NC}"
    echo -e "${WHITE}    2. Enter test donation details${NC}"
    echo -e "${WHITE}    3. Select eSewa as payment method${NC}"
    echo -e "${WHITE}    4. Use test credentials from eSewa dashboard${NC}"
    echo -e "${WHITE}    5. Complete payment${NC}"
    echo -e "${WHITE}    6. Verify success page shows${NC}"
    echo -e "${WHITE}    7. Check email for receipt${NC}"
    echo ""
    read -p "  Did eSewa payment test pass? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${GREEN}    ✓ PASS${NC}"
        ((PASSED++))
    else
        echo -e "${RED}    ✗ FAIL${NC}"
        ((FAILED++))
    fi
else
    echo -e "${GRAY}[6/7] eSewa Payment Flow - SKIPPED${NC}"
    ((SKIPPED++))
fi
echo ""

# Test 7: Database Verification
echo -e "${YELLOW}[7/7] Database Verification${NC}"
echo -e "${YELLOW}  Manual verification required:${NC}"
echo -e "${WHITE}    1. Open Supabase SQL Editor${NC}"
echo -e "${WHITE}    2. Run: SELECT COUNT(*) FROM donations WHERE payment_status = 'CONFIRMED';${NC}"
echo -e "${WHITE}    3. Run: SELECT COUNT(*) FROM receipts;${NC}"
echo -e "${WHITE}    4. Run: SELECT COUNT(*) FROM payment_events;${NC}"
echo -e "${WHITE}    5. Verify counts match expected test donations${NC}"
echo ""
read -p "  Did database verification pass? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${GREEN}    ✓ PASS${NC}"
    ((PASSED++))
else
    echo -e "${RED}    ✗ FAIL${NC}"
    ((FAILED++))
fi
echo ""

# Summary
TOTAL=$((PASSED + FAILED + SKIPPED))

echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}Test Summary${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""
echo -e "${WHITE}  Total Tests: $TOTAL${NC}"
echo -e "${GREEN}  Passed: $PASSED${NC}"
echo -e "${RED}  Failed: $FAILED${NC}"
echo -e "${GRAY}  Skipped: $SKIPPED${NC}"
echo ""

# Exit code
if [ $FAILED -gt 0 ]; then
    echo -e "${RED}❌ Some tests failed. Review failures before proceeding.${NC}"
    exit 1
else
    echo -e "${GREEN}✅ All tests passed! Ready to enable V2.${NC}"
    exit 0
fi
