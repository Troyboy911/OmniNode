# 🌐 Cloudflare DNS Setup for omninode.cc

## Quick Setup with Wrangler CLI

### 1. Login to Cloudflare
```powershell
wrangler login
```

### 2. Verify Domain
```powershell
# Check if omninode.cc is in your account
wrangler whoami

# List zones
wrangler pages project list
```

### 3. DNS Records Configuration

Add these DNS records via Cloudflare Dashboard or API:

#### A Records (Root & www)
```
Type: A
Name: @
Content: [YOUR_SERVER_IP or 192.0.2.1 for Workers-only]
Proxy: ✅ Proxied (Orange cloud)
TTL: Auto
```

```
Type: A
Name: www
Content: [YOUR_SERVER_IP or 192.0.2.1]
Proxy: ✅ Proxied (Orange cloud)
TTL: Auto
```

#### CNAME Records (Subdomains)
```
Type: CNAME
Name: api
Content: omninode.cc
Proxy: ✅ Proxied (Orange cloud)
TTL: Auto
```

```
Type: CNAME
Name: ws
Content: omninode.cc
Proxy: ✅ Proxied (Orange cloud)
TTL: Auto
```

```
Type: CNAME
Name: cdn
Content: omninode.cc
Proxy: ✅ Proxied (Orange cloud)
TTL: Auto
```

```
Type: CNAME
Name: staging
Content: omninode.cc
Proxy: ✅ Proxied (Orange cloud)
TTL: Auto
```

#### Wildcard Record (Enable auto subdomain creation)
```
Type: CNAME
Name: *
Content: omninode.cc
Proxy: ✅ Proxied (Orange cloud)
TTL: Auto
```

### 4. SSL/TLS Settings

Via Dashboard (SSL/TLS tab):

1. **Encryption Mode**: Full (strict)
2. **Always Use HTTPS**: ✅ Enabled
3. **Automatic HTTPS Rewrites**: ✅ Enabled
4. **Minimum TLS Version**: 1.2
5. **TLS 1.3**: ✅ Enabled
6. **Opportunistic Encryption**: ✅ Enabled

### 5. Security Rules

#### Rate Limiting
```
Path: /api/*
Requests: 100 per 10 minutes per IP
Action: Challenge

Path: /api/scraper/*
Requests: 1000 per hour per IP
Action: Challenge
```

#### Bot Fight Mode
```
Security → Bots
Enable "Bot Fight Mode"
```

#### WAF Rules
```
Security → WAF
Managed Rules: ✅ Enabled
Security Level: Medium
Challenge Passage: 30 minutes
```

### 6. Page Rules (Optional but Recommended)

```
URL: https://omninode.cc/*
Settings:
- Always Use HTTPS: On
- Auto Minify: JS, CSS, HTML
- Brotli: On
- Cache Level: Standard
```

```
URL: https://api.omninode.cc/*
Settings:
- Always Use HTTPS: On
- Browser Cache TTL: 4 hours
- Security Level: Medium
```

### 7. Deploy Workers Routes

The `wrangler.toml` is already configured. Just deploy:

```powershell
cd backend
wrangler deploy
```

This will automatically configure these routes:
- `omninode.cc/*` → Main app
- `*.omninode.cc/*` → Wildcard (auto subdomains)
- `api.omninode.cc/*` → API backend
- `ws.omninode.cc/*` → WebSocket server

### 8. Set Secrets

```powershell
# Required secrets for Workers
wrangler secret put DATABASE_URL
wrangler secret put JWT_SECRET
wrangler secret put JWT_REFRESH_SECRET
wrangler secret put OPENAI_API_KEY
wrangler secret put ANTHROPIC_API_KEY
wrangler secret put GOOGLE_API_KEY
wrangler secret put ENCRYPTION_MASTER_KEY
```

### 9. Verify DNS Propagation

```powershell
# Check DNS records
nslookup omninode.cc
nslookup api.omninode.cc
nslookup ws.omninode.cc

# Test wildcard
nslookup test.omninode.cc
nslookup anything.omninode.cc
```

### 10. Test Deployment

```powershell
# Test main site
curl https://omninode.cc

# Test API
curl https://api.omninode.cc/health
curl https://api.omninode.cc/api/scraper/presets

# Test WebSocket
# (Use WebSocket client to connect to wss://ws.omninode.cc)

# Test wildcard subdomain
curl https://custom.omninode.cc
```

## Automated Setup via Cloudflare API

If you want to automate DNS setup:

```powershell
# Get your Zone ID
$ZONE_ID = "your-zone-id"
$API_TOKEN = "your-api-token"

# Add DNS records via API
$headers = @{
    "Authorization" = "Bearer $API_TOKEN"
    "Content-Type" = "application/json"
}

# A record for root
$body = @{
    type = "A"
    name = "@"
    content = "192.0.2.1"
    ttl = 1
    proxied = $true
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records" `
    -Method POST `
    -Headers $headers `
    -Body $body

# CNAME for api
$body = @{
    type = "CNAME"
    name = "api"
    content = "omninode.cc"
    ttl = 1
    proxied = $true
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records" `
    -Method POST `
    -Headers $headers `
    -Body $body

# Wildcard CNAME
$body = @{
    type = "CNAME"
    name = "*"
    content = "omninode.cc"
    ttl = 1
    proxied = $true
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records" `
    -Method POST `
    -Headers $headers `
    -Body $body
```

## Subdomain Examples

With wildcard configured, these all work automatically:

- `https://omninode.cc` → Main app
- `https://api.omninode.cc` → API backend
- `https://ws.omninode.cc` → WebSocket
- `https://staging.omninode.cc` → Staging
- `https://dev.omninode.cc` → Development
- `https://docs.omninode.cc` → Documentation
- `https://admin.omninode.cc` → Admin panel
- `https://any-name.omninode.cc` → Auto-routed

## Troubleshooting

### DNS not resolving
```powershell
# Clear DNS cache
ipconfig /flushdns

# Check with multiple DNS servers
nslookup omninode.cc 8.8.8.8
nslookup omninode.cc 1.1.1.1
```

### SSL Certificate Issues
- Wait 15 minutes for Cloudflare to provision certificates
- Ensure "Proxy" is enabled (orange cloud)
- Check SSL/TLS mode is "Full (strict)"

### Workers not responding
```powershell
# Check deployment
wrangler deployments list

# View logs
wrangler tail

# Check routes
wrangler pages deployment list
```

### Wildcard not working
- Ensure the `*` CNAME record exists
- Verify "Proxied" is enabled
- Check wrangler.toml has `*.omninode.cc/*` route
- Wait for DNS propagation (up to 24 hours, usually < 5 minutes)

## Quick Deployment Command

After DNS is configured, deploy everything:

```powershell
.\deploy.ps1 -Production
```

Or use GitHub Actions (automatic on push to main):

```powershell
git add .
git commit -m "deploy: configure omninode.cc"
git push origin main
```

---

**DNS Propagation Time**: 5 minutes - 24 hours (usually < 15 minutes with Cloudflare)

**SSL Certificate Provisioning**: Automatic (5-15 minutes)

**Wildcard Support**: ✅ Enabled for unlimited subdomains

---

✨ **Your domain is now ready for omninode.cc with full wildcard subdomain support!**
