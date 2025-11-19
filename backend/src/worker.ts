/**
 * Cloudflare Workers Entry Point
 * 
 * This adapts the Express app to work with Cloudflare Workers
 */

import app from './app';

export interface Env {
  // Bindings
  SESSIONS: KVNamespace;
  CACHE: KVNamespace;
  FILES: R2Bucket;
  WEBSOCKET: DurableObjectNamespace;
  
  // Secrets
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_REFRESH_SECRET: string;
  OPENAI_API_KEY: string;
  ANTHROPIC_API_KEY?: string;
  GOOGLE_API_KEY?: string;
  ENCRYPTION_MASTER_KEY?: string;
  
  // Variables
  ENVIRONMENT: string;
  LOG_LEVEL: string;
  CORS_ORIGIN: string;
}

/**
 * Convert Workers Request to Node.js-like request object
 */
async function convertRequest(request: Request): Promise<any> {
  const url = new URL(request.url);
  
  return {
    method: request.method,
    url: url.pathname + url.search,
    headers: Object.fromEntries(request.headers.entries()),
    body: ['POST', 'PUT', 'PATCH'].includes(request.method) 
      ? await request.text() 
      : undefined,
  };
}

/**
 * Convert Express response to Workers Response
 */
function convertResponse(mockRes: any): Response {
  const headers = new Headers(mockRes.headers || {});
  
  return new Response(mockRes.body, {
    status: mockRes.statusCode || 200,
    headers,
  });
}

/**
 * Main Cloudflare Workers fetch handler
 */
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    try {
      // Set environment variables from bindings
      process.env.DATABASE_URL = env.DATABASE_URL;
      process.env.JWT_SECRET = env.JWT_SECRET;
      process.env.JWT_REFRESH_SECRET = env.JWT_REFRESH_SECRET;
      process.env.OPENAI_API_KEY = env.OPENAI_API_KEY;
      process.env.ANTHROPIC_API_KEY = env.ANTHROPIC_API_KEY || '';
      process.env.GOOGLE_API_KEY = env.GOOGLE_API_KEY || '';
      process.env.ENCRYPTION_MASTER_KEY = env.ENCRYPTION_MASTER_KEY || '';
      process.env.NODE_ENV = env.ENVIRONMENT;
      process.env.LOG_LEVEL = env.LOG_LEVEL;
      process.env.CORS_ORIGIN = env.CORS_ORIGIN;
      
      // Handle CORS preflight
      if (request.method === 'OPTIONS') {
        return new Response(null, {
          status: 204,
          headers: {
            'Access-Control-Allow-Origin': env.CORS_ORIGIN,
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Max-Age': '86400',
          },
        });
      }
      
      // Create mock req/res objects for Express
      const mockReq = await convertRequest(request);
      const mockRes: any = {
        statusCode: 200,
        headers: {},
        body: '',
        setHeader(name: string, value: string) {
          this.headers[name] = value;
          return this;
        },
        status(code: number) {
          this.statusCode = code;
          return this;
        },
        json(data: any) {
          this.body = JSON.stringify(data);
          this.headers['Content-Type'] = 'application/json';
          return this;
        },
        send(data: any) {
          this.body = typeof data === 'string' ? data : JSON.stringify(data);
          return this;
        },
        end(data?: any) {
          if (data) this.body = data;
          return this;
        },
      };
      
      // Process request through Express app
      await new Promise((resolve, reject) => {
        app(mockReq, mockRes, (err: any) => {
          if (err) reject(err);
          else resolve(mockRes);
        });
      });
      
      // Convert Express response to Workers Response
      const response = convertResponse(mockRes);
      
      // Add CORS headers
      const headers = new Headers(response.headers);
      headers.set('Access-Control-Allow-Origin', env.CORS_ORIGIN);
      headers.set('Access-Control-Allow-Credentials', 'true');
      
      return new Response(response.body, {
        status: response.status,
        headers,
      });
      
    } catch (error: any) {
      console.error('Worker error:', error);
      
      return new Response(
        JSON.stringify({
          error: 'Internal Server Error',
          message: error.message || 'An unexpected error occurred',
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': env.CORS_ORIGIN,
          },
        }
      );
    }
  },
};

/**
 * Durable Object for WebSocket connections
 */
export class WebSocketDurableObject {
  state: DurableObjectState;
  sessions: Set<WebSocket>;
  
  constructor(state: DurableObjectState) {
    this.state = state;
    this.sessions = new Set();
  }
  
  async fetch(request: Request): Promise<Response> {
    // Handle WebSocket upgrade
    const upgradeHeader = request.headers.get('Upgrade');
    if (upgradeHeader !== 'websocket') {
      return new Response('Expected WebSocket', { status: 400 });
    }
    
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    
    this.handleSession(server);
    
    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }
  
  handleSession(websocket: WebSocket) {
    websocket.accept();
    this.sessions.add(websocket);
    
    websocket.addEventListener('message', (event) => {
      // Broadcast to all connected clients
      const message = event.data;
      this.sessions.forEach((session) => {
        try {
          if (session.readyState === 1) {
            session.send(message);
          }
        } catch (err) {
          console.error('Error broadcasting message:', err);
        }
      });
    });
    
    websocket.addEventListener('close', () => {
      this.sessions.delete(websocket);
    });
    
    websocket.addEventListener('error', (event) => {
      console.error('WebSocket error:', event);
      this.sessions.delete(websocket);
    });
  }
}
