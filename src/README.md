# OmniNode Worker API

Cloudflare Workers-based API for OmniNode AI orchestration platform.

## 🚀 Features

- **Hono Framework**: Fast, lightweight web framework optimized for edge
- **Real AI Integrations**: OpenAI, Anthropic Claude, Google Gemini
- **Prisma Edge**: Database access via Neon serverless driver
- **JWT Authentication**: Secure token-based auth with refresh tokens
- **Rate Limiting**: Distributed rate limiting using KV
- **File Storage**: R2 bucket integration for file uploads
- **WebSockets**: Real-time communication via Durable Objects
- **Streaming**: SSE support for AI chat streaming
- **TypeScript**: Full type safety

## 📁 Project Structure

```
src/worker/
├── index.ts                 # Main entry point
├── routes/
│   ├── auth.ts             # Authentication endpoints
│   ├── projects.ts         # Project management
│   ├── agents.ts           # Agent management
│   ├── tasks.ts            # Task management
│   ├── ai.ts               # AI provider integrations
│   ├── files.ts            # File upload/download
│   └── health.ts           # Health checks
├── middleware/
│   ├── auth.ts             # JWT authentication
│   ├── error.ts            # Error handling
│   └── ratelimit.ts        # Rate limiting
├── lib/
│   └── prisma.ts           # Prisma client setup
├── durable-objects/
│   └── websocket.ts        # WebSocket handler
├── package.json
├── tsconfig.json
└── wrangler.toml           # Cloudflare configuration
```

## 🛠️ Setup

### Prerequisites

- Node.js 20+
- Cloudflare account
- Neon database
- AI provider API keys

### Installation

```bash
cd src/worker
npm install
```

### Configuration

1. Copy environment variables:
```bash
cp ../../.env.cloudflare.example .env
```

2. Update `.env` with your values:
```env
DATABASE_URL=postgresql://...
JWT_SECRET=your_secret
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=...
```

3. Update `wrangler.toml` with your account ID

### Development

```bash
# Start local dev server
npm run dev

# Type check
npm run type-check

# Build
npm run build
```

### Deployment

```bash
# Deploy to production
npm run deploy:production

# Deploy to staging
npm run deploy:staging

# Set secrets
echo "your_secret" | wrangler secret put JWT_SECRET
```

## 📡 API Endpoints

### Authentication

```bash
# Register
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}

# Login
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}

# Refresh token
POST /api/auth/refresh
{
  "refreshToken": "..."
}

# Logout
POST /api/auth/logout
Headers: Authorization: Bearer <token>

# Get current user
GET /api/auth/me
Headers: Authorization: Bearer <token>
```

### Projects

```bash
# List projects
GET /api/projects
Headers: Authorization: Bearer <token>

# Get project
GET /api/projects/:id
Headers: Authorization: Bearer <token>

# Create project
POST /api/projects
Headers: Authorization: Bearer <token>
{
  "name": "My Project",
  "description": "Project description"
}

# Update project
PUT /api/projects/:id
Headers: Authorization: Bearer <token>
{
  "name": "Updated Name",
  "status": "ACTIVE"
}

# Delete project
DELETE /api/projects/:id
Headers: Authorization: Bearer <token>

# Get project stats
GET /api/projects/:id/stats
Headers: Authorization: Bearer <token>
```

### Agents

```bash
# List agents
GET /api/agents?projectId=<id>
Headers: Authorization: Bearer <token>

# Get agent
GET /api/agents/:id
Headers: Authorization: Bearer <token>

# Create agent
POST /api/agents
Headers: Authorization: Bearer <token>
{
  "name": "AI Assistant",
  "type": "chat",
  "projectId": "...",
  "config": {}
}

# Update agent
PUT /api/agents/:id
Headers: Authorization: Bearer <token>
{
  "name": "Updated Name",
  "status": "ACTIVE"
}

# Delete agent
DELETE /api/agents/:id
Headers: Authorization: Bearer <token>
```

### Tasks

```bash
# List tasks
GET /api/tasks?projectId=<id>&status=<status>
Headers: Authorization: Bearer <token>

# Get task
GET /api/tasks/:id
Headers: Authorization: Bearer <token>

# Create task
POST /api/tasks
Headers: Authorization: Bearer <token>
{
  "title": "Task Title",
  "description": "Task description",
  "projectId": "...",
  "agentId": "...",
  "priority": "HIGH"
}

# Update task
PUT /api/tasks/:id
Headers: Authorization: Bearer <token>
{
  "status": "COMPLETED",
  "result": {}
}

# Delete task
DELETE /api/tasks/:id
Headers: Authorization: Bearer <token>
```

### AI

```bash
# List models
GET /api/ai/models

# Chat completion
POST /api/ai/chat
Headers: Authorization: Bearer <token>
{
  "provider": "openai",
  "model": "gpt-4-turbo-preview",
  "messages": [
    {"role": "user", "content": "Hello!"}
  ],
  "stream": false
}

# Streaming chat
POST /api/ai/chat
Headers: Authorization: Bearer <token>
{
  "provider": "anthropic",
  "model": "claude-3-opus-20240229",
  "messages": [
    {"role": "user", "content": "Tell me a story"}
  ],
  "stream": true
}

# AI health check
GET /api/ai/health
```

### Files

```bash
# Upload file
POST /api/files/upload
Headers: Authorization: Bearer <token>
Content-Type: multipart/form-data
Body: file=<file>

# List files
GET /api/files
Headers: Authorization: Bearer <token>

# Download file
GET /api/files/:key
Headers: Authorization: Bearer <token>

# Delete file
DELETE /api/files/:key
Headers: Authorization: Bearer <token>

# Get file metadata
HEAD /api/files/:key
Headers: Authorization: Bearer <token>
```

### Health

```bash
# Basic health
GET /health

# Detailed health
GET /health/detailed

# Database health
GET /health/db

# KV health
GET /health/kv

# R2 health
GET /health/r2

# AI providers health
GET /health/ai
```

## 🔌 WebSocket

Connect to WebSocket for real-time updates:

```javascript
const ws = new WebSocket('wss://api.omninode.app/ws?userId=<id>&projectId=<id>');

ws.onopen = () => {
  console.log('Connected');
  
  // Subscribe to project
  ws.send(JSON.stringify({
    type: 'subscribe',
    projectId: 'project-id'
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Message:', data);
};

// Ping/pong
setInterval(() => {
  ws.send(JSON.stringify({ type: 'ping' }));
}, 30000);
```

## 🧪 Testing

```bash
# Run tests
npm test

# Test with curl
curl https://api.omninode.app/health

# Test authentication
curl -X POST https://api.omninode.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

## 📊 Monitoring

### View Logs

```bash
# Tail logs
wrangler tail

# Tail with filters
wrangler tail --status error
```

### Metrics

- Cloudflare Dashboard → Workers & Pages → omninode-api → Metrics
- View requests, errors, CPU time, and more

## 🔒 Security

- **JWT Authentication**: All protected routes require valid JWT
- **Rate Limiting**: Configurable per-endpoint rate limits
- **CORS**: Configured for specific origins
- **Input Validation**: Zod schemas for all inputs
- **SQL Injection Protection**: Prisma ORM
- **Secure Headers**: Helmet.js middleware

## 🚀 Performance

- **Edge Deployment**: Runs on Cloudflare's global network
- **KV Caching**: Session and rate limit data cached
- **Connection Pooling**: Neon serverless driver
- **Streaming**: SSE for AI responses
- **Optimized Queries**: Prisma with proper indexes

## 📝 Environment Variables

Required secrets (set via `wrangler secret put`):

- `DATABASE_URL`: Neon Postgres connection string
- `JWT_SECRET`: JWT signing secret (min 32 chars)
- `JWT_REFRESH_SECRET`: Refresh token secret (min 32 chars)
- `OPENAI_API_KEY`: OpenAI API key
- `ANTHROPIC_API_KEY`: Anthropic API key
- `GOOGLE_API_KEY`: Google Gemini API key

## 🐛 Troubleshooting

### Database Connection Issues

```bash
# Test connection
psql "$DATABASE_URL"

# Check Prisma
npx prisma validate
npx prisma generate
```

### Deployment Fails

```bash
# Verbose output
wrangler deploy --verbose

# Dry run
wrangler deploy --dry-run
```

### Secrets Not Working

```bash
# List secrets
wrangler secret list

# Re-set secret
echo "new_value" | wrangler secret put SECRET_NAME
```

## 📚 Resources

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Hono Framework](https://hono.dev/)
- [Prisma Edge](https://www.prisma.io/docs/guides/deployment/edge)
- [Neon Database](https://neon.tech/docs)

## 📄 License

MIT