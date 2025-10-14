import axios from 'axios';
import { io, Socket } from 'socket.io-client';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';

// Enhanced TypeScript interfaces
export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  userId: string;
  status: 'active' | 'paused' | 'completed';
  createdAt: string;
  updatedAt: string;
  agents?: Agent[];
}

export interface Agent {
  id: string;
  name: string;
  type: string;
  projectId: string;
  config: Record<string, any>;
  status: 'idle' | 'running' | 'error' | 'completed';
  createdAt: string;
  updatedAt: string;
  tasks?: Task[];
}

export interface Task {
  id: string;
  title: string;
  description: string;
  agentId: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  priority: 'low' | 'medium' | 'high';
  result?: any;
  createdAt: string;
  updatedAt: string;
}

export interface Command {
  id: string;
  content: string;
  userId: string;
  projectId?: string;
  agentId?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: any;
  createdAt: string;
  updatedAt: string;
}

export interface FileUpload {
  id: string;
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  url: string;
  userId: string;
  projectId?: string;
  createdAt: string;
}

export interface AIResponse {
  content: string;
  tokens: number;
  model: string;
  usage: any;
}

// Enhanced API Client Class
class ApiClient {
  private token: string | null = null;
  private socket: Socket | null = null;
  private axiosInstance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  constructor() {
    this.setupInterceptors();
  }

  private setupInterceptors() {
    this.axiosInstance.interceptors.request.use((config) => {
      const token = this.getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          this.clearToken();
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  getToken() {
    if (!this.token) {
      this.token = localStorage.getItem('token');
    }
    return this.token;
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('token');
  }

// Authentication
  async register(data: { email: string; password: string; name: string }) {
    const response = await this.axiosInstance.post('/auth/register', data);
    const { token, user } = response.data;
    this.setToken(token);
    return { token, user };
  }

  async login(data: { email: string; password: string }) {
    const response = await this.axiosInstance.post('/auth/login', data);
    const { token, user } = response.data;
    this.setToken(token);
    return { token, user };
  }

  async getCurrentUser() {
    const response = await this.axiosInstance.get('/auth/me');
    return response.data;
  }

  async refreshToken() {
    const response = await this.axiosInstance.post('/auth/refresh');
    const { token } = response.data;
    this.setToken(token);
    return token;
  }

  async logout() {
    await this.axiosInstance.post('/auth/logout');
    this.clearToken();
  }

// Projects
  async getProjects() {
    const response = await this.axiosInstance.get('/projects');
    return response.data;
  }

  async createProject(data: { name: string; description: string }) {
    const response = await this.axiosInstance.post('/projects', data);
    return response.data;
  }

  async getProject(id: string) {
    const response = await this.axiosInstance.get(`/projects/${id}`);
    return response.data;
  }

  async updateProject(id: string, data: Partial<Project>) {
    const response = await this.axiosInstance.patch(`/projects/${id}`, data);
    return response.data;
  }

  async deleteProject(id: string) {
    await this.axiosInstance.delete(`/projects/${id}`);
  }

  // Agents
  async getAgents(projectId?: string) {
    const url = projectId 
      ? `/agents?projectId=${projectId}`
      : '/agents';
    const response = await this.axiosInstance.get(url);
    return response.data;
  }

  async createAgent(data: { name: string; type: string; projectId: string; config: any }) {
    const response = await this.axiosInstance.post('/agents', data);
    return response.data;
  }

  async getAgent(id: string) {
    const response = await this.axiosInstance.get(`/agents/${id}`);
    return response.data;
  }

  async updateAgent(id: string, data: Partial<Agent>) {
    const response = await this.axiosInstance.patch(`/agents/${id}`, data);
    return response.data;
  }

  async deleteAgent(id: string) {
    await this.axiosInstance.delete(`/agents/${id}`);
  }

  // Tasks
  async getTasks(agentId?: string) {
    const url = agentId 
      ? `/tasks?agentId=${agentId}`
      : '/tasks';
    const response = await this.axiosInstance.get(url);
    return response.data;
  }

  async createTask(data: { title: string; description: string; agentId: string; priority: string }) {
    const response = await this.axiosInstance.post('/tasks', data);
    return response.data;
  }

  async updateTask(id: string, data: Partial<Task>) {
    const response = await this.axiosInstance.patch(`/tasks/${id}`, data);
    return response.data;
  }

  async deleteTask(id: string) {
    await this.axiosInstance.delete(`/tasks/${id}`);
  }

  // Commands
  async getCommands(projectId?: string, agentId?: string) {
    const params = new URLSearchParams();
    if (projectId) params.append('projectId', projectId);
    if (agentId) params.append('agentId', agentId);
    
    const url = `/commands${params.toString() ? `?${params}` : ''}`;
    const response = await this.axiosInstance.get(url);
    return response.data;
  }

  async createCommand(data: { content: string; projectId?: string; agentId?: string }) {
    const response = await this.axiosInstance.post('/commands', data);
    return response.data;
  }

  // AI
  async generateAIResponse(prompt: string, model?: string, context?: any) {
    const response = await this.axiosInstance.post('/ai/generate', {
      prompt,
      model,
      context
    });
    return response.data as AIResponse;
  }

  async chatWithAI(messages: Array<{ role: string; content: string }>, model?: string) {
    const response = await this.axiosInstance.post('/ai/chat', {
      messages,
      model
    });
    return response.data as AIResponse;
  }

  async getAIModels() {
    const response = await this.axiosInstance.get('/ai/models');
    return response.data;
  }

  // File Uploads
  async uploadFile(file: File, projectId?: string) {
    const formData = new FormData();
    formData.append('file', file);
    if (projectId) {
      formData.append('projectId', projectId);
    }

    const response = await this.axiosInstance.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data as FileUpload;
  }

  async getFiles(projectId?: string) {
    const url = projectId 
      ? `/files?projectId=${projectId}`
      : '/files';
    const response = await this.axiosInstance.get(url);
    return response.data as FileUpload[];
  }

  async deleteFile(id: string) {
    await this.axiosInstance.delete(`/files/${id}`);
  }

// File APIs
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


  // Health check
  async checkHealth() {
    const response = await this.axiosInstance.get('/health');
    return response.data;

  }
  processFile: (data: any) => apiClient.generateAIResponse(data.prompt, data.model, data.context),
  getProcessingJobs: () => Promise.resolve([]), // Not implemented yet
  getModels: () => apiClient.getAIModels(),
};

};

export const projectAPI = {
  getProjects: (params?: any) => apiClient.getProjects(),
  getProject: (id: string) => apiClient.getProject(id),
  createProject: (data: any) => apiClient.createProject(data),
  updateProject: (id: string, data: any) => apiClient.updateProject(id, data),
  deleteProject: (id: string) => apiClient.deleteProject(id),
};

  getTask: (id: string) => apiClient.getTasks().then(tasks => tasks.find((t: Task) => t.id === id)),
  createTask: (data: any) => apiClient.createTask(data),
  updateTask: (id: string, data: any) => apiClient.updateTask(id, data),
  deleteTask: (id: string) => apiClient.deleteTask(id),
};

export const commandAPI = {
  getCommands: (params?: any) => apiClient.getCommands(params?.projectId, params?.agentId),
  createCommand: (data: any) => apiClient.createCommand(data),
};

export const healthAPI = {
  check: () => apiClient.checkHealth(),
};

export default apiClient;
export { apiClient };