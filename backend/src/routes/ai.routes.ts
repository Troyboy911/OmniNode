import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { aiController, chatValidation, fileProcessingValidation } from '../controllers/ai.controller';
import { validateRequest } from '../middleware/validator';

const router = Router();

// All AI routes require authentication
router.use(authenticate);

// Chat endpoints
router.post('/chat', validateRequest(chatValidation), aiController.chat);
router.get('/conversations', aiController.getConversations);
router.get('/conversations/:conversationId/messages', aiController.getConversationMessages);

// File processing endpoints
router.post('/process-file', validateRequest(fileProcessingValidation), aiController.processFile);
router.get('/processing-jobs', aiController.getProcessingJobs);

// Model information
router.get('/models', aiController.getAvailableModels);

export default router;