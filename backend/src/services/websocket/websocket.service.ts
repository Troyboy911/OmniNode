import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import { logger } from '../../config/logger';
import { config } from '../../config/env';
import { prisma } from '../../config/database';
import jwt from 'jsonwebtoken';

export interface SocketUser {
  id: string;
  email: string;
  username: string;
}

export interface SocketEvents {
  // AI Events
  'ai:chat:start': (data: { message: string; conversationId: string }) => void;
  'ai:chat:stream': (data: { chunk: string; conversationId: string }) => void;
  'ai:chat:complete': (data: { conversationId: string; tokens: number }) => void;
  'ai:chat:error': (data: { conversationId: string; error: string }) => void;
  
  // File Events
  'file:upload:start': (data: { fileId: string; filename: string }) => void;
  'file:upload:progress': (data: { fileId: string; progress: number }) => void;
  'file:upload:complete': (data: { fileId: string; url: string }) => void;
  'file:upload:error': (data: { fileId: string; error: string }) => void;
  
  // Agent Events
  'agent:status:update': (data: { agentId: string; status: string }) => void;
  'agent:task:start': (data: { agentId: string; taskId: string }) => void;
  'agent:task:progress': (data: { agentId: string; taskId: string; progress: number }) => void;
  'agent:task:complete': (data: { agentId: string; taskId: string; result: any }) => void;
  
  // System Events
  'system:notification': (data: { type: string; message: string; userId?: string }) => void;
  'system:metrics:update': (data: { metrics: any }) => void;
  
  // User Events
  'user:online': (data: { userId: string; timestamp: string }) => void;
  'user:offline': (data: { userId: string; timestamp: string }) => void;
}

export class WebSocketService {
  private io: SocketIOServer;
  private pubClient: any;
  private subClient: any;
  private connectedUsers: Map<string, SocketUser> = new Map();

  constructor(server: HTTPServer) {
    this.initializeRedis();
    this.initializeSocketIO(server);
    this.setupEventHandlers();
  }

  private initializeRedis() {
    try {
      this.pubClient = createClient({ url: config.redis.url || 'redis://localhost:6379' });
      this.subClient = this.pubClient.duplicate();
      
      Promise.all([this.pubClient.connect(), this.subClient.connect()])
        .then(() => logger.info('Redis clients connected for Socket.IO'))
        .catch(err => logger.error('Redis connection error:', err));
    } catch (error) {
      logger.warn('Redis not available, using in-memory adapter');
    }
  }

  private initializeSocketIO(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3001',
        methods: ['GET', 'POST'],
        credentials: true,
      },
      adapter: this.pubClient && this.subClient ? createAdapter(this.pubClient, this.subClient) : undefined,
      transports: ['websocket', 'polling'],
    });

    logger.info('Socket.IO server initialized');
  }

  private setupEventHandlers() {
    this.io.use(this.authenticateSocket.bind(this));

    this.io.on('connection', (socket) => {
      const user = socket.data.user as SocketUser;
      logger.info(`User ${user.username} connected via WebSocket`);
      
      this.connectedUsers.set(socket.id, user);
      this.broadcastUserStatus(user.id, 'online');

      this.setupUserEventHandlers(socket, user);
      this.setupAIEventHandlers(socket, user);
      this.setupFileEventHandlers(socket, user);
      this.setupAgentEventHandlers(socket, user);

      socket.on('disconnect', () => {
        logger.info(`User ${user.username} disconnected`);
        this.connectedUsers.delete(socket.id);
        this.broadcastUserStatus(user.id, 'offline');
      });
    });
  }

  private async authenticateSocket(socket: any, next: (err?: any) => void) {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, config.jwt.secret) as any;
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, email: true, username: true }
      });

      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.data.user = user;
      next();
    } catch (error) {
      logger.error('WebSocket authentication error:', error);
      next(new Error('Authentication error: Invalid token'));
    }
  }

  private setupUserEventHandlers(socket: any, user: SocketUser) {
    socket.on('user:join:room', (roomId: string) => {
      socket.join(`room:${roomId}`);
      logger.info(`User ${user.username} joined room ${roomId}`);
    });

    socket.on('user:leave:room', (roomId: string) => {
      socket.leave(`room:${roomId}`);
      logger.info(`User ${user.username} left room ${roomId}`);
    });
  }

  private setupAIEventHandlers(socket: any, user: SocketUser) {
    socket.on('ai:chat:start', async (data) => {
      try {
        socket.join(`conversation:${data.conversationId}`);
        socket.to(`conversation:${data.conversationId}`).emit('ai:chat:start', {
          userId: user.id,
          ...data
        });
      } catch (error) {
        socket.emit('ai:chat:error', { error: error.message });
      }
    });

    socket.on('ai:chat:message', (data) => {
      socket.to(`conversation:${data.conversationId}`).emit('ai:chat:message', {
        userId: user.id,
        username: user.username,
        ...data
      });
    });
  }

  private setupFileEventHandlers(socket: any, user: SocketUser) {
    socket.on('file:upload:start', (data) => {
      socket.to(`user:${user.id}`).emit('file:upload:start', data);
    });

    socket.on('file:upload:progress', (data) => {
      socket.to(`user:${user.id}`).emit('file:upload:progress', data);
    });
  }

  private setupAgentEventHandlers(socket: any, user: SocketUser) {
    socket.on('agent:subscribe', (agentId: string) => {
      socket.join(`agent:${agentId}`);
      logger.info(`User ${user.username} subscribed to agent ${agentId}`);
    });

    socket.on('agent:unsubscribe', (agentId: string) => {
      socket.leave(`agent:${agentId}`);
      logger.info(`User ${user.username} unsubscribed from agent ${agentId}`);
    });
  }

  private broadcastUserStatus(userId: string, status: 'online' | 'offline') {
    this.io.emit('user:status:update', {
      userId,
      status,
      timestamp: new Date().toISOString()
    });
  }

  // Public methods for emitting events from other services

  emitToUser(userId: string, event: string, data: any) {
    this.io.to(`user:${userId}`).emit(event, data);
  }

  emitToConversation(conversationId: string, event: string, data: any) {
    this.io.to(`conversation:${conversationId}`).emit(event, data);
  }

  emitToAgent(agentId: string, event: string, data: any) {
    this.io.to(`agent:${agentId}`).emit(event, data);
  }

  broadcast(event: string, data: any) {
    this.io.emit(event, data);
  }

  emitAIStream(conversationId: string, chunk: string) {
    this.emitToConversation(conversationId, 'ai:chat:stream', { chunk });
  }

  emitFileProgress(userId: string, fileId: string, progress: number) {
    this.emitToUser(userId, 'file:upload:progress', { fileId, progress });
  }

  emitAgentStatus(agentId: string, status: string) {
    this.emitToAgent(agentId, 'agent:status:update', { agentId, status });
  }

  emitNotification(userId: string, type: string, message: string) {
    this.emitToUser(userId, 'system:notification', { type, message, userId });
  }

  emitMetricsUpdate(metrics: any) {
    this.broadcast('system:metrics:update', { metrics });
  }

  getConnectedUsers(): SocketUser[] {
    return Array.from(this.connectedUsers.values());
  }

  getOnlineUserCount(): number {
    return this.connectedUsers.size;
  }
}

export let websocketService: WebSocketService;

export function initializeWebSocket(server: HTTPServer): WebSocketService {
  websocketService = new WebSocketService(server);
  return websocketService;
}