import { Agent, AgentRole, AgentStatus, Project, ProjectStatus, SystemMetrics, Command, CommandStatus } from '@/types';

export const mockAgents: Agent[] = [
  {
    id: 'agent-001',
    name: 'Dominus-Alpha',
    role: AgentRole.PROJECT_MANAGER,
    status: AgentStatus.ACTIVE,
    capabilities: ['Strategic Planning', 'Resource Allocation', 'Team Coordination'],
    memory: {
      shortTerm: ['Current project: DeFi Platform', 'Next milestone: Smart Contract Deployment'],
      longTerm: ['Completed 47 projects', 'Specialization: DeFi and DAO'],
      context: { currentProject: 'defi-platform-001' }
    },
    performance: {
      tasksCompleted: 234,
      successRate: 0.96,
      averageTime: 3.2,
      resourceUsage: 0.45
    },
    createdAt: new Date('2025-01-15'),
    lastActive: new Date()
  },
  {
    id: 'agent-002',
    name: 'Solidity-Prime',
    role: AgentRole.SOLIDITY_DEVELOPER,
    status: AgentStatus.WORKING,
    capabilities: ['Smart Contract Development', 'Security Auditing', 'Gas Optimization'],
    memory: {
      shortTerm: ['Writing NFT marketplace contract', 'Implementing ERC-721 standard'],
      longTerm: ['Deployed 89 contracts', 'Zero critical vulnerabilities'],
      context: { currentContract: 'NFTMarketplace.sol' }
    },
    performance: {
      tasksCompleted: 156,
      successRate: 0.98,
      averageTime: 5.7,
      resourceUsage: 0.62
    },
    createdAt: new Date('2025-02-01'),
    lastActive: new Date()
  },
  {
    id: 'agent-003',
    name: 'React-Nexus',
    role: AgentRole.FRONTEND_DEVELOPER,
    status: AgentStatus.ACTIVE,
    capabilities: ['React/Next.js', 'Web3 Integration', 'Responsive Design'],
    memory: {
      shortTerm: ['Building dashboard UI', 'Integrating wallet connection'],
      longTerm: ['Created 34 dApps', 'Expert in Web3 UX'],
      context: { currentComponent: 'WalletConnect' }
    },
    performance: {
      tasksCompleted: 198,
      successRate: 0.94,
      averageTime: 4.1,
      resourceUsage: 0.51
    },
    createdAt: new Date('2025-02-10'),
    lastActive: new Date()
  },
  {
    id: 'agent-004',
    name: 'Design-Aether',
    role: AgentRole.UX_UI_DESIGNER,
    status: AgentStatus.IDLE,
    capabilities: ['UI/UX Design', 'Prototyping', 'Design Systems'],
    memory: {
      shortTerm: ['Completed marketplace wireframes'],
      longTerm: ['Designed 56 interfaces', 'Award-winning portfolio'],
      context: {}
    },
    performance: {
      tasksCompleted: 142,
      successRate: 0.97,
      averageTime: 6.3,
      resourceUsage: 0.38
    },
    createdAt: new Date('2025-02-15'),
    lastActive: new Date(Date.now() - 3600000)
  },
  {
    id: 'agent-005',
    name: 'Finance-Quantum',
    role: AgentRole.FINANCIAL_ANALYST,
    status: AgentStatus.ACTIVE,
    capabilities: ['Financial Modeling', 'Tokenomics', 'Risk Analysis'],
    memory: {
      shortTerm: ['Analyzing token distribution model', 'Calculating APY projections'],
      longTerm: ['Modeled 67 tokenomics systems', 'Expert in DeFi economics'],
      context: { currentModel: 'governance-token' }
    },
    performance: {
      tasksCompleted: 178,
      successRate: 0.95,
      averageTime: 4.8,
      resourceUsage: 0.44
    },
    createdAt: new Date('2025-02-20'),
    lastActive: new Date()
  },
  {
    id: 'agent-006',
    name: 'Marketing-Pulse',
    role: AgentRole.MARKETING_SPECIALIST,
    status: AgentStatus.WORKING,
    capabilities: ['Content Strategy', 'Community Building', 'Growth Hacking'],
    memory: {
      shortTerm: ['Drafting launch announcement', 'Planning Twitter campaign'],
      longTerm: ['Launched 23 successful campaigns', 'Built communities of 100K+'],
      context: { currentCampaign: 'nft-gallery-launch' }
    },
    performance: {
      tasksCompleted: 211,
      successRate: 0.92,
      averageTime: 3.9,
      resourceUsage: 0.36
    },
    createdAt: new Date('2025-03-01'),
    lastActive: new Date()
  }
];

export const mockProjects: Project[] = [
  {
    id: 'project-001',
    name: 'Decentralized Art Gallery',
    description: 'NFT marketplace with DAO governance and artist royalties',
    status: ProjectStatus.IN_PROGRESS,
    agents: mockAgents.slice(0, 4),
    tasks: [],
    budget: {
      allocated: 50000,
      spent: 12500,
      currency: 'USD',
      breakdown: [
        { category: 'Development', amount: 30000, spent: 8000 },
        { category: 'Marketing', amount: 10000, spent: 2500 },
        { category: 'Infrastructure', amount: 10000, spent: 2000 }
      ]
    },
    timeline: {
      startDate: new Date('2025-03-01'),
      endDate: new Date('2025-04-15'),
      milestones: [
        {
          id: 'milestone-001',
          name: 'Smart Contract Deployment',
          description: 'Deploy NFT minting and marketplace contracts',
          targetDate: new Date('2025-03-15T00:00:00Z'),
          completed: true
        },
        {
          id: 'milestone-002',
          name: 'Frontend Launch',
          description: 'Launch beta version of gallery interface',
          targetDate: new Date('2025-03-30T00:00:00Z'),
          completed: false
        }
      ]
    },
    createdAt: new Date('2025-03-01'),
    updatedAt: new Date()
  }
];

export const mockSystemMetrics: SystemMetrics = {
  activeAgents: 6,
  totalTasks: 47,
  completedTasks: 31,
  systemLoad: 0.68,
  memoryUsage: 0.54,
  networkActivity: 0.72
};

export const mockCommands: Command[] = [
  {
    id: 'cmd-001',
    text: 'Synthesize an autonomous organization to create and manage a decentralized art gallery',
    timestamp: new Date('2025-03-01T10:00:00'),
    status: CommandStatus.COMPLETED
  },
  {
    id: 'cmd-002',
    text: 'Add a staking mechanism for governance token holders',
    timestamp: new Date('2025-03-05T14:30:00'),
    status: CommandStatus.EXECUTING
  }
];