import { config } from './env';
import { AIModel } from '../services/ai/ai.types';

export interface AIProviderConfig {
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
  openai: {
    apiKey: config.ai.openaiApiKey || '',
    baseURL: 'https://api.openai.com/v1',
    models: [
      {
        id: 'gpt-4',
        name: 'GPT-4',
        provider: 'openai',
        maxTokens: 8192,
        description: 'Most capable GPT model'
      },
      {
        id: 'gpt-4-turbo',
        name: 'GPT-4 Turbo',
        provider: 'openai',
        maxTokens: 128000,
        description: 'Latest GPT-4 model with improved efficiency'
      },
      {
        id: 'gpt-3.5-turbo',
        name: 'GPT-3.5 Turbo',
        provider: 'openai',
        maxTokens: 4096,
        description: 'Fast and cost-effective model'
      },
      {
        id: 'gpt-4-turbo-preview',
        name: 'GPT-4 Turbo Preview',
        provider: 'openai',
        maxTokens: 128000,
        description: 'Preview of latest GPT-4 improvements'
      }
    ]
  },
  anthropic: {
    apiKey: config.ai.anthropicApiKey || '',
    baseURL: 'https://api.anthropic.com/v1',
    models: [
      {
        id: 'claude-3-opus-20240229',
        name: 'Claude 3 Opus',
        provider: 'anthropic',
        maxTokens: 200000,
        description: 'Most powerful Claude model for complex tasks'
      },
      {
        id: 'claude-3-sonnet-20240229',
        name: 'Claude 3 Sonnet',
        provider: 'anthropic',
        maxTokens: 200000,
        description: 'Balanced performance and speed'
      },
      {
        id: 'claude-3-haiku-20240307',
        name: 'Claude 3 Haiku',
        provider: 'anthropic',
        maxTokens: 200000,
        description: 'Fastest model for everyday tasks'
      }
    ]
  },
  ollama: {
    baseURL: config.ai.ollamaBaseURL || 'http://localhost:11434',
    defaultModel: config.ai.ollamaDefaultModel || 'llama2',
    models: [
      {
        id: 'llama2',
        name: 'Llama 2',
        provider: 'ollama',
        maxTokens: 4096,
        description: 'Open source large language model'
      },
      {
        id: 'llama2:13b',
        name: 'Llama 2 13B',
        provider: 'ollama',
        maxTokens: 4096,
        description: 'Larger Llama 2 model with 13B parameters'
      },
      {
        id: 'codellama',
        name: 'Code Llama',
        provider: 'ollama',
        maxTokens: 4096,
        description: 'Specialized for code generation'
      },
      {
        id: 'mistral',
        name: 'Mistral',
        provider: 'ollama',
        maxTokens: 8192,
        description: 'Efficient and powerful language model'
      },
      {
        id: 'mixtral',
        name: 'Mixtral',
        provider: 'ollama',
        maxTokens: 32000,
        description: 'Mixture of experts model'
      }
    ]
  }
};

export const getAvailableProviders = (): string[] => {
  const providers: string[] = [];
  
  if (aiProviderConfig.openai.apiKey) providers.push('openai');
  if (aiProviderConfig.anthropic.apiKey) providers.push('anthropic');
  if (aiProviderConfig.ollama.baseURL) providers.push('ollama');
  
  return providers;
};

export const getProviderModels = (provider: string): AIModel[] => {
  switch (provider) {
    case 'openai':
      return aiProviderConfig.openai.models;
    case 'anthropic':
      return aiProviderConfig.anthropic.models;
    case 'ollama':
      return aiProviderConfig.ollama.models;
    default:
      return [];
  }
};

export const validateProviderConfig = (provider: string): boolean => {
  switch (provider) {
    case 'openai':
      return !!aiProviderConfig.openai.apiKey;
    case 'anthropic':
      return !!aiProviderConfig.anthropic.apiKey;
    case 'ollama':
      return !!aiProviderConfig.ollama.baseURL;
    default:
      return false;
  }
};
