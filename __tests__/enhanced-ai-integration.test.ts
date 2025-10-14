import { enhancedAIOrchestrator } from '../backend/src/services/ai/enhanced-orchestrator';
import { config } from '../backend/src/config';

// Mock the config to test different scenarios
jest.mock('../backend/src/config', () => ({
  config: {
    ai: {
      openaiApiKey: 'test-openai-key',
      anthropicApiKey: 'test-anthropic-key',
      ollamaBaseURL: 'http://localhost:11434',
      ollamaDefaultModel: 'llama2'
    }
  }
}));

describe('Enhanced AI Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Live API Connections', () => {
    it('should detect live mode when API keys are configured', () => {
      const orchestrator = new enhancedAIOrchestrator.constructor();
      expect(orchestrator.getLiveModeStatus()).toBe(true);
    });

    it('should fall back to mock mode when no API keys are available', () => {
      jest.mock('../backend/src/config', () => ({
        config: { ai: { openaiApiKey: '', anthropicApiKey: '' } }
      }));
      
      const orchestrator = new enhancedAIOrchestrator.constructor();
      expect(orchestrator.getLiveModeStatus()).toBe(false);
    });

    it('should handle API failures gracefully', async () => {
      const request = {
        prompt: 'Test prompt',
        model: 'gpt-4',
        provider: 'openai'
      };

      const response = await enhancedAIOrchestrator.generateResponse(request);
      expect(response).toBeDefined();
      expect(response.content).toBeTruthy();
      expect(response.tokens).toBeDefined();
    });
  });

  describe('Multi-Provider Support', () => {
    it('should support OpenAI provider', async () => {
      const request = {
        prompt: 'Test OpenAI',
        provider: 'openai'
      };

      const response = await enhancedAIOrchestrator.generateResponse(request);
      expect(response).toBeDefined();
      expect(response.model).toContain('gpt');
    });

    it('should support Claude provider', async () => {
      const request = {
        prompt: 'Test Claude',
        provider: 'claude'
      };

      const response = await enhancedAIOrchestrator.generateResponse(request);
      expect(response).toBeDefined();
      expect(response.model).toContain('claude');
    });

    it('should support Ollama provider', async () => {
      const request = {
        prompt: 'Test Ollama',
        provider: 'ollama'
      };

      const response = await enhancedAIOrchestrator.generateResponse(request);
      expect(response).toBeDefined();
      expect(response.model).toContain('llama');
    });
  });

  describe('Streaming Support', () => {
    it('should handle streaming responses', async () => {
      const chunks: string[] = [];
      const onChunk = (chunk: string) => chunks.push(chunk);

      await enhancedAIOrchestrator.stream({
        prompt: 'Test streaming',
        provider: 'openai'
      }, onChunk);

      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks.join('')).toBeTruthy();
    });
  });

  describe('Provider Health Checks', () => {
    it('should check provider health status', async () => {
      const health = await enhancedAIOrchestrator.checkProviderHealth('openai');
      expect(health).toBeDefined();
      expect(health.status).toBeTruthy();
    });

    it('should return available providers', () => {
      const providers = enhancedAIOrchestrator.getActiveProviders();
      expect(providers).toContain('openai');
      expect(providers).toContain('claude');
    });
  });

  describe('Model Management', () => {
    it('should fetch available models', async () => {
      const models = await enhancedAIOrchestrator.getAvailableModels();
      expect(models).toBeDefined();
      expect(models.length).toBeGreaterThan(0);
      
      const model = models[0];
      expect(model.id).toBeDefined();
      expect(model.name).toBeDefined();
      expect(model.provider).toBeDefined();
    });

    it('should handle model selection', async () => {
      const request = {
        prompt: 'Test model selection',
        model: 'gpt-4'
      };

      const response = await enhancedAIOrchestrator.generateResponse(request);
      expect(response.model).toBe('gpt-4');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid provider gracefully', async () => {
      const request = {
        prompt: 'Test invalid provider',
        provider: 'invalid-provider'
      };

      const response = await enhancedAIOrchestrator.generateResponse(request);
      expect(response).toBeDefined();
      expect(response.content).toBeTruthy();
    });

    it('should handle API timeouts', async () => {
      const request = {
        prompt: 'Test timeout',
        provider: 'openai',
        timeout: 1 // 1ms timeout
      };

      const response = await enhancedAIOrchestrator.generateResponse(request);
      expect(response).toBeDefined();
    });
  });

  describe('Chat Functionality', () => {
    it('should handle chat conversations', async () => {
      const messages = [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there!' },
        { role: 'user', content: 'How are you?' }
      ];

      const response = await enhancedAIOrchestrator.chat(messages);
      expect(response).toBeDefined();
      expect(response.content).toBeTruthy();
    });
  });
});