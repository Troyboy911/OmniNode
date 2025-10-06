'use client';

import { useState } from 'react';
import { DollarSign, TrendingUp, TrendingDown, PieChart, BarChart3, Wallet } from 'lucide-react';

export default function EconomicDashboard() {
  const [selectedTimeframe, setSelectedTimeframe] = useState('7d');

  const economicMetrics = {
    totalBudget: 250000,
    allocated: 187500,
    spent: 94250,
    remaining: 93250,
    burnRate: 13464,
    projectedCompletion: 87,
  };

  const agentCosts = [
    { name: 'Solidity-Prime', cost: 28500, percentage: 30.2 },
    { name: 'React-Nexus', cost: 21300, percentage: 22.6 },
    { name: 'Dominus-Alpha', cost: 18900, percentage: 20.1 },
    { name: 'Finance-Quantum', cost: 14200, percentage: 15.1 },
    { name: 'Design-Aether', cost: 11350, percentage: 12.0 },
  ];

  const revenueStreams = [
    { source: 'Transaction Fees', amount: 12500, growth: 15.3 },
    { source: 'Staking Rewards', amount: 8900, growth: 22.7 },
    { source: 'NFT Royalties', amount: 6200, growth: -5.2 },
    { source: 'Governance Fees', amount: 3400, growth: 8.9 },
  ];

  return (
    <div className="space-y-6">
      {/* Budget Overview */}
      <div className="chrome-surface rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold neon-text flex items-center gap-2">
            <DollarSign className="w-6 h-6" />
            Economic Dashboard
          </h2>
          <div className="flex gap-2">
            {['24h', '7d', '30d', '90d'].map((timeframe) => (
              <button
                key={timeframe}
                onClick={() => setSelectedTimeframe(timeframe)}
                className={`px-3 py-1 rounded-lg text-sm font-semibold transition-all ${
                  selectedTimeframe === timeframe
                    ? 'chrome-button'
                    : 'glass-effect text-gray-400 hover:text-white'
                }`}
              >
                {timeframe}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="glass-effect rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-gray-400">Total Budget</span>
            </div>
            <p className="text-2xl font-bold text-white">
              ${economicMetrics.totalBudget.toLocaleString()}
            </p>
          </div>

          <div className="glass-effect rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-xs text-gray-400">Allocated</span>
            </div>
            <p className="text-2xl font-bold text-white">
              ${economicMetrics.allocated.toLocaleString()}
            </p>
            <p className="text-xs text-gray-400">
              {((economicMetrics.allocated / economicMetrics.totalBudget) * 100).toFixed(0)}% of total
            </p>
          </div>

          <div className="glass-effect rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-4 h-4 text-red-400" />
              <span className="text-xs text-gray-400">Spent</span>
            </div>
            <p className="text-2xl font-bold text-white">
              ${economicMetrics.spent.toLocaleString()}
            </p>
            <p className="text-xs text-gray-400">
              {((economicMetrics.spent / economicMetrics.allocated) * 100).toFixed(0)}% of allocated
            </p>
          </div>

          <div className="glass-effect rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-4 h-4 text-yellow-400" />
              <span className="text-xs text-gray-400">Burn Rate</span>
            </div>
            <p className="text-2xl font-bold text-white">
              ${economicMetrics.burnRate.toLocaleString()}
            </p>
            <p className="text-xs text-gray-400">per day</p>
          </div>
        </div>

        {/* Budget Progress */}
        <div className="glass-effect rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Budget Utilization</span>
            <span className="text-sm font-bold text-white">
              {((economicMetrics.spent / economicMetrics.allocated) * 100).toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-3 mb-2">
            <div
              className="bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 h-3 rounded-full"
              style={{ width: `${(economicMetrics.spent / economicMetrics.allocated) * 100}%` }}
            />
          </div>
          <p className="text-xs text-gray-400">
            ${economicMetrics.remaining.toLocaleString()} remaining • Projected {economicMetrics.projectedCompletion}% completion
          </p>
        </div>
      </div>

      {/* Agent Cost Breakdown */}
      <div className="chrome-surface rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <PieChart className="w-5 h-5 text-[var(--neon-blue)]" />
          Agent Resource Allocation
        </h3>
        <div className="space-y-3">
          {agentCosts.map((agent, index) => (
            <div key={index} className="glass-effect rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-white">{agent.name}</span>
                <span className="text-sm font-bold text-[var(--neon-blue)]">
                  ${agent.cost.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-[var(--neon-blue)] to-blue-600 h-2 rounded-full"
                    style={{ width: `${agent.percentage}%` }}
                  />
                </div>
                <span className="text-xs text-gray-400 w-12 text-right">
                  {agent.percentage.toFixed(1)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Revenue Streams */}
      <div className="chrome-surface rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-green-400" />
          Revenue Streams
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {revenueStreams.map((stream, index) => (
            <div key={index} className="glass-effect rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">{stream.source}</span>
                {stream.growth >= 0 ? (
                  <div className="flex items-center gap-1 text-green-400">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-xs font-bold">+{stream.growth}%</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-red-400">
                    <TrendingDown className="w-4 h-4" />
                    <span className="text-xs font-bold">{stream.growth}%</span>
                  </div>
                )}
              </div>
              <p className="text-xl font-bold text-white">
                ${stream.amount.toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Economic Projections */}
      <div className="chrome-surface rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">Economic Projections</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass-effect rounded-lg p-4 text-center">
            <p className="text-sm text-gray-400 mb-2">Projected ROI</p>
            <p className="text-3xl font-bold text-green-400">+247%</p>
            <p className="text-xs text-gray-400 mt-1">12-month projection</p>
          </div>
          <div className="glass-effect rounded-lg p-4 text-center">
            <p className="text-sm text-gray-400 mb-2">Break-even Point</p>
            <p className="text-3xl font-bold text-yellow-400">4.2 mo</p>
            <p className="text-xs text-gray-400 mt-1">Based on current metrics</p>
          </div>
          <div className="glass-effect rounded-lg p-4 text-center">
            <p className="text-sm text-gray-400 mb-2">Risk Score</p>
            <p className="text-3xl font-bold text-blue-400">Low</p>
            <p className="text-xs text-gray-400 mt-1">AI-calculated assessment</p>
          </div>
        </div>
      </div>
    </div>
  );
}