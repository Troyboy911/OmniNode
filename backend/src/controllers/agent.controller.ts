import { Response, NextFunction } from 'express';
import { prisma } from '@/config/database';
import { AuthRequest } from '@/types';
import { sendSuccess, sendCreated, sendPaginated, sendNoContent } from '@/utils/response';
import { NotFoundError } from '@/types';

export class AgentController {
  // Get all agents for current user
  static async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      const [agents, total] = await Promise.all([
        prisma.agent.findMany({
          where: { userId },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            _count: {
              select: { tasks: true, metrics: true },
            },
          },
        }),
        prisma.agent.count({ where: { userId } }),
      ]);

      sendPaginated(res, agents, page, limit, total);
    } catch (error) {
      next(error);
    }
  }

  // Get single agent
  static async getOne(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const agent = await prisma.agent.findFirst({
        where: { id, userId },
        include: {
          tasks: {
            take: 10,
            orderBy: { createdAt: 'desc' },
          },
          metrics: {
            take: 20,
            orderBy: { timestamp: 'desc' },
          },
          _count: {
            select: { tasks: true, metrics: true },
          },
        },
      });

      if (!agent) {
        throw new NotFoundError('Agent not found');
      }

      sendSuccess(res, agent);
    } catch (error) {
      next(error);
    }
  }

  // Create new agent
  static async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { name, role, description, capabilities, config } = req.body;

      const agent = await prisma.agent.create({
        data: {
          name,
          role,
          description,
          capabilities: capabilities || [],
          config: config || {},
          userId,
        },
      });

      sendCreated(res, agent, 'Agent created successfully');
    } catch (error) {
      next(error);
    }
  }

  // Update agent
  static async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const updateData = req.body;

      // Check if agent exists and belongs to user
      const existingAgent = await prisma.agent.findFirst({
        where: { id, userId },
      });

      if (!existingAgent) {
        throw new NotFoundError('Agent not found');
      }

      const agent = await prisma.agent.update({
        where: { id },
        data: updateData,
      });

      sendSuccess(res, agent, 'Agent updated successfully');
    } catch (error) {
      next(error);
    }
  }

  // Delete agent
  static async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      // Check if agent exists and belongs to user
      const agent = await prisma.agent.findFirst({
        where: { id, userId },
      });

      if (!agent) {
        throw new NotFoundError('Agent not found');
      }

      await prisma.agent.delete({
        where: { id },
      });

      sendNoContent(res);
    } catch (error) {
      next(error);
    }
  }

  // Get agent metrics
  static async getMetrics(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const limit = parseInt(req.query.limit as string) || 50;

      // Check if agent exists and belongs to user
      const agent = await prisma.agent.findFirst({
        where: { id, userId },
      });

      if (!agent) {
        throw new NotFoundError('Agent not found');
      }

      const metrics = await prisma.metric.findMany({
        where: { agentId: id },
        take: limit,
        orderBy: { timestamp: 'desc' },
      });

      sendSuccess(res, metrics);
    } catch (error) {
      next(error);
    }
  }

  // Update agent status
  static async updateStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const { status } = req.body;

      // Check if agent exists and belongs to user
      const agent = await prisma.agent.findFirst({
        where: { id, userId },
      });

      if (!agent) {
        throw new NotFoundError('Agent not found');
      }

      const updatedAgent = await prisma.agent.update({
        where: { id },
        data: { status },
      });

      sendSuccess(res, updatedAgent, 'Agent status updated successfully');
    } catch (error) {
      next(error);
    }
  }
}