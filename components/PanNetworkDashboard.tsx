'use client';

import { useState, useEffect } from 'react';
import { Network, Globe, Share2, Users, Database, Zap, Shield, TrendingUp } from 'lucide-react';
import PanNetworkCognition from '@/lib/ascension/PanNetworkCognition';

export default function PanNetworkDashboard() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [panNetwork] = useState(() => new PanNetworkCognition());
  const [networkStats, setNetworkStats] = useState<any>(null);
  const [connectedNodes, setConnectedNodes] = useState<any[]>([]);
  const [federatedModels, setFederatedModels] = useState<any[]>([]);
  const [collaborationRequests, setCollaborationRequests] = useState<any[]>([]);
  const [topology, setTopology] = useState<any>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    initializeNetwork();
  }, []);

  const initializeNetwork = async () => {
    const init = await panNetwork.initializeNetwork();
    setIsInitialized(true);
    
    const stats = panNetwork.getNetworkStats();
    setNetworkStats(stats);
    
    const nodes = panNetwork.getConnectedNodes();
    setConnectedNodes(nodes);
    
    const topo = await panNetwork.calculateTopology();
    setTopology(topo);
  };

  const shareInsight = async () => {
    await panNetwork.shareInsight({
      category: 'optimization',
      content: 'Discovered new optimization pattern for agent collaboration',
      confidence: 0.92,
      accessLevel: 'public',
    });
    
    const stats = panNetwork.getNetworkStats();
    setNetworkStats(stats);
  };

  const startFederatedTraining = async () => {
    const model = await panNetwork.federatedTrain({
      name: 'Agent Behavior Predictor',
      architecture: { layers: 4, neurons: [256, 128, 64, 32] },
    });
    
    const models = panNetwork.getFederatedModels();
    setFederatedModels(models);
  };

  const requestCollaboration = async () => {
    await panNetwork.requestCollaboration({
      task: 'Develop cross-chain bridge protocol',
      requiredCapabilities: ['Blockchain', 'Smart Contracts'],
      budget: 50000,
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });
    
    const requests = panNetwork.getCollaborationRequests();
    setCollaborationRequests(requests);
  };

  const synchronize = async () => {
    const result = await panNetwork.synchronizeNetwork();
    const stats = panNetwork.getNetworkStats();
    setNetworkStats(stats);
    
    const nodes = panNetwork.getConnectedNodes();
    setConnectedNodes(nodes);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="chrome-surface rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold neon-text flex items-center gap-3">
              <Network className="w-8 h-8" />
              PAN-NETWORK COGNITION
            </h1>
            <p className="text-gray-400 mt-2">
              Distributed intelligence network with federated learning and secure knowledge sharing
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={shareInsight}
              className="chrome-button rounded-lg px-6 py-3 flex items-center gap-2"
            >
              <Share2 className="w-5 h-5" />
              Share Insight
            </button>
            <button
              onClick={synchronize}
              className="chrome-button rounded-lg px-6 py-3 flex items-center gap-2"
            >
              <Zap className="w-5 h-5" />
              Synchronize
            </button>
          </div>
        </div>

        {/* Network Status */}
        {networkStats && (
          <div className="grid grid-cols-4 gap-4">
            <div className="glass-effect rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="w-5 h-5 text-blue-400" />
                <span className="text-sm text-gray-400">Network Status</span>
              </div>
              <p className="text-2xl font-bold text-white">
                {isInitialized ? 'Connected' : 'Initializing'}
              </p>
              <p className="text-xs text-green-400">
                Health: {(networkStats.networkHealth * 100).toFixed(0)}%
              </p>
            </div>

            <div className="glass-effect rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-purple-400" />
                <span className="text-sm text-gray-400">Connected Nodes</span>
              </div>
              <p className="text-2xl font-bold text-white">{networkStats.onlineNodes}</p>
              <p className="text-xs text-gray-400">of {networkStats.totalNodes} total</p>
            </div>

            <div className="glass-effect rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Database className="w-5 h-5 text-green-400" />
                <span className="text-sm text-gray-400">Shared Knowledge</span>
              </div>
              <p className="text-2xl font-bold text-white">{networkStats.totalKnowledge}</p>
              <p className="text-xs text-gray-400">insights</p>
            </div>

            <div className="glass-effect rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-yellow-400" />
                <span className="text-sm text-gray-400">Avg Reputation</span>
              </div>
              <p className="text-2xl font-bold text-white">
                {(networkStats.averageReputation * 100).toFixed(0)}%
              </p>
              <p className="text-xs text-gray-400">network trust</p>
            </div>
          </div>
        )}
      </div>

      {/* Network Topology Visualization */}
      {topology && (
        <div className="chrome-surface rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Network className="w-6 h-6 text-blue-400" />
            Network Topology
          </h2>
          <div className="glass-effect rounded-lg p-8 relative" style={{ height: '400px' }}>
            <svg width="100%" height="100%" viewBox="-150 -150 300 300">
              {/* Draw connections */}
              {topology.connections.map((conn: any, index: number) => {
                const source = topology.nodes.find((n: any) => n.id === conn.source);
                const target = topology.nodes.find((n: any) => n.id === conn.target);
                if (!source || !target) return null;
                
                return (
                  <line
                    key={index}
                    x1={source.x}
                    y1={source.y}
                    x2={target.x}
                    y2={target.y}
                    stroke="rgba(0, 212, 255, 0.3)"
                    strokeWidth={conn.strength * 3}
                  />
                );
              })}
              
              {/* Draw nodes */}
              {topology.nodes.map((node: any) => (
                <g key={node.id}>
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r="15"
                    fill="rgba(0, 212, 255, 0.2)"
                    stroke="#00d4ff"
                    strokeWidth="2"
                  />
                  <text
                    x={node.x}
                    y={node.y + 25}
                    textAnchor="middle"
                    fill="#00d4ff"
                    fontSize="10"
                  >
                    {node.name}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>
      )}

      {/* Connected Nodes */}
      <div className="chrome-surface rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Users className="w-6 h-6 text-purple-400" />
          Connected Nodes
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {connectedNodes.map((node) => (
            <div key={node.id} className="glass-effect rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-white">{node.name}</h3>
                  <p className="text-xs text-gray-400">{node.organization}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`w-3 h-3 rounded-full ${
                      node.status === 'online'
                        ? 'bg-green-400 animate-pulse'
                        : node.status === 'syncing'
                        ? 'bg-yellow-400'
                        : 'bg-gray-400'
                    }`}
                  />
                  <span className="text-xs text-gray-400 capitalize">{node.status}</span>
                </div>
              </div>

              <div className="mb-3">
                <p className="text-xs text-gray-400 mb-2">Capabilities:</p>
                <div className="flex flex-wrap gap-1">
                  {node.capabilities.map((cap: string, index: number) => (
                    <span
                      key={index}
                      className="text-xs px-2 py-1 rounded-full bg-[var(--neon-blue)]/20 text-[var(--neon-blue)] border border-[var(--neon-blue)]/30"
                    >
                      {cap}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div>
                  <span className="text-gray-400">Reputation: </span>
                  <span className="font-bold text-green-400">
                    {(node.reputation * 100).toFixed(0)}%
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Location: </span>
                  <span className="text-white">{node.location}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Federated Learning */}
      <div className="grid grid-cols-2 gap-6">
        <div className="chrome-surface rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Database className="w-6 h-6 text-green-400" />
            Federated Learning
          </h2>
          
          <button
            onClick={startFederatedTraining}
            className="chrome-button rounded-lg px-4 py-2 w-full mb-4"
          >
            Start Federated Training
          </button>

          {federatedModels.length > 0 ? (
            <div className="space-y-3">
              {federatedModels.map((model) => (
                <div key={model.id} className="glass-effect rounded-lg p-4">
                  <h3 className="font-bold text-white mb-2">{model.name}</h3>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-400">Version: </span>
                      <span className="text-white">{model.version}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Accuracy: </span>
                      <span className="text-green-400">
                        {(model.accuracy * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">Parameters: </span>
                      <span className="text-white">
                        {(model.parameters / 1000000).toFixed(1)}M
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">Contributors: </span>
                      <span className="text-white">{model.contributors.length}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-effect rounded-lg p-8 text-center">
              <Database className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-sm text-gray-400">No federated models yet</p>
              <p className="text-xs text-gray-500 mt-1">
                Start training to create distributed models
              </p>
            </div>
          )}
        </div>

        {/* Collaboration Requests */}
        <div className="chrome-surface rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Share2 className="w-6 h-6 text-yellow-400" />
            Collaboration
          </h2>

          <button
            onClick={requestCollaboration}
            className="chrome-button rounded-lg px-4 py-2 w-full mb-4"
          >
            Request Collaboration
          </button>

          {collaborationRequests.length > 0 ? (
            <div className="space-y-3">
              {collaborationRequests.map((request) => (
                <div key={request.id} className="glass-effect rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-white text-sm">{request.task}</h3>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        request.status === 'pending'
                          ? 'bg-yellow-400/20 text-yellow-400'
                          : request.status === 'accepted'
                          ? 'bg-green-400/20 text-green-400'
                          : 'bg-red-400/20 text-red-400'
                      }`}
                    >
                      {request.status}
                    </span>
                  </div>
                  <div className="text-xs space-y-1">
                    <div>
                      <span className="text-gray-400">Budget: </span>
                      <span className="text-white">${request.budget.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Deadline: </span>
                      <span className="text-white" suppressHydrationWarning>
                        {mounted ? new Date(request.deadline).toLocaleDateString() : ''}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-effect rounded-lg p-8 text-center">
              <Share2 className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-sm text-gray-400">No collaboration requests</p>
              <p className="text-xs text-gray-500 mt-1">
                Request help from the network
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Security & Privacy */}
      <div className="chrome-surface rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Shield className="w-6 h-6 text-blue-400" />
          Security & Privacy
        </h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="glass-effect rounded-lg p-4 text-center">
            <Shield className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <p className="text-sm font-bold text-white">End-to-End Encryption</p>
            <p className="text-xs text-gray-400 mt-1">All data encrypted in transit</p>
          </div>
          <div className="glass-effect rounded-lg p-4 text-center">
            <Database className="w-8 h-8 text-blue-400 mx-auto mb-2" />
            <p className="text-sm font-bold text-white">Privacy-Preserving ML</p>
            <p className="text-xs text-gray-400 mt-1">No raw data sharing</p>
          </div>
          <div className="glass-effect rounded-lg p-4 text-center">
            <Network className="w-8 h-8 text-purple-400 mx-auto mb-2" />
            <p className="text-sm font-bold text-white">Decentralized Trust</p>
            <p className="text-xs text-gray-400 mt-1">Reputation-based system</p>
          </div>
        </div>
      </div>
    </div>
  );
}