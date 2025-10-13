import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/contexts/AuthContext';

interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: string;
}

interface UseWebSocketOptions {
  autoConnect?: boolean;
  reconnect?: boolean;
  maxReconnectAttempts?: number;
}

export const useWebSocket = (options: UseWebSocketOptions = {}) => {
  const { autoConnect = true, reconnect = true, maxReconnectAttempts = 5 } = options;
  const { user, token } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [messages, setMessages] = useState<WebSocketMessage[]>([]);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!token || !autoConnect) return;

    const newSocket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000', {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: reconnect,
      reconnectionAttempts: maxReconnectAttempts,
      reconnectionDelay: 1000,
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      setIsConnected(true);
      setReconnectAttempts(0);
      console.log('✅ WebSocket connected');
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      console.log('❌ WebSocket disconnected');
    });

    newSocket.on('reconnect_attempt', (attempt) => {
      setReconnectAttempts(attempt);
      console.log(`🔄 Reconnect attempt ${attempt}`);
    });

    newSocket.on('reconnect_failed', () => {
      console.log('❌ Reconnect failed');
    });

    // Handle incoming messages
    newSocket.on('ai:chat:stream', (data) => {
      setMessages(prev => [...prev, { type: 'ai:chat:stream', data, timestamp: new Date().toISOString() }]);
    });

    newSocket.on('file:upload:progress', (data) => {
      setMessages(prev => [...prev, { type: 'file:upload:progress', data, timestamp: new Date().toISOString() }]);
    });

    newSocket.on('agent:status:update', (data) => {
      setMessages(prev => [...prev, { type: 'agent:status:update', data, timestamp: new Date().toISOString() }]);
    });

    newSocket.on('system:notification', (data) => {
      setMessages(prev => [...prev, { type: 'system:notification', data, timestamp: new Date().toISOString() }]);
    });

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      newSocket.disconnect();
    };
  }, [token, autoConnect, reconnect, maxReconnectAttempts]);

  const emit = (event: string, data: any) => {
    if (socket && isConnected) {
      socket.emit(event, data);
    }
  };

  const subscribe = (event: string, callback: (data: any) => void) => {
    if (socket) {
      socket.on(event, callback);
    }
  };

  const unsubscribe = (event: string, callback?: (data: any) => void) => {
    if (socket) {
      socket.off(event, callback);
    }
  };

  const joinRoom = (roomId: string) => {
    emit('user:join:room', roomId);
  };

  const leaveRoom = (roomId: string) => {
    emit('user:leave:room', roomId);
  };

  const subscribeToAgent = (agentId: string) => {
    emit('agent:subscribe', agentId);
  };

  const unsubscribeFromAgent = (agentId: string) => {
    emit('agent:unsubscribe', agentId);
  };

  return {
    socket,
    isConnected,
    messages,
    emit,
    subscribe,
    unsubscribe,
    joinRoom,
    leaveRoom,
    subscribeToAgent,
    unsubscribeFromAgent,
  };
};

// WebSocket context for global state
import { createContext, useContext } from 'react';

const WebSocketContext = createContext<ReturnType<typeof useWebSocket> | null>(null);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const webSocket = useWebSocket();
  
  return (
    <WebSocketContext.Provider value={webSocket}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocketContext = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocketContext must be used within a WebSocketProvider');
  }
  return context;
};