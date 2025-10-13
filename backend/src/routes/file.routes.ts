import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { fileController, fileUploadValidation, fileIdValidation } from '../controllers/file.controller';
import { uploadSingle } from '../middleware/uploads/upload.middleware';
import { validateRequest } from '../middleware/validator';

const router = Router();

// All file routes require authentication
router.use(authenticate);

// File upload
router.post('/upload', uploadSingle, validateRequest(fileUploadValidation), fileController.uploadFile);

// File management
router.get('/', fileController.getFiles);
router.get('/stats', fileController.getFileStats);
router.get('/:fileId', validateRequest(fileIdValidation), fileController.getFile);
router.get('/:fileId/download', validateRequest(fileIdValidation), fileController.downloadFile);
router.delete('/:fileId', validateRequest(fileIdValidation), fileController.deleteFile);

export default router;