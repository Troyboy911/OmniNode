/**
 * WebSocket Durable Object
 * Handles real-time WebSocket connections for live updates
 */

import { DurableObject } from 'cloudflare:workers';

export class WebSocketDurableObject extends DurableObject {
  private sessions: Map<WebSocket, { userId: string; projectId?: string }>;

  constructor(state: DurableObjectState, env: any) {
    super(state, env);
    this.sessions = new Map();
  }

  async fetch(request: Request) {
    // Handle WebSocket upgrade
    if (request.headers.get('Upgrade') === 'websocket') {
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);

      // Accept the WebSocket connection
      this.ctx.acceptWebSocket(server);

      // Get user info from query params
      const url = new URL(request.url);
      const userId = url.searchParams.get('userId');
      const projectId = url.searchParams.get('projectId');

      if (!userId) {
        server.close(1008, 'User ID required');
        return new Response(null, { status: 400 });
      }

      // Store session info
      this.sessions.set(server, { userId, projectId: projectId || undefined });

      // Send welcome message
      server.send(JSON.stringify({
        type: 'connected',
        userId,
        projectId,
        timestamp: new Date().toISOString()
      }));

      return new Response(null, {
        status: 101,
        webSocket: client
      });
    }

    return new Response('Expected WebSocket', { status: 400 });
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
    try {
      const session = this.sessions.get(ws);
      if (!session) return;

      // Parse message
      const data = typeof message === 'string' ? JSON.parse(message) : null;
      if (!data) return;

      // Handle different message types
      switch (data.type) {
        case 'ping':
          ws.send(JSON.stringify({
            type: 'pong',
            timestamp: new Date().toISOString()
          }));
          break;

        case 'subscribe':
          // Subscribe to specific project updates
          if (data.projectId) {
            session.projectId = data.projectId;
            this.sessions.set(ws, session);
            ws.send(JSON.stringify({
              type: 'subscribed',
              projectId: data.projectId,
              timestamp: new Date().toISOString()
            }));
          }
          break;

        case 'broadcast':
          // Broadcast message to all users in the same project
          this.broadcast(data.message, session.projectId, ws);
          break;

        default:
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Unknown message type',
            timestamp: new Date().toISOString()
          }));
      }
    } catch (error) {
      console.error('WebSocket message error:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Failed to process message',
        timestamp: new Date().toISOString()
      }));
    }
  }

  async webSocketClose(ws: WebSocket, code: number, reason: string, wasClean: boolean) {
    // Remove session
    this.sessions.delete(ws);
    ws.close(code, reason);
  }

  async webSocketError(ws: WebSocket, error: Error) {
    console.error('WebSocket error:', error);
    this.sessions.delete(ws);
  }

  // Broadcast message to all connected clients in a project
  private broadcast(message: any, projectId?: string, sender?: WebSocket) {
    const payload = JSON.stringify({
      type: 'broadcast',
      data: message,
      timestamp: new Date().toISOString()
    });

    for (const [ws, session] of this.sessions.entries()) {
      // Skip sender
      if (ws === sender) continue;

      // Only send to users in the same project (if projectId specified)
      if (projectId && session.projectId !== projectId) continue;

      try {
        ws.send(payload);
      } catch (error) {
        console.error('Failed to send message:', error);
        this.sessions.delete(ws);
      }
    }
  }

  // Send message to specific user
  async sendToUser(userId: string, message: any) {
    const payload = JSON.stringify({
      type: 'message',
      data: message,
      timestamp: new Date().toISOString()
    });

    for (const [ws, session] of this.sessions.entries()) {
      if (session.userId === userId) {
        try {
          ws.send(payload);
        } catch (error) {
          console.error('Failed to send message:', error);
          this.sessions.delete(ws);
        }
      }
    }
  }

  // Send message to all users in a project
  async sendToProject(projectId: string, message: any) {
    const payload = JSON.stringify({
      type: 'project_update',
      data: message,
      timestamp: new Date().toISOString()
    });

    for (const [ws, session] of this.sessions.entries()) {
      if (session.projectId === projectId) {
        try {
          ws.send(payload);
        } catch (error) {
          console.error('Failed to send message:', error);
          this.sessions.delete(ws);
        }
      }
    }
  }

  // Get active connections count
  async getConnectionsCount(): Promise<number> {
    return this.sessions.size;
  }

  // Get connections by project
  async getProjectConnections(projectId: string): Promise<number> {
    let count = 0;
    for (const session of this.sessions.values()) {
      if (session.projectId === projectId) {
        count++;
      }
    }
    return count;
  }
}