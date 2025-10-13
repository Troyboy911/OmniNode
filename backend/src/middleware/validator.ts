import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';
import { ValidationError } from '@/types';

export const validate = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        next(new ValidationError('Validation failed', errors));
      } else {
        next(error);
      }
    }
  };
};

// Common validation schemas
export const schemas = {
  // Pagination
  pagination: z.object({
    query: z.object({
      page: z.string().optional().default('1'),
      limit: z.string().optional().default('10'),
    }),
  }),

  // ID parameter
  idParam: z.object({
    params: z.object({
      id: z.string().uuid('Invalid ID format'),
    }),
  }),

  // User registration
  register: z.object({
    body: z.object({
      email: z.string().email('Invalid email address'),
      username: z.string().min(3, 'Username must be at least 3 characters'),
      password: z.string().min(8, 'Password must be at least 8 characters'),
      firstName: z.string().optional(),
      lastName: z.string().optional(),
    }),
  }),

  // User login
  login: z.object({
    body: z.object({
      email: z.string().email('Invalid email address'),
      password: z.string().min(1, 'Password is required'),
    }),
  }),

  // Create agent
  createAgent: z.object({
    body: z.object({
      name: z.string().min(1, 'Name is required'),
      role: z.string().min(1, 'Role is required'),
      description: z.string().optional(),
      capabilities: z.array(z.string()).optional(),
      config: z.record(z.any()).optional(),
    }),
  }),

  // Update agent
  updateAgent: z.object({
    params: z.object({
      id: z.string().uuid('Invalid agent ID'),
    }),
    body: z.object({
      name: z.string().optional(),
      role: z.string().optional(),
      description: z.string().optional(),
      status: z.enum(['IDLE', 'ACTIVE', 'BUSY', 'ERROR', 'OFFLINE']).optional(),
      capabilities: z.array(z.string()).optional(),
      config: z.record(z.any()).optional(),
      isActive: z.boolean().optional(),
    }),
  }),

  // Create project
  createProject: z.object({
    body: z.object({
      name: z.string().min(1, 'Name is required'),
      description: z.string().optional(),
      priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
      budget: z.number().positive().optional(),
      startDate: z.string().datetime().optional(),
      endDate: z.string().datetime().optional(),
    }),
  }),

  // Update project
  updateProject: z.object({
    params: z.object({
      id: z.string().uuid('Invalid project ID'),
    }),
    body: z.object({
      name: z.string().optional(),
      description: z.string().optional(),
      status: z.enum(['PLANNING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED']).optional(),
      priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
      progress: z.number().min(0).max(100).optional(),
      budget: z.number().positive().optional(),
      spent: z.number().min(0).optional(),
      startDate: z.string().datetime().optional(),
      endDate: z.string().datetime().optional(),
    }),
  }),

  // Create task
  createTask: z.object({
    body: z.object({
      title: z.string().min(1, 'Title is required'),
      description: z.string().optional(),
      projectId: z.string().uuid('Invalid project ID'),
      agentId: z.string().uuid('Invalid agent ID').optional(),
      priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
      estimatedTime: z.number().positive().optional(),
      dependencies: z.array(z.string().uuid()).optional(),
    }),
  }),

  // Execute command
  executeCommand: z.object({
    body: z.object({
      text: z.string().min(1, 'Command text is required'),
      metadata: z.record(z.any()).optional(),
    }),
  }),
};