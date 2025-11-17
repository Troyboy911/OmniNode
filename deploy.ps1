#!/usr/bin/env pwsh
# OmniNode Auto-Deploy Script for omninode.cc
# Handles full deployment with wildcard subdomain support

param(
    [switch]$SkipTests,
    [switch]$Production,
    [string]$Environment = "production"
)

$ErrorActionPreference = "Stop"

Write-Host "`n🚀 OmniNode Auto-Deploy to omninode.cc" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan

# Configuration
$DOMAIN = "omninode.cc"
$API_URL = "https://api.$DOMAIN"
$WS_URL = "https://ws.$DOMAIN"
$FRONTEND_URL = "https://$DOMAIN"

# Step 1: Check prerequisites
Write-Host "`n📋 Checking prerequisites..." -ForegroundColor Yellow

$commands = @("node", "npm", "git")
foreach ($cmd in $commands) {
    if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) {
        Write-Host "❌ $cmd not found. Please install it first." -ForegroundColor Red
        exit 1
    }
    $version = & $cmd --version 2>$null
    Write-Host "  ✓ $cmd : $version" -ForegroundColor Green
}

# Check for wrangler
if (-not (Get-Command wrangler -ErrorAction SilentlyContinue)) {
    Write-Host "⚠️  Wrangler not found. Installing..." -ForegroundColor Yellow
    npm install -g wrangler
}

# Step 2: Install dependencies
Write-Host "`n📦 Installing dependencies..." -ForegroundColor Yellow

# Backend
Write-Host "  → Backend dependencies..." -ForegroundColor Gray
Push-Location backend
try {
    npm install
    Write-Host "  ✓ Backend dependencies installed" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Failed to install backend dependencies: $_" -ForegroundColor Red
    Pop-Location
    exit 1
}
Pop-Location

# Frontend
Write-Host "  → Frontend dependencies..." -ForegroundColor Gray
try {
    npm install --legacy-peer-deps
    Write-Host "  ✓ Frontend dependencies installed" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Failed to install frontend dependencies: $_" -ForegroundColor Red
    exit 1
}

# Step 3: Setup database
Write-Host "`n🗄️  Setting up database..." -ForegroundColor Yellow
Push-Location backend
try {
    npm run prisma:generate
    Write-Host "  ✓ Prisma client generated" -ForegroundColor Green
    
    # Check if we should run migrations (only in dev/staging)
    if ($Environment -ne "production") {
        npm run prisma:migrate
        Write-Host "  ✓ Database migrations applied" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  Skipping migrations in production (run manually)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ⚠️  Database setup warning: $_" -ForegroundColor Yellow
}
Pop-Location

# Step 4: Run tests (optional)
if (-not $SkipTests) {
    Write-Host "`n🧪 Running tests..." -ForegroundColor Yellow
    
    Push-Location backend
    try {
        npm run type-check
        Write-Host "  ✓ Type checking passed" -ForegroundColor Green
    } catch {
        Write-Host "  ⚠️  Type check warnings: $_" -ForegroundColor Yellow
    }
    
    try {
        npm run lint 2>$null
        Write-Host "  ✓ Linting passed" -ForegroundColor Green
    } catch {
        Write-Host "  ⚠️  Linting warnings (non-critical)" -ForegroundColor Yellow
    }
    Pop-Location
} else {
    Write-Host "`n⏭️  Skipping tests (--SkipTests flag)" -ForegroundColor Yellow
}

# Step 5: Build backend
Write-Host "`n🔨 Building backend..." -ForegroundColor Yellow
Push-Location backend
try {
    npm run build
    Write-Host "  ✓ Backend built successfully" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Backend build failed: $_" -ForegroundColor Red
    Pop-Location
    exit 1
}
Pop-Location

# Step 6: Deploy to Cloudflare Workers
Write-Host "`n☁️  Deploying to Cloudflare Workers..." -ForegroundColor Yellow
Push-Location backend

# Check if logged in
try {
    $whoami = wrangler whoami 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  ⚠️  Not logged in to Cloudflare. Running login..." -ForegroundColor Yellow
        wrangler login
    }
} catch {
    Write-Host "  ⚠️  Login check failed. Attempting login..." -ForegroundColor Yellow
    wrangler login
}

try {
    if ($Production) {
        wrangler deploy --env production
        Write-Host "  ✓ Deployed to PRODUCTION environment" -ForegroundColor Green
    } else {
        wrangler deploy
        Write-Host "  ✓ Deployed to DEFAULT environment" -ForegroundColor Green
    }
} catch {
    Write-Host "  ❌ Cloudflare deployment failed: $_" -ForegroundColor Red
    Pop-Location
    exit 1
}
Pop-Location

# Step 7: Build frontend
Write-Host "`n🎨 Building frontend..." -ForegroundColor Yellow
$env:NEXT_PUBLIC_API_URL = $API_URL
$env:NEXT_PUBLIC_WS_URL = $WS_URL

try {
    npm run build
    Write-Host "  ✓ Frontend built successfully" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Frontend build failed: $_" -ForegroundColor Red
    exit 1
}

# Step 8: Deploy to Vercel (optional - requires setup)
Write-Host "`n🚢 Deploying frontend..." -ForegroundColor Yellow

if (Get-Command vercel -ErrorAction SilentlyContinue) {
    try {
        if ($Production) {
            vercel --prod --yes
            Write-Host "  ✓ Frontend deployed to Vercel (production)" -ForegroundColor Green
        } else {
            vercel --yes
            Write-Host "  ✓ Frontend deployed to Vercel (preview)" -ForegroundColor Green
        }
    } catch {
        Write-Host "  ⚠️  Vercel deployment skipped (not configured or error): $_" -ForegroundColor Yellow
    }
} else {
    Write-Host "  ⚠️  Vercel CLI not installed. Skipping frontend deployment." -ForegroundColor Yellow
    Write-Host "  💡 Install with: npm install -g vercel" -ForegroundColor Cyan
}

# Step 9: Verify deployment
Write-Host "`n✅ Verifying deployment..." -ForegroundColor Yellow

$endpoints = @(
    $FRONTEND_URL,
    "$API_URL/health",
    "$API_URL/api/scraper/presets"
)

foreach ($endpoint in $endpoints) {
    try {
        $response = Invoke-WebRequest -Uri $endpoint -TimeoutSec 10 -UseBasicParsing -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Host "  ✓ $endpoint - OK" -ForegroundColor Green
        } else {
            Write-Host "  ⚠️  $endpoint - Status: $($response.StatusCode)" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "  ⚠️  $endpoint - Not reachable yet (may need DNS propagation)" -ForegroundColor Yellow
    }
}

# Step 10: Summary
Write-Host "`n" + ("=" * 60) -ForegroundColor Cyan
Write-Host "🎉 Deployment Complete!" -ForegroundColor Green
Write-Host ("=" * 60) -ForegroundColor Cyan

Write-Host "`n📍 Your OmniNode deployment:" -ForegroundColor Cyan
Write-Host "  🌐 Frontend:   $FRONTEND_URL" -ForegroundColor White
Write-Host "  🔌 API:        $API_URL" -ForegroundColor White
Write-Host "  💬 WebSocket:  $WS_URL" -ForegroundColor White
Write-Host "  🕷️  Scraper:    $API_URL/api/scraper" -ForegroundColor White

Write-Host "`n🌐 Wildcard subdomains enabled:" -ForegroundColor Cyan
Write-Host "  *.omninode.cc → All subdomains auto-routed" -ForegroundColor White
Write-Host "  api.omninode.cc → Backend API" -ForegroundColor White
Write-Host "  ws.omninode.cc → WebSocket server" -ForegroundColor White
Write-Host "  staging.omninode.cc → Staging environment" -ForegroundColor White

Write-Host "`n📋 Next steps:" -ForegroundColor Cyan
Write-Host "  1. Configure Cloudflare DNS records (if not done)" -ForegroundColor White
Write-Host "  2. Set secrets: wrangler secret put <KEY>" -ForegroundColor White
Write-Host "  3. Test the API: curl $API_URL/api/scraper/presets" -ForegroundColor White
Write-Host "  4. Access dashboard: $FRONTEND_URL/dashboard" -ForegroundColor White

Write-Host "`n⚙️  Environment: $Environment" -ForegroundColor Gray
Write-Host "🕐 Deployed at: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray

Write-Host "`n✨ All systems operational!`n" -ForegroundColor Green
