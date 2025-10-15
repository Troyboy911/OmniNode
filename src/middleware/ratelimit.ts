/**
 * Rate Limiting Middleware
 * Uses Cloudflare KV for distributed rate limiting
 */

import { Context, Next } from 'hono';
import type { Env } from '../index';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  '/api/auth/login': { windowMs: 60000, maxRequests: 5 },
  '/api/auth/register': { windowMs: 60000, maxRequests: 3 },
  '/api/ai': { windowMs: 60000, maxRequests: 20 },
  default: { windowMs: 60000, maxRequests: 100 }
};

export async function rateLimiter(c: Context<{ Bindings: Env }>, next: Next) {
  const path = c.req.path;
  const ip = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown';
  
  // Get rate limit config for this path
  let config = RATE_LIMITS.default;
  for (const [pattern, limit] of Object.entries(RATE_LIMITS)) {
    if (path.startsWith(pattern)) {
      config = limit;
      break;
    }
  }

  const key = `ratelimit:${ip}:${path}`;
  const now = Date.now();
  const windowStart = now - config.windowMs;

  try {
    // Get current request count from KV
    const data = await c.env.CACHE.get(key, 'json') as { count: number; timestamp: number } | null;

    if (data) {
      // Check if window has expired
      if (data.timestamp < windowStart) {
        // Reset counter
        await c.env.CACHE.put(key, JSON.stringify({ count: 1, timestamp: now }), {
          expirationTtl: Math.ceil(config.windowMs / 1000)
        });
      } else if (data.count >= config.maxRequests) {
        // Rate limit exceeded
        const resetTime = data.timestamp + config.windowMs;
        const retryAfter = Math.ceil((resetTime - now) / 1000);

        return c.json({
          success: false,
          error: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests',
          retryAfter
        }, 429, {
          'Retry-After': retryAfter.toString(),
          'X-RateLimit-Limit': config.maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': resetTime.toString()
        });
      } else {
        // Increment counter
        await c.env.CACHE.put(key, JSON.stringify({ count: data.count + 1, timestamp: data.timestamp }), {
          expirationTtl: Math.ceil(config.windowMs / 1000)
        });
      }
    } else {
      // First request in window
      await c.env.CACHE.put(key, JSON.stringify({ count: 1, timestamp: now }), {
        expirationTtl: Math.ceil(config.windowMs / 1000)
      });
    }

    // Add rate limit headers
    const remaining = data ? Math.max(0, config.maxRequests - data.count - 1) : config.maxRequests - 1;
    c.header('X-RateLimit-Limit', config.maxRequests.toString());
    c.header('X-RateLimit-Remaining', remaining.toString());
    c.header('X-RateLimit-Reset', (now + config.windowMs).toString());

    await next();
  } catch (error) {
    console.error('Rate limit error:', error);
    // On error, allow the request through
    await next();
  }
}