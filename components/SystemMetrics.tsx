'use client';

import { SystemMetrics } from '@/types';
import { Cpu, HardDrive, Network, Users } from 'lucide-react';

interface SystemMetricsProps {
  metrics: SystemMetrics;
}

export default function SystemMetricsPanel({ metrics }: SystemMetricsProps) {
  const metricItems = [
    {
      icon: Users,
      label: 'Active Agents',
      value: metrics.activeAgents,
      color: 'text-green-400',
    },
    {
      icon: Cpu,
      label: 'System Load',
      value: `${(metrics.systemLoad * 100).toFixed(0)}%`,
      color: 'text-yellow-400',
      progress: metrics.systemLoad,
    },
    {
      icon: HardDrive,
      label: 'Memory Usage',
      value: `${(metrics.memoryUsage * 100).toFixed(0)}%`,
      color: 'text-blue-400',
      progress: metrics.memoryUsage,
    },
    {
      icon: Network,
      label: 'Network Activity',
      value: `${(metrics.networkActivity * 100).toFixed(0)}%`,
      color: 'text-purple-400',
      progress: metrics.networkActivity,
    },
  ];

  return (
    <div className="chrome-surface rounded-xl p-6">
      <h2 className="text-xl font-bold neon-text mb-6 flex items-center gap-2">
        <Cpu className="w-6 h-6" />
        System Metrics
      </h2>

      <div className="grid grid-cols-2 gap-4">
        {metricItems.map((item, index) => (
          <div key={index} className="glass-effect rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <item.icon className={`w-5 h-5 ${item.color}`} />
              <span className="text-sm text-gray-400">{item.label}</span>
            </div>
            <div className="text-2xl font-bold text-white mb-2">{item.value}</div>
            {item.progress !== undefined && (
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full bg-gradient-to-r ${
                    item.progress > 0.8
                      ? 'from-red-500 to-red-600'
                      : item.progress > 0.6
                      ? 'from-yellow-500 to-yellow-600'
                      : 'from-green-500 to-green-600'
                  }`}
                  style={{ width: `${item.progress * 100}%` }}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Task Statistics */}
      <div className="mt-6 pt-6 border-t border-gray-700">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-sm text-gray-400 mb-1">Total Tasks</p>
            <p className="text-2xl font-bold text-white">{metrics.totalTasks}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-1">Completed</p>
            <p className="text-2xl font-bold text-green-400">{metrics.completedTasks}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-1">Success Rate</p>
            <p className="text-2xl font-bold text-[var(--neon-blue)]">
              {((metrics.completedTasks / metrics.totalTasks) * 100).toFixed(0)}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}