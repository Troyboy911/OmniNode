import { Request } from 'express';

// Extend Express Request type to include user
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    username: string;
    role: string;
  };
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: any[];
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Agent types
export interface AgentConfig {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  tools?: string[];
}

export interface AgentMemory {
  shortTerm: any[];
  longTerm: any[];
  context: Record<string, any>;
}

// Task types
export interface TaskResult {
  output?: any;
  metrics?: Record<string, number>;
  artifacts?: string[];
  logs?: string[];
}

// Command types
export interface CommandMetadata {
  strategicPlan?: {
    objective: string;
    breakdown: string[];
    requiredAgents: string[];
    estimatedTime: number;
  };
  context?: Record<string, any>;
}

// Metric types
export interface MetricData {
  timestamp: Date;
  value: number;
  metadata?: Record<string, any>;
}

// WebSocket event types
export enum WebSocketEvent {
  AGENT_STATUS_UPDATE = 'agent:status:update',
  TASK_PROGRESS_UPDATE = 'task:progress:update',
  COMMAND_EXECUTION = 'command:execution',
  METRIC_UPDATE = 'metric:update',
  NOTIFICATION = 'notification',
}

export interface WebSocketMessage {
  event: WebSocketEvent;
  data: any;
  timestamp: Date;
}

// Queue job types
export interface AgentJob {
  agentId: string;
  taskId: string;
  input: any;
  config?: AgentConfig;
}

export interface TaskJob {
  taskId: string;
  projectId: string;
  agentId?: string;
  input: any;
}

// Blockchain types
export interface TransactionData {
  from: string;
  to: string;
  value: string;
  data?: string;
  gasLimit?: string;
}

export interface ContractDeployment {
  bytecode: string;
  abi: any[];
  constructorArgs?: any[];
}

// Error types
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public errors?: any[]) {
    super(400, message);
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(401, message);
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'Access denied') {
    super(403, message);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(404, message);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource already exists') {
    super(409, message);
  }
}

export class InternalServerError extends AppError {
  constructor(message = 'Internal server error') {
    super(500, message, false);
  }
}