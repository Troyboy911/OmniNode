#!/bin/bash

# GitHub Secrets Configuration Script for OmniNode
# This script helps set up all necessary secrets for the automation system

echo "🚀 Setting up GitHub secrets for OmniNode automation..."
echo ""

# Function to check if gh CLI is installed
check_gh_cli() {
    if ! command -v gh &> /dev/null; then
        echo "❌ GitHub CLI (gh) is not installed."
        echo "Please install it first: https://cli.github.com/manual/installation"
        exit 1
    fi
}

# Function to authenticate with GitHub
authenticate_github() {
    echo "🔐 Checking GitHub authentication..."
    if ! gh auth status &> /dev/null; then
        echo "❌ Not authenticated with GitHub CLI."
        echo "Please run: gh auth login"
        exit 1
    fi
    echo "✅ Authenticated with GitHub"
}

# Function to set repository secret
set_secret() {
    local secret_name=$1
    local secret_value=$2
    
    if [ -z "$secret_value" ]; then
        echo "⚠️  Skipping $secret_name (empty value)"
        return
    fi
    
    echo "Setting $secret_name..."
    echo "$secret_value" | gh secret set "$secret_name" --repo "$REPO"
    echo "✅ $secret_name set successfully"
}

# Main setup function
main() {
    REPO="Troyboy911/OmniNode"
    
    check_gh_cli
    authenticate_github
    
    echo ""
    echo "📋 Setting up GitHub secrets for repository: $REPO"
    echo ""
    
    # Required secrets for automation
    echo "🔑 Setting up automation secrets..."
    
    # AI Provider API Keys
    read -p "Enter OpenAI API Key (or press Enter to skip): " openai_key
    set_secret "OPENAI_API_KEY" "$openai_key"
    
    read -p "Enter Anthropic API Key (or press Enter to skip): " anthropic_key
    set_secret "ANTHROPIC_API_KEY" "$anthropic_key"
    
    # Security and Monitoring
    read -p "Enter Snyk Token (or press Enter to skip): " snyk_token
    set_secret "SNYK_TOKEN" "$snyk_token"
    
    # Notification Webhooks
    read -p "Enter Slack Webhook URL (or press Enter to skip): " slack_webhook
    set_secret "SLACK_WEBHOOK" "$slack_webhook"
    
    # Database and Infrastructure
    read -p "Enter Database URL (or press Enter to skip): " database_url
    set_secret "DATABASE_URL" "$database_url"
    
    read -p "Enter Redis URL (or press Enter to skip): " redis_url
    set_secret "REDIS_URL" "$redis_url"
    
    # JWT Secrets (generate if not provided)
    read -p "Enter JWT Secret (or press Enter to generate): " jwt_secret
    if [ -z "$jwt_secret" ]; then
        jwt_secret=$(openssl rand -base64 32)
        echo "Generated JWT secret: $jwt_secret"
    fi
    set_secret "JWT_SECRET" "$jwt_secret"
    
    read -p "Enter JWT Refresh Secret (or press Enter to generate): " jwt_refresh_secret
    if [ -z "$jwt_refresh_secret" ]; then
        jwt_refresh_secret=$(openssl rand -base64 32)
        echo "Generated JWT refresh secret: $jwt_refresh_secret"
    fi
    set_secret "JWT_REFRESH_SECRET" "$jwt_refresh_secret"
    
    # Blockchain Configuration (optional)
    read -p "Enter Ethereum RPC URL (or press Enter to skip): " eth_rpc
    set_secret "ETHEREUM_RPC_URL" "$eth_rpc"
    
    read -p "Enter Polygon RPC URL (or press Enter to skip): " polygon_rpc
    set_secret "POLYGON_RPC_URL" "$polygon_rpc"
    
    read -p "Enter Private Key (or press Enter to skip): " private_key
    set_secret "PRIVATE_KEY" "$private_key"
    
    echo ""
    echo "✅ All secrets have been configured!"
    echo ""
    echo "📊 Summary of configured secrets:"
    echo "- AI Provider API Keys: OpenAI, Anthropic"
    echo "- Security: Snyk Token"
    echo "- Notifications: Slack Webhook"
    echo "- Database: Database URL, Redis URL"
    echo "- Authentication: JWT Secrets"
    echo "- Blockchain: Ethereum/Polygon RPC, Private Key"
    echo ""
    echo "🚀 Your OmniNode automation is now ready!"
    echo ""
    echo "Next steps:"
    echo "1. Test the automation by creating a test deployment"
    echo "2. Monitor the GitHub Actions workflows"
    echo "3. Set up monitoring and alerting"
    echo ""
    echo "For manual testing, you can trigger workflows from the GitHub UI"
    echo "or use the GitHub CLI: gh workflow run <workflow-name>"
}

# Run main function
main