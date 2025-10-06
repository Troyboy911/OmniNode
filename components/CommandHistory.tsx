'use client';

import { Command, CommandStatus } from '@/types';
import { Terminal, CheckCircle, Clock, AlertCircle, Loader } from 'lucide-react';

interface CommandHistoryProps {
  commands: Command[];
}

'use client';

import { useEffect, useState } from 'react';

export default function CommandHistory({ commands }: CommandHistoryProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  const getStatusIcon = (status: CommandStatus) => {
    switch (status) {
      case CommandStatus.COMPLETED:
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case CommandStatus.PROCESSING:
        return <Loader className="w-4 h-4 text-yellow-400 animate-spin" />;
      case CommandStatus.EXECUTING:
        return <Clock className="w-4 h-4 text-blue-400 animate-pulse" />;
      case CommandStatus.FAILED:
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: CommandStatus) => {
    switch (status) {
      case CommandStatus.COMPLETED:
        return 'border-green-400/50';
      case CommandStatus.PROCESSING:
        return 'border-yellow-400/50';
      case CommandStatus.EXECUTING:
        return 'border-blue-400/50';
      case CommandStatus.FAILED:
        return 'border-red-400/50';
      default:
        return 'border-gray-400/50';
    }
  };

  return (
    <div className="chrome-surface rounded-xl p-6">
      <h2 className="text-xl font-bold neon-text mb-6 flex items-center gap-2">
        <Terminal className="w-6 h-6" />
        Command History
      </h2>

      <div className="space-y-3">
        {commands.map((command) => (
          <div
            key={command.id}
            className={`glass-effect rounded-lg p-4 border-l-4 ${getStatusColor(command.status)}`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                {getStatusIcon(command.status)}
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  {command.status.replace('_', ' ')}
                </span>
              </div>
              <span className="text-xs text-gray-500" suppressHydrationWarning>
                {mounted ? command.timestamp.toLocaleTimeString() : ''}
              </span>
            </div>
            <p className="text-sm text-white mb-2">{command.text}</p>
            {command.strategicPlan && (
              <div className="mt-3 pt-3 border-t border-gray-700">
                <p className="text-xs text-gray-400 mb-2">Strategic Plan:</p>
                <div className="space-y-1">
                  <p className="text-xs text-white">
                    <span className="text-gray-400">Objective:</span> {command.strategicPlan.objective}
                  </p>
                  <p className="text-xs text-white">
                    <span className="text-gray-400">Tasks:</span> {command.strategicPlan.breakdown.length}
                  </p>
                  <p className="text-xs text-white">
                    <span className="text-gray-400">Agents Required:</span>{' '}
                    {command.strategicPlan.requiredAgents.length}
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}