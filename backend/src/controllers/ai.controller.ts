import { Request, Response } from 'express';
import { aiOrchestrator } from '../services/ai/ai.orchestrator';
import { logger } from '../config/logger';
import { validateRequest } from '../middleware/validator';
import { body, param, query } from 'express-validator';

export const chatValidation = [
  body('message').isString().isLength({ min: 1, max: 10000 }),
  body('conversationId').optional().isString(),
  body('model').optional().isString(),
  body('temperature').optional().isFloat({ min: 0, max: 2 }),
  body('maxTokens').optional().isInt({ min: 1, max: 8000 }),
];

export const fileProcessingValidation = [
  body('fileId').isUUID(),
  body('operation').isIn(['analyze', 'summarize', 'extract', 'transform']),
  body('context').optional().isObject(),
  body('model').optional().isString(),
];

export class AIController {
  async chat(req: Request, res: Response): Promise<void> {
    try {
      const { message, conversationId, model, temperature, maxTokens } = req.body;
      const userId = (req as any).user.id;

      const result = await aiOrchestrator.generateChatResponse(
        conversationId || `conv_${Date.now()}_${userId}`,
        message,
        {
          model,
          temperature,
          maxTokens,
        }
      );

      res.json({
        response: result.response,
        tokens: result.tokens,
        model: result.model,
        conversationId: result.conversationId,
      });
    } catch (error) {
      logger.error('AI chat error:', error);
      res.status(500).json({ error: 'Failed to generate AI response' });
    }
  }

  async getConversations(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const { limit, offset } = req.query;

      const conversations = await aiOrchestrator.getConversations(
        userId,
        limit ? parseInt(limit as string) : undefined,
        offset ? parseInt(offset as string) : undefined
      );

      res.json({
        conversations: conversations.map(conv => ({
          id: conv.id,
          title: conv.title,
          model: conv.model,
          tokens: conv.tokens,
          createdAt: conv.createdAt,
          updatedAt: conv.updatedAt,
          lastMessage: conv.messages[0]?.content,
        })),
        total: conversations.length,
      });
    } catch (error) {
      logger.error('Get conversations error:', error);
      res.status(500).json({ error: 'Failed to get conversations' });
    }
  }

  async getConversationMessages(req: Request, res: Response): Promise<void> {
    try {
      const { conversationId } = req.params;
      const userId = (req as any).user.id;

      // Verify user owns the conversation
      const conversation = await (aiOrchestrator as any).prisma.aIConversation.findFirst({
        where: { id: conversationId, userId },
      });

      if (!conversation) {
        res.status(404).json({ error: 'Conversation not found' });
        return;
      }

      const messages = await aiOrchestrator.getConversationMessages(conversationId);

      res.json({
        messages: messages.map(msg => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          tokens: msg.tokens,
          createdAt: msg.createdAt,
        })),
      });
    } catch (error) {
      logger.error('Get conversation messages error:', error);
      res.status(500).json({ error: 'Failed to get conversation messages' });
    }
  }

  async processFile(req: Request, res: Response): Promise<void> {
    try {
      const { fileId, operation, context, model } = req.body;
      const userId = (req as any).user.id;

      // Verify user owns the file
      const file = await (aiOrchestrator as any).prisma.file.findFirst({
        where: { id: fileId, userId },
      });

      if (!file) {
        res.status(404).json({ error: 'File not found' });
        return;
      }

      const result = await aiOrchestrator.processFile(
        {
          fileId,
          filePath: file.path,
          mimeType: file.mimeType,
          operation,
          context,
        },
        { model }
      );

      res.json({
        result: result.content,
        metadata: result.metadata,
        fileId,
        operation,
      });
    } catch (error) {
      logger.error('File processing error:', error);
      res.status(500).json({ error: 'Failed to process file' });
    }
  }

  async getProcessingJobs(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const { status } = req.query;

      const jobs = await aiOrchestrator.getProcessingJobs(
        userId,
        status as string
      );

      res.json({
        jobs: jobs.map(job => ({
          id: job.id,
          type: job.type,
          status: job.status,
          input: job.input,
          output: job.output,
          error: job.error,
          tokens: job.tokens,
          cost: job.cost,
          model: job.model,
          createdAt: job.createdAt,
          startedAt: job.startedAt,
          completedAt: job.completedAt,
          file: job.file ? {
            id: job.file.id,
            originalName: job.file.originalName,
            mimeType: job.file.mimeType,
          } : null,
        })),
      });
    } catch (error) {
      logger.error('Get processing jobs error:', error);
      res.status(500).json({ error: 'Failed to get processing jobs' });
    }
  }

  async getAvailableModels(req: Request, res: Response): Promise<void> {
    try {
      const models = await aiOrchestrator.getAvailableModels();

      res.json({
        models: models.map(model => ({
          id: model,
          name: model,
          provider: model.includes('claude') ? 'anthropic' : 'openai',
        })),
      });
    } catch (error) {
      logger.error('Get available models error:', error);
      res.status(500).json({ error: 'Failed to get available models' });
    }
  }
}

export const aiController = new AIController();
