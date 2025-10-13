import Anthropic from '@anthropic-ai/sdk';
import { config } from '@/config/env';
import { logger } from '@/config/logger';
import { AgentConfig } from '@/types';

export class AnthropicService {
  private client: Anthropic;
  private static instance: AnthropicService;

  private constructor() {
    this.client = new Anthropic({
      apiKey: config.ai.anthropicApiKey,
    });
  }

  static getInstance(): AnthropicService {
    if (!AnthropicService.instance) {
      AnthropicService.instance = new AnthropicService();
    }
    return AnthropicService.instance;
  }

  async generateResponse(
    prompt: string,
    config: AgentConfig = {}
  ): Promise<string> {
    try {
      const response = await this.client.messages.create({
        model: config.model || 'claude-3-sonnet-20240229',
        max_tokens: config.maxTokens || 1000,
        temperature: config.temperature || 0.7,
        system: config.systemPrompt || 'You are a helpful AI assistant.',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      return response.content[0]?.type === 'text' 
        ? response.content[0].text 
        : '';
    } catch (error) {
      logger.error('Anthropic API error:', error);
      throw new Error('Failed to generate response from Anthropic');
    }
  }

  async analyzeRequirements(
    requirements: string,
    config: AgentConfig = {}
  ): Promise<{
    complexity: 'LOW' | 'MEDIUM' | 'HIGH';
    estimatedHours: number;
    requiredSkills: string[];
    risks: string[];
  }> {
    try {
      const response = await this.client.messages.create({
        model: config.model || 'claude-3-sonnet-20240229',
        max_tokens: 800,
        temperature: 0.3,
        system: 'You are a requirements analyst. Analyze software requirements and provide complexity assessment.',
        messages: [
          {
            role: 'user',
            content: `Analyze these requirements: ${requirements}\n\nProvide JSON response:
{
  "complexity": "LOW|MEDIUM|HIGH",
  "estimatedHours": number,
  "requiredSkills": ["skill1", "skill2", ...],
  "risks": ["risk1", "risk2", ...]
}`,
          },
        ],
      });

      const content = response.content[0]?.type === 'text' 
        ? response.content[0].text 
        : '';
      return JSON.parse(content);
    } catch (error) {
      logger.error('Anthropic requirements analysis error:', error);
      throw new Error('Failed to analyze requirements');
    }
  }

  async generateDocumentation(
    code: string,
    docType: 'api' | 'readme' | 'inline' = 'api',
    config: AgentConfig = {}
  ): Promise<string> {
    try {
      const response = await this.client.messages.create({
        model: config.model || 'claude-3-sonnet-20240229',
        max_tokens: 2000,
        temperature: 0.3,
        system: `You are a technical writer. Generate ${docType} documentation for the provided code.`,
        messages: [
          {
            role: 'user',
            content: `Generate ${docType} documentation for:\n\n${code}`,
          },
        ],
      });

      return response.content[0]?.type === 'text' 
        ? response.content[0].text 
        : '';
    } catch (error) {
      logger.error('Anthropic documentation error:', error);
      throw new Error('Failed to generate documentation');
    }
  }

  async reviewCode(
    code: string,
    context: string = '',
    config: AgentConfig = {}
  ): Promise<{
    summary: string;
    issues: { line: number; severity: string; message: string }[];
    suggestions: string[];
  }> {
    try {
      const response = await this.client.messages.create({
        model: config.model || 'claude-3-sonnet-20240229',
        max_tokens: 1500,
        temperature: 0.2,
        system: 'You are a senior code reviewer. Provide detailed code reviews with line numbers.',
        messages: [
          {
            role: 'user',
            content: `Review this code: ${context}\n\n${code}\n\nProvide JSON response:
{
  "summary": "string",
  "issues": [{"line": number, "severity": "low|medium|high", "message": "string"}],
  "suggestions": ["string1", "string2", ...]
}`,
          },
        ],
      });

      const content = response.content[0]?.type === 'text' 
        ? response.content[0].text 
        : '';
      return JSON.parse(content);
    } catch (error) {
      logger.error('Anthropic code review error:', error);
      throw new Error('Failed to review code');
    }
  }
}