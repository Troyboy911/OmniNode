import { Router } from 'express';
import authRoutes from './auth.routes';
import agentRoutes from './agent.routes';
import projectRoutes from './project.routes';
import taskRoutes from './task.routes';
import commandRoutes from './command.routes';
import aiRoutes from './ai.routes';
import fileRoutes from './file.routes';

const router = Router();

// Health check
router.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'Omni Node API is running',
    timestamp: new Date().toISOString(),
  });
});

// API routes
router.use('/auth', authRoutes);
router.use('/agents', agentRoutes);
router.use('/projects', projectRoutes);
router.use('/tasks', taskRoutes);
router.use('/commands', commandRoutes);
router.use('/ai', aiRoutes);
router.use('/files', fileRoutes);

export default router;