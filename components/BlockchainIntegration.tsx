'use client';

import { useState } from 'react';
import { Link2, CheckCircle, Clock, AlertCircle, ExternalLink } from 'lucide-react';

interface SmartContract {
  id: string;
  name: string;
  address: string;
  network: string;
  status: 'deployed' | 'pending' | 'failed';
  deployedAt?: Date;
  gasUsed?: number;
  transactions: number;
}

export default function BlockchainIntegration() {
  const [contracts] = useState<SmartContract[]>([
    {
      id: 'contract-1',
      name: 'NFTMarketplace',
      address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      network: 'Ethereum Sepolia',
      status: 'deployed',
      deployedAt: new Date('2025-03-10'),
      gasUsed: 2847563,
      transactions: 1247,
    },
    {
      id: 'contract-2',
      name: 'GovernanceToken',
      address: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',
      network: 'Polygon Mumbai',
      status: 'deployed',
      deployedAt: new Date('2025-03-12'),
      gasUsed: 1523847,
      transactions: 892,
    },
    {
      id: 'contract-3',
      name: 'StakingPool',
      address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
      network: 'Ethereum Sepolia',
      status: 'pending',
      transactions: 0,
    },
    {
      id: 'contract-4',
      name: 'TreasuryDAO',
      address: '0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0',
      network: 'Polygon Mumbai',
      status: 'deployed',
      deployedAt: new Date('2025-03-15'),
      gasUsed: 3124567,
      transactions: 456,
    },
  ]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'deployed':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-400 animate-pulse" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-400" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'deployed':
        return 'border-green-400/50 bg-green-400/10';
      case 'pending':
        return 'border-yellow-400/50 bg-yellow-400/10';
      case 'failed':
        return 'border-red-400/50 bg-red-400/10';
      default:
        return 'border-gray-400/50';
    }
  };

  const networkStats = {
    ethereum: { contracts: 2, transactions: 1703, gasSpent: 4372130 },
    polygon: { contracts: 2, transactions: 1348, gasSpent: 4648414 },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="chrome-surface rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold neon-text flex items-center gap-2">
            <Link2 className="w-6 h-6" />
            Blockchain Integration
          </h2>
          <button className="chrome-button rounded-lg px-4 py-2 text-sm font-semibold">
            Deploy New Contract
          </button>
        </div>

        {/* Network Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="glass-effect rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-white">Ethereum Sepolia</h3>
              <span className="w-3 h-3 rounded-full bg-green-400 animate-pulse" />
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-xs text-gray-400">Contracts</p>
                <p className="text-lg font-bold text-white">{networkStats.ethereum.contracts}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Transactions</p>
                <p className="text-lg font-bold text-white">{networkStats.ethereum.transactions}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Gas Used</p>
                <p className="text-lg font-bold text-white">
                  {(networkStats.ethereum.gasSpent / 1000000).toFixed(1)}M
                </p>
              </div>
            </div>
          </div>

          <div className="glass-effect rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-white">Polygon Mumbai</h3>
              <span className="w-3 h-3 rounded-full bg-green-400 animate-pulse" />
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-xs text-gray-400">Contracts</p>
                <p className="text-lg font-bold text-white">{networkStats.polygon.contracts}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Transactions</p>
                <p className="text-lg font-bold text-white">{networkStats.polygon.transactions}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Gas Used</p>
                <p className="text-lg font-bold text-white">
                  {(networkStats.polygon.gasSpent / 1000000).toFixed(1)}M
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Smart Contracts */}
      <div className="chrome-surface rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">Deployed Smart Contracts</h3>
        <div className="space-y-3">
          {contracts.map((contract) => (
            <div
              key={contract.id}
              className={`glass-effect rounded-lg p-4 border-l-4 ${getStatusColor(contract.status)}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {getStatusIcon(contract.status)}
                    <h4 className="font-bold text-white text-lg">{contract.name}</h4>
                    <span className="text-xs px-2 py-1 rounded-full bg-[var(--neon-blue)]/20 text-[var(--neon-blue)] border border-[var(--neon-blue)]/30">
                      {contract.network}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <code className="bg-gray-800 px-2 py-1 rounded">{contract.address}</code>
                    <button className="hover:text-[var(--neon-blue)] transition-colors">
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  {contract.status}
                </span>
              </div>

              {contract.status === 'deployed' && (
                <div className="grid grid-cols-3 gap-4 pt-3 border-t border-gray-700">
                  <div>
                    <p className="text-xs text-gray-400">Deployed</p>
                    <p className="text-sm font-semibold text-white">
                      {contract.deployedAt?.toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Gas Used</p>
                    <p className="text-sm font-semibold text-white">
                      {contract.gasUsed?.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Transactions</p>
                    <p className="text-sm font-semibold text-white">
                      {contract.transactions.toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="chrome-surface rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">Recent Transactions</h3>
        <div className="space-y-2">
          {[
            { hash: '0x8f3c...a063', type: 'Mint NFT', contract: 'NFTMarketplace', time: '2 min ago', status: 'success' },
            { hash: '0x742d...bEb', type: 'Transfer Token', contract: 'GovernanceToken', time: '5 min ago', status: 'success' },
            { hash: '0x1f98...F984', type: 'Stake', contract: 'StakingPool', time: '12 min ago', status: 'pending' },
            { hash: '0x7D1A...eBB0', type: 'Vote', contract: 'TreasuryDAO', time: '18 min ago', status: 'success' },
          ].map((tx, index) => (
            <div key={index} className="glass-effect rounded-lg p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {tx.status === 'success' ? (
                  <CheckCircle className="w-4 h-4 text-green-400" />
                ) : (
                  <Clock className="w-4 h-4 text-yellow-400" />
                )}
                <div>
                  <p className="text-sm font-semibold text-white">{tx.type}</p>
                  <p className="text-xs text-gray-400">
                    <code>{tx.hash}</code> • {tx.contract}
                  </p>
                </div>
              </div>
              <span className="text-xs text-gray-400">{tx.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}