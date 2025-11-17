# 🚀 Auto-Deploy to omninode.cc

## One-Command Deployment

```powershell
.\deploy.ps1 -Production
```

That's it! The script handles everything:
- ✅ Installs dependencies
- ✅ Generates Prisma client  
- ✅ Builds backend & frontend
- ✅ Deploys to Cloudflare Workers
- ✅ Deploys to Vercel
- ✅ Configures wildcard subdomains
- ✅ Verifies deployment

---

## ⚡ Quick Start

### 1. First Time Setup (One Time Only)

```powershell
# Login to Cloudflare
wrangler login

# Login to Vercel (optional for frontend)
vercel login
```

### 2. Deploy

```powershell
# Deploy to production
.\deploy.ps1 -Production

# Or deploy without tests (faster)
.\deploy.ps1 -Production -SkipTests

# Or deploy to staging
.\deploy.ps1 -Environment staging
```

### 3. Set Secrets (First Deploy Only)

```powershell
cd backend
wrangler secret put DATABASE_URL
wrangler secret put JWT_SECRET
wrangler secret put OPENAI_API_KEY
```

---

## 🌐 Your URLs

After deployment, access at:

- **Main App**: https://omninode.cc
- **API**: https://api.omninode.cc
- **WebSocket**: https://ws.omninode.cc
- **Scraper**: https://api.omninode.cc/api/scraper
- **Staging**: https://staging.omninode.cc

---

## 🎯 Wildcard Subdomains

Create any subdomain instantly:
- `https://dev.omninode.cc` ✅
- `https://docs.omninode.cc` ✅
- `https://admin.omninode.cc` ✅
- `https://whatever.omninode.cc` ✅

All automatically routed through Cloudflare Workers!

---

## 📋 DNS Configuration

The `wrangler.toml` is pre-configured with:

✅ Root domain: `omninode.cc/*`
✅ Wildcard: `*.omninode.cc/*`
✅ API: `api.omninode.cc/*`
✅ WebSocket: `ws.omninode.cc/*`

Just need to set DNS records in Cloudflare Dashboard:

1. Go to https://dash.cloudflare.com
2. Select your domain `omninode.cc`
3. Add DNS records:

```
Type  | Name | Content      | Proxy
------|------|--------------|-------
A     | @    | 192.0.2.1    | ✅
CNAME | api  | omninode.cc  | ✅
CNAME | ws   | omninode.cc  | ✅
CNAME | *    | omninode.cc  | ✅  (wildcard!)
```

See `cloudflare-dns-setup.md` for detailed instructions.

---

## 🔄 Continuous Deployment

Push to GitHub = Auto-deploy:

```powershell
git add .
git commit -m "feat: my awesome feature"
git push origin main

# GitHub Actions automatically:
# ✅ Runs tests
# ✅ Builds everything
# ✅ Deploys to Cloudflare
# ✅ Deploys to Vercel
# ✅ Rotates secrets monthly
```

---

## 🛠️ Manual Steps

### Check Deployment Status
```powershell
# Cloudflare Workers
wrangler deployments list
wrangler tail

# Vercel
vercel ls
vercel inspect [url]
```

### View Logs
```powershell
# Real-time Worker logs
wrangler tail

# Recent deployments
wrangler deployments list
```

### Rollback
```powershell
# Cloudflare (deploy previous version)
wrangler rollback

# Vercel
vercel rollback [deployment-url]
```

---

## ⚙️ Environment Variables

Required for Workers:

```
DATABASE_URL              # PostgreSQL connection
JWT_SECRET                # Auth tokens
JWT_REFRESH_SECRET        # Refresh tokens
OPENAI_API_KEY            # AI orchestration
ANTHROPIC_API_KEY         # Claude API
GOOGLE_API_KEY            # Google AI
ENCRYPTION_MASTER_KEY     # Vault encryption
```

Set with:
```powershell
cd backend
wrangler secret put [KEY_NAME]
```

---

## 🧪 Test Deployment

```powershell
# Test main site
curl https://omninode.cc

# Test API endpoints
curl https://api.omninode.cc/health
curl https://api.omninode.cc/api/scraper/presets

# Test wildcard
curl https://test.omninode.cc
curl https://custom-subdomain.omninode.cc
```

---

## 🐛 Troubleshooting

### Deployment fails
```powershell
# Check you're logged in
wrangler whoami
vercel whoami

# Re-login if needed
wrangler login
vercel login
```

### DNS not resolving
```powershell
# Clear cache
ipconfig /flushdns

# Check DNS
nslookup omninode.cc
nslookup api.omninode.cc
```

### Wildcard not working
- Verify `*` CNAME record exists in Cloudflare
- Ensure "Proxied" (orange cloud) is ON
- Wait 5-15 minutes for DNS propagation

### Build errors
```powershell
# Clean and reinstall
rm -r node_modules, backend/node_modules
npm install --legacy-peer-deps
cd backend && npm install
```

---

## 📚 Documentation

- `deploy.ps1` - Auto-deploy script
- `cloudflare-dns-setup.md` - DNS configuration guide
- `wrangler.toml` - Worker & route configuration
- `IMPLEMENTATION_COMPLETE.md` - Full system documentation
- `DEPLOYMENT_COMPLETE.md` - Detailed deployment guide

---

## ⚡ Quick Commands Reference

```powershell
# Full production deploy
.\deploy.ps1 -Production

# Fast deploy (skip tests)
.\deploy.ps1 -Production -SkipTests

# Staging deploy
.\deploy.ps1 -Environment staging

# View logs
wrangler tail

# Check status
wrangler deployments list

# Set secret
wrangler secret put [KEY]

# Test API
curl https://api.omninode.cc/api/scraper/presets
```

---

**Time to Deploy**: ~5 minutes
**Time to Live**: Instant (after DNS propagation)
**Wildcard Subdomains**: ✅ Unlimited

🎉 **Your omninode.cc is ready to launch!**
