/**
 * Error Handler Middleware
 * Centralized error handling for the API
 */

import { Context } from 'hono';
import type { Env } from '../index';

export class APIError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export async function errorHandler(err: Error, c: Context<{ Bindings: Env }>) {
  console.error('Error:', err);

  // Handle known API errors
  if (err instanceof APIError) {
    return c.json({
      success: false,
      error: err.code || 'API_ERROR',
      message: err.message
    }, err.statusCode);
  }

  // Handle validation errors
  if (err.name === 'ZodError') {
    return c.json({
      success: false,
      error: 'VALIDATION_ERROR',
      message: 'Invalid request data',
      details: err
    }, 400);
  }

  // Handle database errors
  if (err.message.includes('Prisma') || err.message.includes('database')) {
    return c.json({
      success: false,
      error: 'DATABASE_ERROR',
      message: 'Database operation failed'
    }, 500);
  }

  // Generic error
  return c.json({
    success: false,
    error: 'INTERNAL_ERROR',
    message: c.env.ENVIRONMENT === 'production' 
      ? 'An unexpected error occurred' 
      : err.message
  }, 500);
}