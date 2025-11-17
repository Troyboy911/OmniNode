'use client';

import { useState, useEffect } from 'react';
import { Activity, CheckCircle, XCircle, Clock, Terminal } from 'lucide-react';
import { io, Socket } from 'socket.io-client';

interface TaskProgress {
  taskId: string;
  runId: string;
  event: string;
  data: any;
  timestamp: Date;
}

interface ExecutionLog {
  id: string;
  level: string;
  message: string;
  timestamp: Date;
  data?: any;
}

interface TaskMonitorProps {
  taskId: string;
  userId: string;
}

export default function TaskMonitor({ taskId, userId }: TaskMonitorProps) {
  const [progress, setProgress] = useState<TaskProgress[]>([]);
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [status, setStatus] = useState<string>('idle');
  const [currentStep, setCurrentStep] = useState<string>('');
  const [progressPercent, setProgressPercent] = useState<number>(0);

  useEffect(() => {
    // Connect to Socket.IO
    const newSocket = io(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001', {
      auth: {
        userId
      }
    });

    newSocket.on('connect', () => {
      console.log('Socket.IO connected');
      newSocket.emit('join', `user:${userId}`);
    });

    newSocket.on('task:progress', (data: TaskProgress) => {
      if (data.taskId === taskId) {
        setProgress(prev => [...prev, data]);
        
        // Update status based on event
        setStatus(data.event);
        
        // Update current step if provided
        if (data.data.step) {
          setCurrentStep(data.data.step);
        }
        
        // Update progress percentage
        if (data.data.progress !== undefined) {
          setProgressPercent(data.data.progress);
        }

        // Add to logs
        setLogs(prev => [...prev, {
          id: `log-${Date.now()}`,
          level: 'INFO',
          message: data.data.step || `Event: ${data.event}`,
          timestamp: new Date(data.timestamp),
          data: data.data
        }]);
      }
    });

    newSocket.on('disconnect', () => {
      console.log('Socket.IO disconnected');
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [taskId, userId]);

  const getStatusIcon = () => {
    switch (status) {
      case 'started':
      case 'classifying':
      case 'planning':
      case 'executing':
        return <Activity className="w-6 h-6 text-blue-400 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-6 h-6 text-green-400" />;
      case 'failed':
        return <XCircle className="w-6 h-6 text-red-400" />;
      default:
        return <Clock className="w-6 h-6 text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'started':
      case 'classifying':
      case 'planning':
      case 'executing':
        return 'text-blue-400 bg-blue-500/20';
      case 'completed':
        return 'text-green-400 bg-green-500/20';
      case 'failed':
        return 'text-red-400 bg-red-500/20';
      default:
        return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'ERROR':
        return 'text-red-400';
      case 'WARN':
        return 'text-yellow-400';
      case 'INFO':
        return 'text-blue-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <div className="chrome-surface rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div>
              <h2 className="text-2xl font-bold neon-text">Task Execution</h2>
              <p className="text-sm text-gray-400">Task ID: {taskId}</p>
            </div>
          </div>

          <span className={`px-4 py-2 rounded-full text-sm font-bold ${getStatusColor()}`}>
            {status.toUpperCase()}
          </span>
        </div>

        {/* Current Step */}
        {currentStep && (
          <div className="mb-4">
            <p className="text-sm text-gray-400 mb-2">Current Step:</p>
            <p className="text-white font-medium">{currentStep}</p>
          </div>
        )}

        {/* Progress Bar */}
        {progressPercent > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-400">Progress</span>
              <span className="text-[var(--neon-blue)]">{progressPercent.toFixed(0)}%</span>
            </div>
            <div className="h-2 bg-black/50 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[var(--neon-blue)] to-blue-500 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Connection Status */}
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <div className={`w-2 h-2 rounded-full ${socket?.connected ? 'bg-green-400' : 'bg-red-400'}`} />
          <span>{socket?.connected ? 'Connected' : 'Disconnected'}</span>
        </div>
      </div>

      {/* Execution Logs */}
      <div className="chrome-surface rounded-xl p-6">
        <h3 className="text-xl font-bold neon-text mb-4 flex items-center gap-2">
          <Terminal className="w-5 h-5" />
          Execution Logs ({logs.length})
        </h3>

        <div className="bg-black/50 rounded-lg p-4 max-h-96 overflow-y-auto font-mono text-sm">
          {logs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Waiting for execution to start...
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => (
                <div key={log.id} className="flex gap-3 text-xs">
                  <span className="text-gray-500 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  <span className={`font-bold w-12 ${getLogLevelColor(log.level)}`}>
                    [{log.level}]
                  </span>
                  <span className="text-gray-300 flex-1">{log.message}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Progress Timeline */}
      <div className="chrome-surface rounded-xl p-6">
        <h3 className="text-xl font-bold neon-text mb-4">Progress Timeline</h3>

        <div className="space-y-3">
          {progress.map((item, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-[var(--neon-blue)] mt-2" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-white font-medium">{item.event}</span>
                  <span className="text-xs text-gray-500">
                    {new Date(item.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                {item.data.step && (
                  <p className="text-sm text-gray-400">{item.data.step}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
