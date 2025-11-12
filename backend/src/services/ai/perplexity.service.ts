import axios from 'axios';
import { config } from '@/config/env';
import { AIRequest, AIResponse } from './ai.types';

export class PerplexityService {
  async generate(request: AIRequest): Promise<AIResponse> {
    const response = await axios.post(
      'https://api.perplexity.ai/v1/chat/completions',
      {
        model: request.model || 'pplx-70b-online',
        messages: request.messages,
        max_tokens: request.maxTokens || 1024,
        temperature: request.temperature || 1
      },
      {
        headers: {
          Authorization: `Bearer ${config.ai.perplexityApiKey || process.env.PERPLEXITY_API_KEY}`
        }
      }
    );
    return response.data;
  }
}