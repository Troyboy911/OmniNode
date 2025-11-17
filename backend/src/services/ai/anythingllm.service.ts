import axios, { AxiosInstance } from 'axios';
import { logger } from '../../config/logger';

export interface AnythingLLMConfig {
  baseUrl: string;
  apiKey: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  description?: string;
  model?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatResponse {
  response: string;
  sources?: any[];
  type: 'textResponse' | 'abort';
}

export class AnythingLLMService {
  private client: AxiosInstance;

  constructor(private config: AnythingLLMConfig) {
    this.client = axios.create({
      baseURL: config.baseUrl,
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 60000,
    });
  }

  /**
   * Send message to workspace
   */
  async sendMessage(
    workspaceSlug: string,
    message: string,
    mode: 'chat' | 'query' = 'chat'
  ): Promise<ChatResponse> {
    try {
      const response = await this.client.post(`/api/workspace/${workspaceSlug}/chat`, {
        message,
        mode,
      });

      logger.debug('AnythingLLM message sent', {
        workspace: workspaceSlug,
        messageLength: message.length,
        responseLength: response.data.response?.length || 0,
      });

      return response.data;
    } catch (error) {
      logger.error('AnythingLLM message failed', {
        workspace: workspaceSlug,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * List all workspaces
   */
  async listWorkspaces(): Promise<Workspace[]> {
    try {
      const response = await this.client.get('/api/workspaces');
      return response.data.workspaces || [];
    } catch (error) {
      logger.error('Failed to list AnythingLLM workspaces', { error: error.message });
      throw error;
    }
  }

  /**
   * Get workspace by slug
   */
  async getWorkspace(slug: string): Promise<Workspace | null> {
    try {
      const workspaces = await this.listWorkspaces();
      return workspaces.find(w => w.slug === slug) || null;
    } catch (error) {
      logger.error('Failed to get AnythingLLM workspace', { slug, error: error.message });
      return null;
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/api/system/ping');
      return response.status === 200;
    } catch (error) {
      logger.error('AnythingLLM health check failed', { error: error.message });
      return false;
    }
  }

  /**
   * Stream chat response (if supported)
   */
  async *streamMessage(
    workspaceSlug: string,
    message: string
  ): AsyncGenerator<string, void, unknown> {
    try {
      const response = await this.client.post(
        `/api/workspace/${workspaceSlug}/stream-chat`,
        { message },
        { responseType: 'stream' }
      );

      const stream = response.data;
      let buffer = '';

      for await (const chunk of stream) {
        buffer += chunk.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') return;
            
            try {
              const parsed = JSON.parse(data);
              if (parsed.textResponse) {
                yield parsed.textResponse;
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      logger.error('AnythingLLM stream failed', { workspace: workspaceSlug, error: error.message });
      throw error;
    }
  }
}

/**
 * Workspace Manager - Routes tasks to specialized workspaces
 */
export class WorkspaceManager {
  private workspaceMap: Map<string, string> = new Map([
    ['devops', 'devops-warrior'],
    ['code', 'code-assassin'],
    ['intelligence', 'intelligence-unit'],
    ['content', 'content-ops'],
    ['security', 'security-guardian'],
  ]);

  constructor(private llmService: AnythingLLMService) {}

  /**
   * Route task to appropriate workspace based on specialization
   */
  getWorkspaceForTask(taskType: string): string {
    const normalized = taskType.toLowerCase();
    
    // DevOps keywords
    if (/(deploy|docker|k8s|kubernetes|ci|cd|infra|server|cloud)/i.test(normalized)) {
      return this.workspaceMap.get('devops')!;
    }
    
    // Code keywords
    if (/(code|function|api|backend|frontend|debug|fix|implement)/i.test(normalized)) {
      return this.workspaceMap.get('code')!;
    }
    
    // Intelligence keywords
    if (/(research|analyze|data|search|find|investigate)/i.test(normalized)) {
      return this.workspaceMap.get('intelligence')!;
    }
    
    // Content keywords
    if (/(write|document|blog|content|marketing|copy)/i.test(normalized)) {
      return this.workspaceMap.get('content')!;
    }
    
    // Security keywords
    if (/(security|audit|vulnerability|scan|penetration|threat)/i.test(normalized)) {
      return this.workspaceMap.get('security')!;
    }
    
    // Default to code workspace
    return this.workspaceMap.get('code')!;
  }

  /**
   * Execute task with fallback to other workspaces
   */
  async executeTask(
    taskType: string,
    message: string,
    preferredWorkspace?: string
  ): Promise<ChatResponse> {
    const primaryWorkspace = preferredWorkspace || this.getWorkspaceForTask(taskType);
    const fallbackWorkspaces = Array.from(this.workspaceMap.values()).filter(
      w => w !== primaryWorkspace
    );

    // Try primary workspace
    try {
      logger.info('Executing task on primary workspace', { workspace: primaryWorkspace, taskType });
      return await this.llmService.sendMessage(primaryWorkspace, message);
    } catch (primaryError) {
      logger.warn('Primary workspace failed, trying fallbacks', {
        workspace: primaryWorkspace,
        error: primaryError.message,
      });

      // Try fallback workspaces
      for (const fallback of fallbackWorkspaces) {
        try {
          logger.info('Trying fallback workspace', { workspace: fallback });
          return await this.llmService.sendMessage(fallback, message);
        } catch (fallbackError) {
          logger.warn('Fallback workspace failed', {
            workspace: fallback,
            error: fallbackError.message,
          });
        }
      }

      throw new Error('All workspaces failed to execute task');
    }
  }

  /**
   * Get workspace health status
   */
  async getWorkspaceHealth(): Promise<Record<string, boolean>> {
    const health: Record<string, boolean> = {};
    
    for (const [key, slug] of this.workspaceMap.entries()) {
      try {
        const workspace = await this.llmService.getWorkspace(slug);
        health[key] = workspace !== null;
      } catch (error) {
        health[key] = false;
      }
    }

    return health;
  }
}
