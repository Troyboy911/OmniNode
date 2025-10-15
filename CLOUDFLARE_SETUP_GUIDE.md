# Cloudflare Setup Guide for OmniNode

This guide will help you set up and deploy OmniNode on Cloudflare infrastructure.

## 🎯 Architecture Overview

- **Frontend**: Next.js on Cloudflare Pages (SSR/Edge)
- **API**: Cloudflare Workers with Hono framework
- **Database**: Neon Postgres with Prisma Edge
- **Cache/Sessions**: Cloudflare KV
- **File Storage**: Cloudflare R2
- **Real-time**: Durable Objects with WebSockets
- **AI**: OpenAI, Anthropic, Google Gemini

## 📋 Prerequisites

1. **Cloudflare Account** (Free tier works)
2. **Neon Database** (Free tier available)
3. **AI Provider API Keys** (OpenAI, Anthropic, Google)
4. **GitHub Repository** access

## 🚀 Step-by-Step Setup

### Step 1: Install Wrangler CLI

```bash
npm install -g wrangler
```

### Step 2: Authenticate Wrangler

```bash
export CLOUDFLARE_API_TOKEN=your_token_here
export CLOUDFLARE_ACCOUNT_ID=ea550872bb6cef055e98c8e42ae0c9aa
```

Or login interactively:
```bash
wrangler login
```

### Step 3: Create Cloudflare Resources

Run the setup script:

```bash
# Set environment variables
export CF_API_TOKEN=your_cloudflare_api_token
export CF_ACCOUNT_ID=ea550872bb6cef055e98c8e42ae0c9aa
export DATABASE_URL=your_neon_database_url
export JWT_SECRET=your_jwt_secret_min_32_chars
export JWT_REFRESH_SECRET=your_jwt_refresh_secret_min_32_chars
export OPENAI_API_KEY=your_openai_key
export ANTHROPIC_API_KEY=your_anthropic_key
export GOOGLE_API_KEY=your_google_key

# Run setup
./cloudflare-setup.sh
```

This script will:
- Create KV namespaces for sessions and cache
- Create R2 buckets for file storage
- Update wrangler.toml with resource IDs
- Set Worker secrets

### Step 4: Set Up Database

1. **Create Neon Database**:
   - Go to https://neon.tech
   - Create a new project
   - Copy the connection string

2. **Run Prisma Migrations**:
   ```bash
   cd backend
   npx prisma migrate deploy
   npx prisma generate
   ```

### Step 5: Configure GitHub Secrets

Add these secrets to your GitHub repository (Settings → Secrets → Actions):

```
CF_API_TOKEN=your_cloudflare_api_token
CF_ACCOUNT_ID=ea550872bb6cef055e98c8e42ae0c9aa
DATABASE_URL=postgresql://user:pass@host.neon.tech/omninode?sslmode=require
JWT_SECRET=your_jwt_secret_min_32_chars
JWT_REFRESH_SECRET=your_jwt_refresh_secret_min_32_chars
OPENAI_API_KEY=sk-your_openai_key
ANTHROPIC_API_KEY=sk-ant-your_anthropic_key
GOOGLE_API_KEY=your_google_gemini_key
```

### Step 6: Deploy Worker API

```bash
cd src/worker
npm install
npm run build
wrangler deploy --env production
```

### Step 7: Deploy Frontend to Pages

```bash
cd ../..
npm install --legacy-peer-deps
npm run build
wrangler pages deploy .next --project-name=omninode-frontend --branch=main
```

### Step 8: Configure Custom Domains

1. **Add Domain to Cloudflare**:
   - Go to Cloudflare Dashboard
   - Add your domain
   - Update nameservers

2. **Configure Worker Route**:
   - Workers & Pages → omninode-api → Settings → Triggers
   - Add route: `api.yourdomain.com/*`

3. **Configure Pages Domain**:
   - Workers & Pages → omninode-frontend → Custom domains
   - Add: `yourdomain.com` and `www.yourdomain.com`

## 🔧 Manual Resource Creation

If the setup script fails, create resources manually:

### Create KV Namespaces

```bash
wrangler kv:namespace create "SESSIONS"
wrangler kv:namespace create "SESSIONS" --preview
wrangler kv:namespace create "CACHE"
wrangler kv:namespace create "CACHE" --preview
```

### Create R2 Buckets

```bash
wrangler r2 bucket create omninode-files
wrangler r2 bucket create omninode-files-preview
```

### Set Worker Secrets

```bash
echo "your_database_url" | wrangler secret put DATABASE_URL
echo "your_jwt_secret" | wrangler secret put JWT_SECRET
echo "your_jwt_refresh_secret" | wrangler secret put JWT_REFRESH_SECRET
echo "your_openai_key" | wrangler secret put OPENAI_API_KEY
echo "your_anthropic_key" | wrangler secret put ANTHROPIC_API_KEY
echo "your_google_key" | wrangler secret put GOOGLE_API_KEY
```

## 🧪 Testing

### Test Worker API

```bash
# Health check
curl https://api.omninode.app/health

# Detailed health
curl https://api.omninode.app/health/detailed

# AI providers
curl https://api.omninode.app/api/ai/health

# Register user
curl -X POST https://api.omninode.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'
```

### Test Frontend

Visit: https://omninode.app

## 📊 Monitoring

### View Logs

```bash
# Worker logs
wrangler tail

# Pages logs
wrangler pages deployment tail
```

### View Analytics

- Cloudflare Dashboard → Analytics & Logs
- Workers & Pages → omninode-api → Metrics
- Workers & Pages → omninode-frontend → Analytics

## 🔄 CI/CD

The GitHub Actions workflow (`.github/workflows/cloudflare-deploy.yml`) automatically:

1. Deploys Worker API on push to main
2. Deploys Frontend to Pages
3. Runs health checks
4. Notifies on success/failure

## 🐛 Troubleshooting

### Worker Deployment Fails

```bash
# Check wrangler.toml syntax
wrangler deploy --dry-run

# View detailed errors
wrangler deploy --verbose
```

### Database Connection Issues

```bash
# Test connection
psql "your_database_url"

# Check Prisma schema
cd backend
npx prisma validate
```

### KV/R2 Access Issues

```bash
# List KV namespaces
wrangler kv:namespace list

# List R2 buckets
wrangler r2 bucket list

# Test KV access
wrangler kv:key put --binding=CACHE "test" "value"
wrangler kv:key get --binding=CACHE "test"
```

## 🔐 Security Best Practices

1. **Rotate Secrets Regularly**:
   ```bash
   echo "new_secret" | wrangler secret put JWT_SECRET
   ```

2. **Use Environment-Specific Secrets**:
   ```bash
   echo "staging_secret" | wrangler secret put JWT_SECRET --env staging
   ```

3. **Enable Rate Limiting**: Already configured in middleware

4. **Monitor Access Logs**: Check Cloudflare Dashboard regularly

## 📈 Scaling

Cloudflare Workers automatically scale, but consider:

1. **Database Connection Pooling**: Already configured with Neon
2. **KV Caching**: Implemented for sessions and rate limiting
3. **R2 for Large Files**: Configured for file uploads
4. **Durable Objects**: For WebSocket connections

## 💰 Cost Estimation

**Free Tier Limits**:
- Workers: 100,000 requests/day
- Pages: Unlimited requests
- KV: 100,000 reads/day, 1,000 writes/day
- R2: 10 GB storage, 1M Class A operations/month
- Durable Objects: First 1M requests free

**Paid Plans** (if needed):
- Workers: $5/month for 10M requests
- KV: $0.50/GB storage
- R2: $0.015/GB storage
- Durable Objects: $0.15/million requests

## 🎉 Success Checklist

- [ ] Cloudflare resources created (KV, R2)
- [ ] Database connected and migrated
- [ ] Worker API deployed and healthy
- [ ] Frontend deployed to Pages
- [ ] Custom domains configured
- [ ] GitHub secrets configured
- [ ] CI/CD pipeline working
- [ ] Health checks passing
- [ ] AI providers configured
- [ ] WebSocket connections working

## 📚 Additional Resources

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Hono Framework](https://hono.dev/)
- [Prisma Edge](https://www.prisma.io/docs/guides/deployment/edge/deploy-to-cloudflare)
- [Neon Database](https://neon.tech/docs)

## 🆘 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review Cloudflare Dashboard logs
3. Check GitHub Actions workflow logs
4. Review Worker/Pages deployment logs
5. Test individual components (DB, KV, R2, AI)

---

**Ready to deploy?** Run `./cloudflare-setup.sh` to get started! 🚀