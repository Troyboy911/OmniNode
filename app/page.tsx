'use client';

import { useState } from 'react';
import NeuralBackground from '@/components/NeuralBackground';
import CommandInput from '@/components/CommandInput';
import AgentCard from '@/components/AgentCard';
import SystemMetricsPanel from '@/components/SystemMetrics';
import ProjectOverview from '@/components/ProjectOverview';
import CommandHistory from '@/components/CommandHistory';
import { mockAgents, mockSystemMetrics, mockProjects, mockCommands } from '@/lib/mockData';
import { Command, CommandStatus } from '@/types';
import { Brain, Sparkles, Network, Zap } from 'lucide-react';

export default function Home() {
  const [commands, setCommands] = useState<Command[]>(mockCommands);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCommandSubmit = (commandText: string) => {
    const newCommand: Command = {
      id: `cmd-${Date.now()}`,
      text: commandText,
      timestamp: new Date(),
      status: CommandStatus.PROCESSING,
    };

    setCommands([newCommand, ...commands]);
    setIsProcessing(true);

    // Simulate processing
    setTimeout(() => {
      setCommands((prev) =>
        prev.map((cmd) =>
          cmd.id === newCommand.id
            ? { ...cmd, status: CommandStatus.EXECUTING }
            : cmd
        )
      );
    }, 2000);

    setTimeout(() => {
      setCommands((prev) =>
        prev.map((cmd) =>
          cmd.id === newCommand.id
            ? { ...cmd, status: CommandStatus.COMPLETED }
            : cmd
        )
      );
      setIsProcessing(false);
    }, 5000);
  };

  return (
    <main className="min-h-screen relative">
      <NeuralBackground />

      {/* Scan Line Effect */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 1 }}>
        <div className="scan-line absolute w-full h-1 bg-gradient-to-r from-transparent via-[var(--neon-blue)] to-transparent opacity-20" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-12 text-center">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--neon-blue)] to-blue-600 flex items-center justify-center pulse-glow">
              <Brain className="w-10 h-10 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-5xl font-bold neon-text">OMNI NODE</h1>
              <p className="text-gray-400 text-sm">Neural Cockpit v1.0</p>
            </div>
          </div>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            AI Orchestration Platform for Autonomous Agent Synthesis & Decentralized Application Deployment
          </p>
        </header>

        {/* Command Input */}
        <div className="mb-12">
          <CommandInput onSubmit={handleCommandSubmit} />
        </div>

        {/* Status Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="chrome-surface rounded-xl p-4 flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-[var(--neon-blue)]" />
            <div>
              <p className="text-sm text-gray-400">Dominus Core</p>
              <p className="text-lg font-bold text-white">
                {isProcessing ? 'Processing...' : 'Ready'}
              </p>
            </div>
          </div>
          <div className="chrome-surface rounded-xl p-4 flex items-center gap-3">
            <Network className="w-8 h-8 text-green-400" />
            <div>
              <p className="text-sm text-gray-400">Synthetica Engine</p>
              <p className="text-lg font-bold text-white">Online</p>
            </div>
          </div>
          <div className="chrome-surface rounded-xl p-4 flex items-center gap-3">
            <Zap className="w-8 h-8 text-yellow-400" />
            <div>
              <p className="text-sm text-gray-400">Orchestration Layer</p>
              <p className="text-lg font-bold text-white">Active</p>
            </div>
          </div>
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Left Column - System Metrics & Command History */}
          <div className="space-y-8">
            <SystemMetricsPanel metrics={mockSystemMetrics} />
            <CommandHistory commands={commands} />
          </div>

          {/* Middle Column - Project Overview */}
          <div className="lg:col-span-2">
            <ProjectOverview project={mockProjects[0]} />
          </div>
        </div>

        {/* Agent Fleet */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold neon-text mb-6 flex items-center gap-2">
            <Brain className="w-6 h-6" />
            Active Agent Fleet
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockAgents.map((agent) => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        </div>

        {/* Quick Access to Dashboard */}
        <div className="text-center mb-8">
          <a
            href="/dashboard"
            className="inline-flex items-center gap-2 chrome-button rounded-xl px-8 py-4 text-lg font-bold"
          >
            <Brain className="w-6 h-6" />
            Enter Neural Cockpit
          </a>
        </div>

        {/* Footer */}
        <footer className="text-center text-gray-500 text-sm mt-12 pb-8">
          <p>Omni Node © 2025 | Powered by NinjaTech AI | Dominus Synthetica Architecture</p>
        </footer>
      </div>
    </main>
  );
}