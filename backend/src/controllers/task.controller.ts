import { Response, NextFunction } from 'express';
import { prisma } from '@/config/database';
import { AuthRequest } from '@/types';
import { sendSuccess, sendCreated, sendPaginated, sendNoContent } from '@/utils/response';
import { NotFoundError, AuthorizationError } from '@/types';
import { TaskQueue } from '@/services/queue/task.queue';

export class TaskController {
  // Get all tasks (with optional filters)
  static async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;
      const status = req.query.status as string;
      const projectId = req.query.projectId as string;
      const agentId = req.query.agentId as string;

      const where: any = {
        project: { userId },
      };

      if (status) where.status = status;
      if (projectId) where.projectId = projectId;
      if (agentId) where.agentId = agentId;

      const [tasks, total] = await Promise.all([
        prisma.task.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            project: {
              select: {
                id: true,
                name: true,
                status: true,
              },
            },
            agent: {
              select: {
                id: true,
                name: true,
                role: true,
                status: true,
              },
            },
          },
        }),
        prisma.task.count({ where }),
      ]);

      sendPaginated(res, tasks, page, limit, total);
    } catch (error) {
      next(error);
    }
  }

  // Get single task
  static async getOne(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const task = await prisma.task.findFirst({
        where: {
          id,
          project: { userId },
        },
        include: {
          project: true,
          agent: true,
        },
      });

      if (!task) {
        throw new NotFoundError('Task not found');
      }

      sendSuccess(res, task);
    } catch (error) {
      next(error);
    }
  }

  // Create new task
  static async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const {
        title,
        description,
        projectId,
        agentId,
        priority,
        estimatedTime,
        dependencies,
      } = req.body;

      // Verify project belongs to user
      const project = await prisma.project.findFirst({
        where: { id: projectId, userId },
      });

      if (!project) {
        throw new AuthorizationError('Project not found or access denied');
      }

      // Verify agent belongs to user if provided
      if (agentId) {
        const agent = await prisma.agent.findFirst({
          where: { id: agentId, userId },
        });

        if (!agent) {
          throw new AuthorizationError('Agent not found or access denied');
        }
      }

      const task = await prisma.task.create({
        data: {
          title,
          description,
          projectId,
          agentId,
          priority,
          estimatedTime,
          dependencies: dependencies || [],
        },
        include: {
          project: {
            select: {
              id: true,
              name: true,
            },
          },
          agent: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        },
      });

      sendCreated(res, task, 'Task created successfully');
    } catch (error) {
      next(error);
    }
  }

  // Update task
  static async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const updateData = req.body;

      // Check if task exists and user has access
      const existingTask = await prisma.task.findFirst({
        where: {
          id,
          project: { userId },
        },
      });

      if (!existingTask) {
        throw new NotFoundError('Task not found');
      }

      // If updating agent, verify it belongs to user
      if (updateData.agentId) {
        const agent = await prisma.agent.findFirst({
          where: { id: updateData.agentId, userId },
        });

        if (!agent) {
          throw new AuthorizationError('Agent not found or access denied');
        }
      }

      const task = await prisma.task.update({
        where: { id },
        data: updateData,
        include: {
          project: {
            select: {
              id: true,
              name: true,
            },
          },
          agent: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        },
      });

      sendSuccess(res, task, 'Task updated successfully');
    } catch (error) {
      next(error);
    }
  }

  // Delete task
  static async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      // Check if task exists and user has access
      const task = await prisma.task.findFirst({
        where: {
          id,
          project: { userId },
        },
      });

      if (!task) {
        throw new NotFoundError('Task not found');
      }

      await prisma.task.delete({
        where: { id },
      });

      sendNoContent(res);
    } catch (error) {
      next(error);
    }
  }

  // Start task execution
  static async start(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      // Check if task exists and user has access
      const task = await prisma.task.findFirst({
        where: {
          id,
          project: { userId },
        },
        include: {
          agent: true,
          project: true,
        },
      });

      if (!task) {
        throw new NotFoundError('Task not found');
      }

      if (!task.agent) {
        throw new AuthorizationError('Task must be assigned to an agent');
      }

      // Update task status
      const updatedTask = await prisma.task.update({
        where: { id },
        data: {
          status: 'IN_PROGRESS',
          startedAt: new Date(),
        },
      });

      // Queue task for execution
      const taskQueue = TaskQueue.getInstance();
      await taskQueue.addTask(task.id, task.agent.id, {
        title: task.title,
        description: task.description,
        input: req.body.input || {},
      });

      sendSuccess(res, updatedTask, 'Task started and queued for execution');
    } catch (error) {
      next(error);
    }
  }

  // Complete task
  static async complete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const { result } = req.body;

      // Check if task exists and user has access
      const task = await prisma.task.findFirst({
        where: {
          id,
          project: { userId },
        },
      });

      if (!task) {
        throw new NotFoundError('Task not found');
      }

      const actualTime = task.startedAt
        ? Math.floor((Date.now() - task.startedAt.getTime()) / 60000)
        : null;

      const updatedTask = await prisma.task.update({
        where: { id },
        data: {
          status: 'COMPLETED',
          progress: 100,
          completedAt: new Date(),
          actualTime,
          result: result || {},
        },
      });

      // Update agent stats if assigned
      if (task.agentId) {
        await prisma.agent.update({
          where: { id: task.agentId },
          data: {
            tasksCompleted: { increment: 1 },
          },
        });
      }

      sendSuccess(res, updatedTask, 'Task completed successfully');
    } catch (error) {
      next(error);
    }
  }

  // Fail task
  static async fail(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const { error } = req.body;

      // Check if task exists and user has access
      const task = await prisma.task.findFirst({
        where: {
          id,
          project: { userId },
        },
      });

      if (!task) {
        throw new NotFoundError('Task not found');
      }

      const updatedTask = await prisma.task.update({
        where: { id },
        data: {
          status: 'FAILED',
          error: error || 'Task execution failed',
          completedAt: new Date(),
        },
      });

      sendSuccess(res, updatedTask, 'Task marked as failed');
    } catch (error) {
      next(error);
    }
  }
}