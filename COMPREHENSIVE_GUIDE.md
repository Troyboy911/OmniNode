# OmniNode Comprehensive Development Guide

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Frontend Components](#frontend-components)
4. [Backend Services](#backend-services)
5. [AI Integration](#ai-integration)
6. [WebSocket Features](#websocket-features)
7. [File Management](#file-management)
8. [Testing](#testing)
9. [Deployment](#deployment)
10. [Security](#security)
11. [Performance](#performance)
12. [Monitoring](#monitoring)

## Project Overview

OmniNode is a comprehensive AI orchestration platform that enables users to:
- Manage AI projects, agents, and tasks
- Interact with multiple AI providers (OpenAI, Claude, Gemini, Ollama)
- Upload and process files with AI
- Real-time collaboration via WebSocket
- Monitor system metrics and performance

## Architecture

### Tech Stack
- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis
- **AI Providers**: OpenAI, Anthropic Claude, Google Gemini, Local Ollama
- **Real-time**: Socket.io
- **File Storage**: Local with S3 integration

### Architecture Diagram
```
┌─────────────────────────────────────────┐
│            Next.js Frontend             │
│  ┌─────────────┐  ┌──────────────────┐  │
│  │   Dashboard │  │   AI Chat UI     │  │
│  └─────────────┘  └──────────────────┘  │
└─────────────────────────────────────────┘
                    │
┌─────────────────────────────────────────┐
│          REST API Gateway               │
│        (Express.js Backend)             │
└─────────────────────────────────────────┘
                    │
┌─────────────────────────────────────────┐
│         WebSocket Server                │
│        (Real-time Updates)              │
└─────────────────────────────────────────┘
                    │
┌─────────────────────────────────────────┐
│        Service Layer                    │
│  ┌─────────────┐  ┌──────────────────┐  │
│  │   Projects  │  │     Agents       │  │
│  └─────────────┘  └──────────────────┘  │
│  ┌─────────────┐  ┌──────────────────┐  │
│  │    Tasks    │  │     Files        │  │
│  └─────────────┘  └──────────────────┘  │
└─────────────────────────────────────────┘
                    │
┌─────────────────────────────────────────┐
│         AI Orchestrator                 │
│  ┌─────────────┐  ┌──────────────────┐  │
│  │   OpenAI    │  │     Claude       │  │
│  └─────────────┘  └──────────────────┘  │
│  ┌─────────────┐  ┌──────────────────┐  │
│  │   Gemini    │  │     Ollama       │  │
│  └─────────────┘  └──────────────────┘  │
└─────────────────────────────────────────┘
                    │
┌─────────────────────────────────────────┐
│         Data Layer                      │
│  ┌─────────────┐  ┌──────────────────┐  │
│  │ PostgreSQL  │  │      Redis       │  │
│  └─────────────┘  └──────────────────┘  │
└─────────────────────────────────────────┘
```

## Frontend Components

### Core Components

#### 1. EnhancedDashboard
- **Purpose**: Main dashboard with real-time data
- **Features**: 
  - Project statistics
  - Agent management
  - Task tracking
  - WebSocket integration
- **Usage**: `/dashboard`

#### 2. AIChatInterface
- **Purpose**: Interactive AI chat interface
- **Features**:
  - Multi-model support
  - Real-time streaming
  - Chat history
  - Export functionality
- **Usage**: `/dashboard` → AI Assistant tab

#### 3. FileUploadInterface
- **Purpose**: File management and AI processing
- **Features**:
  - Drag & drop upload
  - File preview
  - AI analysis
  - Batch operations
- **Usage**: `/dashboard` → File Manager tab

#### 4. Login/Registration
- **Purpose**: User authentication
- **Features**:
  - JWT token management
  - Secure form handling
  - Responsive design

### Component Structure
```
src/
├── components/
│   ├── EnhancedDashboard.tsx
│   ├── AIChatInterface.tsx
│   ├── FileUploadInterface.tsx
│   └── [existing components]
├── hooks/
│   ├── useWebSocket.ts
│   └── useAuth.ts
├── lib/
│   ├── api-client.ts
│   └── types.ts
└── app/
    ├── login/
    ├── dashboard/
    └── api/
```

## Backend Services

### Core Services

#### 1. Authentication Service
```typescript
// JWT-based authentication
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh
GET  /api/auth/me
POST /api/auth/logout
```

#### 2. Project Service
```typescript
GET    /api/projects
POST   /api/projects
GET    /api/projects/:id
PATCH  /api/projects/:id
DELETE /api/projects/:id
```

#### 3. Agent Service
```typescript
GET    /api/agents
POST   /api/agents
GET    /api/agents/:id
PATCH  /api/agents/:id
DELETE /api/agents/:id
```

#### 4. Task Service
```typescript
GET    /api/tasks
POST   /api/tasks
GET    /api/tasks/:id
PATCH  /api/tasks/:id
DELETE /api/tasks/:id
```

#### 5. File Service
```typescript
POST   /api/files/upload
GET    /api/files
GET    /api/files/:id
DELETE /api/files/:id
```

#### 6. AI Service
```typescript
POST   /api/ai/generate
POST   /api/ai/chat
GET    /api/ai/models
GET    /api/ai/conversations
POST   /api/ai/process-file
```

### WebSocket Events
```typescript
// Agent Events
agent:update
agent:create
agent:delete

// Task Events
task:update
task:create
task:delete

// Project Events
project:update
project:create
project:delete

// File Events
file:upload:progress
file:processed

// System Events
system:metrics
system:notification
```

## AI Integration

### Supported Providers
1. **OpenAI**
   - GPT-4, GPT-3.5 Turbo
   - DALL-E for image generation
   - Whisper for audio transcription

2. **Anthropic Claude**
   - Claude 3 Opus, Sonnet, Haiku
   - Advanced reasoning capabilities

3. **Google Gemini**
   - Gemini Pro, Gemini Pro Vision
   - Multimodal capabilities

4. **Ollama (Local)**
   - Llama 2, Mistral, CodeLlama
   - Private, offline processing

### Configuration
```typescript
// Environment variables
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key
GOOGLE_AI_API_KEY=your-google-key
OLLAMA_BASE_URL=http://localhost:11434
```

### Usage Examples
```typescript
// Generate text
const response = await apiClient.generateAIResponse(
  'Explain quantum computing',
  'gpt-4'
);

// Chat conversation
const response = await apiClient.chatWithAI([
  { role: 'user', content: 'Hello' },
  { role: 'assistant', content: 'Hi there!' },
  { role: 'user', content: 'How are you?' }
]);

// Process file
const result = await apiClient.processFile(file, {
  operation: 'analyze',
  context: { type: 'technical' }
});
```

## WebSocket Features

### Real-time Updates
- Live agent status
- Task progress
- File processing status
- System metrics

### Event Streaming
- AI response streaming
- File upload progress
- Agent execution logs

### Connection Management
- Automatic reconnection
- Connection status monitoring
- Event cleanup

## File Management

### Supported Formats
- **Documents**: PDF, DOCX, TXT, MD
- **Images**: JPG, PNG, GIF, WebP
- **Audio**: MP3, WAV, M4A
- **Video**: MP4, AVI, MOV
- **Code**: JS, TS, PY, HTML, CSS

### Processing Capabilities
- **Analysis**: Content analysis, sentiment analysis
- **Summarization**: Document summaries, key points
- **Extraction**: Data extraction, structured output
- **Transformation**: Format conversion, content rewriting

### Storage Options
- **Local**: Development/testing
- **S3**: Production with CDN
- **Cloud Storage**: Google Cloud, Azure

## Testing

### Test Structure
```
__tests__/
├── api-client.test.ts
├── websocket.test.ts
├── components/
├── services/
└── integration/
```

### Running Tests
```bash
# Backend tests
cd omni-node/backend
npm test

# Frontend tests
cd omni-node
npm test

# Integration tests
npm run test:integration

# Coverage
npm run test:coverage
```

### Test Coverage
- **Unit Tests**: 80%+ coverage
- **Integration Tests**: API endpoints, WebSocket events
- **E2E Tests**: User workflows, authentication flows

## Deployment

### Development Setup
```bash
# Clone repository
git clone https://github.com/Troyboy911/OmniNode.git
cd OmniNode

# Backend setup
cd omni-node/backend
npm install
cp .env.example .env
# Edit .env with your API keys
npm run dev

# Frontend setup
cd omni-node
npm install
cp .env.local.example .env.local
# Edit .env.local with your API URLs
npm run dev
```

### Production Deployment

#### VPS Deployment
```bash
# 1. Server setup
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs postgresql redis-server nginx

# 2. Database setup
sudo -u postgres psql
CREATE DATABASE omninode;
CREATE USER omninode WITH PASSWORD 'your-password';
GRANT ALL PRIVILEGES ON DATABASE omninode TO omninode;

# 3. Application setup
git clone https://github.com/Troyboy911/OmniNode.git
cd OmniNode

# Backend
cd omni-node/backend
npm install --production
npm run build
npm run migrate:prod

# Frontend
cd omni-node
npm install --production
npm run build
```

#### Docker Deployment
```bash
# Build and run
docker-compose up -d

# Or use provided scripts
chmod +x deploy-vps.sh
./deploy-vps.sh
```

### Environment Configuration
```bash
# Backend (.env)
DATABASE_URL=postgresql://user:password@localhost:5432/omninode
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key
GOOGLE_AI_API_KEY=your-google-key

# Frontend (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_WS_URL=http://localhost:3001
```

## Security

### Authentication & Authorization
- JWT tokens with refresh tokens
- Role-based access control (RBAC)
- Rate limiting per user/IP
- CORS configuration

### Data Security
- Input validation and sanitization
- SQL injection prevention (Prisma ORM)
- File upload validation
- XSS protection

### API Security
- Rate limiting: 100 requests per minute per user
- API key management
- Request/response logging
- Error handling without data exposure

### Infrastructure Security
- HTTPS enforcement
- Security headers (Helmet.js)
- Database connection encryption
- Redis authentication

## Performance

### Caching Strategy
- **Redis**: Session management, API responses
- **Browser**: Static assets, API responses
- **Database**: Query result caching

### Optimization Techniques
- **Database**: Indexing, query optimization
- **Frontend**: Code splitting, lazy loading
- **Backend**: Connection pooling, response compression
- **AI**: Request batching, response caching

### Monitoring

#### Application Metrics
- Request/response times
- Error rates
- User activity
- AI usage statistics

#### Infrastructure Metrics
- CPU, memory, disk usage
- Database performance
- Redis performance
- Network latency

#### Alerting
- Error rate thresholds
- Performance degradation
- Security incidents
- Resource exhaustion

### Performance Targets
- **API Response**: < 500ms average
- **Page Load**: < 2 seconds
- **WebSocket**: < 100ms latency
- **AI Response**: < 5 seconds average

## Development Workflow

### Branch Strategy
- `main`: Production-ready code
- `develop`: Integration branch
- `feature/*`: New features
- `hotfix/*`: Critical fixes

### Code Quality
- ESLint for linting
- Prettier for formatting
- TypeScript for type safety
- Husky for git hooks

### CI/CD Pipeline
```yaml
# GitHub Actions
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm test
      - run: npm run build
```

## Troubleshooting

### Common Issues

#### 1. Database Connection
```bash
# Check PostgreSQL
sudo systemctl status postgresql
sudo -u postgres psql -c "SELECT version();"

# Check connection
psql -h localhost -U omninode -d omninode
```

#### 2. Redis Connection
```bash
# Check Redis
sudo systemctl status redis
redis-cli ping
```

#### 3. WebSocket Issues
```bash
# Check ports
netstat -tulnp | grep :3001
lsof -i :3001

# Test WebSocket
curl -H "Connection: Upgrade" -H "Upgrade: websocket" \
  http://localhost:3001/socket.io/
```

#### 4. AI Provider Issues
```bash
# Test API keys
curl -H "Authorization: Bearer YOUR_KEY" \
  https://api.openai.com/v1/models
```

### Debug Mode
```bash
# Enable debug logging
DEBUG=omninode:* npm run dev
```

## Support & Contributing

### Getting Help
- **GitHub Issues**: Report bugs and feature requests
- **Documentation**: Comprehensive guides and API reference
- **Community**: Discord/Slack community

### Contributing
1. Fork the repository
2. Create a feature branch
3. Add tests for new features
4. Submit a pull request
5. Ensure CI passes

### Code Style
- Follow TypeScript best practices
- Use meaningful variable names
- Add JSDoc comments for public APIs
- Write comprehensive tests

---

This guide provides comprehensive documentation for the OmniNode platform. For additional support, please refer to the specific component documentation or contact the development team.