# Omni Node Backend API

Complete backend API for the Omni Node AI Orchestration Platform.

## 🚀 Features

- **Authentication & Authorization**: JWT-based auth with refresh tokens
- **Agent Management**: CRUD operations for AI agents
- **Project Management**: Project lifecycle management
- **Task Management**: Task creation, assignment, and execution
- **Command Execution**: Natural language command processing
- **Real-time Updates**: WebSocket support for live updates
- **Database**: PostgreSQL with Prisma ORM
- **Security**: Helmet, CORS, rate limiting
- **Logging**: Winston logger with file rotation
- **Validation**: Zod schema validation
- **Error Handling**: Centralized error handling

## 📋 Prerequisites

- Node.js 18+ and npm
- PostgreSQL 15+
- Redis (optional, for queue management)

## 🛠️ Installation

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Set Up PostgreSQL

**Option A: Using Docker (Recommended)**

```bash
docker run --name omninode-postgres \
  -e POSTGRES_PASSWORD=omninode123 \
  -e POSTGRES_DB=omninode \
  -p 5432:5432 \
  -d postgres:15
```

**Option B: Local PostgreSQL**

Create a database named `omninode` and update the `DATABASE_URL` in `.env`

### 3. Configure Environment Variables

Copy `.env.example` to `.env` and update the values:

```bash
cp .env.example .env
```

Update the following variables:
- `DATABASE_URL`: Your PostgreSQL connection string
- `JWT_SECRET`: Strong secret for JWT tokens
- `JWT_REFRESH_SECRET`: Strong secret for refresh tokens
- `OPENAI_API_KEY`: (Optional) Your OpenAI API key
- `ANTHROPIC_API_KEY`: (Optional) Your Anthropic API key

### 4. Generate Prisma Client

```bash
npx prisma generate
```

### 5. Run Database Migrations

```bash
npx prisma migrate dev --name init
```

### 6. (Optional) Seed Database

```bash
npx prisma db seed
```

## 🏃 Running the Server

### Development Mode

```bash
npm run dev
```

The server will start on `http://localhost:4000`

### Production Mode

```bash
npm run build
npm start
```

## 📚 API Documentation

### Base URL

```
http://localhost:4000/api/v1
```

### Authentication Endpoints

#### Register User
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "username": "username",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe"
}
```

#### Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

#### Get Current User
```http
GET /api/v1/auth/me
Authorization: Bearer <access_token>
```

### Agent Endpoints

#### Get All Agents
```http
GET /api/v1/agents?page=1&limit=10
Authorization: Bearer <access_token>
```

#### Get Single Agent
```http
GET /api/v1/agents/:id
Authorization: Bearer <access_token>
```

#### Create Agent
```http
POST /api/v1/agents
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "Project Manager",
  "role": "PROJECT_MANAGER",
  "description": "Manages project lifecycle",
  "capabilities": ["planning", "coordination"],
  "config": {
    "model": "gpt-4",
    "temperature": 0.7
  }
}
```

#### Update Agent
```http
PATCH /api/v1/agents/:id
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "status": "ACTIVE",
  "performance": 95.5
}
```

#### Delete Agent
```http
DELETE /api/v1/agents/:id
Authorization: Bearer <access_token>
```

### Project Endpoints

#### Get All Projects
```http
GET /api/v1/projects?page=1&limit=10&status=IN_PROGRESS
Authorization: Bearer <access_token>
```

#### Create Project
```http
POST /api/v1/projects
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "AI Integration Project",
  "description": "Integrate AI capabilities",
  "priority": "HIGH",
  "budget": 50000,
  "startDate": "2024-01-01T00:00:00Z",
  "endDate": "2024-06-30T00:00:00Z"
}
```

### Task Endpoints

#### Get All Tasks
```http
GET /api/v1/tasks?page=1&limit=10&projectId=<project_id>
Authorization: Bearer <access_token>
```

#### Create Task
```http
POST /api/v1/tasks
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "title": "Implement authentication",
  "description": "Add JWT authentication",
  "projectId": "<project_id>",
  "agentId": "<agent_id>",
  "priority": "HIGH",
  "estimatedTime": 480
}
```

#### Start Task
```http
POST /api/v1/tasks/:id/start
Authorization: Bearer <access_token>
```

#### Complete Task
```http
POST /api/v1/tasks/:id/complete
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "result": {
    "output": "Authentication implemented successfully"
  }
}
```

### Command Endpoints

#### Execute Command
```http
POST /api/v1/commands
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "text": "Create a new React component for user profile",
  "metadata": {
    "context": "frontend development"
  }
}
```

#### Get Command History
```http
GET /api/v1/commands?page=1&limit=20
Authorization: Bearer <access_token>
```

## 🗄️ Database Schema

The database includes the following main models:

- **User**: User accounts and authentication
- **Agent**: AI agents with capabilities and configuration
- **Project**: Projects with tasks and milestones
- **Task**: Individual tasks assigned to agents
- **Command**: Natural language commands
- **Metric**: Performance metrics
- **Knowledge**: Knowledge base entries
- **Transaction**: Blockchain transactions
- **AuditLog**: System audit logs

## 🔒 Security Features

- JWT authentication with refresh tokens
- Password hashing with bcrypt
- Helmet for HTTP headers security
- CORS configuration
- Rate limiting
- Input validation with Zod
- SQL injection protection (Prisma)

## 📊 Monitoring & Logging

- Winston logger with file rotation
- Request/response logging
- Error tracking
- Performance metrics

## 🧪 Testing

```bash
npm test
```

## 📦 Database Management

### View Database
```bash
npx prisma studio
```

### Create Migration
```bash
npx prisma migrate dev --name <migration_name>
```

### Reset Database
```bash
npx prisma migrate reset
```

## 🚢 Deployment

### Using Docker

```bash
docker build -t omninode-backend .
docker run -p 4000:4000 --env-file .env omninode-backend
```

### Environment Variables for Production

Ensure these are set in production:
- `NODE_ENV=production`
- `DATABASE_URL`: Production database URL
- `JWT_SECRET`: Strong production secret
- `CORS_ORIGIN`: Your frontend URL

## 📝 API Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "errors": [ ... ]
}
```

### Paginated Response
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

MIT License - see LICENSE file for details