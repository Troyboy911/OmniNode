import OpenAI from 'openai';
import { config } from '@/config/env';
import { logger } from '@/config/logger';
import { AgentConfig } from '@/types';

export class OpenAIService {
  private client: OpenAI;
  private static instance: OpenAIService;

  private constructor() {
    this.client = new OpenAI({
      apiKey: config.ai.openaiApiKey,
    });
  }

  static getInstance(): OpenAIService {
    if (!OpenAIService.instance) {
      OpenAIService.instance = new OpenAIService();
    }
    return OpenAIService.instance;
  }

  async generateResponse(
    prompt: string,
    config: AgentConfig = {}
  ): Promise<string> {
    try {
      const response = await this.client.chat.completions.create({
        model: config.model || 'gpt-4',
        messages: [
          {
            role: 'system',
            content: config.systemPrompt || 'You are a helpful AI assistant.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: config.temperature || 0.7,
        max_tokens: config.maxTokens || 1000,
      });

      return response.choices[0]?.message?.content || '';
    } catch (error) {
      logger.error('OpenAI API error:', error);
      throw new Error('Failed to generate response from OpenAI');
    }
  }

  async generateCode(
    prompt: string,
    language: string = 'typescript',
    config: AgentConfig = {}
  ): Promise<string> {
    try {
      const response = await this.client.chat.completions.create({
        model: config.model || 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are an expert ${language} developer. Generate clean, well-documented code.`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: config.temperature || 0.3,
        max_tokens: config.maxTokens || 2000,
      });

      return response.choices[0]?.message?.content || '';
    } catch (error) {
      logger.error('OpenAI code generation error:', error);
      throw new Error('Failed to generate code from OpenAI');
    }
  }

  async analyzeCode(
    code: string,
    config: AgentConfig = {}
  ): Promise<{
    issues: string[];
    suggestions: string[];
    complexity: number;
  }> {
    try {
      const response = await this.client.chat.completions.create({
        model: config.model || 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a code reviewer. Analyze the provided code for issues, suggestions, and complexity.',
          },
          {
            role: 'user',
            content: `Analyze this code:\n\n${code}\n\nProvide:
1. Issues (array of strings)
2. Suggestions (array of strings)
3. Complexity score (1-10)`,
          },
        ],
        temperature: 0.3,
        max_tokens: 1000,
      });

      const content = response.choices[0]?.message?.content || '';
      
      // Parse the response
      const lines = content.split('\n');
      const issues: string[] = [];
      const suggestions: string[] = [];
      let complexity = 5;

      let currentSection = '';
      for (const line of lines) {
        if (line.toLowerCase().includes('issues')) {
          currentSection = 'issues';
          continue;
        } else if (line.toLowerCase().includes('suggestions')) {
          currentSection = 'suggestions';
          continue;
        } else if (line.toLowerCase().includes('complexity')) {
          currentSection = 'complexity';
          const match = line.match(/(\d+)/);
          if (match) complexity = parseInt(match[1]);
          continue;
        }

        if (currentSection === 'issues' && line.trim()) {
          issues.push(line.trim().replace(/^[-*]\s*/, ''));
        } else if (currentSection === 'suggestions' && line.trim()) {
          suggestions.push(line.trim().replace(/^[-*]\s*/, ''));
        }
      }

      return { issues, suggestions, complexity };
    } catch (error) {
      logger.error('OpenAI code analysis error:', error);
      throw new Error('Failed to analyze code with OpenAI');
    }
  }

  async createEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.client.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
      });

      return response.data[0].embedding;
    } catch (error) {
      logger.error('OpenAI embedding error:', error);
      throw new Error('Failed to create embedding');
    }
  }

  async generateStrategicPlan(
    objective: string,
    context: string = ''
  ): Promise<{
    objective: string;
    breakdown: string[];
    requiredAgents: string[];
    estimatedTime: number;
  }> {
    try {
      const response = await this.client.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are a strategic planning AI. Create detailed project plans with clear objectives, task breakdowns, required agent types, and time estimates.`,
          },
          {
            role: 'user',
            content: `Create a strategic plan for: ${objective}\n\nContext: ${context}\n\nReturn JSON format:
{
  "objective": "string",
  "breakdown": ["task1", "task2", ...],
  "requiredAgents": ["PROJECT_MANAGER", "DEVELOPER", ...],
  "estimatedTime": number (in hours)
}`,
          },
        ],
        temperature: 0.5,
        max_tokens: 1000,
      });

      const content = response.choices[0]?.message?.content || '';
      return JSON.parse(content);
    } catch (error) {
      logger.error('OpenAI strategic planning error:', error);
      throw new Error('Failed to generate strategic plan');
    }
  }
}