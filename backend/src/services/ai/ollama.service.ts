import { config } from '../../config';
import { AIService, AIRequest, AIResponse, AIModel } from './ai.types';

export class OllamaService implements AIService {
  private baseURL: string;
  private defaultModel: string;

  constructor() {
    this.baseURL = config.ai.ollamaBaseURL || 'http://localhost:11434';
    this.defaultModel = config.ai.ollamaDefaultModel || 'llama2';
  }

  async generate(request: AIRequest): Promise<AIResponse> {
    const response = await fetch(`${this.baseURL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: request.model || this.defaultModel,
        prompt: request.prompt,
        stream: false,
        options: {
          temperature: request.temperature || 0.7,
          num_predict: request.maxTokens || 1000,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      content: data.response,
      tokens: data.prompt_eval_count + data.eval_count,
      model: request.model || this.defaultModel,
      usage: {
        prompt_tokens: data.prompt_eval_count,
        completion_tokens: data.eval_count,
        total_tokens: data.prompt_eval_count + data.eval_count,
      },
    };
  }

  async chat(messages: Array<{ role: string; content: string }>, model?: string): Promise<AIResponse> {
    const response = await fetch(`${this.baseURL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model || this.defaultModel,
        messages: messages,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      content: data.message.content,
      tokens: data.prompt_eval_count + data.eval_count,
      model: model || this.defaultModel,
      usage: {
        prompt_tokens: data.prompt_eval_count,
        completion_tokens: data.eval_count,
        total_tokens: data.prompt_eval_count + data.eval_count,
      },
    };
  }

  getAvailableModels(): AIModel[] {
    return [
      {
        id: 'llama2',
        name: 'Llama 2',
        provider: 'ollama',
        maxTokens: 4096,
        description: 'Open source large language model',
      },
      {
        id: 'llama2:13b',
        name: 'Llama 2 13B',
        provider: 'ollama',
        maxTokens: 4096,
        description: 'Larger Llama 2 model with 13B parameters',
      },
      {
        id: 'codellama',
        name: 'Code Llama',
        provider: 'ollama',
        maxTokens: 4096,
        description: 'Specialized for code generation',
      },
      {
        id: 'mistral',
        name: 'Mistral',
        provider: 'ollama',
        maxTokens: 8192,
        description: 'Efficient and powerful language model',
      },
      {
        id: 'mixtral',
        name: 'Mixtral',
        provider: 'ollama',
        maxTokens: 32000,
        description: 'Mixture of experts model',
      },
    ];
  }

  async stream(request: AIRequest, onChunk: (chunk: string) => void): Promise<void> {
    const response = await fetch(`${this.baseURL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: request.model || this.defaultModel,
        prompt: request.prompt,
        stream: true,
        options: {
          temperature: request.temperature || 0.7,
          num_predict: request.maxTokens || 1000,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.trim()) {
          try {
            const parsed = JSON.parse(line);
            if (parsed.response) {
              onChunk(parsed.response);
            }
          } catch (error) {
            console.error('Failed to parse streaming data:', error);
          }
        }
      }
    }
  }

  async listLocalModels(): Promise<AIModel[]> {
    try {
      const response = await fetch(`${this.baseURL}/api/tags`);
      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.models.map((model: any) => ({
        id: model.name,
        name: model.name,
        provider: 'ollama',
        maxTokens: 4096, // Default, can be updated based on model
        description: `Local ${model.name} model`,
      }));
    } catch (error) {
      console.error('Failed to list Ollama models:', error);
      return this.getAvailableModels();
    }
  }

  async pullModel(modelName: string): Promise<void> {
    const response = await fetch(`${this.baseURL}/api/pull`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: modelName,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to pull model: ${response.statusText}`);
    }
  }
}