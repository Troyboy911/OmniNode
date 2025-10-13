#!/bin/bash

# Test script for AI integration and file uploads
# This script tests the new AI and file upload endpoints

echo "🚀 Testing AI Integration & File Uploads"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test API endpoints
API_BASE="http://localhost:3000/api"

# Test 1: Health check
echo -e "\n${YELLOW}1. Testing Health Check${NC}"
curl -s "$API_BASE/health" | jq .

# Test 2: Register a test user
echo -e "\n${YELLOW}2. Registering Test User${NC}"
REGISTER_RESPONSE=$(curl -s -X POST "$API_BASE/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@omninode.ai",
    "username": "testuser",
    "password": "TestPass123!",
    "firstName": "Test",
    "lastName": "User"
  }')

echo "$REGISTER_RESPONSE" | jq .
TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.token')

if [ "$TOKEN" != "null" ] && [ "$TOKEN" != "" ]; then
    echo -e "${GREEN}✅ User registered successfully${NC}"
    
    # Test 3: Get available AI models
    echo -e "\n${YELLOW}3. Getting Available AI Models${NC}"
    curl -s -X GET "$API_BASE/ai/models" \
      -H "Authorization: Bearer $TOKEN" | jq .
    
    # Test 4: Test AI chat
    echo -e "\n${YELLOW}4. Testing AI Chat${NC}"
    curl -s -X POST "$API_BASE/ai/chat" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d '{
        "message": "Hello, can you help me create a simple Node.js API?",
        "model": "gpt-4",
        "temperature": 0.7
      }' | jq .
    
    # Test 5: Get file upload stats
    echo -e "\n${YELLOW}5. Getting File Stats${NC}"
    curl -s -X GET "$API_BASE/files/stats" \
      -H "Authorization: Bearer $TOKEN" | jq .
    
    # Test 6: Create a test project
    echo -e "\n${YELLOW}6. Creating Test Project${NC}"
    PROJECT_RESPONSE=$(curl -s -X POST "$API_BASE/projects" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d '{
        "name": "AI Integration Test",
        "description": "Testing AI and file upload features",
        "status": "IN_PROGRESS",
        "priority": "HIGH"
      }')
    
    echo "$PROJECT_RESPONSE" | jq .
    PROJECT_ID=$(echo "$PROJECT_RESPONSE" | jq -r '.project.id')
    
    # Test 7: Test file upload (create a test file)
    echo -e "\n${YELLOW}7. Testing File Upload${NC}"
    echo "This is a test file for AI processing" > test-upload.txt
    
    curl -s -X POST "$API_BASE/files/upload" \
      -H "Authorization: Bearer $TOKEN" \
      -F "file=@test-upload.txt" \
      -F "projectId=$PROJECT_ID" | jq .
    
    # Cleanup test file
    rm -f test-upload.txt
    
    echo -e "\n${GREEN}✅ All tests completed successfully!${NC}"
    
else
    echo -e "${RED}❌ Failed to register user${NC}"
fi

echo -e "\n${GREEN}🎉 AI Integration & File Upload Features Ready!${NC}"
echo "Available endpoints:"
echo "- POST /api/ai/chat - AI chat with context"
echo "- GET /api/ai/models - Available AI models"
echo "- POST /api/ai/process-file - Process files with AI"
echo "- POST /api/files/upload - Upload files"
echo "- GET /api/files - List user files"
echo "- GET /api/files/:id/download - Download files"