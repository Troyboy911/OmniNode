import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { config } from '@/config/env';
import { logger } from '@/config/logger';
import routes from '@/routes';
import { errorHandler, notFoundHandler } from '@/middleware/errorHandler';

// Create Express app
const app: Application = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: config.cors.origin,
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Request logging middleware
app.use((req, _res, next) => {
  logger.http(`${req.method} ${req.url}`);
  next();
});

// API routes
app.use(`/api/${config.server.apiVersion}`, routes);

// Root route
app.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'Welcome to Omni Node API',
    version: config.server.apiVersion,
    documentation: `/api/${config.server.apiVersion}/docs`,
  });
});

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

export default app;