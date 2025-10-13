import { Router } from 'express';
import { CommandController } from '@/controllers/command.controller';
import { validate, schemas } from '@/middleware/validator';
import { authenticate } from '@/middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Command routes
router.get('/', validate(schemas.pagination), CommandController.getAll);
router.get('/statistics', CommandController.getStatistics);
router.get('/:id', validate(schemas.idParam), CommandController.getOne);
router.post('/', validate(schemas.executeCommand), CommandController.execute);
router.patch('/:id/status', validate(schemas.idParam), CommandController.updateStatus);

export default router;