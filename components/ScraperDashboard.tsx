'use client';

import { useState, useEffect } from 'react';
import { Play, Pause, Trash2, Calendar, TrendingUp, Database } from 'lucide-react';

interface ScraperJob {
  id: string;
  name: string;
  targetUrl: string;
  preset?: string;
  status: string;
  priority: number;
  lastRunAt?: Date;
  nextRunAt?: Date;
  results?: any[];
  schedules?: any[];
}

export default function ScraperDashboard() {
  const [jobs, setJobs] = useState<ScraperJob[]>([]);
  const [selectedPreset, setSelectedPreset] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [schedule, setSchedule] = useState('');
  const [loading, setLoading] = useState(false);

  const presets = [
    { key: 'NEWS_ARTICLE', name: 'News Article' },
    { key: 'PRODUCT_LISTING', name: 'Product Listing' },
    { key: 'SOCIAL_POSTS', name: 'Social Posts' },
    { key: 'JOB_LISTING', name: 'Job Listing' },
    { key: 'REAL_ESTATE', name: 'Real Estate' },
    { key: 'EVENT_LISTING', name: 'Event Listing' },
    { key: 'SEARCH_RESULTS', name: 'Search Results' },
    { key: 'BLOG_POSTS', name: 'Blog Posts' },
  ];

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const fetchJobs = async () => {
    try {
      const response = await fetch('/api/scraper');
      const data = await response.json();
      if (data.success) {
        setJobs(data.data);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
  };

  const createJob = async () => {
    if (!selectedPreset || !targetUrl) return;

    setLoading(true);
    try {
      const response = await fetch('/api/scraper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: 'default-project', // TODO: Get from context
          preset: selectedPreset,
          targetUrl,
          schedule: schedule || undefined,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setTargetUrl('');
        setSchedule('');
        await fetchJobs();
      }
    } catch (error) {
      console.error('Error creating job:', error);
    } finally {
      setLoading(false);
    }
  };

  const executeJob = async (jobId: string) => {
    try {
      await fetch(`/api/scraper/${jobId}/execute`, { method: 'POST' });
      await fetchJobs();
    } catch (error) {
      console.error('Error executing job:', error);
    }
  };

  const deleteJob = async (jobId: string) => {
    if (!confirm('Delete this scraper job?')) return;

    try {
      await fetch(`/api/scraper/${jobId}`, { method: 'DELETE' });
      await fetchJobs();
    } catch (error) {
      console.error('Error deleting job:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'RUNNING': return 'text-blue-400 bg-blue-500/20';
      case 'COMPLETED': return 'text-green-400 bg-green-500/20';
      case 'FAILED': return 'text-red-400 bg-red-500/20';
      case 'PAUSED': return 'text-yellow-400 bg-yellow-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  return (
    <div className="space-y-6">
      {/* Create New Job */}
      <div className="chrome-surface rounded-xl p-6">
        <h2 className="text-2xl font-bold neon-text mb-4 flex items-center gap-2">
          <TrendingUp className="w-6 h-6" />
          Create Scraper Job
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Preset Template</label>
            <select
              value={selectedPreset}
              onChange={(e) => setSelectedPreset(e.target.value)}
              className="w-full bg-black/50 border border-[var(--neon-blue)]/30 rounded-lg px-4 py-3 text-white focus:border-[var(--neon-blue)] focus:outline-none"
            >
              <option value="">Select a preset...</option>
              {presets.map((preset) => (
                <option key={preset.key} value={preset.key}>
                  {preset.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Target URL</label>
            <input
              type="url"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full bg-black/50 border border-[var(--neon-blue)]/30 rounded-lg px-4 py-3 text-white focus:border-[var(--neon-blue)] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Schedule (optional, cron format)
            </label>
            <input
              type="text"
              value={schedule}
              onChange={(e) => setSchedule(e.target.value)}
              placeholder="0 */6 * * * (every 6 hours)"
              className="w-full bg-black/50 border border-[var(--neon-blue)]/30 rounded-lg px-4 py-3 text-white focus:border-[var(--neon-blue)] focus:outline-none"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={createJob}
              disabled={loading || !selectedPreset || !targetUrl}
              className="w-full chrome-button rounded-lg px-6 py-3 font-bold disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Job'}
            </button>
          </div>
        </div>
      </div>

      {/* Jobs List */}
      <div className="chrome-surface rounded-xl p-6">
        <h2 className="text-2xl font-bold neon-text mb-4 flex items-center gap-2">
          <Database className="w-6 h-6" />
          Active Scraper Jobs ({jobs.length})
        </h2>

        <div className="space-y-4">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="bg-black/30 border border-[var(--neon-blue)]/30 rounded-lg p-4 hover:border-[var(--neon-blue)]/60 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold text-white">{job.name}</h3>
                    <span className={`text-xs px-3 py-1 rounded-full ${getStatusColor(job.status)}`}>
                      {job.status}
                    </span>
                    {job.preset && (
                      <span className="text-xs px-3 py-1 rounded-full bg-purple-500/20 text-purple-400">
                        {job.preset}
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-gray-400 mb-3">{job.targetUrl}</p>

                  <div className="flex items-center gap-6 text-xs text-gray-500">
                    {job.lastRunAt && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Last run: {new Date(job.lastRunAt).toLocaleString()}
                      </div>
                    )}
                    {job.results && job.results.length > 0 && (
                      <div className="flex items-center gap-1">
                        <Database className="w-4 h-4" />
                        {job.results[0].itemsCount || 0} items collected
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => executeJob(job.id)}
                    className="p-2 hover:bg-[var(--neon-blue)]/20 rounded-lg transition-colors"
                    title="Execute now"
                  >
                    <Play className="w-5 h-5 text-green-400" />
                  </button>
                  <button
                    onClick={() => deleteJob(job.id)}
                    className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                    title="Delete job"
                  >
                    <Trash2 className="w-5 h-5 text-red-400" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {jobs.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No scraper jobs yet. Create one above to get started!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
