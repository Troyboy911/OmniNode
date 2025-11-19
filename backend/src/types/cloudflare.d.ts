/**
 * Cloudflare Workers type definitions
 */

declare global {
  interface KVNamespace {
    get(key: string, options?: { type: 'text' }): Promise<string | null>;
    get(key: string, options: { type: 'json' }): Promise<any>;
    get(key: string, options: { type: 'arrayBuffer' }): Promise<ArrayBuffer | null>;
    get(key: string, options: { type: 'stream' }): Promise<ReadableStream | null>;
    put(key: string, value: string | ArrayBuffer | ReadableStream, options?: {
      expiration?: number;
      expirationTtl?: number;
      metadata?: any;
    }): Promise<void>;
    delete(key: string): Promise<void>;
    list(options?: { prefix?: string; limit?: number; cursor?: string }): Promise<{
      keys: Array<{ name: string; expiration?: number; metadata?: any }>;
      list_complete: boolean;
      cursor?: string;
    }>;
  }

  interface R2Bucket {
    get(key: string): Promise<R2Object | null>;
    put(key: string, value: ReadableStream | ArrayBuffer | string, options?: {
      httpMetadata?: any;
      customMetadata?: Record<string, string>;
    }): Promise<R2Object>;
    delete(key: string): Promise<void>;
    list(options?: { prefix?: string; limit?: number; cursor?: string }): Promise<{
      objects: R2Object[];
      truncated: boolean;
      cursor?: string;
    }>;
  }

  interface R2Object {
    key: string;
    size: number;
    uploaded: Date;
    httpEtag: string;
    body: ReadableStream;
    arrayBuffer(): Promise<ArrayBuffer>;
    text(): Promise<string>;
    json(): Promise<any>;
  }

  interface DurableObjectNamespace {
    get(id: DurableObjectId): DurableObjectStub;
    idFromName(name: string): DurableObjectId;
    idFromString(id: string): DurableObjectId;
    newUniqueId(): DurableObjectId;
  }

  interface DurableObjectId {
    toString(): string;
    equals(other: DurableObjectId): boolean;
  }

  interface DurableObjectStub {
    fetch(request: Request): Promise<Response>;
    id: DurableObjectId;
  }

  interface DurableObjectState {
    id: DurableObjectId;
    storage: DurableObjectStorage;
    waitUntil(promise: Promise<any>): void;
  }

  interface DurableObjectStorage {
    get<T = any>(key: string): Promise<T | undefined>;
    get<T = any>(keys: string[]): Promise<Map<string, T>>;
    put<T = any>(key: string, value: T): Promise<void>;
    put<T = any>(entries: Record<string, T>): Promise<void>;
    delete(key: string): Promise<boolean>;
    delete(keys: string[]): Promise<number>;
    list<T = any>(options?: { start?: string; end?: string; prefix?: string; reverse?: boolean; limit?: number }): Promise<Map<string, T>>;
    deleteAll(): Promise<void>;
  }

  interface ExecutionContext {
    waitUntil(promise: Promise<any>): void;
    passThroughOnException(): void;
  }

  interface WebSocketPair {
    0: WebSocket;
    1: WebSocket;
  }

  interface WebSocket {
    accept(): void;
    send(message: string | ArrayBuffer): void;
    close(code?: number, reason?: string): void;
    addEventListener(event: 'message', handler: (event: MessageEvent) => void): void;
    addEventListener(event: 'close', handler: (event: CloseEvent) => void): void;
    addEventListener(event: 'error', handler: (event: ErrorEvent) => void): void;
    readyState: number;
  }

  const WebSocketPair: {
    new (): WebSocketPair;
  };
}

export {};
