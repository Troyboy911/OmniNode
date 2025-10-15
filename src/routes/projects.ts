/**
 * Project Management Routes
 * CRUD operations for projects
 */

import { Hono } from 'hono';
import { z } from 'zod';
import type { Env } from '../index';
import { APIError } from '../middleware/error';
import { getPrismaClient } from '../lib/prisma';
import type { AuthUser } from '../middleware/auth';

const projects = new Hono<{ Bindings: Env }>();

// Validation schemas
const createProjectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  status: z.enum(['ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED']).optional()
});

const updateProjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  status: z.enum(['ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED']).optional()
});

// Get all projects for current user
projects.get('/', async (c) => {
  const user = c.get('user') as AuthUser;
  const prisma = getPrismaClient(c.env.DATABASE_URL);

  const userProjects = await prisma.project.findMany({
    where: { userId: user.id },
    include: {
      _count: {
        select: {
          agents: true,
          tasks: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return c.json({
    success: true,
    data: userProjects
  });
});

// Get single project
projects.get('/:id', async (c) => {
  const user = c.get('user') as AuthUser;
  const projectId = c.req.param('id');
  const prisma = getPrismaClient(c.env.DATABASE_URL);

  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      userId: user.id
    },
    include: {
      agents: {
        include: {
          _count: {
            select: { tasks: true }
          }
        }
      },
      tasks: {
        orderBy: { createdAt: 'desc' },
        take: 10
      },
      _count: {
        select: {
          agents: true,
          tasks: true
        }
      }
    }
  });

  if (!project) {
    throw new APIError(404, 'Project not found', 'PROJECT_NOT_FOUND');
  }

  return c.json({
    success: true,
    data: project
  });
});

// Create new project
projects.post('/', async (c) => {
  try {
    const user = c.get('user') as AuthUser;
    const body = await c.req.json();
    const data = createProjectSchema.parse(body);

    const prisma = getPrismaClient(c.env.DATABASE_URL);

    const project = await prisma.project.create({
      data: {
        name: data.name,
        description: data.description,
        status: data.status || 'ACTIVE',
        userId: user.id
      },
      include: {
        _count: {
          select: {
            agents: true,
            tasks: true
          }
        }
      }
    });

    return c.json({
      success: true,
      data: project
    }, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new APIError(400, 'Invalid input data', 'VALIDATION_ERROR');
    }
    throw error;
  }
});

// Update project
projects.put('/:id', async (c) => {
  try {
    const user = c.get('user') as AuthUser;
    const projectId = c.req.param('id');
    const body = await c.req.json();
    const data = updateProjectSchema.parse(body);

    const prisma = getPrismaClient(c.env.DATABASE_URL);

    // Check if project exists and belongs to user
    const existingProject = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: user.id
      }
    });

    if (!existingProject) {
      throw new APIError(404, 'Project not found', 'PROJECT_NOT_FOUND');
    }

    const project = await prisma.project.update({
      where: { id: projectId },
      data: {
        ...data,
        updatedAt: new Date()
      },
      include: {
        _count: {
          select: {
            agents: true,
            tasks: true
          }
        }
      }
    });

    return c.json({
      success: true,
      data: project
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new APIError(400, 'Invalid input data', 'VALIDATION_ERROR');
    }
    throw error;
  }
});

// Delete project
projects.delete('/:id', async (c) => {
  const user = c.get('user') as AuthUser;
  const projectId = c.req.param('id');
  const prisma = getPrismaClient(c.env.DATABASE_URL);

  // Check if project exists and belongs to user
  const existingProject = await prisma.project.findFirst({
    where: {
      id: projectId,
      userId: user.id
    }
  });

  if (!existingProject) {
    throw new APIError(404, 'Project not found', 'PROJECT_NOT_FOUND');
  }

  await prisma.project.delete({
    where: { id: projectId }
  });

  return c.json({
    success: true,
    message: 'Project deleted successfully'
  });
});

// Get project statistics
projects.get('/:id/stats', async (c) => {
  const user = c.get('user') as AuthUser;
  const projectId = c.req.param('id');
  const prisma = getPrismaClient(c.env.DATABASE_URL);

  // Check if project exists and belongs to user
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      userId: user.id
    }
  });

  if (!project) {
    throw new APIError(404, 'Project not found', 'PROJECT_NOT_FOUND');
  }

  // Get statistics
  const [totalAgents, totalTasks, tasksByStatus] = await Promise.all([
    prisma.agent.count({ where: { projectId } }),
    prisma.task.count({ where: { projectId } }),
    prisma.task.groupBy({
      by: ['status'],
      where: { projectId },
      _count: true
    })
  ]);

  const stats = {
    totalAgents,
    totalTasks,
    tasksByStatus: tasksByStatus.reduce((acc, item) => {
      acc[item.status] = item._count;
      return acc;
    }, {} as Record<string, number>)
  };

  return c.json({
    success: true,
    data: stats
  });
});

export default projects;