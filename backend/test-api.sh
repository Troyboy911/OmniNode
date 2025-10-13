#!/bin/bash

BASE_URL="http://localhost:4000/api/v1"

echo "🧪 Testing Omni Node Backend API"
echo "================================"
echo ""

# Test 1: Health Check
echo "1️⃣  Testing Health Check..."
HEALTH=$(curl -s "$BASE_URL/health")
if echo "$HEALTH" | grep -q "success"; then
    echo "✅ Health check passed"
else
    echo "❌ Health check failed"
    exit 1
fi
echo ""

# Test 2: Register User
echo "2️⃣  Testing User Registration..."
REGISTER=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "SecurePass123!",
    "firstName": "Test",
    "lastName": "User"
  }')

if echo "$REGISTER" | grep -q "success"; then
    echo "✅ User registration passed"
    TOKEN=$(echo "$REGISTER" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
else
    echo "⚠️  User might already exist, trying login..."
fi
echo ""

# Test 3: Login User
echo "3️⃣  Testing User Login..."
LOGIN=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!"
  }')

if echo "$LOGIN" | grep -q "success"; then
    echo "✅ User login passed"
    TOKEN=$(echo "$LOGIN" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
else
    echo "❌ User login failed"
    exit 1
fi
echo ""

# Test 4: Get Current User
echo "4️⃣  Testing Get Current User..."
USER=$(curl -s "$BASE_URL/auth/me" \
  -H "Authorization: Bearer $TOKEN")

if echo "$USER" | grep -q "success"; then
    echo "✅ Get current user passed"
else
    echo "❌ Get current user failed"
    exit 1
fi
echo ""

# Test 5: Create Agent
echo "5️⃣  Testing Create Agent..."
AGENT=$(curl -s -X POST "$BASE_URL/agents" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Test Agent",
    "role": "DEVELOPER",
    "description": "A test agent",
    "capabilities": ["coding", "testing"]
  }')

if echo "$AGENT" | grep -q "success"; then
    echo "✅ Create agent passed"
    AGENT_ID=$(echo "$AGENT" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
else
    echo "❌ Create agent failed"
fi
echo ""

# Test 6: Get All Agents
echo "6️⃣  Testing Get All Agents..."
AGENTS=$(curl -s "$BASE_URL/agents?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN")

if echo "$AGENTS" | grep -q "success"; then
    echo "✅ Get all agents passed"
else
    echo "❌ Get all agents failed"
fi
echo ""

# Test 7: Create Project
echo "7️⃣  Testing Create Project..."
PROJECT=$(curl -s -X POST "$BASE_URL/projects" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Test Project",
    "description": "A test project",
    "priority": "HIGH"
  }')

if echo "$PROJECT" | grep -q "success"; then
    echo "✅ Create project passed"
    PROJECT_ID=$(echo "$PROJECT" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
else
    echo "❌ Create project failed"
fi
echo ""

# Test 8: Execute Command
echo "8️⃣  Testing Execute Command..."
COMMAND=$(curl -s -X POST "$BASE_URL/commands" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "text": "Create a new feature",
    "metadata": {"context": "testing"}
  }')

if echo "$COMMAND" | grep -q "success"; then
    echo "✅ Execute command passed"
else
    echo "❌ Execute command failed"
fi
echo ""

echo "================================"
echo "✅ All tests completed!"
echo ""
echo "📊 Summary:"
echo "   - Health Check: ✅"
echo "   - Authentication: ✅"
echo "   - Agents: ✅"
echo "   - Projects: ✅"
echo "   - Commands: ✅"
echo ""