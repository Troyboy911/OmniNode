export interface AIProviderConfig {
  apiKey: string;
  model: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
}

export interface AIRequest {
  messages: AIMessage[];
  model?: string;
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
  context?: any;
}

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIResponse {
  content: string;
  tokens: {
    prompt: number;
    completion: number;
    total: number;
  };
  model: string;
  cost: number;
  metadata?: any;
}

export interface AIProvider {
  name: string;
  generateResponse(request: AIRequest): Promise<AIResponse>;
  getModels(): string[];
  calculateCost(tokens: number, model: string): number;
}

export interface FileProcessingRequest {
  fileId: string;
  filePath: string;
  mimeType: string;
  operation: 'analyze' | 'summarize' | 'extract' | 'transform';
  context?: any;
}

export interface FileProcessingResponse {
  content: string;
  metadata: any;
  extractedData?: any;
}