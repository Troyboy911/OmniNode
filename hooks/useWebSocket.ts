'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { apiClient } from '@/lib/api-client';

interface UseWebSocketOptions {
  autoConnect?: boolean;
  reconnect?: boolean;
  maxReconnectAttempts?: number;
}

interface WebSocketState {
  isConnected: boolean;
  error: string | null;
  reconnectAttempts: number;
}

interface UseWebSocketReturn {
  socket: Socket | null;
  state: WebSocketState;
  connect: () => void;
  disconnect: () => void;
  reconnect: () => void;
  on: (event: string, callback: (...args: any[]) => void) => void;
  off: (event: string, callback: (...args: any[]) => void) => void;
  emit: (event: string, ...args: any[]) => void;
}

export function useWebSocket(options: UseWebSocketOptions = {}): UseWebSocketReturn {
  const {
    autoConnect = true,
    reconnect = true,
    maxReconnectAttempts = 5,
  } = options;

  const [state, setState] = useState<WebSocketState>({
    isConnected: false,
    error: null,
    reconnectAttempts: 0,
  });

  const socketRef = useRef<Socket | null>(null);
  const listenersRef = useRef<Map<string, Set<(...args: any[]) => void>>>(new Map());

  const updateState = useCallback((updates: Partial<WebSocketState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const connect = useCallback(() => {
    try {
      if (socketRef.current?.connected) {
        return;
      }

      const socket = apiClient.connectSocket();
      socketRef.current = socket;

      // Connection events
      socket.on('connect', () => {
        updateState({ isConnected: true, error: null, reconnectAttempts: 0 });
      });

      socket.on('disconnect', () => {
        updateState({ isConnected: false });
      });

      socket.on('connect_error', (error) => {
        updateState({ error: error.message });
        
        if (reconnect && state.reconnectAttempts < maxReconnectAttempts) {
          setTimeout(() => {
            updateState({ reconnectAttempts: state.reconnectAttempts + 1 });
            connect();
          }, Math.min(1000 * Math.pow(2, state.reconnectAttempts), 30000));
        }
      });

      // Re-register all listeners
      listenersRef.current.forEach((callbacks, event) => {
        callbacks.forEach(callback => {
          socket.on(event, callback);
        });
      });

    } catch (error) {
      updateState({ error: error instanceof Error ? error.message : 'Connection failed' });
    }
  }, [reconnect, maxReconnectAttempts, state.reconnectAttempts, updateState]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      apiClient.disconnectSocket();
      socketRef.current = null;
      updateState({ isConnected: false, error: null });
    }
  }, [updateState]);

  const reconnect = useCallback(() => {
    disconnect();
    updateState({ reconnectAttempts: 0 });
    connect();
  }, [disconnect, connect, updateState]);

  const on = useCallback((event: string, callback: (...args: any[]) => void) => {
    if (!listenersRef.current.has(event)) {
      listenersRef.current.set(event, new Set());
    }
    listenersRef.current.get(event)!.add(callback);

    if (socketRef.current?.connected) {
      socketRef.current.on(event, callback);
    }
  }, []);

  const off = useCallback((event: string, callback: (...args: any[]) => void) => {
    const callbacks = listenersRef.current.get(event);
    if (callbacks) {
      callbacks.delete(callback);
      if (socketRef.current?.connected) {
        socketRef.current.off(event, callback);
      }
    }
  }, []);

  const emit = useCallback((event: string, ...args: any[]) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, ...args);
    }
  }, []);

  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  return {
    socket: socketRef.current,
    state,
    connect,
    disconnect,
    reconnect,
    on,
    off,
    emit,
  };
}

// Specialized hooks for specific events
export function useSocketEvent(event: string, callback: (...args: any[]) => void) {
  const { on, off } = useWebSocket();

  useEffect(() => {
    on(event, callback);
    return () => {
      off(event, callback);
    };
  }, [event, callback, on, off]);
}