import { PrismaClient } from '@prisma/client';
import { Server } from 'socket.io';
import { logger } from '@/config/logger';
import { OpenAI } from 'openai';

const prisma = new PrismaClient();

export interface TaskPlan {
  steps: TaskStep[];
  estimatedDuration: number;
  requiredTools: string[];
  dependencies: Record<string, string[]>;
}

export interface TaskStep {
  id: string;
  description: string;
  tool: string;
  parameters: any;
  dependsOn: string[];
  estimatedDuration: number;
}

export interface ExecutionContext {
  taskId: string;
  runId: string;
  io: Server;
  userId: string;
}

export class TaskOrchestrator {
  private io: Server | null = null;
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  setSocketIO(io: Server) {
    this.io = io;
  }

  /**
   * Classify task type using LLM
   */
  async classifyTask(taskDescription: string): Promise<string> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: `You are a task classifier. Classify the following task into one of these categories:
            - CODE: Writing, reviewing, or modifying code
            - DEPLOY: Deploying applications or infrastructure
            - SCRAPE: Web scraping or data extraction
            - ANALYSIS: Data analysis or research
            - AUTOMATION: Setting up automated workflows
            - INFRASTRUCTURE: Managing servers, containers, or cloud resources
            - SECURITY: Security audits, encryption, or access control
            - DOCUMENTATION: Writing or updating documentation
            
            Respond with ONLY the category name.`
          },
          {
            role: 'user',
            content: taskDescription
          }
        ],
        temperature: 0.3,
        max_tokens: 50
      });

      const category = response.choices[0]?.message?.content?.trim().toUpperCase() || 'CODE';
      logger.info(`Task classified as: ${category}`);
      return category;
    } catch (error: any) {
      logger.error('Error classifying task:', error);
      return 'CODE'; // Default fallback
    }
  }

  /**
   * Create execution plan using LLM
   */
  async planTask(taskDescription: string, category: string): Promise<TaskPlan> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: `You are a task planner. Break down the following ${category} task into specific steps.
            Available tools: fs (file system), http (HTTP requests), docker (containers), exec (shell commands), security (encryption/secrets).
            
            Respond with a JSON object containing:
            {
              "steps": [
                {
                  "id": "step-1",
                  "description": "Description of step",
                  "tool": "fs|http|docker|exec|security",
                  "parameters": {},
                  "dependsOn": [],
                  "estimatedDuration": 5000
                }
              ],
              "estimatedDuration": 30000,
              "requiredTools": ["fs", "http"]
            }`
          },
          {
            role: 'user',
            content: taskDescription
          }
        ],
        temperature: 0.5,
        max_tokens: 2000,
        response_format: { type: 'json_object' }
      });

      const planData = JSON.parse(response.choices[0]?.message?.content || '{}');
      
      return {
        steps: planData.steps || [],
        estimatedDuration: planData.estimatedDuration || 60000,
        requiredTools: planData.requiredTools || [],
        dependencies: this.buildDependencyGraph(planData.steps || [])
      };
    } catch (error: any) {
      logger.error('Error planning task:', error);
      // Return basic fallback plan
      return {
        steps: [{
          id: 'step-1',
          description: taskDescription,
          tool: 'exec',
          parameters: {},
          dependsOn: [],
          estimatedDuration: 60000
        }],
        estimatedDuration: 60000,
        requiredTools: ['exec'],
        dependencies: {}
      };
    }
  }

  /**
   * Build dependency graph from steps
   */
  private buildDependencyGraph(steps: TaskStep[]): Record<string, string[]> {
    const graph: Record<string, string[]> = {};
    
    steps.forEach(step => {
      graph[step.id] = step.dependsOn || [];
    });
    
    return graph;
  }

  /**
   * Execute task with real-time streaming
   */
  async executeTask(taskId: string, userId: string): Promise<void> {
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    // Create workflow run
    let workflowId = task.workflowId;
    if (!workflowId) {
      const workflow = await prisma.workflow.create({
        data: {
          name: `Auto-workflow for ${task.title}`,
          projectId: task.projectId,
          steps: [],
          status: 'ACTIVE'
        }
      });
      workflowId = workflow.id;
    }

    const run = await prisma.run.create({
      data: {
        workflowId,
        status: 'RUNNING',
        startedAt: new Date()
      }
    });

    const context: ExecutionContext = {
      taskId,
      runId: run.id,
      io: this.io!,
      userId
    };

    try {
      // Emit start event
      this.emitProgress(context, 'started', { taskId, runId: run.id });

      // Step 1: Classify
      this.emitProgress(context, 'classifying', { step: 'Classifying task type...' });
      const category = await this.classifyTask(task.description || task.title);
      
      await this.logExecution(run.id, 'INFO', `Task classified as: ${category}`, { category });

      // Step 2: Plan
      this.emitProgress(context, 'planning', { step: 'Creating execution plan...' });
      const plan = await this.planTask(task.description || task.title, category);
      
      await this.logExecution(run.id, 'INFO', `Plan created with ${plan.steps.length} steps`, { plan });

      // Step 3: Execute steps
      for (let i = 0; i < plan.steps.length; i++) {
        const step = plan.steps[i];
        
        this.emitProgress(context, 'executing', {
          step: `Step ${i + 1}/${plan.steps.length}: ${step.description}`,
          progress: ((i + 1) / plan.steps.length) * 100
        });

        await this.executeStep(step, context);
        await this.logExecution(run.id, 'INFO', `Completed: ${step.description}`, { step });
      }

      // Complete
      await prisma.run.update({
        where: { id: run.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          duration: Date.now() - run.startedAt.getTime()
        }
      });

      await prisma.task.update({
        where: { id: taskId },
        data: { status: 'COMPLETED' }
      });

      this.emitProgress(context, 'completed', { success: true });

    } catch (error: any) {
      logger.error(`Task execution failed: ${taskId}`, error);

      await prisma.run.update({
        where: { id: run.id },
        data: {
          status: 'FAILED',
          error: error.message,
          completedAt: new Date()
        }
      });

      await this.logExecution(run.id, 'ERROR', `Execution failed: ${error.message}`, { error: error.stack });

      this.emitProgress(context, 'failed', { error: error.message });
    }
  }

  /**
   * Execute individual step
   */
  private async executeStep(step: TaskStep, context: ExecutionContext): Promise<any> {
    // Simulate step execution (replace with actual tool calls)
    await new Promise(resolve => setTimeout(resolve, step.estimatedDuration));
    
    return {
      success: true,
      output: `Executed ${step.description}`
    };
  }

  /**
   * Log execution event
   */
  private async logExecution(runId: string, level: string, message: string, data?: any) {
    await prisma.executionLog.create({
      data: {
        runId,
        level,
        message,
        data: data || {},
        timestamp: new Date()
      }
    });
  }

  /**
   * Emit progress to Socket.IO
   */
  private emitProgress(context: ExecutionContext, event: string, data: any) {
    if (this.io) {
      this.io.to(`user:${context.userId}`).emit('task:progress', {
        taskId: context.taskId,
        runId: context.runId,
        event,
        data,
        timestamp: new Date()
      });
    }
  }

  /**
   * Get execution logs
   */
  async getLogs(runId: string, limit: number = 100) {
    return await prisma.executionLog.findMany({
      where: { runId },
      orderBy: { timestamp: 'asc' },
      take: limit
    });
  }

  /**
   * Cancel running task
   */
  async cancelTask(runId: string) {
    await prisma.run.update({
      where: { id: runId },
      data: {
        status: 'CANCELLED',
        completedAt: new Date()
      }
    });

    logger.info(`Task run cancelled: ${runId}`);
  }
}

export const orchestrator = new TaskOrchestrator();
