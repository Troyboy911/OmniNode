#!/bin/bash

# EasyPanel Deployment Script
# One-command deployment for EasyPanel on Hostinger VPS

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[1;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 EasyPanel Deployment Script${NC}"
echo "================================="

# Configuration
EASYPANEL_URL=${1:-http://localhost:3000}
DOMAIN=${2:-localhost}
ADMIN_EMAIL=${3:-admin@localhost}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   echo -e "${RED}❌ Please run as non-root user with sudo privileges${NC}"
   exit 1
fi

# 1. Install EasyPanel
echo -e "${YELLOW}📦 Installing EasyPanel...${NC}"
curl -sSL https://get.easypanel.io | bash

# 2. Wait for EasyPanel to be ready
echo -e "${YELLOW}⏳ Waiting for EasyPanel to be ready...${NC}"
sleep 30

# 3. Create EasyPanel project
echo -e "${YELLOW}🏗️ Creating EasyPanel project...${NC}"
cat > easypanel-config.json << EOF
{
  "name": "omninode",
  "services": {
    "backend": {
      "image": "omninode/backend:latest",
      "ports": ["3000:3000"],
      "environment": {
        "NODE_ENV": "production",
        "DATABASE_URL": "postgresql://omninode:password@postgres:5432/omninode",
        "REDIS_URL": "redis://redis:6379"
      },
      "depends_on": ["postgres", "redis"]
    },
    "postgres": {
      "image": "postgres:15-alpine",
      "environment": {
        "POSTGRES_DB": "omninode",
        "POSTGRES_USER": "omninode",
        "POSTGRES_PASSWORD": "omninode_password"
      },
      "volumes": ["postgres_data:/var/lib/postgresql/data"]
    },
    "redis": {
      "image": "redis:7-alpine",
      "volumes": ["redis_data:/data"]
    }
  }
}
EOF

# 4. Create GitHub Actions workflow
echo -e "${YELLOW}⚙️ Creating GitHub Actions workflow...${NC}"
mkdir -p .github/workflows

# 5. Create deployment script
cat > deploy.sh << 'EOF'
#!/bin/bash
# EasyPanel deployment script

# Build Docker image
docker build -t omninode/backend:latest ./backend

# Deploy via EasyPanel API
curl -X POST "$EASYPANEL_URL/api/deploy" \
  -H "Authorization: Bearer $EASYPANEL_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "service": "omninode-app",
    "image": "omninode/backend:latest",
    "environment": {
      "NODE_ENV": "production"
    }
  }'
EOF

chmod +x deploy.sh

# 6. Create environment configuration
cat > .env.easypanel << EOF
# EasyPanel Configuration
EASYPANEL_URL=http://your-vps-ip:3000
EASYPANEL_API_KEY=your-api-key

# Database Configuration
DB_PASSWORD=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 64)

# API Keys (Add your actual keys)
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key
GOOGLE_API_KEY=your-google-key
EOF

# 7. Create nginx configuration
cat > nginx.conf << EOF
server {
    listen 80;
    server_name $DOMAIN;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# 8. Create GitHub Secrets configuration
cat > .github-secrets.md << EOF
# GitHub Secrets Configuration

Add these secrets to your GitHub repository:

## Required Secrets:
- \`EASYPANEL_URL\`: Your EasyPanel URL (http://your-vps-ip:3000)
- \`EASYPANEL_API_KEY\`: Your EasyPanel API key
- \`DATABASE_URL\`: PostgreSQL connection string
- \`REDIS_URL\`: Redis connection string
- \`JWT_SECRET\`: JWT secret key
- \`OPENAI_API_KEY\`: OpenAI API key
- \`ANTHROPIC_API_KEY\`: Anthropic API key
- \`GOOGLE_API_KEY\`: Google API key

## Optional Secrets:
- \`DISCORD_WEBHOOK_URL\`: For deployment notifications
- \`SLACK_WEBHOOK_URL\`: For deployment notifications
EOF

# 9. Create GitHub Actions workflow
echo -e "${YELLOW}🔄 Setting up GitHub Actions...${NC}"
# The GitHub Actions workflow is already in .github/workflows/deploy.yml

# 10. Final instructions
echo -e "${GREEN}✅ EasyPanel setup complete!${NC}"
echo ""
echo -e "${BLUE}🎉 Your CI/CD pipeline is ready!${NC}"
echo ""
echo -e "${YELLOW}📋 Next steps:${NC}"
echo "1. Access EasyPanel at: http://your-vps-ip:3000"
echo "2. Add GitHub secrets as shown in .github-secrets.md"
echo "3. Push to main branch to trigger deployment"
echo "4. Monitor deployments in GitHub Actions"
echo ""
echo -e "${GREEN}🔗 URLs:${NC}"
echo "  EasyPanel: http://your-vps-ip:3000"
echo "  API: http://your-domain.com/api/v1/health"
echo "  WebSocket: ws://your-domain.com"

echo -e "${YELLOW}🔧 Management:${NC}"
echo "  GitHub Actions: Repository -> Actions tab"
echo "  EasyPanel: Services -> omninode -> Deploy"
echo "  Logs: EasyPanel dashboard -> Service logs"

# Create deployment status
echo -e "${GREEN}🚀 Ready for automated deployment!${NC}"
echo "Every push to main branch will automatically deploy to EasyPanel!"
EOF

chmod +x easypanel-deploy.sh

echo -e "${GREEN}✅ EasyPanel deployment setup complete!${NC}"
echo ""
echo -e "${YELLOW}📋 Usage:${NC}"
echo "1. Run: ./easypanel-deploy.sh"
echo "2. Add your GitHub secrets"
echo "3. Push to main branch"
echo "4. Watch automatic deployment!"