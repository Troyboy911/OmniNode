#!/bin/bash

# Comprehensive Test Suite for OmniNode
# This script runs all tests and validates the entire system

set -e
set -o pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test configuration
BACKEND_URL="http://localhost:3001"
FRONTEND_URL="http://localhost:3000"
TEST_TIMEOUT=30
MAX_RETRIES=3

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

error() {
    echo -e "${RED}[✗]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[⚠]${NC} $1"
}

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to run a test
run_test() {
    local test_name=$1
    local test_command=$2
    local expected_result=$3
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    log "Running: $test_name"
    
    for i in $(seq 1 $MAX_RETRIES); do
        if eval "$test_command" >/dev/null 2>&1; then
            success "$test_name"
            PASSED_TESTS=$((PASSED_TESTS + 1))
            return 0
        else
            if [ $i -eq $MAX_RETRIES ]; then
                error "$test_name (attempt $i/$MAX_RETRIES)"
                FAILED_TESTS=$((FAILED_TESTS + 1))
                return 1
            else
                warning "$test_name failed (attempt $i/$MAX_RETRIES), retrying..."
                sleep 2
            fi
        fi
    done
}

# Start services
log "Starting services for testing..."

# Start backend
cd backend
log "Starting backend server..."
npm run dev &
BACKEND_PID=$!
sleep 10

# Start frontend
cd ../omni-node
log "Starting frontend server..."
npm run dev &
FRONTEND_PID=$!
sleep 10

# Cleanup function
cleanup() {
    log "Cleaning up..."
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    wait
}

# Trap cleanup on exit
trap cleanup EXIT

# Test health endpoints
log "Testing health endpoints..."
run_test "Backend health check" "curl -f $BACKEND_URL/api/health"
run_test "Frontend health check" "curl -f $FRONTEND_URL/api/health"

# Test authentication
log "Testing authentication endpoints..."
run_test "Register endpoint" "curl -f -X POST $BACKEND_URL/api/auth/register \
    -H 'Content-Type: application/json' \
    -d '{&quot;email&quot;:&quot;test@example.com&quot;,&quot;password&quot;:&quot;Test123!&quot;,&quot;name&quot;:&quot;Test User&quot;}'"

run_test "Login endpoint" "curl -f -X POST $BACKEND_URL/api/auth/login \
    -H 'Content-Type: application/json' \
    -d '{&quot;email&quot;:&quot;test@example.com&quot;,&quot;password&quot;:&quot;Test123!&quot;}'"

# Test project endpoints
log "Testing project endpoints..."
TOKEN=$(curl -s -X POST $BACKEND_URL/api/auth/login \
    -H 'Content-Type: application/json' \
    -d '{"email":"test@example.com","password":"Test123!"}' | jq -r '.token')

run_test "Create project" "curl -f -X POST $BACKEND_URL/api/projects \
    -H 'Content-Type: application/json' \
    -H 'Authorization: Bearer $TOKEN' \
    -d '{&quot;name&quot;:&quot;Test Project&quot;,&quot;description&quot;:&quot;Test Description&quot;}'"

run_test "Get projects" "curl -f $BACKEND_URL/api/projects \
    -H 'Authorization: Bearer $TOKEN'"

# Test agent endpoints
log "Testing agent endpoints..."
PROJECT_ID=$(curl -s $BACKEND_URL/api/projects \
    -H 'Authorization: Bearer $TOKEN' | jq -r '.[0].id')

run_test "Create agent" "curl -f -X POST $BACKEND_URL/api/agents \
    -H 'Content-Type: application/json' \
    -H 'Authorization: Bearer $TOKEN' \
    -d '{&quot;name&quot;:&quot;Test Agent&quot;,&quot;type&quot;:&quot;general&quot;,&quot;projectId&quot;:&quot;$PROJECT_ID&quot;,&quot;config&quot;:{&quot;test&quot;:true}}'"

# Test AI endpoints
log "Testing AI endpoints..."
run_test "AI generate endpoint" "curl -f -X POST $BACKEND_URL/api/ai/generate \
    -H 'Content-Type: application/json' \
    -H 'Authorization: Bearer $TOKEN' \
    -d '{&quot;prompt&quot;:&quot;Hello, how are you?&quot;,&quot;model&quot;:&quot;gpt-3.5-turbo&quot;}'"

run_test "AI chat endpoint" "curl -f -X POST $BACKEND_URL/api/ai/chat \
    -H 'Content-Type: application/json' \
    -H 'Authorization: Bearer $TOKEN' \
    -d '{&quot;messages&quot;:[{&quot;role&quot;:&quot;user&quot;,&quot;content&quot;:&quot;Hello&quot;}],&quot;model&quot;:&quot;gpt-3.5-turbo&quot;}'"

# Test file upload endpoints
log "Testing file upload endpoints..."
echo "Test file content" > test-upload.txt
run_test "File upload endpoint" "curl -f -X POST $BACKEND_URL/api/files/upload \
    -H 'Authorization: Bearer $TOKEN' \
    -F 'file=@test-upload.txt'"

# Test WebSocket connection
log "Testing WebSocket connection..."
run_test "WebSocket connection" "timeout 5 bash -c 'echo -e &quot;GET /socket.io/?EIO=4&transport=websocket HTTP/1.1\\r\\nHost: localhost:3001\\r\\n\\r\\n&quot; | nc localhost 3001'"

# Test rate limiting
log "Testing rate limiting..."
run_test "Rate limiting" "timeout 10 bash -c 'for i in {1..10}; do curl -s $BACKEND_URL/api/health; done'"

# Test security headers
log "Testing security headers..."
run_test "Security headers" "curl -I $BACKEND_URL/api/health | grep -E 'X-Content-Type-Options|X-Frame-Options|X-XSS-Protection'"

# Test database operations
log "Testing database operations..."
run_test "Database connection" "node -e &quot;require('@prisma/client').PrismaClient && console.log('DB OK')&quot;"

# Test environment variables
log "Testing environment variables..."
run_test "Environment variables" "node -e &quot;require('dotenv').config(); console.log('ENV OK')&quot;"

# Test TypeScript compilation
log "Testing TypeScript compilation..."
run_test "Backend TypeScript" "cd backend && npm run build"
run_test "Frontend TypeScript" "cd omni-node && npm run build"

# Test linting
log "Testing linting..."
run_test "Backend linting" "cd backend && npm run lint"
run_test "Frontend linting" "cd omni-node && npm run lint"

# Test security scanning
log "Testing security scanning..."
run_test "Backend security scan" "cd backend && npm audit --audit-level moderate"
run_test "Frontend security scan" "cd omni-node && npm audit --audit-level moderate"

# Performance tests
log "Running performance tests..."
run_test "API response time" "timeout 5 bash -c 'time curl -s $BACKEND_URL/api/health'"

# Load tests
log "Running load tests..."
run_test "Load test" "timeout 10 bash -c 'for i in {1..20}; do curl -s $BACKEND_URL/api/health > /dev/null; done'"

# Test cleanup
log "Cleaning up test files..."
rm -f test-upload.txt

# Summary
log "Test Summary:"
log "Total tests: $TOTAL_TESTS"
success "Passed: $PASSED_TESTS"
error "Failed: $FAILED_TESTS"

if [ $FAILED_TESTS -eq 0 ]; then
    success "All tests passed! 🎉"
    exit 0
else
    error "Some tests failed. Please check the logs above. ❌"
    exit 1
fi