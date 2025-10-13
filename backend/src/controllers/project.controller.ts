import { Response, NextFunction } from 'express';
import { prisma } from '@/config/database';
import { AuthRequest } from '@/types';
import { sendSuccess, sendCreated, sendPaginated, sendNoContent } from '@/utils/response';
import { NotFoundError } from '@/types';

export class ProjectController {
  // Get all projects for current user
  static async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;
      const status = req.query.status as string;

      const where: any = { userId };
      if (status) {
        where.status = status;
      }

      const [projects, total] = await Promise.all([
        prisma.project.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            _count: {
              select: { tasks: true, milestones: true },
            },
          },
        }),
        prisma.project.count({ where }),
      ]);

      sendPaginated(res, projects, page, limit, total);
    } catch (error) {
      next(error);
    }
  }

  // Get single project
  static async getOne(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const project = await prisma.project.findFirst({
        where: { id, userId },
        include: {
          tasks: {
            orderBy: { createdAt: 'desc' },
            include: {
              agent: {
                select: {
                  id: true,
                  name: true,
                  role: true,
                  status: true,
                },
              },
            },
          },
          milestones: {
            orderBy: { targetDate: 'asc' },
          },
          _count: {
            select: { tasks: true, milestones: true },
          },
        },
      });

      if (!project) {
        throw new NotFoundError('Project not found');
      }

      sendSuccess(res, project);
    } catch (error) {
      next(error);
    }
  }

  // Create new project
  static async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { name, description, priority, budget, startDate, endDate } = req.body;

      const project = await prisma.project.create({
        data: {
          name,
          description,
          priority,
          budget,
          startDate: startDate ? new Date(startDate) : null,
          endDate: endDate ? new Date(endDate) : null,
          userId,
        },
      });

      sendCreated(res, project, 'Project created successfully');
    } catch (error) {
      next(error);
    }
  }

  // Update project
  static async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const updateData = req.body;

      // Check if project exists and belongs to user
      const existingProject = await prisma.project.findFirst({
        where: { id, userId },
      });

      if (!existingProject) {
        throw new NotFoundError('Project not found');
      }

      // Convert date strings to Date objects if present
      if (updateData.startDate) {
        updateData.startDate = new Date(updateData.startDate);
      }
      if (updateData.endDate) {
        updateData.endDate = new Date(updateData.endDate);
      }

      const project = await prisma.project.update({
        where: { id },
        data: updateData,
      });

      sendSuccess(res, project, 'Project updated successfully');
    } catch (error) {
      next(error);
    }
  }

  // Delete project
  static async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      // Check if project exists and belongs to user
      const project = await prisma.project.findFirst({
        where: { id, userId },
      });

      if (!project) {
        throw new NotFoundError('Project not found');
      }

      await prisma.project.delete({
        where: { id },
      });

      sendNoContent(res);
    } catch (error) {
      next(error);
    }
  }

  // Get project statistics
  static async getStatistics(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      // Check if project exists and belongs to user
      const project = await prisma.project.findFirst({
        where: { id, userId },
      });

      if (!project) {
        throw new NotFoundError('Project not found');
      }

      const [
        totalTasks,
        completedTasks,
        inProgressTasks,
        failedTasks,
        totalMilestones,
        completedMilestones,
      ] = await Promise.all([
        prisma.task.count({ where: { projectId: id } }),
        prisma.task.count({ where: { projectId: id, status: 'COMPLETED' } }),
        prisma.task.count({ where: { projectId: id, status: 'IN_PROGRESS' } }),
        prisma.task.count({ where: { projectId: id, status: 'FAILED' } }),
        prisma.milestone.count({ where: { projectId: id } }),
        prisma.milestone.count({ where: { projectId: id, isCompleted: true } }),
      ]);

      const statistics = {
        tasks: {
          total: totalTasks,
          completed: completedTasks,
          inProgress: inProgressTasks,
          failed: failedTasks,
          completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
        },
        milestones: {
          total: totalMilestones,
          completed: completedMilestones,
          completionRate: totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0,
        },
        budget: {
          allocated: project.budget || 0,
          spent: project.spent || 0,
          remaining: (project.budget || 0) - (project.spent || 0),
          utilizationRate: project.budget ? (project.spent / project.budget) * 100 : 0,
        },
        progress: project.progress,
      };

      sendSuccess(res, statistics);
    } catch (error) {
      next(error);
    }
  }
}