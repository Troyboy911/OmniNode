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
