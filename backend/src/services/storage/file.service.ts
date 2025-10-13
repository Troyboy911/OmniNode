import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { File } from '@prisma/client';
import { prisma } from '../../config/database';
import { logger } from '../../config/logger';

export interface FileUploadOptions {
  destination?: string;
  maxSize?: number;
  allowedTypes?: string[];
  isPublic?: boolean;
}

export interface FileMetadata {
  originalName: string;
  filename: string;
  mimeType: string;
  size: number;
  path: string;
  url?: string;
  isPublic: boolean;
  userId: string;
  projectId?: string;
  taskId?: string;
  agentId?: string;
}

export class FileService {
  private uploadDir: string;

  constructor(uploadDir: string = 'uploads') {
    this.uploadDir = uploadDir;
    this.ensureUploadDir();
  }

  private ensureUploadDir(): void {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  getStorageConfig(options: FileUploadOptions = {}) {
    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        const dest = options.destination || this.uploadDir;
        if (!fs.existsSync(dest)) {
          fs.mkdirSync(dest, { recursive: true });
        }
        cb(null, dest);
      },
      filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}-${file.originalname}`;
        cb(null, uniqueName);
      },
    });

    const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
      if (options.allowedTypes && !options.allowedTypes.includes(file.mimetype)) {
        cb(new Error(`File type ${file.mimetype} not allowed`));
        return;
      }
      cb(null, true);
    };

    return multer({
      storage,
      fileFilter,
      limits: {
        fileSize: options.maxSize || 10 * 1024 * 1024, // 10MB default
      },
    });
  }

  async saveFileMetadata(metadata: FileMetadata): Promise<File> {
    try {
      const file = await prisma.file.create({
        data: {
          filename: metadata.filename,
          originalName: metadata.originalName,
          mimeType: metadata.mimeType,
          size: metadata.size,
          path: metadata.path,
          url: metadata.url,
          isPublic: metadata.isPublic,
          metadata: {},
          userId: metadata.userId,
          projectId: metadata.projectId,
          taskId: metadata.taskId,
          agentId: metadata.agentId,
        },
      });

      logger.info(`File saved: ${metadata.originalName} (${file.id})`);
      return file;
    } catch (error) {
      logger.error('Error saving file metadata:', error);
      throw error;
    }
  }

  async getFileById(fileId: string, userId: string): Promise<File | null> {
    return prisma.file.findFirst({
      where: {
        id: fileId,
        userId,
      },
    });
  }

  async getFilesByUser(userId: string, options: {
    limit?: number;
    offset?: number;
    projectId?: string;
    taskId?: string;
    agentId?: string;
  } = {}): Promise<File[]> {
    return prisma.file.findMany({
      where: {
        userId,
        ...(options.projectId && { projectId: options.projectId }),
        ...(options.taskId && { taskId: options.taskId }),
        ...(options.agentId && { agentId: options.agentId }),
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: options.limit || 50,
      skip: options.offset || 0,
    });
  }

  async deleteFile(fileId: string, userId: string): Promise<boolean> {
    try {
      const file = await prisma.file.findFirst({
        where: { id: fileId, userId },
      });

      if (!file) {
        return false;
      }

      // Delete physical file
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }

      // Delete database record
      await prisma.file.delete({
        where: { id: fileId },
      });

      logger.info(`File deleted: ${file.originalName} (${fileId})`);
      return true;
    } catch (error) {
      logger.error('Error deleting file:', error);
      return false;
    }
  }

  async getFileStream(fileId: string, userId: string): Promise<{
    stream: fs.ReadStream;
    file: File;
  } | null> {
    const file = await this.getFileById(fileId, userId);
    if (!file || !fs.existsSync(file.path)) {
      return null;
    }

    return {
      stream: fs.createReadStream(file.path),
      file,
    };
  }

  async updateFileMetadata(
    fileId: string,
    userId: string,
    metadata: Partial<{
      isPublic: boolean;
      metadata: any;
    }>
  ): Promise<File | null> {
    try {
      return await prisma.file.update({
        where: { id: fileId },
        data: metadata,
      });
    } catch (error) {
      logger.error('Error updating file metadata:', error);
      return null;
    }
  }

  getFileUrl(file: File): string {
    if (file.url) {
      return file.url;
    }
    return `/api/files/${file.id}`;
  }

  async getFileStats(userId: string): Promise<{
    totalFiles: number;
    totalSize: number;
    byMimeType: Record<string, number>;
    byDate: Record<string, number>;
  }> {
    const files = await prisma.file.findMany({
      where: { userId },
    });

    const stats = {
      totalFiles: files.length,
      totalSize: files.reduce((sum, file) => sum + file.size, 0),
      byMimeType: {} as Record<string, number>,
      byDate: {} as Record<string, number>,
    };

    files.forEach(file => {
      const mimeType = file.mimeType || 'unknown';
      const date = file.createdAt.toISOString().split('T')[0];

      stats.byMimeType[mimeType] = (stats.byMimeType[mimeType] || 0) + 1;
      stats.byDate[date] = (stats.byDate[date] || 0) + 1;
    });

    return stats;
  }
}