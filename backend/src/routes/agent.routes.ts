import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { body } from 'express-validator';
import { realAgentOrchestrator } from '../services/ai/orchestration-engine';
import { web3Service } from '../services/blockchain/web3.service';
import { logger } from '../config/logger';

const router = Router();
const prisma = new PrismaClient();

// Create real agent with orchestration
router.post('/',
  authMiddleware,
  validateRequest([
    body('name').isString().isLength({ min: 1 }),
    body('type').isString().isIn(['general', 'research', 'code', 'creative', 'analysis']),
    body('projectId').isString(),
    body('config').isObject(),
  ]),
  async (req, res) => {
    try {
      // Create agent in database
      const agent = await prisma.agent.create({
        data: {
          ...req.body,
          userId: req.user.id,
        },
      });

      // Register with real orchestration engine
      const orchestratorAgent = await realAgentOrchestrator.createRealAgent({
        name: req.body.name,
        type: req.body.type,
        projectId: req.body.projectId,
        model: req.body.config.model || 'gpt-3.5-turbo',
        provider: req.body.config.provider || 'openai',
        systemPrompt: req.body.config.systemPrompt || `You are ${req.body.name}, a ${req.body.type} AI agent.`,
        temperature: req.body.config.temperature || 0.7,
        maxTokens: req.body.config.maxTokens || 1000,
        tools: req.body.config.tools || [],
      });

      res.json({
        ...agent,
        orchestratorId: orchestratorAgent.id,
        isReal: true,
      });
    } catch (error) {
      logger.error('Failed to create agent:', error);
      res.status(500).json({ error: 'Failed to create agent' });
    }
  }
);

// Get agents with real status
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { projectId } = req.query;
    const agents = await prisma.agent.findMany({
      where: {
        userId: req.user.id,
        ...(projectId && { projectId: projectId as string }),
      },
      include: {
        tasks: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    // Get real orchestrator status
    const agentsWithStatus = await Promise.all(
      agents.map(async (agent) => {
        try {
          const status = await realAgentOrchestrator.getRealAgentStatus(agent.id);
          return {
            ...agent,
            realStatus: status,
            isReal: true,
          };
        } catch (error) {
          return {
            ...agent,
            realStatus: null,
            isReal: false,
            error: error.message,
          };
        }
      })
    );

    res.json(agentsWithStatus);
  } catch (error) {
    logger.error('Failed to fetch agents:', error);
    res.status(500).json({ error: 'Failed to fetch agents' });
  }
});

// Get agent with real data
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const agent = await prisma.agent.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
      include: {
        tasks: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
        project: true,
      },
    });

    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    // Get real orchestrator data
    const status = await realAgentOrchestrator.getRealAgentStatus(agent.id);
    const memory = await realAgentOrchestrator.getAgentMemory(agent.id);

    res.json({
      ...agent,
      realStatus: status,
      memory,
      isReal: true,
    });
  } catch (error) {
    logger.error('Failed to fetch agent:', error);
    res.status(500).json({ error: 'Failed to fetch agent' });
  }
});

// Execute real agent task
router.post('/:id/execute', authMiddleware, async (req, res) => {
  try {
    const { description, context, priority } = req.body;
    
    const agent = await prisma.agent.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });

    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    const task = {
      id: `task-${Date.now()}`,
      description,
      context: context || {},
      priority: priority || 'medium',
      dependencies: [],
    };

    const result = await realAgentOrchestrator.executeRealTask(agent.id, task);

    res.json({
      taskId: task.id,
      agentId: agent.id,
      result,
      executedAt: new Date(),
    });
  } catch (error) {
    logger.error('Failed to execute agent task:', error);
    res.status(500).json({ error: 'Failed to execute agent task' });
  }
});

// Update agent with real orchestration
router.patch('/:id',
  authMiddleware,
  validateRequest([
    body('name').optional().isString(),
    body('type').optional().isString(),
    body('status').optional().isString(),
    body('config').optional().isObject(),
  ]),
  async (req, res) => {
    try {
      const agent = await prisma.agent.update({
        where: {
          id: req.params.id,
          userId: req.user.id,
        },
        data: req.body,
      });

      // Update orchestrator configuration
      if (req.body.config) {
        await realAgentOrchestrator.updateAgentMemory(agent.id, req.body.config);
      }

      res.json({
        ...agent,
        updatedAt: new Date(),
        isReal: true,
      });
    } catch (error) {
      logger.error('Failed to update agent:', error);
      res.status(500).json({ error: 'Failed to update agent' });
    }
  }
);

// Delete agent
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await prisma.agent.delete({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });
    
    res.json({ message: 'Agent deleted successfully' });
  } catch (error) {
    logger.error('Failed to delete agent:', error);
    res.status(500).json({ error: 'Failed to delete agent' });
  }
});

// Execute autonomous workflow
router.post('/workflow/execute', authMiddleware, async (req, res) => {
  try {
    const { projectId, goal } = req.body;
    
    const result = await realAgentOrchestrator.executeAutonomousWorkflow(projectId, goal);
    
    res.json({
      workflowId: `workflow-${Date.now()}`,
      result,
      executedAt: new Date(),
    });
  } catch (error) {
    logger.error('Failed to execute workflow:', error);
    res.status(500).json({ error: 'Failed to execute workflow' });
  }
});

// Deploy agent to blockchain
router.post('/:id/deploy-blockchain', authMiddleware, async (req, res) => {
  try {
    const { network = 'local' } = req.body;
    
    const agent = await prisma.agent.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });

    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    const contractAddress = await web3Service.deployAIAgentContract(agent.id, network);
    
    res.json({
      agentId: agent.id,
      contractAddress,
      network,
      deployedAt: new Date(),
    });
  } catch (error) {
    logger.error('Failed to deploy agent to blockchain:', error);
    res.status(500).json({ error: 'Failed to deploy agent to blockchain' });
  }
});

// Get blockchain stats
router.get('/blockchain/stats', authMiddleware, async (req, res) => {
  try {
    const stats = await web3Service.getRealBlockchainStats();
    res.json(stats);
  } catch (error) {
    logger.error('Failed to fetch blockchain stats:', error);
    res.status(500).json({ error: 'Failed to fetch blockchain stats' });
  }
});

// Get agent blockchain interactions
router.get('/:id/blockchain', authMiddleware, async (req, res) => {
  try {
    const agent = await prisma.agent.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });

    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    const contractAddress = (agent.config as any)?.contractAddress;
    const network = (agent.config as any)?.network || 'local';
    
    if (!contractAddress) {
      return res.json({
        hasContract: false,
        agentId: agent.id,
      });
    }

    const balance = await web3Service.getContractBalance(contractAddress, network);
    const transactions = await web3Service.getTransactionHistory(contractAddress, network);

    res.json({
      hasContract: true,
      agentId: agent.id,
      contractAddress,
      network,
      balance,
      transactions,
    });
  } catch (error) {
    logger.error('Failed to fetch agent blockchain data:', error);
    res.status(500).json({ error: 'Failed to fetch agent blockchain data' });
  }
});

export default router;