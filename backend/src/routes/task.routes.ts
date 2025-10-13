import { Router } from 'express';
import { TaskController } from '@/controllers/task.controller';
import { validate, schemas } from '@/middleware/validator';
import { authenticate } from '@/middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Task CRUD
router.get('/', validate(schemas.pagination), TaskController.getAll);
router.get('/:id', validate(schemas.idParam), TaskController.getOne);
router.post('/', validate(schemas.createTask), TaskController.create);
router.patch('/:id', validate(schemas.idParam), TaskController.update);
router.delete('/:id', validate(schemas.idParam), TaskController.delete);

// Task operations
router.post('/:id/start', validate(schemas.idParam), TaskController.start);
router.post('/:id/complete', validate(schemas.idParam), TaskController.complete);
router.post('/:id/fail', validate(schemas.idParam), TaskController.fail);

export default router;