import { TaskQueue } from './queue/task.queue';
import { AgentMemoryService } from './memory/agent.memory';
import { OpenAIService } from './ai/openai.service';
import { AnthropicService } from './ai/anthropic.service';
import { prisma } from '@/config/database';
import { logger } from '@/config/logger';

export interface ExecutionContext {
  taskId: string;
  agentId: string;
  userId: string;
  input: any;
  projectContext: any;
  agentConfig: any;
}

export interface ExecutionResult {
  success: boolean;
  output: any;
  metrics: {
    executionTime: number;
    tokensUsed: number;
    cost: number;
  };
  errors?: string[];
}

export class AgentExecutionEngine {
  private static instance: AgentExecutionEngine;
  private memoryService: AgentMemoryService;
  private openaiService: OpenAIService;
  private anthropicService: AnthropicService;

  private constructor() {
    this.memoryService = AgentMemoryService.getInstance();
    this.openaiService = OpenAIService.getInstance();
    this.anthropicService = AnthropicService.getInstance();
  }

  static getInstance(): AgentExecutionEngine {
    if (!AgentExecutionEngine.instance) {
      AgentExecutionEngine.instance = new AgentExecutionEngine();
    }
    return AgentExecutionEngine.instance;
  }

  async executeTask(context: ExecutionContext): Promise<ExecutionResult> {
    const startTime = Date.now();
    const tokensUsed = 0;
    const cost = 0;

    try {
      // Get agent and project details
      const [agent, project] = await Promise.all([
        prisma.agent.findUnique({ where: { id: context.agentId } }),
        prisma.project.findUnique({ where: { id: context.projectContext?.projectId } }),
      ]);

      if (!agent) {
        throw new Error('Agent not found');
      }

      // Store task context in memory
      await this.memoryService.storeMemory(context.agentId, {
        key: `task_${context.taskId}`,
        value: {
          task: context.input,
          project: project,
          timestamp: new Date(),
        },
        type: 'short_term',
        metadata: {
          taskId: context.taskId,
          projectId: context.projectContext?.projectId,
        },
      });

      // Execute based on agent role
      const result = await this.executeWithAgent(agent, context);

      // Update agent performance
      const executionTime = Date.now() - startTime;
      
      await prisma.agent.update({
        where: { id: context.agentId },
        data: {
          performance: {
            increment: result.success ? 0.1 : -0.1,
          },
        },
      });

      // Store execution result in memory
      await this.memoryService.storeMemory(context.agentId, {
        key: `result_${context.taskId}`,
        value: {
          result,
          executionTime,
          timestamp: new Date(),
        },
        type: 'long_term',
        metadata: {
          taskId: context.taskId,
          success: result.success,
        },
      });

      return {
        ...result,
        metrics: {
          executionTime,
          tokensUsed,
          cost,
        },
      };
    } catch (error) {
      logger.error('Task execution error:', error);
      
      return {
        success: false,
        output: null,
        metrics: {
          executionTime: Date.now() - startTime,
          tokensUsed: 0,
          cost: 0,
        },
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  private async executeWithAgent(agent: any, context: ExecutionContext): Promise<ExecutionResult> {
    const role = agent.role.toLowerCase();
    
    switch (role) {
      case 'project_manager':
        return await this.executeProjectManager(agent, context);
      
      case 'solidity_developer':
        return await this.executeSolidityDeveloper(agent, context);
      
      case 'frontend_developer':
        return await this.executeFrontendDeveloper(agent, context);
      
      case 'backend_developer':
        return await this.executeBackendDeveloper(agent, context);
      
      case 'ux_ui_designer':
        return await this.executeUXUIDesigner(agent, context);
      
      case 'financial_analyst':
        return await this.executeFinancialAnalyst(agent, context);
      
      case 'marketing_specialist':
        return await this.executeMarketingSpecialist(agent, context);
      
      case 'data_analyst':
        return await this.executeDataAnalyst(agent, context);
      
      case 'devops_engineer':
        return await this.executeDevOpsEngineer(agent, context);
      
      case 'dao_architect':
        return await this.executeDAOArchitect(agent, context);
      
      case 'smart_contract_auditor':
        return await this.executeSmartContractAuditor(agent, context);
      
      default:
        return await this.executeGenericAgent(agent, context);
    }
  }

  private async executeProjectManager(agent: any, context: ExecutionContext): Promise<ExecutionResult> {
    try {
      const openai = OpenAIService.getInstance();
      
      // Get project context
      const project = await prisma.project.findUnique({
        where: { id: context.projectContext?.projectId },
        include: { tasks: true, milestones: true },
      });

      if (!project) {
        throw new Error('Project not found');
      }

      // Generate strategic plan
      const plan = await openai.generateStrategicPlan(
        context.input.title || context.input,
        context.input.description || project.description
      );

      // Store plan in memory
      await this.memoryService.storeMemory(agent.id, {
        key: `plan_${context.taskId}`,
        value: plan,
        type: 'long_term',
        metadata: { projectId: project.id },
      });

      return {
        success: true,
        output: plan,
        metrics: {
          executionTime: 0,
          tokensUsed: 0,
          cost: 0,
        },
      };
    } catch (error) {
      logger.error('Project manager execution error:', error);
      return {
        success: false,
        output: null,
        metrics: {
          executionTime: 0,
          tokensUsed: 0,
          cost: 0,
        },
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  private async executeSolidityDeveloper(agent: any, context: ExecutionContext): Promise<ExecutionResult> {
    try {
      const openai = OpenAIService.getInstance();
      
      // Generate Solidity code
      const code = await openai.generateCode(
        context.input.title || context.input,
        'solidity'
      );

      // Analyze code for issues
      const analysis = await openai.analyzeCode(code);

      // Store code and analysis in memory
      await this.memoryService.storeMemory(agent.id, {
        key: `code_${context.taskId}`,
        value: { code, analysis },
        type: 'long_term',
        metadata: { language: 'solidity' },
      });

      return {
        success: true,
        output: { code, analysis },
        metrics: {
          executionTime: 0,
          tokensUsed: 0,
          cost: 0,
        },
      };
    } catch (error) {
      logger.error('Solidity developer execution error:', error);
      return {
        success: false,
        output: null,
        metrics: {
          executionTime: 0,
          tokensUsed: 0,
          cost: 0,
        },
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  private async executeFrontendDeveloper(agent: any, context: ExecutionContext): Promise<ExecutionResult> {
    try {
      const openai = OpenAIService.getInstance();
      
      // Generate React/TypeScript code
      const code = await openai.generateCode(
        context.input.title || context.input,
        'typescript'
      );

      // Store code in memory
      await this.memoryService.storeMemory(agent.id, {
        key: `frontend_${context.taskId}`,
        value: { code, framework: 'react' },
        type: 'long_term',
        metadata: { language: 'typescript', framework: 'react' },
      });

      return {
        success: true,
        output: { code, framework: 'react' },
        metrics: {
          executionTime: 0,
          tokensUsed: 0,
          cost: 0,
        },
      };
    } catch (error) {
      logger.error('Frontend developer execution error:', error);
      return {
        success: false,
        output: null,
        metrics: {
          executionTime: 0,
          tokensUsed: 0,
          cost: 0,
        },
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  private async executeBackendDeveloper(agent: any, context: ExecutionContext): Promise<ExecutionResult> {
    try {
      const openai = OpenAIService.getInstance();
      
      // Generate Express.js code
      const code = await openai.generateCode(
        context.input.title || context.input,
        'typescript'
      );

      // Store code in memory
      await this.memoryService.storeMemory(agent.id, {
        key: `backend_${context.taskId}`,
        value: { code, framework: 'express' },
        type: 'long_term',
        metadata: { language: 'typescript', framework: 'express' },
      });

      return {
        success: true,
        output: { code, framework: 'express' },
        metrics: {
          executionTime: 0,
          tokensUsed: 0,
          cost: 0,
        },
      };
    } catch (error) {
      logger.error('Backend developer execution error:', error);
      return {
        success: false,
        output: null,
        metrics: {
          executionTime: 0,
          tokensUsed: 0,
          cost: 0,
        },
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  private async executeUXUIDesigner(agent: any, context: ExecutionContext): Promise<ExecutionResult> {
    try {
      const openai = OpenAIService.getInstance();
      
      // Generate UI design specifications
      const design = await openai.generateResponse(
        context.input.title || context.input,
        { systemPrompt: 'You are a UX/UI designer. Create detailed design specifications with user flows, wireframes, and styling guidelines.' }
      );

      // Store design in memory
      await this.memoryService.storeMemory(agent.id, {
        key: `design_${context.taskId}`,
        value: { design, type: 'ui_spec' },
        type: 'long_term',
        metadata: { designType: 'ui_spec' },
      });

      return {
        success: true,
        output: { design, type: 'ui_spec' },
        metrics: {
          executionTime: 0,
          tokensUsed: 0,
          cost: 0,
        },
      };
    } catch (error) {
      logger.error('UX/UI designer execution error:', error);
      return {
        success: false,
        output: null,
        metrics: {
          executionTime: 0,
          tokensUsed: 0,
          cost: 0,
        },
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  private async executeFinancialAnalyst(agent: any, context: ExecutionContext): Promise<ExecutionResult> {
    try {
      const anthropic = AnthropicService.getInstance();
      
      // Analyze financial requirements
      const analysis = await anthropic.analyzeRequirements(
        context.input.title || context.input,
        { model: 'claude-3-sonnet-20240229' }
      );

      // Store analysis in memory
      await this.memoryService.storeMemory(agent.id, {
        key: `financial_${context.taskId}`,
        value: { analysis, type: 'financial' },
        type: 'long_term',
        metadata: { analysisType: 'financial' },
      });

      return {
        success: true,
        output: { analysis, type: 'financial' },
        metrics: {
          executionTime: 0,
          tokensUsed: 0,
          cost: 0,
        },
      };
    } catch (error) {
      logger.error('Financial analyst execution error:', error);
      return {
        success: false,
        output: null,
        metrics: {
          executionTime: 0,
          tokensUsed: 0,
          cost: 0,
        },
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  private async executeMarketingSpecialist(agent: any, context: ExecutionContext): Promise<ExecutionResult> {
    try {
      const anthropic = AnthropicService.getInstance();
      
      // Generate marketing strategy
      const strategy = await anthropic.generateResponse(
        context.input.title || context.input,
        { systemPrompt: 'You are a marketing specialist. Create comprehensive marketing strategies with target audience analysis, channels, and KPIs.' }
      );

      // Store strategy in memory
      await this.memoryService.storeMemory(agent.id, {
        key: `marketing_${context.taskId}`,
        value: { strategy, type: 'marketing' },
        type: 'long_term',
        metadata: { strategyType: 'marketing' },
      });

      return {
        success: true,
        output: { strategy, type: 'marketing' },
        metrics: {
          executionTime: 0,
          tokensUsed: 0,
          cost: 0,
        },
      };
    } catch (error) {
      logger.error('Marketing specialist execution error:', error);
      return {
        success: false,
        output: null,
        metrics: {
          executionTime: 0,
          tokensUsed: 0,
          cost: 0,
        },
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  private async executeDataAnalyst(agent: any, context: ExecutionContext): Promise<ExecutionResult> {
    try {
      const anthropic = AnthropicService.getInstance();
      
      // Generate data analysis plan
      const analysis = await anthropic.generateResponse(
        context.input.title || context.input,
        { systemPrompt: 'You are a data analyst. Create detailed data analysis plans with methodologies, tools, and expected insights.' }
      );

      // Store analysis in memory
      await this.memoryService.storeMemory(agent.id, {
        key: `data_${context.taskId}`,
        value: { analysis, type: 'data_analysis' },
        type: 'long_term',
        metadata: { analysisType: 'data' },
      });

      return {
        success: true,
        output: { analysis, type: 'data_analysis' },
        metrics: {
          executionTime: 0,
          tokensUsed: 0,
          cost: 0,
        },
      };
    } catch (error) {
      logger.error('Data analyst execution error:', error);
      return {
        success: false,
        output: null,
        metrics: {
          executionTime: 0,
          tokensUsed: 0,
          cost: 0,
        },
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  private async executeDevOpsEngineer(agent: any, context: ExecutionContext): Promise<ExecutionResult> {
    try {
      const openai = OpenAIService.getInstance();
      
      // Generate DevOps configuration
      const config = await openai.generateCode(
        context.input.title || context.input,
        'yaml'
      );

      // Store configuration in memory
      await this.memoryService.storeMemory(agent.id, {
        key: `devops_${context.taskId}`,
        value: { config, type: 'devops' },
        type: 'long_term',
        metadata: { configType: 'devops' },
      });

      return {
        success: true,
        output: { config, type: 'devops' },
        metrics: {
          executionTime: 0,
          tokensUsed: 0,
          cost: 0,
        },
      };
    } catch (error) {
      logger.error('DevOps engineer execution error:', error);
      return {
        success: false,
        output: null,
        metrics: {
          executionTime: 0,
          tokensUsed: 0,
          cost: 0,
        },
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  private async executeDAOArchitect(agent: any, context: ExecutionContext): Promise<ExecutionResult> {
    try {
      const anthropic = AnthropicService.getInstance();
      
      // Generate DAO architecture
      const architecture = await anthropic.generateResponse(
        context.input.title || context.input,
        { systemPrompt: 'You are a DAO architect. Design comprehensive decentralized autonomous organization structures with governance mechanisms.' }
      );

      // Store architecture in memory
      await this.memoryService.storeMemory(agent.id, {
        key: `dao_${context.taskId}`,
        value: { architecture, type: 'dao' },
        type: 'long_term',
        metadata: { architectureType: 'dao' },
      });

      return {
        success: true,
        output: { architecture, type: 'dao' },
        metrics: {
          executionTime: 0,
          tokensUsed: 0,
          cost: 0,
        },
      };
    } catch (error) {
      logger.error('DAO architect execution error:', error);
      return {
        success: false,
        output: null,
        metrics: {
          executionTime: 0,
          tokensUsed: 0,
          cost: 0,
        },
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  private async executeSmartContractAuditor(agent: any, context: ExecutionContext): Promise<ExecutionResult> {
    try {
      const anthropic = AnthropicService.getInstance();
      
      // Perform smart contract audit
      const audit = await anthropic.reviewCode(
        context.input.code || '',
        'Smart contract audit for security vulnerabilities and best practices'
      );

      // Store audit in memory
      await this.memoryService.storeMemory(agent.id, {
        key: `audit_${context.taskId}`,
        value: { audit, type: 'audit' },
        type: 'long_term',
        metadata: { auditType: 'smart_contract' },
      });

      return {
        success: true,
        output: { audit, type: 'audit' },
        metrics: {
          executionTime: 0,
          tokensUsed: 0,
          cost: 0,
        },
      };
    } catch (error) {
      logger.error('Smart contract auditor execution error:', error);
      return {
        success: false,
        output: null,
        metrics: {
          executionTime: 0,
          tokensUsed: 0,
          cost: 0,
        },
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  private async executeGenericAgent(agent: any, context: ExecutionContext): Promise<ExecutionResult> {
    try {
      const openai = OpenAIService.getInstance();
      
      // Execute generic task
      const result = await openai.generateResponse(
        context.input.title || context.input,
        { systemPrompt: 'You are a versatile AI agent. Complete the given task efficiently and provide detailed results.' }
      );

      // Store result in memory
      await this.memoryService.storeMemory(agent.id, {
        key: `generic_${context.taskId}`,
        value: { result, type: 'generic' },
        type: 'short_term',
        metadata: { taskType: 'generic' },
      });

      return {
        success: true,
        output: { result, type: 'generic' },
        metrics: {
          executionTime: 0,
          tokensUsed: 0,
          cost: 0,
        },
      };
    } catch (error) {
      logger.error('Generic agent execution error:', error);
      return {
        success: false,
        output: null,
        metrics: {
          executionTime: 0,
          tokensUsed: 0,
          cost: 0,
        },
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  async getExecutionStats(agentId?: string): Promise<{
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    averageExecutionTime: number;
    agentStats?: any;
  }> {
    try {
      const where = agentId ? { agentId } : {};
      
      const [
        totalExecutions,
        successfulExecutions,
        failedExecutions,
        avgTime,
      ] = await Promise.all([
        prisma.task.count({ where }),
        prisma.task.count({ where: { ...where, status: 'COMPLETED' } }),
        prisma.task.count({ where: { ...where, status: 'FAILED' } }),
        prisma.task.aggregate({
          where: { ...where, actualTime: { not: null } },
          _avg: { actualTime: true },
        }),
      ]);

      return {
        totalExecutions,
        successfulExecutions,
        failedExecutions,
        averageExecutionTime: avgTime._avg.actualTime || 0,
      };
    } catch (error) {
      logger.error('Error getting execution stats:', error);
      throw error;
    }
  }
}