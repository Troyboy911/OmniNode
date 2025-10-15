/**
 * Authentication Routes
 * Handles user registration, login, token refresh, and logout
 */

import { Hono } from 'hono';
import { sign, verify } from 'jsonwebtoken';
import { hash, compare } from 'bcryptjs';
import { z } from 'zod';
import type { Env } from '../index';
import { APIError } from '../middleware/error';
import { getPrismaClient } from '../lib/prisma';

const auth = new Hono<{ Bindings: Env }>();

// Validation schemas
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

const refreshSchema = z.object({
  refreshToken: z.string()
});

// Helper function to generate tokens
function generateTokens(userId: string, email: string, role: string, env: Env) {
  const accessToken = sign(
    { id: userId, email, role },
    env.JWT_SECRET,
    { expiresIn: '15m' }
  );

  const refreshToken = sign(
    { id: userId, email, role },
    env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
}

// Register new user
auth.post('/register', async (c) => {
  try {
    const body = await c.req.json();
    const data = registerSchema.parse(body);

    const prisma = getPrismaClient(c.env.DATABASE_URL);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    });

    if (existingUser) {
      throw new APIError(400, 'User already exists', 'USER_EXISTS');
    }

    // Hash password
    const hashedPassword = await hash(data.password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
        role: 'USER'
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      }
    });

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(
      user.id,
      user.email,
      user.role,
      c.env
    );

    // Store refresh token in KV
    await c.env.SESSIONS.put(
      `refresh:${user.id}`,
      refreshToken,
      { expirationTtl: 7 * 24 * 60 * 60 } // 7 days
    );

    return c.json({
      success: true,
      data: {
        user,
        accessToken,
        refreshToken
      }
    }, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new APIError(400, 'Invalid input data', 'VALIDATION_ERROR');
    }
    throw error;
  }
});

// Login user
auth.post('/login', async (c) => {
  try {
    const body = await c.req.json();
    const data = loginSchema.parse(body);

    const prisma = getPrismaClient(c.env.DATABASE_URL);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: data.email }
    });

    if (!user) {
      throw new APIError(401, 'Invalid credentials', 'INVALID_CREDENTIALS');
    }

    // Verify password
    const isValidPassword = await compare(data.password, user.password);

    if (!isValidPassword) {
      throw new APIError(401, 'Invalid credentials', 'INVALID_CREDENTIALS');
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(
      user.id,
      user.email,
      user.role,
      c.env
    );

    // Store refresh token in KV
    await c.env.SESSIONS.put(
      `refresh:${user.id}`,
      refreshToken,
      { expirationTtl: 7 * 24 * 60 * 60 } // 7 days
    );

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });

    return c.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          createdAt: user.createdAt
        },
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new APIError(400, 'Invalid input data', 'VALIDATION_ERROR');
    }
    throw error;
  }
});

// Refresh access token
auth.post('/refresh', async (c) => {
  try {
    const body = await c.req.json();
    const data = refreshSchema.parse(body);

    // Verify refresh token
    const decoded = verify(data.refreshToken, c.env.JWT_REFRESH_SECRET) as {
      id: string;
      email: string;
      role: string;
    };

    // Check if refresh token is stored in KV
    const storedToken = await c.env.SESSIONS.get(`refresh:${decoded.id}`);

    if (!storedToken || storedToken !== data.refreshToken) {
      throw new APIError(401, 'Invalid refresh token', 'INVALID_TOKEN');
    }

    // Generate new tokens
    const { accessToken, refreshToken } = generateTokens(
      decoded.id,
      decoded.email,
      decoded.role,
      c.env
    );

    // Update refresh token in KV
    await c.env.SESSIONS.put(
      `refresh:${decoded.id}`,
      refreshToken,
      { expirationTtl: 7 * 24 * 60 * 60 } // 7 days
    );

    return c.json({
      success: true,
      data: {
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new APIError(400, 'Invalid input data', 'VALIDATION_ERROR');
    }
    if (error instanceof Error && error.name === 'JsonWebTokenError') {
      throw new APIError(401, 'Invalid refresh token', 'INVALID_TOKEN');
    }
    throw error;
  }
});

// Logout user
auth.post('/logout', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new APIError(401, 'No token provided', 'NO_TOKEN');
    }

    const token = authHeader.substring(7);
    const decoded = verify(token, c.env.JWT_SECRET) as { id: string };

    // Blacklist the access token
    await c.env.SESSIONS.put(
      `blacklist:${token}`,
      'true',
      { expirationTtl: 15 * 60 } // 15 minutes (access token expiry)
    );

    // Remove refresh token
    await c.env.SESSIONS.delete(`refresh:${decoded.id}`);

    return c.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'JsonWebTokenError') {
      throw new APIError(401, 'Invalid token', 'INVALID_TOKEN');
    }
    throw error;
  }
});

// Get current user
auth.get('/me', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new APIError(401, 'No token provided', 'NO_TOKEN');
    }

    const token = authHeader.substring(7);
    const decoded = verify(token, c.env.JWT_SECRET) as { id: string };

    const prisma = getPrismaClient(c.env.DATABASE_URL);

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        lastLogin: true
      }
    });

    if (!user) {
      throw new APIError(404, 'User not found', 'USER_NOT_FOUND');
    }

    return c.json({
      success: true,
      data: user
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'JsonWebTokenError') {
      throw new APIError(401, 'Invalid token', 'INVALID_TOKEN');
    }
    throw error;
  }
});

export default auth;