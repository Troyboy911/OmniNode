import { config } from '../../config';
import { AIService, AIRequest, AIResponse, AIModel } from './ai.types';

export class ClaudeService implements AIService {
  private apiKey: string;
  private baseURL = 'https://api.anthropic.com/v1';

  constructor() {
    this.apiKey = config.ai.claudeApiKey || '';
    if (!this.apiKey) {
      throw new Error('Claude API key not configured');
    }
  }

  async generate(request: AIRequest): Promise<AIResponse> {
    const response = await fetch(`${this.baseURL}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: request.model || 'claude-3-sonnet-20240229',
        max_tokens: request.maxTokens || 1000,
        temperature: request.temperature || 0.7,
        messages: [
          {
            role: 'user',
            content: request.prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      content: data.content[0].text,
      tokens: data.usage.total_tokens,
      model: data.model,
      usage: data.usage,
    };
  }

  async chat(messages: Array<{ role: string; content: string }>, model?: string): Promise<AIResponse> {
    const response = await fetch(`${this.baseURL}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: model || 'claude-3-sonnet-20240229',
        max_tokens: 1000,
        messages: messages.map(msg => ({
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content: msg.content,
        })),
      }),
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      content: data.content[0].text,
      tokens: data.usage.total_tokens,
      model: data.model,
      usage: data.usage,
    };
  }

  getAvailableModels(): AIModel[] {
    return [
      {
        id: 'claude-3-sonnet-20240229',
        name: 'Claude 3 Sonnet',
        provider: 'anthropic',
        maxTokens: 200000,
        description: 'Balanced performance and speed',
      },
      {
        id: 'claude-3-opus-20240229',
        name: 'Claude 3 Opus',
        provider: 'anthropic',
        maxTokens: 200000,
        description: 'Most powerful model for complex tasks',
      },
      {
        id: 'claude-3-haiku-20240307',
        name: 'Claude 3 Haiku',
        provider: 'anthropic',
        maxTokens: 200000,
        description: 'Fastest model for everyday tasks',
      },
    ];
  }

  async stream(request: AIRequest, onChunk: (chunk: string) => void): Promise<void> {
    const response = await fetch(`${this.baseURL}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: request.model || 'claude-3-sonnet-20240229',
        max_tokens: request.maxTokens || 1000,
        temperature: request.temperature || 0.7,
        messages: [
          {
            role: 'user',
            content: request.prompt,
          },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.statusText}`);
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
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') return;

          try {
            const parsed = JSON.parse(data);
            if (parsed.type === 'content_block_delta' && parsed.delta.text) {
              onChunk(parsed.delta.text);
            }
          } catch (error) {
            console.error('Failed to parse streaming data:', error);
          }
        }
      }
    }
  }
}