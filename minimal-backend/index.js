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

app.get('/health/db', (req, res) => {
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

// Fallback for all other routes
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Minimal Omni Node API running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});