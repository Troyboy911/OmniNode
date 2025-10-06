'use client';

import { Agent, AgentStatus } from '@/types';
import { Brain, Activity, CheckCircle, AlertCircle, Pause, Zap } from 'lucide-react';

interface AgentCardProps {
  agent: Agent;
}

export default function AgentCard({ agent }: AgentCardProps) {
  const getStatusIcon = () => {
    switch (agent.status) {
      case AgentStatus.ACTIVE:
        return <Activity className="w-4 h-4 text-green-400" />;
      case AgentStatus.WORKING:
        return <Zap className="w-4 h-4 text-yellow-400 animate-pulse" />;
      case AgentStatus.IDLE:
        return <Pause className="w-4 h-4 text-gray-400" />;
      case AgentStatus.COMPLETED:
        return <CheckCircle className="w-4 h-4 text-blue-400" />;
      case AgentStatus.ERROR:
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      default:
        return <Brain className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    switch (agent.status) {
      case AgentStatus.ACTIVE:
        return 'border-green-400/50';
      case AgentStatus.WORKING:
        return 'border-yellow-400/50';
      case AgentStatus.IDLE:
        return 'border-gray-400/50';
      case AgentStatus.COMPLETED:
        return 'border-blue-400/50';
      case AgentStatus.ERROR:
        return 'border-red-400/50';
      default:
        return 'border-gray-400/50';
    }
  };

  return (
    <div className={`chrome-surface rounded-xl p-4 hover:scale-105 transition-all duration-300 border-2 ${getStatusColor()}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--neon-blue)] to-blue-600 flex items-center justify-center">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-white">{agent.name}</h3>
            <p className="text-xs text-gray-400">{agent.role}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {getStatusIcon()}
          <span className="text-xs capitalize">{agent.status}</span>
        </div>
      </div>

      {/* Capabilities */}
      <div className="mb-3">
        <p className="text-xs text-gray-400 mb-2">Capabilities:</p>
        <div className="flex flex-wrap gap-1">
          {agent.capabilities.slice(0, 3).map((capability, index) => (
            <span
              key={index}
              className="text-xs px-2 py-1 rounded-full bg-[var(--neon-blue)]/20 text-[var(--neon-blue)] border border-[var(--neon-blue)]/30"
            >
              {capability}
            </span>
          ))}
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <p className="text-gray-400">Tasks</p>
          <p className="font-bold text-white">{agent.performance.tasksCompleted}</p>
        </div>
        <div>
          <p className="text-gray-400">Success Rate</p>
          <p className="font-bold text-green-400">{(agent.performance.successRate * 100).toFixed(0)}%</p>
        </div>
        <div>
          <p className="text-gray-400">Avg Time</p>
          <p className="font-bold text-white">{agent.performance.averageTime}h</p>
        </div>
        <div>
          <p className="text-gray-400">Load</p>
          <div className="w-full bg-gray-700 rounded-full h-2 mt-1">
            <div
              className="bg-gradient-to-r from-[var(--neon-blue)] to-blue-600 h-2 rounded-full"
              style={{ width: `${agent.performance.resourceUsage * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Current Task */}
      {agent.memory.shortTerm.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-700">
          <p className="text-xs text-gray-400 mb-1">Current Focus:</p>
          <p className="text-xs text-white truncate">{agent.memory.shortTerm[0]}</p>
        </div>
      )}
    </div>
  );
}