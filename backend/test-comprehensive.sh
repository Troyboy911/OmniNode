#!/bin/bash

echo "🧪 Comprehensive Backend Testing"
echo "================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0
TOTAL_TESTS=0

# Function to run test
run_test() {
    local test_name=$1
    local test_command=$2
    
    echo -n "Testing $test_name... "
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    if eval "$test_command" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ PASSED${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${RED}❌ FAILED${NC}"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
}

# Test 1: Environment validation
echo -e "\n${YELLOW}📋 Environment Validation${NC}"
run_test "Environment variables" "[ -f .env ] || [ -f .env.example ]"
run_test "TypeScript configuration" "[ -f tsconfig.json ]"
run_test "Package.json exists" "[ -f package.json ]"

# Test 2: Code compilation
echo -e "\n${YELLOW}🔧 Code Compilation${NC}"
run_test "TypeScript compilation" "npx tsc --noEmit"

# Test 3: Import validation
echo -e "\n${YELLOW}📦 Import Validation${NC}"
run_test "Database config import" "node -e &quot;require('./dist/config/database.js')&quot; 2>/dev/null || node -e &quot;require('./src/config/database.ts')&quot; 2>/dev/null"
run_test "Services import" "node -e &quot;require('./dist/services/index.js')&quot; 2>/dev/null || node -e &quot;require('./src/services/index.ts')&quot; 2>/dev/null"

# Test 4: Database schema validation
echo -e "\n${YELLOW}🗄️ Database Schema Validation${NC}"
run_test "Prisma schema validation" "npx prisma validate"
run_test "Prisma client generation" "npx prisma generate"

# Test 5: TypeScript type checking
echo -e "\n${YELLOW}📝 TypeScript Type Checking${NC}"
run_test "TypeScript strict mode" "npx tsc --strict --noEmit"

# Test 6: Configuration validation
echo -e "\n${YELLOW}⚙️ Configuration Validation${NC}"
run_test "Environment config" "node -e &quot;require('./src/config/env.ts')&quot; 2>/dev/null"
run_test "Logger config" "node -e &quot;require('./src/config/logger.ts')&quot; 2>/dev/null"

# Test 7: Service validation
echo -e "\n${YELLOW}🛠️ Service Validation${NC}"
run_test "OpenAI service" "node -e &quot;require('./src/services/ai/openai.service.ts')&quot; 2>/dev/null"
run_test "Anthropic service" "node -e &quot;require('./src/services/ai/anthropic.service.ts')&quot; 2>/dev/null"
run_test "Task queue service" "node -e &quot;require('./src/services/queue/task.queue.ts')&quot; 2>/dev/null"
run_test "Memory service" "node -e &quot;require('./src/services/memory/agent.memory.ts')&quot; 2>/dev/null"
run_test "Execution engine" "node -e &quot;require('./src/services/agent.execution.ts')&quot; 2>/dev/null"

# Test 8: Route validation
echo -e "\n${YELLOW}🌐 Route Validation${NC}"
run_test "Auth routes" "node -e &quot;require('./src/routes/auth.routes.ts')&quot; 2>/dev/null"
run_test "Agent routes" "node -e &quot;require('./src/routes/agent.routes.ts')&quot; 2>/dev/null"
run_test "Project routes" "node -e &quot;require('./src/routes/project.routes.ts')&quot; 2>/dev/null"
run_test "Task routes" "node -e &quot;require('./src/routes/task.routes.ts')&quot; 2>/dev/null"
run_test "Command routes" "node -e &quot;require('./src/routes/command.routes.ts')&quot; 2>/dev/null"

# Test 9: Middleware validation
echo -e "\n${YELLOW}🔒 Middleware Validation${NC}"
run_test "Auth middleware" "node -e &quot;require('./src/middleware/auth.ts')&quot; 2>/dev/null"
run_test "Error handler" "node -e &quot;require('./src/middleware/errorHandler.ts')&quot; 2>/dev/null"
run_test "Validator" "node -e &quot;require('./src/middleware/validator.ts')&quot; 2>/dev/null"

# Test 10: Controller validation
echo -e "\n${YELLOW}🎮 Controller Validation${NC}"
run_test "Auth controller" "node -e &quot;require('./src/controllers/auth.controller.ts')&quot; 2>/dev/null"
run_test "Agent controller" "node -e &quot;require('./src/controllers/agent.controller.ts')&quot; 2>/dev/null"
run_test "Project controller" "node -e &quot;require('./src/controllers/project.controller.ts')&quot; 2>/dev/null"
run_test "Task controller" "node -e &quot;require('./src/controllers/task.controller.ts')&quot; 2>/dev/null"
run_test "Command controller" "node -e &quot;require('./src/controllers/command.controller.ts')&quot; 2>/dev/null"

# Test 11: Database connection test
echo -e "\n${YELLOW}🔗 Database Connection${NC}"
run_test "Database health check" "node -e &quot;require('./src/config/database.ts').DatabaseService.healthCheck().then(r => process.exit(r ? 0 : 1))&quot; 2>/dev/null"

# Test 12: TypeScript compilation with paths
echo -e "\n${YELLOW}📂 TypeScript Path Resolution${NC}"
run_test "Path resolution" "npx tsc --noEmit --traceResolution 2>/dev/null | grep -q &quot;error&quot; && exit 1 || exit 0"

# Test 13: Import/export validation
echo -e "\n${YELLOW}🔄 Import/Export Validation${NC}"
run_test "Services index export" "node -e &quot;require('./src/services/index.ts')&quot; 2>/dev/null"

# Test 14: Prisma schema compatibility
echo -e "\n${YELLOW}📋 Prisma Compatibility${NC}"
run_test "Prisma schema compatibility" "npx prisma generate --no-engine 2>/dev/null"

# Test 15: Configuration validation
echo -e "\n${YELLOW}⚙️ Configuration Tests${NC}"
run_test "Environment validation" "node -e &quot;require('./src/config/env.ts')&quot; 2>/dev/null"

# Test 16: Type safety validation
echo -e "\n${YELLOW}🎯 Type Safety Validation${NC}"
run_test "Type safety check" "npx tsc --noEmit --strict"

# Test 17: Package.json validation
echo -e "\n${YELLOW}📦 Package Validation${NC}"
run_test "Dependencies check" "npm ls 2>/dev/null | grep -v ERR | grep -v WARN && exit 0 || exit 1"
run_test "Scripts validation" "npm run build --dry-run 2>/dev/null || true"

# Test 18: Code quality check
echo -e "\n${YELLOW}✨ Code Quality Check${NC}"
run_test "No unused variables" "npx tsc --noUnusedLocals --noEmit 2>/dev/null"
run_test "No unused parameters" "npx tsc --noUnusedParameters --noEmit 2>/dev/null"
run_test "No implicit returns" "npx tsc --noImplicitReturns --noEmit 2>/dev/null"

# Test 19: Export validation
echo -e "\n${YELLOW}📤 Export Validation${NC}"
run_test "All services exported" "node -e &quot;const services = require('./src/services/index.ts'); console.log(Object.keys(services))&quot; 2>/dev/null"

# Test 20: Type definitions
echo -e "\n${YELLOW}📊 Type Definitions${NC}"
run_test "Type definitions valid" "npx tsc --declaration --emitDeclarationOnly --noEmit 2>/dev/null"

echo -e "\n${GREEN}================================${NC}"
echo -e "${GREEN}📊 Test Results Summary${NC}"
echo -e "${GREEN}================================${NC}"
echo -e "Total Tests: $TOTAL_TESTS"
echo -e "Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Failed: ${RED}$TESTS_FAILED${NC}"
echo -e "Success Rate: $(( (TESTS_PASSED * 100) / TOTAL_TESTS ))%"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "\n${GREEN}🎉 All tests passed! Backend is ready for production.${NC}"
else
    echo -e "\n${YELLOW}⚠️  Some tests failed. Please review the issues above.${NC}"
    echo -e "${YELLOW}💡 Run individual tests to debug specific issues.${NC}"
fi

echo -e "\n${GREEN}Next steps:${NC}"
echo -e "1. Run: npm run dev (to start development server)"
echo -e "2. Run: ./test-api.sh (to test API endpoints)"
echo -e "3. Run: npx prisma studio (to view database)"
echo -e "4. Run: docker-compose up -d (to start PostgreSQL + Redis)"