// Agent Types
export interface Agent {
  id: string;
  name: string;
  role: AgentRole;
  status: AgentStatus;
  capabilities: string[];
  memory: AgentMemory;
  performance: AgentPerformance;
  createdAt: Date;
  lastActive: Date;
}

export enum AgentRole {
  PROJECT_MANAGER = 'Project Manager',
  SOLIDITY_DEVELOPER = 'Solidity Developer',
  FRONTEND_DEVELOPER = 'Frontend Developer',
  UX_UI_DESIGNER = 'UX/UI Designer',
  FINANCIAL_ANALYST = 'Financial Analyst',
  MARKETING_SPECIALIST = 'Marketing Specialist',
  DATA_ANALYST = 'Data Analyst',
  DEVOPS_ENGINEER = 'DevOps Engineer',
  DAO_ARCHITECT = 'DAO Architect',
  SMART_CONTRACT_AUDITOR = 'Smart Contract Auditor',
}

export enum AgentStatus {
  IDLE = 'idle',
  ACTIVE = 'active',
  WORKING = 'working',
  PAUSED = 'paused',
  ERROR = 'error',
  COMPLETED = 'completed',
}

export interface AgentMemory {
  shortTerm: string[];
  longTerm: string[];
  context: Record<string, any>;
}

export interface AgentPerformance {
  tasksCompleted: number;
  successRate: number;
  averageTime: number;
  resourceUsage: number;
}

// Command Types
export interface Command {
  id: string;
  text: string;
  timestamp: Date;
  status: CommandStatus;
  strategicPlan?: StrategicPlan;
}

export enum CommandStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  EXECUTING = 'executing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export interface StrategicPlan {
  objective: string;
  breakdown: Task[];
  requiredAgents: AgentRole[];
  estimatedDuration: number;
  estimatedCost: number;
  milestones: Milestone[];
}

export interface Task {
  id: string;
  description: string;
  assignedTo?: string;
  status: TaskStatus;
  priority: Priority;
  dependencies: string[];
  progress: number;
}

export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  BLOCKED = 'blocked',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface Milestone {
  id: string;
  name: string;
  description: string;
  targetDate: Date;
  completed: boolean;
}

// Project Types
export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  agents: Agent[];
  tasks: Task[];
  budget: Budget;
  timeline: Timeline;
  createdAt: Date;
  updatedAt: Date;
}

export enum ProjectStatus {
  PLANNING = 'planning',
  IN_PROGRESS = 'in_progress',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  ARCHIVED = 'archived',
}

export interface Budget {
  allocated: number;
  spent: number;
  currency: string;
  breakdown: BudgetItem[];
}

export interface BudgetItem {
  category: string;
  amount: number;
  spent: number;
}

export interface Timeline {
  startDate: Date;
  endDate: Date;
  milestones: Milestone[];
}

// System Types
export interface SystemMetrics {
  activeAgents: number;
  totalTasks: number;
  completedTasks: number;
  systemLoad: number;
  memoryUsage: number;
  networkActivity: number;
}

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  timestamp: Date;
  read: boolean;
}

export enum NotificationType {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
}