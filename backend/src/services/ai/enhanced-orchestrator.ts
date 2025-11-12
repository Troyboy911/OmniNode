import { PerplexityService } from './perplexity.service';
import { OpenAIService } from './openai.service';
import { AnthropicService } from './anthropic.service';
import { ClaudeService } from './claude.service';
import { OllamaService } from './ollama.service';
import { AIRequest, AIResponse } from './ai.types';
import { config } from '../../config/env';

export class EnhancedAIOrchestrator {
  private perplexityService: PerplexityService;
  private openaiService: OpenAIService;
  private anthropicService: AnthropicService;
  private claudeService: ClaudeService;
  private ollamaService: OllamaService;
  private defaultProvider: string;

  constructor() {
    this.perplexityService = new PerplexityService();
    this.openaiService = new OpenAIService();
    this.anthropicService = new AnthropicService();
    this.claudeService = new ClaudeService();
    this.ollamaService = new OllamaService();
    this.defaultProvider = 'perplexity';
  }

  private selectBestProvider(request: AIRequest): string {
    if (config.ai.perplexityApiKey) return 'perplexity';
    if (config.ai.openaiApiKey) return 'openai';
    if (config.ai.anthropicApiKey) return 'claude';
    return 'ollama';
  }

  private async generateAIResponse(request: AIRequest): Promise<AIResponse> {
    const provider = request.provider || this.selectBestProvider(request);
    switch (provider) {
      case 'perplexity':
        return await this.perplexityService.generate(request);
      case 'openai':
        return await this.openaiService.generate(request);
      case 'anthropic':
      case 'claude':
        return await this.claudeService.generate(request);
      case 'ollama':
        return await this.ollamaService.generate(request);
      default:
        throw new Error(`Unsupported AI provider: ${provider}`);
    }
  }
}