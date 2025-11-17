/**
 * AGENT TOOLS ARSENAL
 * 
 * Every weapon available to OmniNode agents:
 * - Sandboxed file system operations
 * - HTTP/API requests with safety checks
 * - Docker container execution
 * - GitHub repository operations
 * - Cloudflare Workers deployment
 * - Code execution in isolated environments
 * - Security scanning
 * - Database operations
 */

import { AgentTool, ToolExecutionContext, ToolResult } from './types';
import { FileSystemTools } from './fs.tools';
import { HttpTools } from './http.tools';
import { DockerTools } from './docker.tools';
import { GitHubTools } from './github.tools';
import { CloudflareTools } from './cloudflare.tools';
import { ExecutionTools } from './exec.tools';
import { SecurityTools } from './security.tools';

export class ToolRegistry {
  private tools: Map<string, AgentTool> = new Map();

  constructor() {
    this.registerAllTools();
  }

  private registerAllTools(): void {
    // File System Tools
    this.registerTool({
      name: 'fs_read',
      description: 'Read file contents from sandbox',
      category: 'filesystem',
      requiredPermissions: ['fs:read'],
      parameters: {
        path: { type: 'string', required: true, description: 'File path relative to sandbox' },
      },
      execute: FileSystemTools.readFile,
    });

    this.registerTool({
      name: 'fs_write',
      description: 'Write content to file in sandbox',
      category: 'filesystem',
      requiredPermissions: ['fs:write'],
      parameters: {
        path: { type: 'string', required: true, description: 'File path relative to sandbox' },
        content: { type: 'string', required: true, description: 'File content' },
      },
      execute: FileSystemTools.writeFile,
    });

    this.registerTool({
      name: 'fs_list',
      description: 'List files and directories in sandbox',
      category: 'filesystem',
      requiredPermissions: ['fs:read'],
      parameters: {
        path: { type: 'string', required: false, description: 'Directory path', default: '.' },
      },
      execute: FileSystemTools.listFiles,
    });

    this.registerTool({
      name: 'fs_delete',
      description: 'Delete file or directory from sandbox',
      category: 'filesystem',
      requiredPermissions: ['fs:write', 'fs:delete'],
      parameters: {
        path: { type: 'string', required: true, description: 'File or directory path' },
      },
      execute: FileSystemTools.deleteFile,
    });

    // HTTP Tools
    this.registerTool({
      name: 'http_get',
      description: 'Make HTTP GET request',
      category: 'http',
      requiredPermissions: ['http:request'],
      parameters: {
        url: { type: 'string', required: true, description: 'Request URL' },
        headers: { type: 'object', required: false, description: 'HTTP headers' },
      },
      execute: HttpTools.get,
    });

    this.registerTool({
      name: 'http_post',
      description: 'Make HTTP POST request',
      category: 'http',
      requiredPermissions: ['http:request'],
      parameters: {
        url: { type: 'string', required: true, description: 'Request URL' },
        body: { type: 'any', required: true, description: 'Request body' },
        headers: { type: 'object', required: false, description: 'HTTP headers' },
      },
      execute: HttpTools.post,
    });

    // Docker Tools
    this.registerTool({
      name: 'docker_build',
      description: 'Build Docker image',
      category: 'docker',
      requiredPermissions: ['docker:build'],
      parameters: {
        dockerfile: { type: 'string', required: true, description: 'Dockerfile content' },
        tag: { type: 'string', required: true, description: 'Image tag' },
        context: { type: 'string', required: false, description: 'Build context path' },
      },
      execute: DockerTools.buildImage,
    });

    this.registerTool({
      name: 'docker_run',
      description: 'Run command in Docker container',
      category: 'docker',
      requiredPermissions: ['docker:run'],
      parameters: {
        image: { type: 'string', required: true, description: 'Docker image' },
        command: { type: 'array', required: true, description: 'Command to execute' },
        env: { type: 'object', required: false, description: 'Environment variables' },
        timeout: { type: 'number', required: false, description: 'Timeout in seconds', default: 300 },
      },
      execute: DockerTools.runContainer,
    });

    // GitHub Tools
    this.registerTool({
      name: 'github_create_repo',
      description: 'Create GitHub repository',
      category: 'github',
      requiredPermissions: ['github:repo:create'],
      parameters: {
        name: { type: 'string', required: true, description: 'Repository name' },
        description: { type: 'string', required: false, description: 'Repository description' },
        private: { type: 'boolean', required: false, description: 'Make repository private', default: true },
      },
      execute: GitHubTools.createRepo,
    });

    this.registerTool({
      name: 'github_create_branch',
      description: 'Create branch in repository',
      category: 'github',
      requiredPermissions: ['github:repo:write'],
      parameters: {
        owner: { type: 'string', required: true, description: 'Repository owner' },
        repo: { type: 'string', required: true, description: 'Repository name' },
        branch: { type: 'string', required: true, description: 'New branch name' },
        from: { type: 'string', required: false, description: 'Source branch', default: 'main' },
      },
      execute: GitHubTools.createBranch,
    });

    this.registerTool({
      name: 'github_commit',
      description: 'Commit files to repository',
      category: 'github',
      requiredPermissions: ['github:repo:write'],
      parameters: {
        owner: { type: 'string', required: true, description: 'Repository owner' },
        repo: { type: 'string', required: true, description: 'Repository name' },
        branch: { type: 'string', required: true, description: 'Target branch' },
        message: { type: 'string', required: true, description: 'Commit message' },
        files: { type: 'array', required: true, description: 'Files to commit [{path, content}]' },
      },
      execute: GitHubTools.commitFiles,
    });

    this.registerTool({
      name: 'github_create_pr',
      description: 'Create pull request',
      category: 'github',
      requiredPermissions: ['github:repo:write'],
      parameters: {
        owner: { type: 'string', required: true, description: 'Repository owner' },
        repo: { type: 'string', required: true, description: 'Repository name' },
        title: { type: 'string', required: true, description: 'PR title' },
        head: { type: 'string', required: true, description: 'Source branch' },
        base: { type: 'string', required: true, description: 'Target branch' },
        body: { type: 'string', required: false, description: 'PR description' },
      },
      execute: GitHubTools.createPullRequest,
    });

    // Cloudflare Tools
    this.registerTool({
      name: 'cloudflare_deploy',
      description: 'Deploy Cloudflare Worker',
      category: 'cloudflare',
      requiredPermissions: ['cloudflare:deploy'],
      parameters: {
        name: { type: 'string', required: true, description: 'Worker name' },
        script: { type: 'string', required: true, description: 'Worker script content' },
        env: { type: 'string', required: false, description: 'Environment', default: 'production' },
        secrets: { type: 'object', required: false, description: 'Worker secrets' },
      },
      execute: CloudflareTools.deployWorker,
    });

    this.registerTool({
      name: 'cloudflare_kv_write',
      description: 'Write to Cloudflare KV',
      category: 'cloudflare',
      requiredPermissions: ['cloudflare:kv:write'],
      parameters: {
        namespace: { type: 'string', required: true, description: 'KV namespace ID' },
        key: { type: 'string', required: true, description: 'Key' },
        value: { type: 'string', required: true, description: 'Value' },
      },
      execute: CloudflareTools.kvWrite,
    });

    // Execution Tools
    this.registerTool({
      name: 'exec_node',
      description: 'Execute Node.js code in sandbox',
      category: 'execution',
      requiredPermissions: ['exec:node'],
      parameters: {
        code: { type: 'string', required: true, description: 'Node.js code to execute' },
        timeout: { type: 'number', required: false, description: 'Timeout in seconds', default: 30 },
      },
      execute: ExecutionTools.executeNode,
    });

    this.registerTool({
      name: 'exec_shell',
      description: 'Execute shell command in container',
      category: 'execution',
      requiredPermissions: ['exec:shell'],
      parameters: {
        command: { type: 'string', required: true, description: 'Shell command' },
        cwd: { type: 'string', required: false, description: 'Working directory' },
        timeout: { type: 'number', required: false, description: 'Timeout in seconds', default: 60 },
      },
      execute: ExecutionTools.executeShell,
    });

    // Security Tools
    this.registerTool({
      name: 'security_scan_code',
      description: 'Scan code for vulnerabilities',
      category: 'security',
      requiredPermissions: ['security:scan'],
      parameters: {
        code: { type: 'string', required: false, description: 'Code to scan' },
        path: { type: 'string', required: false, description: 'Path to scan' },
        language: { type: 'string', required: true, description: 'Programming language' },
      },
      execute: SecurityTools.scanCode,
    });

    this.registerTool({
      name: 'security_check_deps',
      description: 'Check dependencies for vulnerabilities',
      category: 'security',
      requiredPermissions: ['security:scan'],
      parameters: {
        manifestPath: { type: 'string', required: true, description: 'Path to package.json/requirements.txt' },
      },
      execute: SecurityTools.checkDependencies,
    });
  }

  private registerTool(tool: AgentTool): void {
    this.tools.set(tool.name, tool);
  }

  /**
   * Get tool by name
   */
  getTool(name: string): AgentTool | undefined {
    return this.tools.get(name);
  }

  /**
   * Get all tools
   */
  getAllTools(): AgentTool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Get tools by category
   */
  getToolsByCategory(category: string): AgentTool[] {
    return Array.from(this.tools.values()).filter(t => t.category === category);
  }

  /**
   * Get tools by permission
   */
  getToolsByPermission(permission: string): AgentTool[] {
    return Array.from(this.tools.values()).filter(t =>
      t.requiredPermissions.includes(permission)
    );
  }

  /**
   * Execute tool with context and permission checks
   */
  async executeTool(
    toolName: string,
    parameters: Record<string, any>,
    context: ToolExecutionContext
  ): Promise<ToolResult> {
    const tool = this.getTool(toolName);
    
    if (!tool) {
      return {
        success: false,
        error: `Tool not found: ${toolName}`,
        timestamp: new Date().toISOString(),
      };
    }

    // Check permissions
    const missingPermissions = tool.requiredPermissions.filter(
      perm => !context.permissions.includes(perm)
    );

    if (missingPermissions.length > 0) {
      return {
        success: false,
        error: `Missing permissions: ${missingPermissions.join(', ')}`,
        timestamp: new Date().toISOString(),
      };
    }

    // Validate parameters
    const validationError = this.validateParameters(tool, parameters);
    if (validationError) {
      return {
        success: false,
        error: validationError,
        timestamp: new Date().toISOString(),
      };
    }

    // Execute tool
    try {
      const result = await tool.execute(parameters, context);
      return result;
    } catch (error) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Validate tool parameters
   */
  private validateParameters(tool: AgentTool, parameters: Record<string, any>): string | null {
    for (const [paramName, paramDef] of Object.entries(tool.parameters)) {
      const value = parameters[paramName];

      if (paramDef.required && (value === undefined || value === null)) {
        return `Missing required parameter: ${paramName}`;
      }

      if (value !== undefined && value !== null) {
        const actualType = Array.isArray(value) ? 'array' : typeof value;
        if (paramDef.type !== 'any' && actualType !== paramDef.type) {
          return `Invalid type for ${paramName}: expected ${paramDef.type}, got ${actualType}`;
        }
      }
    }

    return null;
  }

  /**
   * Get tool definitions for LLM function calling
   */
  getToolDefinitionsForLLM(): any[] {
    return this.getAllTools().map(tool => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: {
          type: 'object',
          properties: Object.entries(tool.parameters).reduce((acc, [name, def]) => {
            acc[name] = {
              type: def.type === 'array' ? 'array' : def.type === 'object' ? 'object' : 'string',
              description: def.description,
            };
            return acc;
          }, {} as Record<string, any>),
          required: Object.entries(tool.parameters)
            .filter(([, def]) => def.required)
            .map(([name]) => name),
        },
      },
    }));
  }
}

export const toolRegistry = new ToolRegistry();
