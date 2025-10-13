import { renderHook, act } from '@testing-library/react';
import { useWebSocket, useSocketEvent } from '@/hooks/useWebSocket';
import { io, Socket } from 'socket.io-client';

// Mock socket.io-client
jest.mock('socket.io-client');

const mockSocket = {
  on: jest.fn(),
  off: jest.fn(),
  emit: jest.fn(),
  disconnect: jest.fn(),
  connected: false,
};

const mockedIo = io as jest.MockedFunction<typeof io>;
mockedIo.mockReturnValue(mockSocket as any);

describe('WebSocket Hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useWebSocket', () => {
    it('should connect to WebSocket on mount', () => {
      const { result } = renderHook(() => useWebSocket());

      expect(mockedIo).toHaveBeenCalled();
      expect(result.current.state.isConnected).toBe(false);
    });

    it('should handle connection events', () => {
      const { result } = renderHook(() => useWebSocket());

      // Simulate connection
      const connectCallback = mockSocket.on.mock.calls.find(
        call => call[0] === 'connect'
      )?.[1];
      
      act(() => {
        connectCallback?.();
      });

      expect(result.current.state.isConnected).toBe(true);
      expect(result.current.state.error).toBe(null);
    });

    it('should handle disconnection', () => {
      const { result } = renderHook(() => useWebSocket());

      // Connect first
      const connectCallback = mockSocket.on.mock.calls.find(
        call => call[0] === 'connect'
      )?.[1];
      
      act(() => {
        connectCallback?.();
      });

      // Then disconnect
      const disconnectCallback = mockSocket.on.mock.calls.find(
        call => call[0] === 'disconnect'
      )?.[1];
      
      act(() => {
        disconnectCallback?.();
      });

      expect(result.current.state.isConnected).toBe(false);
    });

    it('should emit events', () => {
      const { result } = renderHook(() => useWebSocket());

      act(() => {
        result.current.emit('test-event', { data: 'test' });
      });

      expect(mockSocket.emit).toHaveBeenCalledWith('test-event', { data: 'test' });
    });

    it('should register event listeners', () => {
      const { result } = renderHook(() => useWebSocket());
      const testCallback = jest.fn();

      act(() => {
        result.current.on('test-event', testCallback);
      });

      expect(mockSocket.on).toHaveBeenCalledWith('test-event', testCallback);
    });

    it('should unregister event listeners', () => {
      const { result } = renderHook(() => useWebSocket());
      const testCallback = jest.fn();

      act(() => {
        result.current.on('test-event', testCallback);
        result.current.off('test-event', testCallback);
      });

      expect(mockSocket.off).toHaveBeenCalledWith('test-event', testCallback);
    });

    it('should handle connection errors', () => {
      const { result } = renderHook(() => useWebSocket());

      const errorCallback = mockSocket.on.mock.calls.find(
        call => call[0] === 'connect_error'
      )?.[1];
      
      act(() => {
        errorCallback?.(new Error('Connection failed'));
      });

      expect(result.current.state.error).toBe('Connection failed');
    });

    it('should reconnect on connection error', () => {
      const { result } = renderHook(() => useWebSocket({ reconnect: true }));

      const errorCallback = mockSocket.on.mock.calls.find(
        call => call[0] === 'connect_error'
      )?.[1];
      
      act(() => {
        errorCallback?.(new Error('Connection failed'));
      });

      // Should attempt reconnection
      expect(result.current.state.reconnectAttempts).toBe(1);
    });
  });

  describe('useSocketEvent', () => {
    it('should subscribe to specific events', () => {
      const callback = jest.fn();
      renderHook(() => useSocketEvent('agent:update', callback));

      expect(mockSocket.on).toHaveBeenCalledWith('agent:update', callback);
    });

    it('should unsubscribe on unmount', () => {
      const callback = jest.fn();
      const { unmount } = renderHook(() => useSocketEvent('agent:update', callback));

      unmount();

      expect(mockSocket.off).toHaveBeenCalledWith('agent:update', callback);
    });
  });
});