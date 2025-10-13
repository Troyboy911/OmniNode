import { Request, Response } from 'express';
import { FileService } from '../services/storage/file.service';
import { logger } from '../config/logger';
import { validateRequest } from '../middleware/validator';
import { body, param } from 'express-validator';

const fileService = new FileService();

export const fileUploadValidation = [
  body('projectId').optional().isUUID(),
  body('taskId').optional().isUUID(),
  body('agentId').optional().isUUID(),
  body('isPublic').optional().isBoolean(),
];

export const fileIdValidation = [
  param('fileId').isUUID(),
];

export class FileController {
  async uploadFile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
      }

      const metadata = {
        originalName: req.file.originalname,
        filename: req.file.filename,
        mimeType: req.file.mimetype,
        size: req.file.size,
        path: req.file.path,
        isPublic: req.body.isPublic === 'true',
        userId: (req as any).user.id,
        projectId: req.body.projectId,
        taskId: req.body.taskId,
        agentId: req.body.agentId,
      };

      const file = await fileService.saveFileMetadata(metadata);

      res.status(201).json({
        message: 'File uploaded successfully',
        file: {
          id: file.id,
          originalName: file.originalName,
          filename: file.filename,
          mimeType: file.mimeType,
          size: file.size,
          url: fileService.getFileUrl(file),
          createdAt: file.createdAt,
        },
      });
    } catch (error) {
      logger.error('File upload error:', error);
      res.status(500).json({ error: 'Failed to upload file' });
    }
  }

  async getFiles(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const { limit, offset, projectId, taskId, agentId } = req.query;

      const files = await fileService.getFilesByUser(userId, {
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
        projectId: projectId as string,
        taskId: taskId as string,
        agentId: agentId as string,
      });

      res.json({
        files: files.map(file => ({
          id: file.id,
          originalName: file.originalName,
          filename: file.filename,
          mimeType: file.mimeType,
          size: file.size,
          url: fileService.getFileUrl(file),
          createdAt: file.createdAt,
        })),
        total: files.length,
      });
    } catch (error) {
      logger.error('Get files error:', error);
      res.status(500).json({ error: 'Failed to get files' });
    }
  }

  async getFile(req: Request, res: Response): Promise<void> {
    try {
      const { fileId } = req.params;
      const userId = (req as any).user.id;

      const file = await fileService.getFileById(fileId, userId);
      if (!file) {
        res.status(404).json({ error: 'File not found' });
        return;
      }

      res.json({
        file: {
          id: file.id,
          originalName: file.originalName,
          filename: file.filename,
          mimeType: file.mimeType,
          size: file.size,
          url: fileService.getFileUrl(file),
          createdAt: file.createdAt,
          metadata: file.metadata,
        },
      });
    } catch (error) {
      logger.error('Get file error:', error);
      res.status(500).json({ error: 'Failed to get file' });
    }
  }

  async downloadFile(req: Request, res: Response): Promise<void> {
    try {
      const { fileId } = req.params;
      const userId = (req as any).user.id;

      const fileStream = await fileService.getFileStream(fileId, userId);
      if (!fileStream) {
        res.status(404).json({ error: 'File not found' });
        return;
      }

      res.setHeader('Content-Disposition', `attachment; filename="${fileStream.file.originalName}"`);
      res.setHeader('Content-Type', fileStream.file.mimeType);
      res.setHeader('Content-Length', fileStream.file.size.toString());

      fileStream.stream.pipe(res);
    } catch (error) {
      logger.error('Download file error:', error);
      res.status(500).json({ error: 'Failed to download file' });
    }
  }

  async deleteFile(req: Request, res: Response): Promise<void> {
    try {
      const { fileId } = req.params;
      const userId = (req as any).user.id;

      const deleted = await fileService.deleteFile(fileId, userId);
      if (!deleted) {
        res.status(404).json({ error: 'File not found' });
        return;
      }

      res.json({ message: 'File deleted successfully' });
    } catch (error) {
      logger.error('Delete file error:', error);
      res.status(500).json({ error: 'Failed to delete file' });
    }
  }

  async getFileStats(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const stats = await fileService.getFileStats(userId);

      res.json(stats);
    } catch (error) {
      logger.error('Get file stats error:', error);
      res.status(500).json({ error: 'Failed to get file stats' });
    }
  }
}

export const fileController = new FileController();