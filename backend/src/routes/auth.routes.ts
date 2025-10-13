import { Router } from 'express';
import { AuthController } from '@/controllers/auth.controller';
import { validate, schemas } from '@/middleware/validator';
import { authenticate } from '@/middleware/auth';

const router = Router();

// Public routes
router.post('/register', validate(schemas.register), AuthController.register);
router.post('/login', validate(schemas.login), AuthController.login);
router.post('/refresh', AuthController.refreshToken);

// Protected routes
router.get('/me', authenticate, AuthController.getCurrentUser);
router.post('/logout', authenticate, AuthController.logout);

export default router;