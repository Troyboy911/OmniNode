'use client';

import { useState, useEffect } from 'react';

// Helper to safely format dates on client-side only
const useMounted = () => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  return mounted;
};
import { Brain, Zap, TrendingUp, Network, Eye, Sparkles } from 'lucide-react';
import MetaLearningCore from '@/lib/ascension/MetaLearningCore';
import OmniMind from '@/lib/ascension/OmniMind';
import StrategicAutonomy from '@/lib/ascension/StrategicAutonomy';

export default function AscensionDashboard() {
  const mounted = useMounted();
  const [metaCore] = useState(() => new MetaLearningCore());
  const [omniMind] = useState(() => new OmniMind());
  const [strategicEngine] = useState(() => new StrategicAutonomy());
  
  const [performanceReport, setPerformanceReport] = useState<any>(null);
  const [evolutionHistory, setEvolutionHistory] = useState<any[]>([]);
  const [emotionalState, setEmotionalState] = useState<any>(null);
  const [insights, setInsights] = useState<string[]>([]);
  const [proposal, setProposal] = useState<any>(null);
  const [isEvolving, setIsEvolving] = useState(false);

  useEffect(() => {
    initializeAscension();
  }, []);

  const initializeAscension = async () => {
    // Initialize meta-learning
    const report = await metaCore.selfAudit();
    setPerformanceReport(report);

    // Initialize Omni Mind
    const emotional = omniMind.getEmotionalState();
    setEmotionalState(emotional);

    // Get initial insights
    const mockAgents = [
      { id: 'agent-1', role: 'Developer', status: 'active', performance: { successRate: 0.95, resourceUsage: 0.6 } },
      { id: 'agent-2', role: 'Designer', status: 'working', performance: { successRate: 0.92, resourceUsage: 0.5 } },
    ];
    const ecosystem = await omniMind.observeAgentEcosystem(mockAgents);
    setInsights(ecosystem.insights);
  };

  const triggerEvolution = async () => {
    setIsEvolving(true);
    const evolution = await metaCore.evolve();
    setEvolutionHistory([evolution, ...evolutionHistory]);
    
    // Update performance report
    const report = await metaCore.selfAudit();
    setPerformanceReport(report);
    
    setIsEvolving(false);
  };

  const generateProposal = async () => {
    const newProposal = await strategicEngine.generateAutonomousProposal();
    setProposal(newProposal);
  };

  const assessEmotion = async () => {
    const context = {
      activeAgents: 6,
      pendingTasks: 23,
      systemLoad: 0.68,
      recentFailures: 1,
    };
    const emotional = await omniMind.assessSituation(context);
    setEmotionalState(emotional);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="chrome-surface rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold neon-text flex items-center gap-3">
              <Sparkles className="w-8 h-8" />
              ASCENSION PROTOCOL
            </h1>
            <p className="text-gray-400 mt-2">
              Self-optimizing, adaptive intelligence infrastructure with recursive learning
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={triggerEvolution}
              disabled={isEvolving}
              className="chrome-button rounded-lg px-6 py-3 flex items-center gap-2 disabled:opacity-50"
            >
              <Zap className="w-5 h-5" />
              {isEvolving ? 'Evolving...' : 'Trigger Evolution'}
            </button>
            <button
              onClick={generateProposal}
              className="chrome-button rounded-lg px-6 py-3 flex items-center gap-2"
            >
              <TrendingUp className="w-5 h-5" />
              Generate Proposal
            </button>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="grid grid-cols-4 gap-4">
          <div className="glass-effect rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="w-5 h-5 text-purple-400" />
              <span className="text-sm text-gray-400">Meta-Learning</span>
            </div>
            <p className="text-2xl font-bold text-white">Active</p>
            <p className="text-xs text-green-400">Continuous Evolution</p>
          </div>

          <div className="glass-effect rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="w-5 h-5 text-blue-400" />
              <span className="text-sm text-gray-400">Omni Mind</span>
            </div>
            <p className="text-2xl font-bold text-white">Observing</p>
            <p className="text-xs text-blue-400">Collective Intelligence</p>
          </div>

          <div className="glass-effect rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              <span className="text-sm text-gray-400">Strategic AI</span>
            </div>
            <p className="text-2xl font-bold text-white">Analyzing</p>
            <p className="text-xs text-green-400">Opportunity Detection</p>
          </div>

          <div className="glass-effect rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Network className="w-5 h-5 text-yellow-400" />
              <span className="text-sm text-gray-400">Pan-Network</span>
            </div>
            <p className="text-2xl font-bold text-white">Ready</p>
            <p className="text-xs text-yellow-400">Distributed Cognition</p>
          </div>
        </div>
      </div>

      {/* Meta-Learning Performance */}
      {performanceReport && (
        <div className="chrome-surface rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Brain className="w-6 h-6 text-purple-400" />
            Meta-Learning Core Performance
          </h2>
          
          <div className="grid grid-cols-5 gap-4 mb-6">
            <div className="glass-effect rounded-lg p-3 text-center">
              <p className="text-xs text-gray-400 mb-1">Task Completion</p>
              <p className="text-xl font-bold text-white">
                {(performanceReport.metrics.taskCompletionRate * 100).toFixed(1)}%
              </p>
            </div>
            <div className="glass-effect rounded-lg p-3 text-center">
              <p className="text-xs text-gray-400 mb-1">Avg Exec Time</p>
              <p className="text-xl font-bold text-white">
                {performanceReport.metrics.averageExecutionTime.toFixed(1)}s
              </p>
            </div>
            <div className="glass-effect rounded-lg p-3 text-center">
              <p className="text-xs text-gray-400 mb-1">Efficiency</p>
              <p className="text-xl font-bold text-white">
                {(performanceReport.metrics.resourceEfficiency * 100).toFixed(1)}%
              </p>
            </div>
            <div className="glass-effect rounded-lg p-3 text-center">
              <p className="text-xs text-gray-400 mb-1">Error Rate</p>
              <p className="text-xl font-bold text-white">
                {(performanceReport.metrics.errorRate * 100).toFixed(1)}%
              </p>
            </div>
            <div className="glass-effect rounded-lg p-3 text-center">
              <p className="text-xs text-gray-400 mb-1">Agent Synergy</p>
              <p className="text-xl font-bold text-white">
                {(performanceReport.metrics.agentSynergy * 100).toFixed(1)}%
              </p>
            </div>
          </div>

          {performanceReport.recommendations.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-gray-400 mb-3">AI-Generated Recommendations</h3>
              <div className="space-y-2">
                {performanceReport.recommendations.map((rec: any) => (
                  <div key={rec.id} className="glass-effect rounded-lg p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          rec.type === 'architecture' ? 'bg-red-400/20 text-red-400' :
                          rec.type === 'refactoring' ? 'bg-yellow-400/20 text-yellow-400' :
                          rec.type === 'scaling' ? 'bg-blue-400/20 text-blue-400' :
                          'bg-green-400/20 text-green-400'
                        }`}>
                          {rec.type}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400">
                        Priority: {rec.priority.toFixed(1)}
                      </span>
                    </div>
                    <p className="text-sm text-white mb-2">{rec.description}</p>
                    <p className="text-xs text-gray-400">
                      Estimated Impact: +{(rec.estimatedImpact * 100).toFixed(0)}%
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Evolution History */}
      {evolutionHistory.length > 0 && (
        <div className="chrome-surface rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Zap className="w-6 h-6 text-yellow-400" />
            Evolution History
          </h2>
          <div className="space-y-3">
            {evolutionHistory.slice(0, 5).map((evo) => (
              <div key={evo.id} className={`glass-effect rounded-lg p-4 border-l-4 ${
                evo.success ? 'border-green-400' : 'border-red-400'
              }`}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="text-xs px-2 py-1 rounded-full bg-[var(--neon-blue)]/20 text-[var(--neon-blue)]">
                      {evo.type}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400" suppressHydrationWarning>
                    {mounted ? new Date(evo.timestamp).toLocaleTimeString() : ''}
                  </span>
                </div>
                <p className="text-sm text-white mb-2">{evo.description}</p>
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-gray-400">
                    Before: {(evo.performanceBefore * 100).toFixed(1)}%
                  </span>
                  <span className={evo.success ? 'text-green-400' : 'text-red-400'}>
                    After: {(evo.performanceAfter * 100).toFixed(1)}%
                  </span>
                  <span className={evo.success ? 'text-green-400' : 'text-red-400'}>
                    {evo.success ? '✓ Success' : '✗ Failed'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Omni Mind Insights */}
      <div className="grid grid-cols-2 gap-6">
        <div className="chrome-surface rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Eye className="w-6 h-6 text-blue-400" />
            Collective Insights
          </h2>
          <div className="space-y-3">
            {insights.map((insight, index) => (
              <div key={index} className="glass-effect rounded-lg p-3">
                <p className="text-sm text-white">{insight}</p>
              </div>
            ))}
          </div>
          <button
            onClick={assessEmotion}
            className="mt-4 chrome-button rounded-lg px-4 py-2 w-full text-sm"
          >
            Assess Emotional State
          </button>
        </div>

        {emotionalState && (
          <div className="chrome-surface rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Emotional Intelligence</h2>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Urgency</span>
                  <span className="text-sm font-bold text-white">
                    {(emotionalState.urgency * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-yellow-500 to-red-500 h-2 rounded-full"
                    style={{ width: `${emotionalState.urgency * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Confidence</span>
                  <span className="text-sm font-bold text-white">
                    {(emotionalState.confidence * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full"
                    style={{ width: `${emotionalState.confidence * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Stress Level</span>
                  <span className="text-sm font-bold text-white">
                    {(emotionalState.stress * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 h-2 rounded-full"
                    style={{ width: `${emotionalState.stress * 100}%` }}
                  />
                </div>
              </div>

              <div className="glass-effect rounded-lg p-3 text-center">
                <p className="text-xs text-gray-400 mb-1">Overall Sentiment</p>
                <p className={`text-lg font-bold ${
                  emotionalState.sentiment === 'positive' ? 'text-green-400' :
                  emotionalState.sentiment === 'negative' ? 'text-red-400' :
                  'text-yellow-400'
                }`}>
                  {emotionalState.sentiment.toUpperCase()}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Strategic Proposal */}
      {proposal && (
        <div className="chrome-surface rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-green-400" />
            Autonomous Strategic Proposal
          </h2>
          
          <div className="glass-effect rounded-lg p-4 mb-4">
            <h3 className="text-lg font-bold text-white mb-2">{proposal.opportunity.title}</h3>
            <p className="text-sm text-gray-400 mb-3">{proposal.opportunity.description}</p>
            
            <div className="grid grid-cols-4 gap-3 mb-3">
              <div className="text-center">
                <p className="text-xs text-gray-400">Market Size</p>
                <p className="text-sm font-bold text-white">
                  ${(proposal.opportunity.marketSize / 1000000).toFixed(0)}M
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-400">Growth Rate</p>
                <p className="text-sm font-bold text-green-400">
                  {(proposal.opportunity.growthPotential * 100).toFixed(0)}%
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-400">Est. Revenue</p>
                <p className="text-sm font-bold text-white">
                  ${(proposal.opportunity.estimatedRevenue / 1000000).toFixed(1)}M
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-400">Risk Level</p>
                <p className="text-sm font-bold text-yellow-400">
                  {(proposal.opportunity.riskLevel * 100).toFixed(0)}%
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="glass-effect rounded-lg p-4">
              <h4 className="text-sm font-bold text-white mb-3">Timeline</h4>
              <div className="space-y-2">
                {proposal.timeline.phases.map((phase: any, index: number) => (
                  <div key={index} className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">{phase.name}</span>
                    <span className="text-white">{phase.duration} days</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-gray-700">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Total Duration</span>
                  <span className="font-bold text-[var(--neon-blue)]">
                    {proposal.timeline.totalDuration} days
                  </span>
                </div>
              </div>
            </div>

            <div className="glass-effect rounded-lg p-4">
              <h4 className="text-sm font-bold text-white mb-3">Budget Breakdown</h4>
              <div className="space-y-2">
                {proposal.budget.breakdown.map((item: any, index: number) => (
                  <div key={index} className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">{item.category}</span>
                    <span className="text-white">${(item.amount / 1000).toFixed(0)}K</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-gray-700">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Total Budget</span>
                  <span className="font-bold text-[var(--neon-blue)]">
                    ${(proposal.budget.total / 1000).toFixed(0)}K
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}