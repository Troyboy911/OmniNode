import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Authentication
export const authAPI = {
  register: (data: any) => apiClient.post('/auth/register', data),
  login: (data: any) => apiClient.post('/auth/login', data),
  refresh: (data: any) => apiClient.post('/auth/refresh', data),
  logout: () => apiClient.post('/auth/logout'),
  me: () => apiClient.get('/auth/me'),
};

// AI APIs
export const aiAPI = {
  chat: (data: any) => apiClient.post('/ai/chat', data),
  getConversations: (params?: any) => apiClient.get('/ai/conversations', { params }),
  getMessages: (conversationId: string) => apiClient.get(`/ai/conversations/${conversationId}/messages`),
  processFile: (data: any) => apiClient.post('/ai/process-file', data),
  getProcessingJobs: (params?: any) => apiClient.get('/ai/processing-jobs', { params }),
  getModels: () => apiClient.get('/ai/models'),
};

// File APIs
export const fileAPI = {
  upload: (formData: FormData) => apiClient.post('/files/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getFiles: (params?: any) => apiClient.get('/files', { params }),
  getFile: (id: string) => apiClient.get(`/files/${id}`),
  downloadFile: (id: string) => apiClient.get(`/files/${id}/download`, { responseType: 'blob' }),
  deleteFile: (id: string) => apiClient.delete(`/files/${id}`),
  getStats: () => apiClient.get('/files/stats'),
};

// Project APIs
export const projectAPI = {
  getProjects: (params?: any) => apiClient.get('/projects', { params }),
  getProject: (id: string) => apiClient.get(`/projects/${id}`),
  createProject: (data: any) => apiClient.post('/projects', data),
  updateProject: (id: string, data: any) => apiClient.put(`/projects/${id}`, data),
  deleteProject: (id: string) => apiClient.delete(`/projects/${id}`),
};

// Agent APIs
export const agentAPI = {
  getAgents: (params?: any) => apiClient.get('/agents', { params }),
  getAgent: (id: string) => apiClient.get(`/agents/${id}`),
  createAgent: (data: any) => apiClient.post('/agents', data),
  updateAgent: (id: string, data: any) => apiClient.put(`/agents/${id}`, data),
  deleteAgent: (id: string) => apiClient.delete(`/agents/${id}`),
};

// Task APIs
export const taskAPI = {
  getTasks: (params?: any) => apiClient.get('/tasks', { params }),
  getTask: (id: string) => apiClient.get(`/tasks/${id}`),
  createTask: (data: any) => apiClient.post('/tasks', data),
  updateTask: (id: string, data: any) => apiClient.put(`/tasks/${id}`, data),
  deleteTask: (id: string) => apiClient.delete(`/tasks/${id}`),
};

// Command APIs
export const commandAPI = {
  getCommands: (params?: any) => apiClient.get('/commands', { params }),
  createCommand: (data: any) => apiClient.post('/commands', data),
};

// Health check
export const healthAPI = {
  check: () => apiClient.get('/health'),
};

export default apiClient;