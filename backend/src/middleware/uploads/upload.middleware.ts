import multer from 'multer';
import path from 'path';
import { FileService } from '../../services/storage/file.service';

const fileService = new FileService();

export const uploadMiddleware = fileService.getStorageConfig({
  destination: 'uploads',
  maxSize: 50 * 1024 * 1024, // 50MB
  allowedTypes: [
    // Images
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/markdown',
    
    // Code
    'text/javascript',
    'application/javascript',
    'text/typescript',
    'text/css',
    'text/html',
    'application/json',
    'text/xml',
    
    // Archives
    'application/zip',
    'application/x-tar',
    'application/gzip',
    
    // Data
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
});

// Single file upload
export const uploadSingle = uploadMiddleware.single('file');

// Multiple files upload
export const uploadMultiple = uploadMiddleware.array('files', 10);

// Custom upload configuration
export const createUploadMiddleware = (options: {
  maxSize?: number;
  allowedTypes?: string[];
  maxCount?: number;
  destination?: string;
}) => {
  return fileService.getStorageConfig(options);
};