# 🚀 EasyPanel CI/CD Setup on Hostinger VPS

## Overview
This guide will help you set up automated deployment using EasyPanel on Hostinger VPS with GitHub Actions CI/CD pipeline.

## Prerequisites
- Hostinger VPS with Ubuntu 20.04/22.04
- Domain name pointing to your VPS
- GitHub account with repository access
- Basic SSH access to your VPS

## Step 1: Install EasyPanel on Hostinger VPS

```bash
# SSH into your Hostinger VPS
ssh root@your-vps-ip

# Install EasyPanel
curl -sSL https://get.easypanel.io | bash

# The installation will take a few minutes
# After completion, access EasyPanel at: http://your-vps-ip:3000
```

## Step 2: Configure EasyPanel

1. **Access EasyPanel**: Open `http://your-vps-ip:3000` in browser
2. **Create Admin Account**: Set up your admin credentials
3. **Configure Server**: Add your domain and SSL certificates

## Step 3: Create EasyPanel Configuration

```yaml
# easypanel/docker-compose.yml
version: '3.8'

services:
  omninode-app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - JWT_SECRET=${JWT_SECRET}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - GOOGLE_API_KEY=${GOOGLE_API_KEY}
    depends_on:
      - postgres
      - redis
    volumes:
      - ./uploads:/app/uploads

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: omninode
      POSTGRES_USER: omninode
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - omninode-app

volumes:
  postgres_data:
  redis_data:
```

## Step 4: Create Dockerfile for EasyPanel

```dockerfile
# Dockerfile
FROM node:18-alpine

# Install dependencies for native modules
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci --only=production

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Create uploads directory
RUN mkdir -p uploads

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/v1/health || exit 1

# Start the application
CMD ["node", "dist/index.js"]
```

## Step 5: GitHub Actions CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy to EasyPanel

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

env:
  EASYPANEL_URL: ${{ secrets.EASYPANEL_URL }}
  EASYPANEL_API_KEY: ${{ secrets.EASYPANEL_API_KEY }}

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run tests
        run: npm test
        
      - name: Run linting
        run: npm run lint

  build-and-deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build application
        run: npm run build
        
      - name: Generate Prisma Client
        run: npx prisma generate
        
      - name: Run database migrations
        run: npx prisma migrate deploy
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          
      - name: Deploy to EasyPanel
        run: |
          curl -X POST "${{ secrets.EASYPANEL_URL }}/api/deploy" \
            -H "Authorization: Bearer ${{ secrets.EASYPANEL_API_KEY }}" \
            -H "Content-Type: application/json" \
            -d '{
              "service": "omninode-app",
              "image": "omninode/backend:latest",
              "environment": {
                "NODE_ENV": "production",
                "DATABASE_URL": "${{ secrets.DATABASE_URL }}",
                "REDIS_URL": "${{ secrets.REDIS_URL }}",
                "JWT_SECRET": "${{ secrets.JWT_SECRET }}",
                "OPENAI_API_KEY": "${{ secrets.OPENAI_API_KEY }}",
                "ANTHROPIC_API_KEY": "${{ secrets.ANTHROPIC_API_KEY }}",
                "GOOGLE_API_KEY": "${{ secrets.GOOGLE_API_KEY }}"
              }
            }'

  deploy-staging:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Staging
        run: |
          # Deploy to staging environment
          curl -X POST "${{ secrets.EASYPANEL_STAGING_URL }}/api/deploy" \
            -H "Authorization: Bearer ${{ secrets.EASYPANEL_STAGING_API_KEY }}" \
            -H "Content-Type: application/json" \
            -d '{
              "service": "omninode-app-staging",
              "image": "omninode/backend:staging",
              "environment": {
                "NODE_ENV": "staging",
                "DATABASE_URL": "${{ secrets.DATABASE_URL_STAGING }}",
                "REDIS_URL": "${{ secrets.REDIS_URL_STAGING }}",
                "JWT_SECRET": "${{ secrets.JWT_SECRET_STAGING }}"
              }
            }'
```

## Step 6: Environment Secrets

Set up these secrets in your GitHub repository:

```bash
# GitHub Secrets Configuration
EASYPANEL_URL=http://your-vps-ip:3000
EASYPANEL_API_KEY=your-easypanel-api-key
DATABASE_URL=postgresql://user:pass@host:5432/db
REDIS_URL=redis://host:6379
JWT_SECRET=your-jwt-secret
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key
GOOGLE_API_KEY=your-google-key
```

## Step 7: EasyPanel API Integration

```javascript
// easypanel-api.js
const axios = require('axios');

class EasyPanelAPI {
  constructor(baseURL, apiKey) {
    this.client = axios.create({
      baseURL,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
  }

  async deployService(config) {
    try {
      const response = await this.client.post('/api/services', config);
      return response.data;
    } catch (error) {
      console.error('Deployment error:', error.response?.data || error.message);
      throw error;
    }
  }

  async updateService(serviceId, config) {
    try {
      const response = await this.client.put(`/api/services/${serviceId}`, config);
      return response.data;
    } catch (error) {
      console.error('Update error:', error.response?.data || error.message);
      throw error;
    }
  }

  async getServiceStatus(serviceId) {
    try {
      const response = await this.client.get(`/api/services/${serviceId}/status`);
      return response.data;
    } catch (error) {
      console.error('Status check error:', error.response?.data || error.message);
      throw error;
    }
  }

  async restartService(serviceId) {
    try {
      const response = await this.client.post(`/api/services/${serviceId}/restart`);
      return response.data;
    } catch (error) {
      console.error('Restart error:', error.response?.data || error.message);
      throw error;
    }
  }
}

module.exports = EasyPanelAPI;
```

## Step 8: Database Migration Automation

```javascript
// migrate.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runMigrations() {
  try {
    console.log('Running database migrations...');
    
    // Run Prisma migrations
    const { exec } = require('child_process');
    exec('npx prisma migrate deploy', (error, stdout, stderr) => {
      if (error) {
        console.error('Migration error:', error);
        process.exit(1);
      }
      console.log('Migrations completed successfully');
      console.log(stdout);
    });
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runMigrations();
```

## Step 9: Health Checks and Monitoring

```javascript
// health-check.js
const axios = require('axios');

async function healthCheck() {
  try {
    const response = await axios.get('http://localhost:3000/api/v1/health');
    console.log('Health check passed:', response.data);
    return true;
  } catch (error) {
    console.error('Health check failed:', error.message);
    return false;
  }
}

// Run health check after deployment
setTimeout(async () => {
  const isHealthy = await healthCheck();
  if (!isHealthy) {
    console.error('Deployment health check failed');
    process.exit(1);
  }
}, 30000); // Check after 30 seconds
```

## Step 10: Rollback Strategy

```yaml
# .github/workflows/rollback.yml
name: Rollback Deployment

on:
  workflow_dispatch:
    inputs:
      version:
        description: 'Version to rollback to'
        required: true

jobs:
  rollback:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy Previous Version
        run: |
          curl -X POST "${{ secrets.EASYPANEL_URL }}/api/rollback" \
            -H "Authorization: Bearer ${{ secrets.EASYPANEL_API_KEY }}" \
            -H "Content-Type: application/json" \
            -d '{
              "service": "omninode-app",
              "version": "${{ github.event.inputs.version }}"
            }'
```

## Step 11: Notification Integration

```javascript
// notifications.js
const sendDeploymentNotification = async (status, environment) => {
  // Discord notification
  const discordWebhook = process.env.DISCORD_WEBHOOK_URL;
  if (discordWebhook) {
    await axios.post(discordWebhook, {
      content: `🚀 Deployment ${status} for ${environment} environment!`,
      embeds: [{
        title: 'Deployment Status',
        description: `Deployment to ${environment} ${status}`,
        color: status === 'success' ? 3066993 : 15158332,
        timestamp: new Date().toISOString()
      }]
    });
  }

  // Slack notification
  const slackWebhook = process.env.SLACK_WEBHOOK_URL;
  if (slackWebhook) {
    await axios.post(slackWebhook, {
      text: `Deployment ${status} for ${environment} environment!`,
      blocks: [{
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Deployment Status:* ${status}\n*Environment:* ${environment}`
        }
      }]
    });
  }
};
```

## Step 12: Final Configuration

Create these files in your repository:

```bash
# Create necessary files
touch .env.example
touch easypanel/docker-compose.yml
touch Dockerfile
touch .github/workflows/deploy.yml
touch deploy.sh
```

## Deployment Process

1. **Push to GitHub**: Every push triggers the CI/CD pipeline
2. **Automated Testing**: Tests run on every commit
3. **Build & Deploy**: Successful tests trigger deployment
4. **Health Check**: System verifies deployment health
5. **Notifications**: You get notified of deployment status

## Monitoring

Access your EasyPanel dashboard at:
- **Production**: `http://your-vps-ip:3000`
- **Application**: `http://your-domain.com`
- **API Health**: `http://your-domain.com/api/v1/health`

## Troubleshooting

### Common Issues
1. **Build Failures**: Check GitHub Actions logs
2. **Deployment Failures**: Check EasyPanel logs
3. **Database Issues**: Verify connection strings
4. **SSL Issues**: Check certificate status

### Support
- Check EasyPanel documentation
- Review GitHub Actions logs
- Monitor application health endpoints
- Check service logs in EasyPanel

## 🎉 You're Ready!

Your CI/CD pipeline is now set up for automated deployment on every GitHub push to EasyPanel on your Hostinger VPS!