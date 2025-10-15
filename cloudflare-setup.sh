#!/bin/bash

# Cloudflare Infrastructure Setup Script
# This script creates all necessary Cloudflare resources for OmniNode

set -e

echo "🚀 Starting Cloudflare Infrastructure Setup..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if required environment variables are set
if [ -z "$CF_API_TOKEN" ]; then
    echo -e "${RED}Error: CF_API_TOKEN is not set${NC}"
    echo "Please set it: export CF_API_TOKEN=your_token_here"
    exit 1
fi

if [ -z "$CF_ACCOUNT_ID" ]; then
    echo -e "${RED}Error: CF_ACCOUNT_ID is not set${NC}"
    echo "Please set it: export CF_ACCOUNT_ID=your_account_id_here"
    exit 1
fi

echo -e "${BLUE}Using Account ID: $CF_ACCOUNT_ID${NC}"

# Install Wrangler if not already installed
if ! command -v wrangler &> /dev/null; then
    echo -e "${BLUE}Installing Wrangler CLI...${NC}"
    npm install -g wrangler
fi

# Authenticate Wrangler
echo -e "${BLUE}Authenticating Wrangler...${NC}"
export CLOUDFLARE_API_TOKEN=$CF_API_TOKEN
export CLOUDFLARE_ACCOUNT_ID=$CF_ACCOUNT_ID

# Create KV Namespaces
echo -e "${BLUE}Creating KV Namespaces...${NC}"

echo "Creating SESSIONS namespace..."
SESSIONS_ID=$(wrangler kv:namespace create "SESSIONS" --preview false 2>&1 | grep -oP 'id = "\K[^"]+' || echo "")
SESSIONS_PREVIEW_ID=$(wrangler kv:namespace create "SESSIONS" --preview 2>&1 | grep -oP 'id = "\K[^"]+' || echo "")

echo "Creating CACHE namespace..."
CACHE_ID=$(wrangler kv:namespace create "CACHE" --preview false 2>&1 | grep -oP 'id = "\K[^"]+' || echo "")
CACHE_PREVIEW_ID=$(wrangler kv:namespace create "CACHE" --preview 2>&1 | grep -oP 'id = "\K[^"]+' || echo "")

echo -e "${GREEN}✓ KV Namespaces created${NC}"
echo "SESSIONS_ID: $SESSIONS_ID"
echo "SESSIONS_PREVIEW_ID: $SESSIONS_PREVIEW_ID"
echo "CACHE_ID: $CACHE_ID"
echo "CACHE_PREVIEW_ID: $CACHE_PREVIEW_ID"

# Create R2 Buckets
echo -e "${BLUE}Creating R2 Buckets...${NC}"

wrangler r2 bucket create omninode-files || echo "Bucket may already exist"
wrangler r2 bucket create omninode-files-preview || echo "Preview bucket may already exist"

echo -e "${GREEN}✓ R2 Buckets created${NC}"

# Update wrangler.toml with actual IDs
echo -e "${BLUE}Updating wrangler.toml with resource IDs...${NC}"

if [ -n "$SESSIONS_ID" ]; then
    sed -i "s/sessions_namespace_id/$SESSIONS_ID/g" wrangler.toml
    sed -i "s/sessions_preview_id/$SESSIONS_PREVIEW_ID/g" wrangler.toml
    sed -i "s/cache_namespace_id/$CACHE_ID/g" wrangler.toml
    sed -i "s/cache_preview_id/$CACHE_PREVIEW_ID/g" wrangler.toml
fi

echo -e "${GREEN}✓ wrangler.toml updated${NC}"

# Set secrets (if provided)
echo -e "${BLUE}Setting up secrets...${NC}"

if [ -n "$DATABASE_URL" ]; then
    echo "$DATABASE_URL" | wrangler secret put DATABASE_URL
    echo -e "${GREEN}✓ DATABASE_URL set${NC}"
fi

if [ -n "$JWT_SECRET" ]; then
    echo "$JWT_SECRET" | wrangler secret put JWT_SECRET
    echo -e "${GREEN}✓ JWT_SECRET set${NC}"
fi

if [ -n "$JWT_REFRESH_SECRET" ]; then
    echo "$JWT_REFRESH_SECRET" | wrangler secret put JWT_REFRESH_SECRET
    echo -e "${GREEN}✓ JWT_REFRESH_SECRET set${NC}"
fi

if [ -n "$OPENAI_API_KEY" ]; then
    echo "$OPENAI_API_KEY" | wrangler secret put OPENAI_API_KEY
    echo -e "${GREEN}✓ OPENAI_API_KEY set${NC}"
fi

if [ -n "$ANTHROPIC_API_KEY" ]; then
    echo "$ANTHROPIC_API_KEY" | wrangler secret put ANTHROPIC_API_KEY
    echo -e "${GREEN}✓ ANTHROPIC_API_KEY set${NC}"
fi

if [ -n "$GOOGLE_API_KEY" ]; then
    echo "$GOOGLE_API_KEY" | wrangler secret put GOOGLE_API_KEY
    echo -e "${GREEN}✓ GOOGLE_API_KEY set${NC}"
fi

echo ""
echo -e "${GREEN}✅ Cloudflare Infrastructure Setup Complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Update your GitHub Secrets with the following:"
echo "   - CF_API_TOKEN"
echo "   - CF_ACCOUNT_ID"
echo "   - DATABASE_URL"
echo "   - JWT_SECRET"
echo "   - JWT_REFRESH_SECRET"
echo "   - OPENAI_API_KEY"
echo "   - ANTHROPIC_API_KEY"
echo "   - GOOGLE_API_KEY"
echo ""
echo "2. Deploy the Worker:"
echo "   wrangler deploy"
echo ""
echo "3. Deploy the Pages site:"
echo "   wrangler pages deploy .next --project-name=omninode-frontend"
echo ""