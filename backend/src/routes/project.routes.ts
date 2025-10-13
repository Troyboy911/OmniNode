import { Router } from 'express';
import { ProjectController } from '@/controllers/project.controller';
import { validate, schemas } from '@/middleware/validator';
import { authenticate } from '@/middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Project CRUD
router.get('/', validate(schemas.pagination), ProjectController.getAll);
router.get('/:id', validate(schemas.idParam), ProjectController.getOne);
router.post('/', validate(schemas.createProject), ProjectController.create);
router.patch('/:id', validate(schemas.updateProject), ProjectController.update);
router.delete('/:id', validate(schemas.idParam), ProjectController.delete);

// Project operations
router.get('/:id/statistics', validate(schemas.idParam), ProjectController.getStatistics);

export default router;