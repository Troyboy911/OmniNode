import { PrismaClient } from '@prisma/client';
import { OpenAIService } from './openai.service';
import { AnthropicService } from './anthropic.service';
import { ClaudeService } from './claude.service';
import { OllamaService } from './ollama.service';
import { logger } from '../../config/logger';

const prisma = new PrismaClient();

interface AgentConfig {
  name: string;
  type: 'research' | 'code' | 'creative' | 'analysis' | 'general';
  model: string;
  provider: 'openai' | 'anthropic' | 'google' | 'ollama';
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  tools: string[];
}

interface Task {
  id: string;
  description: string;
  context: any;
  priority: 'low' | 'medium' | 'high';
  dependencies: string[];
  maxIterations: number;
}

interface AgentResponse {
  content: string;
  reasoning: string;
  confidence: number;
  nextActions: string[];
  metadata: any;
}

export class RealAgentOrchestrator {
  private openaiService: OpenAIService;
  private anthropicService: AnthropicService;
  private claudeService: ClaudeService;
  private ollamaService: OllamaService;

  constructor() {
    this.openaiService = new OpenAIService();
    this.anthropicService = new AnthropicService();
    this.claudeService = new ClaudeService();
    this.ollamaService = new OllamaService();
  }

  async createRealAgent(config: AgentConfig) {
    const agent = await prisma.agent.create({
      data: {
        name: config.name,
        type: config.type,
        projectId: 'system', // Will be dynamic
        config: {
          model: config.model,
          provider: config.provider,
          systemPrompt: config.systemPrompt,
          temperature: config.temperature,
          maxTokens: config.maxTokens,
          tools: config.tools,
        },
        status: 'idle',
      },
    });

    return agent;
  }

  async executeRealTask(agentId: string, task: Task): Promise<AgentResponse> {
    const agent = await prisma.agent.findUnique({ where: { id: agentId } });
    if (!agent) throw new Error('Agent not found');

    const provider = this.getProvider(agent.config.provider);
    
    const systemPrompt = this.buildSystemPrompt(agent, task);
    
    const response = await provider.generate({
      prompt: task.description,
      systemPrompt,
      model: agent.config.model,
      temperature: agent.config.temperature,
      maxTokens: agent.config.maxTokens,
    });

    const reasoning = await this.extractReasoning(response.content);
    const confidence = await this.calculateConfidence(response.content, task);
    const nextActions = await this.determineNextActions(response.content, task);

    const agentResponse: AgentResponse = {
      content: response.content,
      reasoning,
      confidence,
      nextActions,
      metadata: {
        model: response.model,
        tokens: response.tokens,
        timestamp: new Date(),
      },
    };

    // Save to database
    await prisma.task.create({
      data: {
        title: task.description.substring(0, 50),
        description: task.description,
        agentId,
        status: 'completed',
        priority: task.priority,
        result: agentResponse,
      },
    });

    return agentResponse;
  }

  async coordinateMultiAgentWorkflow(tasks: Task[], agents: string[]) {
    const results = [];
    const dependencies = new Map<string, string[]>();

    // Build dependency graph
    tasks.forEach(task => {
      dependencies.set(task.id, task.dependencies);
    });

    // Execute tasks in dependency order
    const completedTasks = new Set<string>();
    
    for (const task of tasks) {
      // Check dependencies
      const deps = dependencies.get(task.id) || [];
      const allDepsCompleted = deps.every(dep => completedTasks.has(dep));
      
      if (!allDepsCompleted) {
        await this.waitForDependencies(deps, completedTasks);
      }

      // Find best agent for this task
      const bestAgent = await this.selectBestAgent(task, agents);
      
      // Execute task
      const result = await this.executeRealTask(bestAgent, task);
      results.push({
        taskId: task.id,
        agentId: bestAgent,
        result,
      });

      completedTasks.add(task.id);
      
      // Emit real-time updates
      this.emitProgressUpdate(task.id, result);
    }

    return results;
  }

  private async selectBestAgent(task: Task, availableAgents: string[]): Promise<string> {
    // Real agent selection based on task type and agent capabilities
    const agents = await prisma.agent.findMany({
      where: { id: { in: availableAgents } },
    });

    const scores = await Promise.all(
      agents.map(async (agent) => {
        const score = await this.calculateAgentSuitability(agent, task);
        return { agentId: agent.id, score };
      })
    );

    return scores.sort((a, b) => b.score - a.score)[0].agentId;
  }

  private async calculateAgentSuitability(agent: any, task: Task): Promise<number> {
    const prompt = `
    Evaluate how suitable this agent is for the task:
    
    Agent Type: ${agent.type}
    Agent Config: ${JSON.stringify(agent.config)}
    Task: ${task.description}
    
    Return a JSON object with a "suitability" score from 0-100.
    Consider expertise, tools available, and task requirements.
    `;

    const response = await this.openaiService.generate({
      prompt,
      model: 'gpt-4',
      temperature: 0.1,
    });

    try {
      const parsed = JSON.parse(response.content);
      return parsed.suitability || 50;
    } catch {
      return 50;
    }
  }

  private async extractReasoning(content: string): Promise<string> {
    const prompt = `Extract the reasoning/logic from this AI response: ${content}`;
    
    const response = await this.openaiService.generate({
      prompt,
      model: 'gpt-3.5-turbo',
      temperature: 0.1,
    });

    return response.content;
  }

  private async calculateConfidence(content: string, task: Task): Promise<number> {
    const prompt = `
    Rate the confidence level (0-100) of this AI response for the given task:
    
    Response: ${content}
    Task: ${task.description}
    
    Consider accuracy, completeness, and relevance.
    Return just a number.
    `;

    const response = await this.openaiService.generate({
      prompt,
      model: 'gpt-3.5-turbo',
      temperature: 0.1,
    });

    const confidence = parseInt(response.content.trim());
    return isNaN(confidence) ? 70 : Math.max(0, Math.min(100, confidence));
  }

  private async determineNextActions(content: string, task: Task): Promise<string[]> {
    const prompt = `
    Based on this AI response and task, what should be the next actions?
    
    Response: ${content}
    Task: ${task.description}
    
    Return a JSON array of 3-5 specific next actions.
    `;

    const response = await this.openaiService.generate({
      prompt,
      model: 'gpt-3.5-turbo',
      temperature: 0.3,
    });

    try {
      const parsed = JSON.parse(response.content);
      return Array.isArray(parsed) ? parsed.slice(0, 5) : ['Continue processing'];
    } catch {
      return ['Review and refine'];
    }
  }

  private getProvider(provider: string) {
    switch (provider) {
      case 'openai':
        return this.openaiService;
      case 'anthropic':
        return this.anthropicService;
      case 'claude':
        return this.claudeService;
      case 'ollama':
        return this.ollamaService;
      default:
        return this.openaiService;
    }
  }

  private buildSystemPrompt(agent: any, task: Task): string {
    return `
    You are ${agent.name}, a ${agent.type} AI agent.
    
    Your task: ${task.description}
    Context: ${JSON.stringify(task.context)}
    Priority: ${task.priority}
    
    Behaviors:
    - Think step by step
    - Provide clear reasoning
    - Suggest next actions
    - Be honest about limitations
    - Focus on actionable insights
    
    Tools available: ${agent.config.tools?.join(', ') || 'none'}
    
    Respond with structured output including your reasoning and next steps.
    `;
  }

  private async waitForDependencies(dependencies: string[], completedTasks: Set<string>) {
    const checkInterval = 1000; // 1 second
    const maxWait = 30000; // 30 seconds

    let waited = 0;
    while (waited < maxWait) {
      const allCompleted = dependencies.every(dep => completedTasks.has(dep));
      if (allCompleted) break;
      
      await new Promise(resolve => setTimeout(resolve, checkInterval));
      waited += checkInterval;
    }

    if (waited >= maxWait) {
      throw new Error(`Timeout waiting for dependencies: ${dependencies.join(', ')}`);
    }
  }

  private emitProgressUpdate(taskId: string, result: AgentResponse) {
    // Emit real WebSocket updates
    const io = require('../services/websocket.service').io;
    if (io) {
      io.emit('task:progress', {
        taskId,
        progress: 100,
        result,
        timestamp: new Date(),
      });
    }
  }

  async getAgentMemory(agentId: string): Promise<any[]> {
    return prisma.task.findMany({
      where: { agentId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async updateAgentMemory(agentId: string, memory: any) {
    await prisma.agent.update({
      where: { id: agentId },
      data: {
        config: {
          ...this.getAgentConfig(agentId),
          memory: memory,
        },
      },
    });
  }

  private async getAgentConfig(agentId: string): Promise<any> {
    const agent = await prisma.agent.findUnique({ where: { id: agentId } });
    return agent?.config || {};
  }

  async executeAutonomousWorkflow(projectId: string, goal: string) {
    const agents = await prisma.agent.findMany({ where: { projectId } });
    
    // Break down goal into tasks
    const tasks = await this.decomposeGoal(goal, agents);
    
    // Execute with real coordination
    const results = await this.coordinateMultiAgentWorkflow(tasks, agents.map(a => a.id));
    
    // Generate summary
    const summary = await this.generateWorkflowSummary(results);
    
    return {
      goal,
      tasks: results.length,
      agents: agents.length,
      summary,
      results,
    };
  }

  private async decomposeGoal(goal: string, agents: any[]): Promise<Task[]> {
    const prompt = `
    Break down this goal into specific, actionable tasks for AI agents:
    
    Goal: ${goal}
    Available agents: ${agents.map(a => `${a.name} (${a.type})`).join(', ')}
    
    Create 3-7 specific tasks with clear descriptions and priorities.
    Return as JSON array of task objects.
    `;

    const response = await this.openaiService.generate({
      prompt,
      model: 'gpt-4',
      temperature: 0.3,
    });

    try {
      const tasks = JSON.parse(response.content);
      return tasks.map((task: any, index: number) => ({
        id: `task-${index}-${Date.now()}`,
        description: task.description,
        context: task.context || {},
        priority: task.priority || 'medium',
        dependencies: task.dependencies || [],
        maxIterations: task.maxIterations || 5,
      }));
    } catch (error) {
      return [{
        id: `task-goal-${Date.now()}`,
        description: goal,
        context: {},
        priority: 'high',
        dependencies: [],
        maxIterations: 3,
      }];
    }
  }

  private async generateWorkflowSummary(results: any[]): Promise<string> {
    const completedTasks = results.filter(r => r.result.confidence > 70);
    
    const prompt = `
    Generate a summary of this multi-agent workflow execution:
    
    Total tasks: ${results.length}
    Completed successfully: ${completedTasks.length}
    Average confidence: ${completedTasks.reduce((sum, r) => sum + r.result.confidence, 0) / completedTasks.length || 0}%
    
    Results: ${JSON.stringify(results.map(r => ({ task: r.taskId, confidence: r.result.confidence })))}
    
    Provide a concise summary of the workflow execution.
    `;

    const response = await this.openaiService.generate({
      prompt,
      model: 'gpt-3.5-turbo',
      temperature: 0.5,
    });

    return response.content;
  }

  async getRealAgentStatus(agentId: string): Promise<{
    status: 'idle' | 'running' | 'error' | 'completed';
    currentTask?: string;
    lastActivity: Date;
    performance: {
      totalTasks: number;
      avgConfidence: number;
      avgResponseTime: number;
    };
  }> {
    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      include: {
        tasks: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!agent) throw new Error('Agent not found');

    const recentTasks = agent.tasks || [];
    const currentTask = recentTasks.find(t => t.status === 'in_progress');
    
    const performance = {
      totalTasks: recentTasks.length,
      avgConfidence: recentTasks.reduce((sum, t) => sum + (t.result?.confidence || 0), 0) / recentTasks.length || 0,
      avgResponseTime: 0, // Calculate from timestamps
    };

    return {
      status: currentTask ? 'running' : 'idle',
      currentTask: currentTask?.title,
      lastActivity: agent.updatedAt,
      performance,
    };
  }
}

export const realAgentOrchestrator = new RealAgentOrchestrator();