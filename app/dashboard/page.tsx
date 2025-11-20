'use client';
import { useState } from 'react';
// import { Sidebar } from '@/components/Sidebar';
import EnhancedDashboard from '@/components/EnhancedDashboard';
import AscensionDashboard from '@/components/AscensionDashboard';
import PanNetworkDashboard from '@/components/PanNetworkDashboard';
import NeuralCockpitV2 from '@/components/NeuralCockpitV2';
import StrategicPlanner from '@/components/StrategicPlanner';
import AgentSynthesizer from '@/components/AgentSynthesizer';
import EconomicDashboard from '@/components/EconomicDashboard';
import BlockchainIntegration from '@/components/BlockchainIntegration';
import AIChatInterface from '@/components/AIChatInterface';
import FileUploadInterface from '@/components/FileUploadInterface';

type TabId = 'overview' | 'ascension' | 'pannetwork' | 'cockpitv2' | 'agents' | 'strategic' | 'synthesizer' | 'economic' | 'blockchain' | 'ai' | 'files';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [selectedProject, setSelectedProject] = useState<string>('default-project');

  const tabs = [
    { id: 'overview' as const, name: 'Overview', icon: '📊' },
    { id: 'ascension' as const, name: 'Ascension Protocol', icon: '🧬' },
    { id: 'pannetwork' as const, name: 'PAN Network', icon: '🌐' },
    { id: 'cockpitv2' as const, name: 'Neural Cockpit V2', icon: '🎮' },
    { id: 'agents' as const, name: 'Agent Fleet', icon: '🤖' },
    { id: 'strategic' as const, name: 'Strategic Command', icon: '🎯' },
    { id: 'synthesizer' as const, name: 'Agent Synthesizer', icon: '⚗️' },
    { id: 'economic' as const, name: 'Economic Engine', icon: '💰' },
    { id: 'blockchain' as const, name: 'Blockchain Hub', icon: '⛓️' },
    { id: 'ai' as const, name: 'AI Chat', icon: '💬' },
    { id: 'files' as const, name: 'File Manager', icon: '📁' },
  ];

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900">
      {/* Sidebar */}
      {/* <Sidebar
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      /> */}
      
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
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
              {activeTab === 'ai' && 'Chat with AI assistants and get intelligent insights'}
              {activeTab === 'files' && 'Upload, manage, and process files with AI'}
            </p>
          </header>

          {/* Content */}
          <div>
            {activeTab === 'overview' && <EnhancedDashboard />}
            {activeTab === 'ascension' && <AscensionDashboard />}
            {activeTab === 'pannetwork' && <PanNetworkDashboard />}
            {activeTab === 'cockpitv2' && <NeuralCockpitV2 />}
            {activeTab === 'agents' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Agent content will be loaded via EnhancedDashboard */}
              </div>
            )}
            {activeTab === 'strategic' && (
              <StrategicPlanner command="Build a decentralized art gallery with NFT marketplace" />
            )}
            {activeTab === 'synthesizer' && <AgentSynthesizer />}
            {activeTab === 'economic' && <EconomicDashboard />}
            {activeTab === 'blockchain' && <BlockchainIntegration />}
            {activeTab === 'ai' && <AIChatInterface />}
            {activeTab === 'files' && <FileUploadInterface projectId={selectedProject} />}
          </div>
        </div>
      </main>
    </div>
  );
}
