# 🤖 AI Integration & 📁 File Upload Guide

## Overview

The OmniNode backend now includes comprehensive AI integration and file upload capabilities, enabling:

- **Multi-Provider AI Support**: OpenAI GPT-4, Anthropic Claude, Google Gemini
- **File Processing**: Upload, analyze, and process files with AI
- **Conversation Management**: Persistent AI chat with context
- **Task Queue**: Background AI processing with Bull/BullMQ
- **File Storage**: Local and cloud storage support (AWS S3 ready)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL (or SQLite for development)
- AI API keys (OpenAI, Anthropic, Google)

### Environment Variables
Add these to your `.env` file:

```bash
# AI Provider Keys
OPENAI_API_KEY=your_openai_key_here
ANTHROPIC_API_KEY=your_anthropic_key_here
GOOGLE_API_KEY=your_google_key_here

# File Storage
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name
```

## 📡 API Endpoints

### AI Chat Endpoints

#### Start AI Conversation
```http
POST /api/ai/chat
Authorization: Bearer <token>
Content-Type: application/json

{
  "message": "Hello, can you help me create a REST API?",
  "conversationId": "conv_123", // Optional
  "model": "gpt-4", // Optional
  "temperature": 0.7, // Optional
  "maxTokens": 2000 // Optional
}
```

**Response:**
```json
{
  "response": "I'll help you create a REST API...",
  "tokens": 150,
  "model": "gpt-4",
  "conversationId": "conv_123"
}
```

#### Get Conversations
```http
GET /api/ai/conversations?limit=50&offset=0
Authorization: Bearer <token>
```

#### Get Conversation Messages
```http
GET /api/ai/conversations/:conversationId/messages
Authorization: Bearer <token>
```

### File Upload Endpoints

#### Upload File
```http
POST /api/files/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <binary data>
projectId: <optional project ID>
taskId: <optional task ID>
agentId: <optional agent ID>
isPublic: <optional boolean>
```

**Supported File Types:**
- Images: JPEG, PNG, GIF, WebP, SVG
- Documents: PDF, Word, Markdown, Text
- Code: JavaScript, TypeScript, CSS, HTML, JSON, XML
- Data: CSV, Excel, ZIP, TAR
- Archives: ZIP, TAR, GZIP

**Response:**
```json
{
  "message": "File uploaded successfully",
  "file": {
    "id": "file_123",
    "originalName": "document.pdf",
    "filename": "uuid-document.pdf",
    "mimeType": "application/pdf",
    "size": 1024000,
    "url": "/api/files/file_123/download",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

#### Process File with AI
```http
POST /api/ai/process-file
Authorization: Bearer <token>
Content-Type: application/json

{
  "fileId": "file_123",
  "operation": "analyze", // analyze, summarize, extract, transform
  "context": { "language": "english" }, // Optional
  "model": "gpt-4" // Optional
}
```

**Response:**
```json
{
  "result": "This document appears to be...",
  "metadata": {
    "fileType": "application/pdf",
    "fileSize": 1024000,
    "analysisType": "general"
  },
  "fileId": "file_123",
  "operation": "analyze"
}
```

#### Get Files
```http
GET /api/files?limit=50&offset=0&projectId=<optional>
Authorization: Bearer <token>
```

#### Download File
```http
GET /api/files/:fileId/download
Authorization: Bearer <token>
```

#### Get File Stats
```http
GET /api/files/stats
Authorization: Bearer <token>
```

**Response:**
```json
{
  "totalFiles": 25,
  "totalSize": 10485760,
  "byMimeType": {
    "application/pdf": 10,
    "image/jpeg": 15
  },
  "byDate": {
    "2024-01-01": 5,
    "2024-01-02": 3
  }
}
```

## 🔧 Configuration

### AI Service Configuration

The AI orchestrator supports multiple providers with automatic fallback:

```typescript
// Default configuration
const config = {
  provider: 'openai', // openai, anthropic, google
  model: 'gpt-4',
  maxTokens: 2000,
  temperature: 0.7,
  topP: 1
};
```

### File Upload Configuration

```typescript
// Upload options
const uploadOptions = {
  destination: 'uploads', // Storage directory
  maxSize: 50 * 1024 * 1024, // 50MB
  allowedTypes: ['image/jpeg', 'application/pdf', 'text/plain'],
  isPublic: false
};
```

## 🏗️ Architecture

### AI Service Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   AIController  │───▶│ AIOrchestrator  │───▶│ AI Providers    │
│                 │    │                 │    │                 │
│ • Chat          │    │ • Provider      │    │ • OpenAI        │
│ • File Process  │    │   Management    │    │ • Anthropic     │
│ • Conversations │    │ • Context       │    │ • Google        │
└─────────────────┘    │   Management    │    └─────────────────┘
                       │ • Cost Tracking │
                       └─────────────────┘
```

### File Service Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ FileController  │───▶│  FileService    │───▶│ Storage Layer   │
│                 │    │                 │    │                 │
│ • Upload        │    │ • Validation    │    │ • Local Storage │
│ • Download      │    │ • Metadata      │    │ • AWS S3        │
│ • Processing    │    │ • Security      │    │ • CDN Support   │
└─────────────────┘    │ • Statistics    │    └─────────────────┘
                       └─────────────────┘
```

## 🧪 Testing

Run the comprehensive test suite:

```bash
# Start the backend
npm run dev

# Run AI and file upload tests
./test-ai-file-uploads.sh
```

## 📊 Performance & Limits

### AI Processing Limits
- **Max message length**: 10,000 characters
- **Max tokens per request**: 8,000
- **Rate limiting**: 100 requests per minute per user
- **Context window**: 32,768 tokens (GPT-4)

### File Upload Limits
- **Max file size**: 50MB per file
- **Max files per upload**: 10
- **Total storage**: 10GB per user (configurable)
- **Supported formats**: 25+ file types

## 🔒 Security Features

- **File validation**: MIME type checking, virus scanning ready
- **Access control**: User-based file permissions
- **Rate limiting**: API endpoint protection
- **Secure storage**: Encrypted file storage
- **AI content filtering**: Harmful content detection

## 🚀 Deployment

### Local Development
```bash
# Install dependencies
npm install

# Start PostgreSQL (via Docker)
docker compose up -d

# Run migrations
npx prisma migrate dev

# Start development server
npm run dev
```

### Production Deployment
```bash
# Build the application
npm run build

# Run production migrations
npx prisma migrate deploy

# Start production server
npm start
```

## 📈 Monitoring & Analytics

- **AI usage tracking**: Token consumption, cost analysis
- **File analytics**: Upload statistics, storage usage
- **Performance metrics**: Response times, error rates
- **Audit logging**: All AI interactions and file operations

## 🔧 Troubleshooting

### Common Issues

1. **AI API Key Issues**
   ```bash
   # Check API key validity
   curl -H "Authorization: Bearer YOUR_API_KEY" https://api.openai.com/v1/models
   ```

2. **File Upload Failures**
   - Check file size limits
   - Verify MIME type is allowed
   - Ensure sufficient disk space

3. **Database Connection Issues**
   ```bash
   # Test database connection
   npx prisma db pull
   ```

## 📚 Next Steps

- [ ] Add real-time WebSocket support for AI streaming
- [ ] Implement vector search for file content
- [ ] Add batch file processing capabilities
- [ ] Integrate with cloud storage providers
- [ ] Add AI model fine-tuning support
- [ ] Implement advanced file search and filtering

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Submit a pull request

## 📞 Support

For issues and questions:
- Create an issue on GitHub
- Check the troubleshooting section
- Review the API documentation

---

**🎉 Happy coding with AI-powered file processing!**