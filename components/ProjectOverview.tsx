'use client';

import { useEffect, useState } from 'react';
import { Project, ProjectStatus } from '@/types';
import { Folder, Calendar, DollarSign, TrendingUp, CheckCircle2 } from 'lucide-react';

interface ProjectOverviewProps {
  project: Project;
}

export default function ProjectOverview({ project }: ProjectOverviewProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const getStatusColor = () => {
    switch (project.status) {
      case ProjectStatus.PLANNING:
        return 'text-yellow-400';
      case ProjectStatus.IN_PROGRESS:
        return 'text-green-400';
      case ProjectStatus.PAUSED:
        return 'text-orange-400';
      case ProjectStatus.COMPLETED:
        return 'text-blue-400';
      default:
        return 'text-gray-400';
    }
  };

  const budgetPercentage = (project.budget.spent / project.budget.allocated) * 100;
  const timeElapsed = Math.floor(
    (new Date().getTime() - project.timeline.startDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const totalDays = Math.floor(
    (project.timeline.endDate.getTime() - project.timeline.startDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const timePercentage = (timeElapsed / totalDays) * 100;

  return (
    <div className="chrome-surface rounded-xl p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--neon-blue)] to-blue-600 flex items-center justify-center">
            <Folder className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{project.name}</h2>
            <p className="text-sm text-gray-400">{project.description}</p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor()} bg-current/20`}>
          {project.status.replace('_', ' ').toUpperCase()}
        </span>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="glass-effect rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-green-400" />
            <span className="text-xs text-gray-400">Budget</span>
          </div>
          <p className="text-lg font-bold text-white">
            ${project.budget.spent.toLocaleString()}
          </p>
          <p className="text-xs text-gray-400">
            of ${project.budget.allocated.toLocaleString()}
          </p>
          <div className="w-full bg-gray-700 rounded-full h-1.5 mt-2">
            <div
              className="bg-gradient-to-r from-green-500 to-green-600 h-1.5 rounded-full"
              style={{ width: `${budgetPercentage}%` }}
            />
          </div>
        </div>

        <div className="glass-effect rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-gray-400">Timeline</span>
          </div>
          <p className="text-lg font-bold text-white">{timeElapsed} days</p>
          <p className="text-xs text-gray-400">of {totalDays} days</p>
          <div className="w-full bg-gray-700 rounded-full h-1.5 mt-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-blue-600 h-1.5 rounded-full"
              style={{ width: `${timePercentage}%` }}
            />
          </div>
        </div>

        <div className="glass-effect rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-purple-400" />
            <span className="text-xs text-gray-400">Agents</span>
          </div>
          <p className="text-lg font-bold text-white">{project.agents.length}</p>
          <p className="text-xs text-gray-400">Active</p>
        </div>

        <div className="glass-effect rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-green-400" />
            <span className="text-xs text-gray-400">Progress</span>
          </div>
          <p className="text-lg font-bold text-white">
            {project.timeline.milestones.filter((m) => m.completed).length}
          </p>
          <p className="text-xs text-gray-400">
            of {project.timeline.milestones.length} milestones
          </p>
        </div>
      </div>

      {/* Milestones */}
      <div>
        <h3 className="text-sm font-semibold text-gray-400 mb-3">Milestones</h3>
        <div className="space-y-2">
          {project.timeline.milestones.map((milestone) => (
            <div
              key={milestone.id}
              className={`glass-effect rounded-lg p-3 flex items-center justify-between ${
                milestone.completed ? 'border-l-4 border-green-400' : 'border-l-4 border-gray-600'
              }`}
            >
              <div className="flex items-center gap-3">
                <CheckCircle2
                  className={`w-5 h-5 ${
                    milestone.completed ? 'text-green-400' : 'text-gray-600'
                  }`}
                />
                <div>
                  <p className="text-sm font-semibold text-white">{milestone.name}</p>
                  <p className="text-xs text-gray-400">{milestone.description}</p>
                </div>
              </div>
              <span className="text-xs text-gray-400" suppressHydrationWarning>
                {mounted ? new Date(milestone.targetDate).toLocaleDateString('en-US', {
                  month: 'numeric',
                  day: 'numeric',
                  year: 'numeric'
                }) : ''}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}