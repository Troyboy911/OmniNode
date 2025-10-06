'use client';

import { useState } from 'react';
import NeuralBackground from '@/components/NeuralBackground';
import AgentCard from '@/components/AgentCard';
import SystemMetricsPanel from '@/components/SystemMetrics';
import ProjectOverview from '@/components/ProjectOverview';
import StrategicPlanner from '@/components/StrategicPlanner';
import EconomicDashboard from '@/components/EconomicDashboard';
import BlockchainIntegration from '@/components/BlockchainIntegration';
import AgentSynthesizer from '@/components/AgentSynthesizer';
import AscensionDashboard from '@/components/AscensionDashboard';
import PanNetworkDashboard from '@/components/PanNetworkDashboard';
import NeuralCockpitV2 from '@/components/NeuralCockpitV2';
import { mockAgents, mockSystemMetrics, mockProjects } from '@/lib/mockData';
import { 
  Brain, 
  LayoutDashboard, 
  Users, 
  DollarSign, 
  Link2, 
  Sparkles,
  Target,
  Menu,
  X,
  Zap,
  Network,
  Eye
} from 'lucide-react';

type TabType = 'overview' | 'agents' | 'strategic' | 'economic' | 'blockchain' | 'synthesizer' | 'ascension' | 'pannetwork' | 'cockpitv2';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const tabs = [
    { id: 'overview' as TabType, name: 'Overview', icon: LayoutDashboard },
    { id: 'ascension' as TabType, name: 'Ascension Protocol', icon: Zap },
    { id: 'pannetwork' as TabType, name: 'Pan-Network', icon: Network },
    { id: 'cockpitv2' as TabType, name: 'Neural Cockpit V2', icon: Eye },
    { id: 'agents' as TabType, name: 'Agent Fleet', icon: Users },
    { id: 'strategic' as TabType, name: 'Strategic Planning', icon: Target },
    { id: 'synthesizer' as TabType, name: 'Agent Synthesizer', icon: Sparkles },
    { id: 'economic' as TabType, name: 'Economic Dashboard', icon: DollarSign },
    { id: 'blockchain' as TabType, name: 'Blockchain', icon: Link2 },
  ];

  return (
    <main className="min-h-screen relative">
      <NeuralBackground />

      {/* Scan Line Effect */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 1 }}>
        <div className="scan-line absolute w-full h-1 bg-gradient-to-r from-transparent via-[var(--neon-blue)] to-transparent opacity-20" />
      </div>

      {/* Main Layout */}
      <div className="relative z-10 flex min-h-screen">
        {/* Sidebar */}
        <aside
          className={`fixed left-0 top-0 h-full chrome-surface border-r border-[var(--neon-blue)]/30 transition-all duration-300 ${
            sidebarOpen ? 'w-64' : 'w-20'
          }`}
        >
          {/* Logo */}
          <div className="p-6 border-b border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--neon-blue)] to-blue-600 flex items-center justify-center pulse-glow">
                <Brain className="w-6 h-6 text-white" />
              </div>
              {sidebarOpen && (
                <div>
                  <h1 className="text-xl font-bold neon-text">OMNI NODE</h1>
                  <p className="text-xs text-gray-400">Neural Cockpit</p>
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="p-4">
            <div className="space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    activeTab === tab.id
                      ? 'chrome-button'
                      : 'glass-effect hover:border-[var(--neon-blue)]/50'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  {sidebarOpen && <span className="text-sm font-semibold">{tab.name}</span>}
                </button>
              ))}
            </div>
          </nav>

          {/* Toggle Button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="absolute bottom-6 right-4 chrome-button rounded-lg p-2"
          >
            {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </aside>

        {/* Main Content */}
        <div
          className={`flex-1 transition-all duration-300 ${
            sidebarOpen ? 'ml-64' : 'ml-20'
          }`}
        >
          <div className="container mx-auto px-6 py-8">
            {/* Header */}
            <header className="mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">
                {tabs.find((t) => t.id === activeTab)?.name}
              </h2>
              <p className="text-gray-400">
                {activeTab === 'overview' && 'Monitor your AI orchestration platform'}
                {activeTab === 'ascension' && 'Self-optimizing intelligence with recursive learning'}
                {activeTab === 'pannetwork' && 'Distributed intelligence network with federated learning'}
                {activeTab === 'cockpitv2' && 'Living 3D data environment with temporal visualization'}
                {activeTab === 'agents' && 'Manage your autonomous agent fleet'}
                {activeTab === 'strategic' && 'Plan and execute strategic directives'}
                {activeTab === 'synthesizer' && 'Create new specialized AI agents'}
                {activeTab === 'economic' && 'Track financial metrics and projections'}
                {activeTab === 'blockchain' && 'Monitor smart contracts and transactions'}
              </p>
            </header>

            {/* Content */}
            <div>
              {activeTab === 'overview' && (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                      <ProjectOverview project={mockProjects[0]} />
                    </div>
                    <div>
                      <SystemMetricsPanel metrics={mockSystemMetrics} />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-4">Active Agents</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {mockAgents.slice(0, 6).map((agent) => (
                        <AgentCard key={agent.id} agent={agent} />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'ascension' && <AscensionDashboard />}

              {activeTab === 'pannetwork' && <PanNetworkDashboard />}

              {activeTab === 'cockpitv2' && <NeuralCockpitV2 agents={mockAgents} />}

              {activeTab === 'agents' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {mockAgents.map((agent) => (
                    <AgentCard key={agent.id} agent={agent} />
                  ))}
                </div>
              )}

              {activeTab === 'strategic' && (
                <StrategicPlanner command="Build a decentralized art gallery with NFT marketplace" />
              )}

              {activeTab === 'synthesizer' && <AgentSynthesizer />}

              {activeTab === 'economic' && <EconomicDashboard />}

              {activeTab === 'blockchain' && <BlockchainIntegration />}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}