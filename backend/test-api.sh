#!/bin/bash

##############################################################################
# Quote API Test Script
#
# Tests all REST API endpoints for the Quote Management API
# Requires: curl, jq, a running backend, and a valid Cognito JWT token
##############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
API_URL="${API_URL:-http://localhost:3000}"
TOKEN="${COGNITO_TOKEN:-}"

# Test results tracking
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_TOTAL=0

##############################################################################
# Helper Functions
##############################################################################

print_header() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

print_test() {
    echo -e "${YELLOW}▸ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
    ((TESTS_PASSED++))
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
    ((TESTS_FAILED++))
}

test_endpoint() {
    ((TESTS_TOTAL++))
    local method=$1
    local endpoint=$2
    local expected_status=$3
    local data=$4
    local description=$5

    print_test "$description"

    if [ -z "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X "$method" \
            -H "Authorization: Bearer $TOKEN" \
            -H "Content-Type: application/json" \
            "${API_URL}${endpoint}")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" \
            -H "Authorization: Bearer $TOKEN" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "${API_URL}${endpoint}")
    fi

    status_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)

    if [ "$status_code" = "$expected_status" ]; then
        print_success "Status: $status_code (expected: $expected_status)"
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
        echo "$body"  # Return for further processing
        return 0
    else
        print_error "Status: $status_code (expected: $expected_status)"
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
        return 1
    fi
}

##############################################################################
# Pre-flight Checks
##############################################################################

print_header "PRE-FLIGHT CHECKS"

# Check for required tools
print_test "Checking for required tools"
command -v curl >/dev/null 2>&1 || { print_error "curl is required but not installed."; exit 1; }
command -v jq >/dev/null 2>&1 || { print_error "jq is required but not installed."; exit 1; }
print_success "All required tools found (curl, jq)"

# Check if token is set
if [ -z "$TOKEN" ]; then
    print_error "COGNITO_TOKEN environment variable is not set"
    echo ""
    echo "To get a token:"
    echo "1. Sign in to frontend: ${API_URL/3000/5173}"
    echo "2. Open browser DevTools → Application → Local Storage"
    echo "3. Copy the access_token value"
    echo "4. Run: export COGNITO_TOKEN='<your-token>'"
    echo ""
    exit 1
fi
print_success "Cognito token is set"

# Check API health
print_test "Checking API health endpoint"
health_response=$(curl -s "${API_URL}/health" || echo "FAILED")
if echo "$health_response" | jq -e '.status == "healthy" or .status == "degraded"' >/dev/null 2>&1; then
    print_success "API is reachable and responding"
    echo "$health_response" | jq '.'
else
    print_error "API health check failed"
    echo "$health_response"
    exit 1
fi

##############################################################################
# Authentication Tests
##############################################################################

print_header "AUTHENTICATION TESTS"

# Test without token (should fail)
print_test "Endpoint without authentication should return 401"
response=$(curl -s -w "\n%{http_code}" -X GET "${API_URL}/api/quotes")
status_code=$(echo "$response" | tail -n1)
if [ "$status_code" = "401" ]; then
    print_success "Correctly rejected unauthenticated request"
    ((TESTS_PASSED++))
else
    print_error "Expected 401, got $status_code"
    ((TESTS_FAILED++))
fi
((TESTS_TOTAL++))

##############################################################################
# Quote CRUD Tests
##############################################################################

print_header "QUOTE CRUD OPERATIONS"

# 1. Create a quote
create_quote_data='{
  "customer_name": "Test Customer",
  "customer_email": "test@example.com",
  "customer_phone": "0400123456",
  "customer_address": "123 Test St, Sydney NSW 2000",
  "location": {
    "suburb": "Sydney",
    "postcode": "2000"
  },
  "status": "draft"
}'

create_response=$(test_endpoint "POST" "/api/quotes" "201" "$create_quote_data" "Create new quote")
QUOTE_ID=$(echo "$create_response" | jq -r '.data.id // empty')

if [ -z "$QUOTE_ID" ]; then
    print_error "Failed to create quote - no ID returned"
    exit 1
fi

echo -e "${GREEN}Created quote ID: $QUOTE_ID${NC}"

# 2. Get quote by ID
test_endpoint "GET" "/api/quotes/$QUOTE_ID" "200" "" "Get quote by ID"

# 3. Get all quotes (list)
test_endpoint "GET" "/api/quotes" "200" "" "List all quotes"

# 4. Search quotes
test_endpoint "GET" "/api/quotes/search?q=Test" "200" "" "Search quotes by customer name"

# 5. Update quote
update_quote_data='{
  "customer_phone": "0400999888",
  "status": "quoted"
}'

test_endpoint "PUT" "/api/quotes/$QUOTE_ID" "200" "$update_quote_data" "Update quote"

##############################################################################
# Jobs Sub-resource Tests
##############################################################################

print_header "JOBS SUB-RESOURCE"

# Add a job to the quote
add_job_data='{
  "job_type": "retaining_wall",
  "order_index": 1,
  "parameters": {
    "length_m": 10,
    "height_m": 1.5,
    "wall_type": "timber"
  },
  "materials": {
    "timber_posts": {"quantity": 12, "unit_price": 45.00},
    "sleepers": {"quantity": 20, "unit_price": 38.50}
  },
  "labour": {
    "excavation_hours": 4,
    "installation_hours": 8
  },
  "calculations": {
    "total_materials": 1240.00,
    "total_labour": 960.00
  },
  "subtotal": 2200.00
}'

test_endpoint "POST" "/api/quotes/$QUOTE_ID/jobs" "201" "$add_job_data" "Add job to quote"

# Verify job was added
test_endpoint "GET" "/api/quotes/$QUOTE_ID" "200" "" "Get quote with jobs"

##############################################################################
# Financials Sub-resource Tests
##############################################################################

print_header "FINANCIALS SUB-RESOURCE"

# Create/update financials
upsert_financials_data='{
  "direct_cost": 2200.00,
  "overhead_multiplier": 1.3,
  "profit_first": 0.30,
  "gst_rate": 0.10,
  "gst_amount": 1031.89,
  "total_inc_gst": 11350.78,
  "rounded_total": 11350.00,
  "deposit": 3405.00
}'

test_endpoint "PUT" "/api/quotes/$QUOTE_ID/financials" "200" "$upsert_financials_data" "Upsert financials"

# Verify financials were added
test_endpoint "GET" "/api/quotes/$QUOTE_ID" "200" "" "Get quote with financials"

##############################################################################
# Filtering and Pagination Tests
##############################################################################

print_header "FILTERING & PAGINATION"

# Filter by status
test_endpoint "GET" "/api/quotes?status=draft" "200" "" "Filter quotes by status=draft"
test_endpoint "GET" "/api/quotes?status=quoted" "200" "" "Filter quotes by status=quoted"

# Pagination
test_endpoint "GET" "/api/quotes?limit=10&offset=0" "200" "" "Paginate quotes (limit=10, offset=0)"

##############################################################################
# Delete Tests
##############################################################################

print_header "DELETE OPERATIONS"

# Delete quote (cascades to jobs and financials)
test_endpoint "DELETE" "/api/quotes/$QUOTE_ID" "200" "" "Delete quote (cascade to jobs/financials)"

# Verify deletion
print_test "Verify quote was deleted (should return 404)"
response=$(curl -s -w "\n%{http_code}" -X GET \
    -H "Authorization: Bearer $TOKEN" \
    "${API_URL}/api/quotes/$QUOTE_ID")
status_code=$(echo "$response" | tail -n1)
((TESTS_TOTAL++))
if [ "$status_code" = "404" ]; then
    print_success "Quote successfully deleted"
    ((TESTS_PASSED++))
else
    print_error "Expected 404, got $status_code"
    ((TESTS_FAILED++))
fi

##############################################################################
# Test Summary
##############################################################################

print_header "TEST SUMMARY"

echo ""
echo -e "Total Tests:  ${BLUE}$TESTS_TOTAL${NC}"
echo -e "Passed:       ${GREEN}$TESTS_PASSED${NC}"
echo -e "Failed:       ${RED}$TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}  ✓ ALL TESTS PASSED${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    exit 0
else
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}  ✗ SOME TESTS FAILED${NC}"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    exit 1
fi
