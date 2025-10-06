'use client';

import { useState } from 'react';
import { AgentRole, Agent, AgentStatus } from '@/types';
import { Brain, Sparkles, Zap, Plus, Settings } from 'lucide-react';

export default function AgentSynthesizer() {
  const [isCreating, setIsCreating] = useState(false);
  const [selectedRole, setSelectedRole] = useState<AgentRole | null>(null);
  const [showConfig, setShowConfig] = useState(false);

  const availableRoles = [
    {
      role: AgentRole.PROJECT_MANAGER,
      description: 'Orchestrates team coordination and strategic planning',
      capabilities: ['Strategic Planning', 'Resource Allocation', 'Team Coordination'],
      icon: '🎯',
    },
    {
      role: AgentRole.SOLIDITY_DEVELOPER,
      description: 'Develops and audits smart contracts',
      capabilities: ['Smart Contract Development', 'Security Auditing', 'Gas Optimization'],
      icon: '⚡',
    },
    {
      role: AgentRole.FRONTEND_DEVELOPER,
      description: 'Builds user interfaces and Web3 integrations',
      capabilities: ['React/Next.js', 'Web3 Integration', 'Responsive Design'],
      icon: '💻',
    },
    {
      role: AgentRole.UX_UI_DESIGNER,
      description: 'Creates intuitive and beautiful user experiences',
      capabilities: ['UI/UX Design', 'Prototyping', 'Design Systems'],
      icon: '🎨',
    },
    {
      role: AgentRole.FINANCIAL_ANALYST,
      description: 'Models economics and analyzes financial data',
      capabilities: ['Financial Modeling', 'Tokenomics', 'Risk Analysis'],
      icon: '📊',
    },
    {
      role: AgentRole.MARKETING_SPECIALIST,
      description: 'Drives growth and community engagement',
      capabilities: ['Content Strategy', 'Community Building', 'Growth Hacking'],
      icon: '📢',
    },
    {
      role: AgentRole.DATA_ANALYST,
      description: 'Analyzes data and generates insights',
      capabilities: ['Data Analysis', 'Visualization', 'Predictive Modeling'],
      icon: '📈',
    },
    {
      role: AgentRole.DEVOPS_ENGINEER,
      description: 'Manages infrastructure and deployments',
      capabilities: ['CI/CD', 'Cloud Infrastructure', 'Monitoring'],
      icon: '🔧',
    },
    {
      role: AgentRole.DAO_ARCHITECT,
      description: 'Designs decentralized governance structures',
      capabilities: ['DAO Design', 'Governance Models', 'Token Economics'],
      icon: '🏛️',
    },
    {
      role: AgentRole.SMART_CONTRACT_AUDITOR,
      description: 'Ensures smart contract security and reliability',
      capabilities: ['Security Auditing', 'Vulnerability Detection', 'Best Practices'],
      icon: '🔒',
    },
  ];

  const handleSynthesize = (role: AgentRole) => {
    setSelectedRole(role);
    setIsCreating(true);

    // Simulate agent creation
    setTimeout(() => {
      setIsCreating(false);
      setSelectedRole(null);
      // In a real app, this would add the agent to the system
    }, 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="chrome-surface rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold neon-text flex items-center gap-2">
              <Sparkles className="w-6 h-6" />
              Synthetica Engine
            </h2>
            <p className="text-gray-400 text-sm mt-1">
              Dynamically generate specialized AI agents for your project
            </p>
          </div>
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="chrome-button rounded-lg px-4 py-2 flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            Configure
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="glass-effect rounded-lg p-3 text-center">
            <p className="text-xs text-gray-400 mb-1">Available Roles</p>
            <p className="text-2xl font-bold text-white">{availableRoles.length}</p>
          </div>
          <div className="glass-effect rounded-lg p-3 text-center">
            <p className="text-xs text-gray-400 mb-1">Active Agents</p>
            <p className="text-2xl font-bold text-green-400">6</p>
          </div>
          <div className="glass-effect rounded-lg p-3 text-center">
            <p className="text-xs text-gray-400 mb-1">Synthesis Queue</p>
            <p className="text-2xl font-bold text-yellow-400">{isCreating ? 1 : 0}</p>
          </div>
          <div className="glass-effect rounded-lg p-3 text-center">
            <p className="text-xs text-gray-400 mb-1">Total Created</p>
            <p className="text-2xl font-bold text-[var(--neon-blue)]">23</p>
          </div>
        </div>
      </div>

      {/* Creation Status */}
      {isCreating && selectedRole && (
        <div className="chrome-surface rounded-xl p-6 border-2 border-[var(--neon-blue)] animate-pulse">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--neon-blue)] to-blue-600 flex items-center justify-center animate-spin">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-white mb-1">Synthesizing Agent...</h3>
              <p className="text-sm text-gray-400">
                Creating {selectedRole} with specialized capabilities and cognitive models
              </p>
            </div>
          </div>
          <div className="mt-4 w-full bg-gray-700 rounded-full h-2">
            <div className="bg-gradient-to-r from-[var(--neon-blue)] to-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }} />
          </div>
        </div>
      )}

      {/* Available Roles */}
      <div className="chrome-surface rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">Available Agent Roles</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {availableRoles.map((roleData, index) => (
            <div
              key={index}
              className="glass-effect rounded-lg p-4 hover:border-[var(--neon-blue)] border border-transparent transition-all duration-300 cursor-pointer group"
              onClick={() => !isCreating && handleSynthesize(roleData.role)}
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="text-3xl">{roleData.icon}</div>
                <div className="flex-1">
                  <h4 className="font-bold text-white mb-1 group-hover:text-[var(--neon-blue)] transition-colors">
                    {roleData.role}
                  </h4>
                  <p className="text-xs text-gray-400">{roleData.description}</p>
                </div>
                <button
                  disabled={isCreating}
                  className="chrome-button rounded-lg p-2 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-wrap gap-1">
                {roleData.capabilities.map((capability, capIndex) => (
                  <span
                    key={capIndex}
                    className="text-xs px-2 py-1 rounded-full bg-[var(--neon-blue)]/20 text-[var(--neon-blue)] border border-[var(--neon-blue)]/30"
                  >
                    {capability}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Configuration Panel */}
      {showConfig && (
        <div className="chrome-surface rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Agent Configuration</h3>
          <div className="space-y-4">
            <div className="glass-effect rounded-lg p-4">
              <label className="text-sm text-gray-400 mb-2 block">Cognitive Model</label>
              <select className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 border border-gray-700 focus:border-[var(--neon-blue)] outline-none">
                <option>GPT-4 Turbo</option>
                <option>Claude 3 Opus</option>
                <option>Gemini Pro</option>
                <option>Grok-2</option>
              </select>
            </div>

            <div className="glass-effect rounded-lg p-4">
              <label className="text-sm text-gray-400 mb-2 block">Memory Capacity</label>
              <input
                type="range"
                min="1"
                max="100"
                defaultValue="50"
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>Low</span>
                <span>High</span>
              </div>
            </div>

            <div className="glass-effect rounded-lg p-4">
              <label className="text-sm text-gray-400 mb-2 block">Autonomy Level</label>
              <div className="grid grid-cols-3 gap-2">
                {['Supervised', 'Semi-Autonomous', 'Fully Autonomous'].map((level) => (
                  <button
                    key={level}
                    className="chrome-button rounded-lg px-3 py-2 text-xs"
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <div className="glass-effect rounded-lg p-4">
              <label className="flex items-center gap-2 text-sm text-white cursor-pointer">
                <input type="checkbox" className="w-4 h-4" defaultChecked />
                Enable collaborative protocols
              </label>
            </div>

            <div className="glass-effect rounded-lg p-4">
              <label className="flex items-center gap-2 text-sm text-white cursor-pointer">
                <input type="checkbox" className="w-4 h-4" defaultChecked />
                Allow economic transactions
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}