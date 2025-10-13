import { apiClient } from '@/lib/api-client';
import axios from 'axios';
import { io } from 'socket.io-client';

// Mock axios and socket.io
jest.mock('axios');
jest.mock('socket.io-client');

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedIo = io as jest.MockedFunction<typeof io>;

describe('API Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('Authentication', () => {
    it('should register a new user', async () => {
      const mockResponse = {
        data: {
          token: 'test-token',
          user: { id: '1', email: 'test@example.com', name: 'Test User' }
        }
      };
      mockedAxios.create.mockReturnValue({
        post: jest.fn().mockResolvedValue(mockResponse),
        get: jest.fn(),
        patch: jest.fn(),
        delete: jest.fn(),
        interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } }
      } as any);

      const result = await apiClient.register({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      });

      expect(result.token).toBe('test-token');
      expect(result.user.email).toBe('test@example.com');
    });

    it('should login a user', async () => {
      const mockResponse = {
        data: {
          token: 'test-token',
          user: { id: '1', email: 'test@example.com', name: 'Test User' }
        }
      };
      mockedAxios.create.mockReturnValue({
        post: jest.fn().mockResolvedValue(mockResponse),
        get: jest.fn(),
        patch: jest.fn(),
        delete: jest.fn(),
        interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } }
      } as any);

      const result = await apiClient.login({
        email: 'test@example.com',
        password: 'password123'
      });

      expect(result.token).toBe('test-token');
      expect(result.user.email).toBe('test@example.com');
    });

    it('should handle authentication errors', async () => {
      const mockError = new Error('Authentication failed');
      mockedAxios.create.mockReturnValue({
        post: jest.fn().mockRejectedValue(mockError),
        get: jest.fn(),
        patch: jest.fn(),
        delete: jest.fn(),
        interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } }
      } as any);

      await expect(apiClient.login({
        email: 'test@example.com',
        password: 'wrong'
      })).rejects.toThrow('Authentication failed');
    });
  });

  describe('Projects', () => {
    it('should fetch projects', async () => {
      const mockProjects = [
        { id: '1', name: 'Test Project', description: 'Test Description' }
      ];
      mockedAxios.create.mockReturnValue({
        get: jest.fn().mockResolvedValue({ data: mockProjects }),
        post: jest.fn(),
        patch: jest.fn(),
        delete: jest.fn(),
        interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } }
      } as any);

      const projects = await apiClient.getProjects();
      expect(projects).toEqual(mockProjects);
    });

    it('should create a new project', async () => {
      const mockProject = { id: '1', name: 'New Project', description: 'New Description' };
      mockedAxios.create.mockReturnValue({
        post: jest.fn().mockResolvedValue({ data: mockProject }),
        get: jest.fn(),
        patch: jest.fn(),
        delete: jest.fn(),
        interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } }
      } as any);

      const project = await apiClient.createProject({
        name: 'New Project',
        description: 'New Description'
      });
      expect(project).toEqual(mockProject);
    });
  });

  describe('Agents', () => {
    it('should fetch agents', async () => {
      const mockAgents = [
        { id: '1', name: 'Test Agent', type: 'general', projectId: '1' }
      ];
      mockedAxios.create.mockReturnValue({
        get: jest.fn().mockResolvedValue({ data: mockAgents }),
        post: jest.fn(),
        patch: jest.fn(),
        delete: jest.fn(),
        interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } }
      } as any);

      const agents = await apiClient.getAgents();
      expect(agents).toEqual(mockAgents);
    });

    it('should create a new agent', async () => {
      const mockAgent = { id: '1', name: 'New Agent', type: 'general', projectId: '1' };
      mockedAxios.create.mockReturnValue({
        post: jest.fn().mockResolvedValue({ data: mockAgent }),
        get: jest.fn(),
        patch: jest.fn(),
        delete: jest.fn(),
        interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } }
      } as any);

      const agent = await apiClient.createAgent({
        name: 'New Agent',
        type: 'general',
        projectId: '1',
        config: {}
      });
      expect(agent).toEqual(mockAgent);
    });
  });

  describe('WebSocket', () => {
    it('should connect to WebSocket', () => {
      const mockSocket = {
        on: jest.fn(),
        emit: jest.fn(),
        disconnect: jest.fn(),
        connected: true
      };
      mockedIo.mockReturnValue(mockSocket as any);

      const socket = apiClient.connectSocket();
      expect(mockedIo).toHaveBeenCalled();
      expect(socket).toBe(mockSocket);
    });

    it('should disconnect WebSocket', () => {
      const mockSocket = {
        on: jest.fn(),
        emit: jest.fn(),
        disconnect: jest.fn()
      };
      mockedIo.mockReturnValue(mockSocket as any);

      apiClient.connectSocket();
      apiClient.disconnectSocket();
      expect(mockSocket.disconnect).toHaveBeenCalled();
    });
  });
});