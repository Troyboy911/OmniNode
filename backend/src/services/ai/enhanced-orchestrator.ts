import { config } from '../../config';
import { OpenAIService } from './openai.service';
import { ClaudeService } from './claude.service';
import { OllamaService } from './ollama.service';
import { AIRequest, AIResponse, AIModel } from './ai.types';
import { logger } from '../../config/logger';

export class EnhancedAIOrchestrator {
  private openaiService: OpenAIService;
  private claudeService: ClaudeService;
  private ollamaService: OllamaService;
  private liveMode: boolean;

  constructor() {
    this.openaiService = new OpenAIService();
    this.claudeService = new ClaudeService();
    this.ollamaService = new OllamaService();
    this.liveMode = this.checkLiveMode();
  }

  private checkLiveMode(): boolean {
    return !!(
      config.ai.openaiApiKey ||
      config.ai.anthropicApiKey ||
      this.checkOllamaAvailability()
    );
  }

  private async checkOllamaAvailability(): Promise<boolean> {
    try {
      await this.ollamaService.listLocalModels();
      return true;
    } catch (error) {
      logger.warn('Ollama service not available:', error);
      return false;
    }
  }

  async generateResponse(request: AIRequest): Promise<AIResponse> {
    if (!this.liveMode) {
      logger.warn('Running in mock mode - no live AI APIs configured');
      return this.generateMockResponse(request);
    }

    const provider = request.provider || this.selectBestProvider(request);
    
    try {
      switch (provider) {
        case 'openai':
          if (config.ai.openaiApiKey) {
            return await this.openaiService.generate(request);
          }
          break;
        case 'claude':
        case 'anthropic':
          if (config.ai.anthropicApiKey) {
            return await this.claudeService.generate(request);
          }
          break;
        case 'ollama':
          return await this.ollamaService.generate(request);
        default:
          return await this.fallbackToAvailableProvider(request);
      }
    } catch (error) {
      logger.error(`Live API error for ${provider}:`, error);
      return this.fallbackToAvailableProvider(request);
    }

    return this.generateMockResponse(request);
  }

  private selectBestProvider(request: AIRequest): string {
    if (config.ai.openaiApiKey) return 'openai';
    if (config.ai.anthropicApiKey) return 'claude';
    return 'ollama';
  }

  private async fallbackToAvailableProvider(request: AIRequest): Promise<AIResponse> {
    if (config.ai.openaiApiKey) {
      return await this.openaiService.generate(request);
    }
    if (config.ai.anthropicApiKey) {
      return await this.claudeService.generate(request);
    }
    if (this.checkOllamaAvailability()) {
      return await this.ollamaService.generate(request);
    }
    return this.generateMockResponse(request);
  }

  private generateMockResponse(request: AIRequest): AIResponse {
    const mockResponses = {
      'generate': `Mock AI Response: ${request.prompt?.substring(0, 100)}...`,
      'chat': 'Mock AI Chat Response: I understand your message and I\'m ready to help!',
      'analyze': 'Mock Analysis: File appears to be a valid document with standard formatting.',
      'summarize': 'Mock Summary: This document contains relevant information that has been processed successfully.',
      'extract': 'Mock Extracted Data: Key information has been identified and structured for further processing.',
      'transform': 'Mock Transformation: Content has been successfully transformed according to specifications.'
    };

    const operation = request.operation || 'generate';
    const response = mockResponses[operation as keyof typeof mockResponses] || mockResponses.generate;

    return {
      content: response,
      tokens: {
        prompt: Math.floor((request.prompt?.length || 0) / 4),
        completion: Math.floor(response.length / 4),
        total: Math.floor(((request.prompt?.length || 0) + response.length) / 4)
      },
      model: request.model || 'mock-model',
      usage: {
        prompt_tokens: Math.floor((request.prompt?.length || 0) / 4),
        completion_tokens: Math.floor(response.length / 4),
        total_tokens: Math.floor(((request.prompt?.length || 0) + response.length) / 4)
      }
    };
  }

  async chat(messages: Array<{ role: string; content: string }>, model?: string): Promise<AIResponse> {
    const request: AIRequest = {
      messages,
      model,
      operation: 'chat'
    };
    return this.generateResponse(request);
  }

  async stream(request: AIRequest, onChunk: (chunk: string) => void): Promise<void> {
    if (!this.liveMode) {
      // Simulate streaming for mock mode
      const response = this.generateMockResponse(request);
      const chunks = response.content.split(' ');
      for (let i = 0; i < chunks.length; i++) {
        onChunk(chunks[i] + (i < chunks.length - 1 ? ' ' : ''));
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      return;
    }

    const provider = request.provider || this.selectBestProvider(request);
    
    try {
      switch (provider) {
        case 'openai':
          if (config.ai.openaiApiKey) {
            return await this.openaiService.stream(request, onChunk);
          }
          break;
        case 'claude':
        case 'anthropic':
          if (config.ai.anthropicApiKey) {
            return await this.claudeService.stream(request, onChunk);
          }
          break;
        case 'ollama':
          return await this.ollamaService.stream(request, onChunk);
      }
    } catch (error) {
      logger.error(`Streaming error for ${provider}:`, error);
    }

    // Fallback to mock streaming
    const response = this.generateMockResponse(request);
    const chunks = response.content.split(' ');
    for (let i = 0; i < chunks.length; i++) {
      onChunk(chunks[i] + (i < chunks.length - 1 ? ' ' : ''));
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }

  async getAvailableModels(): Promise<AIModel[]> {
    const models: AIModel[] = [];

    if (config.ai.openaiApiKey) {
      try {
        const openaiModels = await this.openaiService.getAvailableModels();
        models.push(...openaiModels);
      } catch (error) {
        logger.warn('Failed to fetch OpenAI models:', error);
      }
    }

    if (config.ai.anthropicApiKey) {
      try {
        const claudeModels = await this.claudeService.getAvailableModels();
        models.push(...claudeModels);
      } catch (error) {
        logger.warn('Failed to fetch Claude models:', error);
      }
    }

    try {
      const ollamaModels = await this.ollamaService.listLocalModels();
      models.push(...ollamaModels);
    } catch (error) {
      logger.warn('Failed to fetch Ollama models:', error);
    }

    if (models.length === 0) {
      // Return mock models if no live APIs available
      return [
        {
          id: 'gpt-4',
          name: 'GPT-4 (Mock)',
          provider: 'openai',
          maxTokens: 8192,
          description: 'Mock GPT-4 model for demonstration'
        },
        {
          id: 'claude-3-sonnet',
          name: 'Claude 3 Sonnet (Mock)',
          provider: 'anthropic',
          maxTokens: 200000,
          description: 'Mock Claude model for demonstration'
        },
        {
          id: 'llama2',
          name: 'Llama 2 (Mock)',
          provider: 'ollama',
          maxTokens: 4096,
          description: 'Mock Llama 2 model for demonstration'
        }
      ];
    }

    return models;
  }

  async checkProviderHealth(provider: string): Promise<{ status: string; latency?: number; error?: string }> {
    const startTime = Date.now();
    
    try {
      switch (provider) {
        case 'openai':
          if (config.ai.openaiApiKey) {
            await this.openaiService.getAvailableModels();
            return { status: 'healthy', latency: Date.now() - startTime };
          }
          break;
        case 'claude':
        case 'anthropic':
          if (config.ai.anthropicApiKey) {
            await this.claudeService.getAvailableModels();
            return { status: 'healthy', latency: Date.now() - startTime };
          }
          break;
        case 'ollama':
          await this.ollamaService.listLocalModels();
          return { status: 'healthy', latency: Date.now() - startTime };
      }
      
      return { status: 'not_configured' };
    } catch (error) {
      return { 
        status: 'unhealthy', 
        error: error.message,
        latency: Date.now() - startTime 
      };
    }
  }

  getLiveModeStatus(): boolean {
    return this.liveMode;
  }

  getActiveProviders(): string[] {
    const providers: string[] = [];
    
    if (config.ai.openaiApiKey) providers.push('openai');
    if (config.ai.anthropicApiKey) providers.push('claude');
    if (this.checkOllamaAvailability()) providers.push('ollama');
    
    return providers;
  }
}

export const enhancedAIOrchestrator = new EnhancedAIOrchestrator();