const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors());
app.use(compression());

// Request logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Health check endpoints
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Omni Node API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Omni Node API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

app.get('/health/db', (req, res) => {
  res.json({
    success: true,
    status: 'connected',
    latency: 1
  });
});

app.get('/api/health/db', (req, res) => {
  res.json({
    success: true,
    status: 'connected',
    latency: 1
  });
});

app.get('/health/redis', (req, res) => {
  res.json({
    success: true,
    status: 'connected',
    latency: 1
  });
});

app.get('/api/health/redis', (req, res) => {
  res.json({
    success: true,
    status: 'connected',
    latency: 1
  });
});

app.get('/health/ai', (req, res) => {
  res.json({
    success: true,
    providers: {
      openai: { status: 'operational' },
      anthropic: { status: 'operational' },
      ollama: { status: 'operational' }
    }
  });
});

app.get('/api/health/ai', (req, res) => {
  res.json({
    success: true,
    providers: {
      openai: { status: 'operational' },
      anthropic: { status: 'operational' },
      ollama: { status: 'operational' }
    }
  });
});

// Mock API endpoints for testing
app.post('/api/auth/register', (req, res) => {
  res.json({
    success: true,
    token: 'mock-jwt-token',
    user: { id: 'user123', email: 'test@example.com' }
  });
});

app.post('/api/auth/login', (req, res) => {
  res.json({
    success: true,
    token: 'mock-jwt-token',
    user: { id: 'user123', email: 'test@example.com' }
  });
});

app.get('/api/projects', (req, res) => {
  res.json({
    success: true,
    projects: [{
      id: 'project123',
      name: 'Test Project',
      description: 'Test project for CI'
    }]
  });
});

app.post('/api/projects', (req, res) => {
  res.json({
    success: true,
    project: {
      id: 'project123',
      name: 'Test Project',
      description: 'Test project for CI'
    }
  });
});

app.get('/api/agents', (req, res) => {
  res.json({
    success: true,
    agents: [{
      id: 'agent123',
      name: 'Test Agent',
      status: 'active'
    }]
  });
});

app.post('/api/agents', (req, res) => {
  res.json({
    success: true,
    agent: {
      id: 'agent123',
      name: 'Test Agent',
      status: 'active'
    }
  });
});

app.post('/api/ai/generate', (req, res) => {
  res.json({
    success: true,
    response: 'Mock AI response for testing',
    tokens: 100,
    model: 'gpt-3.5-turbo'
  });
});

app.post('/api/ai/chat', (req, res) => {
  res.json({
    success: true,
    response: 'Mock AI chat response for testing',
    tokens: 150,
    model: 'gpt-3.5-turbo'
  });
});

app.post('/api/files/upload', (req, res) => {
  res.json({
    success: true,
    file: {
      id: 'file123',
      originalName: 'test.txt',
      mimeType: 'text/plain'
    }
  });
});

// Fallback for all other routes
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Minimal Omni Node API running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});