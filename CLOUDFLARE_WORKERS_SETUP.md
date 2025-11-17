# ☁️ Cloudflare Workers Deployment - Complete Setup

## ✅ EasyPanel Removed

All EasyPanel deployment configurations have been removed. The system is now **100% Cloudflare Workers**.

## 📁 File Changes Made

### Removed
- ❌ `.github/workflows/deploy.yml` (EasyPanel workflow)

### Updated
- ✅ `.github/workflows/build-deploy.yml` - Now triggers on `feat-weaponized-omninode` branch
- ✅ `backend/wrangler.toml` - Moved from root, updated entry point
- ✅ `backend/src/worker.ts` - NEW Cloudflare Workers entry point

### Structure
```
backend/
├── src/
│   ├── worker.ts          ← Cloudflare Workers entry (NEW)
│   ├── index.ts           ← Node.js entry (for local dev)
│   ├── app.ts             ← Express app (shared)
│   └── ...
├── wrangler.toml          ← Cloudflare Workers config (MOVED here)
└── package.json
```

---

## 🎯 Deployment Architecture

### Backend (API + WebSocket)
**Platform**: Cloudflare Workers  
**Domains**:
- `api.omninode.cc` - REST API
- `ws.omninode.cc` - WebSocket connections
- `*.omninode.cc` - Wildcard subdomain routing

**Entry Point**: `backend/src/worker.ts`

### Frontend
**Platform**: Vercel  
**Domain**: `omninode.cc`

---

## 🔧 Cloudflare Workers Configuration

### wrangler.toml Location
`backend/wrangler.toml`

### Key Settings
```toml
name = "omninode-api"
main = "src/worker.ts"              # Workers entry point
compatibility_date = "2025-01-17"
node_compat = true                  # Enable Node.js APIs
account_id = "ea550872bb6cef055e98c8e42ae0c9aa"

# Wildcard subdomain support
[[routes]]
pattern = "*.omninode.cc/*"
zone_name = "omninode.cc"

# API subdomain
[[routes]]
pattern = "api.omninode.cc/*"
zone_name = "omninode.cc"

# WebSocket subdomain
[[routes]]
pattern = "ws.omninode.cc/*"
zone_name = "omninode.cc"
```

### Bindings

**KV Namespaces** (Key-Value Storage):
- `SESSIONS` - User session storage
- `CACHE` - API response cache

**R2 Buckets** (Object Storage):
- `FILES` - File uploads/storage

**Durable Objects** (Stateful WebSockets):
- `WEBSOCKET` - WebSocket connection manager

---

## 🚀 Deployment Methods

### 1. Automatic (GitHub Actions)
Push to `feat-weaponized-omninode` branch:
```bash
git push origin feat-weaponized-omninode
```

GitHub Actions workflow (`.github/workflows/build-deploy.yml`) will:
1. Test backend & frontend
2. Build everything
3. Deploy backend to Cloudflare Workers
4. Deploy frontend to Vercel
5. Set all required secrets

### 2. Manual (Using Script)
```powershell
.\deploy.ps1 -Production
```

### 3. Direct Wrangler Deploy
```powershell
cd backend
npm install
npm run build
wrangler deploy
```

---

##  Required Secrets

Set these in GitHub Secrets for CI/CD:

### Cloudflare
```bash
CLOUDFLARE_API_TOKEN       # Workers deployment
CLOUDFLARE_ACCOUNT_ID      # Account ID (ea550872bb6cef055e98c8e42ae0c9aa)
```

### Application Secrets
```bash
DATABASE_URL               # PostgreSQL connection string
JWT_SECRET                 # Auth token secret
JWT_REFRESH_SECRET         # Refresh token secret
OPENAI_API_KEY            # OpenAI API key
ANTHROPIC_API_KEY         # Claude API key (optional)
GOOGLE_API_KEY            # Google AI key (optional)
ENCRYPTION_MASTER_KEY     # Vault encryption key (optional)
```

### Vercel (Frontend)
```bash
VERCEL_TOKEN              # Vercel deployment token
VERCEL_ORG_ID             # Organization ID
VERCEL_PROJECT_ID         # Project ID
```

---

## 🔐 Setting Cloudflare Secrets

### Via Wrangler CLI (Local)
```powershell
cd backend

# Login to Cloudflare
wrangler login

# Set secrets
wrangler secret put DATABASE_URL
wrangler secret put JWT_SECRET
wrangler secret put JWT_REFRESH_SECRET
wrangler secret put OPENAI_API_KEY
wrangler secret put ANTHROPIC_API_KEY
wrangler secret put GOOGLE_API_KEY
wrangler secret put ENCRYPTION_MASTER_KEY

# List secrets (doesn't show values)
wrangler secret list
```

### Via GitHub Actions (Automatic)
Secrets are automatically set from GitHub repository secrets during deployment.

---

## 🌐 DNS Configuration

Configure these records in Cloudflare DNS:

| Type | Name | Content | Proxy | Purpose |
|------|------|---------|-------|---------|
| A | @ | 192.0.2.1 | ✅ | Root domain |
| CNAME | api | omninode.cc | ✅ | API endpoint |
| CNAME | ws | omninode.cc | ✅ | WebSocket |
| CNAME | * | omninode.cc | ✅ | Wildcard subdomains |

**Important**: All records must be **Proxied** (orange cloud icon) for Workers routing to work.

---

## 📦 Cloudflare Workers Features Used

### 1. **Request/Response Handling**
- Converts Workers `Request` to Express-compatible format
- Adapts Express app to Workers runtime
- Full HTTP method support (GET, POST, PUT, DELETE, PATCH)

### 2. **CORS Handling**
- Automatic preflight (OPTIONS) response
- Configurable origin from `wrangler.toml`
- Credentials support

### 3. **Environment Variables**
- Secrets injected via `env` parameter
- Variables set in `wrangler.toml`
- Process.env compatibility layer

### 4. **Durable Objects (WebSocket)**
- Stateful WebSocket connections
- Automatic client management
- Broadcast messaging

### 5. **Error Handling**
- Structured error responses
- Logging to Cloudflare dashboard
- Graceful degradation

---

## 🧪 Testing Deployment

### Test API Health
```powershell
curl https://api.omninode.cc/health
```

### Test Scraper Endpoints
```powershell
# List presets
curl https://api.omninode.cc/api/scraper/presets

# Create job
curl -X POST https://api.omninode.cc/api/scraper/jobs \
  -H "Content-Type: application/json" \
  -d '{"preset":"NEWS_ARTICLE","url":"https://example.com"}'
```

### Test Wildcard Subdomain
```powershell
curl https://test.omninode.cc/health
curl https://custom-name.omninode.cc/health
```

### Test WebSocket
```javascript
const ws = new WebSocket('wss://ws.omninode.cc');
ws.onopen = () => console.log('Connected');
ws.onmessage = (e) => console.log('Message:', e.data);
```

---

## 📊 Monitoring

### View Logs
```powershell
cd backend
wrangler tail
```

### Check Deployments
```powershell
wrangler deployments list
```

### Cloudflare Dashboard
- Logs: https://dash.cloudflare.com → Workers → omninode-api → Logs
- Metrics: https://dash.cloudflare.com → Workers → omninode-api → Metrics
- Settings: https://dash.cloudflare.com → Workers → omninode-api → Settings

---

## 🔄 Rollback

### Via Wrangler
```powershell
cd backend
wrangler rollback
```

### Via Dashboard
1. Go to Cloudflare Workers dashboard
2. Select `omninode-api`
3. Click "Deployments"
4. Find previous version
5. Click "Rollback"

---

## 🚨 Troubleshooting

### Issue: "Worker not found"
**Fix**: Ensure you're logged into the correct Cloudflare account
```powershell
wrangler whoami
wrangler logout
wrangler login
```

### Issue: "Route not configured"
**Fix**: Check DNS records are proxied (orange cloud)
1. Go to Cloudflare DNS
2. Ensure records have orange cloud icon
3. Wait 5-15 minutes for propagation

### Issue: "Secret not defined"
**Fix**: Set missing secrets
```powershell
wrangler secret put [SECRET_NAME]
```

### Issue: "Build failed"
**Fix**: Check Node.js compatibility
```powershell
cd backend
npm install
npm run build
# Check for TypeScript errors
npm run type-check
```

### Issue: "WebSocket not working"
**Fix**: Ensure Durable Object is deployed
```powershell
wrangler deploy
# Check logs
wrangler tail
```

---

## 📈 Performance Optimization

### Caching Strategy
- API responses cached in KV namespace
- TTL configured per endpoint
- Cache invalidation on data updates

### Edge Computing
- Workers run globally at 275+ locations
- Sub-50ms response times worldwide
- Automatic failover

### Cost Optimization
- Free tier: 100,000 requests/day
- Bundled plan: 10M requests/month
- R2: No egress fees

---

## 🔧 Local Development

### Run Express Server (Traditional)
```powershell
cd backend
npm run dev
# Server: http://localhost:3001
```

### Test Workers Locally
```powershell
cd backend
wrangler dev
# Workers local: http://localhost:8787
```

### Both Simultaneously
```powershell
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Workers
cd backend
wrangler dev --port 8787

# Terminal 3: Frontend
npm run dev
```

---

## ✅ Deployment Checklist

Before deploying:

- [ ] All EasyPanel references removed
- [ ] `wrangler.toml` in `backend/` directory
- [ ] `worker.ts` entry point created
- [ ] GitHub secrets configured
- [ ] Cloudflare account ID set
- [ ] DNS records proxied
- [ ] Secrets set in Cloudflare
- [ ] Build succeeds locally
- [ ] Tests pass

---

## 🎉 Success Indicators

Deployment succeeded when:

1. ✅ GitHub Actions shows green checkmark
2. ✅ `curl https://api.omninode.cc/health` returns 200
3. ✅ `wrangler tail` shows incoming requests
4. ✅ Frontend loads at `https://omninode.cc`
5. ✅ WebSocket connects at `wss://ws.omninode.cc`
6. ✅ Wildcard works: `https://test.omninode.cc`

---

## 📚 Documentation

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Wrangler CLI Docs](https://developers.cloudflare.com/workers/wrangler/)
- [Durable Objects Docs](https://developers.cloudflare.com/workers/runtime-apis/durable-objects/)
- [Workers KV Docs](https://developers.cloudflare.com/workers/runtime-apis/kv/)
- [R2 Storage Docs](https://developers.cloudflare.com/r2/)

---

**Status**: ✅ Cloudflare Workers fully configured  
**EasyPanel**: ❌ Completely removed  
**Ready**: ✅ Push to deploy!

🚀 **Your OmniNode is 100% Cloudflare!**
