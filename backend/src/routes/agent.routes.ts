import { Router } from 'express';
import { AgentController } from '@/controllers/agent.controller';
import { validate, schemas } from '@/middleware/validator';
import { authenticate } from '@/middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Agent CRUD
router.get('/', validate(schemas.pagination), AgentController.getAll);
router.get('/:id', validate(schemas.idParam), AgentController.getOne);
router.post('/', validate(schemas.createAgent), AgentController.create);
router.patch('/:id', validate(schemas.updateAgent), AgentController.update);
router.delete('/:id', validate(schemas.idParam), AgentController.delete);

// Agent operations
router.get('/:id/metrics', validate(schemas.idParam), AgentController.getMetrics);
router.patch('/:id/status', validate(schemas.idParam), AgentController.updateStatus);

export default router;