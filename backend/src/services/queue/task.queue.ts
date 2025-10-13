import { Queue, Worker, Job } from 'bullmq';
import { Redis } from 'ioredis';
import { config } from '@/config/env';
import { logger } from '@/config/logger';
import { prisma } from '@/config/database';
import { OpenAIService } from './openai.service';
import { AnthropicService } from './anthropic.service';

const connection = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
});

export class TaskQueue {
  private static instance: TaskQueue;
  private taskQueue: Queue;
  private worker: Worker;

  private constructor() {
    this.taskQueue = new Queue('tasks', { connection });
    this.worker = new Worker('tasks', this.processTask.bind(this), { connection });

    this.worker.on('completed', (job) => {
      logger.info(`Task ${job.id} completed`);
    });

    this.worker.on('failed', (job, err) => {
      logger.error(`Task ${job.id} failed:`, err);
    });
  }

  static getInstance(): TaskQueue {
    if (!TaskQueue.instance) {
      TaskQueue.instance = new TaskQueue();
    }
    return TaskQueue.instance;
  }

  async addTask(taskId: string, agentId: string, input: any): Promise<Job> {
    return this.taskQueue.add('execute-task', {
      taskId,
      agentId,
      input,
    });
  }

  private async processTask(job: Job) {
    const { taskId, agentId, input } = job.data;

    try {
      // Get task and agent details
      const task = await prisma.task.findUnique({
        where: { id: taskId },
        include: { agent: true, project: true },
      });

      if (!task) {
        throw new Error('Task not found');
      }

      if (!task.agent) {
        throw new Error('Agent not found');
      }

      // Update task status
      await prisma.task.update({
        where: { id: taskId },
        data: { status: 'IN_PROGRESS', startedAt: new Date() },
      });

      // Execute based on agent role and capabilities
      const result = await this.executeTask(task, input);

      // Update task with result
      const actualTime = Math.floor((Date.now() - task.startedAt!.getTime()) / 60000);
      
      await prisma.task.update({
        where: { id: taskId },
        data: {
          status: 'COMPLETED',
          progress: 100,
          completedAt: new Date(),
          actualTime,
          result,
        },
      });

      // Update agent statistics
      await prisma.agent.update({
        where: { id: agentId },
        data: {
          tasksCompleted: { increment: 1 },
          performance: {
            increment: Math.random() * 0.1 - 0.05, // Small random adjustment
          },
        },
      });

      return result;
    } catch (error) {
      await prisma.task.update({
        where: { id: taskId },
        data: {
          status: 'FAILED',
          error: error instanceof Error ? error.message : 'Unknown error',
          completedAt: new Date(),
        },
      });

      throw error;
    }
  }

  private async executeTask(task: any, input: any): Promise<any> {
    const agentRole = task.agent.role.toLowerCase();
    
    switch (agentRole) {
      case 'project_manager':
        return await this.executeProjectManagerTask(task, input);
      
      case 'solidity_developer':
        return await this.executeSolidityTask(task, input);
      
      case 'frontend_developer':
        return await this.executeFrontendTask(task, input);
      
      case 'backend_developer':
        return await this.executeBackendTask(task, input);
      
      case 'ux_ui_designer':
        return await this.executeUXUITask(task, input);
      
      case 'financial_analyst':
        return await this.executeFinancialTask(task, input);
      
      case 'marketing_specialist':
        return await this.executeMarketingTask(task, input);
      
      case 'data_analyst':
        return await this.executeDataAnalysisTask(task, input);
      
      case 'devops_engineer':
        return await this.executeDevOpsTask(task, input);
      
      case 'dao_architect':
        return await this.executeDAOArchitectTask(task, input);
      
      case 'smart_contract_auditor':
        return await this.executeSmartContractAuditTask(task, input);
      
      default:
        return await this.executeGenericTask(task, input);
    }
  }

  private async executeProjectManagerTask(task: any, input: any): Promise<any> {
    const openai = OpenAIService.getInstance();
    const plan = await openai.generateStrategicPlan(
      task.title,
      task.description
    );
    
    return {
      type: 'strategic_plan',
      plan,
      generatedAt: new Date().toISOString(),
    };
  }

  private async executeSolidityTask(task: any, input: any): Promise<any> {
    const openai = OpenAIService.getInstance();
    const code = await openai.generateCode(
      `Create a Solidity smart contract for: ${task.title}`,
      'solidity'
    );
    
    return {
      type: 'solidity_code',
      code,
      compiled: false,
      tested: false,
    };
  }

  private async executeFrontendTask(task: any, input: any): Promise<any> {
    const openai = OpenAIService.getInstance();
    const code = await openai.generateCode(
      `Create a React component for: ${task.title}`,
      'typescript'
    );
    
    return {
      type: 'frontend_code',
      code,
      framework: 'react',
      tested: false,
    };
  }

  private async executeBackendTask(task: any, input: any): Promise<any> {
    const openai = OpenAIService.getInstance();
    const code = await openai.generateCode(
      `Create an Express.js endpoint for: ${task.title}`,
      'typescript'
    );
    
    return {
      type: 'backend_code',
      code,
      framework: 'express',
      tested: false,
    };
  }

  private async executeUXUITask(task: any, input: any): Promise<any> {
    const openai = OpenAIService.getInstance();
    const design = await openai.generateResponse(
      `Create a UX/UI design specification for: ${task.title}`,
      { systemPrompt: 'You are a UX/UI designer. Create detailed design specifications with user flows, wireframes, and styling guidelines.' }
    );
    
    return {
      type: 'ui_design',
      design,
      wireframes: [],
      components: [],
    };
  }

  private async executeFinancialTask(task: any, input: any): Promise<any> {
    const anthropic = AnthropicService.getInstance();
    const analysis = await anthropic.analyzeRequirements(
      `Financial analysis for: ${task.title}`,
      { model: 'claude-3-sonnet-20240229' }
    );
    
    return {
      type: 'financial_analysis',
      analysis,
      risk_assessment: {},
      recommendations: [],
    };
  }

  private async executeMarketingTask(task: any, input: any): Promise<any> {
    const anthropic = AnthropicService.getInstance();
    const strategy = await anthropic.generateResponse(
      `Marketing strategy for: ${task.title}`,
      { systemPrompt: 'You are a marketing specialist. Create comprehensive marketing strategies with target audience analysis, channels, and KPIs.' }
    );
    
    return {
      type: 'marketing_strategy',
      strategy,
      target_audience: {},
      channels: [],
      kpis: [],
    };
  }

  private async executeDataAnalysisTask(task: any, input: any): Promise<any> {
    const anthropic = AnthropicService.getInstance();
    const analysis = await anthropic.generateResponse(
      `Data analysis plan for: ${task.title}`,
      { systemPrompt: 'You are a data analyst. Create detailed data analysis plans with methodologies, tools, and expected insights.' }
    );
    
    return {
      type: 'data_analysis',
      analysis,
      methodology: {},
      tools: [],
      insights: [],
    };
  }

  private async executeDevOpsTask(task: any, input: any): Promise<any> {
    const openai = OpenAIService.getInstance();
    const config = await openai.generateCode(
      `Create DevOps configuration for: ${task.title}`,
      'yaml'
    );
    
    return {
      type: 'devops_config',
      config,
      deployment_strategy: {},
      monitoring_setup: {},
    };
  }

  private async executeDAOArchitectTask(task: any, input: any): Promise<any> {
    const anthropic = AnthropicService.getInstance();
    const architecture = await anthropic.generateResponse(
      `DAO architecture for: ${task.title}`,
      { systemPrompt: 'You are a DAO architect. Design comprehensive decentralized autonomous organization structures with governance mechanisms.' }
    );
    
    return {
      type: 'dao_architecture',
      architecture,
      governance_model: {},
      tokenomics: {},
    };
  }

  private async executeSmartContractAuditTask(task: any, input: any): Promise<any> {
    const anthropic = AnthropicService.getInstance();
    const audit = await anthropic.reviewCode(
      input.code || '',
      'Smart contract audit for security vulnerabilities and best practices'
    );
    
    return {
      type: 'smart_contract_audit',
      audit,
      vulnerabilities: [],
      recommendations: [],
      security_score: 0,
    };
  }

  private async executeGenericTask(task: any, input: any): Promise<any> {
    const openai = OpenAIService.getInstance();
    const result = await openai.generateResponse(
      `Complete task: ${task.title}`,
      { systemPrompt: 'You are a versatile AI agent. Complete the given task efficiently and provide detailed results.' }
    );
    
    return {
      type: 'generic_result',
      result,
      metadata: {},
    };
  }

  async getQueueStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }> {
    return {
      waiting: await this.taskQueue.getWaitingCount(),
      active: await this.taskQueue.getActiveCount(),
      completed: await this.taskQueue.getCompletedCount(),
      failed: await this.taskQueue.getFailedCount(),
      delayed: await this.taskQueue.getDelayedCount(),
    };
  }

  async pause(): Promise<void> {
    await this.worker.pause();
  }

  async resume(): Promise<void> {
    await this.worker.resume();
  }

  async clean(completed = true, failed = true, delayed = true): Promise<void> {
    if (completed) await this.taskQueue.clean(0, 0, 'completed');
    if (failed) await this.taskQueue.clean(0, 0, 'failed');
    if (delayed) await this.taskQueue.clean(0, 0, 'delayed');
  }
}