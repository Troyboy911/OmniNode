import { config } from './env';
import { AIModel } from '../services/ai/ai.types';

export interface AIProviderConfig {
  perplexity: {
    apiKey: string;
    baseURL: string;
    models: AIModel[];
  };
  openai: {
    apiKey: string;
    baseURL: string;
    models: AIModel[];
  };
  anthropic: {
    apiKey: string;
    baseURL: string;
    models: AIModel[];
  };
  ollama: {
    baseURL: string;
    defaultModel: string;
    models: AIModel[];
  };
}

export const aiProviderConfig: AIProviderConfig = {
  perplexity: {
    apiKey: config.ai.perplexityApiKey || process.env.PERPLEXITY_API_KEY || '',
    baseURL: 'https://api.perplexity.ai/v1',
    models: [
      {
        id: 'pplx-70b-online',
        name: 'Perplexity 70B Online',
        provider: 'perplexity',
        maxTokens: 32000,
        description: 'Perplexity model with online augmentation'
      }
    ]
  },
  openai: {
    apiKey: config.ai.openaiApiKey || process.env.OPENAI_API_KEY || '',
    baseURL: 'https://api.openai.com/v1',
    models: [
      { id: 'gpt-4', name: 'GPT-4', provider: 'openai', maxTokens: 8192, description: 'Most capable GPT model' },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'openai', maxTokens: 128000, description: 'Latest GPT-4 model with improved efficiency' },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'openai', maxTokens: 4096, description: 'Fast and cost-effective model' }
    ]
  },
  anthropic: {
    apiKey: config.ai.anthropicApiKey || process.env.ANTHROPIC_API_KEY || '',
    baseURL: 'https://api.anthropic.com/v1',
    models: [
      { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', provider: 'anthropic', maxTokens: 200000, description: 'Most powerful Claude model for complex tasks' }
    ]
  },
  ollama: {
    baseURL: 'http://localhost:11434',
    defaultModel: 'llama2',
    models: [
      { id: 'llama2', name: 'Llama 2', provider: 'ollama', maxTokens: 4096, description: 'Local Llama 2 model' }
    ]
  }
};