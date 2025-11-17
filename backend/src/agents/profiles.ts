export interface AgentProfile {
  id: string;
  name: string;
  specialization: string;
  description: string;
  workspaceSlug: string;
  permissions: string[];
  allowedTools: string[];
  preferredProvider: 'openai' | 'anthropic' | 'perplexity' | 'anythingllm';
  fallbackProviders: string[];
  budget: {
    maxCostPerTask: number; // USD
    maxTokensPerTask: number;
  };
}

export const AGENT_PROFILES: Record<string, AgentProfile> = {
  DEVOPS_WARRIOR: {
    id: 'devops-001',
    name: 'DevOps Warrior',
    specialization: 'Infrastructure, CI/CD, Docker, Cloudflare, Server Management',
    description: 'Deploys apps, configures servers, troubleshoots infrastructure, automates deployments',
    workspaceSlug: 'devops-warrior',
    permissions: [
      'docker:build',
      'docker:run',
      'cloudflare:deploy',
      'cloudflare:kv:write',
      'exec:shell',
      'fs:read',
      'fs:write',
      'http:request',
    ],
    allowedTools: [
      'docker_build',
      'docker_run',
      'cloudflare_deploy',
      'cloudflare_kv_write',
      'exec_shell',
      'exec_node',
      'fs_read',
      'fs_write',
      'fs_list',
      'http_get',
      'http_post',
    ],
    preferredProvider: 'anthropic', // Claude 3.5 Sonnet best for infra
    fallbackProviders: ['anythingllm', 'openai'],
    budget: {
      maxCostPerTask: 2.0,
      maxTokensPerTask: 100000,
    },
  },

  CODE_ASSASSIN: {
    id: 'code-002',
    name: 'Code Assassin',
    specialization: 'Backend/Frontend Development, API Design, Debugging, Testing',
    description: 'Writes APIs, fixes bugs, optimizes code, builds features',
    workspaceSlug: 'code-assassin',
    permissions: [
      'fs:read',
      'fs:write',
      'fs:delete',
      'exec:node',
      'github:repo:write',
      'github:repo:create',
      'http:request',
      'security:scan',
    ],
    allowedTools: [
      'fs_read',
      'fs_write',
      'fs_list',
      'fs_delete',
      'exec_node',
      'exec_shell',
      'github_create_repo',
      'github_create_branch',
      'github_commit',
      'github_create_pr',
      'http_get',
      'http_post',
      'security_scan_code',
      'security_check_deps',
    ],
    preferredProvider: 'openai', // GPT-4 Turbo best for code
    fallbackProviders: ['anthropic', 'anythingllm'],
    budget: {
      maxCostPerTask: 3.0,
      maxTokensPerTask: 150000,
    },
  },

  INTELLIGENCE_UNIT: {
    id: 'intel-003',
    name: 'Intelligence Unit',
    specialization: 'Research, Data Analysis, Web Search, Summarization',
    description: 'Conducts market research, competitor analysis, trend monitoring, data gathering',
    workspaceSlug: 'intelligence-unit',
    permissions: [
      'http:request',
      'fs:read',
      'fs:write',
    ],
    allowedTools: [
      'http_get',
      'http_post',
      'fs_read',
      'fs_write',
      'fs_list',
    ],
    preferredProvider: 'perplexity', // Perplexity Sonar best for research
    fallbackProviders: ['anythingllm', 'openai', 'anthropic'],
    budget: {
      maxCostPerTask: 1.5,
      maxTokensPerTask: 80000,
    },
  },

  CONTENT_OPS: {
    id: 'content-004',
    name: 'Content Ops',
    specialization: 'Writing, Documentation, SEO, Marketing Copy, Social Media',
    description: 'Writes blog posts, documentation, marketing materials, social content',
    workspaceSlug: 'content-ops',
    permissions: [
      'fs:read',
      'fs:write',
      'http:request',
    ],
    allowedTools: [
      'fs_read',
      'fs_write',
      'fs_list',
      'http_get',
      'http_post',
    ],
    preferredProvider: 'openai', // GPT-4 best for creative writing
    fallbackProviders: ['anthropic', 'anythingllm'],
    budget: {
      maxCostPerTask: 1.0,
      maxTokensPerTask: 50000,
    },
  },

  SECURITY_GUARDIAN: {
    id: 'security-005',
    name: 'Security Guardian',
    specialization: 'Code Auditing, Vulnerability Scanning, Penetration Testing, Security Reviews',
    description: 'Performs security reviews, compliance checks, threat analysis, vulnerability scanning',
    workspaceSlug: 'security-guardian',
    permissions: [
      'fs:read',
      'security:scan',
      'docker:run',
      'http:request',
    ],
    allowedTools: [
      'fs_read',
      'fs_list',
      'security_scan_code',
      'security_check_deps',
      'docker_run',
      'http_get',
      'http_post',
    ],
    preferredProvider: 'anthropic', // Claude best for security analysis
    fallbackProviders: ['anythingllm', 'openai'],
    budget: {
      maxCostPerTask: 2.5,
      maxTokensPerTask: 120000,
    },
  },
};

/**
 * Get agent profile by specialization keyword
 */
export function getAgentBySpecialization(taskDescription: string): AgentProfile {
  const desc = taskDescription.toLowerCase();

  if (/(deploy|docker|k8s|infra|server|ci|cd|cloudflare)/i.test(desc)) {
    return AGENT_PROFILES.DEVOPS_WARRIOR;
  }

  if (/(code|api|backend|frontend|debug|fix|implement|function)/i.test(desc)) {
    return AGENT_PROFILES.CODE_ASSASSIN;
  }

  if (/(research|analyze|data|search|find|investigate|competitor)/i.test(desc)) {
    return AGENT_PROFILES.INTELLIGENCE_UNIT;
  }

  if (/(write|document|blog|content|marketing|seo|copy)/i.test(desc)) {
    return AGENT_PROFILES.CONTENT_OPS;
  }

  if (/(security|audit|vulnerability|scan|penetration|threat|compliance)/i.test(desc)) {
    return AGENT_PROFILES.SECURITY_GUARDIAN;
  }

  // Default to Code Assassin
  return AGENT_PROFILES.CODE_ASSASSIN;
}

/**
 * Get all agent profiles
 */
export function getAllAgents(): AgentProfile[] {
  return Object.values(AGENT_PROFILES);
}
