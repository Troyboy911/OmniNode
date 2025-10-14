import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import authRoutes from './auth.routes';
import agentRoutes from './agent.routes';
import projectRoutes from './project.routes';
import taskRoutes from './task.routes';
import commandRoutes from './command.routes';
import aiRoutes from './ai.routes';
import fileRoutes from './file.routes';
import { realAgentOrchestrator } from '../services/ai/orchestration-engine';
import { web3Service } from '../services/blockchain/web3.service';
import { logger } from '../config/logger';

const router = Router();
const prisma = new PrismaClient();

// Real health check with actual data
router.get('/health', async (_req, res) => {
  try {
    const stats = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      agents: await prisma.agent.count(),
      projects: await prisma.project.count(),
      tasks: await prisma.task.count(),
      blockchain: {
        contracts: await prisma.smartContract.count(),
        transactions: await prisma.blockchainTransaction.count(),
      },
      ai: {
        conversations: await prisma.aIConversation.count(),
        messages: await prisma.aIMessage.count(),
      },
    };

    res.json({
      success: true,
      message: 'Omni Node API is running with real functionality',
      ...stats,
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Health check failed',
      message: error.message 
    });
  }
});

// Real-time orchestration endpoints
router.post('/orchestrate', async (req, res) => {
  try {
    const { projectId, goal } = req.body;
    
    const result = await realAgentOrchestrator.executeAutonomousWorkflow(projectId, goal);
    
    res.json({
      success: true,
      result,
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('Orchestration failed:', error);
    res.status(500).json({ error: 'Orchestration failed' });
  }
});

// Real blockchain endpoints
router.post('/deploy-contract', async (req, res) => {
  try {
    const { contractName, network = 'local' } = req.body;
    
    const deployment = await web3Service.deploySmartContract(
      contractName,
      req.body.contractSource,
      req.body.constructorArgs || [],
      network
    );
    
    res.json({
      success: true,
      deployment,
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('Contract deployment failed:', error);
    res.status(500).json({ error: 'Contract deployment failed' });
  }
});

// Real-time metrics
router.get('/metrics', async (_req, res) => {
  try {
    const metrics = {
      agents: {
        total: await prisma.agent.count(),
        active: await prisma.agent.count({ where: { status: 'running' } }),
        idle: await prisma.agent.count({ where: { status: 'idle' } }),
      },
      tasks: {
        total: await prisma.task.count(),
        completed: await prisma.task.count({ where: { status: 'completed' } }),
        inProgress: await prisma.task.count({ where: { status: 'in_progress' } }),
        failed: await prisma.task.count({ where: { status: 'failed' } }),
      },
      blockchain: await web3Service.getRealBlockchainStats(),
      ai: {
        conversations: await prisma.aIConversation.count(),
        messages: await prisma.aIMessage.count(),
        processingJobs: await prisma.aIProcessingJob.count(),
      },
      timestamp: new Date(),
    };

    res.json(metrics);
  } catch (error) {
    logger.error('Failed to fetch metrics:', error);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
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