/**
 * OmniNode API - Cloudflare Worker
 * Main entry point for the API
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { secureHeaders } from 'hono/secure-headers';

// Route imports
import authRoutes from './routes/auth';
import projectRoutes from './routes/projects';
import agentRoutes from './routes/agents';
import taskRoutes from './routes/tasks';
import aiRoutes from './routes/ai';
import fileRoutes from './routes/files';
import healthRoutes from './routes/health';

// Middleware imports
import { authMiddleware } from './middleware/auth';
import { errorHandler } from './middleware/error';
import { rateLimiter } from './middleware/ratelimit';

// Types
export interface Env {
  // KV Namespaces
  SESSIONS: KVNamespace;
  CACHE: KVNamespace;
  
  // R2 Buckets
  FILES: R2Bucket;
  
  // Durable Objects
  WEBSOCKET: DurableObjectNamespace;
  
  // Environment Variables
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_REFRESH_SECRET: string;
  OPENAI_API_KEY: string;
  ANTHROPIC_API_KEY: string;
  GOOGLE_API_KEY: string;
  ENVIRONMENT: string;
  LOG_LEVEL: string;
  CORS_ORIGIN: string;
}

// Create Hono app
const app = new Hono<{ Bindings: Env }>();

// Global Middleware
app.use('*', logger());
app.use('*', prettyJSON());
app.use('*', secureHeaders());

// CORS Configuration
app.use('*', cors({
  origin: (origin, c) => {
    const allowedOrigins = [
      c.env.CORS_ORIGIN,
      'http://localhost:3000',
      'http://localhost:3001'
    ];
    return allowedOrigins.includes(origin) ? origin : c.env.CORS_ORIGIN;
  },
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['Content-Length', 'X-Request-Id'],
  maxAge: 600,
  credentials: true,
}));

// Rate Limiting
app.use('*', rateLimiter);

// Health Check Routes (no auth required)
app.route('/health', healthRoutes);
app.route('/api/health', healthRoutes);

// Public Routes (no auth required)
app.route('/api/auth', authRoutes);

// Protected Routes (auth required)
app.use('/api/*', authMiddleware);
app.route('/api/projects', projectRoutes);
app.route('/api/agents', agentRoutes);
app.route('/api/tasks', taskRoutes);
app.route('/api/ai', aiRoutes);
app.route('/api/files', fileRoutes);

// Root endpoint
app.get('/', (c) => {
  return c.json({
    name: 'OmniNode API',
    version: '2.0.0',
    environment: c.env.ENVIRONMENT,
    status: 'operational',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      projects: '/api/projects',
      agents: '/api/agents',
      tasks: '/api/tasks',
      ai: '/api/ai',
      files: '/api/files'
    }
  });
});

// 404 Handler
app.notFound((c) => {
  return c.json({
    success: false,
    error: 'Not Found',
    message: 'The requested endpoint does not exist',
    path: c.req.path
  }, 404);
});

// Error Handler
app.onError(errorHandler);

// Export for Cloudflare Workers
export default app;

// Export Durable Object for WebSocket support
export { WebSocketDurableObject } from './durable-objects/websocket';