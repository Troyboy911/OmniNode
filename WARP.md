# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

OMNI NODE is a full-stack AI orchestration platform for autonomous agent synthesis and management.

## Quickstart (local)

**Infra:**
```bash
docker-compose up  # Starts PostgreSQL, Redis, Nginx, app
```

**Frontend (root):**
```bash
npm install --legacy-peer-deps
npm run dev  # Port 3000
```

**Backend (./backend):**
```bash
npm run prisma:generate && npm run prisma:migrate
npm run dev  # Port 3001
```

## Common commands

### Frontend (root)
```bash
npm install --legacy-peer-deps  # Required due to React 19 + Three.js peer deps
npm run dev        # Development server (port 3000)
npm run build      # Production build
npm run start      # Start production server
npm run lint       # Run ESLint
```

### Backend (./backend)
```bash
npm run dev        # Development server (port 3001)
npm run build      # Compile TypeScript
npm run start      # Start production server
npm run prisma:generate   # Generate Prisma client
npm run prisma:migrate    # Run database migrations
npm run prisma:studio     # Open Prisma Studio GUI
npm run lint              # Run ESLint
npm run type-check        # TypeScript type checking
npm run format            # Format code with Prettier
npm run format:check      # Check code formatting
```

### Tests (./backend)
```bash
npm run test:unit              # Unit tests
npm run test:integration       # Integration tests
npm run test:ai                # All AI provider tests
npm run test:ai:openai         # OpenAI-specific tests
npm run test:ai:claude         # Claude-specific tests
npm run test:ai:ollama         # Ollama-specific tests
npm run test:coverage          # Coverage report
npm run test:performance       # Performance tests
npm run test:e2e               # End-to-end tests

# Single test examples (Jest)
npm run test:unit -- -t "AgentService"
npm run test:unit -- src/path/to/file.test.ts
```

### Vault CLI (./backend)
```bash
npm run vault:setup    # Initialize secrets vault
npm run vault:import   # Import secrets from .env
npm run vault:set      # Set individual secret
npm run vault:get      # Retrieve secret
npm run vault:list     # List all secrets
npm run vault:sync     # Sync with remote vault
npm run vault:rotate   # Rotate secrets
```

### Docker
```bash
docker-compose up           # Start all services
docker-compose up -d        # Start in background
docker-compose down         # Stop all services
docker-compose logs -f      # Follow logs
docker build -t omninode .  # Build custom image
```

## Architecture overview

**Platform:** OMNI NODE — full-stack AI orchestration for autonomous agent synthesis/management

**Frontend:**
- Next.js 15 (App Router) + React 19 + TypeScript
- Neural Cockpit UI (chrome/neon blue aesthetic)
- 3D visualization via Three.js/React Three Fiber
- Dashboard tabs: Overview, Ascension Protocol, Pan-Network, Agent Fleet, Strategic Planning, Agent Synthesizer, Economic Dashboard, Blockchain
- Components in `/components`, pages in `/app`
- Mock data layer: `lib/mockData.ts` (enables frontend dev without backend)

**Backend:**
- Express.js + TypeScript REST API
- PostgreSQL (Prisma ORM), Redis cache, Socket.io WebSockets
- JWT authentication (access + refresh tokens)
- 50+ API endpoints across auth/agents/projects/tasks/commands
- Services directory structure:
  - `backend/src/services/ai` — OpenAI, Claude, Ollama integrations
  - `backend/src/services/blockchain` — Ethereum/Polygon integration
  - `backend/src/services/memory` — Agent memory management
  - `backend/src/services/monitoring` — Performance tracking
  - `backend/src/services/queue` — Task queue system
  - `backend/src/services/storage` — File storage (local/cloud)
  - `backend/src/services/vault` — Secrets management
  - `backend/src/services/websocket` — Real-time updates

**Database:**
- Prisma models: User, Project, Agent, Task
- Neon serverless driver compatible (for Cloudflare Workers)
- Schema: `prisma/schema.prisma`

**Agent system:**
- 10 specialized agent roles:
  1. Project Manager AI
  2. Solidity Developer AI
  3. Frontend Developer AI
  4. UX/UI Designer AI
  5. Financial Analyst AI
  6. Marketing Specialist AI
  7. Data Analyst AI
  8. DevOps Engineer AI
  9. DAO Architect AI
  10. Smart Contract Auditor AI

**Deployment targets:**
- Docker + Compose (PostgreSQL, Redis, Nginx)
- Cloudflare Workers (`wrangler.toml` with KV, R2, Durable Objects)
- GitHub Actions CI/CD → EasyPanel
- Also ready for: Vercel, AWS, Azure, GCP

**Path aliases:**
- TypeScript maps `@/*` to repo root

## Development notes

**Critical setup requirements:**
- **Ports:** Frontend 3000, Backend 3001. Run in separate terminals for full-stack dev.
- **Frontend install MUST use** `--legacy-peer-deps` due to React 19 + Three.js peer dependency constraints
- **Backend requires:** PostgreSQL and Redis (use Docker Compose or local services)
- **Prisma setup:** Run `npm run prisma:generate && npm run prisma:migrate` before starting backend

**Data flow:**
- Frontend-backend bridge: `lib/api-client.ts` (axios instance with auth interceptors)
- Mocking layer: `lib/mockData.ts` enables frontend development without live backend
- WebSocket events: Real-time agent updates, task progress, system metrics

**Environment variables:**
Required (configure via local `.env` or vault CLI):
- `DATABASE_URL` — PostgreSQL connection string
- `JWT_SECRET` — Access token secret
- `JWT_REFRESH_SECRET` — Refresh token secret
- `OPENAI_API_KEY` — OpenAI API key
- `ANTHROPIC_API_KEY` — Anthropic Claude API key
- `GOOGLE_API_KEY` — Google AI API key
- `REDIS_URL` — Redis connection string

**Secrets management:**
- Vault CLI scripts in backend handle encryption/rotation
- Commands: `vault:setup`, `vault:import`, `vault:set`, `vault:get`, `vault:list`, `vault:sync`, `vault:rotate`

**Component architecture:**
- `'use client'` used extensively in app router components for interactivity
- 3D components wrapped in dynamic imports with `{ ssr: false }` to prevent hydration issues
- Chrome/neon blue theme defined in `app/globals.css`

**Test strategy:**
- Unit tests: Services, controllers, utilities
- Integration tests: API endpoints, database operations
- AI-provider-specific tests: OpenAI, Claude, Ollama
- Additional suites: performance, load, smoke, e2e

## Key files to reference

- `README.md` — Project overview and feature summary
- `PROJECT_STATUS.md` — Current completion status (255+ features)
- `DEPLOYMENT.md` — Deployment options and configuration
- `FEATURES.md` — Comprehensive capability list (205+ features)
- `backend/package.json` — All backend scripts and dependencies
- `prisma/schema.prisma` — Complete database schema
- `wrangler.toml` — Cloudflare Workers configuration
- `docker-compose.yml` — Infrastructure services setup
- `lib/api-client.ts` — Frontend API client configuration
- `lib/mockData.ts` — Mock data for frontend development
