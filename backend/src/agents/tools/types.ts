export interface ToolParameter {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'any';
  required: boolean;
  description: string;
  default?: any;
}

export interface AgentTool {
  name: string;
  description: string;
  category: string;
  requiredPermissions: string[];
  parameters: Record<string, ToolParameter>;
  execute: (params: Record<string, any>, context: ToolExecutionContext) => Promise<ToolResult>;
}

export interface ToolExecutionContext {
  runId: string;
  agentId: string;
  sandboxPath: string;
  permissions: string[];
  secrets: Record<string, string>;
  timeout?: number;
}

export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
  logs?: string[];
  artifacts?: string[];
  timestamp: string;
  duration?: number;
}
