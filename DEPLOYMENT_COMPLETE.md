# 🚀 OmniNode Complete Implementation & Deployment Guide

**Everything needed to deploy omninode.cc with scraper swarm, orchestration, and full tooling**

---

## ✅ Implementation Status

### Completed
- [x] Extended Prisma schema (Workflow, Automation, Run, ExecutionLog, Deployment, CostEvent, ScraperJob, ScraperResult, ScraperSchedule)
- [x] fs.tools.ts - File system operations
- [x] http.tools.ts - HTTP client + web scraping
- [x] Scraper swarm controller with 8 presets
- [x] WARP.md configuration guide

### To Complete
- [ ] docker.tools.ts
- [ ] exec.tools.ts
- [ ] security.tools.ts
- [ ] API controllers (tasks, agents, deploy, scraper)
- [ ] Orchestration engine (classifier, planner, executor, streaming)
- [ ] Frontend components (ScraperDashboard, TaskMonitor, WorkflowBuilder)
- [ ] CI/CD workflows
- [ ] Integration tests
- [ ] Cloudflare DNS configuration for omninode.cc

---

## 1. Cloudflare DNS for omninode.cc

### Login to Cloudflare

```bash
https://dash.cloudflare.com/
```

### DNS Records Configuration

Add these records for **omninode.cc**:

```
Type    Name    Content                         Proxy   TTL
──────────────────────────────────────────────────────────────
A       @       YOUR_SERVER_IP                  ✅      Auto
A       www     YOUR_SERVER_IP                  ✅      Auto
CNAME   api     omninode.cc                     ✅      Auto
CNAME   ws      omninode.cc                     ✅      Auto
CNAME   cdn     omninode.cc                     ✅      Auto
```

For **Cloudflare Workers** deployment:
```
CNAME   workers   omninode-api.workers.dev      ✅      Auto
```

### SSL/TLS Settings

1. Go to SSL/TLS → Overview
2. Set to **Full (strict)**
3. Enable:
   - ✅ Always Use HTTPS
   - ✅ Automatic HTTPS Rewrites
   - ✅ Minimum TLS Version: 1.2

### Security Rules

1. Go to Security → WAF
2. Enable:
   - ✅ Bot Fight Mode
   - ✅ Security Level: Medium
   - ✅ Challenge Passage: 30 minutes
3. Add rate limiting:
   - 100 req/10 min per IP for /api/*
   - 1000 req/hour per IP for /scraper/*

### Update wrangler.toml

```toml
name = "omninode-api"
main = "src/worker/index.ts"
compatibility_date = "2025-01-17"
node_compat = true

account_id = "YOUR_CLOUDFLARE_ACCOUNT_ID"

[[routes]]
pattern = "omninode.cc/api/*"
zone_name = "omninode.cc"

[[routes]]
pattern = "api.omninode.cc/*"
zone_name = "omninode.cc"

[vars]
ENVIRONMENT = "production"
LOG_LEVEL = "info"
CORS_ORIGIN = "https://omninode.cc"

[[kv_namespaces]]
binding = "SESSIONS"
id = "YOUR_KV_ID"

[[r2_buckets]]
binding = "FILES"
bucket_name = "omninode-files"
```

### Deploy to Cloudflare

```bash
cd backend
npx wrangler login
npx wrangler deploy

# Set secrets
npx wrangler secret put DATABASE_URL
npx wrangler secret put JWT_SECRET
npx wrangler secret put OPENAI_API_KEY
```

---

## 2. Complete Tool Implementations

### Create docker.tools.ts

```bash
New-Item -Path "backend\src\tools\docker.tools.ts" -ItemType File
```

```typescript
import Docker from 'dockerode';
import { logger } from '@/config/logger';

export interface DockerOperation {
  success: boolean;
  data?: any;
  error?: string;
}

export class DockerTools {
  private docker: Docker;

  constructor() {
    this.docker = new Docker();
  }

  async build(path: string, tag: string, dockerfile = 'Dockerfile'): Promise<DockerOperation> {
    try {
      const stream = await this.docker.buildImage({
        context: path,
        src: [dockerfile]
      }, { t: tag });

      return new Promise((resolve, reject) => {
        this.docker.modem.followProgress(stream, 
          (err: any, res: any) => err ? reject(err) : resolve({ success: true, data: res }),
          (event: any) => logger.info('Docker build:', event)
        );
      });
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async run(image: string, options: Docker.ContainerCreateOptions = {}): Promise<DockerOperation> {
    try {
      const container = await this.docker.createContainer({
        Image: image,
        ...options
      });

      await container.start();
      
      return { 
        success: true, 
        data: { 
          containerId: container.id,
          status: 'running'
        }
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async exec(containerId: string, cmd: string[]): Promise<DockerOperation> {
    try {
      const container = this.docker.getContainer(containerId);
      const exec = await container.exec({
        Cmd: cmd,
        AttachStdout: true,
        AttachStderr: true
      });

      const stream = await exec.start({ Detach: false });
      let output = '';

      stream.on('data', (chunk: Buffer) => {
        output += chunk.toString();
      });

      await new Promise(resolve => stream.on('end', resolve));

      return { success: true, data: output };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async logs(containerId: string, tail: number = 100): Promise<DockerOperation> {
    try {
      const container = this.docker.getContainer(containerId);
      const stream = await container.logs({
        follow: false,
        stdout: true,
        stderr: true,
        tail
      });

      return { success: true, data: stream.toString() };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async stop(containerId: string): Promise<DockerOperation> {
    try {
      const container = this.docker.getContainer(containerId);
      await container.stop();
      return { success: true, data: { containerId, status: 'stopped' } };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async remove(containerId: string, force = false): Promise<DockerOperation> {
    try {
      const container = this.docker.getContainer(containerId);
      await container.remove({ force });
      return { success: true, data: { containerId, status: 'removed' } };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async listContainers(all = false): Promise<DockerOperation> {
    try {
      const containers = await this.docker.listContainers({ all });
      return { success: true, data: containers };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

export const dockerTools = new DockerTools();
```

### Create exec.tools.ts

```typescript
import { spawn, exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface ExecResult {
  success: boolean;
  stdout?: string;
  stderr?: string;
  error?: string;
  exitCode?: number;
  pid?: number;
}

export class ExecTools {
  async run(command: string, args: string[] = []): Promise<ExecResult> {
    return new Promise((resolve) => {
      const proc = spawn(command, args);
      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      proc.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      proc.on('close', (code) => {
        resolve({
          success: code === 0,
          stdout,
          stderr,
          exitCode: code || 0,
          pid: proc.pid
        });
      });

      proc.on('error', (error) => {
        resolve({
          success: false,
          error: error.message
        });
      });
    });
  }

  async runShell(command: string): Promise<ExecResult> {
    try {
      const { stdout, stderr } = await execAsync(command);
      return {
        success: true,
        stdout,
        stderr
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        stdout: error.stdout,
        stderr: error.stderr,
        exitCode: error.code
      };
    }
  }

  async runWithStream(
    command: string, 
    args: string[], 
    onData: (data: string) => void
  ): Promise<ExecResult> {
    return new Promise((resolve) => {
      const proc = spawn(command, args);

      proc.stdout.on('data', (data) => {
        onData(data.toString());
      });

      proc.stderr.on('data', (data) => {
        onData(`[ERROR] ${data.toString()}`);
      });

      proc.on('close', (code) => {
        resolve({
          success: code === 0,
          exitCode: code || 0,
          pid: proc.pid
        });
      });
    });
  }

  async kill(pid: number, signal: string = 'SIGTERM'): Promise<ExecResult> {
    try {
      process.kill(pid, signal);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

export const execTools = new ExecTools();
```

### Create security.tools.ts

```typescript
import crypto from 'crypto';
import { vaultService } from '@/services/vault';

export interface EncryptionResult {
  success: boolean;
  data?: string;
  error?: string;
}

export class SecurityTools {
  private algorithm = 'aes-256-gcm';

  async encrypt(data: string, key?: string): Promise<EncryptionResult> {
    try {
      const encryptionKey = key || process.env.ENCRYPTION_MASTER_KEY;
      if (!encryptionKey) throw new Error('Encryption key required');

      const keyBuffer = crypto.scryptSync(encryptionKey, 'salt', 32);
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv(this.algorithm, keyBuffer, iv);

      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const authTag = cipher.getAuthTag();
      const result = iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;

      return { success: true, data: result };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async decrypt(encrypted: string, key?: string): Promise<EncryptionResult> {
    try {
      const encryptionKey = key || process.env.ENCRYPTION_MASTER_KEY;
      if (!encryptionKey) throw new Error('Encryption key required');

      const [ivHex, authTagHex, data] = encrypted.split(':');
      const keyBuffer = crypto.scryptSync(encryptionKey, 'salt', 32);
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');

      const decipher = crypto.createDecipheriv(this.algorithm, keyBuffer, iv);
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(data, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return { success: true, data: decrypted };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async hash(data: string, algorithm = 'sha256'): Promise<EncryptionResult> {
    try {
      const hash = crypto.createHash(algorithm).update(data).digest('hex');
      return { success: true, data: hash };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getSecret(key: string): Promise<EncryptionResult> {
    try {
      const value = await vaultService.get(key);
      return { success: true, data: value };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async setSecret(key: string, value: string): Promise<EncryptionResult> {
    try {
      await vaultService.set(key, value);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async rotateSecret(key: string): Promise<EncryptionResult> {
    try {
      const newValue = crypto.randomBytes(32).toString('hex');
      await vaultService.set(key, newValue);
      return { success: true, data: newValue };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  generateToken(length = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  generateApiKey(): string {
    return 'on_' + crypto.randomBytes(32).toString('base64url');
  }
}

export const securityTools = new SecurityTools();
```

---

## 3. Scraper Swarm Usage

### Available Presets

1. **NEWS_ARTICLE** - News websites
2. **PRODUCT_LISTING** - E-commerce sites
3. **SOCIAL_POSTS** - Social media
4. **JOB_LISTING** - Job boards
5. **REAL_ESTATE** - Property listings
6. **EVENT_LISTING** - Event sites
7. **SEARCH_RESULTS** - Search engines
8. **BLOG_POSTS** - Blog sites

### Quick Usage Example

```typescript
import { scraperSwarm } from '@/services/scraper/swarm-controller';

// Initialize
await scraperSwarm.initialize();

// Create job
const job = await scraperSwarm.createFromPreset(
  projectId,
  'PRODUCT_LISTING',
  'https://example.com/products'
);

// Execute
const result = await scraperSwarm.executeJob(job.id);
console.log(`Scraped ${result.data?.length} items`);

// Schedule for recurring execution
scraperSwarm.scheduleJob(job.id, '0 */6 * * *'); // Every 6 hours
```

---

## 4. Run Database Migrations

```powershell
cd backend

# Generate Prisma client
npm run prisma:generate

# Create migration
npx prisma migrate dev --name add_workflow_scraper_deployment_models

# Apply
npm run prisma:migrate

# Verify in Prisma Studio
npm run prisma:studio
```

---

## 5. Install Missing Dependencies

```powershell
cd backend

# Add scraping libraries
npm install cheerio node-cron glob

# Add Docker client
npm install dockerode
npm install -D @types/dockerode

# Verify
npm run type-check
```

---

## 6. Deploy Full Stack

### Local Development

```powershell
# Terminal 1: Infrastructure
docker-compose up

# Terminal 2: Backend
cd backend
npm run dev  # Port 3001

# Terminal 3: Frontend
npm install --legacy-peer-deps
npm run dev  # Port 3000
```

### Production Deployment

```powershell
# 1. Build backend
cd backend
npm run build

# 2. Deploy to Cloudflare Workers
npx wrangler deploy

# 3. Build frontend
cd ..
npm run build

# 4. Deploy to Vercel
npx vercel --prod

# 5. Verify
curl https://api.omninode.cc/health
curl https://omninode.cc
```

---

## 7. Test Scraper Swarm

```powershell
# Create test scraper job
curl -X POST http://localhost:3001/api/scraper `
  -H "Content-Type: application/json" `
  -d '{
    "preset": "PRODUCT_LISTING",
    "targetUrl": "https://example.com/products",
    "projectId": "your-project-id"
  }'

# Execute job
curl -X POST http://localhost:3001/api/scraper/{jobId}/execute

# Get results
curl http://localhost:3001/api/scraper/{jobId}/results
```

---

## 8. Next Steps

1. **Create API routes** (tasks, agents, deploy, scraper)
2. **Build orchestration engine** (classifier, planner, executor)
3. **Add frontend components** (ScraperDashboard, TaskMonitor)
4. **Setup CI/CD** (GitHub Actions workflows)
5. **Write integration tests**
6. **Monitor and optimize**

---

## Summary

✅ **Completed:**
- Prisma schema extended
- File system tools
- HTTP/scraping tools
- Scraper swarm with 8 presets
- Cloudflare DNS guide

🔧 **Next:**
- Finish remaining tools (docker, exec, security)
- Build API controllers
- Create orchestration engine
- Deploy to omninode.cc

**Access your deployment at: https://omninode.cc**

---

**Built by Stellarc Dynamics Warp Agent**
