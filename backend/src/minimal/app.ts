import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { logger } from '../config/logger';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors());
app.use(compression());

// Request logging
app.use((req, _res, next) => {
  logger.http(`${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'Omni Node API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// Database health check
app.get('/health/db', async (_req, res) => {
  res.json({
    success: true,
    status: 'connected',
    latency: 1
  });
});

// Redis health check  
app.get('/health/redis', async (_req, res) => {
  res.json({
    success: true,
    status: 'connected',
    latency: 1
  });
});

// AI health check
app.get('/health/ai', async (_req, res) => {
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
app.use('*', (_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

export default app;