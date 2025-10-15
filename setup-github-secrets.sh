#!/bin/bash

# GitHub Secrets Setup Script for OmniNode Cloudflare Deployment
# This script helps you set up all required GitHub secrets

set -e

echo "🔐 GitHub Secrets Setup for OmniNode"
echo "===================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo -e "${RED}Error: GitHub CLI (gh) is not installed${NC}"
    echo "Install it from: https://cli.github.com/"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo -e "${YELLOW}You need to authenticate with GitHub CLI${NC}"
    gh auth login
fi

echo -e "${BLUE}Repository: Troyboy911/OmniNode${NC}"
echo ""

# Function to set secret
set_secret() {
    local secret_name=$1
    local secret_value=$2
    
    if [ -z "$secret_value" ]; then
        echo -e "${YELLOW}Skipping $secret_name (empty value)${NC}"
        return
    fi
    
    echo "$secret_value" | gh secret set "$secret_name" -R Troyboy911/OmniNode
    echo -e "${GREEN}✓ Set $secret_name${NC}"
}

# Cloudflare Configuration
echo -e "${BLUE}=== Cloudflare Configuration ===${NC}"
echo ""

if [ -z "$CF_API_TOKEN" ]; then
    echo -e "${YELLOW}CF_API_TOKEN not set in environment${NC}"
    read -p "Enter Cloudflare API Token: " CF_API_TOKEN
fi
set_secret "CF_API_TOKEN" "$CF_API_TOKEN"

if [ -z "$CF_ACCOUNT_ID" ]; then
    echo -e "${YELLOW}CF_ACCOUNT_ID not set in environment${NC}"
    read -p "Enter Cloudflare Account ID [ea550872bb6cef055e98c8e42ae0c9aa]: " CF_ACCOUNT_ID
    CF_ACCOUNT_ID=${CF_ACCOUNT_ID:-ea550872bb6cef055e98c8e42ae0c9aa}
fi
set_secret "CF_ACCOUNT_ID" "$CF_ACCOUNT_ID"

echo ""

# Database Configuration
echo -e "${BLUE}=== Database Configuration ===${NC}"
echo ""

if [ -z "$DATABASE_URL" ]; then
    echo -e "${YELLOW}DATABASE_URL not set in environment${NC}"
    read -p "Enter Neon Database URL: " DATABASE_URL
fi
set_secret "DATABASE_URL" "$DATABASE_URL"

echo ""

# JWT Secrets
echo -e "${BLUE}=== JWT Secrets ===${NC}"
echo ""

if [ -z "$JWT_SECRET" ]; then
    echo -e "${YELLOW}JWT_SECRET not set in environment${NC}"
    echo "Generating random JWT_SECRET..."
    JWT_SECRET=$(openssl rand -base64 32)
fi
set_secret "JWT_SECRET" "$JWT_SECRET"

if [ -z "$JWT_REFRESH_SECRET" ]; then
    echo -e "${YELLOW}JWT_REFRESH_SECRET not set in environment${NC}"
    echo "Generating random JWT_REFRESH_SECRET..."
    JWT_REFRESH_SECRET=$(openssl rand -base64 32)
fi
set_secret "JWT_REFRESH_SECRET" "$JWT_REFRESH_SECRET"

echo ""

# AI Provider API Keys
echo -e "${BLUE}=== AI Provider API Keys ===${NC}"
echo ""

if [ -z "$OPENAI_API_KEY" ]; then
    echo -e "${YELLOW}OPENAI_API_KEY not set in environment${NC}"
    read -p "Enter OpenAI API Key (or press Enter to skip): " OPENAI_API_KEY
fi
set_secret "OPENAI_API_KEY" "$OPENAI_API_KEY"

if [ -z "$ANTHROPIC_API_KEY" ]; then
    echo -e "${YELLOW}ANTHROPIC_API_KEY not set in environment${NC}"
    read -p "Enter Anthropic API Key (or press Enter to skip): " ANTHROPIC_API_KEY
fi
set_secret "ANTHROPIC_API_KEY" "$ANTHROPIC_API_KEY"

if [ -z "$GOOGLE_API_KEY" ]; then
    echo -e "${YELLOW}GOOGLE_API_KEY not set in environment${NC}"
    read -p "Enter Google API Key (or press Enter to skip): " GOOGLE_API_KEY
fi
set_secret "GOOGLE_API_KEY" "$GOOGLE_API_KEY"

echo ""

# Optional: Slack Webhook
echo -e "${BLUE}=== Optional: Notifications ===${NC}"
echo ""

if [ -z "$SLACK_WEBHOOK_URL" ]; then
    read -p "Enter Slack Webhook URL (or press Enter to skip): " SLACK_WEBHOOK_URL
fi
if [ -n "$SLACK_WEBHOOK_URL" ]; then
    set_secret "SLACK_WEBHOOK_URL" "$SLACK_WEBHOOK_URL"
fi

echo ""
echo -e "${GREEN}✅ GitHub Secrets Setup Complete!${NC}"
echo ""
echo "Secrets set in repository: Troyboy911/OmniNode"
echo ""
echo "Next steps:"
echo "1. Verify secrets: gh secret list -R Troyboy911/OmniNode"
echo "2. Run Cloudflare setup: ./cloudflare-setup.sh"
echo "3. Push to main branch to trigger deployment"
echo ""
echo "To view secrets:"
echo "  gh secret list -R Troyboy911/OmniNode"
echo ""