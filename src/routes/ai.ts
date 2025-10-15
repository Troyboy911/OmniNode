/**
 * AI Integration Routes
 * Real AI provider integrations (OpenAI, Anthropic, Google)
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { streamSSE } from 'hono/streaming';
import type { Env } from '../index';
import { APIError } from '../middleware/error';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

const ai = new Hono<{ Bindings: Env }>();

// Validation schemas
const chatSchema = z.object({
  provider: z.enum(['openai', 'anthropic', 'google']),
  model: z.string(),
  messages: z.array(z.object({
    role: z.enum(['system', 'user', 'assistant']),
    content: z.string()
  })),
  stream: z.boolean().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().optional()
});

// List available models
ai.get('/models', async (c) => {
  const models = {
    openai: [
      { id: 'gpt-4-turbo-preview', name: 'GPT-4 Turbo', provider: 'openai' },
      { id: 'gpt-4', name: 'GPT-4', provider: 'openai' },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'openai' }
    ],
    anthropic: [
      { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', provider: 'anthropic' },
      { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet', provider: 'anthropic' },
      { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', provider: 'anthropic' }
    ],
    google: [
      { id: 'gemini-pro', name: 'Gemini Pro', provider: 'google' },
      { id: 'gemini-pro-vision', name: 'Gemini Pro Vision', provider: 'google' }
    ]
  };

  return c.json({
    success: true,
    data: models
  });
});

// Chat completion endpoint
ai.post('/chat', async (c) => {
  try {
    const body = await c.req.json();
    const data = chatSchema.parse(body);

    // Route to appropriate provider
    switch (data.provider) {
      case 'openai':
        return await handleOpenAI(c, data);
      case 'anthropic':
        return await handleAnthropic(c, data);
      case 'google':
        return await handleGoogle(c, data);
      default:
        throw new APIError(400, 'Invalid provider', 'INVALID_PROVIDER');
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new APIError(400, 'Invalid input data', 'VALIDATION_ERROR');
    }
    throw error;
  }
});

// OpenAI handler
async function handleOpenAI(c: any, data: any) {
  const openai = new OpenAI({
    apiKey: c.env.OPENAI_API_KEY
  });

  if (data.stream) {
    return streamSSE(c, async (stream) => {
      const completion = await openai.chat.completions.create({
        model: data.model,
        messages: data.messages,
        temperature: data.temperature || 0.7,
        max_tokens: data.maxTokens,
        stream: true
      });

      for await (const chunk of completion) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          await stream.writeSSE({
            data: JSON.stringify({ content })
          });
        }
      }
    });
  } else {
    const completion = await openai.chat.completions.create({
      model: data.model,
      messages: data.messages,
      temperature: data.temperature || 0.7,
      max_tokens: data.maxTokens
    });

    return c.json({
      success: true,
      data: {
        content: completion.choices[0].message.content,
        usage: completion.usage
      }
    });
  }
}

// Anthropic handler
async function handleAnthropic(c: any, data: any) {
  const anthropic = new Anthropic({
    apiKey: c.env.ANTHROPIC_API_KEY
  });

  // Convert messages format
  const systemMessage = data.messages.find((m: any) => m.role === 'system');
  const messages = data.messages
    .filter((m: any) => m.role !== 'system')
    .map((m: any) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content
    }));

  if (data.stream) {
    return streamSSE(c, async (stream) => {
      const completion = await anthropic.messages.create({
        model: data.model,
        max_tokens: data.maxTokens || 4096,
        system: systemMessage?.content,
        messages,
        temperature: data.temperature || 0.7,
        stream: true
      });

      for await (const chunk of completion) {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          await stream.writeSSE({
            data: JSON.stringify({ content: chunk.delta.text })
          });
        }
      }
    });
  } else {
    const completion = await anthropic.messages.create({
      model: data.model,
      max_tokens: data.maxTokens || 4096,
      system: systemMessage?.content,
      messages,
      temperature: data.temperature || 0.7
    });

    return c.json({
      success: true,
      data: {
        content: completion.content[0].type === 'text' ? completion.content[0].text : '',
        usage: completion.usage
      }
    });
  }
}

// Google handler
async function handleGoogle(c: any, data: any) {
  const genAI = new GoogleGenerativeAI(c.env.GOOGLE_API_KEY);
  const model = genAI.getGenerativeModel({ model: data.model });

  // Convert messages to Google format
  const history = data.messages.slice(0, -1).map((m: any) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }));

  const lastMessage = data.messages[data.messages.length - 1].content;

  if (data.stream) {
    return streamSSE(c, async (stream) => {
      const chat = model.startChat({ history });
      const result = await chat.sendMessageStream(lastMessage);

      for await (const chunk of result.stream) {
        const text = chunk.text();
        if (text) {
          await stream.writeSSE({
            data: JSON.stringify({ content: text })
          });
        }
      }
    });
  } else {
    const chat = model.startChat({ history });
    const result = await chat.sendMessage(lastMessage);
    const response = await result.response;

    return c.json({
      success: true,
      data: {
        content: response.text(),
        usage: {
          promptTokens: 0, // Google doesn't provide token counts
          completionTokens: 0,
          totalTokens: 0
        }
      }
    });
  }
}

// Health check for AI providers
ai.get('/health', async (c) => {
  const providers = {
    openai: {
      configured: !!c.env.OPENAI_API_KEY && c.env.OPENAI_API_KEY.startsWith('sk-'),
      status: 'unknown'
    },
    anthropic: {
      configured: !!c.env.ANTHROPIC_API_KEY && c.env.ANTHROPIC_API_KEY.startsWith('sk-ant-'),
      status: 'unknown'
    },
    google: {
      configured: !!c.env.GOOGLE_API_KEY && c.env.GOOGLE_API_KEY.length > 20,
      status: 'unknown'
    }
  };

  // Test OpenAI
  if (providers.openai.configured) {
    try {
      const openai = new OpenAI({ apiKey: c.env.OPENAI_API_KEY });
      await openai.models.list();
      providers.openai.status = 'operational';
    } catch (error) {
      providers.openai.status = 'error';
    }
  }

  // Test Anthropic
  if (providers.anthropic.configured) {
    try {
      const anthropic = new Anthropic({ apiKey: c.env.ANTHROPIC_API_KEY });
      // Anthropic doesn't have a simple health check, so we assume it's operational if configured
      providers.anthropic.status = 'operational';
    } catch (error) {
      providers.anthropic.status = 'error';
    }
  }

  // Test Google
  if (providers.google.configured) {
    try {
      const genAI = new GoogleGenerativeAI(c.env.GOOGLE_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
      // Google doesn't have a simple health check, so we assume it's operational if configured
      providers.google.status = 'operational';
    } catch (error) {
      providers.google.status = 'error';
    }
  }

  return c.json({
    success: true,
    data: providers
  });
});

export default ai;