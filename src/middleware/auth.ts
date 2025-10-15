/**
 * Authentication Middleware
 * Validates JWT tokens and attaches user info to context
 */

import { Context, Next } from 'hono';
import { verify } from 'jsonwebtoken';
import type { Env } from '../index';

export interface AuthUser {
  id: string;
  email: string;
  role: string;
}

export async function authMiddleware(c: Context<{ Bindings: Env }>, next: Next) {
  try {
    // Get token from Authorization header
    const authHeader = c.req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({
        success: false,
        error: 'Unauthorized',
        message: 'No token provided'
      }, 401);
    }

    const token = authHeader.substring(7);

    // Verify token
    const decoded = verify(token, c.env.JWT_SECRET) as AuthUser;

    // Check if token is blacklisted (in KV)
    const isBlacklisted = await c.env.SESSIONS.get(`blacklist:${token}`);
    if (isBlacklisted) {
      return c.json({
        success: false,
        error: 'Unauthorized',
        message: 'Token has been revoked'
      }, 401);
    }

    // Attach user to context
    c.set('user', decoded);

    await next();
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'TokenExpiredError') {
        return c.json({
          success: false,
          error: 'Unauthorized',
          message: 'Token has expired'
        }, 401);
      }
      if (error.name === 'JsonWebTokenError') {
        return c.json({
          success: false,
          error: 'Unauthorized',
          message: 'Invalid token'
        }, 401);
      }
    }

    return c.json({
      success: false,
      error: 'Unauthorized',
      message: 'Authentication failed'
    }, 401);
  }
}

// Optional auth middleware (doesn't fail if no token)
export async function optionalAuthMiddleware(c: Context<{ Bindings: Env }>, next: Next) {
  try {
    const authHeader = c.req.header('Authorization');
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = verify(token, c.env.JWT_SECRET) as AuthUser;
      
      const isBlacklisted = await c.env.SESSIONS.get(`blacklist:${token}`);
      if (!isBlacklisted) {
        c.set('user', decoded);
      }
    }
  } catch (error) {
    // Silently fail for optional auth
  }

  await next();
}