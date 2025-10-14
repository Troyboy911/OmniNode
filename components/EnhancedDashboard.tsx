'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient, Project, Agent, Task, Command } from '@/lib/api-client';
import { useWebSocket, useProjectUpdates, useAgentUpdates, useTaskUpdates } from '@/hooks/useWebSocket';
import { Brain, Plus, RefreshCw, Settings, Activity, Users, Target, FileText, Zap, Network } from 'lucide-react';

interface DashboardProps {
  initialData?: {
    projects: Project[];
    agents: Agent[];
    tasks: Task[];
  };
}

export default function EnhancedDashboard({ initialData }: DashboardProps) {
  const [projects, setProjects] = useState<Project[]>(initialData?.projects || []);
  const [agents, setAgents] = useState<Agent[]>(initialData?.agents || []);
  const [tasks, setTasks] = useState<Task[]>(initialData?.tasks || []);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(!initialData);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showCreateAgent, setShowCreateAgent] = useState(false);
  const [showOrchestration, setShowOrchestration] = useState(false);
  const [orchestrationGoal, setOrchestrationGoal] = useState('');
  const [orchestrationResult, setOrchestrationResult] = useState<any>(null);
  const router = useRouter();

  const { state: wsState, on, emit } = useWebSocket();

  // Load initial data
  useEffect(() => {
    if (!initialData) {
      loadData();
    }
  }, []);

  // WebSocket event handlers
  useEffect(() => {
    const handleProjectUpdate = (updatedProject: Project) => {
      setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
    };

    const handleAgentUpdate = (updatedAgent: Agent) => {
      setAgents(prev => prev.map(a => a.id === updatedAgent.id ? updatedAgent : a));
    };

    const handleTaskUpdate = (updatedTask: Task) => {
      setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
    };

    const handleNewProject = (newProject: Project) => {
      setProjects(prev => [newProject, ...prev]);
    };

    const handleNewAgent = (newAgent: Agent) => {
      setAgents(prev => [newAgent, ...prev]);
    };

    const handleNewTask = (newTask: Task) => {
      setTasks(prev => [newTask, ...prev]);
    };

    on('project:update', handleProjectUpdate);
    on('project:create', handleNewProject);
    on('agent:update', handleAgentUpdate);
    on('agent:create', handleNewAgent);
    on('task:update', handleTaskUpdate);
    on('task:create', handleNewTask);

    return () => {
      // Cleanup listeners
    };
  }, [on]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [projectsData, agentsData, tasksData] = await Promise.all([
        apiClient.getProjects(),
        apiClient.getAgents(),
        apiClient.getTasks(),
      ]);

      setProjects(projectsData);
      setAgents(agentsData);
      setTasks(tasksData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createProject = async (name: string, description: string) => {
    try {
      const newProject = await apiClient.createProject({ name, description });
      setProjects(prev => [newProject, ...prev]);
      setShowCreateProject(false);
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  };

  const createAgent = async (name: string, type: string, projectId: string, config: any) => {
    try {
      const newAgent = await apiClient.createAgent({ name, type, projectId, config });
      setAgents(prev => [newAgent, ...prev]);
      setShowCreateAgent(false);
    } catch (error) {
      console.error('Failed to create agent:', error);
    }
  };

  const getProjectStats = (projectId: string) => {
    const projectAgents = agents.filter(a => a.projectId === projectId);
    const projectTasks = tasks.filter(t => projectAgents.some(a => a.id === t.agentId));
    
    return {
      agents: projectAgents.length,
      tasks: projectTasks.length,
      completedTasks: projectTasks.filter(t => t.status === 'completed').length,
      runningTasks: projectTasks.filter(t => t.status === 'in_progress').length,
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-gray-400">
          <RefreshCw className="w-6 h-6 animate-spin" />
          Loading dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-gray-400">
            {wsState.isConnected ? '🟢 Connected' : '🔴 Disconnected'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            className="chrome-button px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={() => setShowCreateProject(true)}
            className="chrome-button px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Project
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="chrome-surface rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Projects</p>
              <p className="text-2xl font-bold text-white">{projects.length}</p>
            </div>
            <FileText className="w-8 h-8 text-blue-400" />
          </div>
        </div>
        <div className="chrome-surface rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Active Agents</p>
              <p className="text-2xl font-bold text-white">{agents.length}</p>
            </div>
            <Users className="w-8 h-8 text-green-400" />
          </div>
        </div>
        <div className="chrome-surface rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Tasks</p>
              <p className="text-2xl font-bold text-white">{tasks.length}</p>
            </div>
            <Target className="w-8 h-8 text-yellow-400" />
          </div>
        </div>
        <div className="chrome-surface rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Running Tasks</p>
              <p className="text-2xl font-bold text-white">
                {tasks.filter(t => t.status === 'in_progress').length}
              </p>
            </div>
            <Activity className="w-8 h-8 text-purple-400" />
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white">Projects</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => {
            const stats = getProjectStats(project.id);
            return (
              <div
                key={project.id}
                className="chrome-surface rounded-xl p-6 cursor-pointer hover:border-blue-500/50 transition-all"
                onClick={() => setSelectedProject(project.id === selectedProject ? null : project.id)}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">{project.name}</h3>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    project.status === 'active' ? 'bg-green-500/20 text-green-400' :
                    project.status === 'paused' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                    {project.status}
                  </span>
                </div>
                <p className="text-gray-400 text-sm mb-4">{project.description}</p>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400">Agents</p>
                    <p className="text-white font-semibold">{stats.agents}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Tasks</p>
                    <p className="text-white font-semibold">{stats.tasks}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Running</p>
                    <p className="text-green-400 font-semibold">{stats.runningTasks}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Completed</p>
                    <p className="text-blue-400 font-semibold">{stats.completedTasks}</p>
                  </div>
                </div>

                {selectedProject === project.id && (
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowCreateAgent(true);
                        }}
                        className="flex-1 px-3 py-2 bg-blue-500/20 text-blue-400 rounded-lg text-sm hover:bg-blue-500/30 transition-colors"
                      >
                        Add Agent
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/projects/${project.id}`);
                        }}
                        className="flex-1 px-3 py-2 bg-gray-500/20 text-gray-400 rounded-lg text-sm hover:bg-gray-500/30 transition-colors"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Tasks */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Recent Tasks</h2>
          <button
            onClick={() => setTasks([])} // This would refresh tasks
            className="text-gray-400 hover:text-white text-sm"
          >
            View All
          </button>
        </div>
        <div className="chrome-surface rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Task
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Agent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {tasks.slice(0, 10).map((task) => {
                  const agent = agents.find(a => a.id === task.agentId);
                  return (
                    <tr key={task.id} className="hover:bg-gray-800/30">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-white">{task.title}</div>
                          <div className="text-sm text-gray-400">{task.description}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-300">{agent?.name || 'Unknown'}</div>
                        <div className="text-sm text-gray-500">{agent?.type}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          task.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                          task.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400' :
                          task.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                          'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {task.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          task.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                          task.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-green-500/20 text-green-400'
                        }`}>
                          {task.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        {new Date(task.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create Project Modal */}
      {showCreateProject && (
        <CreateProjectModal
          onClose={() => setShowCreateProject(false)}
          onCreate={createProject}
        />
      )}

      {/* Create Agent Modal */}
      {showCreateAgent && (
        <CreateAgentModal
          onClose={() => setShowCreateAgent(false)}
          onCreate={createAgent}
          projects={projects}
        />
      )}
    </div>
  );
}

function CreateProjectModal({ onClose, onCreate }: { onClose: () => void; onCreate: (name: string, description: string) => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onCreate(name, description);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="glass-effect rounded-xl p-6 w-full max-w-md mx-4">
        <h3 className="text-xl font-bold text-white mb-4">Create New Project</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Project Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter project name"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter project description"
              rows={3}
            />
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CreateAgentModal({ onClose, onCreate, projects }: { onClose: () => void; onCreate: (name: string, type: string, projectId: string, config: any) => void; projects: Project[] }) {
  const [name, setName] = useState('');
  const [type, setType] = useState('general');
  const [projectId, setProjectId] = useState(projects[0]?.id || '');
  const [config, setConfig] = useState('{}');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && projectId) {
      try {
        const configObj = JSON.parse(config);
        onCreate(name, type, projectId, configObj);
      } catch (error) {
        alert('Invalid JSON configuration');
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="glass-effect rounded-xl p-6 w-full max-w-md mx-4">
        <h3 className="text-xl font-bold text-white mb-4">Create New Agent</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Agent Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter agent name"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Agent Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="general">General</option>
              <option value="research">Research</option>
              <option value="code">Code</option>
              <option value="creative">Creative</option>
              <option value="analysis">Analysis</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Project
            </label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Configuration (JSON)
            </label>
            <textarea
              value={config}
              onChange={(e) => setConfig(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              placeholder="{}"
              rows={3}
            />
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}