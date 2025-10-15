/**
 * Task Management Routes
 * CRUD operations for tasks
 */

import { Hono } from 'hono';
import { z } from 'zod';
import type { Env } from '../index';
import { APIError } from '../middleware/error';
import { getPrismaClient } from '../lib/prisma';
import type { AuthUser } from '../middleware/auth';

const tasks = new Hono<{ Bindings: Env }>();

// Validation schemas
const createTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  projectId: z.string().uuid(),
  agentId: z.string().uuid().optional()
});

const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'CANCELLED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  result: z.any().optional(),
  agentId: z.string().uuid().optional()
});

// Get all tasks
tasks.get('/', async (c) => {
  const user = c.get('user') as AuthUser;
  const projectId = c.req.query('projectId');
  const agentId = c.req.query('agentId');
  const status = c.req.query('status');
  const prisma = getPrismaClient(c.env.DATABASE_URL);

  const where: any = {
    project: { userId: user.id }
  };

  if (projectId) {
    where.projectId = projectId;
  }

  if (agentId) {
    where.agentId = agentId;
  }

  if (status) {
    where.status = status;
  }

  const userTasks = await prisma.task.findMany({
    where,
    include: {
      project: {
        select: {
          id: true,
          name: true
        }
      },
      agent: {
        select: {
          id: true,
          name: true,
          type: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return c.json({
    success: true,
    data: userTasks
  });
});

// Get single task
tasks.get('/:id', async (c) => {
  const user = c.get('user') as AuthUser;
  const taskId = c.req.param('id');
  const prisma = getPrismaClient(c.env.DATABASE_URL);

  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      project: { userId: user.id }
    },
    include: {
      project: true,
      agent: true
    }
  });

  if (!task) {
    throw new APIError(404, 'Task not found', 'TASK_NOT_FOUND');
  }

  return c.json({
    success: true,
    data: task
  });
});

// Create new task
tasks.post('/', async (c) => {
  try {
    const user = c.get('user') as AuthUser;
    const body = await c.req.json();
    const data = createTaskSchema.parse(body);

    const prisma = getPrismaClient(c.env.DATABASE_URL);

    // Verify project belongs to user
    const project = await prisma.project.findFirst({
      where: {
        id: data.projectId,
        userId: user.id
      }
    });

    if (!project) {
      throw new APIError(404, 'Project not found', 'PROJECT_NOT_FOUND');
    }

    // Verify agent belongs to user (if provided)
    if (data.agentId) {
      const agent = await prisma.agent.findFirst({
        where: {
          id: data.agentId,
          project: { userId: user.id }
        }
      });

      if (!agent) {
        throw new APIError(404, 'Agent not found', 'AGENT_NOT_FOUND');
      }
    }

    const task = await prisma.task.create({
      data: {
        title: data.title,
        description: data.description,
        priority: data.priority || 'MEDIUM',
        status: 'PENDING',
        projectId: data.projectId,
        agentId: data.agentId
      },
      include: {
        project: {
          select: {
            id: true,
            name: true
          }
        },
        agent: {
          select: {
            id: true,
            name: true,
            type: true
          }
        }
      }
    });

    return c.json({
      success: true,
      data: task
    }, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new APIError(400, 'Invalid input data', 'VALIDATION_ERROR');
    }
    throw error;
  }
});

// Update task
tasks.put('/:id', async (c) => {
  try {
    const user = c.get('user') as AuthUser;
    const taskId = c.req.param('id');
    const body = await c.req.json();
    const data = updateTaskSchema.parse(body);

    const prisma = getPrismaClient(c.env.DATABASE_URL);

    // Check if task exists and belongs to user
    const existingTask = await prisma.task.findFirst({
      where: {
        id: taskId,
        project: { userId: user.id }
      }
    });

    if (!existingTask) {
      throw new APIError(404, 'Task not found', 'TASK_NOT_FOUND');
    }

    // Verify agent belongs to user (if provided)
    if (data.agentId) {
      const agent = await prisma.agent.findFirst({
        where: {
          id: data.agentId,
          project: { userId: user.id }
        }
      });

      if (!agent) {
        throw new APIError(404, 'Agent not found', 'AGENT_NOT_FOUND');
      }
    }

    const task = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...data,
        updatedAt: new Date()
      },
      include: {
        project: {
          select: {
            id: true,
            name: true
          }
        },
        agent: {
          select: {
            id: true,
            name: true,
            type: true
          }
        }
      }
    });

    return c.json({
      success: true,
      data: task
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new APIError(400, 'Invalid input data', 'VALIDATION_ERROR');
    }
    throw error;
  }
});

// Delete task
tasks.delete('/:id', async (c) => {
  const user = c.get('user') as AuthUser;
  const taskId = c.req.param('id');
  const prisma = getPrismaClient(c.env.DATABASE_URL);

  // Check if task exists and belongs to user
  const existingTask = await prisma.task.findFirst({
    where: {
      id: taskId,
      project: { userId: user.id }
    }
  });

  if (!existingTask) {
    throw new APIError(404, 'Task not found', 'TASK_NOT_FOUND');
  }

  await prisma.task.delete({
    where: { id: taskId }
  });

  return c.json({
    success: true,
    message: 'Task deleted successfully'
  });
});

export default tasks;