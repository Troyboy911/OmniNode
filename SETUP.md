# 🔥 OmniNode Weaponized - Setup Guide

**AI Agent Army with Real Execution, Secrets Vault, Airtable Automation**

---

## 🚀 Quick Start

### 1. Install Dependencies

```powershell
# Install pnpm if needed
corepack enable
corepack prepare pnpm@latest --activate

# Backend
cd backend
pnpm install

# Frontend (if building UI)
cd ../frontend
pnpm install
```

### 2. Initialize Secrets Vault

```powershell
cd backend

# Create master key (interactive)
pnpm vault:setup

# OR set password via env var
$env:VAULT_PASSWORD = "your-secure-password-here"
pnpm vault:setup
```

**IMPORTANT:** Save the generated master key to your password manager. Set it as `ENCRYPTION_MASTER_KEY` environment variable.

### 3. Import Your Secrets

Create `.env.local` with your API keys:

```env
# AI Providers
PERPLEXITY_API_KEY=pplx-xxxxx
OPENAI_API_KEY=sk-xxxxx
ANTHROPIC_API_KEY=sk-ant-xxxxx

# AnythingLLM
ANYTHINGLLM_BASE_URL=https://your-anythingllm.com
ANYTHINGLLM_API_KEY=xxxxx

# Airtable
AIRTABLE_API_KEY=patxxxxx
AIRTABLE_BASE_ID=appxxxxx

# Cloudflare
CLOUDFLARE_API_TOKEN=xxxxx
CLOUDFLARE_ACCOUNT_ID=xxxxx

# GitHub
GITHUB_TOKEN=ghp_xxxxx

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/omninode

# JWT
JWT_SECRET=your-random-secret-key
JWT_REFRESH_SECRET=your-random-refresh-key

# R2 Storage
R2_ACCESS_KEY_ID=xxxxx
R2_SECRET_ACCESS_KEY=xxxxx
R2_BUCKET=omninode-artifacts
R2_ENDPOINT=https://xxxxx.r2.cloudflarestorage.com
```

Import into vault:

```powershell
pnpm vault:import -f .env.local --env dev
```

### 4. Sync Secrets to Deployment Targets

```powershell
# Sync to GitHub Actions + Cloudflare Workers + Local .env
pnpm vault:sync --targets github,cloudflare,local --env dev

# Sync to Airtable backup (optional)
pnpm vault:sync --targets airtable --env dev
```

### 5. Setup Database

```powershell
# Run Prisma migrations
pnpm prisma migrate dev --name init

# Generate Prisma client
pnpm prisma generate
```

### 6. Run Backend

```powershell
# Development mode
pnpm dev

# Production mode
pnpm build
pnpm start
```

---

## 🛠️ Agent Configuration

### AnythingLLM Workspaces

Create 5 workspaces in your AnythingLLM instance:

1. **devops-warrior** - Claude 3.5 Sonnet
2. **code-assassin** - GPT-4 Turbo
3. **intelligence-unit** - Perplexity Sonar
4. **content-ops** - GPT-4
5. **security-guardian** - Claude 3

Record the workspace slugs and update `backend/src/agents/profiles.ts` if they differ.

### Airtable Base Structure

Create these tables in your Airtable base:

#### Agents
- Name (text)
- Specialization (text)
- Status (single select: Active, Idle, Busy, Error)
- WorkspaceSlug (text)
- LastActive (date)

#### Tasks
- Title (text)
- Description (long text)
- Status (single select: Pending, In Progress, Completed, Failed)
- Agent (link to Agents)
- CreatedAt (date)
- CompletedAt (date)

#### Workflows
- Name (text)
- Description (long text)
- Steps (long text - JSON array)
- Status (single select: Draft, Active, Paused, Completed)

#### Automations
- Name (text)
- Trigger (text)
- Actions (long text - JSON)
- Enabled (checkbox)
- LastRun (date)

#### Deployments
- Name (text)
- Environment (single select: dev, staging, prod)
- Status (single select: Pending, In Progress, Success, Failed)
- URL (URL)
- DeployedAt (date)

#### Logs
- Timestamp (date)
- Level (single select: info, warn, error)
- Message (long text)
- Agent (link to Agents)
- Metadata (long text - JSON)

---

## 🔐 Vault Commands Reference

```powershell
# Setup new vault
pnpm vault:setup

# Import from .env file
pnpm vault:import -f .env.local --env dev

# Set individual secret
pnpm vault:set -k API_KEY -v "secret-value" --env dev

# Get secret value
pnpm vault:get -k API_KEY --env dev

# List all secret keys
pnpm vault:list --env dev

# Sync to targets
pnpm vault:sync --targets github,cloudflare,local --env dev

# Rotate all secrets (re-encrypt with new master key)
pnpm vault:rotate --env dev
```

**Environment Scopes:** `dev`, `staging`, `prod`

**Sync Targets:** `github`, `cloudflare`, `airtable`, `local`

---

## 🐳 Docker Setup

```powershell
# Build backend image
docker build -t omninode-backend ./backend

# Run with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f backend
```

---

## ☁️ Cloudflare Deployment

### Prerequisites
- Cloudflare account with Workers enabled
- `wrangler` CLI installed: `npm install -g wrangler`
- Cloudflare API token with Workers permissions

### Deploy

```powershell
# Login to Cloudflare
wrangler login

# Deploy workers
cd workers/webhooks
wrangler deploy

# Set secrets (done automatically via vault:sync)
wrangler secret put BACKEND_URL
wrangler secret put HMAC_SECRET
```

---

## 🔧 Agent Tools Available

### File System
- `fs_read` - Read files from sandbox
- `fs_write` - Write files to sandbox
- `fs_list` - List directory contents
- `fs_delete` - Delete files/directories

### HTTP
- `http_get` - Make GET requests
- `http_post` - Make POST requests

### Docker
- `docker_build` - Build Docker images
- `docker_run` - Run commands in containers

### GitHub
- `github_create_repo` - Create repositories
- `github_create_branch` - Create branches
- `github_commit` - Commit files
- `github_create_pr` - Create pull requests

### Cloudflare
- `cloudflare_deploy` - Deploy Workers
- `cloudflare_kv_write` - Write to KV storage

### Execution
- `exec_node` - Execute Node.js code
- `exec_shell` - Run shell commands (containerized)

### Security
- `security_scan_code` - Scan code for vulnerabilities
- `security_check_deps` - Check dependency vulnerabilities

---

## 🚨 Security Notes

1. **Never commit `.vault/` directory or `master.key`**
2. **Store `ENCRYPTION_MASTER_KEY` in secure password manager**
3. **Rotate secrets monthly:** `pnpm vault:rotate --env prod`
4. **Use different master keys per environment**
5. **All agent code execution is containerized**
6. **File operations are sandboxed per run**
7. **HTTP requests validated against allowlist**

---

## 📊 Monitoring

### Health Checks

```powershell
# Backend health
curl http://localhost:3001/health

# AnythingLLM workspace health
curl http://localhost:3001/api/agents/health
```

### Logs

```powershell
# Real-time logs
pnpm dev

# Production logs
docker-compose logs -f backend
```

---

## 🔄 CI/CD

GitHub Actions workflows in `.github/workflows/`:

- **ci.yml** - Lint, test, build on PRs
- **deploy.yml** - Deploy to staging (develop) and prod (tags)
- **rotate-keys.yml** - Monthly secret rotation

**Required GitHub Secrets:**
- All secrets from vault (auto-synced via `vault:sync --targets github`)

---

## 🐛 Troubleshooting

### Vault Issues

```powershell
# If master key is lost, vault is unrecoverable
# Recreate vault and re-import secrets
rm -rf .vault
pnpm vault:setup
pnpm vault:import -f .env.local --env dev
```

### Docker Issues

```powershell
# Ensure Docker Desktop is running
docker ps

# Rebuild containers
docker-compose down
docker-compose up -d --build
```

### AnythingLLM Connection

```powershell
# Test connection
curl -H "Authorization: Bearer YOUR_API_KEY" \
  https://your-anythingllm.com/api/system/ping
```

---

## 📚 Next Steps

1. **Deploy AnythingLLM** on EasyPanel if not done
2. **Create Airtable base** with required tables
3. **Set DNS** for omninode.cc → Cloudflare
4. **Run first task** via API or UI
5. **Monitor executions** in Airtable Logs

---

## 🎯 API Endpoints

```
POST   /api/tasks              Create task
GET    /api/tasks/:id          Get task status
GET    /api/agents             List agents
POST   /api/agents/:id/execute Execute with agent
POST   /api/deploy             Deploy to Cloudflare
GET    /health                 Health check
GET    /ready                  Readiness check
```

**WebSocket:** `ws://localhost:3001/realtime` for live task updates

---

## 💪 You now have:

✅ **AES-256-GCM Encrypted Vault** - Military-grade secrets management  
✅ **Multi-target Sync** - GitHub, Cloudflare, Airtable, local  
✅ **5 Specialized Agents** - DevOps, Code, Intel, Content, Security  
✅ **20+ Agent Tools** - Real execution, not mocks  
✅ **AnythingLLM Routing** - Intelligent workspace selection  
✅ **Airtable Integration** - Automation storage and sync  
✅ **Cloudflare Deployment** - Workers auto-deploy  
✅ **GitHub Integration** - Create repos, commits, PRs  
✅ **Docker Execution** - Sandboxed code running  

**GO BUILD THE FUTURE. 🚀**
