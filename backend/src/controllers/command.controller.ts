import { Response, NextFunction } from 'express';
import { prisma } from '@/config/database';
import { AuthRequest } from '@/types';
import { sendSuccess, sendCreated, sendPaginated } from '@/utils/response';
import { NotFoundError } from '@/types';
import { OpenAIService } from '@/services';

export class CommandController {
  // Get all commands for current user
  static async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;
      const status = req.query.status as string;

      const where: any = { userId };
      if (status) {
        where.status = status;
      }

      const [commands, total] = await Promise.all([
        prisma.command.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.command.count({ where }),
      ]);

      sendPaginated(res, commands, page, limit, total);
    } catch (error) {
      next(error);
    }
  }

  // Get single command
  static async getOne(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const command = await prisma.command.findFirst({
        where: { id, userId },
      });

      if (!command) {
        throw new NotFoundError('Command not found');
      }

      sendSuccess(res, command);
    } catch (error) {
      next(error);
    }
  }

  // Execute new command
  static async execute(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { text, metadata } = req.body;

      // Create command record
      const command = await prisma.command.create({
        data: {
          text,
          status: 'PROCESSING',
          metadata: metadata || {},
          userId,
        },
      });

      // Process command with AI
      try {
        const openai = OpenAIService.getInstance();
        const response = await openai.generateResponse(text, {
          systemPrompt: 'You are Omni Node AI assistant. Process user commands and provide helpful responses.',
        });

        // Update command with response
        await prisma.command.update({
          where: { id: command.id },
          data: {
            status: 'COMPLETED',
            response,
            executionTime: 100, // Placeholder
          },
        });

        sendCreated(res, {
          ...command,
          response,
          status: 'COMPLETED',
        }, 'Command processed successfully');
      } catch (aiError) {
        console.error('AI processing error:', aiError);
        
        // Update command as failed
        await prisma.command.update({
          where: { id: command.id },
          data: {
            status: 'FAILED',
            response: 'Failed to process command',
            executionTime: 0,
          },
        });

        sendCreated(res, {
          ...command,
          response: 'Failed to process command',
          status: 'FAILED',
        }, 'Command processing failed');
      }
    } catch (error) {
      next(error);
    }
  }

  // Update command status
  static async updateStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const { status, response, executionTime } = req.body;

      // Check if command exists and belongs to user
      const existingCommand = await prisma.command.findFirst({
        where: { id, userId },
      });

      if (!existingCommand) {
        throw new NotFoundError('Command not found');
      }

      const command = await prisma.command.update({
        where: { id },
        data: {
          status,
          response,
          executionTime,
        },
      });

      sendSuccess(res, command, 'Command status updated');
    } catch (error) {
      next(error);
    }
  }

  // Get command history statistics
  static async getStatistics(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;

      const [
        total,
        processing,
        executing,
        completed,
        failed,
        avgExecutionTime,
      ] = await Promise.all([
        prisma.command.count({ where: { userId } }),
        prisma.command.count({ where: { userId, status: 'PROCESSING' } }),
        prisma.command.count({ where: { userId, status: 'EXECUTING' } }),
        prisma.command.count({ where: { userId, status: 'COMPLETED' } }),
        prisma.command.count({ where: { userId, status: 'FAILED' } }),
        prisma.command.aggregate({
          where: { userId, executionTime: { not: null } },
          _avg: { executionTime: true },
        }),
      ]);

      const statistics = {
        total,
        byStatus: {
          processing,
          executing,
          completed,
          failed,
        },
        successRate: total > 0 ? (completed / total) * 100 : 0,
        averageExecutionTime: avgExecutionTime._avg.executionTime || 0,
      };

      sendSuccess(res, statistics);
    } catch (error) {
      next(error);
    }
  }
}