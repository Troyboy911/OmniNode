/**
 * Agent Management Routes
 * CRUD operations for AI agents
 */

import { Hono } from 'hono';
import { z } from 'zod';
import type { Env } from '../index';
import { APIError } from '../middleware/error';
import { getPrismaClient } from '../lib/prisma';
import type { AuthUser } from '../middleware/auth';

const agents = new Hono<{ Bindings: Env }>();

// Validation schemas
const createAgentSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.string().min(1),
  description: z.string().optional(),
  config: z.record(z.any()).optional(),
  projectId: z.string().uuid()
});

const updateAgentSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  type: z.string().min(1).optional(),
  description: z.string().optional(),
  config: z.record(z.any()).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ERROR']).optional()
});

// Get all agents
agents.get('/', async (c) => {
  const user = c.get('user') as AuthUser;
  const projectId = c.req.query('projectId');
  const prisma = getPrismaClient(c.env.DATABASE_URL);

  const where: any = {
    project: { userId: user.id }
  };

  if (projectId) {
    where.projectId = projectId;
  }

  const userAgents = await prisma.agent.findMany({
    where,
    include: {
      project: {
        select: {
          id: true,
          name: true
        }
      },
      _count: {
        select: { tasks: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return c.json({
    success: true,
    data: userAgents
  });
});

// Get single agent
agents.get('/:id', async (c) => {
  const user = c.get('user') as AuthUser;
  const agentId = c.req.param('id');
  const prisma = getPrismaClient(c.env.DATABASE_URL);

  const agent = await prisma.agent.findFirst({
    where: {
      id: agentId,
      project: { userId: user.id }
    },
    include: {
      project: true,
      tasks: {
        orderBy: { createdAt: 'desc' },
        take: 10
      },
      _count: {
        select: { tasks: true }
      }
    }
  });

  if (!agent) {
    throw new APIError(404, 'Agent not found', 'AGENT_NOT_FOUND');
  }

  return c.json({
    success: true,
    data: agent
  });
});

// Create new agent
agents.post('/', async (c) => {
  try {
    const user = c.get('user') as AuthUser;
    const body = await c.req.json();
    const data = createAgentSchema.parse(body);

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

    const agent = await prisma.agent.create({
      data: {
        name: data.name,
        type: data.type,
        description: data.description,
        config: data.config || {},
        status: 'ACTIVE',
        projectId: data.projectId
      },
      include: {
        project: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return c.json({
      success: true,
      data: agent
    }, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new APIError(400, 'Invalid input data', 'VALIDATION_ERROR');
    }
    throw error;
  }
});

// Update agent
agents.put('/:id', async (c) => {
  try {
    const user = c.get('user') as AuthUser;
    const agentId = c.req.param('id');
    const body = await c.req.json();
    const data = updateAgentSchema.parse(body);

    const prisma = getPrismaClient(c.env.DATABASE_URL);

    // Check if agent exists and belongs to user
    const existingAgent = await prisma.agent.findFirst({
      where: {
        id: agentId,
        project: { userId: user.id }
      }
    });

    if (!existingAgent) {
      throw new APIError(404, 'Agent not found', 'AGENT_NOT_FOUND');
    }

    const agent = await prisma.agent.update({
      where: { id: agentId },
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
        }
      }
    });

    return c.json({
      success: true,
      data: agent
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new APIError(400, 'Invalid input data', 'VALIDATION_ERROR');
    }
    throw error;
  }
});

// Delete agent
agents.delete('/:id', async (c) => {
  const user = c.get('user') as AuthUser;
  const agentId = c.req.param('id');
  const prisma = getPrismaClient(c.env.DATABASE_URL);

  // Check if agent exists and belongs to user
  const existingAgent = await prisma.agent.findFirst({
    where: {
      id: agentId,
      project: { userId: user.id }
    }
  });

  if (!existingAgent) {
    throw new APIError(404, 'Agent not found', 'AGENT_NOT_FOUND');
  }

  await prisma.agent.delete({
    where: { id: agentId }
  });

  return c.json({
    success: true,
    message: 'Agent deleted successfully'
  });
});

export default agents;