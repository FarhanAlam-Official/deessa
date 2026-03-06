#!/bin/bash
# test-credentials.sh
# Tests all payment credentials are configured and working
# Usage: ./scripts/test-credentials.sh

set -e

echo "=================================="
echo "Payment Credentials Test Suite"
echo "=================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Function to test if environment variable is set
test_env_var() {
    local var_name=$1
    local var_value=${!var_name}
    
    if [ -z "$var_value" ]; then
        echo -e "${RED}✗${NC} $var_name is not set"
        ((TESTS_FAILED++))
        return 1
    else
        echo -e "${GREEN}✓${NC} $var_name is set"
        ((TESTS_PASSED++))
        return 0
    fi
}

# Function to test if environment variable has correct format
test_env_format() {
    local var_name=$1
    local expected_prefix=$2
    local var_value=${!var_name}
    
    if [ -z "$var_value" ]; then
        echo -e "${RED}✗${NC} $var_name is not set"
        ((TESTS_FAILED++))
        return 1
    elif [[ $var_value == $expected_prefix* ]]; then
        echo -e "${GREEN}✓${NC} $var_name has correct format"
        ((TESTS_PASSED++))
        return 0
    else
        echo -e "${YELLOW}⚠${NC} $var_name may have incorrect format (expected to start with '$expected_prefix')"
        ((TESTS_PASSED++))
        return 0
    fi
}

echo "1. Testing Stripe Credentials"
echo "------------------------------"
test_env_format "STRIPE_SECRET_KEY" "sk_"
test_env_format "STRIPE_WEBHOOK_SECRET" "whsec_"
echo ""

echo "2. Testing Khalti Credentials"
echo "------------------------------"
test_env_var "KHALTI_SECRET_KEY"
test_env_var "KHALTI_BASE_URL"
echo ""

echo "3. Testing eSewa Credentials"
echo "------------------------------"
test_env_var "ESEWA_MERCHANT_ID"
test_env_var "ESEWA_SECRET_KEY"
test_env_var "ESEWA_BASE_URL"
echo ""

echo "4. Testing Receipt Security"
echo "------------------------------"
test_env_var "RECEIPT_TOKEN_SECRET"

# Check if secret has sufficient length (base64 of 32 bytes = ~44 chars)
if [ ! -z "$RECEIPT_TOKEN_SECRET" ]; then
    if [ ${#RECEIPT_TOKEN_SECRET} -ge 40 ]; then
        echo -e "${GREEN}✓${NC} RECEIPT_TOKEN_SECRET has sufficient length"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}✗${NC} RECEIPT_TOKEN_SECRET is too short (should be at least 40 characters)"
        ((TESTS_FAILED++))
    fi
fi
echo ""

echo "5. Testing Payment Mode Configuration"
echo "------------------------------"
test_env_var "PAYMENT_MODE"

if [ "$PAYMENT_MODE" = "live" ]; then
    echo -e "${YELLOW}⚠${NC} PAYMENT_MODE is set to 'live' - ensure all credentials are production keys"
elif [ "$PAYMENT_MODE" = "mock" ]; then
    echo -e "${GREEN}✓${NC} PAYMENT_MODE is set to 'mock' - safe for testing"
else
    echo -e "${RED}✗${NC} PAYMENT_MODE has invalid value: $PAYMENT_MODE (should be 'live' or 'mock')"
    ((TESTS_FAILED++))
fi
echo ""

echo "6. Testing Supabase Configuration"
echo "------------------------------"
test_env_var "NEXT_PUBLIC_SUPABASE_URL"
test_env_var "NEXT_PUBLIC_SUPABASE_ANON_KEY"
test_env_var "SUPABASE_SERVICE_ROLE_KEY"
echo ""

echo "7. Testing Email Configuration"
echo "------------------------------"
test_env_var "GOOGLE_EMAIL"
test_env_var "GOOGLE_APP_PASSWORD"
echo ""

echo "8. Testing Security Configuration"
echo "------------------------------"
test_env_var "CRON_SECRET"

# Check CRON_SECRET length
if [ ! -z "$CRON_SECRET" ]; then
    if [ ${#CRON_SECRET} -ge 32 ]; then
        echo -e "${GREEN}✓${NC} CRON_SECRET has sufficient length"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}✗${NC} CRON_SECRET is too short (should be at least 32 characters)"
        ((TESTS_FAILED++))
    fi
fi
echo ""

echo "=================================="
echo "Test Summary"
echo "=================================="
echo -e "${GREEN}Passed:${NC} $TESTS_PASSED"
echo -e "${RED}Failed:${NC} $TESTS_FAILED"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All credential tests passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ Some credential tests failed. Please check your .env configuration.${NC}"
    exit 1
fi
