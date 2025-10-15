/**
 * Health Check Routes
 * Provides system health and status information
 */

import { Hono } from 'hono';
import type { Env } from '../index';

const health = new Hono<{ Bindings: Env }>();

// Basic health check
health.get('/', async (c) => {
  return c.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: c.env.ENVIRONMENT,
    version: '2.0.0'
  });
});

// Detailed health check
health.get('/detailed', async (c) => {
  const checks = {
    database: false,
    kv: false,
    r2: false,
    ai: {
      openai: false,
      anthropic: false,
      google: false
    }
  };

  try {
    // Check KV
    await c.env.CACHE.put('health-check', 'ok', { expirationTtl: 60 });
    const kvTest = await c.env.CACHE.get('health-check');
    checks.kv = kvTest === 'ok';
  } catch (error) {
    console.error('KV health check failed:', error);
  }

  try {
    // Check R2
    await c.env.FILES.head('health-check.txt');
    checks.r2 = true;
  } catch (error) {
    // File might not exist, but bucket is accessible
    if (error instanceof Error && error.message.includes('Not Found')) {
      checks.r2 = true;
    }
  }

  // Check AI providers (basic key validation)
  checks.ai.openai = !!c.env.OPENAI_API_KEY && c.env.OPENAI_API_KEY.startsWith('sk-');
  checks.ai.anthropic = !!c.env.ANTHROPIC_API_KEY && c.env.ANTHROPIC_API_KEY.startsWith('sk-ant-');
  checks.ai.google = !!c.env.GOOGLE_API_KEY && c.env.GOOGLE_API_KEY.length > 20;

  // Check database (will implement with Prisma)
  try {
    // TODO: Add actual database check when Prisma is set up
    checks.database = !!c.env.DATABASE_URL;
  } catch (error) {
    console.error('Database health check failed:', error);
  }

  const allHealthy = checks.kv && checks.r2 && checks.database;

  return c.json({
    success: true,
    status: allHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    checks
  }, allHealthy ? 200 : 503);
});

// Database health check
health.get('/db', async (c) => {
  try {
    // TODO: Add actual database query when Prisma is set up
    const hasConnection = !!c.env.DATABASE_URL;
    
    return c.json({
      success: true,
      status: hasConnection ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return c.json({
      success: false,
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, 500);
  }
});

// KV health check
health.get('/kv', async (c) => {
  try {
    await c.env.CACHE.put('health-check', 'ok', { expirationTtl: 60 });
    const result = await c.env.CACHE.get('health-check');
    
    return c.json({
      success: true,
      status: result === 'ok' ? 'operational' : 'degraded',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return c.json({
      success: false,
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, 500);
  }
});

// R2 health check
health.get('/r2', async (c) => {
  try {
    await c.env.FILES.head('health-check.txt');
    
    return c.json({
      success: true,
      status: 'operational',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    // File might not exist, but bucket is accessible
    if (error instanceof Error && error.message.includes('Not Found')) {
      return c.json({
        success: true,
        status: 'operational',
        timestamp: new Date().toISOString()
      });
    }
    
    return c.json({
      success: false,
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, 500);
  }
});

// AI providers health check
health.get('/ai', async (c) => {
  const providers = {
    openai: {
      configured: !!c.env.OPENAI_API_KEY && c.env.OPENAI_API_KEY.startsWith('sk-'),
      status: 'unknown'
    },
    anthropic: {
      configured: !!c.env.ANTHROPIC_API_KEY && c.env.ANTHROPIC_API_KEY.startsWith('sk-ant-'),
      status: 'unknown'
    },
    google: {
      configured: !!c.env.GOOGLE_API_KEY && c.env.GOOGLE_API_KEY.length > 20,
      status: 'unknown'
    }
  };

  // TODO: Add actual API health checks when AI services are implemented

  return c.json({
    success: true,
    providers,
    timestamp: new Date().toISOString()
  });
});

export default health;