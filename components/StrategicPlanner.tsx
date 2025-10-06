'use client';

import { useState } from 'react';
import { StrategicPlan, AgentRole, Priority } from '@/types';
import { Brain, Target, Users, Clock, DollarSign, TrendingUp } from 'lucide-react';

interface StrategicPlannerProps {
  command: string;
}

export default function StrategicPlanner({ command }: StrategicPlannerProps) {
  const [plan, setPlan] = useState<StrategicPlan | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePlan = () => {
    setIsGenerating(true);
    
    // Simulate AI planning process
    setTimeout(() => {
      const mockPlan: StrategicPlan = {
        objective: command,
        breakdown: [
          {
            id: 'task-1',
            description: 'Design system architecture and data models',
            status: 'completed' as any,
            priority: Priority.CRITICAL,
            dependencies: [],
            progress: 100,
          },
          {
            id: 'task-2',
            description: 'Develop smart contracts for core functionality',
            status: 'in_progress' as any,
            priority: Priority.HIGH,
            dependencies: ['task-1'],
            progress: 65,
          },
          {
            id: 'task-3',
            description: 'Build frontend interface with Web3 integration',
            status: 'in_progress' as any,
            priority: Priority.HIGH,
            dependencies: ['task-1'],
            progress: 45,
          },
          {
            id: 'task-4',
            description: 'Implement tokenomics and economic models',
            status: 'pending' as any,
            priority: Priority.MEDIUM,
            dependencies: ['task-2'],
            progress: 0,
          },
          {
            id: 'task-5',
            description: 'Deploy to testnet and conduct security audit',
            status: 'pending' as any,
            priority: Priority.HIGH,
            dependencies: ['task-2', 'task-3'],
            progress: 0,
          },
        ],
        requiredAgents: [
          AgentRole.PROJECT_MANAGER,
          AgentRole.SOLIDITY_DEVELOPER,
          AgentRole.FRONTEND_DEVELOPER,
          AgentRole.FINANCIAL_ANALYST,
          AgentRole.SMART_CONTRACT_AUDITOR,
        ],
        estimatedDuration: 45,
        estimatedCost: 75000,
        milestones: [
          {
            id: 'milestone-1',
            name: 'Architecture Complete',
            description: 'System design and planning finalized',
            targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            completed: true,
          },
          {
            id: 'milestone-2',
            name: 'Smart Contracts Deployed',
            description: 'Core contracts deployed to testnet',
            targetDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
            completed: false,
          },
          {
            id: 'milestone-3',
            name: 'Beta Launch',
            description: 'Public beta version released',
            targetDate: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000),
            completed: false,
          },
          {
            id: 'milestone-4',
            name: 'Mainnet Deployment',
            description: 'Production launch on mainnet',
            targetDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
            completed: false,
          },
        ],
      };
      
      setPlan(mockPlan);
      setIsGenerating(false);
    }, 2000);
  };

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case Priority.CRITICAL:
        return 'text-red-400 bg-red-400/20 border-red-400/50';
      case Priority.HIGH:
        return 'text-orange-400 bg-orange-400/20 border-orange-400/50';
      case Priority.MEDIUM:
        return 'text-yellow-400 bg-yellow-400/20 border-yellow-400/50';
      case Priority.LOW:
        return 'text-green-400 bg-green-400/20 border-green-400/50';
    }
  };

  if (!plan && !isGenerating) {
    return (
      <div className="chrome-surface rounded-xl p-8 text-center">
        <Brain className="w-16 h-16 text-[var(--neon-blue)] mx-auto mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">Strategic Planning Ready</h3>
        <p className="text-gray-400 mb-6">
          Dominus Core will analyze your directive and generate a comprehensive strategic plan
        </p>
        <button
          onClick={generatePlan}
          className="chrome-button rounded-xl px-8 py-3 font-semibold"
        >
          Generate Strategic Plan
        </button>
      </div>
    );
  }

  if (isGenerating) {
    return (
      <div className="chrome-surface rounded-xl p-8 text-center">
        <div className="animate-spin w-16 h-16 border-4 border-[var(--neon-blue)] border-t-transparent rounded-full mx-auto mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">Analyzing Directive...</h3>
        <p className="text-gray-400">
          Dominus Core is deconstructing your command and formulating optimal strategy
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview */}
      <div className="chrome-surface rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <Target className="w-6 h-6 text-[var(--neon-blue)]" />
          <h2 className="text-2xl font-bold neon-text">Strategic Plan</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="glass-effect rounded-lg p-4">
            <Users className="w-5 h-5 text-purple-400 mb-2" />
            <p className="text-sm text-gray-400">Required Agents</p>
            <p className="text-2xl font-bold text-white">{plan.requiredAgents.length}</p>
          </div>
          <div className="glass-effect rounded-lg p-4">
            <Clock className="w-5 h-5 text-blue-400 mb-2" />
            <p className="text-sm text-gray-400">Est. Duration</p>
            <p className="text-2xl font-bold text-white">{plan.estimatedDuration} days</p>
          </div>
          <div className="glass-effect rounded-lg p-4">
            <DollarSign className="w-5 h-5 text-green-400 mb-2" />
            <p className="text-sm text-gray-400">Est. Cost</p>
            <p className="text-2xl font-bold text-white">${plan.estimatedCost.toLocaleString()}</p>
          </div>
          <div className="glass-effect rounded-lg p-4">
            <TrendingUp className="w-5 h-5 text-yellow-400 mb-2" />
            <p className="text-sm text-gray-400">Total Tasks</p>
            <p className="text-2xl font-bold text-white">{plan.breakdown.length}</p>
          </div>
        </div>
      </div>

      {/* Task Breakdown */}
      <div className="chrome-surface rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">Task Breakdown</h3>
        <div className="space-y-3">
          {plan.breakdown.map((task, index) => (
            <div key={task.id} className="glass-effect rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-bold text-gray-400">#{index + 1}</span>
                    <span className={`text-xs px-2 py-1 rounded-full border ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                  </div>
                  <p className="text-white font-semibold mb-1">{task.description}</p>
                  {task.dependencies.length > 0 && (
                    <p className="text-xs text-gray-400">
                      Dependencies: {task.dependencies.join(', ')}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-[var(--neon-blue)]">{task.progress}%</p>
                  <p className="text-xs text-gray-400 capitalize">{task.status.replace('_', ' ')}</p>
                </div>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-[var(--neon-blue)] to-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${task.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Required Agents */}
      <div className="chrome-surface rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">Required Agent Roles</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {plan.requiredAgents.map((role, index) => (
            <div key={index} className="glass-effect rounded-lg p-3 flex items-center gap-2">
              <Brain className="w-5 h-5 text-[var(--neon-blue)]" />
              <span className="text-sm text-white">{role}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}